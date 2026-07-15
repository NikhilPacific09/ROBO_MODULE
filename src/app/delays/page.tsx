"use client";
import { useState, useEffect, useMemo } from "react";

interface DelayCode { id: string; code: string; description: string; category: string; isRobotSpecific: boolean; }
interface Machine { id: string; name: string; type: string; }
interface DelayLog { id: string; machineName: string | null; delayCode: { code: string; description: string; category: string }; durationMinutes: number; startTime: string | null; endTime: string | null; remarks: string | null; createdAt: string; }
interface ActiveShift { id: string; shiftNumber: number; date: string; }

const CATEGORY_COLOR: Record<string, string> = {
  ROBOT: "bg-blue-100 text-blue-700", MAINTENANCE: "bg-orange-100 text-orange-700",
  ROYMIX: "bg-emerald-100 text-emerald-700", LINE: "bg-slate-100 text-slate-700",
  DISTRIBUTOR: "bg-purple-100 text-purple-700", PRESS: "bg-rose-100 text-rose-700",
  GENERAL: "bg-gray-100 text-gray-700", POWERCUT: "bg-red-100 text-red-700", LINE_START: "bg-teal-100 text-teal-700",
};

export default function DelaysPage() {
  const [tab, setTab] = useState<"log" | "view">("log");
  const [delayCodes, setDelayCodes] = useState<DelayCode[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [logs, setLogs] = useState<DelayLog[]>([]);
  const [form, setForm] = useState({ machineId: "", machineName: "", codeInput: "", durationMinutes: "", startTime: "", endTime: "", remarks: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const matchedCode = useMemo(() =>
    delayCodes.find(d => d.code.toUpperCase() === form.codeInput.toUpperCase().trim()),
    [delayCodes, form.codeInput]
  );

  useEffect(() => {
    fetch("/api/delay-codes").then(r => r.json()).then(setDelayCodes);
    fetch("/api/machines").then(r => r.json()).then(setMachines);
    fetch("/api/shifts/active").then(r => r.ok ? r.json() : null).then(s => {
      setActiveShift(s);
      if (s) fetch(`/api/delays?shiftId=${s.id}`).then(r => r.json()).then(setLogs);
    });
  }, []);

  const loadLogs = () => {
    if (activeShift) fetch(`/api/delays?shiftId=${activeShift.id}`).then(r => r.json()).then(setLogs);
  };

  const setMachine = (machineId: string) => {
    const m = machines.find(x => x.id === machineId);
    setForm(p => ({ ...p, machineId, machineName: m?.name || "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) { setError("No active shift."); return; }
    if (!matchedCode) { setError("Invalid delay code. Check the code and try again."); return; }
    if (!form.durationMinutes) { setError("Duration is required."); return; }
    if (matchedCode.isRobotSpecific && !form.machineId) { setError("This code requires selecting a machine."); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/delays", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId: activeShift.id,
        machineId: form.machineId || null,
        machineName: form.machineName || null,
        delayCodeId: matchedCode.id,
        durationMinutes: Number(form.durationMinutes),
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        remarks: form.remarks || null,
      }),
    });
    if (!res.ok) { setError("Failed to log delay."); setSubmitting(false); return; }
    setForm({ machineId: "", machineName: "", codeInput: "", durationMinutes: "", startTime: "", endTime: "", remarks: "" });
    setSuccess(true); setTimeout(() => setSuccess(false), 2500);
    setSubmitting(false);
    loadLogs();
  };

  const deleteLog = async (id: string) => {
    await fetch(`/api/delays/${id}`, { method: "DELETE" });
    loadLogs();
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const totalDelay = logs.reduce((s, d) => s + d.durationMinutes, 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Delay Logging</h1>
        {activeShift
          ? <p className="text-sm text-green-600 mt-1">Shift {activeShift.shiftNumber} — {activeShift.date}</p>
          : <p className="text-sm text-red-500 mt-1">⚠ No active shift. <a href="/shift/start" className="underline">Start one first.</a></p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(["log", "view"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition capitalize ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "log" ? "Log Delay" : `View Delays${logs.length > 0 ? ` (${logs.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          {success && <div className="bg-green-50 border border-green-300 text-green-700 text-sm px-4 py-3 rounded-xl">✓ Delay logged successfully.</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delay Code <span className="text-red-500">*</span></label>
            <input value={form.codeInput} onChange={e => setForm(p => ({ ...p, codeInput: e.target.value.toUpperCase() }))}
              placeholder="e.g. C1, M3, RM5, T1" className={inputCls} autoComplete="off" />
            {form.codeInput && (
              <div className={`mt-2 px-3 py-2 rounded-lg text-sm ${matchedCode ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {matchedCode ? (
                  <span>✓ <strong>{matchedCode.code}</strong> — {matchedCode.description}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLOR[matchedCode.category] || "bg-gray-100 text-gray-600"}`}>{matchedCode.category}</span>
                  </span>
                ) : "✗ Code not found. Check the delay code list."}
              </div>
            )}
          </div>

          {matchedCode?.isRobotSpecific && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Machine <span className="text-red-500">*</span></label>
              <select value={form.machineId} onChange={e => setMachine(e.target.value)} className={inputCls} required>
                <option value="">Select Machine</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))}
                placeholder="e.g. 4" className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
              className={inputCls + " resize-none"} placeholder="Optional notes..." />
          </div>

          <button type="submit" disabled={submitting || !activeShift}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60">
            {submitting ? "Logging..." : "Log Delay"}
          </button>

          {/* Quick reference */}
          <details className="mt-2">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View delay code reference</summary>
            <div className="mt-2 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {delayCodes.map(d => (
                <div key={d.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
                  onClick={() => setForm(p => ({ ...p, codeInput: d.code }))}>
                  <span className="font-bold text-gray-700 w-8 shrink-0">{d.code}</span>
                  <span className="text-gray-500 truncate">{d.description}</span>
                </div>
              ))}
            </div>
          </details>
        </form>
      )}

      {tab === "view" && (
        <div className="space-y-3">
          {totalDelay > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-red-800">Total delay this shift</span>
              <span className="text-lg font-bold text-red-700">{totalDelay} min</span>
            </div>
          )}
          {logs.length === 0 && <div className="text-center py-12 text-gray-400">No delays logged yet.</div>}
          {logs.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{d.delayCode.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLOR[d.delayCode.category] || "bg-gray-100 text-gray-600"}`}>{d.delayCode.category}</span>
                  {d.machineName && <span className="text-xs text-gray-400">• {d.machineName}</span>}
                </div>
                <p className="text-sm text-gray-700">{d.delayCode.description}</p>
                {d.remarks && <p className="text-xs text-gray-400 mt-1 italic">{d.remarks}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-red-600">{d.durationMinutes} min</p>
                {d.startTime && d.endTime && <p className="text-xs text-gray-400">{d.startTime} – {d.endTime}</p>}
                <button onClick={() => deleteLog(d.id)} className="text-xs text-red-300 hover:text-red-600 mt-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
