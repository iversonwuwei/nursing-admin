import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("next-auth.session-token") 
    || request.cookies.get("__Secure-next-auth.session-token")
  
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth")
  const isStaticFile = request.nextUrl.pathname.startsWith("/_next")
    || request.nextUrl.pathname.startsWith("/favicon")
    || request.nextUrl.pathname.includes(".")

  if (isStaticFile) {
    return NextResponse.next()
  }

  // 未登录且访问受保护页面
  if (!sessionCookie && !isLoginPage && !isAuthApi) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 已登录且访问登录页，重定向到首页
  if (sessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)",
  ],
}
