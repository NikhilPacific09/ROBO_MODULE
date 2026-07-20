import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductionListPage() {
  const records = await prisma.productionRecord.findMany({
    include: { batchRecipe: true, shift: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
        <Link href="/production/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + New Entry
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              {["Slab No.", "Design", "Program", "Shift", "Date", "Thickness", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No production records yet.</td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{r.slabNumber}</td>
                <td className="px-4 py-3 text-gray-600">{r.batchRecipe?.designName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.batchRecipe?.programName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">Shift {r.shift.shiftNumber}</td>
                <td className="px-4 py-3 text-gray-500">{r.shift.date}</td>
                <td className="px-4 py-3 text-gray-500">{r.thickness ? `${r.thickness} mm` : "—"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/production/${r.id}`} className="text-blue-500 hover:underline text-xs">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
