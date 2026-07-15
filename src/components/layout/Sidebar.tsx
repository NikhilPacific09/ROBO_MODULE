"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface ActiveShift {
  id: string;
  date: string;
  shiftNumber: number;
  startedBy: string;
}

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/shift/active", label: "Active Shift", icon: "⚡" },
  { href: "/shift/start", label: "Start Shift", icon: "▶️" },
  { href: "/production/new", label: "New Slab Entry", icon: "➕" },
  { href: "/production", label: "Production Records", icon: "📋" },
  { href: "/batch/new", label: "Batch Setup", icon: "🔧" },
  { href: "/delays", label: "Delay Logging", icon: "⏱️" },
  { href: "/reports", label: "Reports", icon: "📈" },
];

const MASTERS = [
  { href: "/masters/machines",    label: "Machines" },
  { href: "/masters/operators",   label: "Operators" },
  { href: "/masters/designs",     label: "Designs" },
  { href: "/masters/programs",    label: "Programs" },
  { href: "/masters/tools",       label: "Tools" },
  { href: "/masters/liquids",     label: "Liquids" },
  { href: "/masters/powders",     label: "Powders" },
  { href: "/masters/delay-codes", label: "Delay Codes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [mastersOpen, setMastersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/shifts/active")
      .then(r => r.ok ? r.json() : null)
      .then(d => setActiveShift(d))
      .catch(() => {});
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700">
        <p className="text-lg font-bold tracking-tight">🤖 ROBO-MODULE</p>
        <p className="text-xs text-slate-400 mt-0.5">Manufacturing ERP</p>
      </div>

      {/* Shift badge */}
      <div className="px-4 py-3 border-b border-slate-700">
        {activeShift ? (
          <Link href="/shift/active" className="flex items-center gap-2 bg-green-900/40 border border-green-600/40 rounded-lg px-3 py-2 hover:bg-green-900/60 transition">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-green-300">Shift {activeShift.shiftNumber} Active</p>
              <p className="text-xs text-green-400/70 truncate">{activeShift.startedBy}</p>
            </div>
          </Link>
        ) : (
          <Link href="/shift/start" className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 hover:bg-slate-700 transition">
            <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
            <p className="text-xs text-slate-400">No Active Shift</p>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              isActive(href)
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}>
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}

        {/* Masters accordion */}
        <div>
          <button onClick={() => setMastersOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
            <span className="text-base">⚙️</span>
            <span className="flex-1 text-left">Masters</span>
            <span className="text-slate-500 text-xs">{mastersOpen ? "▲" : "▼"}</span>
          </button>
          {mastersOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
              {MASTERS.map(({ href, label }) => (
                <Link key={href} href={href}
                  className={`block px-2 py-1.5 rounded text-xs transition ${
                    pathname.startsWith(href)
                      ? "text-blue-400 font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">Pacific Group © 2026</p>
      </div>
    </aside>
  );
}
