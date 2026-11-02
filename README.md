# Freelancing Platform Microservices (PostgreSQL + React + Docker + Render Ready)

A modernized, high-performance freelance marketplace platform built with **Spring Boot 3**, **PostgreSQL**, **React (Vite)**, and **Docker Compose**. Fully configured for **1-Click Blueprint Deployment on Render**.

---

## ??? Architecture Overview

The platform consists of **2 domain microservices**, a **PostgreSQL database**, and a responsive **React frontend**:

`
+-------------------------------------------------------------+
|                      React Frontend                         |
|           (Port 5173 / Production Nginx Port 80)            |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|     user-service      |             |    project-service    |
|      (Port 8081)      |             |      (Port 8082)      |
|  - JWT Authentication |             |  - Job Postings       |
|  - User Profiles      |             |  - Proposals / Bids   |
|  - Admin Delegation   |             |  - Work Deliverables  |
+-----------+-----------+             +-----------+-----------+
            |                                     |
            +------------------+------------------+
                               |
                               v
                     +-------------------+
                     |    PostgreSQL     |
                     |    (Port 5432)    |
                     |   reelancedb   |
                     +-------------------+
`

### 1. user-service (Port 8081)
- **Role-Based Auth & JWT**: Client, Freelancer, Admin, and Assistant.
- **Profile Management**: Bio, skills, experience, and portfolio links.
- **Admin Delegation**: Time-bound administrative privilege delegation (MANAGE_USERS, REMOVE_PROJECTS).
- **Health Check**: GET /api/auth/health

### 2. project-service (Port 8082)
- **Project Marketplace**: Post, edit, complete, delete, and search projects.
- **Proposal / Bid Submissions**: Freelancers apply with custom bids.
- **Milestone & Delivery Workflow**: Deliverable submissions and approval/revision reviews.
- **Health Check**: GET /api/projects/health

### 3. ReactFrontend (Port 5173)
- Modern SPA built with React + Vite.
- Role-based responsive navigation, modals, and proposal submission.
- Production-ready Nginx reverse proxy.

---

## ?? 1-Click Deployment on Render

This repository includes a pre-configured ender.yaml Blueprint file for automatic zero-configuration deployment:

1. Push this repository to GitHub:
   `ash
   git add .
   git commit -m "Configure PostgreSQL and Render deployment"
   git push origin main
   `
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Select your GitHub repository (reelance-connect).
5. Render will automatically detect ender.yaml and provision:
   - **reelance-db**: Managed PostgreSQL Database.
   - **reelance-user-service**: Spring Boot Web Service (Docker).
   - **reelance-project-service**: Spring Boot Web Service (Docker).
   - **reelance-frontend**: Static Site with automatic routing.
6. Click **Apply** to deploy the entire stack!

---

## ?? Local Execution with Docker Compose

To run the complete system locally:

`ash
docker compose down
docker compose up -d --build
`

### Verify Running Services:
`ash
docker ps
`

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **User Service Health**: [http://localhost:8081/api/auth/health](http://localhost:8081/api/auth/health)
- **Project Service Health**: [http://localhost:8082/api/projects/health](http://localhost:8082/api/projects/health)
- **PostgreSQL Database**: Port 5432 (reelancedb, user: postgres, password: password)

---

## ?? Default Test Accounts (Pre-Seeded)

| Role | Email | Password |
|---|---|---|
| **Admin** | dmin@platform.com | dmin123 |
| **Client** | client@techcorp.com | client123 |
| **Freelancer** | reelancer@dev.com | ree123 |
| **Assistant** | ssistant@platform.com | ssist123 |