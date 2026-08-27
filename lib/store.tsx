"use client";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import type { Employee, SkpPeriod, PerformancePlan, Realization, Attachment, ActivityLog, Role } from "./types";
import { seedEmployees, seedPeriods, seedPlans, seedRealizations, seedAttachments, seedLogs } from "./data";

type PlanForm = Partial<PerformancePlan>;
type Ctx = {
  currentUser: Employee | null; setCurrentUser: (e: Employee | null) => void;
  authChecked: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  updateEmployeeOrg: (id: string, patch: { supervisorId?: string | null; role?: Role }) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  periods: SkpPeriod[]; setPeriods: React.Dispatch<React.SetStateAction<SkpPeriod[]>>;
  plans: PerformancePlan[]; setPlans: React.Dispatch<React.SetStateAction<PerformancePlan[]>>;
  realizations: Realization[]; setRealizations: React.Dispatch<React.SetStateAction<Realization[]>>;
  attachments: Attachment[]; setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  logs: ActivityLog[]; setLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  toast: string | null; notify: (m: string) => void;
  addLog: (action: string, desc: string, type: string, id: string) => void;
  isSubordinate: (sup: string, emp: string) => boolean;
  getSubordinates: (id: string) => Employee[];
  getDirectSubordinates: (id: string) => Employee[];
  visiblePlans: PerformancePlan[]; filteredPlans: PerformancePlan[]; myPlans: PerformancePlan[];
  search: string; setSearch: (s: string) => void;
  // modals & forms
  showPlanModal: boolean; setShowPlanModal: (v: boolean) => void;
  showCascadeModal: PerformancePlan | null; setShowCascadeModal: (p: PerformancePlan | null) => void;
  showRealizationModal: PerformancePlan | null; setShowRealizationModal: (p: PerformancePlan | null) => void;
  editingPlan: PerformancePlan | null; setEditingPlan: (p: PerformancePlan | null) => void;
  planForm: PlanForm; setPlanForm: (f: PlanForm) => void;
  cascadeTargets: string[]; setCascadeTargets: (v: string[]) => void;
  cascadePortions: Record<string,string>; setCascadePortions: (v: Record<string,string>) => void;
  cascadeTitles: Record<string,string>; setCascadeTitles: (v: Record<string,string>) => void;
  realForm: { title: string; value: string; description: string; fileName: string }; setRealForm: (v: { title: string; value: string; description: string; fileName: string }) => void;
  periodForm: { name: string; year: number; startDate: string; endDate: string }; setPeriodForm: (v: { name: string; year: number; startDate: string; endDate: string }) => void;
  empForm: { name: string; email: string; supervisorId: string; role: Role }; setEmpForm: (v: { name: string; email: string; supervisorId: string; role: Role }) => void;
  // handlers
  handleCreatePlan: () => void;
  handleCascade: () => void;
  handleUpdateDelegation: (id: string, target: string, title?: string) => void;
  handleDeleteDelegation: (id: string, title: string) => Promise<void>;
  handleSubmitRealization: () => void;
  handleDeletePlan: (id: string, title: string) => Promise<void>;
};

const SKPContext = createContext<Ctx | null>(null);
export function useSKP() {
  const c = useContext(SKPContext);
  if (!c) throw new Error("useSKP must be inside SKPProvider");
  return c;
}

export function SKPProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [periods, setPeriods] = useState<SkpPeriod[]>(seedPeriods);
  const [plans, setPlans] = useState<PerformancePlan[]>(seedPlans);
  const [realizations, setRealizations] = useState<Realization[]>(seedRealizations);
  const [attachments, setAttachments] = useState<Attachment[]>(seedAttachments);
  const [logs, setLogs] = useState<ActivityLog[]>(seedLogs);
  const [toast, setToast] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCascadeModal, setShowCascadeModal] = useState<PerformancePlan | null>(null);
  const [showRealizationModal, setShowRealizationModal] = useState<PerformancePlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<PerformancePlan | null>(null);
  const [search, setSearch] = useState("");
  const [planForm, setPlanForm] = useState<PlanForm>({ title: "", target: "", skpPeriodId: "sp2026" });
  const [cascadeTargets, setCascadeTargets] = useState<string[]>([]);
  const [cascadePortions, setCascadePortions] = useState<Record<string,string>>({});
  const [cascadeTitles, setCascadeTitles] = useState<Record<string,string>>({});
  const [realForm, setRealForm] = useState({ title: "", value: "1", description: "", fileName: "" });
  const [periodForm, setPeriodForm] = useState({ name: "", year: 2026, startDate: "", endDate: "" });
  const [empForm, setEmpForm] = useState({ name: "", email: "", supervisorId: "", role: "staff" as Role });

  // Hydrate from SQLite via /api/db — keeps UI snappy with seed fallback
  useEffect(() => {
    fetch("/api/db").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      if (d.employees?.length) setEmployees(d.employees);
      if (d.periods?.length) setPeriods(d.periods);
      if (d.plans?.length) setPlans(d.plans);
      if (d.realizations?.length) setRealizations(d.realizations);
      if (d.attachments?.length) setAttachments(d.attachments);
      if (d.logs?.length) setLogs(d.logs);
    }).catch(() => {});
  }, []);

  // Real auth: check session cookie
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }).then(async r => {
      if (r.ok) {
        const j = await r.json();
        if (j.user) setCurrentUser(j.user);
      }
    }).catch(()=>{}).finally(() => setAuthChecked(true));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
    const j = await res.json();
    if (res.ok && j.user) {
      setCurrentUser(j.user);
      return { ok: true };
    }
    return { ok: false, error: j.error || "Login gagal" };
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(()=>{});
    setCurrentUser(null);
  };

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t); } }, [toast]);
  const notify = (m: string) => setToast(m);
  const persistLog = (payload: any) => {
    fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) }).catch(() => {});
  };
  const addLog = (action: string, desc: string, type: string, id: string) => {
    if (!currentUser) return;
    const entry: ActivityLog = { id: "l" + Date.now(), userId: currentUser.id, userName: currentUser.name.split(",")[0], action, description: desc, entityType: type, entityId: id, createdAt: new Date().toISOString().slice(0, 16).replace("T", " ") };
    setLogs(prev => [entry, ...prev]);
    persistLog(entry);
  };

  const isSubordinate = (supervisorId: string, employeeId: string): boolean => {
    const visited = new Set<string>(); let queue = [supervisorId];
    while (queue.length) { const cur = queue.shift()!; const direct = employees.filter(e => e.supervisorId === cur).map(e => e.id); if (direct.includes(employeeId)) return true; direct.forEach(d => { if (!visited.has(d)) { visited.add(d); queue.push(d); } }); }
    return false;
  };
  const getSubordinates = (id: string): Employee[] => employees.filter(e => isSubordinate(id, e.id));
  const getDirectSubordinates = (id: string) => employees.filter(e => e.supervisorId === id);

  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin" || currentUser.role === "direktur") return plans;
    if (currentUser.role === "supervisor") { const subs = getSubordinates(currentUser.id).map(s => s.id); return plans.filter(p => p.assignedTo === currentUser.id || subs.includes(p.assignedTo) || p.createdBy === currentUser.id); }
    return plans.filter(p => p.assignedTo === currentUser.id);
  }, [currentUser, plans, employees]);

  const filteredPlans = visiblePlans.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  // Hanya rencana yang ditugaskan KEpada user ini (tugas pribadi)
  const myPlans = useMemo(() => currentUser ? plans.filter(p => p.assignedTo === currentUser.id) : [], [currentUser, plans]);

  const handleCreatePlan = () => {
    if (!currentUser) return;
    if (!planForm.title || !planForm.target) { notify("Judul dan target wajib diisi"); return; }
    // fallback aman: jika skpPeriodId tidak ada di perioden aktif (mis. sp1 lama), pakai periode pertama
    const validPeriodId = periods.find(p => p.id === planForm.skpPeriodId)?.id ?? periods[0]?.id ?? "sp2026";
    const newPlan: PerformancePlan = {
      id: "pl" + Date.now(), parentId: editingPlan ? editingPlan.parentId : null,
      skpPeriodId: validPeriodId, createdBy: currentUser.id, assignedTo: currentUser.id,
      title: planForm.title!, target: planForm.target!, progress: 0
    };
    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, title: newPlan.title, target: newPlan.target, id: editingPlan.id } : p));
      fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: editingPlan.id, title: newPlan.title, target: newPlan.target }) }).then(async r => { if (!r.ok) { const j = await r.json().catch(()=>({})); notify("Gagal simpan ke database: " + (j.error || r.statusText)); }}).catch(() => notify("Gagal simpan ke database"));
      addLog("Mengubah rencana", `Mengubah rencana '${newPlan.title}'`, "performance_plan", editingPlan.id); notify("Rencana diperbarui");
    } else {
      setPlans(prev => [newPlan, ...prev]);
      fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...newPlan, log: false }) }).then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(()=>({}));
          const detail = j.details ? JSON.stringify(j.details).slice(0,200) : "";
          notify("Gagal simpan: " + (j.error || r.statusText) + (detail ? " " + detail : ""));
          setPlans(prev => prev.filter(p => p.id !== newPlan.id));
        } else {
          const saved = await r.json().catch(()=>null);
          if (saved && saved.id && saved.id !== newPlan.id) {
            // replace optimistic id with real id
            setPlans(prev => prev.map(p => p.id === newPlan.id ? { ...p, id: saved.id } : p));
          }
          notify("Rencana kinerja dibuat — tersimpan di database");
        }
      }).catch(() => { notify("Gagal simpan ke database (jaringan)"); setPlans(prev => prev.filter(p => p.id !== newPlan.id)); });
      addLog("Membuat rencana", `Membuat rencana '${newPlan.title}'`, "performance_plan", newPlan.id);
    }
    setShowPlanModal(false); setEditingPlan(null); setPlanForm({ title: "", target: "", skpPeriodId: periods[0]?.id ?? "sp2026" });
  };

  // Auto-koreksi planForm jika masih pakai id lama (sp1) setelah periods ter-hydrate dari DB
  useEffect(() => {
    if (periods.length && planForm.skpPeriodId && !periods.find(p => p.id === planForm.skpPeriodId)) {
      setPlanForm(prev => ({ ...prev, skpPeriodId: periods[0].id }));
    }
  }, [periods]);

  const handleCascade = () => {
    if (!currentUser) return;
    if (!showCascadeModal || cascadeTargets.length === 0) { notify("Pilih minimal satu delegasi penerima"); return; }
    // validasi porsi + judul
    const parentTarget = parseFloat(String(showCascadeModal.target).replace(",", ".")) || 0;
    const portions = cascadeTargets.map(tid => ({
      tid,
      val: parseFloat(String(cascadePortions[tid] ?? showCascadeModal.target).replace(",", ".")) || 0,
      title: (cascadeTitles[tid] ?? "").trim() || showCascadeModal.title
    }));
    for (const p of portions) {
      if (!p.title || p.title.length < 3) { notify(`Judul untuk ${employees.find(e=>e.id===p.tid)?.name ?? p.tid} minimal 3 karakter`); return; }
      if (p.val <= 0) { notify(`Porsi untuk ${employees.find(e=>e.id===p.tid)?.name ?? p.tid} harus >0`); return; }
    }
    const total = portions.reduce((s,p)=>s+p.val,0);
    // juga hitung existing children agar total tidak melebihi parent
    const existing = plans.filter(pl=>pl.parentId===showCascadeModal.id);
    const existingTotal = existing.reduce((s,pl)=> s + (parseFloat(String(pl.target).replace(",", "."))||0),0);
    if (parentTarget > 0 && total + existingTotal > parentTarget) {
      notify(`Total porsi (${existingTotal}+${total}=${existingTotal+total}) melebihi target induk (${parentTarget}). Kurangi porsi.`);
      return;
    }
    const newPlans: PerformancePlan[] = portions.map(({tid,val,title}) => ({
      id: "pl" + Date.now() + tid, parentId: showCascadeModal.id, skpPeriodId: showCascadeModal.skpPeriodId, createdBy: currentUser.id, assignedTo: tid,
      title, target: String(val), progress: 0
    } as PerformancePlan));
    setPlans(prev => [...newPlans, ...prev]);
    // persist each child
    newPlans.forEach(np => fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...np, log: false }) }).then(async r=>{ if(!r.ok){ const j=await r.json().catch(()=>({})); notify("Gagal simpan: "+(j.error||r.statusText)); }}).catch(() => notify("Gagal simpan pelimpahan ke database")));
    portions.forEach(({tid,val,title}) => { const emp = employees.find(e => e.id === tid); addLog("Pelimpahan kinerja", `Melimpahkan '${title}' (${val}) kepada ${emp?.name}`, "performance_plan", showCascadeModal.id); });
    notify(`Berhasil melimpahkan kepada ${portions.length} pegawai`); setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); setCascadeTitles({});
  };

  const handleUpdateDelegation = (id: string, target: string, title?: string) => {
    const plan = plans.find(p=>p.id===id);
    if (!plan || !plan.parentId) { notify("Delegasi tidak ditemukan"); return; }
    const parent = plans.find(p=>p.id===plan.parentId);
    const newVal = target !== undefined ? parseFloat(String(target).replace(",", ".")) || 0 : parseFloat(String(plan.target).replace(",", "."))||0;
    const newTitle = title !== undefined ? title.trim() : plan.title;
    if (newTitle.length < 3) { notify("Judul minimal 3 karakter"); return; }
    if (newVal <= 0) { notify("Porsi harus >0"); return; }
    if (parent) {
      const parentTarget = parseFloat(String(parent.target).replace(",", ".")) || 0;
      const siblings = plans.filter(p=>p.parentId===parent.id && p.id!==id);
      const siblingsTotal = siblings.reduce((s,p)=> s + (parseFloat(String(p.target).replace(",", "."))||0),0);
      if (parentTarget>0 && siblingsTotal + newVal > parentTarget) { notify(`Total porsi bawahan (${siblingsTotal}+${newVal}) melebihi target induk (${parentTarget})`); return; }
    }
    setPlans(prev=> prev.map(p=> p.id===id ? { ...p, target: String(newVal), title: newTitle} : p));
    const payload: any = { id, target: String(newVal), title: newTitle };
    fetch("/api/plans", { method:"PATCH", headers:{ "Content-Type":"application/json"}, credentials:"include", body: JSON.stringify(payload)}).then(async r=>{ if(!r.ok){ const j=await r.json().catch(()=>({})); notify("Gagal update: "+(j.error||r.statusText));}}).catch(()=> notify("Gagal update delegasi"));
    // recalc parent progress (target berubah mempengaruhi %)
    const newProgParent = parent ? calcParentProgress(parent.id, plans.map(p=>p.id===id?{...p,target:String(newVal)}:p), realizations) : null;
    if (parent && newProgParent!==null && parent.progress!==newProgParent) {
      setPlans(prev=> prev.map(p=> p.id===parent.id ? { ...p, progress: newProgParent}:p));
      fetch("/api/plans", { method:"PATCH", headers:{ "Content-Type":"application/json"}, credentials:"include", body: JSON.stringify({ id: parent.id, progress: newProgParent})}).catch(()=>{});
    }
    addLog("Ubah delegasi", `Ubah '${plan.title}' → '${newTitle}' (${newVal}) untuk ${employees.find(e=>e.id===plan.assignedTo)?.name}`, "performance_plan", id);
    notify("Delegasi diperbarui");
  };

  const handleDeleteDelegation = async (id: string, title: string) => {
    // delegasi = child plan, hapus via handleDeletePlan (akan cascade hapus turunannya juga)
    await handleDeletePlan(id, title);
  };

  // progress = jumlah entri (langsung + bawahan) / target — sesuai instruksi
  const calcPlanProgress = (planId: string, allPlans: PerformancePlan[], allReals: Realization[]): number => {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) return 0;
    const t = parseFloat(String(plan.target).replace(",", ".")) || 0;
    if (t <= 0) return 0;
    const direct = allReals.filter(r => r.planId === planId).length;
    const children = allPlans.filter(p => p.parentId === planId);
    const descendantIds2 = new Set<string>();
    const q2: string[] = children.map(c => c.id);
    while (q2.length) {
      const cur = q2.shift()!;
      if (descendantIds2.has(cur)) continue;
      descendantIds2.add(cur);
      allPlans.filter(pp => pp.parentId === cur).forEach(ch => q2.push(ch.id));
    }
    const viaChildren = allReals.filter(r => descendantIds2.has(r.planId)).length;
    const total = direct + viaChildren;
    return Math.min(150, Math.round((total / t) * 100));
  };

  const calcCumulativeProgress = (planId: string, allReals: Realization[], targetStr: string): number => {
    const t = parseFloat(String(targetStr).replace(",", ".")) || 0;
    if (t <= 0) return 0;
    const total = allReals.filter(r => r.planId === planId).length;
    return Math.min(150, Math.round((total / t) * 100));
  };

  const handleSubmitRealization = () => {
    if (!currentUser) return;
    if (!showRealizationModal) return;
    if (!realForm.title.trim()) { notify("Judul realisasi wajib diisi"); return; }
    const plan = showRealizationModal;
    const valNum = 1;
    const r: Realization = { id: "r" + Date.now(), planId: plan.id, title: realForm.title.trim(), value: String(valNum), description: realForm.description, date: new Date().toISOString().slice(0, 10) };
    const nextReals = [r, ...realizations];
    // untuk plan yang punya anak, progress = (langsung + anak)/target
    const newProgress = calcPlanProgress(plan.id, plans, nextReals);
    setRealizations(nextReals);
    if (realForm.fileName) setAttachments(prev => [{ id: "a" + Date.now(), planId: plan.id, realizationId: r.id, fileName: realForm.fileName, fileSize: "1.2 MB", uploadedBy: currentUser.id, date: r.date }, ...prev]);
    setPlans(prev => {
      let updated = prev.map(p => p.id === plan.id ? { ...p, progress: newProgress } : p);
      fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: plan.id, progress: newProgress }) }).catch(() => {});
      let cur: string | null = updated.find(p => p.id === plan.id)?.parentId ?? null;
      while (cur) {
        const np = calcParentProgress(cur, updated, nextReals);
        if (np === null) break;
        const par = updated.find(p => p.id === cur);
        if (!par || par.progress === np) { cur = par?.parentId ?? null; continue; }
        updated = updated.map(p => p.id === cur ? { ...p, progress: np } : p);
        fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: cur, progress: np }) }).catch(()=>{});
        cur = par.parentId;
      }
      return updated;
    });
    fetch("/api/realizations", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ planId: plan.id, title: r.title, value: r.value, description: r.description, date: r.date, fileName: realForm.fileName, uploadedBy: currentUser.id, progress: newProgress }) }).then(async res => { if (!res.ok) { const j = await res.json().catch(()=>({})); notify("Gagal simpan realisasi: " + (j.error || res.statusText)); }}).catch(() => notify("Gagal simpan realisasi"));
    addLog("Mengirim realisasi", `Mengirim realisasi "${r.title}" untuk '${plan.title}'`, "realization", r.id); notify(`Realisasi dikirim — progress jadi ${newProgress}%`); setShowRealizationModal(null); setRealForm({ title: "", value: "1", description: "", fileName: "" });
  };

  // Helper: hitung progress induk = (jumlah entri langsung + capaian anak) / target — bisa >100%
  const calcParentProgress = (parentId: string, allPlans: PerformancePlan[], allReals: Realization[] = realizations): number | null => {
    const parent = allPlans.find(p => p.id === parentId);
    if (!parent) return null;
    const children = allPlans.filter(p => p.parentId === parentId);
    const parentTarget = parseFloat(String(parent.target).replace(",", ".")) || 0;
    if (parentTarget <= 0) {
      if (children.length === 0) return null;
      return Math.min(150, Math.round(children.reduce((s, c) => s + c.progress, 0) / children.length));
    }
    const directCompleted = allReals.filter(r => r.planId === parentId).length;
    const descendantIds = new Set<string>();
    const queue: string[] = children.map(c => c.id);
    while (queue.length) {
      const cur = queue.shift()!;
      if (descendantIds.has(cur)) continue;
      descendantIds.add(cur);
      allPlans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id));
    }
    const childrenCompleted = allReals.filter(r => descendantIds.has(r.planId)).length;
    const total = directCompleted + childrenCompleted;
    if (children.length === 0 && directCompleted === 0) return null;
    return Math.min(150, Math.round((total / parentTarget) * 100));
  };

  const propagateProgress = (changedPlanId: string, updatedPlans: PerformancePlan[], allReals: Realization[] = realizations) => {
    let currentId: string | null = updatedPlans.find(p => p.id === changedPlanId)?.parentId ?? null;
    let plansSnapshot = [...updatedPlans];
    while (currentId) {
      const newProg = calcParentProgress(currentId, plansSnapshot, allReals);
      if (newProg === null) break;
      const parent = plansSnapshot.find(p => p.id === currentId);
      if (!parent || parent.progress === newProg) {
        currentId = parent?.parentId ?? null;
        continue;
      }
      plansSnapshot = plansSnapshot.map(p => p.id === currentId ? { ...p, progress: newProg } : p);
      fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: currentId, progress: newProg }) }).catch(() => {});
      currentId = parent.parentId;
    }
    return plansSnapshot;
  };

  // ===== CRUD Organisasi (admin/direktur) =====
  const updateEmployeeOrg = async (id: string, patch: { supervisorId?: string | null; role?: Role }) => {
    if (!currentUser || !["admin","direktur"].includes(currentUser.role)) { notify("Hanya admin/direktur"); return false; }
    if (patch.supervisorId === id) { notify("Atasan tidak bisa dirinya sendiri"); return false; }
    if (patch.supervisorId && isSubordinate(id, patch.supervisorId)) { notify("Tidak boleh: akan membentuk siklus (delegasi penerima jadi atasan)"); return false; }
    const backup = employees;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    try {
      const res = await fetch("/api/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id, ...patch }) });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      addLog("Mengubah organisasi", `Update ${patch.supervisorId !== undefined ? "atasan" : ""}${patch.role ? " role" : ""} ${employees.find(e=>e.id===id)?.name}`.trim(), "employee", id);
      notify("Data organisasi diperbarui");
      return true;
    } catch (e: any) {
      setEmployees(backup);
      notify("Gagal update: " + (e?.message || "error"));
      return false;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!currentUser || currentUser.role !== "admin") { notify("Hanya admin dapat menghapus pegawai"); return false; }
    const target = employees.find(e=>e.id===id);
    if (!target) return false;
    if (id === currentUser.id) { notify("Tidak bisa menghapus diri sendiri"); return false; }
    const subs = getDirectSubordinates(id);
    if (subs.length > 0) { notify(`Pegawai masih punya ${subs.length} delegasi penerima — pindahkan dulu`); return false; }
    const hasPlans = plans.some(p=>p.assignedTo===id || p.createdBy===id);
    if (hasPlans) { notify("Pegawai masih terkait rencana kinerja — hapus/pindahkan dulu"); return false; }
    const backup = employees;
    setEmployees(prev => prev.filter(e => e.id !== id));
    try {
      const res = await fetch("/api/employees", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      addLog("Menghapus pegawai", `Menghapus ${target.name}`, "employee", id);
      notify(`${target.name.split(",")[0]} dihapus`);
      return true;
    } catch (e: any) {
      setEmployees(backup);
      notify("Gagal hapus: " + (e?.message || "error"));
      return false;
    }
  };

  const handleDeletePlan = async (id: string, title: string) => {
    // Kumpulkan id turunan secara lokal untuk optimistic remove
    const toDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of plans) {
        if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) { toDelete.add(p.id); changed = true; }
      }
    }
    const deletedPlan = plans.find(p => p.id === id);
    const parentId = deletedPlan?.parentId ?? null;
    const backup = plans;
    // optimistic: hapus + recalc parent
    let optimistic = backup.filter(p => !toDelete.has(p.id));
    if (parentId) {
      const newProg = calcParentProgress(parentId, optimistic);
      if (newProg !== null) {
        optimistic = optimistic.map(p => p.id === parentId ? { ...p, progress: newProg } : p);
      }
    }
    setPlans(optimistic);
    try {
      const res = await fetch("/api/plans", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      // persist parent recalc juga
      if (parentId) {
        const newProg = calcParentProgress(parentId, optimistic);
        if (newProg !== null) {
          fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: parentId, progress: newProg }) }).catch(()=>{});
        }
      }
      addLog("Menghapus rencana", `Menghapus '${title}' beserta ${toDelete.size - 1} turunan`, "performance_plan", id);
      notify(`${title.slice(0, 30)}${title.length > 30 ? "…" : ""} + ${toDelete.size - 1} turunan terhapus`);
    } catch (e: any) {
      setPlans(backup); // rollback
      notify("Gagal hapus: " + (e?.message || "error"));
    }
  };

  const value: Ctx = {
    currentUser, setCurrentUser, authChecked, login, logout, employees, setEmployees,
    updateEmployeeOrg, deleteEmployee,
    periods, setPeriods, plans, setPlans, realizations, setRealizations, attachments, setAttachments, logs, setLogs,
    toast, notify, addLog, isSubordinate, getSubordinates, getDirectSubordinates, visiblePlans, filteredPlans, myPlans, search, setSearch,
    showPlanModal, setShowPlanModal, showCascadeModal, setShowCascadeModal, showRealizationModal, setShowRealizationModal,
    editingPlan, setEditingPlan, planForm, setPlanForm, cascadeTargets, setCascadeTargets, cascadePortions, setCascadePortions, cascadeTitles, setCascadeTitles, realForm, setRealForm, periodForm, setPeriodForm, empForm, setEmpForm,
    handleCreatePlan, handleCascade, handleUpdateDelegation, handleDeleteDelegation, handleSubmitRealization, handleDeletePlan,
  };
  return <SKPContext.Provider value={value}>{children}</SKPContext.Provider>;
}
