from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel 
import io
from datetime import datetime
from typing import List
from fastapi.middleware.cors import CORSMiddleware

# Import your custom modules
from extractor import extract_text_from_pdf, parse_skills_with_llm, parse_jd_with_llm
from adaptive_logic import calculate_skill_gap, add_prerequisites, map_gaps_to_courses 
from scheduler import generate_daily_roadmap

app = FastAPI(title="AI Onboarding Engine API")

# CORS Setup - Essential for your Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathwayRequest(BaseModel):
    resume_data: dict
    jd_data: dict
    start_date: str 
    daily_commitment: float
    blackout_dates: List[str]

@app.post("/api/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        pdf_bytes = io.BytesIO(await file.read())
        raw_text = extract_text_from_pdf(pdf_bytes)
        
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
            
        skills_data = parse_skills_with_llm(raw_text)
        
        # Standardized return for your TrainingPage.tsx
        return {
            "status": "success",
            "skills": skills_data.get("skills", []), # Changed key to 'skills'
            "raw_analysis": skills_data
        }
        
    except Exception as e:
        print(f"Error extracting resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-jd")
async def extract_job_description(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        pdf_bytes = io.BytesIO(await file.read())
        raw_text = extract_text_from_pdf(pdf_bytes)
        
        jd_data = parse_jd_with_llm(raw_text)
        
        # Standardized return for your TrainingPage.tsx
        return {
            "status": "success",
            "job_title": jd_data.get("job_title", "Custom Role"), # Changed key to 'job_title'
            "requirements": jd_data
        }
        
    except Exception as e:
        print(f"Error extracting JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-pathway")
async def generate_pathway(request: PathwayRequest):
    try:
        # 1. DEBUG: Print what the frontend sent
        print(f"--- GENERATING PATHWAY ---")
        print(f"Resume Data received: {list(request.resume_data.keys())}")
        print(f"JD Data received: {list(request.jd_data.keys())}")

        # 2. Logic Chain
        gaps = calculate_skill_gap(request.resume_data, request.jd_data)
        print(f"Gaps found: {len(gaps)}")
        
        gaps_with_prereqs = add_prerequisites(gaps)
        courses = map_gaps_to_courses(gaps_with_prereqs)
        
        start_dt = datetime.strptime(request.start_date, "%Y-%m-%d").date()
        blackouts = [datetime.strptime(d, "%Y-%m-%d").date() for d in request.blackout_dates]
        
        daily_roadmap = generate_daily_roadmap(
            courses, 
            start_dt, 
            request.daily_commitment, 
            blackouts
        )
        
        print(f"Roadmap generated with {len(daily_roadmap)} days.")
        
        return {
            "status": "success",
            "roadmap": daily_roadmap
        }
        
    except Exception as e:
        # This will print the exact line number and error in your terminal
        import traceback
        print(traceback.format_exc()) 
        raise HTTPException(status_code=500, detail=f"Logic Error: {str(e)}")