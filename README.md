# 📰 News Pulse

> **An AI-powered News Intelligence Platform that automatically scrapes, clusters, and visualizes breaking news into evolving story timelines.**

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-AWS%20RDS-blue)
![AWS](https://img.shields.io/badge/Hosted%20on-AWS-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🚀 Overview

News Pulse is a full-stack news intelligence platform that continuously collects news articles, groups related stories using clustering algorithms, and presents them as interactive timelines.

Instead of reading hundreds of individual articles, users can explore how major news stories emerge, evolve, and conclude through a clean visual dashboard.

The project was designed to demonstrate end-to-end software engineering skills—from backend API development and database design to cloud deployment on AWS.

---

## ✨ Features

- 📰 Automatic news ingestion pipeline
- 🤖 AI-powered news clustering
- 📈 Interactive timeline visualization
- 🔍 Trending topic ranking
- 📊 Cluster analytics dashboard
- ⚡ RESTful backend API
- 🗄️ PostgreSQL database hosted on AWS RDS
- ☁️ Production deployment using AWS EC2 + Nginx + PM2
- 📱 Responsive dark-themed UI built with Next.js

---

## Tech Stack

* **Frontend**: Next.js 14+ (App Router), React, TypeScript, TailwindCSS, Recharts, Axios.
* **Backend**: Node.js, Express, dotenv, cors, pg (PostgreSQL driver), nodemon.
* **Scraper**: Python 3.11+, feedparser, requests, trafilatura, python-dateutil, scikit-learn, psycopg2-binary.
* **Database**: PostgreSQL (e.g. Supabase, Neon, or local database).

---

## Folder Structure

```text
news-pulse/
├── .github/workflows/           # GitHub Actions workflows
│   └── ingest-cron.yml          # Scheduled ingestion trigger
├── .vscode/                     # VS Code workspace settings
│   ├── settings.json
│   └── extensions.json
├── backend/                     # Node/Express API
│   ├── src/
│   │   ├── db/                  # DB connection and queries
│   │   │   ├── pool.js
│   │   │   ├── queries.js
│   │   │   └── schema.sql       # Database DDL schema
│   │   ├── jobs/                # Background job states
│   │   │   └── jobStore.js
│   │   ├── middleware/          # Express middlewares
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── routes/              # API endpoints
│   │   │   ├── clusters.js
│   │   │   ├── ingest.js
│   │   │   └── timeline.js
│   │   └── server.js            # Express server entrypoint
│   ├── scripts/
│   │   └── init-db.js           # Database initialization script
│   ├── .env.example
│   ├── package.json
│   ├── .eslintrc.json
│   └── .prettierrc
├── frontend/                    # Next.js Application
│   ├── app/                     # App router pages
│   │   └── page.tsx
│   ├── components/              # Interactive UI components
│   │   ├── Timeline.tsx
│   │   ├── ClusterDetail.tsx
│   │   ├── SourceFilter.tsx
│   │   └── RefreshButton.tsx
│   ├── lib/
│   │   └── api.ts               # Axios-based fetch wrappers
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── postcss.config.js
├── scraper/                     # Python ingestion & clustering
│   ├── main.py                  # Scraper execution pipeline entrypoint
│   ├── feeds.py                 # RSS fetching and parsing
│   ├── normalize.py             # RSS field normalization
│   ├── extract.py               # Article body web extractor
│   ├── dedupe.py                # Duplicate detection helper
│   ├── cluster.py               # Tokenization and clustering algorithms
│   ├── db.py                    # DB queries & commits
│   ├── config.py                # Environment configurations
│   ├── requirements.txt
│   └── tests/                   # Folder for scraper unit tests
├── .gitignore
├── .env.example
├── PROJECT_STATUS.md            # High level checklist status tracker
└── README.md
```

---

## Setup Instructions

### Prerequisites
* Node.js (v20+)
* npm or yarn
* Python (3.11+)
* PostgreSQL instance

### 1. Database Setup
1. Create a PostgreSQL database.
2. In the `backend` directory, create a `.env` file from `.env.example` and set `DATABASE_URL`.
3. Run the initialization script to create tables:
   ```bash
   cd backend
   npm run db:init
   ```

### 2. Backend Setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start in development:
   ```bash
   npm run dev
   ```

### 3. Scraper Setup
1. Create a Python virtual environment:
   ```bash
   cd scraper
   python -m venv .venv
   ```
2. Activate the virtual environment:
   - Windows: `.venv\Scripts\activate`
   - macOS/Linux: `source .venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start in development:
   ```bash
   npm run dev
   ```

---

## Running the Components

### Backend
Start the Express server on configured `PORT` (defaults to 4000):
```bash
cd backend
npm run dev
```

### Python Scraper
Run scraper from CLI manually:
* Full run:
  ```bash
  cd scraper
  python main.py --mode=full
  ```
* Incremental run:
  ```bash
  cd scraper
  python main.py --mode=incremental
  ```

### Frontend
Start Next.js dev server:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the timeline.
