import requests
import pandas as pd
import time
import re
import os
import html
from datetime import datetime
# Note: This requires a 'locations.py' file in the same directory containing:
# SORTED_CITIES, CITY_TO_COUNTRY, TARGET_COUNTRIES, CONTINENT_MAP, COUNTRY_MAP
import locations as locations

# --- CONFIGURATION ---
YEARS_TO_SCRAPE = 20
# Adjusted path usage to be cross-platform compatible or specific to your setup
OUTPUT_DIR = 'database/data/job_data'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'hackernews_jobs.csv') 
JOB_TITLES_FILENAME = 'job_titles.txt' 

# --- STATS CONTAINER ---
SCRAPE_STATS = {
    'attempts': 0,
    'success': 0,
    'titles_found': [],
    'desc_whitelist_count': 0,
    'desc_whitelist_found': [],
    'header_whitelist_count': 0,
    'split_strategy_count': 0, 
    'failed_descriptions': [] 
}

# --- JOB TITLE WHITELIST LOADING ---
KNOWN_JOB_TITLES = set() 
KNOWN_JOB_TITLES_LIST = [] 

def load_job_titles():
    global KNOWN_JOB_TITLES, KNOWN_JOB_TITLES_LIST
    
    # Determine potential paths for the file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(script_dir, JOB_TITLES_FILENAME),      # Same folder as script
        os.path.join(OUTPUT_DIR, JOB_TITLES_FILENAME),      # Output folder
        JOB_TITLES_FILENAME                                 # Current working directory
    ]

    print(f"\n🔎 Looking for '{JOB_TITLES_FILENAME}'...")
    
    loaded = False
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    raw_titles = [line.strip() for line in f if line.strip()]
                    
                    # 1. Create List (Sorted by Length for Regex)
                    KNOWN_JOB_TITLES_LIST = sorted(raw_titles, key=len, reverse=True)
                    
                    # 2. Create Set (Lowercased for Exact Match Check)
                    KNOWN_JOB_TITLES = set(t.lower() for t in raw_titles)
                    
                    print(f"✅ FOUND: Loaded {len(KNOWN_JOB_TITLES)} titles from: {path}")
                    loaded = True
                    break
            except Exception as e:
                print(f"⚠️ Error reading {path}: {e}")
    
    if not loaded:
        print(f"❌ NOT FOUND: Could not find '{JOB_TITLES_FILENAME}' in any of the following locations:")
        for p in possible_paths:
            print(f"   - {p}")
        print("⚠️ Warning: Whitelist strategies (Z-0, Z-1, Z-2) will be skipped.\n")

# Load immediately on start
load_job_titles()

# --- VALIDATION LISTS ---
INVALID_TITLES = [
    "multiple roles", "multiple positions", "multiple open roles", "multiple",
    "senior", "junior", "mid-level", "lead", "staff", "principal", 
    "engineering", "engineers", "developers", "builders", "makers",
    "hiring", "apply", "join us", "work with us",
    "nyc", "sf", "london", "berlin", "us", "uk", "eu", "la", "or", "ok",
    "many roles", "various roles", "openings",
    "founding team", "founding engineers", "founding members", 
    "people who can build systems",
    "la office", "sf office", "ny office",
    "intern", "interns", "co-op", "co-ops", "interns/co-ops",
    "contract", "contractor", "full-time", "full time", "part-time", "part time",
    "oklahoma city ok", "multiple locations", "multiple engineering roles",
    "saas b2b presentation software", "experienced software engineers who are interested",
    "engineering devops & product"
]

TERMS_TO_REMOVE = [
    "full-time", "full time", "fulltime", 
    "part-time", "part time", "parttime",
    "contract", "contractor",
    "equity", "benefits", "salary", "comp",
    "onsite", "on-site", "hybrid", "remote",
    "office",
    "u.s. citizenship required", "citizenship required",
    "visa sponsorship", "visa support",
    "yoe", "years of experience", "3+ yoe", "5+ yoe"
]

LOCATION_BLOCKLIST = set()
for city in locations.SORTED_CITIES:
    LOCATION_BLOCKLIST.add(city.lower())
for country_name in locations.COUNTRY_MAP.values():
    LOCATION_BLOCKLIST.add(country_name.lower())
LOCATION_BLOCKLIST.update(["usa", "uk", "uae", "can", "ger", "nz", "aus"])


# --- 1. EXTRACTION LOGIC ---

def extract_location_data(text):
    text_lower = text.lower()
    for city in locations.SORTED_CITIES:
        if re.search(r'\b' + re.escape(city.lower()) + r'\b', text_lower):
            country_code = locations.CITY_TO_COUNTRY[city]
            if country_code == "Remote":
                return "Remote", "Remote"
            return city, country_code

    if re.search(r'\bgermany\b|\bdeutschland\b|\bde\b', text_lower): return "Multiple/See Desc", "de"
    if re.search(r'\buk\b|\bunited kingdom\b|\blondon\b', text_lower): return "Multiple/See Desc", "gb"
    if re.search(r'\busa\b|\bunited states\b|\bnew york\b', text_lower): return "Multiple/See Desc", "us"

    return None, None

def clean_title_text(title):
    if not title: return ""
    clean = title.lower()
    for term in TERMS_TO_REMOVE:
        pattern = r'\b' + re.escape(term) + r'\b'
        clean = re.sub(pattern, '', clean)
    clean = re.sub(r'^[\/\\\^\-\*\s]+', '', clean) # Remove starting symbols
    clean = clean.replace('(', '').replace(')', '').replace(',', '').strip()
    clean = re.sub(r'\s+', ' ', clean)
    return clean.title() 

def is_valid_title(title):
    if not title: return False
    t_lower = title.lower().strip()

    if len(t_lower) <= 2:
        if t_lower not in ['cio', 'cto', 'ceo', 'cfo', 'cpo', 'cro', 'qa', 'ml', 'ai']: return False
    if t_lower in LOCATION_BLOCKLIST: return False
    if re.search(r'https?://|www\.|\.com\b|\.io\b|\.co\b|\.net\b|\.org\b|\.edu\b', t_lower): return False
    if t_lower in INVALID_TITLES: return False
    if re.search(r'\d+k\b|\$|\d{3,}|\d+%|^\d+$|\d+\+ years|\d+\+ yoe', t_lower): return False
    if ',' in t_lower: return False
    if t_lower.count('/') > 1: return False
    if len(t_lower.split()) > 6: return False
    if t_lower in ["senior", "engineer", "developer", "consultant", "architect"]: return False

    return True

def fetch_yc_job_title(url):
    try:
        if "ycombinator.com/companies" not in url and "workatastartup.com" not in url: return None
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            title_match = re.search(r'<title>(.*?) at .*?</title>', response.text, re.IGNORECASE)
            if title_match: return title_match.group(1).strip()
            meta_match = re.search(r'<meta content="(.*?) at .*?" name="title"', response.text, re.IGNORECASE)
            if meta_match: return meta_match.group(1).strip()
    except Exception:
        return None
    return None

def find_title_in_text(text, whitelist_list):
    """
    Scans text for longest whitelist match using regex.
    """
    if not text: return None
    # Pre-process: replace separators like '|' or '/' or ':' with spaces
    # This helps "Fabric8Labs | Software Developer" become "Fabric8Labs   Software Developer"
    processed_text = re.sub(r'[\/\|\-\(\):]', ' ', text).lower()
    
    for known_title in whitelist_list:
        # Use regex boundary \b to match exact words
        pattern = r'\b' + re.escape(known_title.lower()) + r'\b'
        if re.search(pattern, processed_text):
            return known_title
    return None

def extract_job_title_dynamic(header, description, url):
    clean_header = header.strip()
    candidate_title = None

    # --- STRATEGY Z-0: SPLIT & MATCH ---
    if '|' in clean_header:
        parts = [p.strip() for p in clean_header.split('|')]
        for part in parts:
            cleaned_part = clean_title_text(part)
            if cleaned_part.lower() in KNOWN_JOB_TITLES:
                candidate_title = cleaned_part
                SCRAPE_STATS['split_strategy_count'] += 1
                break

    # --- STRATEGY Z-1: Whitelist Regex on HEADER (Improved) ---
    if not candidate_title:
        # This will scan "Fabric8Labs | Software Developer | ..." and find "Software Developer"
        found_in_header = find_title_in_text(clean_header, KNOWN_JOB_TITLES_LIST)
        if found_in_header:
            candidate_title = found_in_header
            SCRAPE_STATS['header_whitelist_count'] += 1

    # --- STRATEGY A: "Hiring" Regex ---
    if not candidate_title:
        match = re.search(r'(?:is hiring|looking for)\s+(.*?)(?:\s+in\s+|\s+at\s+|\||$)', clean_header, re.IGNORECASE)
        if match:
            candidate_title = match.group(1).strip()

    # --- STRATEGY B: Pipe Heuristic ---
    if not candidate_title and '|' in clean_header:
        parts = [p.strip() for p in clean_header.split('|')]
        if len(parts) >= 2:
            for part in parts[1:]:
                loc, _ = extract_location_data(part)
                cleaned_part = clean_title_text(part)
                if is_valid_title(cleaned_part) and not loc:
                    candidate_title = cleaned_part
                    break
    
    # --- STRATEGY Z-2: Whitelist on DESCRIPTION ---
    if not candidate_title and description:
        # Check first 1000 chars of body
        desc_snippet = description[:1000]
        found_in_desc = find_title_in_text(desc_snippet, KNOWN_JOB_TITLES_LIST)
        if found_in_desc:
            candidate_title = found_in_desc
            SCRAPE_STATS['desc_whitelist_count'] += 1
            SCRAPE_STATS['desc_whitelist_found'].append(found_in_desc)

    # --- VALIDATION ---
    if candidate_title:
        candidate_title = clean_title_text(candidate_title)
        if not is_valid_title(candidate_title):
            candidate_title = None

    # --- STRATEGY C: EXTERNAL SCRAPE ---
    should_scrape = False
    if not candidate_title: should_scrape = True
    elif candidate_title.lower() in ["engineers", "hiring", "team", "everyone", "builders"]: should_scrape = True
        
    if should_scrape and url:
        SCRAPE_STATS['attempts'] += 1
        scraped_title = fetch_yc_job_title(url)
        if scraped_title:
            cleaned_scraped = clean_title_text(scraped_title)
            if is_valid_title(cleaned_scraped):
                SCRAPE_STATS['success'] += 1
                SCRAPE_STATS['titles_found'].append(cleaned_scraped)
                return cleaned_scraped

    if candidate_title: return candidate_title
    
    # Store failure for debug
    if len(SCRAPE_STATS['failed_descriptions']) < 20:
        snippet = description[:300].replace('\n', ' ')
        SCRAPE_STATS['failed_descriptions'].append(snippet)
        
    return "Multiple/See Desc"


# --- 2. PROCESS THREAD ---

def process_thread(thread_item):
    thread_id = thread_item['id']
    date_str = thread_item['date']
    print(f"   > Processing Thread {date_str} (ID: {thread_id})...")
    
    all_comments = []
    page = 0
    while True:
        api_url = f"http://hn.algolia.com/api/v1/search_by_date?tags=comment,story_{thread_id}&hitsPerPage=1000&page={page}"
        try:
            r = requests.get(api_url)
            if r.status_code != 200: break
            data = r.json()
            hits = data.get('hits', [])
            if not hits: break
            all_comments.extend(hits)
            if page >= data.get('nbPages', 0) - 1: break
            page += 1
            time.sleep(0.5) 
        except Exception: break

    print(f"     ✅ Extracted {len(all_comments)} raw comments.")
    extracted_jobs = []
    
    for comment in all_comments:
        if not comment or not comment.get('comment_text'): continue
        raw_text = comment['comment_text']
        clean_text = html.unescape(re.sub(r'<[^>]+>', ' ', raw_text)).strip()
        lines = clean_text.split('\n')
        header = lines[0] 
        if comment.get('parent_id') != int(thread_id): continue

        city, country_code = extract_location_data(header)
        if not country_code: city, country_code = extract_location_data(clean_text[:200]) 
        if not country_code: continue
        if country_code != "Remote" and country_code not in locations.TARGET_COUNTRIES: continue
            
        company = "Unknown"
        if '|' in header: company = header.split('|')[0].strip()
        else: company = " ".join(header.split()[:3])

        url_match = re.search(r'(https?://[^\s]+)', raw_text)
        job_url = url_match.group(1) if url_match else None
        hn_url = f"https://news.ycombinator.com/item?id={comment['objectID']}"
        final_url = job_url if job_url else hn_url

        job_title = extract_job_title_dynamic(header, clean_text, job_url)

        continent = locations.CONTINENT_MAP.get(country_code, "Unknown")
        country_name = locations.COUNTRY_MAP.get(country_code, country_code)

        job = {
            "Job Title": job_title,
            "Continent": continent,
            "Country": country_name,
            "City": city,
            "Date": date_str,
            "Company": company,
            "Description": clean_text[:3000],
            "URL": final_url,
            "Skills": "None"
        }
        extracted_jobs.append(job)
        
    return extracted_jobs

# --- 3. FIND THREADS ---

def get_hiring_threads(years=10):
    print(f"🔍 Searching for 'Who is hiring' threads...")
    api_url = "http://hn.algolia.com/api/v1/search_by_date"
    start_year = datetime.now().year - years
    params = {
        "tags": "story,author_whoishiring",
        "hitsPerPage": 1000,
        "numericFilters": f"created_at_i>{datetime(start_year, 1, 1).timestamp()}"
    }
    r = requests.get(api_url, params=params)
    data = r.json()
    threads = []
    for hit in data['hits']:
        if "who is hiring?" in hit['title'].lower():
            threads.append({'id': hit['objectID'], 'date': hit['created_at'][:10], 'title': hit['title']})
    print(f"✅ Found {len(threads)} hiring threads.")
    return threads

# --- 4. EXECUTION ---
if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    threads = get_hiring_threads(years=YEARS_TO_SCRAPE)
    all_jobs = []
    for thread in threads:
        jobs = process_thread(thread)
        all_jobs.extend(jobs)
        time.sleep(1) 
        
    df = pd.DataFrame(all_jobs)
    
    if not df.empty:
        cols = ["Job Title", "Continent", "Country", "City", "Date", "Company", "Description", "URL", "Skills"]
        for c in cols:
            if c not in df.columns: df[c] = ""
        df = df[cols]
        header = not os.path.exists(OUTPUT_FILE)
        df.to_csv(OUTPUT_FILE, mode='a', header=header, index=False)
        print(f"\n✨ Success! Scraped {len(df)} jobs.")
        print(f"💾 Appended to {OUTPUT_FILE}")
        
        print("\n" + "="*50 + "\n")
        print("--- Top 30 Most Frequent Job Titles ---")
        if 'Job Title' in df.columns:
            print(df['Job Title'].value_counts().head(30))
            print("\n--- Descriptions for 'Multiple/See Desc' (First 20) ---")
            failed_jobs = df[df['Job Title'] == "Multiple/See Desc"]
            if not failed_jobs.empty:
                for i, row in enumerate(failed_jobs['Description'].head(20), 1):
                    desc_snippet = row[:200].replace('\n', ' ')
                    print(f"{i}. {desc_snippet}...")
            else:
                print("No 'Multiple/See Desc' entries found.")
    else:
        print("\n⚠️ No jobs found matching your criteria.")

    print("\n" + "="*50)
    print("📊 EXTRACTION STATISTICS")
    print(f"  Split Strategy (Z-0) Matches: {SCRAPE_STATS['split_strategy_count']}")
    print(f"  Header Regex (Z-1) Matches:   {SCRAPE_STATS['header_whitelist_count']}")
    print(f"  Description Search (Z-2) Matches: {SCRAPE_STATS['desc_whitelist_count']}")
    print(f"  External Scraping Attempts: {SCRAPE_STATS['attempts']}")
    print("="*50)