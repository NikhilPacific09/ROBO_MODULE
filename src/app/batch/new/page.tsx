"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Machine { id: string; name: string; type: string; }
interface ActiveShift { id: string; shiftNumber: number; date: string; }

const MACHINE_ORDER = ["Roycut-1", "Roymix", "Roycut-2", "Roycut-3"];
const MACHINE_COLORS: Record<string, string> = {
  "Roycut-1": "bg-blue-500", "Roymix": "bg-emerald-500",
  "Roycut-2": "bg-indigo-500", "Roycut-3": "bg-violet-500",
};

export default function NewBatchPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [activeMachines, setActiveMachines] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    shiftId: "", designName: "", targetSlabs: "", notes: "",
    entries: {} as Record<string, {
      programName: string; toolName: string; liquidName: string; powderName: string;
      rollerHeight: string; targetCycleTime: string;
    }>,
  });

  useEffect(() => {
    fetch("/api/machines").then(r => r.json()).then((ms: Machine[]) => {
      const sorted = [...ms].sort((a, b) =>
        MACHINE_ORDER.indexOf(a.name) - MACHINE_ORDER.indexOf(b.name)
      );
      setMachines(sorted);
    });
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      if (s) { setActiveShift(s); setForm(p => ({ ...p, shiftId: s.id })); }
    });
  }, []);

  useEffect(() => {
    if (machines.length === 0) return;
    const entries: typeof form.entries = {};
    const active: Record<string, boolean> = {};
    for (const m of machines) {
      entries[m.id] = {
        programName: "", toolName: "", liquidName: "", powderName: "",
        rollerHeight: "", targetCycleTime: "",
      };
      active[m.id] = true;
    }
    setForm(p => ({ ...p, entries }));
    setActiveMachines(active);
  }, [machines]);

  const toggleMachine = (machineId: string) => {
    setActiveMachines(p => ({ ...p, [machineId]: !p[machineId] }));
  };

  const setEntry = (machineId: string, field: string, value: string) =>
    setForm(p => ({
      ...p,
      entries: {
        ...p.entries,
        [machineId]: { ...p.entries[machineId], [field]: value },
      },
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shiftId) { setError("No active shift."); return; }
    if (!form.designName.trim()) { setError("Design name is required."); return; }

    const anyActive = machines.some(m => activeMachines[m.id]);
    if (!anyActive) { setError("At least one machine must be active."); return; }

    setSubmitting(true); setError("");

    const entries = machines
      .filter(m => activeMachines[m.id])
      .map(m => ({
        machineId: m.id,
        programName: form.entries[m.id]?.programName || "",
        toolName: form.entries[m.id]?.toolName || "",
        liquidName: form.entries[m.id]?.liquidName || "",
        powderName: form.entries[m.id]?.powderName || "",
        rollerHeight: form.entries[m.id]?.rollerHeight || "",
        targetCycleTime: form.entries[m.id]?.targetCycleTime
          ? Number(form.entries[m.id].targetCycleTime) : null,
      }));

    const res = await fetch("/api/batch-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId: form.shiftId,
        designName: form.designName.trim(),
        targetSlabs: form.targetSlabs ? Number(form.targetSlabs) : null,
        notes: form.notes || null,
        entries,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save.");
      setSubmitting(false);
      return;
    }
    router.push("/shift");
  };

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const activeCount = machines.filter(m => activeMachines[m.id]).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Setup</h1>
        {activeShift
          ? <p className="text-sm text-green-600 mt-1">Shift {activeShift.shiftNumber} — {activeShift.date}</p>
          : <p className="text-sm text-red-500 mt-1">No active shift. <a href="/shift/start" className="underline">Start one first.</a></p>}
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Production Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Production Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Design Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.designName}
                onChange={e => setForm(p => ({ ...p, designName: e.target.value }))}
                placeholder="Type design name..."
                className={inp}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Slabs</label>
              <input
                type="number"
                value={form.targetSlabs}
                onChange={e => setForm(p => ({ ...p, targetSlabs: e.target.value }))}
                placeholder="e.g. 120"
                className={inp}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional"
                className={inp}
              />
            </div>
          </div>
        </div>

        {/* Machine Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800">Machine Configuration</h2>
            <span className="text-xs text-gray-400">{activeCount} of {machines.length} active</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Check which machines are active for this production run. Each machine has its own program name.
          </p>

          <div className="space-y-4">
            {machines.map(m => {
              const entry = form.entries[m.id] || {
                programName: "", toolName: "", liquidName: "", powderName: "",
                rollerHeight: "", targetCycleTime: "",
              };
              const isRoymix = m.name === "Roymix";
              const isActive = activeMachines[m.id] ?? true;

              return (
                <div key={m.id} className={`border rounded-xl p-4 transition ${
                  isActive ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-60"
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleMachine(m.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
                    />
                    <span className={`w-2 h-5 rounded-full ${MACHINE_COLORS[m.name] || "bg-gray-400"}`} />
                    <h3 className="font-medium text-gray-800">{m.name}</h3>
                    {isRoymix && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Liquid optional · CT varies per slab
                      </span>
                    )}
                    {!isActive && (
                      <span className="text-xs text-gray-400 ml-auto">Not in use</span>
                    )}
                  </div>

                  {isActive && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Program Name — every active machine gets one */}
                      <div className={isRoymix ? "col-span-2 md:col-span-3" : ""}>
                        <label className="block text-xs text-gray-500 mb-1">Program Name</label>
                        <input value={entry.programName}
                          onChange={e => setEntry(m.id, "programName", e.target.value)}
                          placeholder={`${m.name} program...`} className={inp} />
                      </div>
                      {!isRoymix && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tool</label>
                          <input value={entry.toolName}
                            onChange={e => setEntry(m.id, "toolName", e.target.value)}
                            placeholder="Type tool name..." className={inp} />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Liquid</label>
                        <input value={entry.liquidName}
                          onChange={e => setEntry(m.id, "liquidName", e.target.value)}
                          placeholder="Type liquid name..." className={inp} />
                      </div>
                      {!isRoymix && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Powder</label>
                            <input value={entry.powderName}
                              onChange={e => setEntry(m.id, "powderName", e.target.value)}
                              placeholder="Type powder name..." className={inp} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Roller Height (mm)</label>
                            <input value={entry.rollerHeight} onChange={e => setEntry(m.id, "rollerHeight", e.target.value)}
                              placeholder="e.g. 20" className={inp} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Target Cycle Time (sec)</label>
                            <input type="number" value={entry.targetCycleTime}
                              onChange={e => setEntry(m.id, "targetCycleTime", e.target.value)}
                              placeholder="e.g. 214" className={inp} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/shift")}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {submitting ? "Saving..." : "Save Production Setup"}
          </button>
        </div>
      </form>
    </div>
  );
}
