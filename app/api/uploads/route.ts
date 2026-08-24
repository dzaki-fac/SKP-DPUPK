import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED = new Set(["application/pdf","image/jpeg","image/png","image/jpg","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","text/csv"]);
const MAX = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const planId = form.get("planId") as string | null;

  if (!file) return Response.json({ error: "File wajib" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "File maksimal 10MB" }, { status: 400 });
  if (file.type && !ALLOWED.has(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|docx|xlsx|csv)$/i)) {
    return Response.json({ error: "Tipe file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, XLSX" }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,7)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(dir, safeName), Buffer.from(bytes));

  const filePath = `/uploads/${safeName}`;
  return Response.json({ ok: true, fileName: file.name, filePath, fileSize: `${(file.size/1024).toFixed(1)} KB` });
}
