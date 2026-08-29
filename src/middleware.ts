import "@/lib/bootstrap-env";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-secret";

const protectedRoutes = ["/collection", "/admin", "/settings", "/wishlist", "/wiki/new"];
const protectedPrefixes = [
  "/collection/",
  "/admin/",
  "/api/collection",
  "/api/upload",
  "/api/wishlist",
  "/api/import",
  "/api/wiki",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    protectedRoutes.includes(pathname) ||
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    pathname.endsWith("/edit") ||
    pathname.includes("/history");

  if (!isProtected) return NextResponse.next();

  const secret = getAuthSecret();
  if (!secret) {
    console.error("Middleware: AUTH_SECRET is not configured");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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
    "/wiki/new",
    "/wiki/:path*/edit",
    "/wiki/:path*/history/:path*",
    "/api/collection/:path*",
    "/api/upload/:path*",
    "/api/wishlist/:path*",
    "/api/import/:path*",
    "/api/wiki/:path*",
  ],
};
