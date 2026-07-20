"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";

interface Shift {
  id: string; date: string; shiftNumber: number; operatorName: string; status: string;
  startTime: string; endTime: string | null;
  roycut1CycleTime: number | null; roycut2CycleTime: number | null; roycut3CycleTime: number | null;
  _count: { productionRecords: number; delayLogs: number };
}

interface DelayLog {
  id: string; durationMinutes: number;
  delayCode: { category: string; code: string; description: string };
  machineName: string | null;
}

const COLORS = ["#3b82f6","#ef4444","#f59e0b","#10b981","#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1","#a16207"];

type Tab = "shift" | "machine" | "delay" | "summary";

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getElapsedHours(start: string, end: string | null): number {
  if (!end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff / 60 : 0;
}

export default function ReportsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [delays, setDelays] = useState<DelayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("shift");

  useEffect(() => {
    Promise.all([
      fetch("/api/shifts").then(r => r.json()),
    ]).then(([s]) => {
      setShifts(s);
      // Load delays for all shifts
      const ids = s.slice(0, 20).map((x: Shift) => x.id);
      if (ids.length > 0) {
        Promise.all(ids.map((id: string) => fetch(`/api/delays?shiftId=${id}`).then(r => r.json())))
          .then((all: DelayLog[][]) => setDelays(all.flat()))
          .catch(() => setDelays([]));
      }
      setLoading(false);
    });
  }, []);

  const totalSlabs = shifts.reduce((s, x) => s + x._count.productionRecords, 0);
  const totalDelayMins = delays.reduce((s, d) => s + d.durationMinutes, 0);
  const totalHours = shifts.reduce((s, x) => s + getElapsedHours(x.startTime, x.endTime), 0);
  const avgSlabsPerHour = totalHours > 0 ? (totalSlabs / totalHours).toFixed(1) : "—";
  const efficiency = totalHours > 0
    ? Math.max(0, 100 - (totalDelayMins / (totalHours * 60)) * 100).toFixed(1)
    : "—";

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition ${
      tab === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <p className="ml-3 text-gray-500">Loading reports...</p>
    </div>
  );

  // ── Data for charts ──
  const last10 = shifts.slice(0, 10).reverse();

  // Shift-wise data
  const shiftBarData = last10.map(s => {
    const hrs = getElapsedHours(s.startTime, s.endTime);
    return {
      name: `S${s.shiftNumber}\n${s.date.slice(5)}`,
      slabs: s._count.productionRecords,
      slabsPerHour: hrs > 0 ? Number((s._count.productionRecords / hrs).toFixed(1)) : 0,
      delays: s._count.delayLogs,
    };
  });

  // Machine cycle time data (only shifts with actual data)
  const cycleTimeData = last10
    .filter(s => s.roycut1CycleTime || s.roycut2CycleTime || s.roycut3CycleTime)
    .map(s => ({
      name: `S${s.shiftNumber}`,
      "Roycut-1": s.roycut1CycleTime || null,
      "Roycut-2": s.roycut2CycleTime || null,
      "Roycut-3": s.roycut3CycleTime || null,
    }));

  // Delay analysis
  const delayCatMap: Record<string, number> = {};
  const delayCodeMap: Record<string, { code: string; desc: string; mins: number }> = {};
  for (const d of delays) {
    delayCatMap[d.delayCode.category] = (delayCatMap[d.delayCode.category] || 0) + d.durationMinutes;
    const key = d.delayCode.code;
    if (!delayCodeMap[key]) delayCodeMap[key] = { code: key, desc: d.delayCode.description, mins: 0 };
    delayCodeMap[key].mins += d.durationMinutes;
  }
  const delayPieData = Object.entries(delayCatMap).map(([name, value]) => ({ name, value }));
  const paretoData = Object.values(delayCodeMap)
    .sort((a, b) => b.mins - a.mins)
    .slice(0, 10);

  // Machine downtime by machine name
  const machineDelayMap: Record<string, number> = {};
  for (const d of delays) {
    const mn = d.machineName || "Unspecified";
    machineDelayMap[mn] = (machineDelayMap[mn] || 0) + d.durationMinutes;
  }
  const machineDelayData = Object.entries(machineDelayMap)
    .map(([name, value]) => ({ name, minutes: value }))
    .sort((a, b) => b.minutes - a.minutes);

  // Daily summary (group shifts by date)
  const dailyMap: Record<string, { slabs: number; delays: number; hours: number }> = {};
  for (const s of shifts) {
    if (!dailyMap[s.date]) dailyMap[s.date] = { slabs: 0, delays: 0, hours: 0 };
    dailyMap[s.date].slabs += s._count.productionRecords;
    dailyMap[s.date].delays += s._count.delayLogs;
    dailyMap[s.date].hours += getElapsedHours(s.startTime, s.endTime);
  }
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, d]) => ({
      date: date.slice(5),
      slabs: d.slabs,
      slabsPerHour: d.hours > 0 ? Number((d.slabs / d.hours).toFixed(1)) : 0,
    }));

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Production Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Comprehensive production analytics and monitoring</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Slabs", value: totalSlabs, color: "text-blue-700" },
          { label: "Avg Slabs/Hour", value: avgSlabsPerHour, color: "text-green-700" },
          { label: "Total Shifts", value: shifts.length, color: "text-indigo-700" },
          { label: "Total Downtime", value: fmtMins(totalDelayMins), color: "text-red-700" },
          { label: "Efficiency", value: efficiency !== "—" ? `${efficiency}%` : "—", color: "text-emerald-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-fit">
        <button onClick={() => setTab("shift")} className={tabCls("shift")}>Shift Production</button>
        <button onClick={() => setTab("machine")} className={tabCls("machine")}>Machine Performance</button>
        <button onClick={() => setTab("delay")} className={tabCls("delay")}>Delay Analysis</button>
        <button onClick={() => setTab("summary")} className={tabCls("summary")}>Daily Summary</button>
      </div>

      {/* ── Tab: Shift Production ── */}
      {tab === "shift" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Slabs per Shift</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={shiftBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Bar dataKey="slabs" fill="#3b82f6" radius={[4,4,0,0]} name="Slabs" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Slabs/Hour Trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={shiftBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="slabsPerHour" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Slabs/Hour" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shift table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Shift Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Date", "Shift", "Operator", "Slabs", "Slabs/Hr", "Delays", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(s => {
                    const hrs = getElapsedHours(s.startTime, s.endTime);
                    const sph = hrs > 0 ? (s._count.productionRecords / hrs).toFixed(1) : "—";
                    return (
                      <tr key={s.id} className="border-t border-gray-50 hover:bg-slate-50">
                        <td className="px-4 py-3 text-gray-600">{s.date}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">#{s.shiftNumber}</td>
                        <td className="px-4 py-3 text-gray-700">{s.operatorName || "—"}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">{s._count.productionRecords}</td>
                        <td className="px-4 py-3 font-medium text-green-700">{sph}</td>
                        <td className="px-4 py-3 text-red-600">{s._count.delayLogs}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>{s.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Machine Performance ── */}
      {tab === "machine" && (
        <div className="space-y-6">
          {cycleTimeData.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Roycut Cycle Times (sec)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cycleTimeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Roycut-1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="Roycut-2" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="Roycut-3" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
              No cycle time data recorded yet. Cycle times are set during shift start.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Downtime by Machine</h2>
            {machineDelayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={machineDelayData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => `${v} min`} contentStyle={{ borderRadius: "8px" }} />
                  <Bar dataKey="minutes" fill="#ef4444" radius={[0,4,4,0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">No machine-specific delay data</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Delay Analysis ── */}
      {tab === "delay" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Delay by Category</h2>
              {delayPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={delayPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}m`}>
                      {delayPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} min`} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-12">No delay data</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Top 10 Delay Codes (Pareto)</h2>
              {paretoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paretoData}>
                    <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm">
                          <p className="font-bold text-gray-800">{d.code}</p>
                          <p className="text-gray-500 text-xs">{d.desc}</p>
                          <p className="text-red-600 font-medium mt-1">{d.mins} min</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="mins" fill="#f59e0b" radius={[4,4,0,0]} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-12">No delay data</p>
              )}
            </div>
          </div>

          {/* Delay events table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Delay Category Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(delayCatMap)
                .sort(([,a], [,b]) => b - a)
                .map(([cat, mins]) => (
                  <div key={cat} className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-400 uppercase">{cat}</p>
                    <p className="text-lg font-bold text-red-700">{fmtMins(mins)}</p>
                    <p className="text-xs text-red-400">
                      {delays.filter(d => d.delayCode.category === cat).length} events
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Daily Summary ── */}
      {tab === "summary" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Daily Production (Last 14 Days)</h2>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="slabs" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} name="Slabs" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-12">No daily data yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Daily Slabs/Hour</h2>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Bar dataKey="slabsPerHour" fill="#10b981" radius={[4,4,0,0]} name="Slabs/Hour" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-12">No data</p>
            )}
          </div>

          {/* Weekly aggregate */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Overall Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-blue-400 uppercase">Total Production</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{totalSlabs}</p>
                <p className="text-xs text-blue-400">slabs</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-green-400 uppercase">Avg Slabs/Hour</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{avgSlabsPerHour}</p>
                <p className="text-xs text-green-400">across all shifts</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-xs text-red-400 uppercase">Total Downtime</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{fmtMins(totalDelayMins)}</p>
                <p className="text-xs text-red-400">{delays.length} events</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-xs text-emerald-400 uppercase">Efficiency</p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">{efficiency !== "—" ? `${efficiency}%` : "—"}</p>
                <p className="text-xs text-emerald-400">uptime ratio</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
