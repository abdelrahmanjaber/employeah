Employeah 🔍

**Employeah** is a web application that helps users navigate the complex job market. It aggregates job postings, extracts key skills using an LLM, and visualizes trends to answer three key questions:
1. *Which skills should I learn for a specific job?*
2. *Which skills are becoming more or less relevant over time?*
2. *Which job matches my current skills best?*

## 🏗️ Project Architecture

The project is divided into three main distinct applications:

1. **`client/`**: The Frontend. Built with **React**.
2. **`server/`**: The REST API. Built with **Node.js and Prisma**.
3. **`data-pipeline/`**: The Scraper & Processor. Built with **Python**.