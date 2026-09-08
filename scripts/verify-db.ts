import { prisma } from "../lib/prisma";
import { validateOrgCreate } from "../lib/roles";
import { PERPUS_2026_EMPLOYEES } from "../lib/perpus-2026";
async function q() {
  const emps = await prisma.employee.findMany();
  const byRole: any = {};
  for (const e of emps) byRole[e.role] = (byRole[e.role] || 0) + 1;
  console.log("TOTAL", emps.length, JSON.stringify(byRole));
  console.log("pimpinan_1", emps.filter((e) => e.role === "pimpinan_1").map((e) => e.name));
  console.log("Nuryati kids", emps.filter((e) => e.supervisorId === "e-nuryati").length);
  console.log("Linda kids", emps.filter((e) => e.supervisorId === "e-linda").length);
  console.log("dup email", new Set(emps.map((e) => e.email)).size === emps.length ? "none" : "dup");
  console.log("dup nip", new Set(emps.map((e) => e.employeeNumber)).size === emps.length ? "none" : "dup");
  const periods = await prisma.skpPeriod.findMany();
  console.log("periods", JSON.stringify(periods));
  console.log("plans", await prisma.performancePlan.count());
  let ok = true;
  const acc: any[] = [];
  for (const e of PERPUS_2026_EMPLOYEES) {
    const v = validateOrgCreate(acc, { id: e.id, role: e.role as any, supervisorId: e.supervisorId });
    if (!v.ok) {
      console.log("FAIL", e.name, v.error);
      ok = false;
    }
    acc.push({ id: e.id, role: e.role as any, supervisorId: e.supervisorId });
  }
  console.log("validate all:", ok ? "OK" : "FAIL");
}
q().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
