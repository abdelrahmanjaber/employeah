import requests
import pandas as pd
import time
import re
import matplotlib.pyplot as plt
from bs4 import BeautifulSoup
from datetime import datetime


# this is great for trend analysis, since we can get good data from back to 2015 (10 years)
# (arbeitnow doesn't have historical data, only current job listings)
# ==========================================
# 1. SCRAPING FUNCTIONS
# ==========================================

def get_hn_hiring_threads(limit=12):
    """
    Fetches the last 'limit' months of 'Who is hiring?' threads.
    To get 10 years of data, set limit=120.
    """
    print(f"Fetching meta-data for the last {limit} months...")
    url = "http://hn.algolia.com/api/v1/search_by_date"
    params = {
        "tags": "story,author_whoishiring",
        "query": "Who is hiring?",
        "hitsPerPage": limit
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()['hits']
    except Exception as e:
        print(f"Error fetching threads: {e}")
        return []

def clean_html(html_text):
    """Converts HTML to clean text."""
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, 'html.parser')
    return soup.get_text(separator='\n').strip()

def parse_thread(thread_id, thread_title, thread_date):
    """Fetches a thread and extracts top-level job posts."""
    url = f"http://hn.algolia.com/api/v1/items/{thread_id}"
    try:
        response = requests.get(url)
        data = response.json()
    except:
        return []
    
    jobs = []
    children = data.get('children', [])
    
    for comment in children:
        raw_text = comment.get('text')
        if not raw_text: continue
            
        clean_text = clean_html(raw_text)
        
        # Split Header vs Description
        parts = clean_text.split('\n', 1)
        title_line = parts[0].strip()
        description = parts[1].strip() if len(parts) > 1 else ""
        
        # Basic Filter: Text too short is likely noise
        if len(clean_text) < 20: continue

        jobs.append({
            "source_thread": thread_title,
            "thread_date": thread_date, # Helpful for sorting
            "job_header": title_line,
            "job_description": description,
            "full_text": clean_text
        })
        
    return jobs

# ==========================================
# 2. ANALYSIS FUNCTIONS
# ==========================================

def extract_location(header_text):
    """
    Simple keyword search to guess location for statistics.
    (LLM would be better, but this works for a quick graph)
    """
    header_lower = header_text.lower()
    
    # Priority: Remote Check
    if "remote" in header_lower:
        return "Remote"
    
    # Common Hubs (Extend this list as needed)
    locations = {
        "new york": "NYC", "nyc": "NYC", "ny": "NYC",
        "san francisco": "San Francisco", "sf": "San Francisco", "bay area": "San Francisco",
        "london": "London",
        "berlin": "Berlin",
        "austin": "Austin",
        "seattle": "Seattle",
        "toronto": "Toronto",
        "india": "India",
        "uk": "UK",
        "europe": "Europe"
    }
    
    for key, val in locations.items():
        if key in header_lower:
            return val
            
    return "Other / Unspecified"

# ==========================================
# 3. MAIN EXECUTION
# ==========================================

def main():
    # --- CONFIGURATION ---
    MONTHS_TO_SCRAPE = 6  # Increase this to 120 for 10 years!
    
    # 1. Scrape
    threads = get_hn_hiring_threads(limit=MONTHS_TO_SCRAPE)
    all_job_data = []
    
    print(f"\nStarting scrape for {len(threads)} threads...")
    for thread in threads:
        t_date = thread['created_at'][:7] # YYYY-MM
        print(f"Processing: {t_date} - {thread['title']}...")
        
        extracted_jobs = parse_thread(thread['objectID'], thread['title'], t_date)
        all_job_data.extend(extracted_jobs)
        time.sleep(0.5) # Be polite to API

    # 2. Create DataFrame & Clean
    df = pd.DataFrame(all_job_data)
    
    # --- YOUR REQUESTED CLEANING & PREP ---
    print("\nCleaning data...")
    # Combine for LLM
    df['llm_input_text'] = df['job_header'] + "\n" + df['job_description']
    
    # Filter Link Dumps
    df_clean = df[df['job_description'].str.len() > 100].copy()
    
    # Extract Location for Stats
    df_clean['extracted_location'] = df_clean['job_header'].apply(extract_location)

    # 3. Statistics & Visualization
    print("\nGenerating Statistics...")
    
    # STATS 1: Top Locations
    loc_counts = df_clean['extracted_location'].value_counts().head(10)
    print("\nTop Job Locations:")
    print(loc_counts)
    
    # STATS 2: Jobs per Month (Trend)
    # Convert date to datetime objects for proper sorting/plotting
    df_clean['date_obj'] = pd.to_datetime(df_clean['thread_date'])
    trend = df_clean.groupby('date_obj').size()
    
    # 4. Plotting
    plt.figure(figsize=(12, 6))
    
    # Plot Trend Line
    plt.plot(trend.index, trend.values, marker='o', linestyle='-', color='b')
    
    plt.title(f"Hacker News Job Postings Trend (Last {MONTHS_TO_SCRAPE} Months)")
    plt.xlabel("Date")
    plt.ylabel("Number of Jobs (Filtered)")
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save Graph
    plt.savefig("job_trend_graph.png")
    print("\nGraph saved as 'job_trend_graph.png'")
    
    # 5. Save Data
    df_clean.to_csv("hn_jobs_final.csv", index=False)
    print(f"Saved {len(df_clean)} jobs to 'hn_jobs_final.csv'")
    
    # Preview for User
    print("\n--- Example Input for LLM ---")
    if not df_clean.empty:
        print(df_clean.iloc[0]['llm_input_text'][:300] + "...")

if __name__ == "__main__":
    main()