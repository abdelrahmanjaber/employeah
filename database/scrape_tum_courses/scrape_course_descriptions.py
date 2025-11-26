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

# STEP 2: SCRAPING DESCRIPTIONS (With Retry Logic & Filtering)

# --- Configuration ---
INPUT_CSV = "tum_courses_step1_collection.csv"
OUTPUT_CSV = "tum_courses_complete_with_descriptions.csv"
MODULE_HB_URL = "https://campus.tum.de/tumonline/wbModHb.wbShow?pOrgNr=1"

def get_smart_search_term(full_title):
    # Logic: If title has "quotes", search ONLY for the text inside quotes.
    if '"' in full_title:
        match = re.search(r'"(.*?)"', full_title)
        if match and len(match.group(1).strip()) > 3:
            return match.group(1).strip()
    return full_title.strip()

def perform_search_and_scrape(driver, search_term):
    """
    Helper function to perform a single search attempt.
    Returns the description text if successful, or None if failed.
    """
    wait = WebDriverWait(driver, 5)
    original_window = driver.current_window_handle
    
    try:
        driver.get(MODULE_HB_URL)

        # 1. Find Search Input
        try:
            search_input = wait.until(EC.presence_of_element_located((
                By.XPATH, "//td[contains(., 'Name oder Kennung')]/following-sibling::td//input"
            )))
        except:
            search_input = driver.find_element(By.CSS_SELECTOR, "div.cFilter input[type='text'], table input[type='text']")
        
        search_input.clear()
        search_input.send_keys(search_term[:200]) # Safety truncation

        # 2. CLICK THE FILTER BUTTON
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

        # 3. Find Result Link
        try:
            course_link = wait.until(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, search_term)))
            existing_windows = driver.window_handles
            course_link.click()
        except TimeoutException:
            return None # Return None to signal "Not Found" so we can retry

        # 4. Handle Popup
        popup_opened = False
        try:
            wait.until(EC.new_window_is_opened(existing_windows))
            driver.switch_to.window(driver.window_handles[-1])
            popup_opened = True
        except: 
            popup_opened = False

        # 5. Extract Text
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
        if popup_opened:
            driver.close()
            driver.switch_to.window(original_window)

        if not parts:
            return "Error: No text extracted (Page might be empty)"
            
        return "\n\n".join(parts)

    except Exception as e:
        # Emergency Reset
        try:
            while len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[-1])
                driver.close()
            driver.switch_to.window(original_window)
        except: pass
        return f"Error: {type(e).__name__}"

def get_description_with_retry(driver, course_title):
    if not course_title or len(course_title) < 3: return "Invalid Title"
    
    # --- ATTEMPT 1: Full Title ---
    term1 = get_smart_search_term(course_title)
    result = perform_search_and_scrape(driver, term1)
    
    if result and "Error" not in result and "Invalid" not in result:
        return result
        
    # --- ATTEMPT 2: Split at Hyphen (if exists) ---
    # Example: "Advanced Control - Lecture" -> "Advanced Control"
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

def save_single_row(row_data, filename):
    keys = ["Title", "Semester", "Description", "Skills", "URL"]
    exists = os.path.isfile(filename)
    with open(filename, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys, quoting=csv.QUOTE_MINIMAL)
        if not exists: writer.writeheader()
        writer.writerow(row_data)

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
            
            # Use the new RETRY logic function
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