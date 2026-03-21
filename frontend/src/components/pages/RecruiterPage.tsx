"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Users, TrendingUp, Search,
  Eye, Star, AlertCircle, CheckCircle2, Briefcase, UserPlus, X,
  Upload, BookOpen, Loader2, CheckCircle, Calendar, Trash2, ShieldCheck
} from "lucide-react";
import { useApp, DEFAULT_RECRUITER_EMAIL } from "@/lib/app-context";
import type { LearningPeriod } from "@/lib/app-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const statusConfig: Record<string, string> = {
  "Excellent":  "text-green-400 bg-green-500/12 border-green-500/30",
  "On Track":   "text-purple-400 bg-purple-500/12 border-purple-500/30",
  "Needs Help": "text-yellow-400 bg-yellow-500/12 border-yellow-500/30",
  "At Risk":    "text-red-400 bg-red-500/12 border-red-500/30",
};

function getStatus(progress: number) {
  if (progress >= 80) return "Excellent";
  if (progress >= 55) return "On Track";
  if (progress >= 30) return "Needs Help";
  return "At Risk";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-purple-300 font-medium">{label}</p>
        <p className="text-purple-400">{payload[0].value}% progress</p>
      </div>
    );
  }
  return null;
};

export default function RecruiterPage() {
  const { traineeRegistry, addTraineeToRegistry, removeTraineeFromRegistry, setSelectedTraineeEmail, setCurrentPage, updateTraineeLearningPeriod, setCurrentCatalog, currentCatalog, recruiterRegistry, addRecruiterToRegistry, removeRecruiterFromRegistry, currentEmail, loadRecruiterPeriodForm, saveRecruiterPeriodForm } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const catalogInputRef = useRef<HTMLInputElement>(null);
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [catalogMsg, setCatalogMsg] = useState("");

  // Reflect already-loaded catalog on mount / when context loads it
  useEffect(() => {
    if (currentCatalog && catalogStatus === "idle") {
      setCatalogStatus("success");
      setCatalogMsg(`${currentCatalog.courses?.length ?? 0} courses loaded`);
    }
  }, [currentCatalog]);
  const [showAddRecruiterModal, setShowAddRecruiterModal] = useState(false);
  const [newRecruiterEmail, setNewRecruiterEmail] = useState("");
  const [recruiterAddError, setRecruiterAddError] = useState("");

  // Learning period state — persisted per recruiter
  const today = new Date().toISOString().split("T")[0];
  const [periodLabel, setPeriodLabel] = useState("Onboarding Batch 1");
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodTarget, setPeriodTarget] = useState("all");
  const [periodSaved, setPeriodSaved] = useState(false);

  // Load saved period form whenever the recruiter email is known
  useEffect(() => {
    if (!currentEmail) return;
    const saved = loadRecruiterPeriodForm(currentEmail);
    if (saved) {
      setPeriodLabel(saved.label);
      setPeriodStart(saved.startDate);
      setPeriodEnd(saved.endDate);
      setPeriodTarget(saved.target);
    }
  }, [currentEmail]);

  const handleAssignPeriod = () => {
    if (!periodStart || !periodEnd || new Date(periodEnd) <= new Date(periodStart)) return;
    const period: LearningPeriod = { startDate: periodStart, endDate: periodEnd, label: periodLabel };
    const targets = periodTarget === "all"
      ? traineeRegistry.map((t) => t.email)
      : [periodTarget];
    targets.forEach((email) => updateTraineeLearningPeriod(email, period));
    // Persist the form so recruiter sees it next time
    saveRecruiterPeriodForm(currentEmail, { label: periodLabel, startDate: periodStart, endDate: periodEnd, target: periodTarget });
    setPeriodSaved(true);
    setTimeout(() => setPeriodSaved(false), 2500);
  };

  const trainees = traineeRegistry.map((t) => {
    const done = t.tasks.filter((tk) => tk.done).length;
    const total = t.tasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const score = t.tasks.filter((tk) => tk.done).reduce((acc, tk) => acc + tk.xp, 0);
    return { ...t, progress, score, done, total, status: getStatus(progress) };
  });

  const filtered = trainees.filter(
    (t) =>
      t.displayName.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  const overallAvg = trainees.length > 0
    ? Math.round(trainees.reduce((acc, t) => acc + t.progress, 0) / trainees.length)
    : 0;
  const onTrack = trainees.filter((t) => t.status === "On Track" || t.status === "Excellent").length;
  const needAttention = trainees.filter((t) => t.status === "Needs Help" || t.status === "At Risk").length;

  const chartData = trainees.map((t) => ({
    name: t.displayName.split(" ")[0],
    progress: t.progress,
  }));

  const handleAddTrainee = () => {
    setAddError("");
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { setAddError("Enter a valid email."); return; }
    if (traineeRegistry.find((t) => t.email === email)) { setAddError("Trainee already exists."); return; }
    addTraineeToRegistry(email, currentEmail);
    setNewEmail("");
    setShowAddModal(false);
  };

  const handleAddRecruiter = () => {
    setRecruiterAddError("");
    const email = newRecruiterEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { setRecruiterAddError("Enter a valid email."); return; }
    if (recruiterRegistry.find((r) => r.email === email)) { setRecruiterAddError("Recruiter already exists."); return; }
    addRecruiterToRegistry(email);
    setNewRecruiterEmail("");
    setShowAddRecruiterModal(false);
  };

  const handleViewAnalytics = (email: string) => {
    setSelectedTraineeEmail(email);
    setCurrentPage("dashboard");
  };

  const handleCatalogUpload = async (file: File) => {
    setCatalogStatus("uploading");
    setCatalogMsg("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/api/upload-catalog`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        // Also save catalog to context/localStorage for this recruiter
        const text = await file.text().catch(() => null);
        if (text) {
          try { setCurrentCatalog(JSON.parse(text)); } catch {}
        }
        setCatalogStatus("success");
        setCatalogMsg(`${data.courses_loaded} courses loaded`);
      } else {
        setCatalogStatus("error");
        setCatalogMsg(data.detail || "Upload failed");
      }
    } catch {
      // Backend unreachable — still save catalog locally so it's used in pathway generation
      const text = await file.text().catch(() => null);
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.courses) {
            setCurrentCatalog(parsed);
            setCatalogStatus("success");
            setCatalogMsg(`${parsed.courses.length} courses saved locally`);
            return;
          }
        } catch {}
      }
      setCatalogStatus("error");
      setCatalogMsg("Cannot reach backend on port 8000");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Briefcase className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Recruiter Panel</h1>
            </div>
            <p className="text-purple-400 text-sm">Track trainee progress and manage your cohort</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Trainee
          </button>
        </div>
      </motion.div>

      {/* Add Trainee Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 w-full max-w-sm mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Add Trainee</h3>
              <button onClick={() => { setShowAddModal(false); setAddError(""); setNewEmail(""); }}>
                <X className="w-4 h-4 text-purple-400 hover:text-white" />
              </button>
            </div>
            <p className="text-purple-400 text-xs mb-4">
              Enter the email the trainee used to register. Their progress will appear once they log in.
            </p>
            <input
              autoFocus
              type="email"
              placeholder="trainee@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTrainee()}
              className="dark-input w-full px-3 py-2 text-sm mb-2 focus:outline-none"
            />
            {addError && <p className="text-red-400 text-xs mb-2">{addError}</p>}
            <button onClick={handleAddTrainee} className="btn-glow w-full py-2 rounded-xl text-white text-sm font-semibold mt-1">
              Add to Cohort
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Trainees", value: String(trainees.length), icon: Users, color: "purple", note: `${trainees.length} registered` },
          { label: "Avg. Progress", value: `${overallAvg}%`, icon: TrendingUp, color: "blue", note: "across all trainees" },
          { label: "On Track", value: String(onTrack), icon: CheckCircle2, color: "green", note: `${trainees.length > 0 ? Math.round((onTrack / trainees.length) * 100) : 0}% of cohort` },
          { label: "Need Attention", value: String(needAttention), icon: AlertCircle, color: "orange", note: needAttention > 0 ? "Intervention needed" : "All good!" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-5"
          >
            <s.icon className={`w-5 h-5 mb-2 ${
              s.color === "purple" ? "text-purple-400" :
              s.color === "blue" ? "text-blue-400" :
              s.color === "green" ? "text-green-400" : "text-orange-400"
            }`} />
            <p className="text-white text-2xl font-bold">{s.value}</p>
            <p className="text-purple-400 text-xs">{s.label}</p>
            <p className="text-purple-600 text-xs mt-1">{s.note}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="space-y-5">
          {/* Learning Period Assignment */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">Assign Learning Period</h3>
            </div>
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Label (e.g. Onboarding Batch 1)"
                value={periodLabel}
                onChange={(e) => { setPeriodLabel(e.target.value); saveRecruiterPeriodForm(currentEmail, { label: e.target.value, startDate: periodStart, endDate: periodEnd, target: periodTarget }); }}
                className="dark-input w-full px-3 py-2 text-xs focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-purple-500 text-xs mb-1">Start date</p>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => { setPeriodStart(e.target.value); saveRecruiterPeriodForm(currentEmail, { label: periodLabel, startDate: e.target.value, endDate: periodEnd, target: periodTarget }); }}
                    className="dark-input w-full px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <p className="text-purple-500 text-xs mb-1">End date</p>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => { setPeriodEnd(e.target.value); saveRecruiterPeriodForm(currentEmail, { label: periodLabel, startDate: periodStart, endDate: e.target.value, target: periodTarget }); }}
                    className="dark-input w-full px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <p className="text-purple-500 text-xs mb-1">Assign to</p>
                <select
                  value={periodTarget}
                  onChange={(e) => { setPeriodTarget(e.target.value); saveRecruiterPeriodForm(currentEmail, { label: periodLabel, startDate: periodStart, endDate: periodEnd, target: e.target.value }); }}
                  className="dark-input w-full px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="all">All trainees</option>
                  {traineeRegistry.map((t) => (
                    <option key={t.email} value={t.email}>{t.displayName} ({t.email})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssignPeriod}
                disabled={!periodStart || !periodEnd || new Date(periodEnd) <= new Date(periodStart)}
                className="btn-glow w-full py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {periodSaved ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Assigned!</> : "Assign Period"}
              </button>
            </div>
          </motion.div>

          {/* Catalog Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">Course Catalog</h3>
            </div>
            <p className="text-purple-500 text-xs mb-3">
              Upload a <span className="text-purple-300 font-mono">.json</span> file to replace the active course catalog used when generating learning paths.
            </p>
            <div
              onClick={() => catalogInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                catalogStatus === "success"
                  ? "border-green-500/40 bg-green-500/5"
                  : catalogStatus === "error"
                  ? "border-red-500/40 bg-red-500/5"
                  : "border-purple-800/40 hover:border-purple-500"
              }`}
            >
              {catalogStatus === "uploading" ? (
                <Loader2 className="w-7 h-7 text-purple-400 animate-spin mx-auto" />
              ) : catalogStatus === "success" ? (
                <CheckCircle className="w-7 h-7 text-green-400 mx-auto" />
              ) : (
                <Upload className="w-7 h-7 text-purple-500 mx-auto" />
              )}
              <p className={`text-xs mt-2 ${
                catalogStatus === "success" ? "text-green-400" :
                catalogStatus === "error" ? "text-red-400" : "text-purple-400"
              }`}>
                {catalogStatus === "idle" && "Click to upload catalog JSON"}
                {catalogStatus === "uploading" && "Uploading..."}
                {catalogStatus === "success" && catalogMsg}
                {catalogStatus === "error" && catalogMsg}
              </p>
            </div>
            {catalogStatus !== "idle" && (
              <button
                onClick={() => { setCatalogStatus("idle"); setCatalogMsg(""); }}
                className="mt-2 text-xs text-purple-500 hover:text-purple-300 transition-colors"
              >
                Upload another
              </button>
            )}
            <input
              ref={catalogInputRef}
              type="file"
              accept=".json"
              hidden
              onChange={(e) => e.target.files?.[0] && handleCatalogUpload(e.target.files[0])}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h3 className="text-white font-semibold text-sm mb-1">Cohort Progress</h3>
            <p className="text-purple-500 text-xs mb-4">All trainees at a glance</p>
            {trainees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-purple-500 text-xs text-center">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                No trainees yet. Add one above.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={14}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#9d8fc4", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9d8fc4", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="progress" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Trainee Table */}
        <div className="xl:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Trainee Directory</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="dark-input pl-8 pr-3 py-2 text-xs w-36 focus:outline-none"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-purple-500 text-xs text-center">
                <Users className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-white text-sm font-medium mb-1">No trainees yet</p>
                <p className="text-purple-400">Click "Add Trainee" to add trainees by their registered email.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full dark-table">
                  <thead>
                    <tr className="border-b border-purple-900/40">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Trainee</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Progress</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Score</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => (
                      <motion.tr
                        key={t.email}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.06 }}
                        onClick={() => setSelectedId(selectedId === t.email ? null : t.email)}
                        className="border-b border-purple-900/20 hover:bg-purple-500/5 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {t.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-white text-xs font-semibold">{t.displayName}</p>
                              <p className="text-purple-600 text-xs">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-purple-950/50 rounded-full overflow-hidden">
                              <div className="h-full progress-neon rounded-full" style={{ width: `${t.progress}%` }} />
                            </div>
                            <span className="text-white text-xs font-medium">{t.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className="text-white text-xs font-semibold">{t.score}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusConfig[t.status]}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewAnalytics(t.email); }}
                              className="text-purple-500 hover:text-purple-300 transition-colors"
                              title="View analytics"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeTraineeFromRegistry(t.email); }}
                              className="text-red-500/40 hover:text-red-400 transition-colors"
                              title="Remove trainee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Expanded row */}
            {selectedId && (() => {
              const t = filtered.find((tr) => tr.email === selectedId);
              if (!t) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-500/8"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{t.displayName}</p>
                      <p className="text-purple-400 text-xs mt-1">{t.email} · {t.done}/{t.total} tasks · {t.score} XP</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusConfig[t.status]}`}>{t.status}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleViewAnalytics(t.email)}
                      className="btn-glow px-4 py-2 rounded-lg text-white text-xs font-semibold"
                    >
                      View Analytics
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        </div>
      </div>

      {/* Recruiter Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Recruiter Accounts</h3>
          </div>
          <button
            onClick={() => setShowAddRecruiterModal(true)}
            className="btn-glow px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Recruiter
          </button>
        </div>
        <div className="space-y-2">
          {recruiterRegistry.map((r) => (
            <div key={r.email} className="flex items-center gap-3 p-3 rounded-xl border border-purple-800/30 bg-black/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(r.displayName || r.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{r.displayName || r.email.split("@")[0]}</p>
                <p className="text-purple-500 text-xs truncate">{r.email}</p>
              </div>
              {r.isDefault ? (
                <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/10">Default</span>
              ) : r.email === currentEmail ? (
                <span className="text-xs text-purple-500">You</span>
              ) : (
                <button
                  onClick={() => removeRecruiterFromRegistry(r.email)}
                  className="text-red-500/40 hover:text-red-400 transition-colors"
                  title="Remove recruiter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add Recruiter Modal */}
      {showAddRecruiterModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 w-full max-w-sm mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Add Recruiter</h3>
              <button onClick={() => { setShowAddRecruiterModal(false); setNewRecruiterEmail(""); setRecruiterAddError(""); }}>
                <X className="w-4 h-4 text-purple-400 hover:text-white" />
              </button>
            </div>
            <input
              autoFocus
              type="email"
              placeholder="recruiter@example.com"
              value={newRecruiterEmail}
              onChange={(e) => setNewRecruiterEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRecruiter()}
              className="dark-input w-full px-3 py-2 text-sm mb-2 focus:outline-none"
            />
            {recruiterAddError && <p className="text-red-400 text-xs mb-2">{recruiterAddError}</p>}
            <button onClick={handleAddRecruiter} className="btn-glow w-full py-2 rounded-xl text-white text-sm font-semibold mt-1">
              Add Recruiter
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}