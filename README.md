# 🚀 Adaptive Skill-Gap Onboarding Engine

An AI-driven backend engine designed to automate corporate onboarding by identifying 1:1 skill gaps between a Trainee's resume and a Recruiter's Job Description (JD). 

## 🧠 The Problem
Traditional onboarding is static, forcing new hires to sit through redundant training. Our engine dynamically calculates exactly what a trainee *doesn't* know, saving up to 30% of initial training time.

## 🛠️ Core Features
- **Semantic Extraction:** Uses Llama 3 (via Ollama) to infer proficiency levels (0-3) from project descriptions and work history.
- **O*NET Standardization:** Cross-references extracted skills against the **O*NET Technology Skills Database** (30,000+ entries) using Levenshtein-distance fuzzy matching (95% confidence threshold) to ensure data grounding.
- **Adaptive Mapping:** A custom numerical algorithm that sequences learning modules based on the calculated gap:
  $$Gap = \max(0, Target_{Level} - Current_{Level})$$
- **Reasoning Trace:** Every recommendation includes a "Why," explaining exactly which part of the JD triggered the learning module.

## 🏗️ System Architecture
1. **Ingestion:** PDF text extraction via `pdfplumber`.
2. **Processing:** LangChain-orchestrated Llama 3 parsing.
3. **Standardization:** Python-based fuzzy logic matching against O*NET taxonomies.
4. **Logic:** Gap analysis and Course Catalog mapping.
5. **API:** FastAPI endpoints for seamless frontend integration.

## 💻 Tech Stack
- **Language:** Python 3.10+
- **LLM:** Meta Llama 3 (8B)
- **Frameworks:** FastAPI, LangChain
- **Libraries:** Pandas, TheFuzz, Uvicorn
- **Data Source:** O*NET Resource Center (Release 30.1)

## 🚦 Getting Started
1. Clone the repo.
2. Install dependencies: `pip install -r backend/requirements.txt`.
3. Start the engine: `uvicorn backend.app:app --reload`.
4. Visit `http://127.0.0.1:8000/docs` to test the API.
