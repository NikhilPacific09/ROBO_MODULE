"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Shift {
  id: string; shiftNumber: number; date: string; operatorName: string;
  startTime: string; endTime: string | null; status: string; notes: string | null;
  roycut1CycleTime: number | null; roycut2CycleTime: number | null; roycut3CycleTime: number | null;
  batchRecipes: { id: string; designName: string; programName: string; targetSlabs: number | null; _count?: { productionRecords: number } }[];
  productionRecords: { id: string; slabNumber: string; inTime: string | null; outTime: string | null; roymixCycleTime: number | null; thickness: number | null; status: string; createdAt: string }[];
  delayLogs: { id: string; durationMinutes: number; startTime: string | null; remarks: string | null; delayCode: { code: string; description: string; category: string } }[];
}

function fmtDelay(mins: number) {
  if (mins === 0) return "0m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function ShiftPage() {
  const router = useRouter();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const load = () => {
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      setShift(s);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const closeShift = async () => {
    if (!shift) return;
    if (!confirm("Close this shift? You cannot add more slabs after closing.")) return;
    setClosing(true);
    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    await fetch(`/api/shifts/${shift.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED", endTime }),
    });
    setClosing(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><p className="text-gray-400">Loading...</p></div>;

  if (!shift) return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <div className="text-5xl mb-4">🔄</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">No Active Shift</h1>
      <p className="text-gray-500 mb-8">Start a shift to begin logging production, delays, and batches.</p>
      <Link href="/shift/start" className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 text-lg">
        Start New Shift
      </Link>
    </div>
  );

  const totalDelay = shift.delayLogs.reduce((s, d) => s + d.durationMinutes, 0);
  const [sh, sm] = shift.startTime.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const elapsedMins = shift.status === "ACTIVE" ? Math.max(nowMins - startMins, 1) : null;
  const slabsPerHour = elapsedMins && shift.productionRecords.length > 0
    ? Math.round((shift.productionRecords.length / elapsedMins) * 60 * 10) / 10 : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Shift {shift.shiftNumber}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${shift.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {shift.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{shift.date} · Started {shift.startTime}{shift.endTime ? ` · Ended ${shift.endTime}` : ""} · {shift.operatorName}</p>
        </div>
        {shift.status === "ACTIVE" && (
          <button onClick={closeShift} disabled={closing}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60">
            {closing ? "Closing..." : "Close Shift"}
          </button>
        )}
      </div>

      {/* Quick Actions */}
      {shift.status === "ACTIVE" && (
        <>
          {/* Primary action: Start New Batch */}
          <Link href="/batch/new"
            className="block w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl p-5 transition shadow-lg">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-bold text-lg">Start New Batch</p>
              <p className="text-xs text-indigo-200">Configure batch, select machines & ingredients</p>
            </div>
          </Link>

          {/* Secondary actions row */}
          <div className="grid grid-cols-2 gap-4 mt-0">
            <Link href="/production/new"
              className="flex items-center gap-3 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 transition">
              <span className="text-2xl">➕</span>
              <div>
                <p className="font-semibold">Log Slab</p>
                <p className="text-xs text-blue-400">Record produced slab</p>
              </div>
            </Link>
            <Link href="/delays"
              className="flex items-center gap-3 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 transition">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="font-semibold">Log Delay</p>
                <p className="text-xs text-orange-400">Record downtime</p>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Slabs</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{shift.productionRecords.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Slabs/hr</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{slabsPerHour ?? "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Delay</p>
          <p className={`text-3xl font-bold mt-1 ${totalDelay > 0 ? "text-red-500" : "text-gray-400"}`}>{fmtDelay(totalDelay)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Batches</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{shift.batchRecipes.length}</p>
        </div>
      </div>

      {/* Cycle times */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Machine Cycle Times (Fixed This Shift)</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Roycut-1", val: shift.roycut1CycleTime, color: "bg-blue-50 text-blue-700" },
            { label: "RoyMix", val: null, color: "bg-emerald-50 text-emerald-700", note: "Per slab" },
            { label: "Roycut-2", val: shift.roycut2CycleTime, color: "bg-indigo-50 text-indigo-700" },
            { label: "Roycut-3", val: shift.roycut3CycleTime, color: "bg-violet-50 text-violet-700" },
          ].map(({ label, val, color, note }) => (
            <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-xl font-bold mt-1">{val ? `${val}s` : note ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Batches */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Batches</h2>
            {shift.status === "ACTIVE" && <Link href="/batch/new" className="text-xs text-blue-600 hover:underline">+ New</Link>}
          </div>
          {shift.batchRecipes.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No batches yet</p>
          ) : (
            <div className="space-y-2">
              {shift.batchRecipes.map(b => (
                <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.designName}</p>
                    <p className="text-xs text-gray-400">{b.programName}{b.targetSlabs ? ` · Target: ${b.targetSlabs} slabs` : ""}</p>
                  </div>
                  {b._count && <span className="text-xs text-gray-400">{b._count.productionRecords} slabs</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delays */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Delays ({shift.delayLogs.length})</h2>
            {shift.status === "ACTIVE" && <Link href="/delays" className="text-xs text-blue-600 hover:underline">+ Log</Link>}
          </div>
          {shift.delayLogs.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No delays logged</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {shift.delayLogs.map(d => (
                <div key={d.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{d.delayCode.code}</span>
                    <span className="text-xs text-gray-500 ml-2">{d.delayCode.description}</span>
                  </div>
                  <span className="text-xs font-medium text-red-500">{d.durationMinutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Production records */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-800">Slabs This Shift</h2>
          <Link href="/production" className="text-xs text-blue-600 hover:underline">View All</Link>
        </div>
        {shift.productionRecords.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No slabs logged yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Slab #</th>
                  <th className="text-left py-2 font-medium">In Time</th>
                  <th className="text-left py-2 font-medium">Out Time</th>
                  <th className="text-left py-2 font-medium">RoyMix CT</th>
                  <th className="text-left py-2 font-medium">Thickness</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {shift.productionRecords.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-blue-600">
                      <Link href={`/production/${r.id}`} className="hover:underline">{r.slabNumber}</Link>
                    </td>
                    <td className="py-2 text-gray-600">{r.inTime || "—"}</td>
                    <td className="py-2 text-gray-600">{r.outTime || "—"}</td>
                    <td className="py-2 text-gray-600">{r.roymixCycleTime ? `${r.roymixCycleTime}s` : "—"}</td>
                    <td className="py-2 text-gray-600">{r.thickness ? `${r.thickness}mm` : "—"}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        r.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
