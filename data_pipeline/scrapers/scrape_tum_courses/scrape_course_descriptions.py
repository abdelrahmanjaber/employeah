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
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# STEP 2: SCRAPING DESCRIPTIONS  (adds to csv: description)

# you need to have run step 1 first to get the base course list from LEHRVERANSTALTUNGEN, to have gotten classes actually offered at TUM in winter 2025 and summer 2026
# and now we are navigating with selenium to get the course descriptions from the MODULE HANDBOOK
# because in LEHRVERANSTALTUNGEN there are almost always no descriptions available

"""
=============================================================================
PROJECT: Course Description Scraper (Module Handbook)
=============================================================================

WHY SELENIUM AND NOT API?
I initially wanted to use the direct API endpoints (like `slc.mod.mh`) because 
they are faster. However, I found two major blockers:
1. Restricted Access: The modern JSON API returns a 404/401 error for student 
   accounts (it seems to be internal-only).
2. Dynamic Session Tokens: The legacy website (`WBMODHB`) uses "Navigation 
   Context" (NC) tokens in the URL (e.g., .../NC_1726/...). These change 
   every time you click or refresh. 



Because of this, a standard Python request script gets "Session Expired" errors immediately.
Selenium solves this by launching a real browser instance. This acts like a 
"Robot User" that gets a valid session stamp automatically, allowing us to 
access the data that is blocked from simple scripts.
=============================================================================
"""

INPUT_CSV = "tum_courses_step1_collection.csv"
OUTPUT_CSV = "tum_courses_complete_with_descriptions.csv"
MODULE_HB_URL = "https://campus.tum.de/tumonline/wbModHb.wbShow?pOrgNr=1"

# Helper function to clean up the search title.
# Sometimes titles have quotes or extra info that confuses the search engine.
# This function strips those out so we search for the core name (e.g., text inside quotes).
#
def get_smart_search_term(full_title):
    # Logic: If title has "quotes", search ONLY for the text inside quotes.
    if '"' in full_title:
        match = re.search(r'"(.*?)"', full_title)
        if match and len(match.group(1).strip()) > 3:
            return match.group(1).strip()
    return full_title.strip()

# This is the core worker function.
# It simulates a human user: 
# 1. Opens the search page.
# 2. Types the course name.
# 3. Clicks the first result.
# 4. Reads the text from the popup window.
def perform_search_and_scrape(driver, search_term):
    
    wait = WebDriverWait(driver, 5)
    original_window = driver.current_window_handle
    
    try:
        driver.get(MODULE_HB_URL)
        # 1. Locate the Search Box
        # The page layout is a bit messy (nested tables), so we try XPATH first.
        # If that fails, we fall back to a CSS selector to find the input field.
        
        try:
            search_input = wait.until(EC.presence_of_element_located((
                By.XPATH, "//td[contains(., 'Name oder Kennung')]/following-sibling::td//input"
            )))
        except:
            search_input = driver.find_element(By.CSS_SELECTOR, "div.cFilter input[type='text'], table input[type='text']")
        # Clear any old text and type the new search term (limited to 200 chars to prevent errors).
        search_input.clear()
        search_input.send_keys(search_term[:200]) # Safety truncation

        # 2. Click the "Filter" (Search) Button
        # The button ID changes sometimes, so I made a list of possible "strategies" (XPATHs).
        # We loop through them until one works.
        filter_btn = None
        strategies = [
            "//input[@value='Filtern']",               
            "//input[contains(@value, 'Filtern')]",    
            "//button[contains(., 'Filtern')]",        
            "//a[contains(., 'Filtern')]",             
            "//*[@title='Filtern']",                   
            "//input[@type='submit']"                  
        ]
        
        for xpath in strategies:
            try:
                filter_btn = driver.find_element(By.XPATH, xpath)
                if filter_btn.is_displayed() and filter_btn.is_enabled():
                    filter_btn.click()
                    break
            except: continue
        
        if not filter_btn:
             return "Error: Filter button not found"

        # 3. Find and Click the Result Link
        # We wait for a link that matches our search term. 
        # If it doesn't appear within 5 seconds, we assume the course wasn't found.
        try:
            course_link = wait.until(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, search_term)))
            existing_windows = driver.window_handles
            course_link.click()
        except TimeoutException:
            return None # Return None to signal "Not Found" so we can retry

        # 4. Handle the Popup Window
        # The detailed description usually opens in a new popup/tab. 
        # We have to tell Selenium to "switch focus" to this new window to read it.
        popup_opened = False
        try:
            wait.until(EC.new_window_is_opened(existing_windows))
            driver.switch_to.window(driver.window_handles[-1])
            popup_opened = True
        except: 
            popup_opened = False

        # 5. Extract the Description Text
        # We look for specific headers like "Inhalt" (Content) or "Lernergebnisse" (Outcomes).
        # We grab the text in the table cell immediately following the header.
        targets = [("Lernergebnisse", "Lernergebnisse"), ("Inhalt", "Inhalt"), ("Lernmethode", "Lernmethode")]
        parts = []
        
        for name, keyword in targets:
            try:
                # Primary Strategy
                el = driver.find_elements(By.XPATH, f"//td[contains(., '{keyword}')]/following-sibling::td")
                if el and el[0].text.strip():
                    parts.append(f"--- {name.upper()} ---\n{el[0].text.strip()}")
                    continue
                # Fallback Strategy
                el_fb = driver.find_elements(By.XPATH, f"//*[contains(text(), '{keyword}')]/following::*[1]")
                if el_fb and len(el_fb[0].text.strip()) > 5:
                    parts.append(f"--- {name.upper()} ---\n{el_fb[0].text.strip()}")
            except: pass

        # 6. Cleanup
        # Close the popup window and switch back to the main list so we are ready for the next loop.
        if popup_opened:
            driver.close()
            driver.switch_to.window(original_window)

        if not parts:
            return "Error: No text extracted (Page might be empty)"
            
        return "\n\n".join(parts)

    except Exception as e:
        # Emergency Reset: If something crashes (like a stuck popup), close extra windows
        # and return to the main one.
        try:
            while len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[-1])
                driver.close()
            driver.switch_to.window(original_window)
        except: pass
        return f"Error: {type(e).__name__}"


# Search Logic Wrapper.
# Sometimes the search fails because the title is too specific (e.g. "Math - Lecture").
# This function tries the exact title first. If that fails, it simplifies the title
# (removes everything after " - ") and tries again.
def get_description_with_retry(driver, course_title):
    if not course_title or len(course_title) < 3: return "Invalid Title"
    
    # --- ATTEMPT 1: Full Title ---
    term1 = get_smart_search_term(course_title)
    result = perform_search_and_scrape(driver, term1)
    
    if result and "Error" not in result and "Invalid" not in result:
        return result
        
    # --- ATTEMPT 2: Simplify Title and Retry ---
    # Example: "Advanced Control - Lecture" -> searches for "Advanced Control"
    if " - " in course_title:
        term2 = course_title.split(" - ")[0].strip()
        # Only retry if the new term is substantially different and long enough
        if term2 != term1 and len(term2) > 3:
            print(f" (Retrying with: '{term2}')...", end="", flush=True)
            result_retry = perform_search_and_scrape(driver, term2)
            if result_retry:
                return result_retry

    # If both failed, return the error from the first attempt (or generic)
    return result if result else f"Course Not Found (Search: '{term1}')"

#this function saves a single row to the output CSV
def save_single_row(row_data, filename):
    keys = ["Title", "Semester", "Description", "Skills", "URL"]
    exists = os.path.isfile(filename)
    with open(filename, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys, quoting=csv.QUOTE_MINIMAL)
        if not exists: writer.writeheader()
        writer.writerow(row_data)
        
# Main execution function.
# Reads the CSV from Step 1, starts the Chrome browser, and loops through every course.
def main_step_2():
    print(f"--- STEP 2: LOADING COURSES FROM {INPUT_CSV} ---")
    if not os.path.exists(INPUT_CSV): 
        print("❌ Input file missing.")
        return

    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        courses = list(csv.DictReader(f))

    processed = set()
    if os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, 'r', encoding='utf-8') as f:
            processed = {row['Title'] for row in csv.DictReader(f)}
    
    print(f"Loaded {len(courses)} courses. Already processed: {len(processed)}.")

    options = webdriver.ChromeOptions()
    options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # --- Tracking Stats ---
    stats = {
        "success": 0,
        "failed": 0,
        "details": {} 
    }

    try:
        total = len(courses)
        for i, course in enumerate(courses):
            if course['Title'] in processed: continue
            
            print(f"[{i+1}/{total}] {course['Title'][:40]}...", end="", flush=True)
            
            # Start the scraping attempt
            desc = get_description_with_retry(driver, course['Title'])
            
            is_error = not desc or "Error" in desc or "Invalid" in desc or "Not Found" in desc
            
            if is_error:
                print(" ❌")
                stats["failed"] += 1
                error_type = desc.split(":")[0] if desc and ":" in desc else "Unknown Error"
                if error_type not in stats["details"]: stats["details"][error_type] = []
                stats["details"][error_type].append(course['Title'])
            else:
                print(" ✅")
                stats["success"] += 1
                course['Description'] = desc
                save_single_row(course, OUTPUT_CSV)
            
            time.sleep(0.5)
            
    finally:
        driver.quit()
        
        # --- FINAL REPORT ---
        total_processed = stats["success"] + stats["failed"]
        if total_processed > 0:
            success_rate = (stats["success"] / total_processed) * 100
            print(f"\n{'='*60}\n FINAL SUMMARY\n{'='*60}")
            print(f"Total Processed: {total_processed}")
            print(f"✅ Success:      {stats['success']} ({success_rate:.1f}%)")
            print(f"❌ Failed:       {stats['failed']} ({100-success_rate:.1f}%)")
            
            if stats["failed"] > 0:
                print(f"\n--- ERROR BREAKDOWN ---")
                for err_type, titles in stats["details"].items():
                    print(f"\n👉 {err_type}: {len(titles)} occurrences")
                    print(f"   Examples: 1. {titles[0]}")
                    if len(titles) > 1: print(f"             2. {titles[1]}")
        
        print(f"\n✅ Valid courses saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main_step_2()