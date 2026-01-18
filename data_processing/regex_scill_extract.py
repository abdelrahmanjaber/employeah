import pandas as pd
from pathlib import Path
import re
from tqdm import tqdm
import numpy as np
import time
parent_dir = Path(__file__).parent

p = parent_dir.parent / "data_pipeline" / "data" / "job_data" / "ALL_JOBS.csv.gz"
full_data_df = pd.read_csv(p, compression="gzip", engine="c", low_memory=False)
file_path = parent_dir / "skills.txt"

with open(file_path, "r") as f:
    skills_list = [skill.strip() for skill in f.readlines() if skill.strip()] 


def add_skills_column(df, skills_list):
    total = len(df)
    take = max(1, total // 8)
    print(f"Using 1/8 of dataset: {take}/{total} rows")

    # Build regex
    sorted_skills = sorted(skills_list, key=len, reverse=True)
    regex = r"\b(?:" + "|".join(re.escape(s) for s in sorted_skills) + r")\b"
    pattern = re.compile(regex, re.IGNORECASE)

    print(f"Database columns: {df.columns.tolist()}")
    list_of_skills = []
    # Start timing the regex extraction
    start_time = time.time()
    # iterate with a progress bar
    for idx, description in enumerate(tqdm(df["Description"], desc="Extracting skills", unit="row", total=len(df))):
        matches = pattern.findall(str(description))
        unique_skills = sorted({m.title() for m in matches})
        list_of_skills.append(unique_skills)
    # End timing
    end_time = time.time()
    extraction_time = end_time - start_time
    print(f"\n⏱️ Regex extraction took {extraction_time:.2f} seconds")
    
    # Add skills column to dataframe
    df['Skills'] = list_of_skills

    row_indices = np.random.choice(len(df), size=1000, replace=False)
    sample_df = df.iloc[row_indices][['Job Title','Skills', 'Description']]
    print("\nSample extracted skills:")
    sample_df.to_csv("sample_extracted_skills.txt", index=False, header=False)
    
    # Save to CSV
    p = parent_dir.parent / "data_pipeline" / "data" / "job_data" 
    df.to_parquet(p /"ALL_JOB_DATA.snappy.parquet", compression="snappy", index=False)

    print(f"\n✅ Processed {len(df)} rows")
    print(f"Saved to ALL_JOB_DATA.snappy.parquet.csv")
    

if __name__ == "__main__":
    

    add_skills_column(full_data_df, skills_list)
    