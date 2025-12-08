import os
import sys
import pandas as pd
import tqdm
import matplotlib.pyplot as plt
import time

from pathlib import Path
parent_dir = Path(__file__).parent


from typing import List, Tuple, Dict
import re
from collections import Counter, defaultdict
import numpy as np


from sentence_transformers import SentenceTransformer, util

import hdbscan

# --------------------------------------------------------------------
# CONFIG
# --------------------------------------------------------------------
VALID_POS = {"NOUN", "PROPN"}
REMOVE_ENTS = {"GPE", "LOC", "PERSON", "DATE", "TIME"}


EMBEDDING_BACKEND = "sbert"
import spacy
# spaCy is a modern, high-performance NLP library used for:
# tokenization (splitting text into words)
# lemmatization (converting words to their base form)
# part-of-speech tagging
# dependency parsing
# named entity recognition (NER)
# It’s extremely fast (Cython optimized) and widely used in production.
import faiss

language = "en"

adzuna_df = pd.read_csv("adzuna_test_for_llm.csv")

# Load skills from txt file
file_path = parent_dir / "skills.txt"

with open(file_path, "r") as f:
    skills_list = [skill.strip() for skill in f.readlines() if skill.strip()] 

class EmbeddingEngine:
    def __init__(self):
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        

    def embed(self, texts: List[str]) -> np.ndarray:
        embs = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False, normalize_embeddings=True)
        # ensure float32 for faiss compatibility if used later
        return embs.astype(np.float32)
        
def extract_noun_phrases(description_list:List[str], language: str = 'en') -> List[str]:
    """Extract candidate phrases. spaCy based chunks"""
    nlp_string = f"{language}_core_web_sm"
    nlp = spacy.load(nlp_string)

    candidates_per_job = []
    all_candidates = []
    candidates_to_job = []
    # Use nlp.pipe for batching
    for doc in nlp.pipe(description_list, batch_size=1000):
        candidates = []
        for nc in doc.noun_chunks:
            phrase = nc.text.lower().strip()
            # Normalize whitespace & punctuation
            phrase = re.sub(r"[\s\-]+", " ", phrase)
            phrase = phrase.strip(" ,.;:")
            if len(phrase) >= 2:
                candidates.append(phrase)
        candidates_per_job.append(candidates)  # one inner list per job description
        all_candidates.extend(candidates)
        candidates_to_job.extend([len(candidates_per_job)-1]*len(candidates))   
    return candidates_per_job, all_candidates, candidates_to_job

def build_skill_index(skills: List[str], engine: EmbeddingEngine):
    skill_texts = [s.lower() for s in skills]
    skill_embs = engine.embed(skill_texts)  # normalized for SBERT
    return skill_texts, skill_embs
def contains_skill(candidate: str, skill: str) -> bool:
    c_tokens = candidate.lower().split()
    s_tokens = skill.lower().split()
    return all(t in c_tokens for t in s_tokens)
# -------------------------
# Similarity helpers
# -------------------------
def cosine_sim_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    # accepts 2D numpy arrays
    # If 'a' and 'b' are normalized (SBERT), dot product is cosine similarity
    # Generic fallback:
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-9)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)
    return np.dot(a_norm, b_norm.T)

def pos_filter(candidates, nlp):
    """Keep only nouns and proper nouns."""
    out = []
    idx = []
    for i, c in enumerate(candidates):
        doc = nlp(c)
        if doc and doc[0].pos_ in VALID_POS:
            out.append(c)
            idx.append(i)
    return out, idx


def ner_filter(candidates, nlp):
    """Remove named entities like cities, dates, people."""
    out = []
    idx = []
    for i, c in enumerate(candidates):
        doc = nlp(c)
        if doc.ents and doc.ents[0].label_ in REMOVE_ENTS:
            continue
        out.append(c)
        idx.append(i)
    return out, idx

def extract_skills_batched(job_descriptions, skills, model, threshold=0.75, low_similarity_threshold=0.5):
    """
    job_descriptions: List[str]
    skills: List[str]
    model: embedding model
    treshhold: float
    low_similarity_threshold: float values that do not make the treshhold but low similiarity treshhold are considered for new skill discovey. This value was obtaines by masking out existing skills on which the llm was trained, performance on new words need to be verified.
    returns:
        per_job_candidates: List[List[str]]
        per_job_skills: List[List[str]]
        all_used_skills: List[str]
    """
    global_new_skills = defaultdict(int)
    start_time = time.time()

    # === Embed all skills once ===
    skill_start = time.time()
    skill_embeddings = model.encode(skills, normalize_embeddings=True)
    skill_time = time.time() - skill_start
    print(f"✓ Embedded {len(skills)} skills in {skill_time:.2f}s")

    # === Extract candidates for each job and flatten ===
    cand_start = time.time()
    all_candidates = []
    candidate_to_job = []
    per_job_candidates = []

    per_job_candidates, all_candidates, candidate_to_job = extract_noun_phrases(job_descriptions, language=language)
    
    cand_time = time.time() - cand_start
    print(f"✓ Extracted {len(all_candidates)} candidate phrases in {cand_time:.2f}s")

    # === Embed all candidates in one big batch ===
    embed_start = time.time()
    cand_emb = model.encode(all_candidates, normalize_embeddings=True)
    embed_time = time.time() - embed_start
    print(f"✓ Embedded {len(all_candidates)} candidates in {embed_time:.2f}s")

    # === Compute cosine similarity ===
    sim_start = time.time()
    sims = cand_emb @ skill_embeddings.T
    sim_time = time.time() - sim_start
    print(f"✓ Computed similarities in {sim_time:.2f}s")

    # === Prepare output ===
    match_start = time.time()
    per_job_skills = [set() for _ in job_descriptions]
    all_used_skills = set()

    # === Assign matches back to jobs ===
    new_skills_candidates = []
    for i, candidate in enumerate(all_candidates):
        job_id = candidate_to_job[i]

        best_skill_idx = sims[i].argmax()
        score = sims[i][best_skill_idx]
        # check
        if contains_skill(candidate, "snowflake"):
            print("The score for snowflake related stuff is "+str(score))
        if score >= threshold:
            matched_skill = skills[best_skill_idx]

            per_job_skills[job_id].add(matched_skill)
            all_used_skills.add(matched_skill)
        elif score >= low_similarity_threshold:
            new_skills_candidates.append(candidate)
        # if score <= low_similarity_threshold :
        #     new_skills_candidates.append(candidate)

    match_time = time.time() - match_start
    print(f"✓ Matched skills in {match_time:.2f}s")

    per_job_skills = [sorted(s) for s in per_job_skills]

    total_time = time.time() - start_time
    print(f"\n⏱️  Total extraction time: {total_time:.2f}s")
    print(f"   Breakdown: Skills={skill_time:.2f}s, Candidates={cand_time:.2f}s, Embedding={embed_time:.2f}s, Similarity={sim_time:.2f}s, Matching={match_time:.2f}s\n")

    return per_job_candidates, per_job_skills, sorted(all_used_skills), new_skills_candidates

def discover_new_skills(all_new_terms, all_new_embeddings, canonical_emb,
                        min_frequency=3, n_clusters=5):
    """
    Inputs:
      all_new_terms: list of raw candidate terms across all jobs
      all_new_embeddings: embedding matrix (N, d)
      canonical_emb: canonical embedding matrix

    Returns:
      discovered_skills: representative new skills (cluster centers)
    """
    # ensure reasonable defaults
    hdbscan_kwargs = {"min_cluster_size": max(2, n_clusters)}

    # 1) Cluster ALL candidates
    clusterer = hdbscan.HDBSCAN(**hdbscan_kwargs)
    labels = clusterer.fit_predict(all_new_embeddings)  # labels length N, -1 = noise
    probs = getattr(clusterer, "probabilities_", None)

    # 2) Count cluster sizes (includes noise label -1)
    cluster_count = Counter(labels)  # e.g., { -1: 120, 0: 34, 1: 5, ... }

    final_new_skills = []
    final_with_freq = []

    c=0
    for cluster_id, freq in cluster_count.items():
        print(f"Cluster {cluster_id}: {freq} items")
        c+=1
        if c>10:
            break

    # 3) Iterate over clusters (skip noise)
    for cluster_id, freq in cluster_count.items():
        if cluster_id == -1:
            continue  # skip noise

        # drop clusters smaller than min_frequency
        if freq < min_frequency:
            continue

        # gather indices belonging to this cluster
        idxs = np.where(labels == cluster_id)[0]
        if len(idxs) == 0:
            continue

        # 4) pick representative term for cluster
        if probs is not None:
            # choose the item in this cluster with highest membership probability
            best_relative = np.argmax(probs[idxs])    # relative index into idxs
            best_idx = idxs[best_relative]            # absolute index in all_new_terms
        else:
            # fallback: pick medoid (closest to centroid)
            cluster_emb = all_new_embeddings[idxs]
            centroid = cluster_emb.mean(axis=0, keepdims=True)
            sims = (cluster_emb @ centroid.T).flatten()
            best_rel = np.argmax(sims)
            best_idx = idxs[best_rel]

        representative = all_new_terms[best_idx]

        final_new_skills.append(representative)
        final_with_freq.append((representative, freq))

    # Print discovered skills
    print(f"\n🔍 DISCOVERED NEW CANDIDATE SKILLS:")
    if final_with_freq:
        for term, freq in sorted(final_with_freq, key=lambda x: x[1], reverse=True):
            print(f"  • {term}: {freq}")
    else:
        print("  No new candidate skills discovered.")

    return final_new_skills, final_with_freq, labels

    from sentence_transformers import SentenceTransformer, util
import numpy as np

def filter_candidates_hybrid(
    candidates,
    skill_anchor=["skill", "tool", "technology", "library"],
    similarity_threshold=0.3,
    cluster=True,
    cluster_min_size=2
):
    """
    Hybrid approach to filter skill candidates.

    Inputs:
    - candidates: list[str], candidate phrases
    - skill_anchor: list[str], small list of anchor words representing a "skill"
    - similarity_threshold: float, min cosine similarity to anchor to keep candidate
    - cluster: bool, whether to cluster overlapping candidates
    - cluster_min_size: int, min cluster size if clustering

    Returns:
    - filtered_candidates: list[str], final filtered skill candidates
    """

    if not candidates:
        return []

    # Load model
    model = SentenceTransformer("all-MiniLM-L6-v2")

    # 1️⃣ Embed candidates and anchor skills
    cand_emb = model.encode(candidates, convert_to_tensor=True)
    anchor_emb = model.encode(skill_anchor, convert_to_tensor=True)

    # 2️⃣ Compute max cosine similarity to anchor
    cos_sims = util.cos_sim(cand_emb, anchor_emb)  # shape: (num_candidates, num_anchors)
    max_sims = cos_sims.max(dim=1).values.cpu().numpy()

    # 3️⃣ Filter by similarity threshold
    filtered_candidates = [c for c, sim in zip(candidates, max_sims) if sim >= similarity_threshold]
    filtered_emb = [cand_emb[i] for i, sim in enumerate(max_sims) if sim >= similarity_threshold]

    if not filtered_candidates:
        return []

    # 4️⃣ Optional clustering to merge overlapping phrases
    if cluster and len(filtered_candidates) > 1:
        try:
            import hdbscan
        except ImportError:
            print("HDBSCAN not installed, skipping clustering")
            return filtered_candidates

        emb_matrix = np.stack([e.cpu().numpy() for e in filtered_emb])
        clusterer = hdbscan.HDBSCAN(min_cluster_size=cluster_min_size)
        labels = clusterer.fit_predict(emb_matrix)

        final_candidates = []
        unique_clusters = sorted(set(labels))
        for c in unique_clusters:
            if c == -1:
                continue  # noise

            cluster_indices = np.where(labels == c)[0]
            if len(cluster_indices) == 0:
                continue

            # Pick representative: closest to cluster centroid
            cluster_embs = emb_matrix[cluster_indices]
            centroid = cluster_embs.mean(axis=0, keepdims=True)
            sims = cluster_embs @ centroid.T
            rep_idx = cluster_indices[np.argmax(sims)]
            final_candidates.append(filtered_candidates[rep_idx])

        return final_candidates

    return filtered_candidates


def visualize_skill_distribution(per_job_skills: List[List[str]], top_n: int = 20):
    """discover_new_skills_list
    Create a bar chart of the most common skills
    
    Args:
        per_job_skills: List of skill lists, one per job
        top_n: Number of top skills to display
    """
    # Flatten all skills and count them
    all_skills_flat = []
    for skills in per_job_skills:
        all_skills_flat.extend(skills)
    
    skill_counts = Counter(all_skills_flat)
    
    # Get top N skills
    top_skills = skill_counts.most_common(top_n)
    skills, counts = zip(*top_skills)
    
    # Create bar chart
    plt.figure(figsize=(12, 6))
    plt.barh(skills, counts, color='steelblue')
    plt.xlabel('Frequency', fontsize=12)
    plt.ylabel('Skills', fontsize=12)
    plt.title(f'Top {top_n} Most Common Skills in Job Descriptions', fontsize=14, fontweight='bold')
    plt.gca().invert_yaxis()  # Highest count at top
    plt.tight_layout()
    
    # Save and show
    plt.savefig('skill_distribution.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print(f"\n📊 Skill Distribution Summary:")
    print(f"Total unique skills: {len(skill_counts)}")
    print(f"Total skill mentions: {sum(counts)}")
    print(f"\nTop {top_n} skills:")
    for skill, count in top_skills:
        print(f"  {skill}: {count}")

def remove_job_titles_from_candidates(candidates, blacklist):
    """
    Remove any candidate that matches a job title or its last term.
    Case-insensitive.
    """
    filtered = []
    for c in candidates:
        c_norm = c.lower().strip()
        if not any(b in c_norm for b in blacklist):
            filtered.append(c)
    return filtered

def search_for_skills_and_find_new_ones(df: pd.DataFrame, skills_list: List[str]):


    _, per_job_skills, all_used_skills,all_new_skills = extract_skills_batched(
        job_descriptions=df['Description'].tolist(),
        skills=skills_list,
        model=EmbeddingEngine().model,
        threshold=0.75
    )

    # Attach skills to subset and merge back into full dataframe

    print(f"Starting new skill discovery from {len(all_new_skills)} candidates...")
    print(f"Start cleaning new skill candidates... to remove non nouns and named entities")
    cleaned_new_skills_stage1 = pos_filter(all_new_skills, spacy.load(f"{language}_core_web_sm"))[0]
    cleaned_new_skills = ner_filter(cleaned_new_skills_stage1, spacy.load(f"{language}_core_web_sm"))[0]

    discover_new_skills_list, discover_new_skills_with_freq, labels = discover_new_skills(
        all_new_terms=cleaned_new_skills,
        all_new_embeddings=EmbeddingEngine().embed(cleaned_new_skills),
        canonical_emb=EmbeddingEngine().embed(skills_list),
        min_frequency=3,
        n_clusters=5
    )
    
    job_titles = adzuna_df['title'].dropna().astype(str).tolist()

    # normalize
    job_titles = [t.lower().strip() for t in job_titles]

    # add last terms
    last_terms = [t.split()[-1] for t in job_titles if len(t.split()) > 0]

    # combined blacklist
    job_title_blacklist = set(last_terms)

    discover_new_skills_list_without_jobs = remove_job_titles_from_candidates(discover_new_skills_list, job_title_blacklist)

    filtered_candidates = filter_candidates_hybrid(discover_new_skills_list_without_jobs)

    with open("final_candidates.txt", "w", encoding="utf-8") as f:
        for item in filtered_candidates:
            f.write(str(item) + "\n")    

    # Save to CSV
    # Visualize skill distribution for processed subset
    visualize_skill_distribution(per_job_skills, top_n=20)

    return per_job_skills,filtered_candidates
    

if __name__ == "__main__":
    p = parent_dir.parent / "database" / "data" / "job_data" / "ALL_JOB_DATA.csv.gz"
    full_df = pd.read_parquet(parent_dir.parent / "database" / "data" / "job_data" / "ALL_JOB_DATA.snappy.parquet", engine="pyarrow")
    per_job_skills, new_skills = search_for_skills_and_find_new_ones(full_df, skills_list)
    full_df['Extracted_skills'] = per_job_skills
    with open("discovered_new_skills.txt", "w", encoding="utf-8") as f:
        for item in new_skills:
            f.write(str(item) + "\n")   