"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ActiveShift { id: string; shiftNumber: number; date: string; operatorName: string; }

const NAV = [
  { href: "/",          label: "Dashboard",    icon: "⬛" },
  { href: "/shift",     label: "Shift",        icon: "🔄" },
  { href: "/production/new", label: "New Slab", icon: "➕" },
  { href: "/production",label: "Production",   icon: "📋" },
  { href: "/delays",    label: "Delays",       icon: "⏱" },
  { href: "/reports",   label: "Reports",      icon: "📊" },
];

const MASTERS = [
  { href: "/masters/designs",     label: "Designs" },
  { href: "/masters/programs",    label: "Programs" },
  { href: "/masters/tools",       label: "Tools" },
  { href: "/masters/liquids",     label: "Liquids" },
  { href: "/masters/powders",     label: "Powders" },
  { href: "/masters/machines",    label: "Machines" },
  { href: "/masters/delay-codes", label: "Delay Codes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [mastersOpen, setMastersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => setShift(s));
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-52 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-700">
        <p className="text-base font-bold tracking-wide text-white">ROBO-MODULE</p>
        <p className="text-xs text-gray-400 mt-0.5">Manufacturing ERP</p>
      </div>

      {/* Shift badge */}
      <div className="px-3 py-3 border-b border-gray-700">
        {shift ? (
          <Link href="/shift" className="block bg-green-600 hover:bg-green-500 rounded-lg px-3 py-2 transition">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-xs font-semibold text-white">Shift {shift.shiftNumber} Active</span>
            </div>
            <p className="text-xs text-green-200 mt-0.5 truncate">{shift.operatorName}</p>
          </Link>
        ) : (
          <Link href="/shift/start" className="block bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition">
            <p className="text-xs text-gray-300">No Active Shift</p>
            <p className="text-xs text-blue-400 mt-0.5">→ Start Shift</p>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              isActive(item.href)
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Masters accordion */}
        <div>
          <button onClick={() => setMastersOpen(o => !o)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              pathname.startsWith("/masters")
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}>
            <span className="text-base leading-none">⚙️</span>
            <span className="flex-1 text-left">Masters</span>
            <span className="text-xs">{mastersOpen ? "▲" : "▼"}</span>
          </button>
          {mastersOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5">
              {MASTERS.map(m => (
                <Link key={m.href} href={m.href}
                  className={`block px-3 py-1.5 rounded-lg text-xs transition ${
                    pathname === m.href
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}>
                  {m.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">Pacific Group © 2026</p>
      </div>
    </aside>
  );
}
