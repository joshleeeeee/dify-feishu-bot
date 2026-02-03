import fs from 'fs';
import path from 'path';

// 配置文件路径
const CONFIG_PATH = path.join(process.cwd(), 'config', 'settings.json');

// 智能体配置接口
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  difyAppToken: string; // 每个智能体可以有独立的 Dify App Token
  isDefault: boolean;
}

// 完整配置接口
export interface AppConfig {
  feishu: {
    appId: string;
    appSecret: string;
  };
  dify: {
    baseUrl: string;
    apiKey: string; // 默认的 API Key
  };
  agents: AgentConfig[];
}

// 默认配置
const defaultConfig: AppConfig = {
  feishu: {
    appId: '',
    appSecret: '',
  },
  dify: {
    baseUrl: '',
    apiKey: '',
  },
  agents: [],
};

// 读取配置
export function getConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(content);
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.error('Error reading config:', error);
  }
  return defaultConfig;
}

// 保存配置
export function saveConfig(config: AppConfig): void {
  try {
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

// 获取飞书配置
export function getFeishuConfig() {
  return getConfig().feishu;
}

// 保存飞书配置
export function saveFeishuConfig(feishuConfig: AppConfig['feishu']) {
  const config = getConfig();
  config.feishu = feishuConfig;
  saveConfig(config);
}

// 获取 Dify 配置
export function getDifyConfig() {
  return getConfig().dify;
}

// 保存 Dify 配置
export function saveDifyConfig(difyConfig: AppConfig['dify']) {
  const config = getConfig();
  config.dify = difyConfig;
  saveConfig(config);
}

// 获取所有智能体
export function getAgents(): AgentConfig[] {
  return getConfig().agents;
}

// 获取默认智能体
export function getDefaultAgent(): AgentConfig | undefined {
  const agents = getAgents();
  return agents.find(a => a.isDefault) || agents[0];
}

// 获取指定智能体
export function getAgent(id: string): AgentConfig | undefined {
  return getAgents().find(a => a.id === id);
}

// 保存智能体列表
export function saveAgents(agents: AgentConfig[]) {
  const config = getConfig();
  config.agents = agents;
  saveConfig(config);
}

// 添加智能体
export function addAgent(agent: Omit<AgentConfig, 'id'>): AgentConfig {
  const config = getConfig();
  const newAgent: AgentConfig = {
    ...agent,
    id: Date.now().toString(),
  };
  
  // 如果是第一个智能体或设置为默认,确保只有一个默认
  if (newAgent.isDefault || config.agents.length === 0) {
    config.agents.forEach(a => a.isDefault = false);
    newAgent.isDefault = true;
  }
  
  config.agents.push(newAgent);
  saveConfig(config);
  return newAgent;
}

// 更新智能体
export function updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | null {
  const config = getConfig();
  const index = config.agents.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  // 如果设置为默认,取消其他默认
  if (updates.isDefault) {
    config.agents.forEach(a => a.isDefault = false);
  }
  
  config.agents[index] = { ...config.agents[index], ...updates };
  saveConfig(config);
  return config.agents[index];
}

// 删除智能体
export function deleteAgent(id: string): boolean {
  const config = getConfig();
  const index = config.agents.findIndex(a => a.id === id);
  
  if (index === -1) return false;
  
  const wasDefault = config.agents[index].isDefault;
  config.agents.splice(index, 1);
  
  // 如果删除的是默认智能体,将第一个设为默认
  if (wasDefault && config.agents.length > 0) {
    config.agents[0].isDefault = true;
  }
  
  saveConfig(config);
  return true;
}
