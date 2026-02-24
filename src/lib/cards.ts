import { AgentConfig } from './config';

// 智能体选择卡片（无交互按钮，引导用户发送命令）
export function buildAgentSelectCard(agents: AgentConfig[]) {
  // 生成智能体列表，每个智能体显示序号，用户可以发送序号选择
  const agentList = agents.map((agent, index) => {
    const star = agent.isDefault ? ' ⭐' : '';
    const desc = agent.description ? ` - ${agent.description}` : '';
    return `**${index + 1}.** ${agent.name}${star}${desc}`;
  }).join('\n');

  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '🤖 请选择 AI 助手',
      },
      template: 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '请选择一个 AI 助手开始对话：\n\n' + agentList,
        },
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '💡 发送数字序号（如 1、2）选择助手，发送 /new 开始新对话',
          },
        ],
      },
    ],
  };
}

// 欢迎卡片（无交互按钮）
export function buildWelcomeCard(agentName: string) {
  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '👋 欢迎使用 AI 助手',
      },
      template: 'green',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `当前助手：**${agentName}**\n\n现在可以开始对话了，直接发送消息即可！`,
        },
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '💡 发送 /agent 切换助手，发送 /new 开始新对话',
          },
        ],
      },
    ],
  };
}

// 帮助卡片
export function buildHelpCard() {
  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '📖 使用帮助',
      },
      template: 'purple',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: 
            '**可用命令：**\n\n' +
            '• `/agent` 或 `选择助手` - 选择 AI 助手\n' +
            '• `/new` 或 `新对话` - 开始新的对话\n' +
            '• `/status` 或 `状态` - 查看当前对话的上下文容量占用情况\n' +
            '• `/help` 或 `帮助` - 显示此帮助\n\n' +
            '**使用方式：**\n\n' +
            '直接发送消息即可与 AI 助手对话。',
        },
      },
    ],
  };
}

// 错误卡片（无交互按钮）
export function buildErrorCard(errorMessage: string) {
  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '❌ 出现错误',
      },
      template: 'red',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: errorMessage,
        },
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: '💡 请稍后重试，或发送 /new 开始新对话',
          },
        ],
      },
    ],
  };
}

// 无智能体配置卡片
export function buildNoAgentCard() {
  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '⚠️ 配置缺失',
      },
      template: 'orange',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '当前没有可用的 AI 助手，请联系管理员在后台添加智能体配置。',
        },
      },
    ],
  };
}
