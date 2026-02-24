// 飞书 WebSocket 长连接启动器
// 这个文件会在服务启动时被加载，自动建立长连接

import { startFeishuWebSocket, getWebSocketStatus } from './feishu';
import { startAutoSync } from './dify-sync';

// 给所有的控制台输出加上时间戳前缀
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

function getFormattedTime() {
  const d = new Date();
  // 简易的 YYYY-MM-DD HH:mm:ss 格式
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

console.log = function (...args) {
  originalLog(`[${getFormattedTime()}]`, ...args);
};
console.error = function (...args) {
  originalError(`[${getFormattedTime()}]`, ...args);
};
console.warn = function (...args) {
  originalWarn(`[${getFormattedTime()}]`, ...args);
};
console.info = function (...args) {
  originalInfo(`[${getFormattedTime()}]`, ...args);
};

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

  // 同时启动 Dify 自动同步
  try {
    startAutoSync();
  } catch (error) {
    console.error('Dify 自动同步初始化失败:', error);
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
