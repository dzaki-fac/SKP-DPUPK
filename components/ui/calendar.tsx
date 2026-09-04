"use client";
import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type CalendarProps = {
  mode?: "single";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  captionLayout?: "dropdown" | "buttons";
  fromYear?: number;
  toYear?: number;
  disabled?: (date: Date) => boolean;
};

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const WEEKDAYS_ID = ["Sn","Sl","Rb","Km","Jm","Sb","Mg"];

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0,0,0,0);
  return c;
}

function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false;
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  captionLayout = "dropdown",
  fromYear = 2020,
  toYear = 2035,
  disabled,
}: CalendarProps) {
  const today = React.useMemo(()=> startOfDay(new Date()), []);
  const [view, setView] = React.useState(()=>{
    const base = selected ?? today;
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  React.useEffect(()=>{
    if (selected) setView({ y: selected.getFullYear(), m: selected.getMonth() });
  }, [selected?.getFullYear(), selected?.getMonth()]);

  const first = new Date(view.y, view.m, 1);
  // Senin-first: JS getDay 0=Min..6=Sab -> offset (getDay+6)%7
  const offset = (first.getDay()+6)%7;
  const daysInMonth = new Date(view.y, view.m+1, 0).getDate();

  const cells: Array<Date|null> = [];
  for(let i=0;i<offset;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(new Date(view.y, view.m, d));

  const years: number[] = [];
  for(let y=fromYear; y<=toYear; y++) years.push(y);

  const go = (dm: number) => {
    setView(v=>{
      const nd = new Date(v.y, v.m+dm, 1);
      const ny = Math.min(Math.max(nd.getFullYear(), fromYear), toYear);
      return { y: ny, m: nd.getMonth() };
    });
  };

  return (
    <div className={cn("rounded-lg border border-[#e8e6e5] bg-white p-3 w-[280px]", className)}>
      {/* Caption */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <button
          type="button"
          onClick={()=>go(-1)}
          className="w-7 h-7 rounded-full border border-[#e8e6e5] flex items-center justify-center text-[#78716c] hover:bg-[#fafaf9] hover:text-[#0c0a09]"
          aria-label="Bulan lalu"
        >
          ‹
        </button>
        {captionLayout === "dropdown" ? (
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            <select
              value={view.m}
              onChange={e=>setView(v=>({...v, m:Number(e.target.value)}))}
              className="text-[13px] font-medium px-1.5 py-1 rounded-md border border-[#e8e6e5] bg-white focus:outline-none focus:border-[#3ba6f1] max-w-[110px]"
            >
              {MONTHS_ID.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
            <select
              value={view.y}
              onChange={e=>setView(v=>({...v, y:Number(e.target.value)}))}
              className="text-[13px] font-medium px-1.5 py-1 rounded-md border border-[#e8e6e5] bg-white focus:outline-none focus:border-[#3ba6f1]"
            >
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        ) : (
          <div className="text-[13px] font-medium text-[#0c0a09]">{MONTHS_ID[view.m]} {view.y}</div>
        )}
        <button
          type="button"
          onClick={()=>go(1)}
          className="w-7 h-7 rounded-full border border-[#e8e6e5] flex items-center justify-center text-[#78716c] hover:bg-[#fafaf9] hover:text-[#0c0a09]"
          aria-label="Bulan depan"
        >
          ›
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS_ID.map(w=>(
          <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#a8a29e] py-1">{w}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d,i)=>{
          if(!d) return <div key={`e-${i}`} />;
          const sel = mode==="single" && isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const dis = disabled?.(d) ?? false;
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={dis}
              onClick={()=>onSelect?.(sel ? undefined : startOfDay(d))}
              className={cn(
                "h-8 w-8 mx-auto rounded-full text-[13px] flex items-center justify-center transition-colors",
                sel ? "bg-[#0c0a09] text-white font-medium" : "text-[#0c0a09] hover:bg-[#fafaf9] hover:border hover:border-[#e8e6e5]",
                !sel && isToday && "border border-[#3ba6f1] text-[#3ba6f1] font-medium",
                dis && "opacity-30 cursor-not-allowed hover:bg-transparent hover:border-transparent"
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-2 pt-2 border-t border-[#e8e6e5] flex items-center justify-between">
          <span className="text-[11px] text-[#a8a29e]">
            {selected.getDate()} {MONTHS_ID[selected.getMonth()]} {selected.getFullYear()}
          </span>
          <button
            type="button"
            onClick={()=>onSelect?.(undefined)}
            className="text-[11px] text-[#78716c] hover:text-[#0c0a09] hover:underline"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
  );
}
