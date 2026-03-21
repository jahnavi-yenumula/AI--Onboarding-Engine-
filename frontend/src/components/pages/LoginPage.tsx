"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, ChevronRight, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app-context";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "next-themes";

export default function LoginPage() {
  const { login, role, setRole } = useApp();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    login(email, role);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme toggle — top right */}
      <div className="absolute top-5 right-6 z-10 flex items-center gap-2">
        <span className="text-purple-400 text-xs opacity-70">{theme === "dark" ? "Dark" : "Light"}</span>
        <ThemeToggle />
      </div>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-glow mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white glow-text-purple">NeuralPath</h1>
          <p className="text-purple-400 mt-1 text-sm">AI-Powered Training Platform</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Role Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-purple-800/40 mb-8 p-1 bg-purple-950/30">
            {(["trainee", "recruiter"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 capitalize ${
                  role === r
                    ? "btn-glow text-white"
                    : "text-purple-400 hover:text-purple-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="dark-input w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="dark-input w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-purple-400 text-xs cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 accent-purple-500" />
                Remember me
              </label>
              <button type="button" className="text-purple-400 text-xs hover:text-purple-300 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Sign In as {role === "trainee" ? "Trainee" : "Recruiter"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-purple-500 text-xs">
              Don&apos;t have an account?{" "}
              <button className="text-purple-300 hover:text-white transition-colors font-medium">
                Create one free
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-purple-600 text-xs mt-6">
          Powered by Advanced AI · Secure & Encrypted
        </p>
      </motion.div>
    </div>
  );
}
