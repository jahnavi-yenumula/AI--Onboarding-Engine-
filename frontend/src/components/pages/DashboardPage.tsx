"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, LineChart, Line
} from "recharts";
import { Trophy, Target, TrendingUp, CheckSquare, Flame, Star, Award, LayoutDashboard, Plus, Trash2, CheckCircle2, Circle, CalendarRange, UserCheck } from "lucide-react";
import { useApp } from "@/lib/app-context";
import type { Task } from "@/lib/app-context";

const progressData = [
  { day: "Mon", score: 0, tasks: 0 },
  { day: "Tue", score: 0, tasks: 0 },
  { day: "Wed", score: 0, tasks: 0 },
  { day: "Thu", score: 0, tasks: 0 },
  { day: "Fri", score: 0, tasks: 0 },
  { day: "Sat", score: 0, tasks: 0 },
  { day: "Sun", score: 0, tasks: 0 },
];

const weeklyData = [
  { week: "W1", react: 0, typescript: 0, nodejs: 0 },
  { week: "W2", react: 0, typescript: 0, nodejs: 0 },
  { week: "W3", react: 0, typescript: 0, nodejs: 0 },
  { week: "W4", react: 0, typescript: 0, nodejs: 0 },
  { week: "W5", react: 0, typescript: 0, nodejs: 0 },
  { week: "W6", react: 0, typescript: 0, nodejs: 0 },
];

const radialData = [
  { name: "React.js", value: 0, fill: "#8b5cf6" },
  { name: "TypeScript", value: 0, fill: "#06b6d4" },
  { name: "Node.js", value: 0, fill: "#a855f7" },
];

const levels = [
  { level: 1, name: "Apprentice", xp: 0, maxXp: 1500, unlocked: true },
  { level: 2, name: "Practitioner", xp: 0, maxXp: 3000, unlocked: false },
  { level: 3, name: "Expert", xp: 0, maxXp: 5000, unlocked: false },
];

const stats = [
  { label: "Completion Rate", value: "0%", icon: Target, color: "purple", change: "+0%" },
  { label: "Tasks Done", value: "0", icon: CheckSquare, color: "blue", change: "+0 today" },
  { label: "Streak", value: "0 days", icon: Flame, color: "orange", change: "Get started!" },
  { label: "Skill Score", value: "0", icon: TrendingUp, color: "green", change: "+0 pts" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6"];

const colorMap: Record<string, string> = {
  purple: "from-purple-600/20 to-purple-800/10 border-purple-500/25 text-purple-400",
  blue: "from-blue-600/20 to-blue-800/10 border-blue-500/25 text-blue-400",
  orange: "from-orange-600/20 to-orange-800/10 border-orange-500/25 text-orange-400",
  green: "from-green-600/20 to-green-800/10 border-green-500/25 text-green-400",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-purple-300 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { tasks, displayName, currentEmail, role, selectedTraineeEmail, traineeRegistry, recruiterRegistry, setCurrentPage, setSelectedTraineeEmail, updateTraineeTasks, learningPeriod, recruiterEmail } = useApp();

  // If recruiter is viewing a specific trainee, use that trainee's data
  const viewingTrainee = role === "recruiter" && selectedTraineeEmail
    ? traineeRegistry.find((t) => t.email === selectedTraineeEmail)
    : null;

  const activeTasks = viewingTrainee ? viewingTrainee.tasks : tasks;
  const activeName = viewingTrainee ? viewingTrainee.displayName : (displayName || currentEmail?.split("@")[0] || "there");
  const firstName = activeName.split(" ")[0];
  const activeLearningPeriod = viewingTrainee ? viewingTrainee.learningPeriod : learningPeriod;

  // Resolve recruiter display name for trainee view
  const activeRecruiterEmail = viewingTrainee ? (viewingTrainee.recruiterEmail || "") : recruiterEmail;
  const recruiterEntry = recruiterRegistry.find((r) => r.email === activeRecruiterEmail);
  const recruiterDisplayName = recruiterEntry?.displayName || activeRecruiterEmail?.split("@")[0] || "";

  // Recruiter task management state
  const [newTaskName, setNewTaskName] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const completedCount = activeTasks.filter((t) => t.done).length;
  const totalCount = activeTasks.length;
  const totalXp = activeTasks.filter((t) => t.done).reduce((acc, t) => acc + t.xp, 0);
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const completionRate = `${overallProgress}%`;
  const skillScore = totalXp;

  // Streak: count consecutive calendar days (ending today) that had at least one task completed
  const streak = useMemo(() => {
    const doneDates = new Set(
      activeTasks.filter((t) => t.done && t.completedAt).map((t) => t.completedAt as string)
    );
    if (doneDates.size === 0) return 0;
    let count = 0;
    const cursor = new Date();
    while (true) {
      const key = cursor.toISOString().split("T")[0];
      if (!doneDates.has(key)) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [tasks]);

  // Distribute completed tasks evenly across days/weeks for chart visualisation
  const progressData = useMemo(() => {
    return DAYS.map((day, i) => {
      const slice = Math.round((completedCount / 7) * (i + 1));
      const score = totalCount > 0 ? Math.round((slice / totalCount) * 100) : 0;
      return { day, score, tasks: slice };
    });
  }, [completedCount, totalCount]);

  const weeklyData = useMemo(() => {
    return WEEKS.map((week, i) => {
      const ratio = totalCount > 0 ? (completedCount / totalCount) * ((i + 1) / 6) : 0;
      return {
        week,
        react: Math.round(ratio * 100),
        typescript: Math.round(ratio * 80),
        nodejs: Math.round(ratio * 65),
      };
    });
  }, [completedCount, totalCount]);

  const radialData = useMemo(() => {
    const ratio = totalCount > 0 ? completedCount / totalCount : 0;
    return [
      { name: "React.js", value: Math.round(ratio * 100), fill: "#8b5cf6" },
      { name: "TypeScript", value: Math.round(ratio * 80), fill: "#06b6d4" },
      { name: "Node.js", value: Math.round(ratio * 65), fill: "#a855f7" },
    ];
  }, [completedCount, totalCount]);

  const levels = useMemo(() => {
    const l1Xp = Math.min(totalXp, 1500);
    const l2Xp = totalXp > 1500 ? Math.min(totalXp - 1500, 3000) : 0;
    const l3Xp = totalXp > 4500 ? Math.min(totalXp - 4500, 5000) : 0;
    return [
      { level: 1, name: "Apprentice", xp: l1Xp, maxXp: 1500, unlocked: true },
      { level: 2, name: "Practitioner", xp: l2Xp, maxXp: 3000, unlocked: totalXp >= 1500 },
      { level: 3, name: "Expert", xp: l3Xp, maxXp: 5000, unlocked: totalXp >= 4500 },
    ];
  }, [totalXp]);

  const currentLevel = levels.filter((l) => l.unlocked).length;
  const levelName = levels[currentLevel - 1]?.name ?? "Apprentice";

  const stats = [
    { label: "Completion Rate", value: completionRate, icon: Target, color: "purple", change: completedCount > 0 ? `${completedCount} done` : "Get started!" },
    { label: "Tasks Done", value: String(completedCount), icon: CheckSquare, color: "blue", change: `of ${totalCount} total` },
    { label: "Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, icon: Flame, color: "orange", change: streak > 0 ? "Keep going!" : "Get started!" },
    { label: "Skill Score", value: String(skillScore), icon: TrendingUp, color: "green", change: `+${skillScore} XP` },
  ];

  return (
    <div className="space-y-6">
      {/* Recruiter back banner */}
      {viewingTrainee && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/8 text-sm">
          <span className="text-purple-300">Viewing analytics for <span className="text-white font-semibold">{viewingTrainee.displayName}</span></span>
          <button
            onClick={() => { setSelectedTraineeEmail(null); setCurrentPage("recruiter"); }}
            className="ml-auto text-xs text-purple-400 hover:text-white border border-purple-600/40 px-3 py-1 rounded-lg transition-colors"
          >
            ← Back to Panel
          </button>
        </div>
      )}
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LayoutDashboard className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">
                {viewingTrainee ? `${activeName}'s Analytics` : "Dashboard"}
              </h1>
            </div>
            <p className="text-purple-400 text-sm">
              {viewingTrainee
                ? `Viewing progress for ${activeName}`
                : `Welcome back, ${firstName} — keep up the great work!`}
            </p>
            {!viewingTrainee && role === "trainee" && activeRecruiterEmail && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-purple-500 text-xs">Recruited by <span className="text-purple-300 font-medium">{recruiterDisplayName}</span></span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-purple-400 text-xs">Current Level</p>
            <div className="flex items-center gap-2 mt-1">
              <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold">Level {currentLevel} · {levelName}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`glass-card p-5 bg-gradient-to-br ${colorMap[s.color]} border`}
          >
            <div className="flex items-start justify-between mb-3">
              <s.icon className={`w-5 h-5 ${colorMap[s.color].split(" ")[3]}`} />
              <span className="text-xs text-green-400 font-medium">{s.change}</span>
            </div>
            <p className="text-white text-2xl font-bold">{s.value}</p>
            <p className="text-purple-400 text-xs mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Overall Progress</h3>
            <p className="text-purple-400 text-xs">Frontend Developer Learning Path</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-white glow-text-purple">{overallProgress}%</span>
            <p className="text-purple-500 text-xs">Complete</p>
          </div>
        </div>
        <div className="h-4 bg-purple-950/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="h-full progress-neon rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-purple-500 text-xs">0%</span>
          <span className="text-purple-400 text-xs">{completedCount} of {totalCount} tasks complete</span>
          <span className="text-purple-500 text-xs">100%</span>
        </div>
      </motion.div>

      {/* Learning Period */}
      {activeLearningPeriod && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="glass-card p-5"
        >
          {(() => {
            const start = new Date(activeLearningPeriod.startDate);
            const end = new Date(activeLearningPeriod.endDate);
            const today = new Date();
            const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
            const elapsed = Math.max(0, Math.min(totalDays, Math.round((today.getTime() - start.getTime()) / 86400000)));
            const daysLeft = Math.max(0, Math.round((end.getTime() - today.getTime()) / 86400000));
            const pct = Math.round((elapsed / totalDays) * 100);
            const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-white font-semibold text-sm">{activeLearningPeriod.label}</h3>
                      <p className="text-purple-500 text-xs">{fmt(start)} → {fmt(end)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{daysLeft > 0 ? `${daysLeft}d left` : "Ended"}</p>
                    <p className="text-purple-500 text-xs">{pct}% of period elapsed</p>
                  </div>
                </div>
                <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }}
                  />
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <h3 className="text-white font-semibold mb-1">Daily Progress Score</h3>
          <p className="text-purple-500 text-xs mb-4">This week's activity</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="day" tick={{ fill: "#9d8fc4", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9d8fc4", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" name="Score" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: "#8b5cf6", r: 3 }} />
              <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#06b6d4" strokeWidth={2} fill="url(#taskGrad)" dot={{ fill: "#06b6d4", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radial */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h3 className="text-white font-semibold mb-1">Skill Mastery</h3>
          <p className="text-purple-500 text-xs mb-2">Current proficiency</p>
          <ResponsiveContainer width="100%" height={150}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData} barSize={10}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(139,92,246,0.08)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {radialData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-purple-300 text-xs">{d.name}</span>
                </div>
                <span className="text-white text-xs font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Skill Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card p-5"
      >
        <h3 className="text-white font-semibold mb-1">Skill Growth Over Time</h3>
        <p className="text-purple-500 text-xs mb-4">6-week progression per skill</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
            <XAxis dataKey="week" tick={{ fill: "#9d8fc4", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9d8fc4", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="react" name="React.js" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="typescript" name="TypeScript" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="nodejs" name="Node.js" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: "#a855f7", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Level System */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">Level Progression</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levels.map((l, i) => (
            <motion.div
              key={l.level}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`p-4 rounded-xl border transition-all ${
                l.unlocked
                  ? "border-purple-500/50 bg-purple-600/10 glow-purple"
                  : "border-purple-900/30 bg-purple-950/20 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  l.unlocked ? "bg-gradient-to-br from-purple-500 to-violet-600 text-white" : "bg-purple-900/40 text-purple-700"
                }`}>
                  {l.level}
                </div>
                {l.unlocked ? (
                  <Award className="w-5 h-5 text-yellow-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-purple-800/50" />
                )}
              </div>
              <p className={`font-semibold text-sm ${l.unlocked ? "text-white" : "text-purple-700"}`}>
                Level {l.level} · {l.name}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-500">{l.unlocked ? `${l.xp} XP` : "Locked"}</span>
                  <span className="text-purple-600">{l.maxXp} XP</span>
                </div>
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: l.unlocked ? `${(l.xp / l.maxXp) * 100}%` : "0%" }}
                    transition={{ duration: 1.2, delay: 0.6 + i * 0.1 }}
                    className="h-full progress-neon rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {/* Recruiter: Task Management for this trainee */}
      {viewingTrainee && selectedTraineeEmail && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold">Manage Tasks for {activeName}</h3>
            </div>
            <button
              onClick={() => setAddingTask(true)}
              className="btn-glow px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          {/* Add task input */}
          {addingTask && (
            <div className="flex gap-2 mb-4">
              <input
                autoFocus
                type="text"
                placeholder="Task name..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTaskName.trim()) {
                    const newTask: Task = {
                      id: Date.now(),
                      task: newTaskName.trim(),
                      done: false,
                      xp: 100,
                      duration: "1 hr",
                      description: "Assigned by recruiter",
                    };
                    updateTraineeTasks(selectedTraineeEmail, [...activeTasks, newTask]);
                    setNewTaskName("");
                    setAddingTask(false);
                  }
                  if (e.key === "Escape") { setAddingTask(false); setNewTaskName(""); }
                }}
                className="dark-input flex-1 px-3 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={() => {
                  if (newTaskName.trim()) {
                    const newTask: Task = {
                      id: Date.now(),
                      task: newTaskName.trim(),
                      done: false,
                      xp: 100,
                      duration: "1 hr",
                      description: "Assigned by recruiter",
                    };
                    updateTraineeTasks(selectedTraineeEmail, [...activeTasks, newTask]);
                    setNewTaskName("");
                    setAddingTask(false);
                  }
                }}
                className="btn-glow px-4 py-2 rounded-lg text-white text-xs font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => { setAddingTask(false); setNewTaskName(""); }}
                className="glass-card-light px-3 py-2 rounded-lg text-purple-400 text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {activeTasks.length === 0 ? (
            <p className="text-purple-500 text-xs text-center py-6">No tasks yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    t.done ? "border-green-500/20 bg-green-500/5 opacity-70" : "border-purple-800/30 bg-black/10"
                  }`}
                >
                  {t.done
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    : <Circle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  }
                  <span className={`flex-1 text-sm ${t.done ? "text-green-400 line-through" : "text-white"}`}>
                    {t.task}
                  </span>
                  <span className="text-purple-600 text-xs">{t.duration}</span>
                  <button
                    onClick={() => {
                      updateTraineeTasks(
                        selectedTraineeEmail,
                        activeTasks.filter((tk) => tk.id !== t.id)
                      );
                    }}
                    className="text-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
