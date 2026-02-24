import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { getConfig, saveConfig, AgentConfig } from '@/lib/config';
import { restartAutoSync, getSyncStatus } from '@/lib/dify-sync';

interface DifyApp {
  id: string;
  name: string;
  description: string;
  mode: string;  // chat, completion, agent-chat, workflow
  model_config: {
    pre_prompt: string;
  } | null;
}

interface DifyApiKey {
  id: string;
  type: string;
  token: string;
  last_used_at: number | null;
  created_at: number;
}

// 登录 Dify 获取认证信息
async function loginDify(difyBaseUrl: string, email: string, password: string) {
  // difyBaseUrl 是类似 http://localhost/v1 的应用 API 地址
  // Console API 在根域名的 /console/api 下
  const consoleBase = difyBaseUrl.replace(/\/v1$/, '').replace(/\/api$/, '');
  
  const res = await fetch(`${consoleBase}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Dify 登录失败: ${res.status} - ${error}`);
  }

  // 从 Set-Cookie 头中提取 token
  const cookies = res.headers.getSetCookie?.() || [];
  let accessToken = '';
  let csrfToken = '';

  for (const cookie of cookies) {
    if (cookie.startsWith('access_token=')) {
      accessToken = cookie.split(';')[0].replace('access_token=', '');
    }
    if (cookie.startsWith('csrf_token=')) {
      csrfToken = cookie.split(';')[0].replace('csrf_token=', '');
    }
  }

  if (!accessToken || !csrfToken) {
    throw new Error('无法从 Dify 获取认证 Token');
  }

  return { accessToken, csrfToken, consoleBase };
}

// 调用 Dify Console API
async function difyConsoleRequest(
  consoleBase: string,
  path: string,
  accessToken: string,
  csrfToken: string,
  method: string = 'GET'
) {
  const res = await fetch(`${consoleBase}/console/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `access_token=${accessToken};csrf_token=${csrfToken}`,
      'X-Csrf-Token': csrfToken,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Dify API 调用失败 (${path}): ${res.status} - ${error}`);
  }

  return res.json();
}

// 获取同步状态
export async function GET(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const config = getConfig();
  
  return NextResponse.json({
    ...getSyncStatus(),
    consoleEmail: config.dify.consoleEmail || '',
    consolePassword: config.dify.consolePassword || '',
  });
}

// 同步 Dify 应用到本地
export async function POST(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '请提供 Dify 登录邮箱和密码' },
        { status: 400 }
      );
    }

    const config = getConfig();
    if (!config.dify.baseUrl) {
      return NextResponse.json(
        { error: '请先配置 Dify Base URL' },
        { status: 400 }
      );
    }

    // 1. 登录 Dify
    const { accessToken, csrfToken, consoleBase } = await loginDify(
      config.dify.baseUrl,
      email,
      password
    );

    // 2. 获取所有应用
    const appsData = await difyConsoleRequest(
      consoleBase,
      '/apps?page=1&limit=100',
      accessToken,
      csrfToken
    );

    const difyApps: DifyApp[] = appsData.data || [];

    // 3. 只同步 chat 和 agent-chat 类型（能对话的应用）
    const chatApps = difyApps.filter(
      (app) => app.mode === 'chat' || app.mode === 'agent-chat'
    );

    // 4. 获取每个应用的 API Key，如果没有则自动创建
    const syncedAgents: AgentConfig[] = [];
    const existingAgentsMap = new Map(
      config.agents.map((a) => [a.difyAppToken, a])
    );

    for (const app of chatApps) {
      // 获取 API keys
      let keysData = await difyConsoleRequest(
        consoleBase,
        `/apps/${app.id}/api-keys`,
        accessToken,
        csrfToken
      );

      let apiKeys: DifyApiKey[] = keysData.data || [];

      // 如果没有 API Key，自动创建一个
      if (apiKeys.length === 0) {
        const newKey = await difyConsoleRequest(
          consoleBase,
          `/apps/${app.id}/api-keys`,
          accessToken,
          csrfToken,
          'POST'
        );
        apiKeys = [newKey];
      }

      const token = apiKeys[0].token;

      // 查找现有配置（通过 token 匹配）
      const existingAgent = existingAgentsMap.get(token);

      syncedAgents.push({
        id: existingAgent?.id || app.id, // 保留原 ID 或使用 Dify App ID
        name: app.name,
        description: (app.model_config?.pre_prompt || app.description || '').slice(0, 200),
        difyAppToken: token,
        isDefault: existingAgent?.isDefault || false,
      });
    }

    // 5. 确保至少有一个默认智能体
    if (syncedAgents.length > 0 && !syncedAgents.some((a) => a.isDefault)) {
      syncedAgents[0].isDefault = true;
    }

    // 6. 保存到配置（包含登录凭据，用于自动同步）
    config.agents = syncedAgents;
    config.dify.consoleEmail = email;
    config.dify.consolePassword = password;
    saveConfig(config);

    // 7. 启动/重启自动同步
    restartAutoSync();

    return NextResponse.json({
      success: true,
      message: `成功同步 ${syncedAgents.length} 个智能体（共发现 ${difyApps.length} 个应用，其中 ${chatApps.length} 个为对话类型）。已开启自动同步（每分钟）`,
      agents: syncedAgents,
      skipped: difyApps.length - chatApps.length,
      autoSync: true,
    });
  } catch (error) {
    console.error('Sync agents error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : '同步失败，请检查 Dify 连接',
      },
      { status: 500 }
    );
  }
}
