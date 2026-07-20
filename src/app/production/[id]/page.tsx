import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getDurationMins(t1: string, t2: string): number | null {
  try {
    const [h1, m1] = t1.split(":").map(Number);
    const [h2, m2] = t2.split(":").map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return diff >= 0 ? diff : null;
  } catch { return null; }
}

function fmtMins(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export default async function ProductionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await prisma.productionRecord.findUnique({
    where: { id },
    include: {
      batchRecipe: { include: { entries: { include: { machine: true } } } },
      delayLogs: { include: { delayCode: true } },
      shift: true,
    },
  });
  if (!record) notFound();

  const totalDelay = record.delayLogs.reduce((s, d) => s + d.durationMinutes, 0);
  const totalDuration = record.inTime && record.outTime
    ? getDurationMins(record.inTime, record.outTime)
    : null;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/production" className="text-sm text-gray-400 hover:text-gray-600">← Production</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900">Slab {record.slabNumber}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{record.status}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {record.batchRecipe ? `${record.batchRecipe.designName} · ${record.batchRecipe.programName} · ` : ""}
            {record.shift.date} · Shift {record.shift.shiftNumber} · {record.shift.operatorName}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Design", value: record.batchRecipe?.designName ?? "—" },
          { label: "Program", value: record.batchRecipe?.programName ?? "—" },
          { label: "Thickness", value: record.thickness ? `${record.thickness} mm` : "—" },
          { label: "Total Duration", value: totalDuration !== null ? fmtMins(totalDuration) : "—" },
          { label: "RoyMix Body Wt", value: record.roymixBodyWeight ? `${record.roymixBodyWeight} kg` : "—" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timing */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Machine Timing</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-500 mb-1">In Time (Roycut-1)</p>
            <p className="text-lg font-bold text-blue-800">{record.inTime || "—"}</p>
          </div>
          <div className="bg-violet-50 rounded-lg p-3">
            <p className="text-xs text-violet-500 mb-1">Out Time (Roycut-3)</p>
            <p className="text-lg font-bold text-violet-800">{record.outTime || "—"}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-xs text-emerald-500 mb-1">RoyMix Cycle Time</p>
            <p className="text-lg font-bold text-emerald-800">{record.roymixCycleTime ? `${record.roymixCycleTime}s` : "—"}</p>
          </div>
        </div>

        {/* Shift cycle times */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Roycut-1 CT (shift)", val: record.shift.roycut1CycleTime },
            { label: "Roycut-2 CT (shift)", val: record.shift.roycut2CycleTime },
            { label: "Roycut-3 CT (shift)", val: record.shift.roycut3CycleTime },
          ].map(({ label, val }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">{val ? `${val}s` : "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Batch recipe entries */}
      {record.batchRecipe && record.batchRecipe.entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Batch Recipe Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {record.batchRecipe.entries.map(e => (
              <div key={e.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-2">{e.machine.name}</p>
                <div className="flex flex-wrap gap-1 text-xs">
                  {e.toolName && <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded">🔧 {e.toolName}</span>}
                  {e.liquidName && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">💧 {e.liquidName}</span>}
                  {e.powderName && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">🪨 {e.powderName}</span>}
                  {e.rollerHeight && <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded">📏 {e.rollerHeight}mm</span>}
                  {e.targetCycleTime && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">⏱ {e.targetCycleTime}s target</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delays */}
      {record.delayLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Delays — Total: {totalDelay} min</h2>
          <div className="space-y-2">
            {record.delayLogs.map(d => (
              <div key={d.id} className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-2">
                <span className="text-xs font-bold text-red-700 w-10">{d.delayCode.code}</span>
                <span className="text-sm text-gray-700 flex-1">{d.delayCode.description}</span>
                <span className="text-xs text-red-600 font-medium">{d.durationMinutes} min</span>
                {d.startTime && d.endTime && <span className="text-xs text-gray-400">{d.startTime}–{d.endTime}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {record.remarks && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-medium text-gray-700 mb-1">Remarks</p>
          <p className="text-sm text-gray-500">{record.remarks}</p>
        </div>
      )}
    </div>
  );
}
