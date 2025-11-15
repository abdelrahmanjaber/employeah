import requests
import os
import dotenv
import json

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
        'results_per_page': 5,
        'where': 'london',
        'what': 'software developer',  # Very common term
        'results_per_page': 50,  # Increase from default (usually 10) to maximum
        'max_days_old': 3
    }
    
    response = requests.get(search_url, params=search_params)
    response_count = response.json().get('count', 0)
    # get keys from the first result if available
    response_data = response.json()
    results = response_data.get('results', [])
    response_keys = results[0].keys() if results else []
    print(f"Search test - Found {response_count} results")
    print(f"Response keys: {list(response_keys)}")
    print(f"Search test - Status: {response.status_code}")
    for i, result in enumerate(results, 1):
        # Extract category information
         # Extract category information
        category = result.get('category', {})
        category_tag = category.get('tag', 'N/A') if category else 'N/A'
        category_label = category.get('label', 'N/A') if category else 'N/A'
               
        # Extract title
        title = result.get('title', 'N/A')
        print(f"Result {i}:"+f" Title: {title}, Category: {category_label} ({category_tag})")
    #print(f"Response: {response.text}")

    
    return response.status_code == 200



debug_api_access()