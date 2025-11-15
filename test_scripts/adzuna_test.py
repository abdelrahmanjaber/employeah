import requests
import os
import dotenv
import json
from tqdm import tqdm
import pandas as pd

# Load environment variables from .env file
dotenv.load_dotenv()
APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")

def debug_api_access():
    # Test 1: Categories endpoint (always works if credentials are valid)
    categories_url = "https://api.adzuna.com/v1/api/jobs/gb/categories"
    params = {'app_id': APP_ID, 'app_key': APP_KEY}
    
    response = requests.get(categories_url, params=params)
    print(f"Categories test - Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Categories endpoint works - credentials are valid")
    else:
        print(f"❌ Credentials issue: {response.text}")
        return False
    
    # Test 2: Simple search
    search_url = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
    search_params = {
        'app_id': APP_ID,
        'app_key': APP_KEY,
        'where': 'london',
        #'what': 'software developer',  # Very common term
        'results_per_page': 50,  # Increase from default (usually 10) to maximum
        #'max_days_old': 7
    }
    
    response = requests.get(search_url, params=search_params)
    response_count = response.json().get('count', 0)

    number_pages = response_count // 50 + (1 if response_count % 50 > 0 else 0)

    # get keys from the first result if available
    response_data = response.json()
    results = response_data.get('results', [])
    response_keys = results[0].keys() if results else []
    print(f"Search test - Found {response_count} results")
    print(f"Response keys: {list(response_keys)}")
    print(f"Search test - Status: {response.status_code}")

    df = pd.DataFrame(columns={"id":[], "title":[], "category_tag":[], "category_label":[],"company":[]})
    # Create progress bar
    pbar = tqdm(
        desc="📄 Fetching pages", 
        unit="page",
        total=number_pages if number_pages > 0 else None
    )

    for p in range(int(number_pages)):
        for i, result in enumerate(results, p):
            # Extract category information
            # Extract category information
            category = result.get('category', {})
            category_tag = category.get('tag', 'N/A') if category else 'N/A'
            category_label = category.get('label', 'N/A') if category else 'N/A'
                
            # Extract title
            title = result.get('title', 'N/A')
            #Extract company
            company = result.get('company', {}).get('display_name', 'N/A')
            #Extract id
            id = result.get('id', 'N/A')

            # Append to DataFrame
            df = pd.concat([df, pd.DataFrame({"id":[id], "title":[title], "category_tag":[category_tag], "category_label":[category_label],"company":[company]})], ignore_index=True)
        #print(f"Response: {response.text}")
    # Update progress bar
        pbar.set_description(f"📄 Page {p} ")
        pbar.update(1)
        
        # Check if we've reached the total available results
        if number_pages <= p:
            pbar.set_description(f"✅ All {number_pages} jobs fetched")
            break
        

    df.to_csv("adzuna_test_output.csv", index=False)

    
    return response.status_code == 200



debug_api_access()