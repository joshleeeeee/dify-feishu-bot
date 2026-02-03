import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'default-token';
const COOKIE_NAME = 'admin_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护 /admin 路径
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 检查 URL token
  const urlToken = request.nextUrl.searchParams.get('token');
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

  // URL token 正确
  if (urlToken === ADMIN_TOKEN) {
    // 如果 cookie 还没设置，设置它并重定向（去掉 URL 中的 token）
    if (cookieToken !== ADMIN_TOKEN) {
      const response = NextResponse.redirect(
        new URL(pathname, request.url)
      );
      response.cookies.set(COOKIE_NAME, ADMIN_TOKEN, {
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
  if (cookieToken === ADMIN_TOKEN) {
    return NextResponse.next();
  }

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
