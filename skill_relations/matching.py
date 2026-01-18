import pickle
import json
from sentence_transformers import SentenceTransformer, util

sbert_model = SentenceTransformer('all-MiniLM-L6-v2')


def rank_jobs(jobs, required_skills, top_n=50):
    """
    Ranks jobs based on the number of required skills matched.
    Identifies if the skills in the job or required skills are skills or areas.
    Definition of a Match: 
        If two skills are the same it is a match.
        If one skill belongs to an area it is a match with the area
        If one area belongs to a skill it is half a match.
        If two areas are the same it is a match.
        If two skills are in the same area it is half a match.
    Returns the top N jobs with the highest matches.
    """
    with open('skill_relations/areas_to_skills.pkl', 'rb') as f:
        areas_to_skills = pickle.load(f)
    with open('skill_relations/skill_to_areas.pkl', 'rb') as f:
        skill_to_areas = pickle.load(f)
    with open('skill_relations/skills.json', 'r', encoding='utf-8') as f:
        all_skills = set(json.load(f))
    with open('skill_relations/areas.json', 'r', encoding='utf-8') as f:
        all_areas = set(json.load(f))
    
    # Load SBERT model for similarity
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def is_skill(item):
        return item in all_skills
    
    def is_area(item):
        return item in all_areas
    
    # List to hold job scores
    job_scores = []
    
    for job in jobs:
        score = 0.0
        job_skills = job.get('skills', [])
        
        for req in required_skills:
            matched = False
            for job_skill in job_skills:
                # If two skills are the same: full match
                if is_skill(req) and is_skill(job_skill) and req == job_skill:
                    score += 1
                    matched = True
                    break
                
                # If req is an area and job_skill is in that area: full match
                elif is_area(req) and is_skill(job_skill) and job_skill in areas_to_skills.get(req, []):
                    score += 1
                    matched = True
                    break
                
                # If job_skill is an area and req is in that area: half match
                elif is_area(job_skill) and is_skill(req) and req in areas_to_skills.get(job_skill, []):
                    embed_p = sbert_model.encode(job_skill, convert_to_tensor=True)
                    embed_h = sbert_model.encode(req, convert_to_tensor=True)
                    sim = util.cos_sim(embed_p, embed_h).item()
                    score += 0.2 + sim * 0.8  # Scale similarity to 0.2-0.8
                    matched = True
                    break
                
                # If two areas are the same: full match
                elif is_area(req) and is_area(job_skill) and req == job_skill:
                    score += 1
                    matched = True
                    break
                
                # If two skills are in the same area: use cosine similarity scaled to 0.2-0.7
                elif is_skill(req) and is_skill(job_skill):
                    req_areas = set(skill_to_areas.get(req, []))
                    job_skill_areas = set(skill_to_areas.get(job_skill, []))
                    if req_areas & job_skill_areas:
                        # Compute SBERT embeddings
                        embed_req = model.encode(req, convert_to_tensor=True)
                        embed_job = model.encode(job_skill, convert_to_tensor=True)
                        similarity = util.cos_sim(embed_req, embed_job).item()
                        # Scale similarity from [0,1] to [0.2, 0.7]
                        scaled_score = 0.2 + similarity * 0.5
                        score += scaled_score
                        matched = True
                        break
            
            if not matched:
                # Optional: handle no match, but for now, do nothing
                pass
        
        job_scores.append((job, score))
    
    # Sort by score descending
    job_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N
    return job_scores[:top_n]
    
    
   
    
   