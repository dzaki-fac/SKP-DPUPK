import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken, logoutResponse } from "@/lib/auth";

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      await prisma.activityLog.create({
        data: {
          userId: payload.id, userName: payload.name.split(",")[0], action: "Logout", description: "Logout dari sistem", entityType: "auth", entityId: payload.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ")
        }
      }).catch(()=>{});
    }
  }
  return logoutResponse();
}
