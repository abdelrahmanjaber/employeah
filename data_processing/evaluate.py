import pandas as pd
from pathlib import Path
import numpy as np

def compare_skills_columns():
    # Path to the Parquet file
    csv_path = Path(__file__).parent.parent / "data_pipeline" / "data" / "job_data" / "ALL_JOB_DATA.csv.gz"
    
    # Load the DataFrame
    print("Loading Parquet file...")
    df = pd.read_parquet(csv_path)
    
    print(f"Loaded {len(df)} rows")
    print(f"Columns: {df.columns.tolist()}")
    
    # Check if both columns exist
    if 'Skills' not in df.columns or 'Extracted_skills_embeddings' not in df.columns:
        print("Error: Required columns 'Skills' or 'Extracted_skills_embeddings' not found")
        return
    
    # Compare the columns (treating as sets to ignore order)
    def skills_match(row):
        skills_set = set(row['Skills']) if isinstance(row['Skills'], (list, np.ndarray)) else set()
        extracted_set = set(row['Extracted_skills_embeddings']) if isinstance(row['Extracted_skills_embeddings'], (list, np.ndarray)) else set()
        return skills_set == extracted_set
    
    # Find differing rows
    differing_mask = df.apply(skills_match, axis=1) == False
    differing_df = df[differing_mask]
    
    print(f"\nFound {len(differing_df)} rows where Skills and Extracted_skills_embeddings differ")
    
    # Print details of differing rows (limit to first 20 for readability)
    if len(differing_df) > 0:
        print("\nFirst 20 differing rows:")
        for idx, row in differing_df.head(20).iterrows():
            print(f"\nRow {idx}:")
            print(f"  Job Title: {row.get('Job Title', 'N/A')}")
            print(f"  Description: {row.get('Description', 'N/A')}")
            print(f"  Skills: {row['Skills']}")
            print(f"  Extracted_skills_embeddings: {row['Extracted_skills_embeddings']}")
    else:
        print("\nNo differences found. Printing a sample of 20 rows to double-check:")
        for idx, row in df.head(20).iterrows():
            print(f"\nRow {idx}:")
            print(f"  Job Title: {row.get('Job Title', 'N/A')}")
            print(f"  Description: {row.get('Description', 'N/A')}")
            print(f"  Skills: {row['Skills']}")
            print(f"  Extracted_skills_embeddings: {row['Extracted_skills_embeddings']}")
    
    # If there are more, suggest saving to file
    if len(differing_df) > 20:
        print(f"\n... and {len(differing_df) - 20} more rows.")
        print("Consider saving full results to a file for detailed analysis.")
        
        # Optionally save all differing rows to a CSV
        output_path = Path(__file__).parent / "differing_skills_comparison.csv"
        differing_df.to_csv(output_path, index=False)
        print(f"Saved all differing rows to {output_path}")

if __name__ == "__main__":
    compare_skills_columns()
