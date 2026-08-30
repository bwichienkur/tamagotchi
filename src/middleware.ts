import "@/lib/bootstrap-env";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { getAuthSecret } from "@/lib/auth-secret";

const { auth } = NextAuth(authConfig);

const protectedRoutes = ["/collection", "/admin", "/settings", "/manage", "/wishlist", "/wiki/new"];
const protectedPrefixes = [
  "/collection/",
  "/admin/",
  "/api/collection",
  "/api/collection/profile",
  "/api/device-types",
  "/api/upload",
  "/api/uploads",
  "/api/wishlist",
  "/api/import",
  "/api/wiki",
];

function isProtectedPath(pathname: string): boolean {
  return (
    protectedRoutes.includes(pathname) ||
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    pathname.endsWith("/edit") ||
    pathname.includes("/history")
  );
}

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!getAuthSecret()) {
    console.error("Middleware: AUTH_SECRET is not configured");
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Auth is not configured" }, { status: 503 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!request.auth?.user?.id) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Please sign in to upload images." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && request.auth.user.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/collection/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/manage/:path*",
    "/wishlist/:path*",
    "/wiki/new",
    "/wiki/:path*/edit",
    "/wiki/:path*/history/:path*",
    "/api/collection/:path*",
    "/api/device-types/:path*",
    "/api/upload",
    "/api/uploads",
    "/api/upload/:path*",
    "/api/uploads/:path*",
    "/api/wishlist/:path*",
    "/api/import/:path*",
    "/api/wiki/:path*",
  ],
};

// NextAuth middleware types request with auth property
export type AuthMiddlewareRequest = NextRequest & {
  auth: { user?: { id?: string; role?: string } } | null;
};
