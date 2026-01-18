import time
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import numpy as np
from collections import defaultdict

from transformers import pipeline
import torch



CATEGORIES = [
    "machine learning",
    "data analysis",
    "database",
    "web development",
    "cooking"
]

import torch
import math
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL = "distilgpt2"

tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForCausalLM.from_pretrained(MODEL)
model.eval()

def score_category(prompt, category):
    text = prompt + " " + category
    enc = tokenizer(text, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model(**enc)
        logits = outputs.logits

    # Only score the category tokens
    cat_tokens = tokenizer(category, return_tensors="pt")["input_ids"][0]
    start = enc["input_ids"].shape[1] - len(cat_tokens)

    log_prob = 0.0
    for i in range(len(cat_tokens)):
        token_id = cat_tokens[i]
        token_logits = logits[0, start + i - 1]
        log_prob += torch.log_softmax(token_logits, dim=-1)[token_id]

    return float(math.exp(log_prob))
def classify(subj, category, descriptor):
    prompt = f"{subj} is {descriptor} and {subj} belongs to"
        
    score = score_category(prompt, category)
    print(f"Score for '{subj} is {descriptor}' belonging to '{category}': {score:.6f}")


# ---------------------------
# Configuration
# ---------------------------
MODEL_NAME = "facebook/bart-large-mnli"
BATCH_SIZE = 8  # adjust as needed

# Load NLI pipeline
nli = pipeline(
    task="text-classification",
    model=MODEL_NAME,
    return_all_scores=True,
    batch_size=BATCH_SIZE
)

# Load SBERT model for similarity
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

# ---------------------------
# Your elements
# Each: (B, A, [descriptors for B])
# ---------------------------
elements = [
    ("PyTorch", "Machine Learning", ["open-source library used to build and train neural networks."]),
    ("numpy", "Machine Learning", ["software library for numerical computing in Python"]),
    ("Linear Regression", "Machine Learning", ["Approximating linear relationships between variables"]),
    ("numpy", "Data Analysis", ["software library for numerical computing in Python"]),
    ("Snowflake", "Database", ["cloud-based data platform and data warehouse"]),
    ("SQL", "Database", ["Query Language query relational databases"]),
    ("CSS", "Web Development", ["stylesheet language used to describe the presentation of a document"]),
    ("HTML", "Web Development", ["standard markup language for creating web pages"]),
    ("Boiling", "Cooking", ["preparing food in liquids"]),
    ("Baking", "Cooking", ["preparin food in an oven"]),
    ("Grilling", "Cooking", ["preparin food on a grill over direct heat"]),
]

# ---------------------------
# Generate premise/hypothesis pairs
# ---------------------------
all_pairs = []
pair_map = []

for B, A, descriptors in elements:
    for desc in descriptors:
        premise = f"{B} is a {desc}."
        hypothesis = f"{B} is used in {A}."
        all_pairs.append((premise, hypothesis))
        pair_map.append((B, A, desc))

# Inference
# ---------------------------
start = time.time()

# Format inputs for MNLI
inputs = [f"{premise} </s></s> {hypothesis}" for premise, hypothesis in all_pairs]

# Run inference in batches
outputs = nli(inputs)

# Extract entailment scores
entail_scores = []
for result in outputs:
    entail_score = next(r["score"] for r in result if r["label"].lower() == "entailment")
    entail_scores.append(entail_score)

endtime = time.time()
elapsed = endtime - start
print(f"MNLI inference completed in {elapsed:.2f} seconds for {len(all_pairs)} pairs.")

start = time.time()
# Compute cosine similarities
cosine_scores = []
for premise, hypothesis in all_pairs:
    embed_p = sbert_model.encode(premise, convert_to_tensor=True)
    embed_h = sbert_model.encode(hypothesis, convert_to_tensor=True)
    sim = util.cos_sim(embed_p, embed_h).item()
    cosine_scores.append(sim)

endtime = time.time()
elapsed = endtime - start
print(f"SBERT cosine similarity completed in {elapsed:.2f} seconds for {len(all_pairs)} pairs.")

start = time.time()

for B, A, descriptors in elements:
    for desc in descriptors:
        class_scores = classify(B, A, desc)
end = time.time()
elapsed = end - start
print(f"Classification completed in {elapsed:.2f} seconds.")

# ---------------------------
# Aggregate results per element
# ---------------------------
results = defaultdict(list)
for entail_score, sim_score, (B, A, desc) in zip(entail_scores, cosine_scores, pair_map):
    results[(B, A)].append((entail_score, sim_score))

print("\nAverage entailment and cosine similarity scores per element:")
for (B, A), scores in results.items():
    avg_entail = sum(s[0] for s in scores) / len(scores)
    avg_sim = sum(s[1] for s in scores) / len(scores)
    print(f"{B} ⊂ {A}: entail={avg_entail:.3f}, sim={avg_sim:.3f} (from {len(scores)} descriptors)")
