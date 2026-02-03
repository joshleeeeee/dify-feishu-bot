import { getDifyConfig, getAgent, AgentConfig } from './config';

interface ChatResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
}

interface DifyError {
  code: string;
  message: string;
}

// 发送聊天消息到 Dify
export async function sendChatMessage(params: {
  query: string;
  userId: string;
  conversationId?: string;
  agent?: AgentConfig;
}): Promise<ChatResponse> {
  const difyConfig = getDifyConfig();
  const agent = params.agent;
  
  // 使用智能体的 token, 如果没有则使用默认的
  const apiKey = agent?.difyAppToken || difyConfig.apiKey;
  
  if (!difyConfig.baseUrl || !apiKey) {
    throw new Error('Dify 配置不完整，请先在管理界面配置');
  }

  const url = `${difyConfig.baseUrl}/chat-messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: params.query,
      response_mode: 'blocking', // 使用阻塞模式，简化处理
      user: params.userId,
      conversation_id: params.conversationId || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as DifyError;
    throw new Error(error.message || `Dify API 错误: ${response.status}`);
  }

  const data = await response.json() as ChatResponse;
  return data;
}

// 流式发送消息（用于长响应）
export async function* sendChatMessageStream(params: {
  query: string;
  userId: string;
  conversationId?: string;
  agent?: AgentConfig;
}): AsyncGenerator<{ event: string; data: string }> {
  const difyConfig = getDifyConfig();
  const agent = params.agent;
  const apiKey = agent?.difyAppToken || difyConfig.apiKey;
  
  if (!difyConfig.baseUrl || !apiKey) {
    throw new Error('Dify 配置不完整');
  }

  const url = `${difyConfig.baseUrl}/chat-messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: params.query,
      response_mode: 'streaming',
      user: params.userId,
      conversation_id: params.conversationId || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as DifyError;
    throw new Error(error.message || `Dify API 错误: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          yield { event: parsed.event, data: parsed.answer || '' };
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

// 获取会话历史
export async function getConversationHistory(params: {
  conversationId: string;
  userId: string;
  apiKey?: string;
}) {
  const difyConfig = getDifyConfig();
  const apiKey = params.apiKey || difyConfig.apiKey;
  
  const url = `${difyConfig.baseUrl}/messages?conversation_id=${params.conversationId}&user=${params.userId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`获取历史失败: ${response.status}`);
  }

  return response.json();
}

// 测试 Dify 连接
export async function testDifyConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const difyConfig = getDifyConfig();
    
    if (!difyConfig.baseUrl || !difyConfig.apiKey) {
      return { success: false, message: '请填写 Base URL 和 API Key' };
    }

    // 尝试调用参数 API 来验证连接
    const url = `${difyConfig.baseUrl}/parameters?user=test`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${difyConfig.apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: '连接成功' };
    } else {
      const error = await response.json() as DifyError;
      return { success: false, message: error.message || `连接失败: ${response.status}` };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '连接失败' 
    };
  }
}
