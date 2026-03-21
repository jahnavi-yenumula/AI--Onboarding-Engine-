from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel 
import io, json, os
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
    catalog: dict = None

@app.post("/api/debug-parse")
async def debug_parse(file: UploadFile = File(...), doc_type: str = "resume"):
    """Debug endpoint — returns raw extracted text + raw LLM output before JSON parsing."""
    pdf_bytes = io.BytesIO(await file.read())
    raw_text = extract_text_from_pdf(pdf_bytes)
    from extractor import llm, prompt, jd_prompt
    formatted = (prompt if doc_type == "resume" else jd_prompt).format(text=raw_text)
    raw_llm = llm.invoke(formatted)
    return {
        "extracted_text_preview": raw_text[:500],
        "raw_llm_output": raw_llm,
        "char_count": len(raw_text),
    }

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
        
        print(f"[RESUME] LLM returned {len(skills_data.get('skills', []))} skills")
        if skills_data.get('error'):
            print(f"[RESUME] LLM error: {skills_data.get('error_details')}")
            print(f"[RESUME] Raw output: {skills_data.get('raw_output', '')[:300]}")
        
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
        
        print(f"[JD] LLM returned {len(jd_data.get('required_skills', []))} required skills")
        if jd_data.get('error'):
            print(f"[JD] LLM error: {jd_data.get('error_details')}")
            print(f"[JD] Raw output: {jd_data.get('raw_output', '')[:300]}")
        
        # Standardized return for your TrainingPage.tsx
        return {
            "status": "success",
            "job_title": jd_data.get("job_title", "Custom Role"), # Changed key to 'job_title'
            "requirements": jd_data
        }
        
    except Exception as e:
        print(f"Error extracting JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are supported.")
    try:
        content = await file.read()
        catalog = json.loads(content)
        if "courses" not in catalog or not isinstance(catalog["courses"], list):
            raise HTTPException(status_code=400, detail="Invalid catalog format. Must have a 'courses' array.")
        catalog_path = os.path.join(os.path.dirname(__file__), 'course_catalog.json')
        with open(catalog_path, 'w') as f:
            json.dump(catalog, f, indent=2)
        return {"status": "success", "courses_loaded": len(catalog["courses"])}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/catalog")
async def get_catalog():
    try:
        catalog_path = os.path.join(os.path.dirname(__file__), 'course_catalog.json')
        with open(catalog_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-pathway")
async def generate_pathway(request: PathwayRequest):
    try:
        print(f"--- GENERATING PATHWAY ---")
        print(f"Resume Data received: {list(request.resume_data.keys())}")
        print(f"JD Data received: {list(request.jd_data.keys())}")

        # If a catalog was sent from the frontend, write it temporarily for this request
        catalog_path = os.path.join(os.path.dirname(__file__), 'course_catalog.json')
        if request.catalog:
            print(f"Using recruiter-supplied catalog ({len(request.catalog.get('courses', []))} courses)")
            original_catalog = None
            try:
                with open(catalog_path, 'r') as f:
                    original_catalog = f.read()
            except Exception:
                pass
            with open(catalog_path, 'w') as f:
                json.dump(request.catalog, f)

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

        # Restore original catalog if we swapped it
        if request.catalog and original_catalog is not None:
            with open(catalog_path, 'w') as f:
                f.write(original_catalog)
        
        print(f"Roadmap generated with {len(daily_roadmap)} days.")
        
        return {
            "status": "success",
            "roadmap": daily_roadmap
        }
        
    except Exception as e:
        import traceback
        print(traceback.format_exc()) 
        raise HTTPException(status_code=500, detail=f"Logic Error: {str(e)}")