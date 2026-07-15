"use client";

import { useState } from "react";

interface Machine {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function MachinesClient({ machines: initial }: { machines: Machine[] }) {
  const [machines, setMachines] = useState(initial);

  const toggle = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/machines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      setMachines(machines.map((m) => (m.id === id ? { ...m, isActive: !isActive } : m)));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m) => (
            <tr key={m.id} className="border-b border-gray-100">
              <td className="px-4 py-3 font-medium">{m.name}</td>
              <td className="px-4 py-3 text-gray-600">{m.type}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {m.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggle(m.id, m.isActive)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  {m.isActive ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
