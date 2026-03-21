"use client";
import { AppProvider, useApp } from "@/lib/app-context";
import Sidebar from "@/components/Sidebar";
import LoginPage from "@/components/pages/LoginPage";
import TrainingPage from "@/components/pages/TrainingPage";
import DashboardPage from "@/components/pages/DashboardPage";
import LearningPage from "@/components/pages/LearningPage";
import RecruiterPage from "@/components/pages/RecruiterPage";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

function AppContent() {
  const { isLoggedIn, currentPage } = useApp();

  if (!isLoggedIn) return <LoginPage />;

  const pages: Record<string, React.ReactNode> = {
    training: <TrainingPage />,
    dashboard: <DashboardPage />,
    learning: <LearningPage />,
    recruiter: <RecruiterPage />,
  };

  const pageLabels: Record<string, string> = {
    training: "Training Setup",
    dashboard: "Dashboard",
    learning: "Learning Path",
    recruiter: "Recruiter Panel",
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 border-b border-purple-900/30 backdrop-blur-xl bg-black/10">
          <div>
            <h2 className="text-white font-semibold text-sm">
              {pageLabels[currentPage] ?? "Dashboard"}
            </h2>
            <p className="text-purple-500 text-xs">NeuralPath AI Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="relative w-8 h-8 rounded-lg glass-card-light flex items-center justify-center text-purple-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-400 rounded-full pulse-glow" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              AT
            </div>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {pages[currentPage] ?? <DashboardPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
