import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-secret";

const protectedRoutes = ["/collection", "/admin", "/settings", "/wishlist"];
const protectedPrefixes = [
  "/collection/",
  "/admin/",
  "/wiki/",
  "/api/collection",
  "/api/upload",
  "/api/wishlist",
  "/api/import",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    protectedRoutes.includes(pathname) ||
    protectedPrefixes.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/collection/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/wishlist/:path*",
    "/wiki/:path*/edit",
    "/wiki/:path*/history/:path*",
    "/api/collection/:path*",
    "/api/upload/:path*",
    "/api/wishlist/:path*",
    "/api/import/:path*",
  ],
};
