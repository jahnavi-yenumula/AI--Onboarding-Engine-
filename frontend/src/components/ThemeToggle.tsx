"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 1. Prevent Hydration Mismatch (Wait until mounted)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-14 h-7" />; // Placeholder to prevent layout shift

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${
        isDark ? "bg-purple-900/40 border border-purple-500/30" : "bg-slate-200 border border-slate-300"
      }`}
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        animate={{ x: isDark ? 28 : 0 }}
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
          isDark ? "bg-purple-600" : "bg-white"
        }`}
      >
        {isDark ? "🌙" : "☀️"}
      </motion.div>
    </button>
  );
}