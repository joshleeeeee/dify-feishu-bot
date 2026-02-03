import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 会话相关操作
export async function getActiveConversation(feishuUserId: string) {
  return prisma.conversation.findFirst({
    where: {
      feishuUserId,
      status: 'active',
    },
    orderBy: {
      lastActiveAt: 'desc',
    },
  });
}

export async function createConversation(data: {
  feishuUserId: string;
  feishuUserName?: string;
  agentId: string;
}) {
  return prisma.conversation.create({
    data: {
      feishuUserId: data.feishuUserId,
      feishuUserName: data.feishuUserName,
      agentId: data.agentId,
      status: 'active',
    },
  });
}

export async function updateConversation(id: string, data: {
  difyConversationId?: string;
  lastActiveAt?: Date;
  status?: string;
}) {
  return prisma.conversation.update({
    where: { id },
    data,
  });
}

export async function closeUserConversations(feishuUserId: string) {
  return prisma.conversation.updateMany({
    where: {
      feishuUserId,
      status: 'active',
    },
    data: {
      status: 'closed',
    },
  });
}

// 消息相关操作
export async function saveMessage(data: {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
}) {
  return prisma.message.create({
    data,
  });
}

export async function getConversationMessages(conversationId: string, limit = 50) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

// 统计相关
export async function getStats() {
  const [totalConversations, activeConversations, totalMessages] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.count({ where: { status: 'active' } }),
    prisma.message.count(),
  ]);

  return {
    totalConversations,
    activeConversations,
    totalMessages,
  };
}

// 获取最近会话列表
export async function getRecentConversations(limit = 50) {
  return prisma.conversation.findMany({
    orderBy: { lastActiveAt: 'desc' },
    take: limit,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
}

export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}
