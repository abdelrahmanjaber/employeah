import pandas as pd

# Define the file path
file_path = 'database/data/job_data/test/historical_jobs_test.csv'

# Define the columns we want to inspect
target_columns = [
    'thread_date',
    'company_name',
    'job_title',
    'job_url',
    'remote_status',
    'job_location',
    'job_header',
    'job_description'
]

try:
    # Load the CSV file
    df = pd.read_csv(file_path, on_bad_lines='skip')
    print(f"✅ Successfully loaded '{file_path}'")
    print(f"Total rows found: {len(df)}\n")

    # Loop through each requested column
    for col in target_columns:
        print(f"{'='*40}")
        print(f"👉 First 50 entries for: {col}")
        print(f"{'='*40}")

        if col in df.columns:
            # Get the top 50 values
            entries = df[col].head(50)
            
            # Print them nicely
            for i, val in enumerate(entries, 1):
                # We truncate long text (like descriptions) so it doesn't flood the terminal
                text_val = str(val).replace('\n', ' ') 
                if len(text_val) > 100:
                    text_val = text_val[:100] + "..."
                
                print(f"{i}. {text_val}")
        else:
            print(f"❌ Warning: Column '{col}' not found in CSV.")
        
        print("\n") # Add space between categories

except FileNotFoundError:
    print(f"❌ Error: The file '{file_path}' was not found.")
except Exception as e:
    print(f"❌ An error occurred: {e}")