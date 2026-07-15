"use client";
import { useState, useEffect } from "react";
interface Item { id: string; name: string; }
export default function ToolsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => fetch("/api/tools").then(r => r.json()).then(setItems);
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); setSaving(false); load();
  };
  const del = async (id: string) => { await fetch(`/api/tools/${id}`, { method: "DELETE" }); load(); };
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tools</h1>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">+ Add</button>
      </form>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 && <p className="px-4 py-8 text-center text-gray-400">No tools yet.</p>}
        {items.map((item, i) => (
          <div key={item.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
            <span className="text-sm font-medium text-gray-800">{item.name}</span>
            <button onClick={() => del(item.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
