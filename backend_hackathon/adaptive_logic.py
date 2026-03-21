import json
import os
from thefuzz import process

PREREQUISITES = {
    "Spring Boot": ["Java"],
    "Machine Learning": ["Python", "Statistics"],
    "PostgreSQL": ["SQL"]
}

LEVEL_MAP = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "null": 0 
}

def calculate_skill_gap(resume_json, jd_json):
    resume_skills = {}
    # Peeling the data in case frontend sent nested objects
    r_skills = resume_json.get("skills", []) if isinstance(resume_json, dict) else []
    
    for skill in r_skills:
        name = skill.get("skill_name", "").lower()
        level_num = LEVEL_MAP.get(skill.get("level"), 0)
        resume_skills[name] = level_num

    skill_gaps = []
    resume_skill_names = list(resume_skills.keys())
    
    jd_reqs = jd_json.get("required_skills", []) if isinstance(jd_json, dict) else []
    
    for req in jd_reqs:
        req_name = req.get("skill_name", "").lower()
        req_level_str = req.get("required_level", "Beginner")
        req_level_num = LEVEL_MAP.get(req_level_str, 1)
        
        trainee_level_num = 0
        if resume_skill_names:
            best_match, score = process.extractOne(req_name, resume_skill_names)
            if score >= 80:
                trainee_level_num = resume_skills[best_match]
        
        gap_magnitude = req_level_num - trainee_level_num
        importance = req.get("importance", 2)
        priority_score = (gap_magnitude * 2) + importance
        
        if gap_magnitude > 0:
            skill_gaps.append({
                "module_name": req.get("skill_name"),
                "current_level": trainee_level_num,
                "target_level": req_level_num,
                "gap_score": gap_magnitude,
                "priority_score": priority_score,
                "reasoning_trace": f"JD requires {req_level_str}, Resume at level {trainee_level_num}."
            })
            
    return sorted(skill_gaps, key=lambda x: x["priority_score"], reverse=True)

def add_prerequisites(skill_gaps):
    existing_skills = {gap["module_name"].lower() for gap in skill_gaps}
    new_gaps = []

    for gap in skill_gaps:
        skill = gap["module_name"]
        if skill in PREREQUISITES:
            for prereq in PREREQUISITES[skill]:
                if prereq.lower() not in existing_skills:
                    new_gaps.append({
                        "module_name": prereq,
                        "current_level": 0,
                        "target_level": 1,
                        "gap_score": 1,
                        "priority_score": gap["priority_score"] + 1,
                        "reasoning_trace": f"Required prerequisite for {skill}"
                    })
    return skill_gaps + new_gaps

def map_gaps_to_courses(skill_gaps):
    catalog_path = os.path.join(os.path.dirname(__file__), 'course_catalog.json')
    catalog_data = {"courses": []}
    
    try:
        if os.path.exists(catalog_path):
            with open(catalog_path, 'r') as f:
                catalog_data = json.load(f)
    except Exception as e:
        print(f"Warning: Could not load course_catalog.json: {e}")

    final_learning_pathway = []

    for gap in skill_gaps:
        m_name = gap['module_name']
        t_level = gap['target_level']
        
        # 1. Filter courses from catalog using fuzzy matching on the skill_tag
        all_tags = [c.get('skill_tag', '').lower() for c in catalog_data['courses']]
        
        match_found = False
        if all_tags:
            best_match, score = process.extractOne(m_name.lower(), all_tags)
            
            if score >= 85:
                # Get all courses that match this tag and are at or below the target level
                for c in catalog_data['courses']:
                    if c.get('skill_tag', '').lower() == best_match and c.get('difficulty_level', 1) <= t_level:
                        final_learning_pathway.append({
                            "course_id": c.get('course_id'),
                            "task": c.get('title'), # UI expects 'task'
                            "duration": c.get('duration', '2h'),
                            "skill_addressed": m_name,
                            "priority_score": gap.get("priority_score", 1),
                            "level": c.get('difficulty_level', 1),
                            "description": f"AI-selected module for {m_name}.",
                            "reasoning_trace": gap.get("reasoning_trace", ""),
                        })
                        match_found = True

        # 2. FALLBACK: If no course in catalog matches, create a custom one so it doesn't crash
        if not match_found:
            final_learning_pathway.append({
                "course_id": f"GEN-{m_name[:3].upper()}",
                "task": f"Deep Dive: {m_name}",
                "duration": "4h",
                "skill_addressed": m_name,
                "priority_score": gap.get("priority_score", 1),
                "level": t_level,
                "description": f"Custom learning module for {m_name} based on JD gap.",
                "reasoning_trace": gap.get("reasoning_trace", ""),
            })

    # Sort: Higher priority and lower levels first
    return sorted(final_learning_pathway, key=lambda x: (-x["priority_score"], x["level"]))