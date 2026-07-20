import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const MACHINE_ORDER = ["Roycut-1", "Roymix", "Roycut-2", "Roycut-3"];

export default async function MachinesPage() {
  const machines = await prisma.machine.findMany();
  machines.sort((a, b) => {
    const ai = MACHINE_ORDER.indexOf(a.name);
    const bi = MACHINE_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Machines</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["#", "Name", "Type", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {machines.map((m, i) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {m.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Production order: Roycut-1 → Roymix → Roycut-2 → Roycut-3
      </p>
    </div>
  );
}
