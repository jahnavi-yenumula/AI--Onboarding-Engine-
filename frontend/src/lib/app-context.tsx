"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Task = {
  id: number;
  task: string;
  done: boolean;
  xp: number;
  duration: string;
  description: string;
  completedAt?: string;
  scheduledDate?: string;
  hoursPerDay?: number;
  reasoningTrace?: string;
};

export type LearningPeriod = {
  startDate: string;
  endDate: string;
  label: string;
};

export type TraineeEntry = {
  email: string;
  displayName: string;
  tasks: Task[];
  roadmap: any;
  learningPeriod?: LearningPeriod;
  recruiterEmail?: string;
};

export type RecruiterEntry = {
  email: string;
  displayName: string;
  isDefault: boolean;
};

export type RecruiterPeriodForm = { label: string; startDate: string; endDate: string; target: string; };

type TraineeProfile = {
  resumeData: any;
  jdData: any;
  roadmap: any;
  tasks: Task[];
  displayName: string;
  learningPeriod?: LearningPeriod;
  recruiterEmail?: string;
};

type AppContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  role: "trainee" | "recruiter";
  setRole: (role: "trainee" | "recruiter") => void;
  currentEmail: string;
  login: (email: string, role: "trainee" | "recruiter") => void;
  logout: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  // --- PERSISTENT DATA ---
  resumeData: any;
  setResumeData: (data: any) => void;
  jdData: any;
  setJdData: (data: any) => void;
  roadmap: any;
  setRoadmap: (data: any) => void;
  // --- TASKS ---
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  theme: string;
  setTheme: (theme: string) => void;
  // --- CATALOG ---
  currentCatalog: any | null;
  setCurrentCatalog: (catalog: any | null) => void;
  // --- RECRUITER ---
  traineeRegistry: TraineeEntry[];
  addTraineeToRegistry: (email: string, byRecruiter?: string) => void;
  removeTraineeFromRegistry: (email: string) => void;
  updateTraineeTasks: (email: string, tasks: Task[]) => void;
  updateTraineeLearningPeriod: (email: string, period: LearningPeriod) => void;
  selectedTraineeEmail: string | null;
  setSelectedTraineeEmail: (email: string | null) => void;
  learningPeriod?: LearningPeriod;
  // --- RECRUITER REGISTRY ---
  recruiterRegistry: RecruiterEntry[];
  addRecruiterToRegistry: (email: string) => void;
  removeRecruiterFromRegistry: (email: string) => void;
  // --- TRAINEE RECRUITER ---
  recruiterEmail: string;
  // --- RECRUITER PERIOD FORM ---
  loadRecruiterPeriodForm: (email: string) => RecruiterPeriodForm | null;
  saveRecruiterPeriodForm: (email: string, form: RecruiterPeriodForm) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_RECRUITER_EMAIL = "admin@neuralpath.ai";

// The default course catalog — always available for the admin recruiter
const DEFAULT_CATALOG = {"courses":[{"course_id":"SPRING-101","skill_tag":"Spring Boot","difficulty_level":1,"title":"Spring Boot Fundamentals: Building REST APIs","duration":"4 Hours"},{"course_id":"SPRING-201","skill_tag":"Spring Boot","difficulty_level":2,"title":"Advanced Spring Boot & Microservices","duration":"6 Hours"},{"course_id":"SQL-101","skill_tag":"SQL","difficulty_level":1,"title":"Introduction to Databases & Basic Queries","duration":"3 Hours"},{"course_id":"SQL-201","skill_tag":"SQL","difficulty_level":2,"title":"Intermediate SQL: Joins, Subqueries, and Indexing","duration":"5 Hours"},{"course_id":"POSTGRES-101","skill_tag":"PostgreSQL","difficulty_level":1,"title":"PostgreSQL Quickstart for Developers","duration":"2 Hours"},{"course_id":"JAVA-301","skill_tag":"Java","difficulty_level":3,"title":"Enterprise Java Architecture","duration":"8 Hours"}]};

const STORAGE_KEY = (email: string) => `neuralpath_trainee_${email.toLowerCase()}`;
const RECRUITER_KEY = (email: string) => `neuralpath_recruiter_${email.toLowerCase()}`;
const CATALOG_KEY = (email: string) => `neuralpath_catalog_${email.toLowerCase()}`;

function loadProfile(email: string): TraineeProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(email));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { resumeData: null, jdData: null, roadmap: null, tasks: [], displayName: "" };
}

function saveProfile(email: string, profile: TraineeProfile) {
  try {
    localStorage.setItem(STORAGE_KEY(email), JSON.stringify(profile));
  } catch {}
}

const REGISTRY_KEY = "neuralpath_trainee_registry";
const RECRUITER_REGISTRY_KEY = "neuralpath_recruiter_registry";

function loadRegistry(): string[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRegistry(emails: string[]) {
  try { localStorage.setItem(REGISTRY_KEY, JSON.stringify(emails)); } catch {}
}

function loadRecruiterRegistry(): RecruiterEntry[] {
  try {
    const raw = localStorage.getItem(RECRUITER_REGISTRY_KEY);
    const saved: RecruiterEntry[] = raw ? JSON.parse(raw) : [];
    // Always ensure default recruiter is present
    if (!saved.find((r) => r.email === DEFAULT_RECRUITER_EMAIL)) {
      saved.unshift({ email: DEFAULT_RECRUITER_EMAIL, displayName: "Admin", isDefault: true });
    }
    return saved;
  } catch {
    return [{ email: DEFAULT_RECRUITER_EMAIL, displayName: "Admin", isDefault: true }];
  }
}

function saveRecruiterRegistry(entries: RecruiterEntry[]) {
  try { localStorage.setItem(RECRUITER_REGISTRY_KEY, JSON.stringify(entries)); } catch {}
}

function loadCatalog(email: string): any {
  try {
    const raw = localStorage.getItem(CATALOG_KEY(email));
    if (raw) return JSON.parse(raw);
  } catch {}
  // Admin always gets the default catalog as fallback
  if (email.toLowerCase() === DEFAULT_RECRUITER_EMAIL) return DEFAULT_CATALOG;
  return null;
}

function saveCatalog(email: string, catalog: any) {
  try { localStorage.setItem(CATALOG_KEY(email), JSON.stringify(catalog)); } catch {}
}

const RECRUITER_PERIOD_KEY = (email: string) => `neuralpath_recruiter_period_${email.toLowerCase()}`;

function loadRecruiterPeriodForm(email: string): RecruiterPeriodForm | null {
  try {
    const raw = localStorage.getItem(RECRUITER_PERIOD_KEY(email));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveRecruiterPeriodForm(email: string, form: RecruiterPeriodForm) {
  try { localStorage.setItem(RECRUITER_PERIOD_KEY(email), JSON.stringify(form)); } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [role, setRole] = useState<"trainee" | "recruiter">("trainee");
  const [currentEmail, setCurrentEmail] = useState("");
  const [theme, setTheme] = useState("dark");

  const [resumeData, setResumeDataState] = useState<any>(null);
  const [jdData, setJdDataState] = useState<any>(null);
  const [roadmap, setRoadmapState] = useState<any>(null);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [displayName, setDisplayNameState] = useState("");
  const [learningPeriod, setLearningPeriodState] = useState<LearningPeriod | undefined>(undefined);
  const [selectedTraineeEmail, setSelectedTraineeEmail] = useState<string | null>(null);
  const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);
  const [recruiterRegistry, setRecruiterRegistry] = useState<RecruiterEntry[]>([]);
  const [currentCatalog, setCurrentCatalogState] = useState<any | null>(null);
  const [recruiterEmail, setRecruiterEmailState] = useState<string>("");

  // Load registries on mount + seed default catalog for admin
  useEffect(() => {
    setRegisteredEmails(loadRegistry());
    const registry = loadRecruiterRegistry();
    setRecruiterRegistry(registry);
    // Seed default catalog for admin if not already saved
    const adminCatalogKey = CATALOG_KEY(DEFAULT_RECRUITER_EMAIL);
    try {
      if (!localStorage.getItem(adminCatalogKey)) {
        localStorage.setItem(adminCatalogKey, JSON.stringify(DEFAULT_CATALOG));
      }
    } catch {}
  }, []);

  // Persist profile whenever data changes
  useEffect(() => {
    if (isLoggedIn && currentEmail) {
      if (role === "trainee") {
        saveProfile(currentEmail, { resumeData, jdData, roadmap, tasks, displayName, learningPeriod, recruiterEmail });
      } else {
        try {
          const entry = recruiterRegistry.find((r) => r.email === currentEmail.toLowerCase());
          const updated = recruiterRegistry.map((r) =>
            r.email === currentEmail.toLowerCase() ? { ...r, displayName } : r
          );
          if (entry) saveRecruiterRegistry(updated);
        } catch {}
      }
    }
  }, [resumeData, jdData, roadmap, tasks, displayName, learningPeriod, recruiterEmail, isLoggedIn, role, currentEmail]);

  const login = useCallback((email: string, selectedRole: "trainee" | "recruiter") => {
    const lEmail = email.toLowerCase();
    setCurrentEmail(lEmail);
    setRole(selectedRole);
    if (selectedRole === "trainee") {
      const profile = loadProfile(lEmail);
      setResumeDataState(profile.resumeData);
      setJdDataState(profile.jdData);
      setRoadmapState(profile.roadmap);
      setTasksState(profile.tasks);
      setDisplayNameState(profile.displayName || "");
      setLearningPeriodState(profile.learningPeriod);
      // Default recruiter is admin if none assigned
      setRecruiterEmailState(profile.recruiterEmail || DEFAULT_RECRUITER_EMAIL);
      setRegisteredEmails((prev) => {
        if (prev.includes(lEmail)) return prev;
        const updated = [...prev, lEmail];
        saveRegistry(updated);
        return updated;
      });
    } else {
      // Load recruiter display name
      const registry = loadRecruiterRegistry();
      const entry = registry.find((r) => r.email === lEmail);
      setDisplayNameState(entry?.displayName || "");
      // Register recruiter if new
      if (!entry) {
        const newEntry: RecruiterEntry = { email: lEmail, displayName: "", isDefault: false };
        const updated = [...registry, newEntry];
        saveRecruiterRegistry(updated);
        setRecruiterRegistry(updated);
      } else {
        setRecruiterRegistry(registry);
      }
      // Load this recruiter's catalog
      const catalog = loadCatalog(lEmail);
      setCurrentCatalogState(catalog);
      setRegisteredEmails(loadRegistry());
    }
    setIsLoggedIn(true);
    setCurrentPage(selectedRole === "recruiter" ? "recruiter" : "dashboard");
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentEmail("");
    setCurrentPage("dashboard");
    setResumeDataState(null);
    setJdDataState(null);
    setRoadmapState(null);
    setTasksState([]);
    setDisplayNameState("");
    setCurrentCatalogState(null);
    setRecruiterEmailState("");
  }, []);

  const setResumeData = useCallback((data: any) => setResumeDataState(data), []);
  const setJdData = useCallback((data: any) => setJdDataState(data), []);
  const setRoadmap = useCallback((data: any) => setRoadmapState(data), []);
  const setTasks = useCallback((t: Task[]) => setTasksState(t), []);
  const setDisplayName = useCallback((name: string) => setDisplayNameState(name), []);

  const setCurrentCatalog = useCallback((catalog: any | null) => {
    setCurrentCatalogState(catalog);
    if (currentEmail && role === "recruiter") {
      if (catalog) saveCatalog(currentEmail, catalog);
      else {
        try { localStorage.removeItem(CATALOG_KEY(currentEmail)); } catch {}
      }
    }
  }, [currentEmail, role]);

  const addTraineeToRegistry = useCallback((email: string, byRecruiter?: string) => {
    const lEmail = email.toLowerCase();
    // Stamp the recruiter on the trainee's profile if not already set
    const profile = loadProfile(lEmail);
    if (!profile.recruiterEmail && byRecruiter) {
      saveProfile(lEmail, { ...profile, recruiterEmail: byRecruiter });
    }
    setRegisteredEmails((prev) => {
      if (prev.includes(lEmail)) return prev;
      const updated = [...prev, lEmail];
      saveRegistry(updated);
      return updated;
    });
  }, []);

  const removeTraineeFromRegistry = useCallback((email: string) => {
    setRegisteredEmails((prev) => {
      const updated = prev.filter((e) => e !== email.toLowerCase());
      saveRegistry(updated);
      return updated;
    });
    // Also clear their localStorage profile
    try { localStorage.removeItem(STORAGE_KEY(email)); } catch {}
  }, []);

  const updateTraineeTasks = useCallback((email: string, newTasks: Task[]) => {
    const profile = loadProfile(email);
    saveProfile(email, { ...profile, tasks: newTasks });
    setRegisteredEmails((prev) => [...prev]);
  }, []);

  const updateTraineeLearningPeriod = useCallback((email: string, period: LearningPeriod) => {
    const profile = loadProfile(email);
    saveProfile(email, { ...profile, learningPeriod: period });
    // If this is the currently logged-in trainee, update their live state too
    if (email.toLowerCase() === currentEmail) {
      setLearningPeriodState(period);
    }
    setRegisteredEmails((prev) => [...prev]);
  }, [currentEmail]);

  const addRecruiterToRegistry = useCallback((email: string) => {
    setRecruiterRegistry((prev) => {
      if (prev.find((r) => r.email === email.toLowerCase())) return prev;
      const updated = [...prev, { email: email.toLowerCase(), displayName: "", isDefault: false }];
      saveRecruiterRegistry(updated);
      return updated;
    });
  }, []);

  const removeRecruiterFromRegistry = useCallback((email: string) => {
    if (email === DEFAULT_RECRUITER_EMAIL) return; // protect default
    setRecruiterRegistry((prev) => {
      const updated = prev.filter((r) => r.email !== email.toLowerCase());
      saveRecruiterRegistry(updated);
      return updated;
    });
    try { localStorage.removeItem(RECRUITER_KEY(email)); } catch {}
    try { localStorage.removeItem(CATALOG_KEY(email)); } catch {}
  }, []);

  const traineeRegistry: TraineeEntry[] = registeredEmails.map((email) => {
    const profile = loadProfile(email);
    return {
      email,
      displayName: profile.displayName || email.split("@")[0],
      tasks: profile.tasks || [],
      roadmap: profile.roadmap,
      learningPeriod: profile.learningPeriod,
      recruiterEmail: profile.recruiterEmail || DEFAULT_RECRUITER_EMAIL,
    };
  });

  return (
    <AppContext.Provider
      value={{
        isLoggedIn, setIsLoggedIn,
        currentPage, setCurrentPage,
        role, setRole,
        currentEmail, login, logout,
        resumeData, setResumeData,
        jdData, setJdData,
        roadmap, setRoadmap,
        tasks, setTasks,
        displayName, setDisplayName,
        theme, setTheme,
        currentCatalog, setCurrentCatalog,
        traineeRegistry, addTraineeToRegistry, removeTraineeFromRegistry,
        updateTraineeTasks, updateTraineeLearningPeriod,
        selectedTraineeEmail, setSelectedTraineeEmail,
        learningPeriod,
        recruiterRegistry, addRecruiterToRegistry, removeRecruiterFromRegistry,
        recruiterEmail,
        loadRecruiterPeriodForm, saveRecruiterPeriodForm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
