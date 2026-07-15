"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#3b82f6","#ef4444","#f59e0b","#10b981","#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1"];

export default function DashboardCharts({ delayData }: { delayData: { category: string; minutes: number }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Delay Breakdown by Category (Today)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={delayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="category" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [`${v} min`, "Delay"]} />
          <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
            {delayData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
