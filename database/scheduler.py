import pandas as pd
import os
from datetime import datetime

from scrapers.scrape_jobs.current_jobs.scrape_arbeitnow_jobs import scrape_arbeitnow
from scrapers.scrape_jobs.current_jobs.scrape_adzuna import scrape_adzuna
from extraction.extraction import extract_from_description
from extraction.extraction import extract_from_title


def scheduler(dataset_path, max_pages=3, max_old_date=None):
    """
    Launch all scraper and extrac skills and field and append result to dataset
    """
    #######################################
    ## SCRAIPING
    #######################################
    if max_old_date is None:
        max_old_date = datetime.now().strftime('%Y-%m-%d')
    
    print(f"------ STARTING SCRAPING ------")
    # Define DataFrame structure
    columns = ["Job Title", "Field", "Level", "Continent", "Country", "City", "Date", "Company", "Description", "URL", "Skills", "Website"]
    new_jobs_df = pd.DataFrame(columns=columns)

    new_jobs_df = scrape_arbeitnow(new_jobs_df, max_old_date, max_pages=None)
    new_jobs_df = scrape_adzuna(new_jobs_df, max_old_date,max_pages=max_pages)

    print("------ SCRAPING COMPLETE ------")
    print()
    
    #######################################
    ## EXTRACTING
    #######################################
    skill_path = "./extraction/lists/skills.txt"
    new_jobs_df = extract_from_description(new_jobs_df, skill_path)

    field_path = "./extraction/lists/fields.txt"
    model_name = "TechWolf/JobBERT-v2" 
    new_jobs_df = extract_from_title(new_jobs_df,field_path,treshold=0.3,model_name=model_name)

    #######################################
    ## MERGING TABLES
    #######################################
    print("------ MERGING TABLES ------")
    full_dataset = pd.read_csv(dataset_path, compression='gzip')
    temp = len(full_dataset)
    full_dataset = pd.concat([full_dataset, new_jobs_df], ignore_index=True)
    dedup_columns = ["Job Title", "Continent", "Country", "City", "Date", "Company", "Description", "URL"]
    full_dataset = full_dataset.drop_duplicates(subset=dedup_columns)
    print(f"New jobs: {len(full_dataset)-temp}")   
    print()

    #######################################
    ## ZIP FILE
    #######################################
    print("------ SAVING DATASET ------")
    print(f"Compressing {os.path.basename(dataset_path)}")
    try:
        full_dataset.to_csv(dataset_path, index=False, compression='gzip')
        print(f"Saved: {os.path.basename(dataset_path)}")
    except Exception as e:
        print(f"Error compressing {os.path.basename(dataset_path)}: {e}")


if __name__ == "__main__":
    dataset_path = "./data/job_data/ALL_JOBS.csv.gz"
    scheduler(dataset_path)
