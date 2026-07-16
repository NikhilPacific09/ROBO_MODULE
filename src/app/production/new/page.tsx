"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ActiveShift {
  id: string; shiftNumber: number; date: string; operatorName: string;
  roycut1CycleTime: number | null; roycut2CycleTime: number | null; roycut3CycleTime: number | null;
  batchRecipes: { id: string; batchNumber: string; design: { name: string }; program: { name: string } }[];
}

export default function NewSlabPage() {
  const router = useRouter();
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [form, setForm] = useState({
    slabNumber: "", batchRecipeId: "", inTime: "", outTime: "",
    roymixCycleTime: "", thickness: "", remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      if (s) setShift(s);
    });
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  const selectedBatch = shift?.batchRecipes.find(b => b.id === form.batchRecipeId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) { setError("No active shift."); return; }
    if (!form.slabNumber.trim()) { setError("Slab number is required."); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/production", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slabNumber:      form.slabNumber,
        shiftId:         shift.id,
        batchRecipeId:   form.batchRecipeId || null,
        inTime:          form.inTime || null,
        outTime:         form.outTime || null,
        roymixCycleTime: form.roymixCycleTime ? Number(form.roymixCycleTime) : null,
        thickness:       form.thickness ? Number(form.thickness) : null,
        remarks:         form.remarks || null,
        status:          "COMPLETED",
      }),
    });
    if (!res.ok) { setError("Failed to save record."); setSubmitting(false); return; }
    const created = await res.json();
    router.push(`/production/${created.id}`);
  };

  if (!shift) return (
    <div className="max-w-xl mx-auto mt-10 text-center">
      <p className="text-lg text-gray-700 mb-4">No active shift.</p>
      <a href="/shift/start" className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Start Shift First</a>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Slab Entry</h1>
        <p className="text-sm text-green-600 mt-1">Shift {shift.shiftNumber} · {shift.date} · {shift.operatorName}</p>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Core slab fields */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Slab Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slab Number <span className="text-red-500">*</span></label>
              <input value={form.slabNumber} onChange={e => set("slabNumber", e.target.value)}
                placeholder="e.g. 140748" className={inp} required autoFocus />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch / Design</label>
              <select value={form.batchRecipeId} onChange={e => set("batchRecipeId", e.target.value)} className={inp}>
                <option value="">— Select Batch (optional) —</option>
                {shift.batchRecipes.map(b => (
                  <option key={b.id} value={b.id}>{b.batchNumber} — {b.design.name} ({b.program.name})</option>
                ))}
              </select>
              {selectedBatch && (
                <p className="text-xs text-blue-600 mt-1">Program: {selectedBatch.program.name}</p>
              )}
              {shift.batchRecipes.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No batches yet. <a href="/batch/new" className="underline">Create one</a></p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
              <input type="number" step="0.1" value={form.thickness} onChange={e => set("thickness", e.target.value)}
                placeholder="e.g. 9.5" className={inp} />
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Machine Timing</h2>
          <p className="text-xs text-gray-500 mb-4">In Time = slab enters Roycut-1 · Out Time = slab exits Roycut-3</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">In Time (Roycut-1 entry)</label>
              <input type="time" value={form.inTime} onChange={e => set("inTime", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Out Time (Roycut-3 exit)</label>
              <input type="time" value={form.outTime} onChange={e => set("outTime", e.target.value)} className={inp} />
            </div>
          </div>

          {/* Roycut cycle times — read-only from shift */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Roycut-1 CT", val: shift.roycut1CycleTime },
              { label: "Roycut-2 CT", val: shift.roycut2CycleTime },
              { label: "Roycut-3 CT", val: shift.roycut3CycleTime },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{val ? `${val}s` : "—"}</p>
                <p className="text-xs text-gray-400">Fixed (shift)</p>
              </div>
            ))}
          </div>

          {/* RoyMix — per slab */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">RoyMix Cycle Time (sec) — varies per slab</label>
            <input type="number" value={form.roymixCycleTime} onChange={e => set("roymixCycleTime", e.target.value)}
              placeholder="e.g. 185" className={inp} />
          </div>
        </div>

        {/* Remarks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <input value={form.remarks} onChange={e => set("remarks", e.target.value)}
            placeholder="Optional notes for this slab" className={inp} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {submitting ? "Saving..." : "Save Slab"}
          </button>
        </div>
      </form>
    </div>
  );
}
