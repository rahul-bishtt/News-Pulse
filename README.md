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

## 🛠️ Tech Stack

### Frontend
- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Axios**
- **Recharts**

### Backend
- **Node.js**
- **Express.js**
- **Python** (News scraping pipeline)

### Database
- **PostgreSQL**
- **AWS RDS**

### Cloud & DevOps
- **AWS EC2**
- **Nginx**
- **PM2**
- **Git & GitHub**

### Development Tools
- VS Code
- Postman
- pgAdmin

---

## 📂 Project Structure

```text
News-Pulse/
│
├── backend/          # Express REST API
├── frontend/         # Next.js frontend
├── scraper/          # Python scraping pipeline
├── .github/          # GitHub workflows
├── README.md
├── roadmap.md
├── News_Pulse_PRD.md
└── News_Pulse_TRD.md
```

                                   👤 User
                            │
                            ▼
                  ┌──────────────────┐
                  │   Web Browser    │
                  └──────────────────┘
                            │
                     HTTP (Port 80)
                            │
                            ▼
                  ┌──────────────────┐
                  │      Nginx       │
                  │ Reverse Proxy    │
                  └──────────────────┘
                     │           │
                     │           │
          serves UI  │           │ routes API
                     ▼           ▼
        ┌─────────────────┐   ┌─────────────────┐
        │   Next.js 16    │   │ Express Backend │
        │    Frontend     │   │    Port 4000    │
        └─────────────────┘   └─────────────────┘
                                      │
                         PostgreSQL Queries
                                      │
                                      ▼
                           ┌──────────────────┐
                           │ AWS RDS          │
                           │ PostgreSQL       │
                           └──────────────────┘
                                      ▲
                                      │
                           Stores clustered news
                                      │
                           ┌──────────────────┐
                           │ Python Scraper   │
                           │ RSS + Processing │
                           └──────────────────┘

---

### News Pulse – AWS Deployment Architecture

                                        🌍 Internet
                                             │
                                             ▼
                                     👤 User Browser
                                             │
                                      HTTP / HTTPS
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │        AWS EC2           │
                               │   Ubuntu 24.04 Server    │
                               └──────────────────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │          Nginx           │
                               │ Reverse Proxy (Port 80)  │
                               └──────────────────────────┘
                                   │                 │
                                   │                 │
                    Serves Frontend│                 │Routes API
                                   ▼                 ▼
                     ┌────────────────────┐   ┌────────────────────┐
                     │   Next.js 16       │   │ Express.js Backend │
                     │ Frontend (3000)    │   │     Port 4000      │
                     └────────────────────┘   └────────────────────┘
                                                      │
                                                      │ PostgreSQL Queries
                                                      ▼
                               ┌────────────────────────────────────────┐
                               │ AWS RDS PostgreSQL                     │
                               │ news_pulse Database                    │
                               └────────────────────────────────────────┘
                                                      ▲
                                                      │
                                                      │ Stores Processed News
                                                      │
                               ┌────────────────────────────────────────┐
                               │ Python Scraper                         │
                               │ RSS Collection + Clustering Pipeline   │
                               └────────────────────────────────────────┘


             PM2 manages:
             • news-pulse-frontend
             • news-pulse-backend

🌐 Internet
👤 User
☁️ EC2
🌐 Nginx
⚛️ Next.js
🚀 Express.js
🗄️ PostgreSQL (RDS)
🐍 Python

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

## 📸 Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Timeline

![Timeline](docs/screenshots/timeline.png)

### Cluster Details

![Cluster Details](docs/screenshots/cluster-details.png)

### AWS Deployment

![AWS Deployment](docs/screenshots/aws-deployment.png)

### PM2

![PM2](docs/screenshots/pm2.png)

### API Health

![API Health](docs/screenshots/api-health.png)

---
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

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| GET | `/timeline` | Timeline visualization data |
| GET | `/clusters` | List all news clusters |
| GET | `/clusters/:id` | Cluster details |
| POST | `/ingest/trigger` | Start scraping job |
| GET | `/ingest/status/:jobId` | Scraping job status |

---

## 📚 Challenges & Learnings

During deployment, I encountered and resolved several production issues, including:

- PostgreSQL SSL connection configuration with AWS RDS
- PM2 process management and environment variables
- Nginx reverse proxy configuration
- Next.js production build issues
- API base URL configuration
- AWS Security Group networking
- Database restoration using pg_dump and pg_restore

These challenges helped me gain practical experience in deploying and debugging full-stack applications in a cloud environment.

---

## 🚀 Future Improvements

- User authentication
- Real-time updates using WebSockets
- AI-generated news summaries
- Sentiment analysis
- Advanced search and filtering
- Dockerized deployment
- CI/CD with GitHub Actions
- HTTPS with Let's Encrypt
