"use client";
import { useApp } from "@/lib/app-context";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, Zap, LogOut, Brain, Pencil, Check
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";

const traineeNav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "training", label: "Training Setup", icon: Zap },
  { id: "learning", label: "Learning Path", icon: BookOpen },
];

const recruiterNav = [
  { id: "recruiter", label: "Recruiter Panel", icon: Users },
  { id: "dashboard", label: "Analytics", icon: LayoutDashboard },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, role, setIsLoggedIn, displayName, setDisplayName, currentEmail, logout } = useApp();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => setMounted(true), []);

  // Sync input when displayName loads from profile
  useEffect(() => { setNameInput(displayName); }, [displayName]);

  const navItems = role === "trainee" ? traineeNav : recruiterNav;

  const handleLogout = () => logout();

  const commitName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setDisplayName(trimmed);
    setEditing(false);
  };

  const shownName = displayName || currentEmail?.split("@")[0] || (role === "trainee" ? "Trainee" : "Recruiter");

  const initials = shownName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar-gradient w-64 min-h-screen flex flex-col py-6 px-4 fixed left-0 top-0 z-30 border-r border-purple-900/20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl btn-glow flex items-center justify-center bg-purple-600 shadow-lg shadow-purple-500/40">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">NeuralPath</p>
          <p className="text-purple-400 text-[10px] uppercase tracking-widest font-bold">Llama 3.2 Engine</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="glass-card-light px-3 py-2 mb-6 flex items-center gap-2 border border-purple-500/20 rounded-lg bg-white/5">
        <GraduationCap className="w-4 h-4 text-purple-400" />
        <span className="text-purple-300 text-[11px] font-bold uppercase tracking-wider">{role} Mode</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentPage(id as any)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left w-full ${
                active
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/40"
                  : "text-purple-300/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-white" : "text-purple-500"}`} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white pulse-glow" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto pt-4 border-t border-purple-900/40">
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">
            {mounted && theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </span>
          <ThemeToggle />
        </div>
        
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-purple-500/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditing(false); }}
                  className="bg-transparent border-b border-purple-500 text-white text-xs font-semibold w-full focus:outline-none"
                  maxLength={30}
                />
                <button onClick={commitName} className="text-green-400 hover:text-green-300 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <p className="text-white text-xs font-semibold truncate">{shownName}</p>
                <button
                  onClick={() => { setNameInput(shownName); setEditing(true); }}
                  className="opacity-0 group-hover:opacity-100 text-purple-500 hover:text-purple-300 transition-opacity flex-shrink-0"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
            <p className="text-purple-500 text-[10px] font-bold uppercase">{role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm w-full font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}