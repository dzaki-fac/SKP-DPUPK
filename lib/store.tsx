"use client";
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import type { Employee, SkpPeriod, PerformancePlan, Realization, Attachment, ActivityLog, Role } from "./types";
import { validateOrgChange, validateOrgCreate, canCreateAnyRole } from "./roles";
import { seedEmployees, seedPeriods, seedPlans, seedRealizations, seedAttachments, seedLogs } from "./data";

type PlanForm = Partial<PerformancePlan> & { plannedDate?: string; plannedTime?: string };
type Ctx = {
  currentUser: Employee | null; setCurrentUser: (e: Employee | null) => void;
  authChecked: boolean;
  dbLoaded: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  employees: Employee[]; setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  updateEmployee: (id: string, patch: { name?: string; email?: string; employeeNumber?: string; password?: string; supervisorId?: string | null; role?: Role; isActive?: boolean; avatar?: string }) => Promise<{ ok: boolean; error?: string }>;
  createEmployee: (data: { name: string; email: string; employeeNumber?: string; password?: string; supervisorId?: string | null; role: Role; isActive?: boolean; avatar?: string }) => Promise<{ ok: boolean; error?: string; id?: string }>;
  deleteEmployee: (id: string) => Promise<{ ok: boolean; error?: string }>;
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
  planCustomTargets: Array<{name: string, value: string, unit: string}>; setPlanCustomTargets: (v: Array<{name: string, value: string, unit: string}>) => void;
  cascadeTargets: string[]; setCascadeTargets: (v: string[]) => void;
  cascadePortions: Record<string,string>; setCascadePortions: (v: Record<string,string>) => void;
  cascadeTitles: Record<string,string>; setCascadeTitles: (v: Record<string,string>) => void;
  realForm: { title: string; value: string; description: string; date: string; time: string; files: Array<{fileName: string, filePath: string, fileSize: string}>; targets: Array<{name: string, value: string, unit: string}>; participants: Array<{employeeId?: string, customName?: string, role: string}> }; setRealForm: (v: { title: string; value: string; description: string; date: string; time: string; files: Array<{fileName: string, filePath: string, fileSize: string}>; targets: Array<{name: string, value: string, unit: string}>; participants: Array<{employeeId?: string, customName?: string, role: string}> }) => void;
  editingRealization: Realization | null; setEditingRealization: (r: Realization | null) => void;
  periodForm: { name: string; year: number; startDate: string; endDate: string }; setPeriodForm: (v: { name: string; year: number; startDate: string; endDate: string }) => void;
  empForm: { name: string; email: string; supervisorId: string; role: Role }; setEmpForm: (v: { name: string; email: string; supervisorId: string; role: Role }) => void;
  // handlers
  handleCreatePlan: () => void;
  handleCascade: () => void;
  handleUpdateDelegation: (id: string, target: string, title?: string) => void;
  handleDeleteDelegation: (id: string, title: string) => Promise<void>;
  handleSubmitRealization: () => void;
  handleEditRealization: () => void;
  handleDeleteRealization: (id: string, title: string) => Promise<void>;
  handleDeleteAttachment: (id: string, fileName: string) => Promise<void>;
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
  const [editingRealization, setEditingRealization] = useState<Realization | null>(null);
  const [editingPlan, setEditingPlan] = useState<PerformancePlan | null>(null);
  const [search, setSearch] = useState("");
  const [planForm, setPlanForm] = useState<PlanForm>({ title: "", target: "", skpPeriodId: "sp2026", plannedDate: "", plannedTime: "" });
  const [planCustomTargets, setPlanCustomTargets] = useState<Array<{name: string, value: string, unit: string}>>([]);
  const [cascadeTargets, setCascadeTargets] = useState<string[]>([]);
  const [cascadePortions, setCascadePortions] = useState<Record<string,string>>({});
  const [cascadeTitles, setCascadeTitles] = useState<Record<string,string>>({});
  const [realForm, setRealForm] = useState({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [] as Array<{fileName: string, filePath: string, fileSize: string}>, targets: [] as Array<{name: string, value: string, unit: string}>, participants: [] as Array<{employeeId?: string, customName?: string, role: string}> });
  const [periodForm, setPeriodForm] = useState({ name: "", year: 2026, startDate: "", endDate: "" });
  const [empForm, setEmpForm] = useState({ name: "", email: "", supervisorId: "", role: "staf" as Role });
  const [dbLoaded, setDbLoaded] = useState(false);

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
    }).catch(() => {}).finally(() => setDbLoaded(true));
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
    if (currentUser.role === "admin" || currentUser.role === "pimpinan_1") return plans;
    // Semua pegawai (termasuk staf) dapat melihat: tugas sendiri, tugas yang dibuatnya, dan tugas tim/bawahan
    const subs = getSubordinates(currentUser.id).map(s => s.id);
    return plans.filter(p => p.assignedTo === currentUser.id || p.createdBy === currentUser.id || subs.includes(p.assignedTo));
  }, [currentUser, plans, employees]);

  const filteredPlans = visiblePlans.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  // Hanya rencana yang ditugaskan KEpada user ini (tugas pribadi)
  const myPlans = useMemo(() => currentUser ? plans.filter(p => p.assignedTo === currentUser.id) : [], [currentUser, plans]);

  const handleCreatePlan = () => {
    if (!currentUser) return;
    if (!planForm.title) { notify("Judul wajib diisi"); return; }
    // Target seperti form realisasi: jika rincian target diisi -> target otomatis = jumlah baris, else wajib isi target jumlah manual
    let effectiveTarget: string;
    if (planCustomTargets.length > 0) {
      effectiveTarget = String(planCustomTargets.length);
    } else {
      if (!planForm.target) { notify("Target wajib diisi — atau isi Rincian Target di bawah"); return; }
      effectiveTarget = String(planForm.target).trim();
      if (!effectiveTarget) { notify("Target wajib diisi"); return; }
    }
    if (planCustomTargets.length > 5) { notify("Maksimal 5 target kustom"); return; }
    for (const ct of planCustomTargets) {
      if (!ct.name.trim() || ct.name.trim().length > 50) { notify("Nama target kustom 1-50 karakter"); return; }
      if (!ct.value.trim()) { notify("Nilai target kustom wajib"); return; }
      if (!ct.unit.trim() || ct.unit.trim().length > 20) { notify("Satuan target kustom 1-20 karakter"); return; }
    }
    // fallback aman: jika skpPeriodId tidak ada di perioden aktif (mis. sp1 lama), pakai periode pertama
    const validPeriodId = periods.find(p => p.id === planForm.skpPeriodId)?.id ?? periods[0]?.id ?? "sp2026";
    // Validasi tanggal rencana akan dijalankan (opsional tapi jika diisi harus valid)
    const plannedDateVal = (planForm as any).plannedDate?.trim() || "";
    const plannedTimeVal = (planForm as any).plannedTime?.trim() || "";
    if (plannedDateVal && !/^\d{4}-\d{2}-\d{2}$/.test(plannedDateVal)) { notify("Format tanggal rencana harus YYYY-MM-DD"); return; }
    if (plannedTimeVal && !/^\d{2}:\d{2}$/.test(plannedTimeVal)) { notify("Format jam rencana harus HH:mm"); return; }
    if (plannedDateVal && plannedTimeVal && (Number(plannedTimeVal.split(":")[0]) > 23 || Number(plannedTimeVal.split(":")[1]) > 59)) { notify("Jam rencana tidak valid"); return; }
    const now = new Date();
    const createdAtVal = editingPlan ? editingPlan.createdAt : `${now.toISOString().slice(0,10)} ${now.toTimeString().slice(0,5)}`;
    const newPlan: PerformancePlan = {
      id: "pl" + Date.now(), parentId: editingPlan ? editingPlan.parentId : null,
      skpPeriodId: validPeriodId, createdBy: currentUser.id, assignedTo: currentUser.id,
      title: planForm.title!, target: effectiveTarget, progress: 0,
      createdAt: createdAtVal,
      plannedDate: plannedDateVal || null,
      plannedTime: plannedTimeVal || null,
      customTargets: planCustomTargets.map(ct => ({ id: "ct" + Date.now() + Math.random().toString(36).slice(2,5), name: ct.name.trim(), value: ct.value.trim(), unit: ct.unit.trim() }))
    };
    if (editingPlan) {
      const prevTargets = editingPlan.customTargets ?? [];
      const prevPlannedDate = (editingPlan as any).plannedDate ?? null;
      const prevPlannedTime = (editingPlan as any).plannedTime ?? null;
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, title: newPlan.title, target: newPlan.target, customTargets: newPlan.customTargets, plannedDate: newPlan.plannedDate, plannedTime: newPlan.plannedTime, id: editingPlan.id } : p));
      fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: editingPlan.id, title: newPlan.title, target: newPlan.target, customTargets: newPlan.customTargets, plannedDate: newPlan.plannedDate, plannedTime: newPlan.plannedTime }) }).then(async r => { if (!r.ok) { const j = await r.json().catch(()=>({})); notify("Gagal simpan ke database: " + (j.error || r.statusText)); setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, customTargets: prevTargets, plannedDate: prevPlannedDate, plannedTime: prevPlannedTime } : p)); }}).catch(() => { notify("Gagal simpan ke database"); setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, customTargets: prevTargets, plannedDate: prevPlannedDate, plannedTime: prevPlannedTime } : p)); });
      addLog("Mengubah rencana", `Mengubah rencana '${newPlan.title}'`, "performance_plan", editingPlan.id); notify("Rencana diperbarui");
    } else {
      setPlans(prev => [newPlan, ...prev]);
      fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...newPlan, log: false, customTargets: newPlan.customTargets, plannedDate: newPlan.plannedDate, plannedTime: newPlan.plannedTime, createdAt: newPlan.createdAt }) }).then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(()=>({}));
          const detail = j.details ? JSON.stringify(j.details).slice(0,200) : "";
          notify("Gagal simpan: " + (j.error || r.statusText) + (detail ? " " + detail : ""));
          setPlans(prev => prev.filter(p => p.id !== newPlan.id));
        } else {
          const saved = await r.json().catch(()=>null);
          if (saved && saved.id && saved.id !== newPlan.id) {
            // replace optimistic id with real id
            setPlans(prev => prev.map(p => p.id === newPlan.id ? { ...p, id: saved.id, customTargets: saved.customTargets ?? newPlan.customTargets } : p));
          } else if (saved?.customTargets) {
            setPlans(prev => prev.map(p => p.id === newPlan.id ? { ...p, customTargets: saved.customTargets } : p));
          }
          // refresh untuk dapat id customTargets yang benar
          fetch("/api/db").then(r=>r.ok?r.json():null).then(d=>{ if(d?.plans) setPlans(d.plans); }).catch(()=>{});
          notify("Rencana kinerja dibuat — tersimpan di database");
        }
      }).catch(() => { notify("Gagal simpan ke database (jaringan)"); setPlans(prev => prev.filter(p => p.id !== newPlan.id)); });
      addLog("Membuat rencana", `Membuat rencana '${newPlan.title}'`, "performance_plan", newPlan.id);
    }
    setShowPlanModal(false); setEditingPlan(null); setPlanForm({ title: "", target: "", skpPeriodId: periods[0]?.id ?? "sp2026", plannedDate: "", plannedTime: "" }); setPlanCustomTargets([]);
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
    // mode edit: delegasikan ke handleEdit
    if (editingRealization) { handleEditRealization(); return; }
    if (!showRealizationModal) return;
    const titleTrim = realForm.title.trim();
    if (!titleTrim) { notify("Judul realisasi wajib diisi"); return; }
    if (titleTrim.length < 3) { notify("Judul minimal 3 karakter"); return; }
    if (titleTrim.length > 200) { notify("Judul maksimal 200 karakter"); return; }
    if (realForm.description && realForm.description.length > 1000) { notify("Deskripsi maksimal 1000 karakter"); return; }
    // validasi milik sendiri: hanya boleh tambah di rencana assignedTo == saya
    if (showRealizationModal.assignedTo !== currentUser.id) { notify("Hanya pemilik tugas yang dapat menambah realisasi"); return; }
    const plan = showRealizationModal;
    const valNum = 1;
    const dateVal = realForm.date?.trim() || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) { notify("Format tanggal harus YYYY-MM-DD"); return; }
    const dCheck = new Date(dateVal);
    if (isNaN(dCheck.getTime())) { notify("Tanggal tidak valid"); return; }
    // cek periode: tanggal harus dalam periode rencana
    const period = periods.find(p => p.id === plan.skpPeriodId);
    if (period && (dateVal < period.startDate || dateVal > period.endDate)) {
      notify(`Tanggal harus dalam periode ${period.name} (${period.startDate} s/d ${period.endDate})`);
      return;
    }
    const timeVal = (realForm.time?.trim() || new Date().toTimeString().slice(0,5));
    if (!/^\d{2}:\d{2}$/.test(timeVal) || Number(timeVal.split(":")[0]) > 23 || Number(timeVal.split(":")[1]) > 59) {
      notify("Format jam harus HH:mm 24 jam (00:00 - 23:59)");
      return;
    }
    if (realForm.files.length > 5) { notify("Maksimal 5 bukti per realisasi"); return; }
    if (realForm.targets.length > 5) { notify("Maksimal 5 target per realisasi"); return; }
    for (const t of realForm.targets) {
      if (!t.name.trim() || t.name.trim().length > 50) { notify("Nama target 1-50 karakter"); return; }
      if (!t.value.trim()) { notify("Nilai target wajib diisi"); return; }
      if (!t.unit.trim() || t.unit.trim().length > 20) { notify("Satuan target 1-20 karakter"); return; }
    }
    if (realForm.participants.length > 10) { notify("Maksimal 10 pegawai terlibat"); return; }
    // Validasi duplikat berdasarkan employeeId atau customName
    const pKeys = realForm.participants.map(p => p.employeeId ? `id:${p.employeeId}` : `custom:${(p.customName||"").toLowerCase().trim()}`);
    if (new Set(pKeys).size !== pKeys.length) { notify("Pegawai terlibat tidak boleh duplikat"); return; }
    for (const p of realForm.participants) {
      const hasEmployee = !!p.employeeId;
      const hasCustom = !!(p.customName && p.customName.trim());
      if (!hasEmployee && !hasCustom) { notify("Isi nama pegawai terlibat (ketik nama, pilih dari daftar jika ada)"); return; }
      if (hasEmployee && hasCustom) { notify("Peserta tidak boleh punya employeeId dan customName bersamaan"); return; }
      if (!p.role.trim() || p.role.trim().length > 30) { notify("Peran 1-30 karakter"); return; }
    }
    const r: Realization = { id: "r" + Date.now(), planId: plan.id, title: titleTrim, value: String(valNum), description: realForm.description, date: dateVal, time: timeVal, uploadedBy: currentUser.id, targets: realForm.targets.map(t=>({ id: "rt"+Date.now()+Math.random().toString(36).slice(2,5), name: t.name.trim(), value: t.value.trim(), unit: t.unit.trim() })), participants: realForm.participants.map(p=>({ id:"rp"+Date.now()+Math.random().toString(36).slice(2,5), employeeId: p.employeeId || null, customName: p.customName?.trim() || null, role:p.role.trim() } as any)) };
    const nextReals = [r, ...realizations];
    // untuk plan yang punya anak, progress = (langsung + anak)/target
    const newProgress = calcPlanProgress(plan.id, plans, nextReals);
    setRealizations(nextReals);
    // jangan buat optimistic attachment dengan id palsu — biar sinkron dari DB setelah POST berhasil
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
    fetch("/api/realizations", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ planId: plan.id, title: r.title, value: r.value, description: r.description, date: r.date, time: r.time, files: realForm.files, fileNames: realForm.files.map(f=>f.fileName), uploadedBy: currentUser.id, progress: newProgress, targets: realForm.targets, participants: realForm.participants }) }).then(async res => {
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        notify("Gagal simpan realisasi: " + (j.error || res.statusText));
        // rollback optimistic
        setRealizations(prev => prev.filter(x => x.id !== r.id));
        setAttachments(prev => prev.filter(a => a.realizationId !== r.id));
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, progress: plans.find(pp=>pp.id===plan.id)?.progress ?? p.progress } : p));
      } else {
        const saved = await res.json().catch(()=>null);
        if (saved && saved.id && saved.id !== r.id) {
          // ganti id optimistic dengan id asli dari DB
          setRealizations(prev => prev.map(x => x.id === r.id ? { ...saved, planId: saved.planId, title: saved.title, value: saved.value, description: saved.description, date: saved.date, time: (saved as any).time ?? r.time, uploadedBy: saved.uploadedBy } as Realization : x));
          setAttachments(prev => prev.map(a => a.realizationId === r.id ? { ...a, realizationId: saved.id } : a));
        }
        // sinkronkan attachments/plans/realizations dari DB untuk dapat id asli attachments
        fetch("/api/db").then(r=>r.ok?r.json():null).then(d=>{
          if (!d) return;
          if (d.attachments?.length) setAttachments(d.attachments);
          if (d.realizations?.length) setRealizations(d.realizations);
          if (d.plans?.length) setPlans(d.plans);
        }).catch(()=>{});
      }
    }).catch(() => {
      notify("Gagal simpan realisasi");
      setRealizations(prev => prev.filter(x => x.id !== r.id));
      setAttachments(prev => prev.filter(a => a.realizationId !== r.id));
    });
    addLog("Mengirim realisasi", `Mengirim realisasi "${r.title}" untuk '${plan.title}'`, "realization", r.id); notify(`Realisasi dikirim — progress jadi ${newProgress}%`); setShowRealizationModal(null); setEditingRealization(null); setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: [], participants: [] });
  };

  const handleEditRealization = () => {
    if (!currentUser || !editingRealization) return;
    const titleTrim = realForm.title.trim();
    if (!titleTrim) { notify("Judul realisasi wajib diisi"); return; }
    if (titleTrim.length < 3) { notify("Judul minimal 3 karakter"); return; }
    if (titleTrim.length > 200) { notify("Judul maksimal 200 karakter"); return; }
    if (realForm.description && realForm.description.length > 1000) { notify("Deskripsi maksimal 1000 karakter"); return; }
    if (editingRealization.uploadedBy && editingRealization.uploadedBy !== currentUser.id) { notify("Hanya penulis yang dapat mengubah realisasi ini"); return; }
    if (!editingRealization.uploadedBy) { notify("Realisasi lama tanpa penulis — tidak dapat diubah"); return; }
    const dateVal = realForm.date?.trim() || editingRealization.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) { notify("Format tanggal harus YYYY-MM-DD"); return; }
    const dCheck = new Date(dateVal);
    if (isNaN(dCheck.getTime())) { notify("Tanggal tidak valid"); return; }
    const planForPeriod = plans.find(p => p.id === editingRealization.planId);
    const period = planForPeriod ? periods.find(p => p.id === planForPeriod.skpPeriodId) : null;
    if (period && (dateVal < period.startDate || dateVal > period.endDate)) {
      notify(`Tanggal harus dalam periode ${period.name} (${period.startDate} s/d ${period.endDate})`);
      return;
    }
    const timeVal = (realForm.time?.trim() || editingRealization.time || "09:00");
    if (!/^\d{2}:\d{2}$/.test(timeVal) || Number(timeVal.split(":")[0]) > 23 || Number(timeVal.split(":")[1]) > 59) {
      notify("Format jam harus HH:mm 24 jam (00:00 - 23:59)");
      return;
    }
    if (realForm.files.length > 0) {
      const existingCount = attachments.filter(a => a.realizationId === editingRealization.id).length;
      if (existingCount + realForm.files.length > 5) {
        notify(`Maksimal 5 bukti per realisasi (sudah ada ${existingCount}, tambah ${realForm.files.length} melebihi batas)`);
        return;
      }
    }
    if (realForm.targets.length > 5) { notify("Maksimal 5 target per realisasi"); return; }
    for (const t of realForm.targets) {
      if (!t.name.trim() || t.name.trim().length > 50) { notify("Nama target 1-50 karakter"); return; }
      if (!t.value.trim()) { notify("Nilai target wajib diisi"); return; }
      if (!t.unit.trim() || t.unit.trim().length > 20) { notify("Satuan target 1-20 karakter"); return; }
    }
    if (realForm.participants.length > 10) { notify("Maksimal 10 pegawai terlibat"); return; }
    const updPKeys = realForm.participants.map(p => p.employeeId ? `id:${p.employeeId}` : `custom:${(p.customName||"").toLowerCase().trim()}`);
    if (new Set(updPKeys).size !== updPKeys.length) { notify("Pegawai terlibat tidak boleh duplikat"); return; }
    for (const p of realForm.participants) {
      const hasEmployee = !!p.employeeId;
      const hasCustom = !!(p.customName && p.customName.trim());
      if (!hasEmployee && !hasCustom) { notify("Isi nama pegawai terlibat (ketik nama, pilih dari daftar jika ada)"); return; }
      if (!p.role.trim() || p.role.trim().length > 30) { notify("Peran 1-30 karakter"); return; }
    }
    const updated: Realization = { ...editingRealization, title: titleTrim, description: realForm.description, date: dateVal, time: timeVal, targets: realForm.targets.map(t=>({ id: t.name+Date.now(), name: t.name.trim(), value: t.value.trim(), unit: t.unit.trim() })), participants: realForm.participants.map(p=>({ id:"rp"+Date.now()+Math.random().toString(36).slice(2,5), employeeId: p.employeeId || null, customName: p.customName?.trim() || null, role:p.role.trim() } as any)) };
    const addedFiles = [...realForm.files];
    setRealizations(prev => prev.map(r => r.id === editingRealization.id ? updated : r));
    // jangan buat optimistic attachment — tunggu refetch dari DB setelah PATCH
    fetch("/api/realizations", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: updated.id, title: updated.title, description: updated.description, date: updated.date, time: updated.time, files: addedFiles, fileNames: addedFiles.map(f=>f.fileName), targets: realForm.targets, participants: realForm.participants }) }).then(async r => {
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        notify("Gagal ubah: " + (j.error || r.statusText));
        setRealizations(prev => prev.map(x => x.id === updated.id ? editingRealization : x));
        // rollback optimistic attachments
        if (addedFiles.length) {
          setAttachments(prev => prev.filter(a => !addedFiles.some(f=> a.fileName===f.fileName && a.realizationId===updated.id && a.id.startsWith("a"))));
        }
      } else {
        notify("Realisasi diperbarui");
        addLog("Mengubah realisasi", `Mengubah "${updated.title}"`, "realization", updated.id);
        // sinkronkan attachments & realizations untuk dapat id asli & jam terbaru
        fetch("/api/db").then(r=>r.ok?r.json():null).then(d=>{
          if (d?.attachments) setAttachments(d.attachments);
          if (d?.realizations) setRealizations(d.realizations);
        }).catch(()=>{});
      }
    }).catch(() => {
      notify("Gagal ubah realisasi");
      setRealizations(prev => prev.map(x => x.id === updated.id ? editingRealization : x));
    });
    setShowRealizationModal(null); setEditingRealization(null); setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: [], participants: [] });
  };

  const handleDeleteRealization = async (id: string, title: string) => {
    if (!currentUser) return;
    const target = realizations.find(r => r.id === id);
    if (!target) { notify("Realisasi tidak ditemukan"); return; }
    // cek hak hapus: penulis, atasan, atau admin/pimpinan_1
    const plan = plans.find(p => p.id === target.planId);
    const ownerId = target.uploadedBy ?? plan?.assignedTo ?? null;
    const isAuthor = !!target.uploadedBy && target.uploadedBy === currentUser.id;
    const isAdmin = ["admin", "pimpinan_1"].includes(currentUser.role);
    const isSuperior = ownerId ? isSubordinate(currentUser.id, ownerId) : false;
    if (!isAuthor && !isSuperior && !isAdmin) { notify("Hanya penulis atau atasan yang dapat menghapus realisasi ini"); return; }
    if (!target.uploadedBy && !isAdmin && !isSuperior) { notify("Realisasi lama tanpa penulis — hanya atasan/admin yang dapat menghapus"); return; }
    const planId = target.planId;
    const backupReals = realizations;
    const backupAtts = attachments;
    const backupPlans = plans;
    // optimistic: hapus realisasi + attachments terkait
    const nextReals = realizations.filter(r => r.id !== id);
    setRealizations(nextReals);
    setAttachments(prev => prev.filter(a => a.realizationId !== id));
    // hitung ulang progress untuk plan + induk
    const newProgress = calcPlanProgress(planId, plans, nextReals);
    let optimisticPlans = plans.map(p => p.id === planId ? { ...p, progress: newProgress } : p);
    // propagate ke induk
    let cur: string | null = optimisticPlans.find(p => p.id === planId)?.parentId ?? null;
    while (cur) {
      const np = calcParentProgress(cur, optimisticPlans, nextReals);
      if (np === null) break;
      const par = optimisticPlans.find(p => p.id === cur);
      if (!par || par.progress === np) { cur = par?.parentId ?? null; continue; }
      optimisticPlans = optimisticPlans.map(p => p.id === cur ? { ...p, progress: np } : p);
      cur = par.parentId;
    }
    setPlans(optimisticPlans);
    try {
      const res = await fetch("/api/realizations", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      // server sudah hitung ulang progress; sinkronkan plan progress yang sudah di-optimistic ke DB (planId + ancestors)
      fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: planId, progress: newProgress }) }).catch(()=>{});
      let walk: string | null = plans.find(p=>p.id===planId)?.parentId ?? null;
      while (walk) {
        const np = calcParentProgress(walk, optimisticPlans, nextReals);
        if (np !== null) fetch("/api/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: walk, progress: np }) }).catch(()=>{});
        walk = plans.find(p=>p.id===walk)?.parentId ?? null;
      }
      addLog("Menghapus realisasi", `Menghapus "${title}"`, "realization", id);
      notify(`Realisasi "${title.slice(0,20)}" terhapus — progress jadi ${newProgress}%`);
    } catch (e: any) {
      setRealizations(backupReals);
      setAttachments(backupAtts);
      setPlans(backupPlans);
      notify("Gagal hapus: " + (e?.message || "error"));
    }
  };

  const handleDeleteAttachment = async (id: string, fileName: string) => {
    if (!currentUser) return;
    const target = attachments.find(a => a.id === id);
    if (!target) { notify("Bukti tidak ditemukan"); return; }
    // cek hak: pengunggah, penulis realisasi, atasan, admin/pimpinan_1
    const isUploader = target.uploadedBy === currentUser.id;
    const isAdmin = ["admin", "pimpinan_1"].includes(currentUser.role);
    let isSuperior = false;
    let isRealAuthor = false;
    if (target.realizationId) {
      const real = realizations.find(r => r.id === target.realizationId);
      if (real?.uploadedBy === currentUser.id) isRealAuthor = true;
      const ownerId = real?.uploadedBy ?? target.uploadedBy;
      if (ownerId && ownerId !== currentUser.id) {
        isSuperior = isSubordinate(currentUser.id, ownerId);
      }
      if (isSubordinate(currentUser.id, target.uploadedBy)) isSuperior = true;
    } else {
      isSuperior = isSubordinate(currentUser.id, target.uploadedBy);
    }
    if (!isUploader && !isRealAuthor && !isSuperior && !isAdmin) {
      notify("Hanya pengunggah, penulis, atau atasan yang dapat menghapus bukti");
      return;
    }
    const backup = attachments;
    setAttachments(prev => prev.filter(a => a.id !== id));
    try {
      const res = await fetch("/api/attachments", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      addLog("Menghapus bukti", `Menghapus bukti "${fileName}"`, "attachment", id);
      notify(`Bukti "${fileName.slice(0,20)}" dihapus`);
    } catch (e: any) {
      setAttachments(backup);
      notify("Gagal hapus bukti: " + (e?.message || "error"));
    }
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

  // ===== CRUD Akun & Organisasi (admin bebas; pimpinan sesuai subtree, otorisasi server) =====
  const updateEmployee = async (id: string, patch: { name?: string; email?: string; employeeNumber?: string; password?: string; supervisorId?: string | null; role?: Role; isActive?: boolean; avatar?: string }) => {
    if (!currentUser || !canCreateAnyRole(currentUser.role)) { notify("Anda tidak berwenang mengubah akun pegawai"); return { ok: false, error: "no_permission" }; }
    if (id === currentUser.id) { notify("Tidak bisa mengubah akun sendiri"); return { ok: false, error: "self" }; }
    const target = employees.find(e => e.id === id);
    if (!target) return { ok: false, error: "Pegawai tidak ditemukan" };
    if (patch.role !== undefined || patch.supervisorId !== undefined) {
      const check = validateOrgChange(employees, id, target, { role: patch.role, supervisorId: patch.supervisorId });
      if (!check.ok) { notify(check.error || "Relasi organisasi tidak valid"); return { ok: false, error: check.error }; }
    }
    const backup = employees;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    try {
      const res = await fetch("/api/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id, ...patch }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      addLog("Mengubah akun/pegawai", `Perbarui ${target.name.split(",")[0]}${patch.role ? " → " + patch.role : ""}`, "employee", id);
      notify("Data akun & organisasi diperbarui");
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setEmployees(backup);
      notify("Gagal update: " + msg);
      return { ok: false, error: msg };
    }
  };

  const createEmployee = async (data: { name: string; email: string; employeeNumber?: string; password?: string; supervisorId?: string | null; role: Role; isActive?: boolean; avatar?: string }) => {
    if (!currentUser) { notify("Tidak terautentikasi"); return { ok: false, error: "unauthorized" }; }
    if (!canCreateAnyRole(currentUser.role)) { notify("Staf tidak berwenang membuat akun"); return { ok: false, error: "no_permission" }; }
    const optimisticId = "e-new-" + Date.now();
    const check = validateOrgCreate(employees, { id: optimisticId, role: data.role, supervisorId: data.supervisorId || null });
    if (!check.ok) { notify(check.error || "Relasi organisasi tidak valid"); return { ok: false, error: check.error }; }
    const newEmp: Employee = {
      id: optimisticId, userId: "u-new-" + Date.now(),
      employeeNumber: data.employeeNumber ?? "199" + Math.floor(Math.random() * 1e7),
      name: data.name, email: data.email, supervisorId: data.supervisorId || null,
      role: data.role, avatar: data.avatar ?? data.name.slice(0, 2).toUpperCase(), isActive: data.isActive ?? true,
    };
    const backup = employees;
    setEmployees(prev => [newEmp, ...prev]);
    try {
      const res = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      if (j.id && j.id !== optimisticId) setEmployees(prev => prev.map(e => e.id === optimisticId ? { ...e, id: j.id } : e));
      addLog("Menambah pegawai", `Menambah pegawai ${newEmp.name}`, "employee", j.id || optimisticId);
      notify(`Pegawai ${newEmp.name.split(",")[0]} ditambahkan`);
      return { ok: true, id: j.id || optimisticId };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setEmployees(backup);
      notify("Gagal tambah: " + msg);
      return { ok: false, error: msg };
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!currentUser || !canCreateAnyRole(currentUser.role)) { notify("Anda tidak berwenang menghapus akun pegawai"); return { ok: false, error: "no_permission" }; }
    const target = employees.find(e => e.id === id);
    if (!target) return { ok: false, error: "Pegawai tidak ditemukan" };
    if (id === currentUser.id) { notify("Tidak bisa menghapus diri sendiri"); return { ok: false, error: "self" }; }
    if (target.role === "pimpinan_1") { notify("Tidak bisa menghapus Direktur (pimpinan_1) — harus selalu ada 1 Direktur"); return { ok: false, error: "satu direktur wajib" }; }
    const subs = getDirectSubordinates(id);
    if (subs.length > 0) { notify(`Pegawai masih punya ${subs.length} bawahan — pindahkan dulu`); return { ok: false, error: "masih ada bawahan" }; }
    const hasPlans = plans.some(p => p.assignedTo === id || p.createdBy === id);
    if (hasPlans) { notify("Pegawai masih terkait rencana kinerja — hapus/pindahkan dulu"); return { ok: false, error: "masih terkait rencana" }; }
    const backup = employees;
    setEmployees(prev => prev.filter(e => e.id !== id));
    try {
      const res = await fetch("/api/employees", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      addLog("Menghapus pegawai", `Menghapus ${target.name}`, "employee", id);
      notify(`${target.name.split(",")[0]} dihapus`);
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setEmployees(backup);
      notify("Gagal hapus: " + msg);
      return { ok: false, error: msg };
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
    currentUser, setCurrentUser, authChecked, dbLoaded, login, logout, employees, setEmployees,
    updateEmployee, createEmployee, deleteEmployee,
    periods, setPeriods, plans, setPlans, realizations, setRealizations, attachments, setAttachments, logs, setLogs,
    toast, notify, addLog, isSubordinate, getSubordinates, getDirectSubordinates, visiblePlans, filteredPlans, myPlans, search, setSearch,
    showPlanModal, setShowPlanModal, showCascadeModal, setShowCascadeModal, showRealizationModal, setShowRealizationModal,
    editingPlan, setEditingPlan, planForm, setPlanForm, planCustomTargets, setPlanCustomTargets, cascadeTargets, setCascadeTargets, cascadePortions, setCascadePortions, cascadeTitles, setCascadeTitles, realForm, setRealForm, editingRealization, setEditingRealization, periodForm, setPeriodForm, empForm, setEmpForm,
    handleCreatePlan, handleCascade, handleUpdateDelegation, handleDeleteDelegation, handleSubmitRealization, handleEditRealization, handleDeleteRealization, handleDeleteAttachment, handleDeletePlan,
  };
  return <SKPContext.Provider value={value}>{children}</SKPContext.Provider>;
}