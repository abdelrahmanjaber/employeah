import pandas as pd 
from sentence_transformers import SentenceTransformer, util
import re


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


def field_extraction(df, treshold=0.50, model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"):
    df["fileds"] = None
    df["level"] = None

    # Load fields.txt file 
    canonical_fields = []
    field_variants = []
    variant_to_canonical = {}
    with open("fields.txt", "r", encoding="utf-8") as f:
        for line in f:
            parts = [p.strip() for p in line.split(";") if p.strip()]
            if len(parts) == 0:
                continue
            canonical = parts[0]
            canonical_fields.append(canonical)

            for p in parts:
                field_variants.append(p)
                variant_to_canonical[p] = canonical

    # Load model + Embed fileds 
    model = SentenceTransformer(model_name)
    variant_embeddings = model.encode(field_variants, convert_to_tensor=True) 

    # Extract most similar job field from titles and seniority level:
    for idx, job_title in df["title"].items():

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

        df.loc[idx, "field"] = field
        df.loc[idx, "level"] = level

    return df
