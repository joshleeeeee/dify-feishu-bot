import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/auth';
import { 
  getFeishuConfig, 
  saveFeishuConfig, 
  getDifyConfig, 
  saveDifyConfig 
} from '@/lib/config';
import { testFeishuConnection, clearFeishuClient, startFeishuWebSocket, getWebSocketStatus } from '@/lib/feishu';
import { testDifyConnection } from '@/lib/dify';

// 获取所有配置
export async function GET(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // 获取 WebSocket 状态
  if (type === 'status') {
    return NextResponse.json({
      feishu: getWebSocketStatus(),
    });
  }

  return NextResponse.json({
    feishu: getFeishuConfig(),
    dify: getDifyConfig(),
  });
}

// 更新配置
export async function POST(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, config, action } = body;

    // 测试连接
    if (action === 'test') {
      if (type === 'feishu') {
        const result = await testFeishuConnection();
        return NextResponse.json(result);
      } else if (type === 'dify') {
        const result = await testDifyConnection();
        return NextResponse.json(result);
      }
    }

    // 启动飞书连接
    if (action === 'connect' && type === 'feishu') {
      startFeishuWebSocket();
      return NextResponse.json({ success: true, message: '正在连接...' });
    }

    // 保存配置
    if (type === 'feishu' && config) {
      saveFeishuConfig(config);
      clearFeishuClient(); // 清除缓存的客户端
      return NextResponse.json({ 
        success: true, 
        message: '飞书配置已保存。请点击"启动连接"来建立长连接。' 
      });
    }

    if (type === 'dify' && config) {
      saveDifyConfig(config);
      return NextResponse.json({ success: true, message: 'Dify 配置已保存' });
    }

    return NextResponse.json({ error: '无效的请求' }, { status: 400 });
    
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '操作失败' 
    }, { status: 500 });
  }
}
