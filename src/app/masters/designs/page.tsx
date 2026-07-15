"use client";
import { useState, useEffect } from "react";
interface Design { id: string; name: string; seriesName: string | null; programs: { id: string; name: string }[]; }
export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [form, setForm] = useState({ name: "", seriesName: "" });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const load = () => fetch("/api/designs").then(r => r.json()).then(setDesigns);
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", seriesName: "" }); setSaving(false); load();
  };
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Designs</h1>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Design name"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        <input value={form.seriesName} onChange={e => setForm(p => ({ ...p, seriesName: e.target.value }))} placeholder="Series (optional)"
          className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">+ Add</button>
      </form>
      <div className="space-y-2">
        {designs.map(d => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left">
              <div>
                <span className="font-medium text-gray-800">{d.name}</span>
                {d.seriesName && <span className="ml-2 text-xs text-gray-400">{d.seriesName}</span>}
              </div>
              <span className="text-xs text-gray-400">{d.programs.length} programs {expanded === d.id ? "▲" : "▼"}</span>
            </button>
            {expanded === d.id && d.programs.length > 0 && (
              <div className="px-4 pb-3 border-t border-gray-100">
                {d.programs.map(p => <div key={p.id} className="text-sm text-gray-600 py-1 border-b border-gray-50 last:border-0">{p.name}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
