import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, fmtDuration } from "@/lib/utils";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const activeShift = await prisma.shift.findFirst({
    where: { status: "ACTIVE" },
    include: {
      _count: { select: { productionRecords: true, delayLogs: true, batchRecipes: true } },
      operatorAssignments: { include: { machine: true, operator: true } },
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = await prisma.productionRecord.findMany({
    where: { shift: { date: today } },
    include: { batchRecipe: { include: { design: true } }, machineEntries: true, delayLogs: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const todayDelays = await prisma.delayLog.findMany({
    where: { shift: { date: today } },
    include: { delayCode: true },
  });

  const totalDelayToday = todayDelays.reduce((s, d) => s + d.durationMinutes, 0);

  // Delay breakdown by category
  const delayCategoryMap: Record<string, number> = {};
  for (const d of todayDelays) {
    delayCategoryMap[d.delayCode.category] = (delayCategoryMap[d.delayCode.category] || 0) + d.durationMinutes;
  }
  const delayChartData = Object.entries(delayCategoryMap).map(([cat, mins]) => ({ category: cat, minutes: mins }));

  const recentShifts = await prisma.shift.findMany({
    orderBy: { createdAt: "desc" }, take: 5,
    include: { _count: { select: { productionRecords: true } } },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Today: {formatDate(today)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/production/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ New Slab</Link>
          {!activeShift && <Link href="/shift/start" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">Start Shift</Link>}
        </div>
      </div>

      {/* Active Shift Banner */}
      {activeShift ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="font-semibold text-green-800">Shift {activeShift.shiftNumber} Active — Started by {activeShift.startedBy}</p>
              <p className="text-xs text-green-600 mt-0.5">{activeShift._count.productionRecords} slabs · {activeShift._count.batchRecipes} batches · {activeShift._count.delayLogs} delays</p>
            </div>
          </div>
          <Link href="/shift/active" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">View Shift</Link>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-gray-500 text-sm">No active shift. Start one to begin production.</p>
          <Link href="/shift/start" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">Start Shift</Link>
        </div>
      )}

      {/* Today Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Slabs Today", value: todayRecords.length, color: "text-blue-700" },
          { label: "Total Delay", value: totalDelayToday > 0 ? fmtDuration(totalDelayToday) : "None", color: totalDelayToday > 0 ? "text-red-600" : "text-gray-700" },
          { label: "Delay Events", value: todayDelays.length, color: "text-orange-600" },
          { label: "Active Operators", value: activeShift?.operatorAssignments.length ?? 0, color: "text-slate-700" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {delayChartData.length > 0 && <DashboardCharts delayData={delayChartData} />}

      {/* Operator Assignments */}
      {activeShift && activeShift.operatorAssignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Operator Assignments</h2>
          <div className="flex flex-wrap gap-2">
            {activeShift.operatorAssignments.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.machine.name}</span>
                <span className="text-sm text-gray-700">{a.operator.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Production */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Production</h2>
          <Link href="/production" className="text-xs text-blue-600 hover:underline">View All</Link>
        </div>
        {todayRecords.length === 0 ? (
          <p className="text-sm text-gray-400">No production records today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["Slab", "Batch", "Design", "Status", "Weight"].map(h => (
                  <th key={h} className="pb-2 text-left text-xs text-gray-400 uppercase font-semibold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {todayRecords.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-slate-50">
                    <td className="py-2.5"><Link href={`/production/${r.id}`} className="font-medium text-blue-600 hover:underline">{r.slabNumber}</Link></td>
                    <td className="py-2.5 text-gray-500">{r.batchRecipe.batchNumber}</td>
                    <td className="py-2.5 text-gray-500">{r.batchRecipe.design.name}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "COMPLETED" ? "bg-green-100 text-green-700" : r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span>
                    </td>
                    <td className="py-2.5 text-gray-500">{r.bodyWeight ? `${r.bodyWeight}kg` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Shifts */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Shifts</h2>
        <div className="space-y-2">
          {recentShifts.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Shift {s.shiftNumber} — {formatDate(s.date)}</p>
                <p className="text-xs text-gray-500">Started by {s.startedBy}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{s._count.productionRecords} slabs</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
