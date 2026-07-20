"use client";
import { useState, useEffect } from "react";

interface DelayCode {
  id: string; code: string; description: string;
  category: string; isRobotSpecific: boolean;
}

const CATEGORY_COLOR: Record<string, string> = {
  ROBOT: "bg-blue-100 text-blue-700", MAINTENANCE: "bg-orange-100 text-orange-700",
  ROYMIX: "bg-emerald-100 text-emerald-700", LINE: "bg-slate-100 text-slate-700",
  DISTRIBUTOR: "bg-purple-100 text-purple-700", PRESS: "bg-rose-100 text-rose-700",
  GENERAL: "bg-gray-100 text-gray-700", POWERCUT: "bg-red-100 text-red-700",
  LINE_START: "bg-teal-100 text-teal-700",
};

const CATEGORY_ICON: Record<string, string> = {
  ROBOT: "🤖", MAINTENANCE: "🔧", ROYMIX: "🏭", LINE: "⚙️",
  DISTRIBUTOR: "📦", PRESS: "🗜️", GENERAL: "📋", POWERCUT: "⚡", LINE_START: "▶️",
};

export default function DelayCodesPage() {
  const [codes, setCodes] = useState<DelayCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-category add form state
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRobotSpecific, setNewRobotSpecific] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/delay-codes").then(r => r.json()).then(data => {
      setCodes(data);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // Group by category
  const grouped: Record<string, DelayCode[]> = {};
  for (const c of codes) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }

  const startAdd = (category: string) => {
    setAddingCategory(category);
    setNewCode("");
    setNewDesc("");
    setNewRobotSpecific(["ROBOT", "MAINTENANCE", "GENERAL"].includes(category));
    setError("");
  };

  const cancelAdd = () => {
    setAddingCategory(null);
    setNewCode("");
    setNewDesc("");
    setError("");
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDesc.trim() || !addingCategory) return;
    setSaving(true); setError("");
    const res = await fetch("/api/delay-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newCode.trim(),
        description: newDesc.trim(),
        category: addingCategory,
        isRobotSpecific: newRobotSpecific,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add");
    } else {
      cancelAdd();
      load();
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Delay Codes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {codes.length} codes across {Object.keys(grouped).length} categories
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span>{CATEGORY_ICON[category] || "📋"}</span>
              <h2 className="font-semibold text-gray-800">{category.replace("_", " ")}</h2>
              <span className="text-xs text-gray-400 ml-1">{items.length}</span>
              <button
                onClick={() => startAdd(category)}
                className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
              >
                + Add
              </button>
            </div>

            {/* Add form for this category */}
            {addingCategory === category && (
              <form onSubmit={submitAdd} className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex gap-2 items-end">
                  <div className="w-24">
                    <label className="block text-xs text-gray-600 mb-1">Code</label>
                    <input value={newCode} onChange={e => setNewCode(e.target.value)}
                      placeholder="e.g. RM13"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      required autoFocus />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                      placeholder="Describe the delay..."
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      required />
                  </div>
                  <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                    <input type="checkbox" checked={newRobotSpecific} onChange={e => setNewRobotSpecific(e.target.checked)}
                      className="rounded border-gray-300" />
                    Robot-specific
                  </label>
                  <button type="submit" disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                    {saving ? "..." : "Add"}
                  </button>
                  <button type="button" onClick={cancelAdd}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </form>
            )}

            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Code", "Description", "Type"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${CATEGORY_COLOR[c.category] || "bg-gray-100 text-gray-700"}`}>
                        {c.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{c.description}</td>
                    <td className="px-4 py-2.5">
                      {c.isRobotSpecific
                        ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Robot-specific</span>
                        : <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">General</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
