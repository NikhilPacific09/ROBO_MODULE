"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const MACHINE_ORDER = ["Roycut-1", "Roymix", "Roycut-2", "Roycut-3"];

const CATEGORY_COLOR: Record<string, string> = {
  ROBOT: "bg-blue-100 text-blue-700", MAINTENANCE: "bg-orange-100 text-orange-700",
  ROYMIX: "bg-emerald-100 text-emerald-700", LINE: "bg-slate-100 text-slate-700",
  DISTRIBUTOR: "bg-purple-100 text-purple-700", PRESS: "bg-rose-100 text-rose-700",
  GENERAL: "bg-gray-100 text-gray-700", POWERCUT: "bg-red-100 text-red-700", LINE_START: "bg-teal-100 text-teal-700",
};

interface DelayCode { id: string; code: string; description: string; category: string; isRobotSpecific: boolean; }
interface MachineItem { id: string; name: string; type: string; }
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

interface PendingDelay {
  tempId: number;
  delayCodeId: string;
  code: string;
  description: string;
  category: string;
  machineId: string;
  machineName: string;
  durationMinutes: string;
  startTime: string;
  endTime: string;
  remarks: string;
}

export default function NewSlabPage() {
  const router = useRouter();
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [delayCodes, setDelayCodes] = useState<DelayCode[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [form, setForm] = useState({
    slabNumber: "", inTime: "", outTime: "",
    roymixCycleTime: "", roymixBodyWeight: "", remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Delay state
  const [delays, setDelays] = useState<PendingDelay[]>([]);
  const [delayOpen, setDelayOpen] = useState(false);
  const [delayForm, setDelayForm] = useState({
    codeInput: "", machineId: "", machineName: "", durationMinutes: "", startTime: "", endTime: "", remarks: "",
  });
  const [delayError, setDelayError] = useState("");
  let nextTempId = delays.length > 0 ? Math.max(...delays.map(d => d.tempId)) + 1 : 1;

  const matchedCode = useMemo(() =>
    delayCodes.find(d => d.code.toUpperCase() === delayForm.codeInput.toUpperCase().trim()),
    [delayCodes, delayForm.codeInput]
  );

  useEffect(() => {
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      if (s) setShift(s);
    });
    fetch("/api/delay-codes").then(r => r.json()).then(setDelayCodes);
    fetch("/api/machines").then(r => r.json()).then(setMachines);
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

  const setDelayMachine = (machineId: string) => {
    const m = machines.find(x => x.id === machineId);
    setDelayForm(p => ({ ...p, machineId, machineName: m?.name || "" }));
  };

  const addDelay = () => {
    setDelayError("");
    if (!matchedCode) { setDelayError("Invalid delay code."); return; }
    if (!delayForm.durationMinutes) { setDelayError("Duration is required."); return; }
    if (matchedCode.isRobotSpecific && !delayForm.machineId) { setDelayError("This code requires a machine."); return; }

    setDelays(prev => [...prev, {
      tempId: nextTempId,
      delayCodeId: matchedCode.id,
      code: matchedCode.code,
      description: matchedCode.description,
      category: matchedCode.category,
      machineId: delayForm.machineId,
      machineName: delayForm.machineName,
      durationMinutes: delayForm.durationMinutes,
      startTime: delayForm.startTime,
      endTime: delayForm.endTime,
      remarks: delayForm.remarks,
    }]);
    setDelayForm({ codeInput: "", machineId: "", machineName: "", durationMinutes: "", startTime: "", endTime: "", remarks: "" });
  };

  const removeDelay = (tempId: number) => {
    setDelays(prev => prev.filter(d => d.tempId !== tempId));
  };

  const totalDelay = delays.reduce((s, d) => s + (Number(d.durationMinutes) || 0), 0);

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
        remarks:          form.remarks || null,
        status:           "COMPLETED",
        delays: delays.map(d => ({
          delayCodeId:     d.delayCodeId,
          machineId:       d.machineId || null,
          machineName:     d.machineName || null,
          durationMinutes: Number(d.durationMinutes),
          startTime:       d.startTime || null,
          endTime:         d.endTime || null,
          remarks:         d.remarks || null,
        })),
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slab Number <span className="text-red-500">*</span></label>
            <input value={form.slabNumber} onChange={e => set("slabNumber", e.target.value)}
              placeholder="e.g. 140748" className={inp} required autoFocus />
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

        {/* Delay Logging Section */}
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm">
          <button type="button" onClick={() => setDelayOpen(o => !o)}
            className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱</span>
              <h2 className="font-semibold text-gray-800">Delay Log</h2>
              {delays.length > 0 && (
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {delays.length} delay{delays.length !== 1 ? "s" : ""} · {totalDelay} min
                </span>
              )}
            </div>
            <span className="text-sm text-gray-400">{delayOpen ? "▲" : "▼"}</span>
          </button>

          {delayOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-orange-100 pt-4">
              {/* Added delays list */}
              {delays.length > 0 && (
                <div className="space-y-2">
                  {delays.map(d => (
                    <div key={d.tempId} className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-2">
                      <span className="text-xs font-bold text-red-700 w-10">{d.code}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLOR[d.category] || "bg-gray-100 text-gray-600"}`}>{d.category}</span>
                      {d.machineName && <span className="text-xs text-gray-500">{d.machineName}</span>}
                      <span className="text-sm text-gray-700 flex-1">{d.description}</span>
                      <span className="text-xs font-medium text-red-600">{d.durationMinutes} min</span>
                      {d.startTime && d.endTime && <span className="text-xs text-gray-400">{d.startTime}–{d.endTime}</span>}
                      <button type="button" onClick={() => removeDelay(d.tempId)} className="text-xs text-red-300 hover:text-red-600">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add delay form */}
              <div className="space-y-3 bg-orange-50 rounded-lg p-4">
                {delayError && <div className="bg-red-50 border border-red-300 text-red-700 text-xs px-3 py-2 rounded-lg">{delayError}</div>}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delay Code</label>
                  <input value={delayForm.codeInput}
                    onChange={e => setDelayForm(p => ({ ...p, codeInput: e.target.value.toUpperCase() }))}
                    placeholder="e.g. C1, M3, RM5, T1" className={inp} autoComplete="off" />
                  {delayForm.codeInput && (
                    <div className={`mt-1.5 px-3 py-1.5 rounded-lg text-xs ${matchedCode ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
                      {matchedCode ? (
                        <span>✓ <strong>{matchedCode.code}</strong> — {matchedCode.description}
                          <span className={`ml-2 px-1.5 py-0.5 rounded ${CATEGORY_COLOR[matchedCode.category] || "bg-gray-100 text-gray-600"}`}>{matchedCode.category}</span>
                        </span>
                      ) : "✗ Code not found."}
                    </div>
                  )}
                </div>

                {matchedCode?.isRobotSpecific && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Machine</label>
                    <select value={delayForm.machineId} onChange={e => setDelayMachine(e.target.value)} className={inp}>
                      <option value="">Select Machine</option>
                      {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                    <input type="number" min="1" value={delayForm.durationMinutes}
                      onChange={e => setDelayForm(p => ({ ...p, durationMinutes: e.target.value }))}
                      placeholder="e.g. 4" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <input type="time" value={delayForm.startTime}
                      onChange={e => setDelayForm(p => ({ ...p, startTime: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <input type="time" value={delayForm.endTime}
                      onChange={e => setDelayForm(p => ({ ...p, endTime: e.target.value }))} className={inp} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delay Remarks</label>
                  <input value={delayForm.remarks}
                    onChange={e => setDelayForm(p => ({ ...p, remarks: e.target.value }))}
                    placeholder="Optional notes for this delay" className={inp} />
                </div>

                <div className="flex items-center justify-between">
                  <a href="/masters/delay-codes" target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                    View All Delay Codes →
                  </a>
                  <button type="button" onClick={addDelay}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition">
                    + Add Delay
                  </button>
                </div>
              </div>
            </div>
          )}
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
