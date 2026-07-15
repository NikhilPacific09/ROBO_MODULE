"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Machine { id: string; name: string; type: string; }
interface Design { id: string; name: string; programs: { id: string; name: string }[]; }
interface ActiveShift { id: string; shiftNumber: number; date: string; }

const MACHINES = ["Roycut-1", "Roycut-2", "Roycut-3", "Roymix"];

export default function NewBatchPage() {
  const router = useRouter();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tools, setTools] = useState<{ id: string; name: string }[]>([]);
  const [liquids, setLiquids] = useState<{ id: string; name: string }[]>([]);
  const [powders, setPowders] = useState<{ id: string; name: string }[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    batchNumber: "", shiftId: "", designId: "", programId: "", targetSlabs: "",
    notes: "",
    entries: {} as Record<string, { toolName: string; liquidName: string; powderName: string; rollerHeight: string; targetCycleTime: string }>,
  });

  useEffect(() => {
    fetch("/api/designs").then(r => r.json()).then(setDesigns);
    fetch("/api/machines").then(r => r.json()).then(setMachines);
    fetch("/api/tools").then(r => r.json()).then(setTools);
    fetch("/api/liquids").then(r => r.json()).then(setLiquids);
    fetch("/api/powders").then(r => r.json()).then(setPowders);
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      if (s) { setActiveShift(s); setForm(p => ({ ...p, shiftId: s.id })); }
    });
  }, []);

  // init entries when machines load
  useEffect(() => {
    if (machines.length === 0) return;
    const entries: typeof form.entries = {};
    for (const m of machines) {
      entries[m.id] = { toolName: "", liquidName: "", powderName: "", rollerHeight: "", targetCycleTime: "" };
    }
    setForm(p => ({ ...p, entries }));
  }, [machines]);

  const selectedDesign = designs.find(d => d.id === form.designId);

  const setEntry = (machineId: string, field: string, value: string) => {
    setForm(p => ({ ...p, entries: { ...p.entries, [machineId]: { ...p.entries[machineId], [field]: value } } }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shiftId) { setError("No active shift. Start a shift first."); return; }
    if (!form.batchNumber.trim()) { setError("Batch number is required."); return; }
    if (!form.designId || !form.programId) { setError("Design and Program are required."); return; }
    setSubmitting(true); setError("");
    const entries = machines.map(m => ({ machineId: m.id, ...form.entries[m.id] }));
    const res = await fetch("/api/batch-recipes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, entries }),
    });
    if (!res.ok) { setError("Failed to save batch recipe."); setSubmitting(false); return; }
    router.push("/shift/active");
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Batch Recipe</h1>
        {activeShift ? (
          <p className="text-sm text-green-600 mt-1">Shift {activeShift.shiftNumber} — {activeShift.date}</p>
        ) : (
          <p className="text-sm text-red-500 mt-1">⚠ No active shift. <a href="/shift/start" className="underline">Start one first.</a></p>
        )}
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Batch Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number <span className="text-red-500">*</span></label>
              <input value={form.batchNumber} onChange={e => setForm(p => ({ ...p, batchNumber: e.target.value }))}
                placeholder="e.g. B-1001" className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Slabs</label>
              <input type="number" value={form.targetSlabs} onChange={e => setForm(p => ({ ...p, targetSlabs: e.target.value }))}
                placeholder="e.g. 30" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Design <span className="text-red-500">*</span></label>
              <select value={form.designId} onChange={e => setForm(p => ({ ...p, designId: e.target.value, programId: "" }))} className={inputCls} required>
                <option value="">Select Design</option>
                {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program <span className="text-red-500">*</span></label>
              <select value={form.programId} onChange={e => setForm(p => ({ ...p, programId: e.target.value }))} className={inputCls} required disabled={!selectedDesign}>
                <option value="">Select Program</option>
                {selectedDesign?.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className={inputCls + " resize-none"} placeholder="Any notes for this batch..." />
          </div>
        </div>

        {/* Per-machine config */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Machine Configuration</h2>
          <div className="space-y-5">
            {machines.map(m => {
              const entry = form.entries[m.id] || { toolName: "", liquidName: "", powderName: "", rollerHeight: "", targetCycleTime: "" };
              const isRoymix = m.name === "Roymix";
              return (
                <div key={m.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-5 rounded-full ${isRoymix ? "bg-emerald-500" : "bg-blue-500"}`} />
                    <h3 className="font-medium text-gray-800">{m.name}</h3>
                    {isRoymix && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Liquid only</span>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {!isRoymix && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tool</label>
                        <select value={entry.toolName} onChange={e => setEntry(m.id, "toolName", e.target.value)} className={inputCls}>
                          <option value="">— None —</option>
                          {tools.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Liquid</label>
                      <select value={entry.liquidName} onChange={e => setEntry(m.id, "liquidName", e.target.value)} className={inputCls}>
                        <option value="">— None —</option>
                        {liquids.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                      </select>
                    </div>
                    {!isRoymix && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Powder</label>
                        <select value={entry.powderName} onChange={e => setEntry(m.id, "powderName", e.target.value)} className={inputCls}>
                          <option value="">— None —</option>
                          {powders.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                    )}
                    {!isRoymix && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Roller Height (mm)</label>
                        <input value={entry.rollerHeight} onChange={e => setEntry(m.id, "rollerHeight", e.target.value)}
                          placeholder="e.g. 20" className={inputCls} />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Target Cycle Time (sec)</label>
                      <input type="number" value={entry.targetCycleTime} onChange={e => setEntry(m.id, "targetCycleTime", e.target.value)}
                        placeholder="e.g. 214" className={inputCls} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60">
            {submitting ? "Saving..." : "Save Batch Recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
