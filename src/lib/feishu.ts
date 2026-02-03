import * as lark from '@larksuiteoapi/node-sdk';
import { getFeishuConfig, getAgents, getAgent, getDefaultAgent } from './config';
import { 
  getActiveConversation, 
  createConversation, 
  updateConversation, 
  closeUserConversations,
  saveMessage 
} from './db';
import { sendChatMessage } from './dify';
import { 
  buildAgentSelectCard, 
  buildWelcomeCard, 
  buildHelpCard, 
  buildNoAgentCard 
} from './cards';

let clientInstance: lark.Client | null = null;
let wsClientInstance: lark.WSClient | null = null;

// 获取飞书客户端（单例）
export function getFeishuClient(): lark.Client {
  const config = getFeishuConfig();
  
  if (!config.appId || !config.appSecret) {
    throw new Error('飞书配置不完整，请先在管理界面配置 App ID 和 App Secret');
  }

  if (!clientInstance) {
    clientInstance = new lark.Client({
      appId: config.appId,
      appSecret: config.appSecret,
      disableTokenCache: false,
    });
  }

  return clientInstance;
}

// 清除客户端缓存（配置更新时调用）
export function clearFeishuClient() {
  // 停止旧的 WebSocket 连接
  if (wsClientInstance) {
    // WSClient 没有 stop 方法，需要重启服务来重新连接
    console.log('飞书配置已更新，请重启服务以应用新配置');
  }
  clientInstance = null;
  wsClientInstance = null;
}

// 消息去重缓存（防止重复处理同一条消息）
const processedMessages = new Map<string, number>();
const MESSAGE_CACHE_TTL = 60000; // 1分钟

// 清理过期的消息缓存
function cleanupMessageCache() {
  const now = Date.now();
  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > MESSAGE_CACHE_TTL) {
      processedMessages.delete(id);
    }
  }
}

// 处理用户消息
async function handleUserMessage(data: {
  sender: { sender_id: { open_id: string }; sender_type?: string };
  message: { 
    message_id: string; 
    message_type: string; 
    content: string;
    chat_type: string;
    chat_id: string;
  };
}) {
  const messageId = data.message.message_id;
  const openId = data.sender.sender_id.open_id;
  const messageType = data.message.message_type;
  const chatType = data.message.chat_type;
  const client = getFeishuClient();
  
  // 消息去重：检查是否已处理过该消息
  if (processedMessages.has(messageId)) {
    console.log(`消息已处理，跳过: ${messageId}`);
    return;
  }
  processedMessages.set(messageId, Date.now());
  
  // 定期清理缓存
  if (processedMessages.size > 100) {
    cleanupMessageCache();
  }
  
  // 只处理单聊中的文本消息
  if (chatType !== 'p2p' || messageType !== 'text') {
    return;
  }

  // 解析消息内容
  let text = '';
  try {
    const content = JSON.parse(data.message.content);
    text = content.text?.trim() || '';
  } catch {
    console.error('Failed to parse message content');
    return;
  }

  if (!text) return;

  console.log(`收到消息: ${text} (来自 ${openId})`);

  // 发送 Markdown 消息（使用卡片渲染）
  const sendMarkdown = async (content: string) => {
    const card = {
      config: {
        wide_screen_mode: true,
      },
      elements: [
        {
          tag: 'markdown',
          content: content,
        },
      ],
    };
    await client.im.message.create({
      params: { receive_id_type: 'open_id' },
      data: {
        receive_id: openId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
    });
  };

  // 发送卡片消息的辅助函数
  const sendCard = async (card: object) => {
    await client.im.message.create({
      params: { receive_id_type: 'open_id' },
      data: {
        receive_id: openId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
    });
  };

  // 处理命令
  const lowerText = text.toLowerCase();
  
  if (lowerText === '/help' || text === '帮助') {
    await sendCard(buildHelpCard());
    return;
  }

  if (lowerText === '/agent' || text === '选择助手') {
    const agents = getAgents();
    if (agents.length === 0) {
      await sendCard(buildNoAgentCard());
    } else {
      await sendCard(buildAgentSelectCard(agents));
    }
    return;
  }

  // 处理数字选择智能体（1, 2, 3...）
  const numMatch = text.match(/^(\d+)$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const agents = getAgents();
    
    if (num >= 1 && num <= agents.length) {
      const selectedAgent = agents[num - 1];
      await closeUserConversations(openId);
      await createConversation({
        feishuUserId: openId,
        agentId: selectedAgent.id,
      });
      await sendCard(buildWelcomeCard(selectedAgent.name));
      return;
    }
  }

  if (lowerText === '/new' || text === '新对话') {
    await closeUserConversations(openId);
    
    const agents = getAgents();
    const defaultAgent = getDefaultAgent();
    
    if (agents.length === 0) {
      await sendCard(buildNoAgentCard());
    } else if (agents.length === 1 || defaultAgent) {
      const agent = defaultAgent || agents[0];
      await createConversation({
        feishuUserId: openId,
        agentId: agent.id,
      });
      await sendCard(buildWelcomeCard(agent.name));
    } else {
      await sendCard(buildAgentSelectCard(agents));
    }
    return;
  }

  // 普通对话消息
  try {
    let conversation = await getActiveConversation(openId);
    
    if (!conversation) {
      const agents = getAgents();
      const defaultAgent = getDefaultAgent();
      
      if (agents.length === 0) {
        await sendCard(buildNoAgentCard());
        return;
      }
      
      if (defaultAgent) {
        conversation = await createConversation({
          feishuUserId: openId,
          agentId: defaultAgent.id,
        });
      } else {
        await sendCard(buildAgentSelectCard(agents));
        return;
      }
    }

    const agent = getAgent(conversation.agentId);
    if (!agent) {
      await sendMarkdown('当前智能体配置已失效，请发送 /agent 重新选择');
      return;
    }

    await saveMessage({
      conversationId: conversation.id,
      role: 'user',
      content: text,
    });

    const response = await sendChatMessage({
      query: text,
      userId: openId,
      conversationId: conversation.difyConversationId || undefined,
      agent,
    });

    if (response.conversation_id && !conversation.difyConversationId) {
      await updateConversation(conversation.id, {
        difyConversationId: response.conversation_id,
        lastActiveAt: new Date(),
      });
    } else {
      await updateConversation(conversation.id, {
        lastActiveAt: new Date(),
      });
    }

    await saveMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: response.answer,
    });

    await sendMarkdown(response.answer);
    
  } catch (error) {
    console.error('Error handling message:', error);
    const errorMessage = error instanceof Error ? error.message : '处理消息时出错';
    await sendMarkdown(`❌ ${errorMessage}`);
  }
}


// 启动 WebSocket 长连接
export function startFeishuWebSocket(): lark.WSClient | null {
  const config = getFeishuConfig();
  
  if (!config.appId || !config.appSecret) {
    console.log('飞书配置不完整，跳过 WebSocket 连接');
    return null;
  }

  if (wsClientInstance) {
    console.log('WebSocket 已经在运行中');
    return wsClientInstance;
  }

  console.log('正在启动飞书 WebSocket 长连接...');

  const baseConfig = {
    appId: config.appId,
    appSecret: config.appSecret,
  };

  // 创建 API 客户端
  clientInstance = new lark.Client(baseConfig);

  // 创建 WebSocket 客户端
  wsClientInstance = new lark.WSClient({
    ...baseConfig,
    loggerLevel: lark.LoggerLevel.info,
  });

  // 启动长连接（注意：WebSocket 模式不支持卡片交互回调，卡片交互需要配置 Webhook）
  wsClientInstance.start({
    eventDispatcher: new lark.EventDispatcher({}).register({
      'im.message.receive_v1': async (data) => {
        try {
          await handleUserMessage(data as Parameters<typeof handleUserMessage>[0]);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      },
    }),
  });

  console.log('飞书 WebSocket 长连接已启动');
  return wsClientInstance;
}

// 获取 WebSocket 状态
export function getWebSocketStatus(): { connected: boolean; message: string } {
  const config = getFeishuConfig();
  
  if (!config.appId || !config.appSecret) {
    return { connected: false, message: '未配置飞书应用凭证' };
  }
  
  if (wsClientInstance) {
    return { connected: true, message: '已连接' };
  }
  
  return { connected: false, message: '未启动' };
}

// 测试飞书连接
export async function testFeishuConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = getFeishuConfig();
    
    if (!config.appId || !config.appSecret) {
      return { success: false, message: '请填写 App ID 和 App Secret' };
    }

    const testClient = new lark.Client({
      appId: config.appId,
      appSecret: config.appSecret,
    });
    
    const response = await testClient.auth.tenantAccessToken.internal({
      data: {
        app_id: config.appId,
        app_secret: config.appSecret,
      },
    });
    
    if (response.code === 0) {
      return { success: true, message: '连接成功！凭证有效' };
    } else {
      return { success: false, message: response.msg || '连接失败' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '连接失败' 
    };
  }
}
