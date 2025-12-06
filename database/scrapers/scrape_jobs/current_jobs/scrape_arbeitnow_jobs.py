import os
import requests
import pandas as pd
import time
import re
from datetime import datetime

# --- CONFIGURATION ---
OUTPUT_DIR = 'database/data/job_data'
CSV_FILENAME = os.path.join(OUTPUT_DIR, "arbeitnow_jobs.csv")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- CLEANING FUNCTIONS ---
def clean_title(title):
    """Cleans up job titles by removing gender markers and marketing fluff."""
    if not title: return "Unknown"
    
    # Remove gender markers (case insensitive)
    title = re.split(r'\s*\(m\/w\/d\)', title, flags=re.IGNORECASE)[0]
    title = re.split(r'\s*\(m\/f\/d\)', title, flags=re.IGNORECASE)[0]
    title = re.split(r'\s*\(f\/m\/x\)', title, flags=re.IGNORECASE)[0]
    title = re.split(r'\s*\(d\/w\/m\)', title, flags=re.IGNORECASE)[0]
    
    # Remove extra info in parentheses and common separators
    title = re.sub(r'\s*\(.*?\)', '', title)
    separators = [r'\s-\s', r'\s\|\s', r'\s\/\/\s', r'\s–\s'] 
    for sep in separators:
        title = re.split(sep, title)[0]

    return title.strip()

def extract_city_country(raw_location):
    """Parses location string into City and Country."""
    if not raw_location: return "Unknown", "Germany"
        
    if "remote" in raw_location.lower():
        return "Remote", "Remote"

    parts = raw_location.split(',')
    city = parts[0].strip()
    country = "Germany" # Default assumption based on API source
    
    return city, country

# --- MAIN SCRIPT ---
def scrape_todays_jobs():
    base_url = "https://www.arbeitnow.com/api/job-board-api"
    url = base_url
    page_count = 1
    
    # Get today's date in the format YYYY-MM-DD
    today_str = datetime.now().strftime('%Y-%m-%d')
    print(f"🚀 Starting scraper for date: {today_str}")

    new_jobs = []
    stop_scraping = False

    while url and not stop_scraping:
        print(f"📄 Fetching Page {page_count}...")
        
        try:
            r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            
            if r.status_code == 429:
                print("⚠️ Rate limit hit. Sleeping for 60s...")
                time.sleep(60)
                continue
            elif r.status_code != 200:
                print(f"❌ Error {r.status_code}: {r.text[:200]}")
                break
                
            data = r.json()
            current_jobs = data.get("data", [])
            
            if not current_jobs:
                break

            for job in current_jobs:
                # 1. Check Date
                date_posted = "N/A"
                if job.get("created_at"):
                    date_posted = datetime.fromtimestamp(job.get("created_at")).strftime('%Y-%m-%d')

                # LOGIC: Stop if we hit an older date (assuming API is sorted Newest -> Oldest)
                if date_posted < today_str:
                    print("🛑 Encountered jobs from previous days. Stopping pagination.")
                    stop_scraping = True
                    break
                
                # LOGIC: Skip if strict match fails (e.g. if API sort is messy)
                if date_posted != today_str:
                    continue

                # 2. Extract Data
                raw_title = job.get("title", "")
                final_title = clean_title(raw_title)
                raw_location = job.get("location", "")
                city, country = extract_city_country(raw_location)

                job_entry = {
                    "Job Title": final_title,
                    "Continent": "Europe",
                    "Country": country,
                    "City": city,
                    "Date": date_posted,
                    "Company": job.get("company_name"),
                    "Description": job.get("description"),
                    "URL": job.get("url"),
                    "Skills": ""
                }
                new_jobs.append(job_entry)

            # Pagination
            url = data.get("links", {}).get("next")
            page_count += 1
            time.sleep(1) 

        except Exception as e:
            print(f"⚠️ Unexpected error: {e}")
            break

    # --- SAVE RESULTS ---
    print(f"✅ Scraping complete. Found {len(new_jobs)} jobs from today.")

    if new_jobs:
        df = pd.DataFrame(new_jobs)
        
        # Check if file exists to determine if we need to write headers
        file_exists = os.path.isfile(CSV_FILENAME)
        
        # mode='a' appends, header=False prevents writing headers again if file exists
        df.to_csv(CSV_FILENAME, mode='a', header=not file_exists, index=False, encoding='utf-8')
        
        print(f"📂 Appended data to: {CSV_FILENAME}")
    else:
        print("⚠️ No new jobs found for today.")

if __name__ == "__main__":
    scrape_todays_jobs()