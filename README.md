# NeuralPath — AI-Powered Training Platform

An AI-driven onboarding engine that identifies skill gaps between a trainee's resume and a job description, then generates a personalised day-by-day learning path using Llama 3.2 (running locally via Ollama).

---

## Prerequisites

Install these once on any laptop before running the setup script.

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Ollama | latest | https://ollama.com/download |

After installing Ollama, pull the model (one-time, ~5 GB):
```
ollama pull llama3.2
```

---

## Quick Start

### Mac / Linux

```bash
# 1. Clone the repo
git clone <your-github-url>
cd <repo-folder>

# 2. Run setup (installs all dependencies)
chmod +x setup.sh
./setup.sh
```

### Windows

```bat
# 1. Clone the repo
git clone <your-github-url>
cd <repo-folder>

# 2. Double-click setup.bat  OR  run in Command Prompt:
setup.bat
```

Setup takes 2–3 minutes on first run. It creates the Python virtual environment and installs all frontend packages automatically.

---

## Running the App

You need two terminals open at the same time.

**Terminal 1 — Backend**
```bash
# Mac/Linux
cd backend_hackathon
source .venv/bin/activate
uvicorn app:app --reload --port 8000

# Windows
cd backend_hackathon
.venv\Scripts\activate
uvicorn app:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3 — Ollama** (if not already running as a service)
```bash
ollama serve
```

Then open **http://localhost:3000** in your browser.

---

## How to Use

### As a Recruiter
1. Log in with any email, select **Recruiter** role.
2. The default admin account (`admin@neuralpath.ai`) comes pre-loaded with the default course catalog.
3. Upload a custom course catalog JSON from the **Course Catalog** card if needed.
4. Add trainees by email from the **Trainee Directory**.
5. Assign a **Learning Period** (label + start/end dates) to all or specific trainees.
6. Click the eye icon on any trainee to view their analytics and manage their tasks.

### As a Trainee
1. Log in with your email, select **Trainee** role.
2. Go to **Training Setup**, upload your resume PDF and the job description PDF.
3. Choose daily hours and a start date, then click **Generate AI Learning Path**.
4. Your personalised path appears in the **Learning Portal** — check off tasks as you complete them.
5. The **Dashboard** tracks your progress, streak, XP, and the learning period assigned by your recruiter.

---

## Project Structure

```
├── backend_hackathon/       Python FastAPI backend
│   ├── app.py               API routes
│   ├── extractor.py         PDF parsing + Llama 3.2 skill extraction
│   ├── adaptive_logic.py    Skill gap calculation
│   ├── scheduler.py         Daily roadmap generation
│   ├── standardizer.py      O*NET skill standardisation
│   └── course_catalog.json  Default course catalog
│
├── frontend/                Next.js 15 frontend
│   ├── src/app/             App shell + global styles
│   ├── src/components/      Pages and UI components
│   └── src/lib/             App context (state + localStorage)
│
├── setup.sh                 One-command setup (Mac/Linux)
└── setup.bat                One-command setup (Windows)
```

---

## Configuration

The frontend reads the backend URL from `frontend/.env.local` (created automatically by setup):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Change this if your backend runs on a different host or port.

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, Framer Motion, Recharts
- **Backend:** FastAPI, LangChain, Llama 3.2 via Ollama
- **PDF parsing:** pdfplumber
- **Skill matching:** RapidFuzz against O*NET taxonomy
- **Storage:** localStorage (no database required)
