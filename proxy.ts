import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/rencana", "/tree", "/realisasi", "/organisasi", "/periode", "/pegawai", "/audit"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/me", "/api/db"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isApiProtected = pathname.startsWith("/api/") && !PUBLIC_API.some(p => pathname.startsWith(p));

  // Skip static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  const token = req.cookies.get("skp_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  const valid = !!token && token.length > 20;

  if ((isProtected || isApiProtected) && !valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized — silakan login" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If already logged in and visiting login page, allow (stay) — landing decides redirect
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/rencana/:path*", "/tree/:path*", "/realisasi/:path*", "/organisasi/:path*", "/periode/:path*", "/pegawai/:path*", "/audit/:path*", "/api/:path*"],
};
