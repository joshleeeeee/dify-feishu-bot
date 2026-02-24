export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 动态引入以避免在 Edge 环境中引发错误
    const { initializeFeishuConnection } = await import('./lib/feishu-init');
    initializeFeishuConnection();
  }
}
