"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload, Clock, Sparkles, FileText, Briefcase, CheckCircle2, Zap, AlertCircle, Loader2, Calendar
} from "lucide-react";
import { useApp } from "@/lib/app-context";

const scheduleOptions = [
  { label: "1 Hour", value: "1", icon: "⚡" },
  { label: "2 Hours", value: "2", icon: "🔥" },
  { label: "Custom", value: "custom", icon: "⚙️" },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function TrainingPage() {
  // 1. GLOBAL STATE: Pull from context so the app "remembers" across page switches
  const { 
    setCurrentPage, 
    setRoadmap, 
    resumeData, 
    setResumeData, 
    jdData, 
    setJdData,
    currentCatalog,
  } = useApp();
  
  // 2. LOCAL UI STATE: Only exists while you are on this page
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [schedule, setSchedule] = useState("2");
  const [customHours, setCustomHours] = useState("3");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [extractingResume, setExtractingResume] = useState(false);
  const [extractingJd, setExtractingJd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // 3. LOGIC: Handle File Uploads
  const handleFileUpload = async (file: File, type: "resume" | "jd") => {
    setError(null);
    type === "resume" ? setExtractingResume(true) : setExtractingJd(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API}/api/extract-${type}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server error ${response.status}`);
      }

      if (type === "resume") {
        if (data.error || !data.skills || data.skills.length === 0) {
          setError(`Resume parsed but no skills found. Try a clearer PDF. (${data.error_details || "LLM returned empty"})`);
          return;
        }
        setResumeFile(file);
        setResumeData(data);
      } else {
        if (data.error || !data.requirements?.required_skills || data.requirements.required_skills.length === 0) {
          setError(`JD parsed but no required skills found. Try a clearer PDF. (${data.requirements?.error_details || "LLM returned empty"})`);
          return;
        }
        setJdFile(file);
        setJdData(data);
      }
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Cannot reach backend. Make sure the Python server is running on port 8000.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      type === "resume" ? setExtractingResume(false) : setExtractingJd(false);
    }
  };

  // 4. LOGIC: Generate AI Pathway
  
const handleGenerate = async () => {
  if (!resumeData || !jdData) {
    setError("Data missing in context. Please re-upload your files.");
    return;
  }

  setGenerating(true);
  setError(null);

  try {
    const dailyHours = Number(schedule === "custom" ? customHours : schedule);
    if (!dailyHours || dailyHours <= 0 || isNaN(dailyHours)) {
      setError("Please enter a valid number of daily hours greater than 0.");
      setGenerating(false);
      return;
    }

    const payload: any = {
      resume_data: resumeData.raw_analysis || resumeData,
      jd_data: jdData.requirements || jdData,
      start_date: startDate,
      daily_commitment: dailyHours,
      blackout_dates: [],
    };

    // Attach recruiter's catalog if one is loaded
    if (currentCatalog) {
      payload.catalog = currentCatalog;
    }

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${API}/api/generate-pathway`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (response.ok && result.status === "success" && result.roadmap?.length > 0) {
      console.log("Roadmap received:", result.roadmap);
      setRoadmap(result.roadmap);
      setCurrentPage("learning");
    } else if (response.ok && result.roadmap?.length === 0) {
      setError("No skill gaps found between your resume and the job description. Try a different JD.");
    } else {
      setError(result.detail || result.message || "The AI Engine couldn't calculate a path. Check Python logs.");
    }
  } catch (err) {
    setError("Connection lost. Is the Python backend running on port 8000?");
  } finally {
    setGenerating(false);
  }
};

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Zap className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Training Setup</h1>
        </div>
        <p className="text-purple-400 text-sm">Upload documents to calibrate your Llama 3.2 Engine</p>
      </motion.div>

      {/* Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Resume Box */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">Resume</h3>
            </div>
            {resumeData && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">READY</span>}
          </div>
          <div
            onClick={() => !extractingResume && resumeInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              resumeData ? "border-green-500/30 bg-green-500/5" : "border-purple-800/30 hover:border-purple-500"
            }`}
          >
            {extractingResume ? (
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
            ) : resumeData ? (
              <div className="space-y-2">
                <CheckCircle2 className="mx-auto w-10 h-10 text-green-400" />
                <div className="flex flex-wrap gap-1 justify-center">
                  {resumeData.skills?.slice(0, 3).map((s: any, idx: number) => (
                    <span key={idx} className="text-[9px] bg-white/5 text-purple-300 px-2 py-0.5 rounded border border-white/10">
                      {typeof s === 'object' ? s.skill_name : s}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <Upload className="mx-auto w-10 h-10 text-purple-500" />
            )}
            <p className="text-purple-300 text-xs mt-2 truncate">{resumeFile?.name || "Upload PDF"}</p>
          </div>
        </div>

        {/* JD Box */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold text-sm">Job Description</h3>
            </div>
            {jdData && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">READY</span>}
          </div>
          <div
            onClick={() => !extractingJd && jdInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              jdData ? "border-blue-500/30 bg-blue-500/5" : "border-blue-900/30 hover:border-blue-500"
            }`}
          >
            {extractingJd ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            ) : jdData ? (
              <CheckCircle2 className="mx-auto w-10 h-10 text-blue-400" />
            ) : (
              <Upload className="mx-auto w-10 h-10 text-blue-500" />
            )}
            <p className="text-blue-300 text-xs mt-2 truncate">{jdFile?.name || "Upload PDF"}</p>
          </div>
        </div>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-6">
          <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" /> Daily Hours
          </h3>
          <div className="flex gap-2">
            {scheduleOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSchedule(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  schedule === opt.value ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "bg-white/5 text-purple-300 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {schedule === "custom" && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="24"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                placeholder="Enter hours"
              />
              <span className="text-purple-400 text-xs whitespace-nowrap">hrs / day</span>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> Start Date
          </h3>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pb-8 pt-4">
        <motion.button
          onClick={handleGenerate}
          disabled={generating || !resumeData || !jdData}
          whileTap={{ scale: 0.97 }}
          className="btn-glow px-12 py-4 rounded-2xl text-white font-bold text-lg flex items-center gap-3 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          {generating ? "AI Generating Path..." : "Generate AI Learning Path"}
        </motion.button>
      </div>

      {/* Hidden File Inputs */}
      <input type="file" ref={resumeInputRef} hidden accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "resume")} />
      <input type="file" ref={jdInputRef} hidden accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "jd")} />
    </div>
  );
}