"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MACHINE_ORDER = ["Roycut-1", "Roymix", "Roycut-2", "Roycut-3"];

interface BatchEntry {
  machine: { name: string };
  programName: string | null;
  targetCycleTime: number | null;
}
interface BatchRecipe {
  id: string;
  designName: string;
  entries: BatchEntry[];
}
interface ActiveShift {
  id: string; shiftNumber: number; date: string; operatorName: string;
  batchRecipes: BatchRecipe[];
}

export default function NewSlabPage() {
  const router = useRouter();
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [form, setForm] = useState({
    slabNumber: "", inTime: "", outTime: "",
    roymixCycleTime: "", roymixBodyWeight: "", thickness: "", remarks: "",
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

  // Get latest batch to determine active machines
  const latestBatch = shift?.batchRecipes?.[shift.batchRecipes.length - 1] ?? null;

  // Determine active machines from latest batch
  const activeMachineNames = latestBatch
    ? latestBatch.entries.map(e => e.machine.name).sort(
        (a, b) => MACHINE_ORDER.indexOf(a) - MACHINE_ORDER.indexOf(b)
      )
    : [];

  // Filter to only Roycut machines (for In/Out time)
  const activeRoycuts = activeMachineNames.filter(n => n !== "Roymix");
  const firstMachine = activeRoycuts[0] || activeMachineNames[0] || "—";
  const lastMachine = activeRoycuts[activeRoycuts.length - 1] || activeMachineNames[activeMachineNames.length - 1] || "—";
  const hasRoymix = activeMachineNames.includes("Roymix");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) { setError("No active shift."); return; }
    if (!form.slabNumber.trim()) { setError("Slab number is required."); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/production", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slabNumber:       form.slabNumber,
        shiftId:          shift.id,
        batchRecipeId:    latestBatch?.id || null,
        inTime:           form.inTime || null,
        outTime:          form.outTime || null,
        roymixCycleTime:  form.roymixCycleTime ? Number(form.roymixCycleTime) : null,
        roymixBodyWeight: form.roymixBodyWeight ? Number(form.roymixBodyWeight) : null,
        thickness:        form.thickness ? Number(form.thickness) : null,
        remarks:          form.remarks || null,
        status:           "COMPLETED",
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
        {latestBatch && (
          <p className="text-xs text-gray-400 mt-0.5">
            Design: {latestBatch.designName} · Machines: {activeMachineNames.join(" → ")}
          </p>
        )}
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Slab Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Slab Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slab Number <span className="text-red-500">*</span></label>
              <input value={form.slabNumber} onChange={e => set("slabNumber", e.target.value)}
                placeholder="e.g. 140748" className={inp} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
              <input type="number" step="0.1" value={form.thickness} onChange={e => set("thickness", e.target.value)}
                placeholder="e.g. 9.5" className={inp} />
            </div>
          </div>
        </div>

        {/* Machine Timing */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Machine Timing</h2>
          {activeMachineNames.length > 0 ? (
            <p className="text-xs text-gray-500 mb-4">
              Active: {activeMachineNames.join(" → ")} · In = {firstMachine} entry · Out = {lastMachine} exit
            </p>
          ) : (
            <p className="text-xs text-orange-500 mb-4">
              No batch setup found. <a href="/batch/new" className="underline">Create one</a> to auto-detect active machines.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                In Time{firstMachine !== "—" ? ` (${firstMachine})` : ""}
              </label>
              <input type="time" value={form.inTime} onChange={e => set("inTime", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Out Time{lastMachine !== "—" ? ` (${lastMachine})` : ""}
              </label>
              <input type="time" value={form.outTime} onChange={e => set("outTime", e.target.value)} className={inp} />
            </div>
          </div>

          {/* Target cycle times from batch — read-only */}
          {latestBatch && latestBatch.entries.filter(e => e.machine.name !== "Roymix" && e.targetCycleTime).length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {latestBatch.entries
                .filter(e => e.machine.name !== "Roymix")
                .sort((a, b) => MACHINE_ORDER.indexOf(a.machine.name) - MACHINE_ORDER.indexOf(b.machine.name))
                .map(e => (
                  <div key={e.machine.name} className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{e.machine.name} CT</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">
                      {e.targetCycleTime ? `${e.targetCycleTime}s` : "—"}
                    </p>
                    <p className="text-xs text-gray-400">Target</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* RoyMix — separate section */}
        {hasRoymix && (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-5 rounded-full bg-emerald-500" />
              <h2 className="font-semibold text-gray-800">RoyMix</h2>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Values vary per slab</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Time (sec)</label>
                <input type="number" value={form.roymixCycleTime} onChange={e => set("roymixCycleTime", e.target.value)}
                  placeholder="e.g. 185" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Weight (kg)</label>
                <input type="number" step="0.1" value={form.roymixBodyWeight} onChange={e => set("roymixBodyWeight", e.target.value)}
                  placeholder="e.g. 42.5" className={inp} />
              </div>
            </div>
          </div>
        )}

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
