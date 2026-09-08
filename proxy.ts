import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_PATH = "/skp-dpupk";
const PROTECTED = ["/dashboard", "/rencana", "/tree", "/realisasi", "/organisasi", "/periode", "/pegawai", "/audit"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/me", "/api/db"];

function stripBase(pathname: string): string {
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(BASE_PATH + "/")) return pathname.slice(BASE_PATH.length);
  return pathname;
}

export default function proxy(req: NextRequest) {
  // Middleware melihat pathname BESERTA basePath (mis. /skp-dpupk/dashboard) — kupas dulu.
  const { pathname: raw } = req.nextUrl;
  const pathname = stripBase(raw);
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
    // JANGAN tambah prefix manual: NextResponse.redirect otomatis
    // menambahkan basePath ke Location (prefix ganda jika manual).
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If already logged in and visiting login page, allow (stay) — landing decides redirect
  return NextResponse.next();
}

export const config = {
  // Varian ber-prefix WAJIB ada: matcher dicocokkan terhadap pathname beserta basePath.
  matcher: ["/dashboard/:path*", "/rencana/:path*", "/tree/:path*", "/realisasi/:path*", "/organisasi/:path*", "/periode/:path*", "/pegawai/:path*", "/audit/:path*", "/api/:path*", "/skp-dpupk/dashboard/:path*", "/skp-dpupk/rencana/:path*", "/skp-dpupk/tree/:path*", "/skp-dpupk/realisasi/:path*", "/skp-dpupk/organisasi/:path*", "/skp-dpupk/periode/:path*", "/skp-dpupk/pegawai/:path*", "/skp-dpupk/audit/:path*", "/skp-dpupk/api/:path*"],
};
