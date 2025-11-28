import requests
import pandas as pd
import time
import matplotlib.pyplot as plt
from bs4 import BeautifulSoup
import os
import re
import spacy

# this file scrapes international job listings from the Hacker News "Who is Hiring?" threads.
# -> great for historical trend analysis later, as we can scrape data from 10 years ago.

print("Loading NLP model...")
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Error: Spacy model not found. Run: python -m spacy download en_core_web_sm")
    exit()

#this function extracts job details from header text, by using aggressive parsing and AI assistance (spacy package) to find job location.

def extract_job_details(header_text, description_text=""):
    """
    Aggressive extraction that handles messy formats and falls back to description.
    """
    if not header_text:
        return "Unknown", "Unknown", "Unknown", "Unknown"

    # PHASE 1: NORMALIZE FORMATTING 
    # Convert ' - ', ' – ' (en-dash), and '(' into pipes so we can split easily
    clean_header = header_text.replace(" - ", " | ").replace(" – ", " | ").replace("(", " | ").replace(")", "")
    
    parts = [p.strip() for p in clean_header.split('|')]
    
    # 1. Company (First part)
    company = parts[0]
    if len(company) > 50: company = company[:50] + "..."

    # Init
    remote_status = "Onsite"
    location = "Unspecified"
    title_parts = []
    
    # Slang Map (Expanded & Lowercase keys), words that map to standard location names
    # which may be in threads and not recognized
    slang_map = {
        "nyc": "New York City", "sf": "San Francisco", "bay area": "San Francisco",
        "la": "Los Angeles", "uk": "United Kingdom", "us": "USA", "usa": "USA", 
        "eu": "Europe", "europe": "Europe", "dach": "Germany/Austria/Switzerland",
        "london": "London", "berlin": "Berlin", "munich": "Munich",
        "latam": "Latin America", "apac": "Asia Pacific", "emea": "Europe/Middle East/Africa",
        "na": "North America", "peninsula": "San Francisco", "remote": "Remote"
    }
    
    # Noise words to strip
    noise_pattern = re.compile(r'\b(hybrid|onsite|remote|full-time|full time|hiring|contract|founding|engineer|dev)\b', re.IGNORECASE)

    # Check Global Keywords
    header_lower = header_text.lower()
    if "remote" in header_lower: remote_status = "Remote"
    elif "hybrid" in header_lower: remote_status = "Hybrid"

    # PHASE 2: SCAN HEADER PARTS 
    found_loc = None
    
    for part in parts[1:]:
        clean_part = part.strip()
        if not clean_part or len(clean_part) < 2: continue
        
        # Skip URL-like parts
        if "http" in clean_part or ".com" in clean_part: continue

        clean_lower = clean_part.lower()
        
        # A. PHRASE MATCHING (Fixes "Bay Area")
        # We check if any key in slang_map exists INSIDE the text
        for slang, real_name in slang_map.items():
            if slang in clean_lower:
                # Special case: don't match "us" inside "corpus" or "trust"
                # Use regex boundry for short words
                if len(slang) < 3:
                    if re.search(rf'\b{slang}\b', clean_lower):
                        found_loc = real_name
                        break
                else:
                    found_loc = real_name
                    break
        
        if found_loc: break

        # B. AI CHECK 
        # Remove noise words so AI sees just the city
        for_ai = noise_pattern.sub("", clean_part).strip()
        if len(for_ai) > 2:
            doc = nlp(for_ai)
            for ent in doc.ents:
                if ent.label_ == "GPE": # GPE = Geopolitical Entity
                    found_loc = ent.text
                    break
        if found_loc: break
        
        # Collect likely title parts if no location found
        title_parts.append(clean_part)

    #  PHASE 3: DESCRIPTION FALLBACK 
    # If header failed, look at the first 200 chars of the description
    if not found_loc and description_text:
        # Quick check for "Location: City" pattern
        desc_snippet = description_text[:300]
        doc = nlp(desc_snippet)
        for ent in doc.ents:
            if ent.label_ == "GPE":
                found_loc = ent.text
                break

    # Finalize
    if found_loc:
        location = found_loc
    elif remote_status == "Remote":
        location = "Remote (No specific location)"

    job_title = " - ".join(title_parts) if title_parts else "Unspecified"
    
    return company, job_title, remote_status, location

def extract_application_link(description, comment_id):
    url_match = re.search(r'(https?://[^\s\)]+)', description)
    if url_match: return url_match.group(1)
    return f"https://news.ycombinator.com/item?id={comment_id}"


# 2. PLOTTING FUNCTIONS

#this plots the 20 top locations from the dataframe

def plot_top_locations(df, output_dir):
    print("\nCreating Location Bar Chart...")
    clean_df = df[~df['job_location'].isin(["Unspecified", "Unknown", "Other / Unspecified"])]
    top_locs = clean_df['job_location'].value_counts().head(20)
    
    if top_locs.empty: return

    plt.figure(figsize=(12, 6))
    plt.bar(top_locs.index, top_locs.values, color='skyblue', edgecolor='black')
    plt.title("Top 20 Job Locations (Hacker News)", fontsize=16)
    plt.xlabel("Location", fontsize=12)
    plt.ylabel("Number of Jobs", fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "top_locations_bar_chart.png"))
    print(f"Location chart saved.")

#this plots the 20 top companies from the dataframe
def plot_top_companies(df, output_dir):
    print("\nCreating Company Bar Chart...")
    clean_df = df[~df['company_name'].isin(["Unknown", "Pending..."])]
    top_cos = clean_df['company_name'].value_counts().head(20)
    
    if top_cos.empty: return

    plt.figure(figsize=(12, 6))
    plt.bar(top_cos.index, top_cos.values, color='salmon', edgecolor='black')
    plt.title("Top 20 Hiring Companies (Hacker News)", fontsize=16)
    plt.xlabel("Company", fontsize=12)
    plt.ylabel("Number of Jobs Posted", fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "top_companies_bar_chart.png"))
    print(f"Company chart saved.")

# 3. SCRAPING FUNCTIONS

def get_hn_hiring_threads(years=1):
    months_target = years * 12
    fetch_limit = months_target * 3 
    print(f"Fetching meta-data for the last {years} years...")
    url = "http://hn.algolia.com/api/v1/search_by_date"
    params = {"tags": "story,author_whoishiring", "numericFilters": "points>10", "hitsPerPage": fetch_limit}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        hits = response.json()['hits']
        hiring_threads = [h for h in hits if h['title'].startswith("Ask HN: Who is hiring?")]
        return hiring_threads[:months_target]
    except Exception as e:
        print(f"Error: {e}")
        return []

def clean_html(html_text):
    if not html_text: return ""
    soup = BeautifulSoup(html_text, 'html.parser')
    return soup.get_text(separator='\n').strip()

def parse_thread(thread_id, thread_title, thread_date):
    url = f"http://hn.algolia.com/api/v1/items/{thread_id}"
    try:
        data = requests.get(url).json()
    except:
        return []
    
    jobs = []
    children = data.get('children', [])
    
    for comment in children:
        raw_text = comment.get('text')
        if not raw_text: continue
        clean_text = clean_html(raw_text)
        
        parts = clean_text.split('\n', 1)
        header = parts[0].strip()
        desc = parts[1].strip() if len(parts) > 1 else ""
        
        if len(desc) < 50 or re.match(r'^https?://\S+$', desc): continue

        comment_id = comment.get('id')
        job_url = extract_application_link(desc, comment_id)

        jobs.append({
            "source_thread": thread_title,
            "thread_date": thread_date,
            "job_header": header,
            "job_description": desc,
            "job_url": job_url
        })
    return jobs

# 4. MAIN SCRIPT

def main():

    YEARS_TO_SCRAPE = 10
    OUTPUT_DIR = "database/data/job_data"
    
    # 1. Scrape
    threads = get_hn_hiring_threads(years=YEARS_TO_SCRAPE)
    if not threads: return

    all_job_data = []
    print(f"\nStarting scrape for {len(threads)} threads...")
    for thread in threads:
        t_date = thread['created_at'][:7]
        print(f"Processing: {t_date}...")
        all_job_data.extend(parse_thread(thread['objectID'], thread['title'], t_date))
        time.sleep(0.5)

    # 2. Process Data
    df = pd.DataFrame(all_job_data)
    print("\nCleaning data and running Enhanced Extraction...")

    
    extracted_data = df.apply(
        lambda row: pd.Series(extract_job_details(row['job_header'], row['job_description'])), 
        axis=1
    )
    
    df['company_name'] = extracted_data[0]
    df['job_title'] = extracted_data[1]
    df['remote_status'] = extracted_data[2]
    df['job_location'] = extracted_data[3]

    # 3. Stats & Graphs
    print("\nGenerating Statistics...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    df['date_obj'] = pd.to_datetime(df['thread_date'])
    trend = df.groupby('date_obj').size()
    plt.figure(figsize=(12, 6))
    plt.plot(trend.index, trend.values, marker='o')
    plt.title(f"Hacker News Job Postings ({YEARS_TO_SCRAPE} Years)")
    plt.grid(True)
    plt.savefig(os.path.join(OUTPUT_DIR, "job_trend_graph.png"))
    
    plot_top_locations(df, OUTPUT_DIR)
    plot_top_companies(df, OUTPUT_DIR)
    
    # 4. Save CSV
    cols = ['thread_date', 'company_name', 'job_title', 'job_url', 'remote_status', 'job_location', 'job_header', 'job_description']
    final_cols = [c for c in cols if c in df.columns]
    
    csv_path = os.path.join(OUTPUT_DIR, "hn_jobs_final.csv")
    df[final_cols].to_csv(csv_path, index=False)
    print(f"\nSaved {len(df)} jobs to: {csv_path}")

    # 5. Munich Specifics (to demonstrate local analysis)
    munich_jobs = df[df['job_location'] == 'Munich']
    print(f"\n--- Munich Analysis ---")
    print(f"Total jobs found in Munich: {len(munich_jobs)}")
    if not munich_jobs.empty:
        print("Sample Munich Listings:")
        print(munich_jobs[['company_name', 'job_title', 'job_url']].head(5).to_string(index=False))

if __name__ == "__main__":
    main()