import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const CATEGORY_COLOR: Record<string, string> = {
  ROBOT: "bg-blue-100 text-blue-700", MAINTENANCE: "bg-orange-100 text-orange-700",
  ROYMIX: "bg-emerald-100 text-emerald-700", LINE: "bg-slate-100 text-slate-700",
  DISTRIBUTOR: "bg-purple-100 text-purple-700", PRESS: "bg-rose-100 text-rose-700",
  GENERAL: "bg-gray-100 text-gray-700", POWERCUT: "bg-red-100 text-red-700", LINE_START: "bg-teal-100 text-teal-700",
};

export default async function DelayCodesPage() {
  const codes = await prisma.delayCode.findMany({ orderBy: { code: "asc" } });
  const grouped: Record<string, typeof codes> = {};
  for (const c of codes) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Delay Codes</h1>
      <p className="text-sm text-gray-500 mb-6">Read-only reference. {codes.length} codes loaded from seed data.</p>
      <div className="space-y-5">
        {Object.entries(grouped).map(([category, cats]) => (
          <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`px-4 py-2.5 border-b border-gray-100 flex items-center gap-2`}>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[category] || "bg-gray-100 text-gray-600"}`}>{category}</span>
              {cats[0]?.isRobotSpecific && <span className="text-xs text-gray-400">Robot-specific (prefix with robot name)</span>}
            </div>
            <div className="grid grid-cols-1 divide-y divide-gray-50">
              {cats.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-2.5">
                  <span className="text-sm font-bold text-gray-800 w-12 shrink-0">{c.code}</span>
                  <span className="text-sm text-gray-600">{c.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
