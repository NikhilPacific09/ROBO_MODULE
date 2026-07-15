"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatDate, fmtDuration } from "@/lib/utils";

interface Shift { id: string; date: string; shiftNumber: number; startedBy: string; status: string; _count: { productionRecords: number; delayLogs: number; }; }
interface DelayLog { durationMinutes: number; delayCode: { category: string; code: string }; machineName: string | null; }
interface MachineEntry { machineName: string; actualCycleTime: number | null; }
interface BatchRecipeEntry { machineName?: string; machine: { name: string }; targetCycleTime: number | null; }
interface ProductionRecord { batchRecipe: { entries: BatchRecipeEntry[] }; machineEntries: MachineEntry[]; }

const COLORS = ["#3b82f6","#ef4444","#f59e0b","#10b981","#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1","#a16207"];

export default function ReportsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [delays, setDelays] = useState<DelayLog[]>([]);
  const [cycleData, setCycleData] = useState<{ machine: string; actual: number; target: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/shifts").then(r => r.json()),
    ]).then(([s]) => {
      setShifts(s);
      // Fetch delays for last 10 shifts
      const ids = s.slice(0, 10).map((x: Shift) => x.id);
      return Promise.all(ids.map((id: string) => fetch(`/api/delays?shiftId=${id}`).then(r => r.json())));
    }).then((allDelays: DelayLog[][]) => {
      const flat = allDelays.flat();
      setDelays(flat);
      setLoading(false);
    });
  }, []);

  // Delay by category
  const delayCatMap: Record<string, number> = {};
  for (const d of delays) {
    delayCatMap[d.delayCode.category] = (delayCatMap[d.delayCode.category] || 0) + d.durationMinutes;
  }
  const delayPieData = Object.entries(delayCatMap).map(([name, value]) => ({ name, value }));

  // Slabs per shift (last 10)
  const slabsBarData = shifts.slice(0, 10).reverse().map(s => ({
    name: `S${s.shiftNumber} ${formatDate(s.date)}`,
    slabs: s._count.productionRecords,
    delays: s._count.delayLogs,
  }));

  if (loading) return <div className="text-center py-20 text-gray-400">Loading reports...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Slabs per shift */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Slabs Produced per Shift (Last 10)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={slabsBarData} margin={{ left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="slabs" fill="#3b82f6" radius={[4,4,0,0]} name="Slabs" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delay breakdown pie */}
      {delayPieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Delay Breakdown by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={delayPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}m`}>
                {delayPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v} min`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Shift Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Shift Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>{["Date","Shift","Slabs","Delays","Started By","Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id} className="border-t border-gray-50 hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(s.date)}</td>
                  <td className="px-4 py-3">Shift {s.shiftNumber}</td>
                  <td className="px-4 py-3 font-medium text-blue-700">{s._count.productionRecords}</td>
                  <td className="px-4 py-3 text-red-600">{s._count.delayLogs}</td>
                  <td className="px-4 py-3 text-gray-500">{s.startedBy}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
