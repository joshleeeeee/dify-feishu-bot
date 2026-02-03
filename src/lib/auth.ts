import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'default-token';
const COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// 从请求中验证 token
export function validateTokenFromRequest(request: NextRequest): boolean {
  // 1. 先检查 URL 参数
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken === ADMIN_TOKEN) {
    return true;
  }

  // 2. 再检查 Cookie
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken === ADMIN_TOKEN) {
    return true;
  }

  return false;
}

// 检查是否需要设置 cookie（URL 带了 token 但 cookie 没有）
export function shouldSetCookie(request: NextRequest): boolean {
  const urlToken = request.nextUrl.searchParams.get('token');
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  
  return urlToken === ADMIN_TOKEN && cookieToken !== ADMIN_TOKEN;
}

// 设置认证 cookie
export async function setAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, ADMIN_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

// 检查 API 请求的认证
export function validateApiAuth(request: NextRequest): boolean {
  // 检查 Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token === ADMIN_TOKEN) {
      return true;
    }
  }

  // 检查 URL 参数
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken === ADMIN_TOKEN) {
    return true;
  }

  // 检查 Cookie
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken === ADMIN_TOKEN) {
    return true;
  }

  return false;
}
