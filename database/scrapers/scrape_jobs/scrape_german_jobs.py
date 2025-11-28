import os
import requests
import pandas as pd
import time
import re
from datetime import datetime
import matplotlib.pyplot as plt


# this file scrapes german job listings from the Arbeitnow API.

# Create the directory if it doesn't exist
output_dir = 'database/data/job_data'
os.makedirs(output_dir, exist_ok=True)

#CLEANING FUNCTIONS
def clean_title(title):
    """
    Cleans up job titles by removing gender markers and marketing fluff.
    """
    if not title:
        return "Unknown"
    
    # Remove gender markers (case insensitive)
    title = re.split(r'\s*\(m\/w\/d\)', title, flags=re.IGNORECASE)[0]
    title = re.split(r'\s*\(m\/f\/d\)', title, flags=re.IGNORECASE)[0]
    title = re.split(r'\s*\(f\/m\/x\)', title, flags=re.IGNORECASE)[0]
    title = re.split(r'\s*\(d\/w\/m\)', title, flags=re.IGNORECASE)[0]
    
    # Remove extra info in parentheses
    title = re.sub(r'\s*\(.*?\)', '', title)
    
    # Remove text after common separators
    separators = [r'\s-\s', r'\s\|\s', r'\s\/\/\s', r'\s–\s'] 
    for sep in separators:
        title = re.split(sep, title)[0]

    return title.strip()

#this function extracts city and country from location string
def extract_city_country(raw_location):
    """
    Parses "Berlin, Berlin, Germany" -> City: "Berlin", Country: "Germany"
    """
    if not raw_location:
        return "Unknown", "Germany"
        
    if "remote" in raw_location.lower():
        return "Remote", "Remote"

    parts = raw_location.split(',')
    city = parts[0].strip()
    
    # Default to Germany unless specified otherwise (simplification)
    country = "Germany" 
    if len(parts) > 1:
        # Check if the last part looks like a country if needed
        # But for now, we stick to your logic or default to Germany
        pass

    return city, country

#Main:

base_url = "https://www.arbeitnow.com/api/job-board-api"
all_jobs = []
url = base_url
page_count = 1

print("🚀 Starting scraper...")

while url:
    print(f"📄 Fetching Page {page_count}...")
    
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, timeout=10)
        
        # Rate Limit Handling
        if r.status_code == 429:
            print("⚠️ Rate limit hit (429). Sleeping for 60 seconds...")
            time.sleep(60)
            continue 
            
        if r.status_code != 200:
            print(f"❌ Error {r.status_code}: {r.text[:200]}")
            break
            
        data = r.json()
        current_jobs = data.get("data", [])
        
        if not current_jobs:
            print("⚠️ No jobs found on this page. Stopping.")
            break

        for job in current_jobs:
            # 1. Clean Date
            date_posted = "N/A"
            if job.get("created_at"):
                date_posted = datetime.fromtimestamp(job.get("created_at")).strftime('%Y-%m-%d')

            # 2. Clean Title
            raw_title = job.get("title", "")
            final_title = clean_title(raw_title)

            # 3. Clean Location
            raw_location = job.get("location", "")
            city, country = extract_city_country(raw_location)

            job_entry = {
                "Job Title": final_title,
                "Country": country,
                "City": city,
                "Date": date_posted,
                "Company": job.get("company_name"),
                "Description": job.get("description"),
                "URL": job.get("url"),
                "Skills": ""
            }
            all_jobs.append(job_entry)

        # Pagination
        url = data.get("links", {}).get("next")
        page_count += 1
        time.sleep(1) # Be polite to the server

    except Exception as e:
        print(f"⚠️ An unexpected error occurred: {e}")
        break

# Save Results

print(f"✅ Scraping complete. Total jobs fetched: {len(all_jobs)}")

if all_jobs:
    df = pd.DataFrame(all_jobs)
    df.drop_duplicates(subset=['URL'], inplace=True)
    
    csv_filename = os.path.join(output_dir, "german_jobs.csv")
    df.to_csv(csv_filename, index=False, encoding='utf-8')
    print(f"📂 Data saved to: {csv_filename}")

    # generate analysis plots of the data
    print("📊 Generating plots...")
    
    # 1. Top 20 Cities Bar Plot
    if not df.empty:
        plt.figure(figsize=(12, 6))
        city_counts = df['City'].value_counts().head(20)
        city_counts.plot(kind='bar', color='skyblue', edgecolor='black')
        plt.title('Top 20 Cities for Jobs')
        plt.xlabel('City')
        plt.ylabel('Number of Jobs')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'arbeitsnow_top_20_cities.png'))
        plt.close()

        # 2. Top 10 Countries Bar Plot
        plt.figure(figsize=(10, 6))
        country_counts = df['Country'].value_counts().head(10)
        country_counts.plot(kind='bar', color='lightgreen', edgecolor='black')
        plt.title('Top 10 Countries for Jobs')
        plt.xlabel('Country')
        plt.ylabel('Number of Jobs')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'arbeitsnow_top_10_countries.png'))
        plt.close()

        # 3. Jobs Found Over Time (Line Graph)
        plt.figure(figsize=(12, 6))
        # Ensure Date is datetime
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        # Filter out invalid dates if any
        date_counts = df['Date'].value_counts().sort_index()
        
        date_counts.plot(kind='line', marker='o', color='coral')
        plt.title('Jobs Found Over Time')
        plt.xlabel('Date Posted')
        plt.ylabel('Number of Jobs')
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'arbeitsnow_jobs_over_time.png'))
        plt.close()

    print("🖼️ Plots saved successfully with 'arbeitsnow_' prefix.")

else:
    print("⚠️ No jobs found to save or plot.")