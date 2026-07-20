"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  activeShift: { id: string; shiftNumber: number; date: string; operatorName: string; startTime: string } | null;
  totalSlabs: number;
  totalDelayMins: number;
  delayEvents: number;
  slabsPerHour: number | null;
  recentProduction: { id: string; slabNumber: string; inTime: string | null; outTime: string | null; status: string; batchRecipe: { design: { name: string } } | null }[];
  recentShifts: { id: string; shiftNumber: number; date: string; operatorName: string; status: string; productionRecords: unknown[]; delayLogs: { durationMinutes: number }[] }[];
  delayChartData: { cat: string; mins: number }[];
}

function fmtDelay(mins: number) {
  if (mins === 0) return "None";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const BAR_COLORS = ["#3B82F6","#EF4444","#F59E0B","#10B981","#8B5CF6","#F97316","#06B6D4","#EC4899","#84CC16"];

export default function DashboardClient({ activeShift, totalSlabs, totalDelayMins, delayEvents, slabsPerHour, recentProduction, recentShifts, delayChartData }: Props) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header row: title + clock + actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Digital Clock */}
        <div className="bg-gray-900 text-green-400 rounded-xl px-6 py-3 text-center font-mono shadow-lg">
          <p className="text-3xl font-bold tracking-widest">{time || "00:00:00"}</p>
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">Live Time</p>
        </div>

        <div className="flex gap-2">
          {activeShift ? (
            <Link href="/production/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              + New Slab
            </Link>
          ) : (
            <Link href="/shift/start" className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              Start Shift
            </Link>
          )}
        </div>
      </div>

      {/* Active Shift Banner */}
      {activeShift ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="font-semibold text-green-800">Shift {activeShift.shiftNumber} Active — {activeShift.date}</p>
              <p className="text-sm text-green-600">Operator: {activeShift.operatorName} · Started: {activeShift.startTime}</p>
            </div>
          </div>
          <Link href="/shift" className="text-sm text-green-700 font-medium underline">View Shift →</Link>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-amber-700 font-medium">No active shift. Start one to begin production.</p>
          <Link href="/shift/start" className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600">Start Shift</Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Slabs Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalSlabs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Slabs / Hour</p>
          <p className={`text-3xl font-bold mt-1 ${slabsPerHour !== null ? "text-blue-600" : "text-gray-400"}`}>
            {slabsPerHour !== null ? slabsPerHour : "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Delay</p>
          <p className={`text-3xl font-bold mt-1 ${totalDelayMins > 0 ? "text-red-500" : "text-gray-400"}`}>
            {fmtDelay(totalDelayMins)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Delay Events</p>
          <p className={`text-3xl font-bold mt-1 ${delayEvents > 0 ? "text-orange-500" : "text-gray-400"}`}>
            {delayEvents}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Delay chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Delay by Category (Today)</h2>
          {delayChartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No delays logged today</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={delayChartData}>
                <XAxis dataKey="cat" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} unit="m" />
                <Tooltip formatter={(v: number) => [`${v} min`, "Delay"]} />
                <Bar dataKey="mins" radius={[4, 4, 0, 0]}>
                  {delayChartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Production */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Recent Slabs</h2>
            <Link href="/production" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          {recentProduction.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No slabs logged today</p>
          ) : (
            <div className="space-y-2">
              {recentProduction.map(r => (
                <Link key={r.id} href={`/production/${r.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">#{r.slabNumber}</p>
                    <p className="text-xs text-gray-400">{r.batchRecipe?.designName || "—"}</p>
                  </div>
                  <div className="text-right">
                    {r.inTime && <p className="text-xs text-gray-500">In: {r.inTime}</p>}
                    {r.outTime && <p className="text-xs text-gray-500">Out: {r.outTime}</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{r.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Shifts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Shifts</h2>
        {recentShifts.length === 0 ? (
          <p className="text-sm text-gray-400">No shifts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-left py-2 font-medium">Shift</th>
                  <th className="text-left py-2 font-medium">Operator</th>
                  <th className="text-left py-2 font-medium">Slabs</th>
                  <th className="text-left py-2 font-medium">Delay</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentShifts.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-700">{s.date}</td>
                    <td className="py-2 text-gray-700">{s.shiftNumber}</td>
                    <td className="py-2 text-gray-700">{s.operatorName}</td>
                    <td className="py-2 font-medium text-blue-600">{s.productionRecords.length}</td>
                    <td className="py-2 text-red-500">{fmtDelay(s.delayLogs.reduce((a, d) => a + d.durationMinutes, 0))}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.status}
                      </span>
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
