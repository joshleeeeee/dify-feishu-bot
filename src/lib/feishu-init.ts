// 飞书 WebSocket 长连接启动器
// 这个文件会在服务启动时被加载，自动建立长连接

import { startFeishuWebSocket, getWebSocketStatus } from './feishu';

let initialized = false;

export function initializeFeishuConnection() {
  if (initialized) {
    return getWebSocketStatus();
  }

  console.log('初始化飞书长连接...');
  
  try {
    startFeishuWebSocket();
    initialized = true;
  } catch (error) {
    console.error('飞书连接初始化失败:', error);
  }

  return getWebSocketStatus();
}

// 在模块加载时自动初始化
if (typeof window === 'undefined') {
  // 只在服务端运行
  // 延迟初始化，确保配置已加载
  setTimeout(() => {
    initializeFeishuConnection();
  }, 1000);
}
