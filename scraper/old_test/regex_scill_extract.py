import pandas as pd
from pathlib import Path
import re
parent_dir = Path(__file__).parent

adzuna_df = pd.read_csv("adzuna_test_output_processed.csv")

file_path = parent_dir / "skills.txt"

with open(file_path, "r") as f:
    skills_list = [skill.strip() for skill in f.readlines() if skill.strip()] 


if __name__ == "__main__":
    # Use only the first third of the dataset for faster runs
    total = len(adzuna_df)
    take = max(1, total // 8)
    print(f"Using 1/8 of dataset: {take}/{total} rows")

    # Build regex
    sorted_skills = sorted(skills_list, key=len, reverse=True)
    regex = r"\b(?:" + "|".join(re.escape(s) for s in sorted_skills) + r")\b"
    pattern = re.compile(regex, re.IGNORECASE)

    list_of_skills = []
    for idx, description in enumerate(adzuna_df["description"]):
        matches = pattern.findall(str(description))
        unique_skills = sorted({m.title() for m in matches})
        list_of_skills.append(unique_skills)
    
    # Add skills column to dataframe
    adzuna_df['regex_skills'] = list_of_skills
    
    # Save to CSV
    adzuna_df.to_csv("adzuna_regex_skills_output.csv", index=False)
    
    print(f"\n✅ Processed {len(adzuna_df)} rows")
    print(f"Saved to adzuna_regex_skills_output.csv")
    