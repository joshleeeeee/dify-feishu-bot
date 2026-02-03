import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/auth';
import { 
  getAgents, 
  addAgent, 
  updateAgent, 
  deleteAgent,
  AgentConfig 
} from '@/lib/config';

// 获取所有智能体
export async function GET(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(getAgents());
}

// 添加智能体
export async function POST(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, difyAppToken, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    }

    const agent = addAgent({
      name,
      description: description || '',
      difyAppToken: difyAppToken || '',
      isDefault: isDefault || false,
    });

    return NextResponse.json(agent);
    
  } catch (error) {
    console.error('Add agent error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '添加失败' 
    }, { status: 500 });
  }
}

// 更新智能体
export async function PUT(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body as Partial<AgentConfig> & { id: string };

    if (!id) {
      return NextResponse.json({ error: 'ID 不能为空' }, { status: 400 });
    }

    const agent = updateAgent(id, updates);
    
    if (!agent) {
      return NextResponse.json({ error: '智能体不存在' }, { status: 404 });
    }

    return NextResponse.json(agent);
    
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '更新失败' 
    }, { status: 500 });
  }
}

// 删除智能体
export async function DELETE(request: NextRequest) {
  if (!validateApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID 不能为空' }, { status: 400 });
    }

    const success = deleteAgent(id);
    
    if (!success) {
      return NextResponse.json({ error: '智能体不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '删除失败' 
    }, { status: 500 });
  }
}
