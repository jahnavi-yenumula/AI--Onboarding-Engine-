# test_logic.py
import json
from adaptive_logic import calculate_skill_gap

# 1. Your actual AI-extracted Resume Data
resume_data = {
  "skills": [
    {"skill_name": "Java", "level": "Intermediate"},
    {"skill_name": "Python", "level": "Beginner"},
    {"skill_name": "Affinity Designer", "level": "Intermediate"},
    {"skill_name": "Affinity Photo", "level": "Intermediate"},
    {"skill_name": "Affinity Publisher", "level": "Intermediate"},
    {"skill_name": "Git/GitHub", "level": "Beginner"},
    {"skill_name": "Microsoft Excel (Data Analysis)", "level": "Beginner"},
    {"skill_name": "Technical Documentation", "level": "Beginner"},
    {"skill_name": "Visual Branding", "level": "Beginner"}
  ]
}

# 2. Your actual AI-extracted Job Description Data
jd_data = {
  "required_skills": [
    {"skill_name": "Java", "required_level": "Intermediate"},
    {"skill_name": "Spring Boot", "required_level": "Beginner"},
    {"skill_name": "SQL", "required_level": "Intermediate"},
    {"skill_name": "PostgreSQL", "required_level": "Beginner"},
    {"skill_name": "Git", "required_level": "Beginner"},
    {"skill_name": "GitHub", "required_level": "Beginner"}
  ]
}

print("--- RUNNING AI ADAPTIVE ONBOARDING ENGINE ---")
print("Target Role: Junior Software Engineer\n")

# 1. Calculate the raw gaps
gaps = calculate_skill_gap(resume_data, jd_data)

if not gaps:
    print("🎉 Trainee is perfectly matched! No onboarding required.")
else:
    # 2. Map gaps to the catalog
    from adaptive_logic import map_gaps_to_courses
    final_pathway = map_gaps_to_courses(gaps)
    
    print(f"⚠️ Generated Personalized Learning Pathway ({len(final_pathway)} Modules):\n")
    for step, course in enumerate(final_pathway, 1):
        print(f"Step {step}: [{course['course_id']}] {course['course_title']} ({course['duration']})")
        print(f"  -> Reasoning: {course['reasoning_trace']}\n")