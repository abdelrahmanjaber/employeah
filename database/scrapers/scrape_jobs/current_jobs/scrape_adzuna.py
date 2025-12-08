import os
import dotenv
import requests
import pandas as pd
import time
import math
import locations as locations
from datetime import datetime  # <--- NEW IMPORT

# 1. Load environment variables
dotenv.load_dotenv()
APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")

# Load Job Types
with open('database/scrapers/scrape_jobs/current_jobs/job_categories.txt', 'r') as f:
    JOB_TYPES = [line.strip() for line in f if line.strip()]
def scrape_country_jobs():
    os.makedirs('database/data/job_data', exist_ok=True)
    OUTPUT_FILE = 'database/data/job_data/adzuna_jobs.csv'
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    print(f"📅 Run Date: {today_str} — Searching {len(JOB_TYPES)} titles across {len(locations.TARGET_COUNTRIES)} countries.")

    columns = ["Job Title", "Continent", "Country", "City", "Date", "Company", "Description", "URL", "Skills"]
    
    if not os.path.exists(OUTPUT_FILE):
        pd.DataFrame(columns=columns).to_csv(OUTPUT_FILE, index=False)
        print(f"📁 Created new file: {OUTPUT_FILE}")

    for country_code in locations.TARGET_COUNTRIES:
        country_name = locations.COUNTRY_MAP.get(country_code, country_code)
        print(f"\n🚩 STARTING COUNTRY: {country_name} ({country_code})")
        
        country_jobs_buffer = [] 
        
        for job_query in JOB_TYPES:
            base_url = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/1"
            
            params = {
                'app_id': APP_ID,
                'app_key': APP_KEY,
                'what': job_query,
                'results_per_page': locations.RESULTS_PER_PAGE,
                'max_days_old': 1, 
                'content-type': 'application/json'
            }

            try:
                response = requests.get(base_url, params=params)
                
                # --- 429 RATE LIMIT HANDLER ---
                if response.status_code == 429:
                    print("   🛑 Hit Rate Limit (429). Sleeping for 60 seconds...")
                    time.sleep(60)
                    # Retry once
                    response = requests.get(base_url, params=params)

                if response.status_code != 200:
                    # If still failing, skip
                    print(f"   ⚠️ API Status {response.status_code} for {job_query}. Skipping.")
                    time.sleep(1)
                    continue

                data = response.json()
                total_results = data.get('count', 0)
                
                if total_results == 0:
                    # Small delay even on empty results to be polite
                    time.sleep(0.5)
                    continue
                
                real_pages = math.ceil(total_results / locations.RESULTS_PER_PAGE)
                pages_to_scrape = min(real_pages, locations.MAX_PAGES_PER_SEARCH)
                
                print(f"   + {job_query}: Found {total_results} new jobs -> Scraping {pages_to_scrape} pages")

                for page in range(1, pages_to_scrape + 1):
                    if page > 1:
                        page_url = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/{page}"
                        r = requests.get(page_url, params=params)
                        if r.status_code != 200: break
                        results = r.json().get('results', [])
                    else:
                        results = data.get('results', [])

                    for item in results:
                        raw_date = item.get('created', '')
                        formatted_date = raw_date.split('T')[0] if 'T' in raw_date else raw_date

                        if formatted_date != today_str:
                            continue

                        location_area = item.get('location', {}).get('area', [])
                        found_city = "Unknown"
                        if location_area:
                            for loc in reversed(location_area):
                                if loc not in locations.COUNTRY_BLOCKLIST:
                                    found_city = loc
                                    break
                        if found_city == country_name: found_city = "Unknown"

                        continent_name = locations.CONTINENT_MAP.get(country_code, 'Unknown')

                        job = {
                            "Job Title":  item.get('title'), 
                            "Continent": continent_name,
                            "Country": country_name,
                            "City": found_city, 
                            "Date": formatted_date,
                            "Company": item.get('company', {}).get('display_name'),
                            "Description": item.get('description'),
                            "URL": item.get('redirect_url'),
                            "Skills": None
                        }
                        country_jobs_buffer.append(job)
                    
                    # Increased sleep slightly for safety
                    time.sleep(1.5) 

            except Exception as e:
                print(f"   ❌ Error: {e}")
                time.sleep(5)

        if country_jobs_buffer:
            df = pd.DataFrame(country_jobs_buffer)
            df.to_csv(OUTPUT_FILE, mode='a', header=False, index=False)
            print(f"💾 Saved {len(country_jobs_buffer)} jobs for {country_name}.")

if __name__ == "__main__":
    scrape_country_jobs()
    
    # --- CLEANUP ---
    print("\n🧹 Starting post-scrape cleanup...")
    csv_path = 'database/data/job_data/adzuna_jobs.csv'
    if os.path.exists(csv_path):
        # NOTE: If your file gets very large, reading the whole thing here might become slow.
        try:
            df = pd.read_csv(csv_path)
            original_count = len(df)
            df = df.drop_duplicates()
            # De-dupe based on URL and specific fields
            df = df.drop_duplicates(subset=['URL'])
            df = df.drop_duplicates(subset=['Company', 'Date', 'Job Title'])
            
            df.to_csv(csv_path, index=False)
            print(f"✨ Cleanup Complete: Total DB size is now {len(df)} (Removed {original_count - len(df)} duplicates).")
        except Exception as e:
            print(f"⚠️ Cleanup failed (file might be empty or locked): {e}")