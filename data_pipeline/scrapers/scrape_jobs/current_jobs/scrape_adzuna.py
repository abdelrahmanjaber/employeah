import os
import dotenv
import requests
import pandas as pd
import time
import math
from datetime import datetime
from . import locations

# Load API keys
dotenv.load_dotenv()
APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")

# Load job categories
current_folder = os.path.dirname(os.path.abspath(__file__))
job_file_path = os.path.join(current_folder, "job_categories.txt")
with open(job_file_path, "r") as f:
    JOB_TYPES = [line.strip() for line in f if line.strip()]

# SCRAPER (modified to accept existing DataFrame)
def scrape_adzuna(df, stop_date, max_pages=2):
    """
    Scrape Adzuna jobs until stop_date and append to existing DataFrame.
    """
    print(f"Adzuna scrape until: {stop_date}")

    temp = len(df)
    stop_scraping = False

    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    for country_code in locations.TARGET_COUNTRIES:
        if stop_scraping:
            break

        country_name = locations.COUNTRY_MAP.get(country_code, country_code)
        continent = locations.CONTINENT_MAP.get(country_code, "Unknown")
        print(f"🚩 {country_name}")

        for job_query in JOB_TYPES:
            if stop_scraping:
                break

            base_url = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/1"
            params = {
                "app_id": APP_ID,
                "app_key": APP_KEY,
                "what": job_query,
                "results_per_page": min(locations.RESULTS_PER_PAGE, 50),
                "max_days_old": 5  # <- aligns with stop_date
            }

            # ----- REQUEST WITH TIMEOUT HANDLING -----
            try:
                r = requests.get(
                    base_url,
                    params=params,
                    headers=headers,
                    timeout=10
                )
            except requests.exceptions.ReadTimeout:
                print(f"WARNING: timeout | country={country_code} | query='{job_query}'")
                continue

            if r.status_code != 200:
                print(
                    f"WARNING: adzuna scraping failed | "
                    f"country={country_code} | query='{job_query}' | "
                    f"status={r.status_code}"
                )
                print(r.text[:300])
                continue

            data = r.json()
            total = data.get("count", 0)
            if total == 0:
                continue

            pages = min(math.ceil(total / params["results_per_page"]), max_pages)

            for page in range(1, pages + 1):
                if page > 1:
                    page_url = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/{page}"
                    try:
                        r = requests.get(
                            page_url,
                            params=params,
                            headers=headers,
                            timeout=10
                        )
                    except requests.exceptions.ReadTimeout:
                        print(f"WARNING: timeout | country={country_code} | page={page}")
                        break

                    if r.status_code != 200:
                        print(
                            f"WARNING: adzuna page failed | "
                            f"country={country_code} | page={page} | "
                            f"status={r.status_code}"
                        )
                        break

                    results = r.json().get("results", [])
                else:
                    results = data.get("results", [])

                for item in results:
                    raw_date = item.get("created", "")
                    job_date = raw_date.split("T")[0]

                    if job_date < stop_date:
                        break  # <- only stops current page, not entire scraper

                    location_area = item.get("location", {}).get("area", [])
                    city = "Unknown"
                    for loc in reversed(location_area):
                        if loc not in locations.COUNTRY_BLOCKLIST:
                            city = loc
                            break

                    df.loc[len(df)] = {
                        "Job Title": item.get("title"),
                        "Continent": continent,
                        "Country": country_name,
                        "City": city,
                        "Date": job_date,
                        "Company": item.get("company", {}).get("display_name"),
                        "Description": item.get("description"),
                        "URL": item.get("redirect_url"),
                        "Skills": "",
                        "Website": "adzuna"
                    }

                time.sleep(1.5)  # keep polite pause

    print(f"✅ Adzuna collected {len(df) - temp} total jobs")
    return df
