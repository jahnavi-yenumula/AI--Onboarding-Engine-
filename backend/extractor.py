import pdfplumber
import json
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

from standardizer import standardizer 

llm = Ollama(model="llama3")

# Create a strict prompt template to force JSON output
prompt_template = """
You are an expert technical recruiter system. Extract the professional skills, tools, and their estimated proficiency level from the following text. 
Respond ONLY with a valid JSON object. Do not include any conversational text.

CRITICAL INSTRUCTIONS FOR PROFICIENCY LEVEL:
1. CROSS-REFERENCE: You must actively scan the "Experience", "Leadership", and "Projects" sections to see if a skill was practically applied.
2. If the exact level is explicitly stated (e.g., "Intermediate", "Expert"), use that.
3. If the skill was used to actively build a project, lead a team, or create professional assets (e.g., using Affinity for design mastery or Java for a desktop app), you MUST assign "Intermediate" or "Advanced".
4. If the skill is only listed in the skills section with zero project context, default to "Beginner".
5. NEVER output null for a level.

The JSON schema must strictly follow this format:
{{
  "skills": [
    {{"skill_name": "Java", "level": "Intermediate"}},
    {{"skill_name": "Python", "level": "Beginner"}}
  ]
}}

Text to analyze:
{text}
"""
jd_prompt_template = """
You are an expert technical recruiter system. Extract the REQUIRED professional skills, tools, and their minimum required proficiency level from the following Job Description. 
Respond ONLY with a valid JSON object. Do not include any conversational text.

CRITICAL INSTRUCTIONS FOR PROFICIENCY LEVEL:
1. If the exact required level is explicitly stated (e.g., "Must have advanced Python", "Basic understanding of Git"), use that.
2. If a skill is listed under "Requirements" or "Qualifications" but no level is given, infer the level based on the overall seniority of the role (e.g., default to "Intermediate" for a standard role, "Advanced" for a Senior role).
3. If a skill is listed under "Nice to have" or "Bonus", assign "Beginner".
4. NEVER output null for a level.

The JSON schema must strictly follow this format:
{{
  "required_skills": [
    {{"skill_name": "Java", "required_level": "Advanced"}},
    {{"skill_name": "SQL", "required_level": "Intermediate"}}
  ]
}}

Job Description to analyze:
{text}
"""

jd_prompt = PromptTemplate(template=jd_prompt_template, input_variables=["text"])

prompt = PromptTemplate(template=prompt_template, input_variables=["text"])

def extract_text_from_pdf(pdf_bytes):
    """Reads PDF file bytes and returns the raw text."""
    text = ""
    with pdfplumber.open(pdf_bytes) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def parse_skills_with_llm(document_text):
    """Sends text to Llama 3 and returns parsed JSON."""
    formatted_prompt = prompt.format(text=document_text)
    
    # Define response_text up here so it ALWAYS exists, even if it fails
    response_text = "No response generated from LLM." 
    
    try:
        # Try to call the model
        response_text = llm.invoke(formatted_prompt)
        
        # Clean the response to ensure it's pure JSON
        clean_json = response_text.strip().replace('```json', '').replace('```', '')
        skills_json = json.loads(clean_json)

        # --- NEW CODE START: Standardization Loop ---
        if "skills" in skills_json:
            for skill in skills_json["skills"]:
                original_name = skill.get("skill_name", "")
                # This snaps "ReactJS" to "React" using your O*NET data
                skill["skill_name"] = standardizer.standardize(original_name)
        # --- NEW CODE END ---

        return skills_json
    except Exception as e:
         print(f"Error parsing JSON from LLM: {e}")
         # Now we safely return the error string without crashing the server
         return {
             "error": "Failed to parse skills", 
             "error_details": str(e),
             "raw_output": response_text
         }
    
def parse_jd_with_llm(document_text):
    """Sends JD text to Llama 3 and returns parsed JSON."""
    formatted_prompt = jd_prompt.format(text=document_text)
    response_text = "No response generated from LLM." 
    
    try:
        response_text = llm.invoke(formatted_prompt)
        clean_json = response_text.strip().replace('```json', '').replace('```', '')
        return json.loads(clean_json)
        
    except Exception as e:
         print(f"Error parsing JD JSON from LLM: {e}")
         return {
             "error": "Failed to parse JD skills", 
             "error_details": str(e),
             "raw_output": response_text
         }