import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, fmtDuration, getDurationMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
};
const MACHINE_ACCENT: Record<string, string> = {
  "Roycut-1": "bg-blue-500", "Roycut-2": "bg-indigo-500", "Roycut-3": "bg-violet-500", "Roymix": "bg-emerald-500",
};

export default async function ProductionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await prisma.productionRecord.findUnique({
    where: { id },
    include: {
      batchRecipe: { include: { design: true, program: true, entries: { include: { machine: true } } } },
      machineEntries: true,
      delayLogs: { include: { delayCode: true } },
      shift: true,
    },
  });
  if (!record) notFound();

  const totalDelay = record.delayLogs.reduce((s, d) => s + d.durationMinutes, 0);
  const r1 = record.machineEntries.find(e => e.machineName === "Roycut-1");
  const r3 = record.machineEntries.find(e => e.machineName === "Roycut-3") || record.machineEntries.find(e => e.machineName === "Roycut-2");
  const totalDuration = r1?.inTime && r3?.outTime ? getDurationMinutes(r1.inTime, r3.outTime) : null;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/production" className="text-sm text-gray-400 hover:text-gray-600">← Production</Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900">Slab {record.slabNumber}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[record.status]}`}>{record.status}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Batch: {record.batchRecipe.batchNumber} · {record.batchRecipe.design.name} · {formatDate(record.shift.date)} · Shift {record.shift.shiftNumber}
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Design", value: record.batchRecipe.design.name },
          { label: "Program", value: record.batchRecipe.program.name },
          { label: "Body Weight", value: record.bodyWeight ? `${record.bodyWeight} kg` : "—" },
          { label: "Total Duration", value: totalDuration !== null ? fmtDuration(totalDuration) : "—" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Machine Entries */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Machine Times</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {record.machineEntries.map(e => {
            const recipeEntry = record.batchRecipe.entries.find(re => re.machine.name === e.machineName);
            const duration = e.inTime && e.outTime ? getDurationMinutes(e.inTime, e.outTime) : null;
            const targetSec = recipeEntry?.targetCycleTime;
            const actualSec = e.actualCycleTime;
            const diff = targetSec && actualSec ? actualSec - targetSec : null;
            return (
              <div key={e.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-5 rounded-full ${MACHINE_ACCENT[e.machineName] || "bg-gray-400"}`} />
                  <span className="font-medium text-gray-800">{e.machineName}</span>
                  {duration !== null && <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">⏱ {fmtDuration(duration)}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-gray-400">In</p><p className="font-medium">{e.inTime || "—"}</p></div>
                  <div><p className="text-xs text-gray-400">Out</p><p className="font-medium">{e.outTime || "—"}</p></div>
                  <div>
                    <p className="text-xs text-gray-400">Cycle</p>
                    <p className={`font-medium ${diff !== null && diff > 0 ? "text-red-600" : diff !== null && diff < 0 ? "text-green-600" : ""}`}>
                      {actualSec ? `${actualSec}s` : "—"}
                      {diff !== null && <span className="text-xs ml-1">({diff > 0 ? "+" : ""}{diff}s)</span>}
                    </p>
                  </div>
                </div>
                {recipeEntry && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recipeEntry.toolName && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded">🔧 {recipeEntry.toolName}</span>}
                    {recipeEntry.liquidName && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">💧 {recipeEntry.liquidName}</span>}
                    {recipeEntry.powderName && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">🪨 {recipeEntry.powderName}</span>}
                    {recipeEntry.rollerHeight && <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded">📏 {recipeEntry.rollerHeight}mm</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
