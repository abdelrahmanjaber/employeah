import pandas as pd
import os

data_dir = r"database/data/job_data"

# Loop through all CSVs in the folder
for filename in os.listdir(data_dir):
    if filename.endswith(".csv"):
        file_path = os.path.join(data_dir, filename)
        gz_path = file_path + ".gz"
        
        print(f"📦 Compressing {filename}...")
        
        # Read and save as compressed gzip
        try:
            df = pd.read_csv(file_path)
            df.to_csv(gz_path, index=False, compression='gzip')
            print(f"   ✅ Created {filename}.gz")
            
            # Optional: Delete the original huge CSV to clean up
            #os.remove(file_path) 
            #print(f"   🗑️ Deleted original {filename}")
            
        except Exception as e:
            print(f"   ❌ Error compressing {filename}: {e}")

print("\n✨ All files compressed!")