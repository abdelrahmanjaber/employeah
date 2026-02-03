import re
import pandas as pd

def extract_skill(df, skill_path):

    df["skills"] = pd.Series([None] * len(df), dtype=object)

    known_skills = []
    with open(skill_path, "r", encoding="utf-8") as f:
        for line in f:
            clean_line = line.strip()
            if clean_line:
                known_skills.append(clean_line)

    sorted_skills = sorted(known_skills, key=len, reverse=True)
    regex = r"\b(?:" + "|".join(re.escape(s) for s in sorted_skills) + r")\b"
    pattern = re.compile(regex, re.IGNORECASE)

    for idx, description in enumerate(df["description"]):
        matches = pattern.findall(str(description))
        unique_skills = sorted({m.title() for m in matches})
        df.at[idx, "skills"] = unique_skills  

    return df
