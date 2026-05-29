# PulseReview: IT Performance Governance & Strategic Alignment

PulseReview is a high-fidelity performance management portal designed to align individual contributions with strategic corporate objectives. Inspired by IT industry standards (OKR, Sprint Themes, SAP Performance Models), it provides a rigorous hierarchical workflow for goal setting and validation.

---

## 🚀 Core Philosophy
Unlike traditional binary reviews (Yes/No), PulseReview operates on a **Parent-Child Governance Model**:
1.  **Manager defines the "WHAT"** (Strategic Themes / Parent Goals).
2.  **Employee delivers the "HOW"** (Subthemes / Execution Updates).
3.  **Governance ensures "ALIGNMENT"** (Audit-ready Validation Loop).

---

## 👔 Subject Matter Expert (SME) & Functional Logic

### 1. Continuous Performance Management (CPM)
PulseReview implements a **Monthly Pulse Cycle**. This replaces stale annual reviews with real-time performance tracking.

### 2. The Binary Outcome Engine
- **Input**: Managers provide 4 binary (Yes/No) inputs per month across core pillars.
- **Decision Rule**: An employee receives an overall "YES" for the month if they achieve **at least 2 positive inputs** (>= 50% success rate).
- **Roll-up**: These monthly results aggregate into Quarterly and Annual views for final performance calibration.

### 3. Theme-Subtheme Mapping
- **Hierarchy**: No work is performed in a vacuum. Every "Subtheme" (Employee task) must be mapped to a "Parent Theme" (Managerial/Strategic goal).
- **Audit Trail**: Once a manager approves a subtheme, it is cryptographically linked to that month's review cycle and locked for editing.

---

## 🛠️ End-to-End Technical Architecture

### Tech Stack
-   **Frontend**: React 19 (Vite) - Optimized for high-frequency state updates.
-   **Backend**: Supabase (PostgreSQL) - Leveraging **Row Level Security (RLS)** to enforce organizational hierarchy at the database layer.
-   **Integration**: SAP Connect logic is embedded for automated employee data synchronization.
-   **Styling**: Custom CSS Design System with Glassmorphism and responsive layouts.

### Security & Governance
- **RLS Enforcement**: Managers can *only* see data for their direct reports (based on the `manager_id` recursive tree).
- **Audit Locking**: Database triggers prevent modification of "APPROVED" records.
- **File Integrity**: Evidence attachments are stored in secured Supabase Buckets with expiring signed URLs.

---

## 🔑 Role-Based Access Control (RBAC)

### 👨💼 Manager Portal
-   **Authority Console**: Create and delegate Strategic Themes to direct reports.
-   **Validation Engine**: Review employee subthemes with "Approve", "Reject", or "Return for Revision" actions.
-   **Monthly Input**: Record the 4 core binary performance metrics for each team member.
-   **Team Analytics**: Real-time YES rate and submission tracking.

### 👨💻 Employee Portal
-   **Dashboard**: View active strategic directives assigned by the manager.
-   **Execution Updates**: Add detailed Subthemes (Achievements, Blockers, Learning) under assigned goals.
-   **Reflections**: Track validation status in real-time.

### 🏢 HR Dashboard
-   **Global Oversight**: Monitor validation progress across the entire organization.
-   **Organization Stats**: Departmental contribution density and historical trends.
-   **Reporting**: Export monthly performance outcomes for audit.

---

## 🔄 End-to-End Workflow Example

### Phase 1: Strategic Direction (Manager)
-   *Manager* logs in and creates a Theme: **"Architecture Modernization"**.
-   *Manager* assigns this theme to **Supun** (Tech Lead).

### Phase 2: Execution Update (Employee)
-   *Supun* logs in and sees **"Architecture Modernization"** assigned to him.
-   *Supun* clicks "+ Add Subtheme" and records:
    - **Title**: "Implemented API Caching Layer"
    - **Evidence**: "Reduced latency by 45% using Redis implementation."
-   *Supun* clicks "Submit Monthly Subtheme".

### Phase 3: Validation (Manager)
-   *Manager* sees a "Pending Review" notification for Supun.
-   *Manager* reviews the entry and clicks **"Approve"**.
-   The entry is now locked and recorded in the monthly report.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Database Schema
The database requires the following core tables:
- `profiles`: User roles and management hierarchy (Enhanced with SAP fields).
- `global_themes`: Hierarchical goals (Parents).
- `global_subthemes`: Execution updates (Children).
- `employee_subtheme_alignment`: Mapping table for governance.
- `monthly_reviews`: Binary outcome tracking.

---

## 🐳 Docker Deployment Guide

The application is containerized using a **multi-stage build** for optimal production performance.

### 1. Build & Run
```bash
# Build the image
docker build -t cpmtool-main .

# Run the container (Localhost Port 3000)
docker run -d -p 3000:80 --name cpm-portal cpmtool-main
```

### 2. Nginx Configuration
The container uses Nginx to serve the static build. The configuration includes a fallback to `index.html` to support React Router's SPA functionality.

---

## 📜 Business Rules
- **Rule 1: Mandatory Mapping**: No subtheme can be created without a parent Strategic Theme.
- **Rule 2: Audit Integrity**: Once a Manager approves an entry, it is locked for the current cycle.
- **Rule 3: Hierarchy Enforcement**: Only a designated Manager can validate their direct reports' data.

---

## 👔 Project Architecture
```text
src/
├── App.jsx        # Core Logic & Portal Routing
├── index.html     # Entry Point
├── index.css      # Design System & UI Components
└── assets/        # Visual Identity Assets
```

---
*Developed as a high-fidelity IT industry standard performance portal.*