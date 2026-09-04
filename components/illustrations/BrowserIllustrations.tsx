export function IllustrationLeft() {
 // Seline mascot sticker — hooded outline-only with soft drop shadow
 return (
 <div className="relative select-none pointer-events-none" aria-hidden style={{ filter: " drop-shadow(rgba(0,0,0,0.12) 0px 6px 18px)"}}>
 <svg viewBox="0 0 120 120" width="170" height="170" fill="none" xmlns="http://www.w3.org/2000/svg">
 {/* sticker backing */}
 <rect x="10" y="10" width="100" height="90" rx="16" fill="white" stroke="#e8e6e5" strokeWidth="1.2"/>
 {/* hooded character peek */}
 <path d="M46 72 C46 48 74 48 74 72 L62 78 L58 68 L62 62 L58 54 L50 62 L54 68 L46 72Z" stroke="#0c0a09" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 <circle cx="56" cy="67" r="1.4" fill="#0c0a09"/>
 <circle cx="66" cy="67" r="1.4" fill="#0c0a09"/>
 <path d="M56 72 Q61 74 66 72" stroke="#0c0a09" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
 {/* cyan spark */}
 <g transform="translate(88 18)">
 <path d="M6 1.5 L7.2 5.2 L11 6 L7.2 6.8 L6 10.5 L4.8 6.8 L1 6 L4.8 5.2 Z" fill="#3ba6f1" stroke="#3398e1" strokeWidth="0.9"/>
 </g>
 {/* tiny dots */}
 <circle cx="28" cy="34" r="1.2" fill="#e8e6e5"/>
 <circle cx="34" cy="28" r="0.9" fill="#d6d3d1"/>
 </svg>
 <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3ba6f1] border-2 border-white flex items-center justify-center text-white text-[10px] font-medium">✓</span>
 </div>
 );
}
export function IllustrationRight() {
 return (
 <div className="relative select-none pointer-events-none" aria-hidden style={{ filter: " drop-shadow(rgba(0,0,0,0.12) 0px 6px 18px)"}}>
 <svg viewBox="0 0 120 120" width="170" height="170" fill="none" xmlns="http://www.w3.org/2000/svg">
 <rect x="10" y="10" width="100" height="90" rx="16" fill="white" stroke="#e8e6e5" strokeWidth="1.2"/>
 {/* browser mock dashed */}
 <rect x="22" y="22" width="76" height="54" rx="8" stroke="#0c0a09" strokeWidth="1.2" fill="white"/>
 <line x1="22" y1="32" x2="98" y2="32" stroke="#e8e6e5" strokeWidth="1"/>
 <circle cx="30" cy="27" r="1.8" fill="#e8e6e5"/>
 <circle cx="36" cy="27" r="1.8" fill="#d6d3d1"/>
 {/* chart bars muted */}
 <rect x="32" y="54" width="10" height="12" rx="2" fill="#c1e1f7" stroke="#3ba6f1" strokeWidth="0.8"/>
 <rect x="46" y="48" width="10" height="18" rx="2" fill="#fafaf9" stroke="#e8e6e5" strokeWidth="0.8"/>
 <rect x="60" y="44" width="10" height="22" rx="2" fill="#0c0a09"/>
 <rect x="74" y="50" width="10" height="16" rx="2" fill="white" stroke="#e8e6e5" strokeWidth="0.8"/>
 {/* hooded peek from behind card */}
 <path d="M84 88 C80 72 96 70 96 88" stroke="#0c0a09" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
 <circle cx="88" cy="80" r="1.2" fill="#0c0a09"/>
 <circle cx="94" cy="80" r="1.2" fill="#0c0a09"/>
 </svg>
 </div>
 );
}
