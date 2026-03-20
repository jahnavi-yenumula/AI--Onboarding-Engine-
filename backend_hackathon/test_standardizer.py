from standardizer import standardizer

# Test cases: Original name vs. what we expect O*NET to have
test_skills = [
    "ReactJS", 
    "Python Programming", 
    "MS Excel", 
    "Java Developer",
    "Affinity Designer"
]

print("--- O*NET STANDARDIZATION TEST ---")
for skill in test_skills:
    standardized = standardizer.standardize(skill)
    print(f"Original: {skill}  -->  O*NET Match: {standardized}")