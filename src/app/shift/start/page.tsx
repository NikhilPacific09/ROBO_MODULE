"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Operator { id: string; name: string; }

export default function StartShiftPage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = `${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}`;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [form, setForm] = useState({
    date: today, shiftNumber: "1", startTime: nowTime,
    operatorName: "", notes: "",
    roycut1CycleTime: "", roycut2CycleTime: "", roycut3CycleTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/operators?active=true").then(r => r.json()).then(setOperators);
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.operatorName.trim()) { setError("Operator name is required."); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.status === 409) { setError("A shift is already active. Close it first."); setSubmitting(false); return; }
    if (!res.ok) { setError("Failed to start shift."); setSubmitting(false); return; }
    router.push("/shift");
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Start Shift</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in shift details and set today's fixed cycle times for Roycuts.</p>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Shift Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Shift Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inp} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Number <span className="text-red-500">*</span></label>
              <select value={form.shiftNumber} onChange={e => set("shiftNumber", e.target.value)} className={inp}>
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
                <option value="3">Shift 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-red-500">*</span></label>
              <input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} className={inp} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator <span className="text-red-500">*</span></label>
              <select value={form.operatorName} onChange={e => set("operatorName", e.target.value)} className={inp} required>
                <option value="">Select Operator</option>
                {operators.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
              {operators.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No operators found. <a href="/masters/operators" className="underline">Add operators</a> first.</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Optional notes for this shift" className={inp} />
            </div>
          </div>
        </div>

        {/* Roycut Cycle Times */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Roycut Cycle Times (Fixed for Shift)</h2>
          <p className="text-xs text-gray-500 mb-4">These are the fixed cycle times that apply to ALL slabs today for each Roycut. Set once per shift.</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "roycut1CycleTime", label: "Roycut-1 (sec)" },
              { key: "roycut2CycleTime", label: "Roycut-2 (sec)" },
              { key: "roycut3CycleTime", label: "Roycut-3 (sec)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="number" value={form[key as keyof typeof form]}
                  onChange={e => set(key, e.target.value)}
                  placeholder="e.g. 214" className={inp} />
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 px-3 py-2 rounded-lg">
            📌 RoyMix cycle time varies per slab — it is entered during each slab entry, not here.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
            {submitting ? "Starting..." : "Start Shift"}
          </button>
        </div>
      </form>
    </div>
  );
}
