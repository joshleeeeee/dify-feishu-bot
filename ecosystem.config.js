module.exports = {
  apps: [
    {
      name: 'dify-feishu-bot',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      env_file: '.env',  // PM2 会加载这个文件
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
