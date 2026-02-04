const fs = require('fs');
const path = require('path');

// 手动解析 .env 文件，确保兼容所有 PM2 版本
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  const env = { NODE_ENV: 'production' };
  
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        // 跳过注释和空行
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          // 去除引号
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value;
        }
      });
      console.log('[PM2] Loaded .env file:', Object.keys(env).filter(k => k !== 'NODE_ENV').join(', '));
    } else {
      console.warn('[PM2] Warning: .env file not found at', envPath);
    }
  } catch (err) {
    console.error('[PM2] Error loading .env:', err.message);
  }
  
  return env;
}

module.exports = {
  apps: [
    {
      name: 'dify-feishu-bot',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      env: loadEnv(),
    },
  ],
};
