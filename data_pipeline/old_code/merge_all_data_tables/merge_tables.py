import pandas as pd
import os

folder = r"C:\Users\daphn\OneDrive\Bureau\employeah\database\data\job_data"

# Map filenames to the ID you want
file_map = {
    "arbeitnow_jobs.csv": 0,
    "adzuna_jobs.csv": 1,
    "hackernews_jobs.csv": 2
}

dfs = []
for filename, site_id in file_map.items():
    # Read the file
    df = pd.read_csv(os.path.join(folder, filename))
    # Add the new column with the specific ID
    df['website'] = site_id
    dfs.append(df)

# Merge and save
merged_df = pd.concat(dfs, ignore_index=True)
merged_df.to_csv(os.path.join(folder, "ALL_JOB_DATA.csv"), index=False)

print("Merged file created with website IDs.")