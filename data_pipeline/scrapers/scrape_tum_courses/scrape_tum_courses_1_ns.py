import requests
import csv
import time
import re
import os

"""
STEP 1: FETCHING COURSE LIST (API)
----------------------------------
This script gets a list of all TUM courses from "Lehrveranstaltungen" (Courses)
We use the public TUMOnline API because it's fast and gives us the
correct Semester and Course Title.

We are fetching data for:
1. Winter Semester 2025 (205)
2. Summer Semester 2026 (206)

This step doesn't get descriptions and skills (those are empty here and will be fetched in tum_skills.ipynb).

"""

# CONFIGURATION
# This is the public API endpoint for the course catalog (Lehrveranstaltungen)
BASE_API_URL = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

CSV_FILE_PATH = r"C:\Users\daphn\OneDrive\Bureau\employeah\data_pipeline\data\tum_data\tum_courses_without_skills.csv"

# Defining the specific semesters we need
# ID 205 = Winter 2025
# ID 206 = Summer 2026
SEMESTERS = [
    {"id": 205, "name": "2025 W"},
    {"id": 206, "name": "2026 S"}
]

# CLEANING FUNCTIONS

# Simple helper to extract the string from the messy API object
def get_raw_title(title_obj):
    if isinstance(title_obj, dict):
        return title_obj.get('de') or title_obj.get('en') or title_obj.get('value') or ""
    return str(title_obj)

# This cleans up the title so the search bot has an easier time later.
# Removes things like "[IN001]", "(Lecture)", and semester numbers.
def clean_title_string(raw_title):
    if not raw_title: return ""
    title = raw_title.strip()
    title = re.sub(r'\[.*?\]', '', title)
    title = re.sub(r'^\d+\.?\s*', '', title)
    title = re.sub(r'^[A-Z0-9]*\d[A-Z0-9]*\s*[-–]\s*', '', title)
    title = title.replace("Teilnahmekriterien und Anmeldeinformationen", "")
    if ':' in title: title = title.split(':')[0].strip()
    title = re.sub(r'[-–,]\s*(Teil|Part)\s*\d+$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'[-–,]\s*(Lecture|Vorlesung)$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*\([^)]*?\d+[^)]*?\)', '', title)
    title = re.sub(r'\s*\([^)]+\)$', '', title)
    title = re.sub(r'\s+,', ',', title)
    title = re.sub(r',\s*$', '', title)
    return title.strip()


#  MAIN LOGIC


def fetch_and_save_courses():
    # Start fresh: delete the old file if it exists
    if os.path.exists(CSV_FILE_PATH):
        os.remove(CSV_FILE_PATH)
        
    print(f"📄 Creating new file: {CSV_FILE_PATH}")
    
    with open(CSV_FILE_PATH, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ["Title", "Semester", "Description", "Skills", "URL"]
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        # Loop through both semesters (Winter 25 & Summer 26)
        for sem in SEMESTERS:
            print(f"\n" + "="*50)
            print(f"🚀 Fetching {sem['name']} (ID: {sem['id']})")
            print("="*50)
            # Filter settings for the API request:
            # courseNormKey=LVEAB means "Standard Courses"
            # orgId=1 is TUM main organization
            filter_str = f"courseNormKey-eq=LVEAB;orgId-eq=1;termId-eq={sem['id']}"
            
            params = {
                "$filter": filter_str,
                "$orderBy": "title=ascnf",
                "$skip": 0,
                "$top": 100
            }

            total_saved_for_sem = 0
            # Keep asking for pages of courses until we run out
            while True:
                try:
                    response = requests.get(BASE_API_URL, headers=HEADERS, params=params)

                    if response.status_code != 200:
                        print(f"❌ Error {response.status_code}: {response.text}")
                        return

                    data = response.json()
                    courses = data.get('courses', [])
                    # If the list is empty, we are done with this semester
                    if not courses:
                        break

                    batch = []
                    for item in courses:
                        raw_t = get_raw_title(item.get('courseTitle'))
                        clean_t = clean_title_string(raw_t)
                        # Skip stuff that isn't a real class (like internships or thesis placeholders)
                        blacklist = ["internship", "tutorial", "exercise", "praktikum", "thesis"]
                        if any(x in clean_t.lower() for x in blacklist):
                            continue
                        if len(clean_t) < 3: continue

                        c_id = item.get('id')
                        
                        # Save the link to the course page (useful for checking later)
                        url = f"https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/{c_id}"
                        # Note: Description is set to 'Pending...' because we get that in Step 2 in tum_skills.ipynb
                        batch.append({
                            "Title": clean_t,
                            "Semester": sem['name'],
                            "Description": "Pending...",
                            "Skills": "Pending...",
                            "URL": url
                        })

                    writer.writerows(batch)
                    total_saved_for_sem += len(batch)
                    print(f"   Saved {len(batch)} courses... (Total for {sem['name']}: {total_saved_for_sem})")
                    # Check if we reached the last page
                    total_count = data.get('totalCount', 0)
                    if params['$skip'] + len(courses) >= total_count:
                        break
                    # Prepare next page
                    params['$skip'] += 100
                    time.sleep(0.2)

                except Exception as e:
                    print(f"❌ Critical Error: {e}")
                    break
            
            print(f"✅ Finished {sem['name']}. Total Saved: {total_saved_for_sem}")

    print(f"\n🎉 DONE. All data saved to {CSV_FILE_PATH}")

if __name__ == "__main__":
    fetch_and_save_courses()