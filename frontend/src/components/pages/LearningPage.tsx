"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronRight, Sparkles, BookOpen,
  Brain, Target, Clock, Star, PlayCircle, Lock, Zap, ArrowLeft
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import type { Task } from "@/lib/app-context";

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-green-400", bg: "border-green-500/30 bg-green-500/8", dot: "bg-green-400" },
  active: { icon: PlayCircle, color: "text-purple-400", bg: "border-purple-500/50 bg-purple-500/12 glow-purple", dot: "bg-purple-400 pulse-glow" },
  upcoming: { icon: Circle, color: "text-blue-400", bg: "border-blue-500/30 bg-blue-500/5", dot: "bg-blue-400" },
  locked: { icon: Lock, color: "text-gray-600", bg: "border-gray-800/50 bg-gray-900/20 opacity-50", dot: "bg-gray-700" },
};

export default function LearningPage() {
  const { roadmap, setCurrentPage, tasks, setTasks } = useApp();

  // Initialize tasks from the roadmap only if tasks haven't been set yet
  useEffect(() => {
    if (roadmap && tasks.length === 0) {
      const formattedTasks: Task[] = roadmap.map((item: any, index: number) => ({
        id: index,
        task: item.task || item.module || "Learning Module",
        done: false,
        xp: 100,
        duration: item.duration || "1 hr",
        description: item.description || "Personalized AI-generated content",
        scheduledDate: item.date || undefined,
        hoursPerDay: item.hours_to_do || undefined,
      }));
      setTasks(formattedTasks);
    }
  }, [roadmap, tasks.length]);

  const toggleTask = (id: number) => {
    const today = new Date().toISOString().split("T")[0];
    setTasks(tasks.map((t) =>
      t.id === id
        ? { ...t, done: !t.done, completedAt: !t.done ? today : undefined }
        : t
    ));
  };

  const completedTasks = tasks.filter((t) => t.done).length;
  const totalXp = tasks.filter((t) => t.done).reduce((acc, t) => acc + t.xp, 0);

  // --- EMPTY STATE (If no roadmap generated yet) ---
  if (!roadmap || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
          <Brain className="w-10 h-10 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">No Learning Path Found</h2>
          <p className="text-purple-400 max-w-md mx-auto">
            You haven't generated a roadmap yet. Upload your resume and JD in the Training Setup to begin.
          </p>
        </div>
        <button
          onClick={() => setCurrentPage("training")}
          className="btn-glow px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Training Setup
        </button>
      </div>
    );
  }

  // --- MAIN CONTENT ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Your AI Learning Path</h1>
        </div>
        <p className="text-purple-400 text-sm">
          NeuralPath has calibrated {tasks.length} modules based on your profile
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Roadmap Display */}
        <div className="xl:col-span-2 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Step-by-Step Roadmap</h3>
              </div>
              <div className="text-right">
                <span className="text-yellow-400 text-xs font-bold block">{totalXp} XP EARNED</span>
                <span className="text-purple-500 text-[10px] uppercase tracking-wider">Llama 3.2 Optimized</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-purple-950/50 rounded-full mb-8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-400 pulse-glow"
              />
            </div>

            <div className="space-y-4">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleTask(task.id)}
                  className={`group relative p-4 rounded-2xl border cursor-pointer transition-all ${
                    task.done 
                      ? "border-green-500/30 bg-green-500/5 opacity-70" 
                      : "border-purple-800/40 bg-black/20 hover:border-purple-500/60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      task.done ? "border-green-500 bg-green-500" : "border-purple-500/50 group-hover:border-purple-400"
                    }`}>
                      {task.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold text-sm ${task.done ? "text-green-400" : "text-white"}`}>
                          {task.task}
                        </h4>
                        <span className="text-[10px] text-purple-500 font-mono">+{task.xp} XP</span>
                      </div>
                      <p className="text-xs text-purple-400/70 mt-1 line-clamp-1">{task.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-[10px] text-purple-500">
                        <Clock className="w-3 h-3" />
                        {task.hoursPerDay ? `${task.hoursPerDay}h` : task.duration}
                      </div>
                      {task.scheduledDate && (
                        <span className="text-[9px] text-purple-600 font-mono">
                          {new Date(task.scheduledDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {!task.done && (
                         <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                            START
                         </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">LLM Insights</h3>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <p className="text-xs font-semibold text-white mb-1">Focus Areas Detected</p>
                <p className="text-[11px] text-purple-400 leading-relaxed">
                  Based on the Job Description, Llama 3.2 recommends spending 20% more time on 
                  <span className="text-purple-200"> System Architecture</span>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs font-semibold text-white mb-1">Skill Gap Analysis</p>
                <p className="text-[11px] text-blue-400 leading-relaxed">
                  We found a discrepancy in <span className="text-blue-200">Deployment Pipelines</span>. 
                  Added 2 prerequisite modules to your path.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Engagement Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 bg-gradient-to-br from-purple-900/20 to-black">
             <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Session Stats</h4>
             <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                   <p className="text-lg font-bold text-white">{completedTasks}</p>
                   <p className="text-[9px] text-purple-500">TASKS DONE</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                   <p className="text-lg font-bold text-white">{totalXp}</p>
                   <p className="text-[9px] text-yellow-500">XP SCORE</p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}