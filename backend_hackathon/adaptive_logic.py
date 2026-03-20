# adaptive_logic.py

# Numerical mapping for proficiency levels
PREREQUISITES = {
    "Spring Boot": ["Java"],
    "Machine Learning": ["Python", "Statistics"],
    "PostgreSQL": ["SQL"]
}

LEVEL_MAP = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "null": 0 # Just in case!
}

from thefuzz import process

# ... (keep your LEVEL_MAP up here) ...
def get_priority_label(score):
    if score >= 7:
        return "High"
    elif score >= 4:
        return "Medium"
    else:
        return "Low"

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
        importance = req.get("importance", 2)  # default = 2
        gap_magnitude = req_level_num - trainee_level_num
        priority_score = (gap_magnitude * 2) + importance
        
        
        if gap_magnitude > 0:
            skill_gaps.append({
                "module_name": req.get("skill_name"), # Keep original capitalization
                "current_level": trainee_level_num,
                "target_level": req_level_num,
                "gap_score": gap_magnitude,
                "priority_score": priority_score,
                "reasoning_trace": f"You are currently at level {trainee_level_num}, but the role requires level {req_level_num}. This skill is prioritized due to its importance in the role."
            })
            
    skill_gaps = sorted(skill_gaps, key=lambda x: x["priority_score"], reverse=True)  
    return skill_gaps
import json
import os

def add_prerequisites(skill_gaps):
    existing_skills = {gap["module_name"] for gap in skill_gaps}
    new_gaps = []

    for gap in skill_gaps:
        skill = gap["module_name"]

        if skill in PREREQUISITES:
            for prereq in PREREQUISITES[skill]:
                
                if prereq not in existing_skills:
                    new_gaps.append({
                        "module_name": prereq,
                        "current_level": 0,
                        "target_level": 1,
                        "gap_score": 1,
                        "priority_score": gap["priority_score"] + 1,  # higher than dependent skill
                        "reasoning_trace": f"Added as prerequisite for {skill}"
                    })

    return skill_gaps + new_gaps

def map_gaps_to_courses(skill_gaps):
    total_time = 0
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
        
        # Sort courses by difficulty (1 → 2 → 3)
        matching_courses = sorted(matching_courses, key=lambda x: x['difficulty_level'])
        recommended_courses = []

        for course in matching_courses:
          if course['difficulty_level'] <= target_level:
            recommended_courses.append(course)
       
            
        for course in recommended_courses:
          hours = int(course['duration'].split()[0])
          total_time += hours
          final_learning_pathway.append({
            "course_id": course['course_id'],
            "course_title": course['title'],
            "duration": course['duration'],
            "skill_addressed": module_name,
            "priority_score": gap.get("priority_score"),
            "priority_label": get_priority_label(gap.get("priority_score")),
            "level": course['difficulty_level'],
            "reasoning_trace": gap['reasoning_trace']
})

    

    final_learning_pathway = sorted(
      final_learning_pathway,
      key=lambda x: (-x["priority_score"], x["level"])
)        

    return {
    "pathway": final_learning_pathway,
    "total_time": total_time
}