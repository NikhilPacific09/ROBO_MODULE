"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { nowTimeStr, getDurationMinutes } from "@/lib/utils";

interface ActiveShift { id: string; shiftNumber: number; date: string; }
interface BatchRecipe { id: string; batchNumber: string; design: { name: string }; program: { name: string }; entries: { machineName?: string; machine: { name: string }; toolName: string | null; liquidName: string | null; powderName: string | null; rollerHeight: string | null; targetCycleTime: number | null }[]; }

const MACHINE_ORDER = ["Roycut-1", "Roymix", "Roycut-2", "Roycut-3"];
const MACHINE_COLORS: Record<string, string> = { "Roycut-1": "bg-blue-500", "Roycut-2": "bg-indigo-500", "Roycut-3": "bg-violet-500", "Roymix": "bg-emerald-500" };

type MachineEntry = { inTime: string; outTime: string; actualCycleTime: string; };

export default function NewProductionPage() {
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [batches, setBatches] = useState<BatchRecipe[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecipe | null>(null);
  const [form, setForm] = useState({ slabNumber: "", shiftId: "", batchRecipeId: "", bodyWeight: "", thickness: "", status: "COMPLETED", remarks: "" });
  const [entries, setEntries] = useState<Record<string, MachineEntry>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      if (!s) return;
      setActiveShift(s);
      setForm(p => ({ ...p, shiftId: s.id }));
      fetch(`/api/batch-recipes?shiftId=${s.id}`).then(r => r.json()).then(setBatches);
    });
    // init entries
    const init: Record<string, MachineEntry> = {};
    MACHINE_ORDER.forEach(m => { init[m] = { inTime: "", outTime: "", actualCycleTime: "" }; });
    setEntries(init);
  }, []);

  const selectBatch = (id: string) => {
    const b = batches.find(x => x.id === id) || null;
    setSelectedBatch(b);
    setForm(p => ({ ...p, batchRecipeId: id }));
  };

  const setEntry = (machine: string, field: keyof MachineEntry, value: string) => {
    setEntries(p => {
      const updated = { ...p[machine], [field]: value };
      if ((field === "inTime" || field === "outTime") && updated.inTime && updated.outTime) {
        const mins = getDurationMinutes(updated.inTime, updated.outTime);
        if (mins !== null) updated.actualCycleTime = String(mins * 60);
      }
      return { ...p, [machine]: updated };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shiftId) { setError("No active shift."); return; }
    if (!form.batchRecipeId) { setError("Select a batch recipe."); return; }
    if (!form.slabNumber.trim()) { setError("Slab number is required."); return; }
    setSubmitting(true); setError("");
    const machineEntries = MACHINE_ORDER.map(m => ({ machineName: m, ...entries[m] })).filter(e => e.inTime || e.outTime);
    const res = await fetch("/api/production", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, thickness: form.thickness || null, machineEntries }),
    });
    if (!res.ok) { setError("Failed to save record."); setSubmitting(false); return; }
    const created = await res.json();
    router.push(`/production/${created.id}`);
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Slab Entry</h1>
        {activeShift
          ? <p className="text-sm text-green-600 mt-1">Shift {activeShift.shiftNumber} — {activeShift.date}</p>
          : <p className="text-sm text-red-500 mt-1">⚠ No active shift. <a href="/shift/start" className="underline">Start one first.</a></p>}
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Batch + Slab */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Slab Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Recipe <span className="text-red-500">*</span></label>
              <select value={form.batchRecipeId} onChange={e => selectBatch(e.target.value)} className={inputCls} required>
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batchNumber} — {b.design.name} ({b.program.name})</option>)}
              </select>
              {batches.length === 0 && activeShift && <p className="text-xs text-orange-500 mt-1">No batches for this shift. <a href="/batch/new" className="underline">Create one.</a></p>}
            </div>
            {/* Program Name — auto-filled from selected batch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
              <input
                value={selectedBatch ? selectedBatch.program.name : ""}
                readOnly
                placeholder="Auto-filled from batch"
                className={inputCls + " bg-gray-50 text-gray-600 cursor-not-allowed"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slab Number <span className="text-red-500">*</span></label>
              <input value={form.slabNumber} onChange={e => setForm(p => ({ ...p, slabNumber: e.target.value }))}
                placeholder="e.g. 140748" className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
              <input type="number" step="0.1" value={form.thickness} onChange={e => setForm(p => ({ ...p, thickness: e.target.value }))}
                placeholder="e.g. 9.5" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Weight (kg)</label>
              <input type="number" step="0.1" value={form.bodyWeight} onChange={e => setForm(p => ({ ...p, bodyWeight: e.target.value }))}
                placeholder="e.g. 28.5" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batch recipe summary */}
        {selectedBatch && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Recipe: {selectedBatch.design.name} — {selectedBatch.program.name}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {selectedBatch.entries.map(e => (
                <div key={e.machine.name} className="bg-white rounded-lg p-2 text-xs">
                  <p className="font-semibold text-gray-700">{e.machine.name}</p>
                  {e.toolName && <p className="text-gray-500">Tool: {e.toolName}</p>}
                  {e.liquidName && <p className="text-gray-500">Liq: {e.liquidName}</p>}
                  {e.powderName && <p className="text-gray-500">Pow: {e.powderName}</p>}
                  {e.targetCycleTime && <p className="text-blue-600">Target: {e.targetCycleTime}s</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Machine Entries */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Machine Times</h2>
          <div className="space-y-4">
            {MACHINE_ORDER.map(machineName => {
              const entry = entries[machineName] || { inTime: "", outTime: "", actualCycleTime: "" };
              const recipeEntry = selectedBatch?.entries.find(e => e.machine.name === machineName);
              return (
                <div key={machineName} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-5 rounded-full ${MACHINE_COLORS[machineName] || "bg-gray-400"}`} />
                    <span className="font-medium text-gray-800">{machineName}</span>
                    {recipeEntry?.targetCycleTime && (
                      <span className="ml-auto text-xs text-gray-400">Target: {recipeEntry.targetCycleTime}s</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">In Time</label>
                      <input type="time" value={entry.inTime} onChange={e => setEntry(machineName, "inTime", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Out Time</label>
                      <input type="time" value={entry.outTime} onChange={e => setEntry(machineName, "outTime", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cycle Time (sec)</label>
                      <input type="number" value={entry.actualCycleTime} onChange={e => setEntry(machineName, "actualCycleTime", e.target.value)}
                        placeholder="auto-calc" className={inputCls} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remarks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
            className={inputCls + " resize-none"} placeholder="Any notes for this slab..." />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {submitting ? "Saving..." : "Submit Production Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
