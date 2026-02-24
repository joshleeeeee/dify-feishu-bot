// Dify 智能体自动同步服务
// 定期从 Dify Console API 同步对话类应用到本地配置

import { getConfig, saveConfig, AgentConfig } from './config';

const SYNC_INTERVAL = 60 * 1000; // 每 60 秒同步一次

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;
let lastSyncTime: Date | null = null;
let lastSyncResult: string = '未同步';

interface DifyApiKey {
  id: string;
  type: string;
  token: string;
  last_used_at: number | null;
  created_at: number;
}

// 登录 Dify 获取认证信息
async function loginDify(consoleBase: string, email: string, password: string) {
  const encodedPassword = Buffer.from(password).toString('base64');
  
  let res = await fetch(`${consoleBase}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: encodedPassword }),
  });

  // 兼容老版本 Dify（不要求 base64 编码密码的情况）
  if (!res.ok && res.status === 401) {
    const errorText = await res.text();
    if (!errorText.includes('Invalid encrypted data')) {
      const fallbackRes = await fetch(`${consoleBase}/console/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (fallbackRes.ok) {
        res = fallbackRes;
      } else {
        throw new Error(`Dify 登录失败: ${fallbackRes.status}`);
      }
    } else {
      throw new Error(`Dify 登录失败: ${res.status}`);
    }
  } else if (!res.ok) {
    throw new Error(`Dify 登录失败: ${res.status}`);
  }

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

  return { accessToken, csrfToken };
}

// 调用 Dify Console API
async function difyRequest(
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
    throw new Error(`Dify API 调用失败 (${path}): ${res.status}`);
  }

  return res.json();
}

// 执行一次同步
export async function performSync(): Promise<{ success: boolean; message: string }> {
  if (isSyncing) {
    return { success: false, message: '同步正在进行中' };
  }

  const config = getConfig();
  const { baseUrl, consoleEmail, consolePassword } = config.dify;

  if (!baseUrl || !consoleEmail || !consolePassword) {
    return { success: false, message: '缺少 Dify 配置或登录凭据' };
  }

  isSyncing = true;
  try {
    const consoleBase = baseUrl.replace(/\/v1$/, '').replace(/\/api$/, '');

    // 1. 登录
    const { accessToken, csrfToken } = await loginDify(consoleBase, consoleEmail, consolePassword);

    // 2. 获取所有应用
    const appsData = await difyRequest(consoleBase, '/apps?page=1&limit=100', accessToken, csrfToken);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allApps: any[] = appsData.data || [];

    // 3. 只同步 chat 和 agent-chat 类型
    const chatApps = allApps.filter(
      (app) => app.mode === 'chat' || app.mode === 'agent-chat'
    );

    // 4. 获取每个应用的 API Key
    const existingAgentsMap = new Map(
      config.agents.map((a) => [a.difyAppToken, a])
    );

    // 也按 dify app id 建立索引，便于匹配已同步过的应用
    const existingByDifyId = new Map(
      config.agents.map((a) => [a.id, a])
    );

    const syncedAgents: AgentConfig[] = [];
    let newCount = 0;

    for (const app of chatApps) {
      // 获取 API keys
      let keysData = await difyRequest(consoleBase, `/apps/${app.id}/api-keys`, accessToken, csrfToken);
      let apiKeys: DifyApiKey[] = keysData.data || [];

      // 如果没有 API Key，自动创建一个
      if (apiKeys.length === 0) {
        const newKey = await difyRequest(consoleBase, `/apps/${app.id}/api-keys`, accessToken, csrfToken, 'POST');
        apiKeys = [newKey];
      }

      const token = apiKeys[0].token;
      const existingAgent = existingAgentsMap.get(token) || existingByDifyId.get(app.id);

      if (!existingAgent) {
        newCount++;
      }

      syncedAgents.push({
        id: existingAgent?.id || app.id,
        name: app.name,
        description: (app.description || app.model_config?.pre_prompt || '').slice(0, 200),
        difyAppToken: token,
        isDefault: existingAgent?.isDefault || false,
      });
    }

    // 5. 确保至少有一个默认智能体
    if (syncedAgents.length > 0 && !syncedAgents.some((a) => a.isDefault)) {
      syncedAgents[0].isDefault = true;
    }

    // 6. 保存
    config.agents = syncedAgents;
    saveConfig(config);

    lastSyncTime = new Date();
    const message = newCount > 0
      ? `同步完成: ${syncedAgents.length} 个智能体（新增 ${newCount} 个）`
      : `同步完成: ${syncedAgents.length} 个智能体（无变化）`;
    lastSyncResult = message;

    if (newCount > 0) {
      console.log(`[Dify 自动同步] ${message}`);
    }

    return { success: true, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : '同步失败';
    lastSyncResult = `❌ ${message}`;
    console.error(`[Dify 自动同步] 失败:`, message);
    return { success: false, message };
  } finally {
    isSyncing = false;
  }
}

// 启动自动同步
export function startAutoSync() {
  if (syncTimer) {
    console.log('[Dify 自动同步] 已在运行中');
    return;
  }

  const config = getConfig();
  if (!config.dify.consoleEmail || !config.dify.consolePassword) {
    console.log('[Dify 自动同步] 未配置 Dify 登录凭据，跳过自动同步');
    return;
  }

  console.log(`[Dify 自动同步] 已启动，每 ${SYNC_INTERVAL / 1000} 秒同步一次`);

  // 首次立即同步
  performSync();

  // 定时同步
  syncTimer = setInterval(() => {
    performSync();
  }, SYNC_INTERVAL);
}

// 停止自动同步
export function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[Dify 自动同步] 已停止');
  }
}

// 重启自动同步（配置更新后调用）
export function restartAutoSync() {
  stopAutoSync();
  startAutoSync();
}

// 获取同步状态
export function getSyncStatus() {
  return {
    running: syncTimer !== null,
    syncing: isSyncing,
    lastSyncTime: lastSyncTime?.toISOString() || null,
    lastSyncResult,
  };
}

