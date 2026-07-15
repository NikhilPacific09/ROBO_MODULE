"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Machine {
  id: string;
  name: string;
  type: string;
}

interface Operator {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  machine: Machine;
  operator: Operator;
}

interface BatchRecipe {
  id: string;
  batchNumber: string;
  design: { name: string };
  program: { name: string };
  _count: { productionRecords: number };
}

interface Shift {
  id: string;
  date: string;
  shiftNumber: number;
  startTime: string;
  startedBy: string;
  notes?: string | null;
  status: string;
  operatorAssignments: Assignment[];
  batchRecipes: BatchRecipe[];
  _count: { productionRecords: number };
}

interface Props {
  shift: Shift;
  machines: Machine[];
  operators: Operator[];
  totalDelayMinutes: number;
}

export default function ShiftActiveClient({ shift, machines, operators, totalDelayMinutes }: Props) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>(shift.operatorAssignments);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newMachineId, setNewMachineId] = useState("");
  const [newOperatorId, setNewOperatorId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeTime, setCloseTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const handleAddAssignment = async () => {
    if (!newMachineId || !newOperatorId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}/operators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId: newMachineId, operatorId: newOperatorId }),
      });
      if (res.ok) {
        const assignment = await res.json();
        setAssignments([...assignments, assignment]);
        setShowAssignForm(false);
        setNewMachineId("");
        setNewOperatorId("");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const res = await fetch(`/api/shifts/${shift.id}/operators?assignmentId=${assignmentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    }
  };

  const handleCloseShift = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED", endTime: closeTime }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setClosing(false);
      setShowCloseModal(false);
    }
  };

  const fmtDur = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Shift Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Shift Information</h2>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date</span>
                <p className="font-medium text-gray-800">{shift.date}</p>
              </div>
              <div>
                <span className="text-gray-500">Shift #</span>
                <p className="font-medium text-gray-800">{shift.shiftNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Started By</span>
                <p className="font-medium text-gray-800">{shift.startedBy}</p>
              </div>
              <div>
                <span className="text-gray-500">Start Time</span>
                <p className="font-medium text-gray-800">{shift.startTime}</p>
              </div>
            </div>
            {shift.notes && (
              <p className="mt-2 text-sm text-gray-500">Notes: {shift.notes}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/batch/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + New Batch
            </Link>
            <Link
              href="/production/new"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
            >
              + New Slab
            </Link>
            <button
              onClick={() => setShowCloseModal(true)}
              className="border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm"
            >
              Close Shift
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Slabs Completed</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{shift._count.productionRecords}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Batch Recipes</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{shift.batchRecipes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Delays</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{fmtDur(totalDelayMinutes)}</p>
        </div>
      </div>

      {/* Operator Assignments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Operator Assignments</h2>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Assign Operator
          </button>
        </div>

        {showAssignForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg flex gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Machine</label>
              <select
                value={newMachineId}
                onChange={(e) => setNewMachineId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select machine</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
              <select
                value={newOperatorId}
                onChange={(e) => setNewOperatorId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select operator</option>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddAssignment}
              disabled={assigning}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {assigning ? "Saving..." : "Add"}
            </button>
            <button
              onClick={() => setShowAssignForm(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Machine</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Operator</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b border-gray-100">
                <td className="px-3 py-2 font-medium">{a.machine.name}</td>
                <td className="px-3 py-2 text-gray-600">{a.operator.name}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleRemoveAssignment(a.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-400">No assignments yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Batch Recipes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Batch Recipes</h2>
          <Link
            href="/batch/new"
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + New Batch Recipe
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Batch #</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Design</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Program</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Slabs</th>
            </tr>
          </thead>
          <tbody>
            {shift.batchRecipes.map((b) => (
              <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-medium">{b.batchNumber}</td>
                <td className="px-3 py-2">{b.design.name}</td>
                <td className="px-3 py-2 text-gray-600">{b.program.name}</td>
                <td className="px-3 py-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {b._count.productionRecords}
                  </span>
                </td>
              </tr>
            ))}
            {shift.batchRecipes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No batch recipes yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Close Shift</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to close this shift? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCloseShift}
                disabled={closing}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {closing ? "Closing..." : "Close Shift"}
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
