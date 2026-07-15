"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { todayStr, nowTimeStr } from "@/lib/utils";

export default function StartShiftPage() {
  const router = useRouter();
  const [form, setForm] = useState({ date: todayStr(), shiftNumber: "1", startTime: nowTimeStr(), startedBy: "", notes: "" });
  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/operators").then(r => r.json()).then(setOperators);
  }, []);

  const handle = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startedBy.trim()) { setError("Please enter who is starting the shift."); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.status === 409) {
      const d = await res.json();
      setError(d.error);
      setSubmitting(false);
      return;
    }
    if (!res.ok) { setError("Failed to start shift."); setSubmitting(false); return; }
    router.push("/shift/active");
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Start New Shift</h1>
        <p className="text-sm text-gray-500 mt-1">Begin a production shift for today</p>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => handle("date", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Number</label>
            <select value={form.shiftNumber} onChange={e => handle("shiftNumber", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="1">Shift 1 (Morning)</option>
              <option value="2">Shift 2 (Evening)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input type="time" value={form.startTime} onChange={e => handle("startTime", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Started By <span className="text-red-500">*</span></label>
          <input list="op-list" value={form.startedBy} onChange={e => handle("startedBy", e.target.value)}
            placeholder="Supervisor / Incharge name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          <datalist id="op-list">{operators.map(o => <option key={o.id} value={o.name} />)}</datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea rows={2} value={form.notes} onChange={e => handle("notes", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Any notes for this shift..." />
        </div>
        <button type="submit" disabled={submitting}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-60">
          {submitting ? "Starting..." : "▶ Start Shift"}
        </button>
      </form>
    </div>
  );
}
