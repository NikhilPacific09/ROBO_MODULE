import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function MachinesPage() {
  const machines = await prisma.machine.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Machines</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            {["Name","Type","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {machines.map(m => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{m.isActive ? "Active" : "Inactive"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
