"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, fmtDuration } from "@/lib/utils";

interface Machine { id: string; name: string; type: string; }
interface Operator { id: string; name: string; }
interface Assignment { id: string; machine: Machine; operator: Operator; }
interface BatchRecipe { id: string; batchNumber: string; design: { name: string }; program: { name: string }; _count: { productionRecords: number }; }
interface ProductionRecord { id: string; slabNumber: string; status: string; bodyWeight: number | null; batchRecipe: { batchNumber: string; design: { name: string } }; createdAt: string; }
interface DelayLog { id: string; machineName: string | null; delayCode: { code: string; description: string }; durationMinutes: number; startTime: string | null; endTime: string | null; }
interface Shift {
  id: string; date: string; shiftNumber: number; startTime: string; startedBy: string; status: string; notes: string | null;
  operatorAssignments: Assignment[];
  batchRecipes: BatchRecipe[];
  productionRecords: ProductionRecord[];
  delayLogs: DelayLog[];
  _count: { productionRecords: number };
}

export default function ActiveShiftPage() {
  const router = useRouter();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [newAssign, setNewAssign] = useState({ machineId: "", operatorId: "" });
  const [closing, setClosing] = useState(false);
  const [endTime, setEndTime] = useState("");

  const loadShift = useCallback(async () => {
    const r = await fetch("/api/shifts/active");
    if (!r.ok) { setShift(null); setLoading(false); return; }
    const active = await r.json();
    const full = await fetch(`/api/shifts/${active.id}`).then(x => x.json());
    setShift(full);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadShift();
    fetch("/api/machines").then(r => r.json()).then(setMachines);
    fetch("/api/operators").then(r => r.json()).then(setOperators);
  }, [loadShift]);

  const addAssignment = async () => {
    if (!shift || !newAssign.machineId || !newAssign.operatorId) return;
    await fetch(`/api/shifts/${shift.id}/operators`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAssign),
    });
    setNewAssign({ machineId: "", operatorId: "" });
    loadShift();
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!shift) return;
    await fetch(`/api/shifts/${shift.id}/operators`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    loadShift();
  };

  const closeShift = async () => {
    if (!shift || !endTime) return;
    setClosing(true);
    await fetch(`/api/shifts/${shift.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED", endTime }),
    });
    router.push("/");
  };

  const deleteDelay = async (id: string) => {
    await fetch(`/api/delays/${id}`, { method: "DELETE" });
    loadShift();
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading shift...</div>;
  if (!shift) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">No active shift found.</p>
      <Link href="/shift/start" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Start a Shift</Link>
    </div>
  );

  const totalDelay = shift.delayLogs.reduce((s, d) => s + d.durationMinutes, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-2xl font-bold text-gray-900">Shift {shift.shiftNumber} — {formatDate(shift.date)}</h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">ACTIVE</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Started by {shift.startedBy} at {shift.startTime}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/production/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ New Slab</Link>
          <Link href="/batch/new" className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition">+ Batch Setup</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Slabs Produced", value: shift._count.productionRecords, color: "text-blue-700" },
          { label: "Total Delay", value: totalDelay > 0 ? fmtDuration(totalDelay) : "None", color: totalDelay > 0 ? "text-red-600" : "text-gray-700" },
          { label: "Batches", value: shift.batchRecipes.length, color: "text-slate-700" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Operator Assignments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Operator Assignments</h2>
        <div className="space-y-2 mb-4">
          {shift.operatorAssignments.length === 0 && <p className="text-sm text-gray-400">No assignments yet.</p>}
          {shift.operatorAssignments.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.machine.name}</span>
                <span className="text-sm text-gray-700">{a.operator.name}</span>
              </div>
              <button onClick={() => removeAssignment(a.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={newAssign.machineId} onChange={e => setNewAssign(p => ({ ...p, machineId: e.target.value }))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select Machine</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={newAssign.operatorId} onChange={e => setNewAssign(p => ({ ...p, operatorId: e.target.value }))}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select Operator</option>
            {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button onClick={addAssignment} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add</button>
        </div>
      </div>

      {/* Batch Recipes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Batch Recipes ({shift.batchRecipes.length})</h2>
          <Link href="/batch/new" className="text-xs text-blue-600 hover:underline">+ New Batch</Link>
        </div>
        {shift.batchRecipes.length === 0 && <p className="text-sm text-gray-400">No batches configured yet.</p>}
        <div className="space-y-2">
          {shift.batchRecipes.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{b.batchNumber}</p>
                <p className="text-xs text-gray-500">{b.design.name} — {b.program.name}</p>
              </div>
              <span className="text-xs text-gray-400">{b._count.productionRecords} slabs</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Production */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Production Records ({shift.productionRecords.length})</h2>
          <Link href="/production/new" className="text-xs text-blue-600 hover:underline">+ New Slab</Link>
        </div>
        {shift.productionRecords.length === 0 && <p className="text-sm text-gray-400">No slabs entered yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
              <th className="pb-2 text-left">Slab No.</th>
              <th className="pb-2 text-left">Batch</th>
              <th className="pb-2 text-left">Design</th>
              <th className="pb-2 text-left">Status</th>
              <th className="pb-2 text-left">Weight</th>
              <th className="pb-2 text-left"></th>
            </tr></thead>
            <tbody>
              {shift.productionRecords.slice(0, 20).map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-slate-50">
                  <td className="py-2 font-medium">{r.slabNumber}</td>
                  <td className="py-2 text-gray-500">{r.batchRecipe.batchNumber}</td>
                  <td className="py-2 text-gray-500">{r.batchRecipe.design.name}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "COMPLETED" ? "bg-green-100 text-green-700" : r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span>
                  </td>
                  <td className="py-2 text-gray-500">{r.bodyWeight ? `${r.bodyWeight}kg` : "—"}</td>
                  <td className="py-2"><Link href={`/production/${r.id}`} className="text-blue-500 hover:underline text-xs">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delay Logs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Delay Logs ({shift.delayLogs.length})</h2>
          <Link href="/delays" className="text-xs text-blue-600 hover:underline">+ Log Delay</Link>
        </div>
        {shift.delayLogs.length === 0 && <p className="text-sm text-gray-400">No delays logged yet.</p>}
        <div className="space-y-2">
          {shift.delayLogs.map(d => (
            <div key={d.id} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2">
              <div>
                <span className="text-xs font-bold text-red-700 mr-2">{d.delayCode.code}</span>
                <span className="text-sm text-gray-700">{d.delayCode.description}</span>
                {d.machineName && <span className="ml-2 text-xs text-gray-400">({d.machineName})</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-red-600">{d.durationMinutes} min</span>
                <button onClick={() => deleteDelay(d.id)} className="text-xs text-red-300 hover:text-red-600">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Close Shift */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Close Shift</h2>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <button onClick={closeShift} disabled={!endTime || closing}
            className="mt-5 px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
            {closing ? "Closing..." : "Close Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}
