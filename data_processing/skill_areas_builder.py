import json
import pickle
from collections import defaultdict
import numpy as np
from scipy import sparse

from pathlib import Path
path = Path(__file__).parent.parent

def parse_skill_areas(file_path):
    """
    Parse the skill_areas.txt file into a dictionary of areas to skills.
    """
    areas_to_skills = defaultdict(list)
    current_area = None
    
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.endswith(':'):
                current_area = line[:-1]  # Remove the colon
            elif line.startswith('- '):
                skill = line[2:]  # Remove the '- '
                if current_area:
                    areas_to_skills[current_area].append(skill)
    
    return areas_to_skills

def build_skill_to_areas(areas_to_skills):
    """
    Build a dictionary from skills to list of areas.
    """
    skill_to_areas = defaultdict(list)
    for area, skills in areas_to_skills.items():
        for skill in skills:
            skill_to_areas[skill].append(area)
    return skill_to_areas

def build_sparse_matrix(areas_to_skills):
    """
    Build a sparse binary matrix where rows are skills, columns are areas.
    1 if skill belongs to area, 0 otherwise.
    """
    # Get unique skills and areas
    all_skills = set()
    all_areas = list(areas_to_skills.keys())
    
    for skills in areas_to_skills.values():
        all_skills.update(skills)
    
    all_skills = sorted(list(all_skills))
    all_areas = sorted(all_areas)
    
    # Create mapping
    skill_to_idx = {skill: i for i, skill in enumerate(all_skills)}
    area_to_idx = {area: i for i, area in enumerate(all_areas)}
    
    # Build matrix
    rows = []
    cols = []
    for area, skills in areas_to_skills.items():
        area_idx = area_to_idx[area]
        for skill in skills:
            skill_idx = skill_to_idx[skill]
            rows.append(skill_idx)
            cols.append(area_idx)
    
    # Create sparse matrix
    data = np.ones(len(rows), dtype=int)
    matrix = sparse.csr_matrix((data, (rows, cols)), shape=(len(all_skills), len(all_areas)))
    
    return matrix, all_skills, all_areas

def save_data(areas_to_skills, skill_to_areas, matrix, skills, areas, output_dir):
    """
    Save the data structures to files.
    """
    # Save dictionaries as pickle
    with open(output_dir / 'areas_to_skills.pkl', 'wb') as f:
        pickle.dump(dict(areas_to_skills), f)
    print("Saved areas_to_skills.pkl")
    with open(output_dir / 'skill_to_areas.pkl', 'wb') as f:
        pickle.dump(dict(skill_to_areas), f)
    
    # Save lists as json
    with open(output_dir / 'skills.json', 'w') as f:
        json.dump(skills, f)
    
    with open(output_dir / 'areas.json', 'w') as f:
        json.dump(areas, f)
    
    # Save sparse matrix
    sparse.save_npz(output_dir / 'skill_area_matrix.npz', matrix)

if __name__ == '__main__':
    file_path = path / 'data_pipeline' / 'extraction' / 'lists' / 'skill_areas.txt'
    output_dir = path / 'data_pipeline' / 'data' / 'job_data' / 'skill_rel'
    
    # Parse the file
    areas_to_skills = parse_skill_areas(file_path)
    
    # Build skill to areas
    skill_to_areas = build_skill_to_areas(areas_to_skills)
    
    # Build sparse matrix
    matrix, skills, areas = build_sparse_matrix(areas_to_skills)
    
    # Save data
    save_data(areas_to_skills, skill_to_areas, matrix, skills, areas, output_dir)
    
    print(f"Saved skill-area relations to {output_dir}/")
    print(f"Number of skills: {len(skills)}")
    print(f"Number of areas: {len(areas)}")
    print(f"Matrix shape: {matrix.shape}")
    print(f"Non-zero entries: {matrix.nnz}")