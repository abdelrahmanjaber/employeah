Employeah 🔍

**Employeah** is a web application that helps users navigate the complex job market. It aggregates job postings, extracts key skills using an LLM, and visualizes trends to answer three key questions:
1. *Which skills should I learn for a specific job?*
2. *Which skills are becoming more or less relevant over time?*
2. *Which job matches my current skills best?*

## 🏗️ Project Architecture

The project is divided into three main distinct applications:

### 🎨 1. Frontend Structure (`frontend/`)

The frontend is built with **React** and utilizes a straightforward directory structure to separate views, logic, and UI components.

* **`src/pages/`**: Contains the main application views (routes).
  * **`HomePage.jsx`**: The landing page featuring the dashboard and main navigation.
  * **`SearchByJob.jsx`** *(Dream Job)*: Allows users to enter a job title (e.g., "Data Scientist") to discover required skills.
  * **`SearchBySkills.jsx`** *(Reverse Search)*: Users enter their current skills to find matching job roles.
  * **`HistoricalStats.jsx`** *(Trend Analysis)*: Visualization of skill demand over specific timeframes (e.g., "Is Python growing?").
  * **`FieldAnalysis.jsx`**: A detailed view for analyzing specific job sectors.

* **`src/lib/`**: Handles data fetching and business logic.
  * **`apiClient.js`**: The connection to the real Node.js backend.
  * **`mockApi.js` & `mock_database.js`**: A simulation layer used for development and testing without the full backend running.

* **`src/components/`**: Reusable UI elements, such as the `Sidebar.jsx` navigation.

* **Configuration**: The folder also includes `Dockerfile` (dev/prod) and `nginx.conf` for containerized deployment.

### 📡 2. Backend Structure (`backend/`)

The server-side application built with Python. It acts as the bridge between the database and the frontend.

* **`app/`**: Contains the core logic.
  * **`api/`**: Defines the API endpoints (routes) that the Frontend connects to to fetch data.
  * **`models.py`**: Defines the structure of the database tables (e.g., what a "Job" or "Skill" looks like).
  * **`db.py`**: Manages the connection to the database.

* **`alembic/`**: A tool used to handle database migrations (tracking changes to the database structure over time).

* **`main.py`**: The entry point that launches the server.

### ⚙️ 3. Data Pipeline (`data-pipeline/`)

The Python engine responsible for data collection and processing.

* **`scrapers/`**: Handles data collection.
  * **`scrape_jobs/`**: Scrapes external job boards for current vacancies.
  * **`scrape_tum_courses/`**: A scraper (API) that fetches course titles and URLS from TUM Online from winter 2025 and summer 2026.

* **`extract_tum_skills/`**: The processing layer.
  * **`tum_skills.ipynb`**: Uses an **LLM** to analyze course descriptions and extract standardized skill tags.

* **`data/`**: Local storage for the raw datasets.
  * **`tum_data/`**: Stores raw course catalogs.
  * **`job_data/`**: Stores scraped job advertisements.

* **`scheduler.py`**: Automates the pipeline execution.


<!-- Clean workflow commands (memorize these)
Dev
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml down

Prod
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml down

Cleanup
docker compose -f docker-compose.dev.yml down --rmi local
docker compose -f docker-compose.prod.yml down --rmi local -->
