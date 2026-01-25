import re
import sys 
import pandas as pd
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm
sys.path.append(str(Path(__file__).parent.parent.parent))
from data_processing.llm_with_chunking import search_for_skills, search_for_skills_batch


def extract_from_description(df, skill_path, batch_embedding = False):
    """
    Extract skills from job description with regex and adds them as in list in Skills colums
    """
    df["Skills"] = pd.Series([None] * len(df), dtype=object)

    known_skills = []
    categories = []
    skills = []

    with open(skill_path, "r", encoding="utf-8") as f:
        for line in f:
            clean_line = line.strip()
            if clean_line:
                if clean_line.endswith(':'):
                    # It's a category (remove the colon)
                    categories.append(clean_line[:-1])
                elif clean_line.startswith('-'):
                    # It's a skill (remove the dash)
                    skills.append(clean_line[1:].strip())
                else:
                    # Some other text, add as is
                    skills.append(clean_line)
    known_skills = skills + categories

    sorted_skills = sorted(known_skills, key=len, reverse=True)
    regex = r"\b(?:" + "|".join(re.escape(s) for s in sorted_skills) + r")\b"
    pattern = re.compile(regex, re.IGNORECASE)
    
    # Mathc knwon skills with job descrition
    for idx, description in tqdm(enumerate(df["Description"]),total=len(df),desc="Extracting skills "):
        matches = pattern.findall(str(description))
        unique_skills = sorted({m.title() for m in matches})
        df.at[idx, "Skills"] = unique_skills  

    print("SKILLS WITH REGEX EXTRACTED SUCCESFULLY \n")
    if batch_embedding:
        df["embedded_skills"] = search_for_skills_batch(df, known_skills)
    else:
         df["embedded_skills"] = search_for_skills(df, known_skills)
    df["Skills"] = df.apply(lambda row: sorted(list(set(row["Skills"]) | set(row["embedded_skills"]))), axis=1)
    return df


def extract_from_title(df, field_path, treshold=0.50, model_name="intfloat/multilingual-e5-large"):
    """
    Extract level and field from a job title and adds it to the dataframe
    Level extraction with regex
    Field extraction with embedding similarity
    """
    df["Field"] = df.get("Field", pd.Series("", index=df.index)).astype("string")
    df["Level"] = df.get("Level", pd.Series(1, dtype=int))  

    # Load fields.txt file 
    canonical_fields = []
    field_variants = []
    variant_to_canonical = {}
    with open(field_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = [p.strip() for p in line.split(";") if p.strip()]
            if len(parts) == 0:
                continue
            canonical = parts[0]
            canonical_fields.append(canonical)

            for p in parts:
                field_variants.append(p)
                variant_to_canonical[p] = canonical

    # Load model + Embed fields 
    model = SentenceTransformer(model_name)
    variant_embeddings = model.encode(field_variants, convert_to_tensor=True) 

    # Extract most similar job field from titles and seniority level:
    for idx, job_title in tqdm(df["Job Title"].items(), total=len(df), desc="Processing job titles"):

        level = extract_level(job_title)
        cleaned_title = clean_job_title(job_title)
        t_emb = model.encode(cleaned_title, convert_to_tensor=True)
        scores = util.cos_sim(t_emb, variant_embeddings)[0]

        best_idx = scores.argmax().item()
        best_score = scores[best_idx].item()

        best_variant = field_variants[best_idx]

        if best_score > treshold:
            field = variant_to_canonical[best_variant]
        else:
            field = "Other"

        df.loc[idx, "Field"] = field
        df.loc[idx, "Level"] = int(level)

    print("FIELDS AND LEVELS EXTRACTED SUCCESSFULLY \n")
    return df



def clean_job_title(title):
    '''
    Removes artifacts tha mess up the emebdding like (m/f) 
    '''
    title = title.lower()
    title = re.sub(r'\(.*?\)', '', title)      
    title = re.split(r'[\/]', title)[0]  
    return title

def extract_level(title):
    """
    Find seniority levels, saves it and removes it from tilte
    Seniority levels:
    - Workig student / internship => level 0
    - Normal job => level 1
    - Senior job => levl 2 
    """
    title = title.lower()
    working_student_pattern = r"\b(working[-\s]?student|werkstudent|werkstudentin)\b"
    internship_pattern = r"\b(intern(ship)?|praktikant|praktikum)\b"
    senior_pattern = r"\b(senior|sr\.?|lead|principal|staff)\b"

    level = 1
    if re.search(working_student_pattern, title) or re.search(internship_pattern, title):
        level = 0
    if re.search(senior_pattern, title):
        level = 2

    cleaned = re.sub(working_student_pattern, "", title)
    cleaned = re.sub(internship_pattern, "", cleaned)
    cleaned = re.sub(senior_pattern, "", cleaned)  

    return level

if __name__ == "__main__":
    #If this is the main file, run extraction on the full parquet
    # Get skills from df
    csv_path = Path(__file__).parent.parent / "data" / "job_data" / "ALL_JOBS.csv.gz"
    #skill_path = "./extraction/lists/skill_areas_flattened.txt"
    skill_path = Path(__file__).parent / "lists" / "skill_areas_flattened.txt"
    print("Loading ZIP file...")
    df = pd.read_csv(csv_path)
    #Computing the skills for the whole dataset can take to much RAM, so we process it in chunks of 10000 rows
    df = extract_from_description(df, skill_path, batch_embedding=True)

    # Get fields from df
    #field_path = "./extraction/lists/fields.txt"
    field_path = Path(__file__).parent / "lists" / "fields.txt"
    model_name = "TechWolf/JobBERT-v2" 
    df = extract_from_title(df,field_path,treshold=0.3,model_name=model_name)

    # Save back to parquet
    df.to_parquet(csv_path, compression='snappy', index=False)
    print(f"Saved extracted DataFrame back to {csv_path}")
