import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  if (!b.id) return Response.json({ error: "id required" }, { status: 400 });

  const att = await prisma.attachment.findUnique({ where: { id: b.id } });
  if (!att) return Response.json({ error: "Bukti tidak ditemukan" }, { status: 404 });

  // Hak hapus: pengunggah, penulis realisasi, atasan, admin/pimpinan_1
  const isUploader = att.uploadedBy === payload.id;
  const isAdmin = ["admin", "pimpinan_1"].includes(payload.role);
  let isSuperior = false;
  let isRealizationAuthor = false;

  if (att.realizationId) {
    const real = await prisma.realization.findUnique({ where: { id: att.realizationId }, select: { uploadedBy: true } });
    if (real?.uploadedBy === payload.id) isRealizationAuthor = true;
    const ownerId = real?.uploadedBy ?? att.uploadedBy;
    if (ownerId && ownerId !== payload.id) {
      const emps = await prisma.employee.findMany({ select: { id: true, supervisorId: true } });
      const isSub = (sup: string, emp: string): boolean => {
        const visited = new Set<string>();
        let queue = [sup];
        while (queue.length) {
          const cur = queue.shift()!;
          const direct = emps.filter(e => e.supervisorId === cur).map(e => e.id);
          if (direct.includes(emp)) return true;
          direct.forEach(d => { if (!visited.has(d)) { visited.add(d); queue.push(d); } });
        }
        return false;
      };
      if (isSub(payload.id, ownerId)) isSuperior = true;
      if (isSub(payload.id, att.uploadedBy)) isSuperior = true;
    }
  } else {
    // bukti tanpa realisasi (jarang) — cek atasan dari pengunggah
    const emps = await prisma.employee.findMany({ select: { id: true, supervisorId: true } });
    const isSub = (sup: string, emp: string): boolean => {
      const visited = new Set<string>();
      let queue = [sup];
      while (queue.length) {
        const cur = queue.shift()!;
        const direct = emps.filter(e => e.supervisorId === cur).map(e => e.id);
        if (direct.includes(emp)) return true;
        direct.forEach(d => { if (!visited.has(d)) { visited.add(d); queue.push(d); } });
      }
      return false;
    };
    if (isSub(payload.id, att.uploadedBy)) isSuperior = true;
  }

  if (!isUploader && !isRealizationAuthor && !isSuperior && !isAdmin) {
    return Response.json({ error: "Hanya pengunggah, penulis realisasi, atau atasan yang dapat menghapus bukti" }, { status: 403 });
  }

  await prisma.attachment.delete({ where: { id: b.id } });

  // Hapus file fisik jika ada
  try {
    const filePath = att.filePath; // e.g. /uploads/xxx.pdf
    if (filePath && filePath.startsWith("/uploads/")) {
      const safe = path.basename(filePath);
      const full = path.join(process.cwd(), "public", "uploads", safe);
      await unlink(full).catch(() => {});
    }
  } catch {}

  return Response.json({ ok: true });
}
