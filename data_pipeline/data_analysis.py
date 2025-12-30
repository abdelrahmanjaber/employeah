import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

# --- GLOBAL CONFIG ---
DATA_DIR = 'database/data/job_data'
STATS_DIR = os.path.join(DATA_DIR, 'statistics')
MERGED_FILE = os.path.join(DATA_DIR, "ALL_JOB_DATA.csv")

def analyze_job_data(source_name):
    """
    Analyzes job data for a specific source.
    Generates graphs and saves them to a specific subfolder.
    """
    SOURCE_OUTPUT_DIR = os.path.join(STATS_DIR, source_name)
    os.makedirs(SOURCE_OUTPUT_DIR, exist_ok=True)
    INPUT_FILE = os.path.join(DATA_DIR, f'{source_name}_jobs.csv')
    
    print(f"\n=======================================================")
    print(f"📊 STARTING ANALYSIS FOR: {source_name.upper()}")
    print(f"=======================================================")
    print(f"📂 Loading data from {INPUT_FILE}...")

    try:
        df = pd.read_csv(INPUT_FILE)
    except FileNotFoundError:
        print(f"❌ Error: Could not find {INPUT_FILE}")
        return

    # Ensure Date column is datetime
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df = df.dropna(subset=['Date'])
    
    plt.style.use('ggplot') 

    # GRAPH 1: Top Companies
    if 'Company' in df.columns:
        top_companies = df['Company'].value_counts().head(20)
        plt.figure(figsize=(12, 8))
        top_companies.sort_values().plot(kind='barh', color='#3498db')
        plt.title(f'Top 20 Companies ({source_name.title()})', fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(SOURCE_OUTPUT_DIR, f'{source_name}_top_companies_graph.png'))
        plt.close()
        print(f"✅ Saved Top Companies graph")

    # GRAPH 2: Top Cities
    if 'City' in df.columns:
        clean_cities = df[~df['City'].isin(['Multiple/See Desc', 'Unknown', 'Remote', '', 'nan'])]
        top_cities = clean_cities['City'].value_counts().head(20)
        plt.figure(figsize=(12, 8))
        top_cities.sort_values().plot(kind='barh', color='#2ecc71')
        plt.title(f'Top 20 Cities ({source_name.title()})', fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(SOURCE_OUTPUT_DIR, f'{source_name}_top_cities_graph.png'))
        plt.close()
        print(f"✅ Saved Top Cities graph")

    # GRAPH 3: Top Titles
    if 'Job Title' in df.columns:
        top_titles = df['Job Title'].value_counts().head(20)
        plt.figure(figsize=(12, 8))
        top_titles.sort_values().plot(kind='barh', color='#9b59b6')
        plt.title(f'Top 20 Job Titles ({source_name.title()})', fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(SOURCE_OUTPUT_DIR, f'{source_name}_top_titles_graph.png'))
        plt.close()
        print(f"✅ Saved Top Titles graph")

    # GRAPH 4: Timeline (FIXED WITH AUTO-LOCATOR)
    if 'Date' in df.columns and not df.empty:
        try:
            # Resample by Day so the data line is precise
            daily_counts = df.set_index('Date').resample('D').size()
            
            if not daily_counts.empty:
                plt.figure(figsize=(14, 7))
                plt.plot(daily_counts.index, daily_counts.values, marker='o', linestyle='-', color='#e74c3c', linewidth=2, markersize=3)
                
                # --- FIX: Use AutoDateLocator instead of DayLocator ---
                locator = mdates.AutoDateLocator()
                formatter = mdates.ConciseDateFormatter(locator)
                
                plt.gca().xaxis.set_major_locator(locator)
                plt.gca().xaxis.set_major_formatter(formatter)
                
                plt.gcf().autofmt_xdate() # Rotate dates for readability
                
                plt.title(f'Job Trend Over Time ({source_name.title()})', fontsize=16)
                plt.xlabel('Date')
                plt.ylabel('Number of Jobs')
                plt.grid(True, linestyle='--', alpha=0.5)
                plt.tight_layout()
                plt.savefig(os.path.join(SOURCE_OUTPUT_DIR, f'{source_name}_jobs_over_time_graph.png'))
                plt.close()
                print(f"✅ Saved Timeline graph")
        except Exception as e:
            print(f"⚠️ Could not generate timeline: {e}")

    print(f"✨ Analysis complete for {source_name}.")


def generate_overall_analysis():
    """
    Loads the pre-merged ALL_JOB_DATA.csv and generates aggregate statistics.
    Saves to 'statistics/overall'.
    """
    OVERALL_OUTPUT_DIR = os.path.join(STATS_DIR, 'overall')
    os.makedirs(OVERALL_OUTPUT_DIR, exist_ok=True)

    print(f"\n=======================================================")
    print(f"📊 GENERATING OVERALL ANALYSIS (FROM MERGED FILE)")
    print(f"=======================================================")
    
    if not os.path.exists(MERGED_FILE):
        print(f"❌ Error: Could not find {MERGED_FILE}. Please run your merge script first.")
        return

    try:
        master_df = pd.read_csv(MERGED_FILE)
    except Exception as e:
        print(f"❌ Error reading merged file: {e}")
        return

    print(f"✅ Loaded {len(master_df)} total jobs from merged file.")
    plt.style.use('ggplot')

    # PLOT 1: Source Comparison
    id_map = {0: 'Arbeitnow', 1: 'Adzuna', 2: 'HackerNews'}
    if 'website' in master_df.columns:
        source_counts = master_df['website'].map(id_map).value_counts()
        plt.figure(figsize=(10, 6))
        colors = ['#2980b9' if x=='Arbeitnow' else '#27ae60' if x=='Adzuna' else '#FF6600' for x in source_counts.index]
        bars = plt.bar(source_counts.index, source_counts.values, color=colors)
        for bar in bars:
            yval = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2, yval + (yval*0.01), int(yval), ha='center', va='bottom', fontweight='bold')
        plt.title('Total Job Postings by Source', fontsize=16)
        plt.savefig(os.path.join(OVERALL_OUTPUT_DIR, 'overall_source_comparison.png'))
        plt.close()
        print(f"✅ Saved: overall_source_comparison.png")

    # PLOT 2: Top Companies
    if 'Company' in master_df.columns:
        clean_companies = master_df['Company'].astype(str).str.title()
        top_companies = clean_companies.value_counts().head(20)
        plt.figure(figsize=(12, 8))
        top_companies.sort_values().plot(kind='barh', color='#e67e22')
        plt.title('Top 20 Companies (All Sources)', fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(OVERALL_OUTPUT_DIR, 'overall_top_companies.png'))
        plt.close()
        print(f"✅ Saved: overall_top_companies.png")

    # PLOT 3: Top Cities
    if 'City' in master_df.columns:
        clean_cities = master_df[~master_df['City'].isin(['Multiple/See Desc', 'Unknown', 'Remote', '', 'nan', 'Nan'])]
        top_cities = clean_cities['City'].value_counts().head(20)
        plt.figure(figsize=(12, 8))
        top_cities.sort_values().plot(kind='barh', color='#16a085')
        plt.title('Top 20 Cities (All Sources)', fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(OVERALL_OUTPUT_DIR, 'overall_top_cities.png'))
        plt.close()
        print(f"✅ Saved: overall_top_cities.png")

    # PLOT 4: Top Titles
    if 'Job Title' in master_df.columns:
        top_titles = master_df['Job Title'].value_counts().head(20)
        plt.figure(figsize=(12, 8))
        top_titles.sort_values().plot(kind='barh', color='#8e44ad')
        plt.title('Top 20 Job Titles (All Sources)', fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(OVERALL_OUTPUT_DIR, 'overall_top_titles.png'))
        plt.close()
        print(f"✅ Saved: overall_top_titles.png")

if __name__ == "__main__":
    analyze_job_data('hackernews')
    analyze_job_data('adzuna')
    analyze_job_data('arbeitnow')
    generate_overall_analysis()