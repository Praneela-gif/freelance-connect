# Freelancing Platform (2-Service Architecture + Kafka & Docker)

A modernized, high-performance freelancing application streamlined from 9 microservices down to **2 core, cohesive microservices** with **Apache Kafka** event streaming and **Docker Compose** containerization.

---

## 🏛️ Architecture Overview

The system is organized into **2 specialized domain services** and a modern **React frontend**:

```
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
|  - - MySQL Database    |             |  - - MySQL Database    |
+-----------+-----------+             +-----------+-----------+
            |                                     |
            +------------------+------------------+
                               |
                               v
                     +-------------------+
                     |   Apache Kafka    |
                     |    (Port 9092)    |
                     |  - user-events    |
                     |  - project-events |
                     +-------------------+
```

### 1. `user-service` (Port 8081)
- **Authentication**: Secure BCrypt passwords, JWT issuance (`/api/auth/register`, `/api/auth/login`).
- **User Management**: Client, Freelancer, Admin, and Assistant accounts (`/api/users`).
- **Profiles**: Client company data, Freelancer skills, experience, and portfolio links (`/api/users/profile`).
- **Administrative Delegation**: Assign dynamic assistant permissions (`MANAGE_USERS`, `REMOVE_PROJECTS`) with optional expiration timers (`/api/admin/delegate`).
- **Kafka Integration**: Emits events to `user-events` on user registrations and account status updates.

### 2. `project-service` (Port 8082)
- **Projects**: Create, browse, search, and moderate jobs (`/api/projects`).
- **Proposals & Bids**: Freelancers apply with bid amounts and proposals (`/api/applications`).
- **Contract Hiring**: Clients accept proposals and hire freelancers directly into `IN_PROGRESS` contracts.
- **Milestone Deliverables**: Freelancers submit project deliverables, clients review (Approve / Request Changes / Reject), and mark projects as `COMPLETED`.
- **Kafka Integration**: Emits events to `project-events` on project creation, bids, hiring, deliverable submissions, and completions.

---

## 🚀 Quick Start with Docker Compose

To launch the entire platform (Kafka, user-service, project-service, and frontend) with a single command:

```bash
docker compose up --build
```
- **Frontend Application**: http://localhost:5173
- **User Service API**: http://localhost:8081
- **Project Service API**: http://localhost:8082
- **Apache Kafka Broker**: localhost:9092
- **MySQL Database**:
  - Host (Windows): localhost
  - JDBC URL (Docker): jdbc:mysql://host.docker.internal:3306/freelancing
  - Username: root
  - Password: root

---

## 💻 Running Locally (Development Mode)

### 1. Start `user-service`
```bash
cd MicroserviceFreelancing/user-service
mvn spring-boot:run
```
*(Runs on port 8081)*

### 2. Start `project-service`
```bash
cd MicroserviceFreelancing/project-service
mvn spring-boot:run
```
*(Runs on port 8082)*

### 3. Start React Frontend
```bash
cd ReactFreelancing
npm install
npm run dev
```
*(Runs on [http://localhost:5173](http://localhost:5173))*

---

## 👥 Pre-Seeded Demo Accounts

Both backend services include automatic database initializers with demo credentials ready to test out of the box:

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@platform.com` | `admin123` | Full administrative control, user moderation, privilege delegation |
| **Client** | `client@techcorp.com` | `client123` | TechCorp Global - posts jobs, reviews bids, hires freelancers |
| **Freelancer** | `freelancer@dev.com` | `free123` | Alex Rivera - applies for jobs, submits deliverables |
| **Assistant** | `assistant@platform.com` | `assist123` | Morgan Assistant - pre-authorized with `MANAGE_USERS` & `REMOVE_PROJECTS` |

---

## 📡 Kafka Event Topics

- **`user-events`**:
  - `USER_REGISTERED`
  - `USER_BLOCKED`
  - `USER_UNBLOCKED`
- **`project-events`**:
  - `PROJECT_CREATED`
  - `BID_SUBMITTED`
  - `FREELANCER_HIRED`
  - `DELIVERABLE_SUBMITTED`
  - `DELIVERABLE_REVIEWED`
  - `PROJECT_COMPLETED`
  - `PROJECT_DELETED`
