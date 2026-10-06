import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "arca_token";

const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.has(AUTH_COOKIE);
  const isAuthPage = AUTH_PAGES.includes(request.nextUrl.pathname);

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
