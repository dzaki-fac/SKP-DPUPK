import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "skp-dpupk-secret-2026-change-in-production";
const JWT_EXPIRES = "7d";

export type JwtPayload = {
  id: string;
  email: string;
  role: string;
  name: string;
};

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)skp_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function authResponse(data: any, token?: string) {
  const res = Response.json(data);
  if (token) {
    // httpOnly cookie
    res.headers.set("Set-Cookie", `skp_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7*24*60*60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  }
  return res;
}

export function logoutResponse() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `skp_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
