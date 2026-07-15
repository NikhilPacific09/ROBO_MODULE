"use client";
import { useState, useEffect } from "react";
interface Operator { id: string; name: string; isActive: boolean; }
export default function OperatorsPage() {
  const [ops, setOps] = useState<Operator[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => fetch("/api/operators").then(r => r.json()).then(setOps);
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/operators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); setSaving(false); load();
  };
  const remove = async (id: string) => { await fetch(`/api/operators/${id}`, { method: "DELETE" }); load(); };
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Operators</h1>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Operator name"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">+ Add</button>
      </form>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            {["Name","Status",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {ops.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No operators yet.</td></tr>}
            {ops.map(o => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{o.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(o.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
