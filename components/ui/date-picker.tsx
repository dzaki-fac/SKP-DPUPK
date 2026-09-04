"use client";
import * as React from "react";
import { Calendar } from "./calendar";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function parseISO(s: string): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  if (isNaN(dt.getTime())) return undefined;
  dt.setHours(0,0,0,0);
  return dt;
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function formatID(dateStr: string): string {
  const d = parseISO(dateStr);
  if (!d) return dateStr;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function DatePicker({ value, onChange, placeholder = "Pilih tanggal", className, disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = parseISO(value);

  React.useEffect(()=>{
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => { if (e.key==="Escape") setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return ()=>{ document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={()=>setOpen(v=>!v)}
        className="seline-input w-full flex items-center justify-between gap-2 text-left disabled:opacity-50"
      >
        <span className={value ? "text-[#0c0a09]" : "text-[#a8a29e]"}>
          {value ? formatID(value) : placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={e=>{ e.stopPropagation(); onChange(""); }}
              onKeyDown={e=>{ if(e.key==="Enter"){ e.stopPropagation(); onChange(""); } }}
              className="w-5 h-5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09] flex items-center justify-center text-[10px]"
              title="Hapus tanggal"
            >
              ×
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[#a8a29e]"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </span>
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mb-1.5 left-0 bottom-full" onClick={e=>e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d)=>{
              if (!d) { onChange(""); return; }
              onChange(toISODate(d));
              setOpen(false);
            }}
            className="rounded-lg border shadow-lg"
            captionLayout="dropdown"
          />
        </div>
      )}
    </div>
  );
}
