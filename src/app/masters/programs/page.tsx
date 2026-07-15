"use client";
import { useState, useEffect } from "react";
interface Design { id: string; name: string; }
interface Program { id: string; name: string; design: { name: string }; }
export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [form, setForm] = useState({ name: "", designId: "" });
  const [saving, setSaving] = useState(false);
  const load = () => fetch("/api/programs").then(r => r.json()).then(setPrograms);
  useEffect(() => {
    load();
    fetch("/api/designs").then(r => r.json()).then(setDesigns);
  }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.designId) return;
    setSaving(true);
    await fetch("/api/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", designId: "" }); setSaving(false); load();
  };
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Programs</h1>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Program name"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        <select value={form.designId} onChange={e => setForm(p => ({ ...p, designId: e.target.value }))}
          className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required>
          <option value="">Design...</option>
          {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">+ Add</button>
      </form>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            {["Program Name","Design",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {programs.map(p => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.design.name}</td>
                <td className="px-4 py-3"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
