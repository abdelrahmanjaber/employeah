import csv
import time
import re
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# STEP 1: SCRAPING ALL COURSE TITLES FROM TUM ONLINE (adds to csv: title, semester,url)

# Play this code first. 
# It will scrape all course titles with their semester and save to a CSV for Step 2.
# here we make sure to exclude any titles that are clearly not main courses, like tutorials, exercises, internships or seminars.
# when you run this, it will open the tum online website and wait for you to go to:
# 1. Weiter ohne Anmeldung -> Lehrveranstaltungen -> 2025 W (then it will scrape all courses from winter 2025)
# 2. Change 2025 W to 2026 S (then it will scrape all courses from summer 2026)



# Configuration 
CSV_FILE_PATH = "tum_courses_step1_collection.csv"
COURSE_LIST_URL = "https://campus.tum.de/tumonline/webnav.ini"

SEMESTERS_TO_SCRAPE = ["2025 W", "2026 S"]

def clean_title_string(raw_title):
    title = raw_title.strip()

    # 1. Remove [0000...] block (e.g., [0000003889])
    title = re.sub(r'\[.*?\]', '', title)
    
    # 2. Remove leading ordering numbers (e.g., "1. Introduction")
    title = re.sub(r'^\d+\.?\s*', '', title)

    # 3. Remove Code Prefix (e.g. "CITHN8003 – Data Science" -> "Data Science")
    # Logic: Start of line -> Word with at least one digit -> Dash -> Space
    title = re.sub(r'^[A-Z0-9]*\d[A-Z0-9]*\s*[-–]\s*', '', title)
    
    # 4. Remove known administrative phrases
    title = title.replace("Teilnahmekriterien und Anmeldeinformationen", "")

    # 5. COLON CUT-OFF: If there is a colon, take only what is BEFORE it.
    # Solves: "Advanced Topics... (Code): Innovation..." -> "Advanced Topics... (Code)"
    if ':' in title:
        title = title.split(':')[0].strip()

    # 6. Remove "Teil X" or "Part X" at the end
    # Matches: " - Teil 2", ", Part 1"
    title = re.sub(r'[-–,]\s*(Teil|Part)\s*\d+$', '', title, flags=re.IGNORECASE)

    # 7. Remove "Lecture" / "Vorlesung" suffixes (Separator can be comma OR hyphen)
    # Matches: ", Vorlesung", " - Lecture"
    title = re.sub(r'[-–,]\s*(Lecture|Vorlesung)$', '', title, flags=re.IGNORECASE)

    # 8. Remove Codes in Parentheses (Anywhere in string)
    # Logic: Look for parens containing at least one digit (likely a code like WIB01...)
    # This catches "(WIB01832, englisch)" in the middle of a string.
    title = re.sub(r'\s*\([^)]*?\d+[^)]*?\)', '', title)

    # 9. Remove ANY remaining parentheses at the very END of the string
    # This catches "(CH4790a)" or "(Review)" if it wasn't caught by rule #8
    title = re.sub(r'\s*\([^)]+\)$', '', title)

    # 10. Fix punctuation left behind (e.g., trailing spaces or commas)
    title = re.sub(r'\s+,', ',', title)
    title = re.sub(r',\s*$', '', title) # Remove trailing comma if any

    # 11. Clean ONLY Newlines (Keep commas/quotes for Step 2)
    title = title.replace('\n', ' ')
    
    return title.strip()

def save_batch_to_csv(data_list, filename):
    keys = ["Title", "Semester", "Description", "Skills","URL"]
    file_exists = os.path.isfile(filename)
    
    with open(filename, 'a', newline='', encoding='utf-8') as f:
        # QUOTE_MINIMAL automatically handles commas/quotes safely
        writer = csv.DictWriter(f, fieldnames=keys, quoting=csv.QUOTE_MINIMAL)
        if not file_exists:
            writer.writeheader()
        for row in data_list:
            writer.writerow(row)

def main_step_1():
    options = webdriver.ChromeOptions()
    prefs = {"profile.managed_default_content_settings.images": 2}
    options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 10)
    
    # Reset file to ensure fresh clean data
    if os.path.exists(CSV_FILE_PATH):
        os.remove(CSV_FILE_PATH)

    seen_titles = set()

    try:
        driver.get(COURSE_LIST_URL)
        
        for semester in SEMESTERS_TO_SCRAPE:
            print("\n" + "="*60)
            print(f" STEP 1: COLLECTING TITLES FOR {semester}")
            print("="*60)
            print(f"1. Select '{semester}' in the UI.")
            print("2. CHANGE 'Entries per page' to MAXIMUM.")
            input(f">>> PRESS ENTER WHEN TABLE IS LOADED <<<")
            
            page_num = 1
            semester_count = 0
            
            while True:
                print(f"   Scraping Page {page_num}...", end="", flush=True)

                raw_data = driver.execute_script("""
                    var results = [];
                    var links = document.querySelectorAll("a");
                    for (var i = 0; i < links.length; i++) {
                        var href = links[i].href;
                        var title = links[i].innerText.trim();
                        if (href.includes('student/courses/') && title.length > 3 && !title.includes('Details')) {
                            results.push({"raw_title": title, "url": href});
                        }
                    }
                    return results;
                """)

                batch_to_save = []
                new_items = 0
                
                for item in raw_data:
                    clean = clean_title_string(item['raw_title'])
                    
                    if len(clean) < 3: continue
                    if clean in seen_titles: continue 
                    
                    # --- STRICT LOWERCASE FILTER ---
                    lower = clean.lower()
                    filter_keywords = [
                        "teilnahmekriterien", "anmeldeinformationen", 
                        "tutorial", "tutorium", 
                        "exercise", "übung", 
                        "praktikum", "internship",
                        "lab course", "seminar course", "seminar",
                        "abschlussarbeiten", 
                        "absolventinnen- und absolventenfeier",
                        "thesis","bachelor",
                        "master", "kolloqium",
                        "thesis","phd"
                    ]
                    
                    if any(keyword in lower for keyword in filter_keywords): 
                        continue
                    # -------------------------------
                    
                    seen_titles.add(clean)
                    
                    batch_to_save.append({
                        "Title": clean,
                        "Semester": semester,
                        "Description": "Pending...",
                        "Skills": "Pending...",
                        "URL": item['url']
                    })
                    new_items += 1
                    semester_count += 1
                
                if batch_to_save:
                    save_batch_to_csv(batch_to_save, CSV_FILE_PATH)
                
                print(f" Saved {new_items} courses. (Total: {semester_count})")

                # Pagination
                try:
                    try: first_link = driver.find_element(By.XPATH, "//a[contains(@href, 'student/courses/')]")
                    except: first_link = None

                    next_btns = driver.find_elements(By.CSS_SELECTOR, "a[title='Nächste Seite'], a[title='Next page'], a[aria-label='Nächste Seite']")
                    valid_next = None
                    for btn in next_btns:
                        if btn.is_displayed() and "disabled" not in btn.get_attribute("class"):
                            valid_next = btn
                            break
                    
                    if not valid_next:
                        print(f"   🛑 No more pages for {semester}.")
                        break
                        
                    valid_next.click()
                    
                    if first_link:
                        try: wait.until(EC.staleness_of(first_link))
                        except: time.sleep(2)
                    else:
                        time.sleep(2)
                    page_num += 1
                    
                except Exception as e:
                    print(f"   ⚠️ Pagination ended: {e}")
                    break

        print(f"\n✅ STEP 1 COMPLETE. All titles saved to {CSV_FILE_PATH}")

    except Exception as e:
        print(f"\n❌ Critical Error: {e}")

    finally:
        driver.quit()

if __name__ == "__main__":
    main_step_1()