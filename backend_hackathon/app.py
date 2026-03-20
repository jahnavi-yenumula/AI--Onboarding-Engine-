from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel 
import io
from extractor import extract_text_from_pdf, parse_skills_with_llm, parse_jd_with_llm
from adaptive_logic import calculate_skill_gap, map_gaps_to_courses 

app = FastAPI(title="AI Onboarding Engine API")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, you'd limit this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class PathwayRequest(BaseModel):
    resume_data: dict
    jd_data: dict
@app.post("/api/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF resume and return extracted skills in JSON.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        # Read the file into memory
        pdf_bytes = io.BytesIO(await file.read())
        
        # 1. Extract raw text from the PDF
        raw_text = extract_text_from_pdf(pdf_bytes)
        
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")
            
        # 2. Send text to the LLM for structured extraction
        skills_data = parse_skills_with_llm(raw_text)
        
        return {
            "filename": file.filename,
            "status": "success",
            "extracted_data": skills_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/extract-jd")
async def extract_job_description(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF Job Description and return required skills in JSON.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        pdf_bytes = io.BytesIO(await file.read())
        raw_text = extract_text_from_pdf(pdf_bytes)
        
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")
            
        jd_data = parse_jd_with_llm(raw_text)
        
        return {
            "filename": file.filename,
            "status": "success",
            "extracted_requirements": jd_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/generate-pathway")
async def generate_pathway(request: PathwayRequest):
    """
    Endpoint that takes extracted Resume JSON and JD JSON, 
    calculates the skill gap, and returns the final mapped learning pathway.
    """
    try:
        # 1. Calculate the numerical skill gaps
        gaps = calculate_skill_gap(request.resume_data, request.jd_data)

        from adaptive_logic import add_prerequisites
        gaps = add_prerequisites(gaps)
        
        # 2. Handle the edge case of a perfect candidate
        if not gaps:
            return {
                "status": "success", 
                "message": "Trainee is perfectly matched! No onboarding required.", 
                "total_modules": 0,
                "pathway": []
            }
            
        result = map_gaps_to_courses(gaps)
        final_pathway = result["pathway"]
        total_time = result["total_time"]
        
        # 4. Return the data to the frontend UI
        return {
         "status": "success",
         "total_modules": len(final_pathway),
         "estimated_hours": total_time,
         "pathway": final_pathway
}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate pathway: {str(e)}")
