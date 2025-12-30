Employeah 🔍

**Employeah** is a web application that helps users navigate the complex job market. It aggregates job postings, extracts key skills using an LLM, and visualizes trends to answer three key questions:
1. *Which skills should I learn for a specific job?*
2. *Which skills are becoming more or less relevant over time?*
2. *Which job matches my current skills best?*

## 🏗️ Project Architecture

The project is divided into three main distinct applications:

1. **`client/`**: The Frontend. Built with **React**.
2. **`server/`**: The "online" Backend. Built with **Node.js and Prisma**.
3. **`data-pipeline/`**: The "offline" Backend: the Scraper & Processor. Built with **Python**.


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
