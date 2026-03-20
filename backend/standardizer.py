import pandas as pd
from thefuzz import process

class SkillStandardizer:
    def __init__(self, file_path='backend/data/Technology Skills.txt'):
        try:
            # O*NET .txt files are usually tab-separated
            df = pd.read_csv(file_path, sep='\t')
            # We only need the 'Example' column which contains the skill names (e.g., 'Python', 'Java')
            self.official_skills = df['Example'].unique().tolist()
        except Exception as e:
            print(f"Warning: Could not load O*NET data: {e}")
            self.official_skills = []

    def standardize(self, extracted_name):
        if not self.official_skills:
            return extracted_name
        
        # Find the best match from the 30k O*NET skills
        best_match, score = process.extractOne(extracted_name, self.official_skills)
        best_match, score = process.extractOne(extracted_name, self.official_skills)
        
        if score >= 95:
            return best_match
        
        # If the score is low, the AI's original guess is probably better than a random O*NET match
        return extracted_name

# Initialize it once so it's ready for the API
standardizer = SkillStandardizer()