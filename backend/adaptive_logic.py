# adaptive_logic.py

# Numerical mapping for proficiency levels
LEVEL_MAP = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "null": 0 # Just in case!
}

from thefuzz import process

# ... (keep your LEVEL_MAP up here) ...

def calculate_skill_gap(resume_json, jd_json):
    # 1. Convert resume skills into a flat dictionary
    resume_skills = {}
    for skill in resume_json.get("skills", []):
        name = skill.get("skill_name").lower()
        level_num = LEVEL_MAP.get(skill.get("level"), 0)
        resume_skills[name] = level_num

    skill_gaps = []
    
    # Create a list of the resume skill names for the fuzzy matcher to search through
    resume_skill_names = list(resume_skills.keys())
    
    # 2. Loop through the JD requirements and compare
    for req in jd_json.get("required_skills", []):
        req_name = req.get("skill_name").lower()
        req_level_str = req.get("required_level")
        req_level_num = LEVEL_MAP.get(req_level_str, 1)
        
        # --- THE FUZZY MATCHING UPGRADE ---
        trainee_level_num = 0
        if resume_skill_names:
            # Find the closest matching skill in the resume
            best_match, score = process.extractOne(req_name, resume_skill_names)
            
            # If the match is 80% similar or higher, we accept it!
            if score >= 80:
                trainee_level_num = resume_skills[best_match]
        # ----------------------------------
        
        # 3. The Math: Is there a gap?
        gap_magnitude = req_level_num - trainee_level_num
        
        if gap_magnitude > 0:
            skill_gaps.append({
                "module_name": req.get("skill_name"), # Keep original capitalization
                "current_level": trainee_level_num,
                "target_level": req_level_num,
                "gap_score": gap_magnitude,
                "reasoning_trace": f"Resume indicates level {trainee_level_num}, but JD requires level {req_level_num} ({req_level_str})."
            })
            
    return skill_gaps
import json
import os

def map_gaps_to_courses(skill_gaps):
    """
    Takes the identified skill gaps and maps them to real courses 
    from the company's course catalog.
    """
    # Load the catalog
    catalog_path = os.path.join(os.path.dirname(__file__), 'course_catalog.json')
    try:
        with open(catalog_path, 'r') as f:
            catalog = json.load(f)
    except FileNotFoundError:
        return {"error": "Course catalog not found."}

    final_learning_pathway = []

    for gap in skill_gaps:
        module_name = gap['module_name']
        target_level = gap['target_level']
        
        # Find all courses that teach this skill
        matching_courses = [c for c in catalog['courses'] if c['skill_tag'].lower() == module_name.lower()]
        
        # Find the course that specifically targets the required difficulty level
        recommended_course = None
        for course in matching_courses:
            if course['difficulty_level'] == target_level:
                recommended_course = course
                break
        
        # If we couldn't find an exact level match, just grab the closest introductory one
        if not recommended_course and matching_courses:
            recommended_course = matching_courses[0]
            
        if recommended_course:
            final_learning_pathway.append({
                "course_id": recommended_course['course_id'],
                "course_title": recommended_course['title'],
                "duration": recommended_course['duration'],
                "skill_addressed": module_name,
                "reasoning_trace": gap['reasoning_trace']
            })
        else:
            # Handle edge cases where the company doesn't have a course for a required skill
            final_learning_pathway.append({
                "course_id": "EXTERNAL-REQ",
                "course_title": f"External Training Required: {module_name}",
                "duration": "TBD",
                "skill_addressed": module_name,
                "reasoning_trace": f"{gap['reasoning_trace']} Note: No internal course found."
            })

    return final_learning_pathway