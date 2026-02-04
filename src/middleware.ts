import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_token';

export function middleware(request: NextRequest) {
  // ⚠️ 关键修改：在函数内部读取环境变量，确保是运行时获取而非构建时固化
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const { pathname } = request.nextUrl;

  // 只保护 /admin 路径
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 调试日志：帮助用户排查环境变量是否正确加载
  console.log(`[Middleware] Accessing ${pathname}`);
  if (!ADMIN_TOKEN) {
    console.error('[Middleware] ⚠️ ERROR: ADMIN_TOKEN environment variable is NOT set!');
  } else {
    // 只打印前3位，避免泄露
    console.log(`[Middleware] Server Token: ${ADMIN_TOKEN.substring(0, 3)}***`);
  }

  // 如果没有设置 Token，为了安全也通过（或者你可以选择拦截，这里保持原有逻辑变体：如果有Token才检查）
  // 但原逻辑是 const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'default-token';
  // 我们保持这个逻辑，但要在日志里警告
  const effectiveToken = ADMIN_TOKEN || 'default-token';
  
  if (effectiveToken === 'default-token') {
    console.warn('[Middleware] ⚠️ WARNING: Using default token. Please set ADMIN_TOKEN in .env');
  }

  // 检查 URL token
  const urlToken = request.nextUrl.searchParams.get('token');
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

  // URL token 正确
  if (urlToken === effectiveToken) {
    // 如果 cookie 还没设置，设置它并重定向（去掉 URL 中的 token）
    if (cookieToken !== effectiveToken) {
      console.log('[Middleware] URL token valid, setting cookie...');
      const response = NextResponse.redirect(
        new URL(pathname, request.url)
      );
      response.cookies.set(COOKIE_NAME, effectiveToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      return response;
    }
    return NextResponse.next();
  }

  // Cookie token 正确
  if (cookieToken === effectiveToken) {
    return NextResponse.next();
  }

  console.log('[Middleware] ⛔ Access Denied. UrlToken:', urlToken ? 'Provided' : 'Missing', 'CookieToken:', cookieToken ? 'Provided' : 'Missing');

  // 未授权 - 返回 401 页面
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>访问受限</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
          h1 {
            font-size: 72px;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #8892b0;
            font-size: 18px;
            margin-top: 16px;
          }
          code {
            background: rgba(255,255,255,0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>401</h1>
          <p>访问受限，请在 URL 中添加正确的 token 参数</p>
          <p><code>?token=your-admin-token</code></p>
        </div>
      </body>
    </html>
    `,
    {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export const config = {
  matcher: ['/admin/:path*'],
};
