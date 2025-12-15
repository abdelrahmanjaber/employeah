import requests
import pandas as pd
import time
import re
from datetime import datetime

# Clean titles
def clean_title(title):
    if not title:
        return "Unknown"

    title = re.split(r'\s*\((m\/w\/d|m\/f\/d|f\/m\/x|d\/w\/m)\)', title, flags=re.IGNORECASE)[0]
    title = re.sub(r'\s*\(.*?\)', '', title)
    for sep in [r'\s-\s', r'\s\|\s', r'\s\/\/\s', r'\s–\s']:
        title = re.split(sep, title)[0]

    return title.strip()

# Extract location
def extract_city_country(raw_location):
    if not raw_location:
        return "Unknown", "Germany"
    if "remote" in raw_location.lower():
        return "Remote", "Remote"
    city = raw_location.split(',')[0].strip()
    return city, "Germany"

# SCRAPER (modified to accept existing DataFrame)
def scrape_arbeitnow(df, stop_date, max_pages=None):
    """
    Scrape Arbeitnow jobs until stop_date or max_pages and append to existing DataFrame.
    """
    print(f"Arbeitnow scrape until: {stop_date}")

    url = "https://www.arbeitnow.com/api/job-board-api"
    page = 1
    stop_scraping = False

    while url and not stop_scraping:
        if max_pages and page > max_pages:
            break

        print(f"Page {page}")
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if r.status_code != 200:
            stop_scraping = True
            print(f"WARNING: arbeitnow scraping failed with status code: {r.status_code}")
            break

        data = r.json()
        jobs = data.get("data", [])

        for job in jobs:
            if not job.get("created_at"):
                continue

            job_date = datetime.fromtimestamp(job["created_at"]).strftime('%Y-%m-%d')

            if job_date < stop_date:
                stop_scraping = True
                break
            
            # Append row to existing DataFrame
            df.loc[len(df)] = {
                "Job Title": clean_title(job.get("title")),
                "Continent": "Europe",
                "Country": "Germany",
                "City": extract_city_country(job.get("location"))[0],
                "Date": job_date,
                "Company": job.get("company_name"),
                "Description": job.get("description"),
                "URL": job.get("url"),
                "Skills": "",
                "Website": "arbeitnow"
            }

        url = data.get("links", {}).get("next")
        page += 1
        time.sleep(1)

    print(f"Arbeitnow collected {len(df)} total jobs")
    return df