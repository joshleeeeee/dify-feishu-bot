import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/auth';
import { getStats, getRecentConversations, getConversationById } from '@/lib/db';

// 获取统计数据或会话列表
export async function GET(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  try {
    if (type === 'stats') {
      const stats = await getStats();
      return NextResponse.json(stats);
    }

    if (id) {
      const conversation = await getConversationById(id);
      if (!conversation) {
        return NextResponse.json({ error: '会话不存在' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    // 默认返回最近会话列表
    const limit = parseInt(searchParams.get('limit') || '50');
    const conversations = await getRecentConversations(limit);
    return NextResponse.json(conversations);
    
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '获取数据失败' 
    }, { status: 500 });
  }
}
