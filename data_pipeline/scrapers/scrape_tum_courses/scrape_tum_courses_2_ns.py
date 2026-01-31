import csv
import time
import re
import os
import requests
import urllib.parse

# ==========================================
# ⚙️ CONFIGURATION
# ==========================================

INPUT_CSV = "tum_courses_complete.csv"
OUTPUT_CSV = "tum_courses_final_descriptions.csv"

# We test the standard module endpoint
MODULE_API_URL = "https://campus.tum.de/tumonline/ee/rest/slc.mod.mh/student/modules"

# ==========================================
# 🛠️ HELPER FUNCTIONS
# ==========================================

def clean_html(text):
    if not text: return ""
    text = str(text)
    text = re.sub(r'<(br|p|div|li)[^>]*>', '\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def get_first_text(obj):
    if isinstance(obj, dict):
        return obj.get('de') or obj.get('en') or ""
    return str(obj) if obj else ""

def generate_search_candidates(title):
    if not title: return []
    # 1. Clean clutter
    clean = re.sub(r'\s*\(?(Lecture|Vorlesung|Exercise|Übung|Praktikum|Seminar)\)?', '', title, flags=re.IGNORECASE)
    clean = re.sub(r'\[.*?\]', '', clean) 
    clean = clean.strip()
    
    candidates = []
    # A. Exact Title
    candidates.append(clean)
    # B. Before " - "
    split_char = re.split(r' [-–:] ', clean)
    if len(split_char) > 1:
        candidates.append(split_char[0].strip())
    
    return list(dict.fromkeys(candidates))

# ==========================================
# 🚀 MAIN SCRIPT
# ==========================================

def main_debug_api():
    if not os.path.exists(INPUT_CSV):
        print(f"❌ Input file {INPUT_CSV} missing.")
        return

    # 1. SETUP GUEST SESSION
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
    })

    # 2. READ CSV
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        courses = list(reader)

    print(f"📚 Loaded {len(courses)} courses.")
    print("🚀 Starting DEBUG Search...")

    # 3. OPEN OUTPUT CSV
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ["Title", "Semester", "Description", "Skills", "URL"]
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()

        for i, row in enumerate(courses):
            # Limit to first 5 for debugging so you don't wait forever
            if i > 5: 
                print("\n🛑 Stopping debug after 5 items. Check the logs above!")
                break

            original_title = row['Title']
            candidates = generate_search_candidates(original_title)
            
            print(f"\n[{i+1}] Processing: '{original_title}'")
            print(f"   🔍 Candidates: {candidates}")

            found = False
            
            for term in candidates:
                if len(term) < 3: continue
                
                try:
                    # Escape special characters
                    safe_term = term.replace("'", "''")
                    
                    # OData Filter
                    params = {
                        "$filter": f"substringof('{safe_term}', title/de) or substringof('{safe_term}', title/en)",
                        "$top": 1
                    }
                    
                    # --- DEBUG PRINT ---
                    # Shows the exact request being made
                    full_url = f"{MODULE_API_URL}?$filter={urllib.parse.quote(params['$filter'])}&$top=1"
                    print(f"   👉 Requesting: {full_url}")
                    
                    resp = session.get(MODULE_API_URL, params=params)
                    
                    # --- DEBUG RESPONSE ---
                    print(f"      Status: {resp.status_code}")
                    if resp.status_code != 200:
                        print(f"      ❌ Error Response: {resp.text[:100]}...")
                    else:
                        data = resp.json()
                        results = data.get('value', []) or data.get('courses', [])
                        print(f"      ✅ Results found: {len(results)}")
                        
                        if results:
                            module = results[0]
                            desc = clean_html(get_first_text(module.get('content')))
                            if len(desc) > 5:
                                print("      🎉 SUCCESS: Found description!")
                                row['Description'] = desc
                                found = True
                                break
                            else:
                                print("      ⚪ Found entry, but description field was empty.")

                except Exception as e:
                    print(f"      ❌ Exception: {e}")

            if not found:
                row['Description'] = "Not Found"
            
            writer.writerow(row)
            time.sleep(0.5)

if __name__ == "__main__":
    main_debug_api()