"use client";
import { useState, useEffect } from "react";

interface Operator { id: string; name: string; isActive: boolean; }

export default function OperatorsPage() {
  const [ops, setOps] = useState<Operator[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/operators").then(r => r.json()).then(setOps);
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError("");
    const res = await fetch("/api/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add operator");
    } else {
      setName("");
    }
    setSaving(false);
    load();
  };

  const toggle = async (op: Operator) => {
    await fetch(`/api/operators/${op.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !op.isActive }),
    });
    load();
  };

  const activeOps = ops.filter(o => o.isActive);
  const inactiveOps = ops.filter(o => !o.isActive);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Operators</h1>

      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter operator name"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          + Add
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ops.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No operators yet. Add one above.</td></tr>
            )}
            {[...activeOps, ...inactiveOps].map(o => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{o.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {o.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(o)}
                    className={`text-xs ${o.isActive ? "text-red-400 hover:text-red-600" : "text-green-500 hover:text-green-700"}`}
                  >
                    {o.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Operators appear in the shift start dropdown. Deactivated operators are hidden from the dropdown but preserved in history.
      </p>
    </div>
  );
}
