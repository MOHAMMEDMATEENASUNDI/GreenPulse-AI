# 🌿 GreenPulse AI

### Intelligent Carbon & ESG Intelligence Platform

> **Turn enterprise sustainability data into measurable carbon intelligence, energy insights, ESG visibility, and actionable decisions.**

GreenPulse AI is a full-stack sustainability intelligence platform designed to help enterprises **measure carbon emissions, understand energy consumption, monitor waste, evaluate ESG/BRSR disclosure readiness, detect operational anomalies, and receive AI-assisted recommendations** from a single system.

Instead of treating sustainability as a static reporting exercise, GreenPulse AI connects **data → intelligence → action → compliance**.

---

## ✨ Why GreenPulse AI?

Enterprises often have sustainability data scattered across spreadsheets, energy records, waste logs, and compliance documents.

GreenPulse brings these together into one intelligent workflow:

```text
Enterprise Data
      ↓
CSV / Excel Upload
      ↓
Validation & Normalization
      ↓
┌──────────────┬──────────────┬──────────────┐
│ Carbon       │ Energy       │ Waste        │
│ Intelligence │ Intelligence │ Intelligence │
└──────────────┴──────────────┴──────────────┘
      ↓
ESG / BRSR Compliance Engine
      ↓
AI Recommendations
      ↓
Green Score + Audit Reports
      ↓
Actionable Sustainability Decisions
```

---

# 🚀 Core Features

## 🌍 Carbon Intelligence

Track enterprise carbon emissions using real operational activity data.

* Department-level carbon breakdown
* Scope 1 fuel-based calculations
* Scope 2 electricity-based calculations
* Supported Scope 3 upstream energy/fuel activity
* Historical carbon trends
* India-specific electricity emission factor support
* Transparent calculation provenance

GreenPulse follows a deterministic calculation approach so the AI does **not invent compliance numbers**.

---

## ⚡ Energy Intelligence

Understand where energy is being consumed and identify unusual usage.

* Department-wise electricity usage
* Historical energy trends
* Statistical anomaly detection
* Baseline comparison
* Severity-based anomaly classification
* Actionable recommendations for unusual consumption

Example:

> **Paint Shop electricity usage increased significantly compared with its recent pattern.**

GreenPulse can then generate an actionable recommendation explaining what to investigate.

---

## 🗑️ Waste Intelligence

Transform raw waste records into structured sustainability insights.

* Waste stream classification
* Recyclable / hazardous / organic categorization
* Department-level waste tracking
* Waste quantity analysis
* Invalid/unknown waste detection
* Historical waste monitoring

Supported waste taxonomy includes materials such as:

`Plastic · Paper · Aluminium · Steel · Rubber · Used Oil · Chemical Bottles · Food Waste`

---

## 📊 Green Score

GreenPulse converts sustainability performance into a single understandable score.

```text
Green Score
    │
    ├── Carbon Performance
    ├── Energy Efficiency
    ├── Waste Management
    └── Compliance Completeness
```

Current weighted model:

```text
Green Score =
0.35 × Carbon Performance
+ 0.25 × Energy Efficiency
+ 0.20 × Waste Management
+ 0.20 × Compliance Completeness
```

The engine uses historical operational data and does not rely on fabricated sustainability targets.

---

# 📋 ESG & BRSR Compliance Intelligence

GreenPulse includes a **9-principle ESG/BRSR compliance layer**.

The compliance engine evaluates whether the available company information provides sufficient evidence for relevant disclosures.

### The 9 Principles

| Principle | Area                                     |
| --------- | ---------------------------------------- |
| 1         | Ethics, Transparency & Accountability    |
| 2         | Safe & Sustainable Goods and Services    |
| 3         | Employee Wellbeing                       |
| 4         | Stakeholder Interests                    |
| 5         | Human Rights                             |
| 6         | Environment Protection & Restoration     |
| 7         | Responsible Public Policy Advocacy       |
| 8         | Inclusive Growth & Equitable Development |
| 9         | Engaging & Providing Value to Consumers  |

GreenPulse distinguishes between:

**Operational evidence**

```text
Electricity
Fuel
Waste
Carbon
Energy activity
```

and

**Disclosure evidence**

```text
Policies
Supporting records
Sustainability disclosures
Relevant documentation
```

This means a company can have accurate carbon data while still having an ESG disclosure gap — because **measurement and compliance evidence are not the same thing**.

---

# 🛡️ Penalty Shield

Penalty Shield is the evidence-oriented compliance review layer.

When GreenPulse finds a missing disclosure requirement, it does not silently mark the company compliant.

Instead:

```text
Requirement
    ↓
Evidence Check
    ↓
Evidence Available?
   ↙        ↘
 YES        NO
 ↓           ↓
Complete   Needs Review
             ↓
        Penalty Shield
             ↓
       Add Evidence
             ↓
       Re-evaluate
             ↓
      Updated Compliance
```

This creates a transparent audit workflow rather than a black-box compliance score.

---

# 🤖 AI Recommendation Engine

GreenPulse uses **Google Gemini** as an AI-assisted recommendation layer.

The architecture follows a hybrid model:

```text
Deterministic Data
       ↓
Rules / Calculations
       ↓
Operational Insight
       ↓
Gemini
       ↓
Human-Friendly Recommendation
```

Gemini is used to help explain and prioritize actions.

### Example

**We found**

> Electricity use in a department is substantially higher than its recent pattern.

**What to do**

> Check which machines were running longer than needed and reduce unnecessary idle runtime.

**Why it matters**

> Lower electricity usage can reduce both operating cost and carbon emissions.

Recommendations can then move through a human approval workflow.

---

# 📥 Smart CSV / Excel Ingestion

GreenPulse is designed around a **CSV/Excel-first onboarding model**.

Users can upload operational data without installing IoT hardware or creating a large integration project.

### Supported template fields

```text
Department Name
Period
Electricity Used (kWh)
Fuel Type
Fuel Consumption
Fuel Unit
Waste Item
Waste Produced (kg)
Waste Category
```

The ingestion pipeline supports:

* Flexible header recognition
* Normalized department names
* Automatic department creation
* Waste taxonomy validation
* Fuel validation
* Duplicate upload protection
* All-or-nothing validation
* SHA-256 based idempotency
* Structured backend persistence

GreenPulse calculates carbon metrics from activity data rather than accepting user-supplied carbon totals as the authoritative value.

---

# 📑 Audit-Ready Reports

GreenPulse can generate structured sustainability and compliance reports from the current backend state.

Supported report categories include:

* SEBI BRSR
* GRI Standards
* Scope 1 & Scope 2 GHG
* ESG summaries
* Energy transition reporting

Reports include:

* Green Score
* ESG principle status
* Carbon metrics
* Energy metrics
* Waste metrics
* Disclosure gap information
* Evidence/provenance information

Generated reports use immutable snapshots so previously generated reports are not silently rewritten when company data changes.

---

# 🔐 Security & Trust

GreenPulse is built around the principle:

> **Deterministic numbers. Explainable intelligence. Traceable actions.**

Security and reliability features include:

* JWT authentication
* Secure HTTP-only cookies
* Role-based access control
* bcrypt password hashing
* Helmet security headers
* CORS protection
* Rate limiting
* MongoDB sanitization
* Audit logging
* Centralized error handling
* Private report storage
* Signed report download URLs
* Company-scoped access control

Every important mutation can be audit logged for traceability.

---

# 🧠 AI Architecture

GreenPulse intentionally uses a **hybrid AI architecture** instead of treating an LLM as the source of truth.

```text
                    ┌────────────────────┐
                    │  Enterprise Data   │
                    └─────────┬──────────┘
                              ↓
                  ┌──────────────────────┐
                  │ Validation / Parsing │
                  └──────────┬───────────┘
                             ↓
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
   Carbon Engine       Energy Engine        Waste Engine
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ↓
                   ESG / Green Score
                             ↓
                 ┌──────────────────────┐
                 │  Gemini AI Layer     │
                 │ Recommendations      │
                 └──────────┬───────────┘
                            ↓
                    Human Approval
                            ↓
                     Action / Report
```

**Important:** Gemini does not generate compliance-grade numerical calculations. Those remain deterministic in the backend.

---

# 🏗️ Technology Stack

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Framer Motion
* Recharts
* Chart.js

The interface follows a premium enterprise dashboard approach with responsive visualizations, motion, progressive disclosure, and performance safeguards.

## Backend

* Node.js
* Express.js
* Zod
* Mongoose
* JWT
* bcrypt
* Pino
* Firebase Admin SDK

The backend follows a modular-monolith architecture with isolated domain services for carbon, ESG, Green Score, recommendations, reports, authentication, energy, and waste.

## Data & Infrastructure

* MongoDB / MongoDB Atlas
* Firebase Firestore
* Firebase Storage
* Google Gemini API
* CSV / XLSX ingestion
* Vercel / compatible frontend deployment
* Node/Express API deployment

---

# 🗂️ High-Level Project Structure

```text
greenpulse-ai/
│
├── src/
│   ├── app/
│   ├── features/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── carbon/
│   │   ├── energy/
│   │   ├── esg-compliance/
│   │   ├── waste/
│   │   ├── recommendations/
│   │   └── reports/
│   │
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── state/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── carbon/
│   │   │   ├── companies/
│   │   │   ├── departments/
│   │   │   ├── energy/
│   │   │   ├── esg/
│   │   │   ├── greenscore/
│   │   │   ├── recommendations/
│   │   │   ├── reports/
│   │   │   └── waste/
│   │   └── jobs/
│   │
│   └── tests/
│
├── public/
├── docs/
├── package.json
└── README.md
```

---

# 🔄 End-to-End Workflow

```text
                   GREENPULSE AI
                        │
                        ▼
              Upload CSV / Excel
                        │
                        ▼
             Validate + Normalize
                        │
                        ▼
      ┌─────────────────────────────────┐
      │        Intelligence Layer       │
      │                                 │
      │ Carbon │ Energy │ Waste │ ESG   │
      └─────────────────────────────────┘
                        │
                        ▼
                Green Score Engine
                        │
                        ▼
                Anomaly Detection
                        │
                        ▼
                Gemini Recommendations
                        │
                        ▼
                 Human Approval
                        │
                        ▼
               Penalty Shield Review
                        │
                        ▼
                 Audit Reporting
                        │
                        ▼
             Sustainability Decisions
```

---

# ⚙️ Local Development

## 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd greenpulse-ai
```

## 2. Install frontend dependencies

```bash
npm install
```

## 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

## 4. Configure environment variables

Create the required environment files based on the provided `.env.example` files.

Typical backend configuration includes:

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

**Never commit `.env` files or credentials.**

---

# ▶️ Run the Application

### Frontend

```bash
npm run dev
```

### Backend

```bash
cd backend
npm run dev
```

Typical local development URLs:

```text
Frontend → http://localhost:5173
Backend  → http://localhost:5001/api/v1
```

---

# 🧪 Verification

GreenPulse was developed with lightweight, phase-based verification to protect data integrity while keeping development resource-efficient.

Verification covers areas such as:

* Authentication
* Upload validation
* Carbon calculations
* Fuel calculations
* Waste classification
* ESG scoring
* Energy anomalies
* Gemini recommendations
* Report generation
* Security controls
* Frontend TypeScript/build checks

---

# 🎯 Design Philosophy

GreenPulse AI follows five core principles:

### 1. Data before AI

AI should explain and recommend based on trusted operational data.

### 2. Deterministic compliance

Compliance-relevant calculations should be reproducible.

### 3. Evidence over assumptions

Missing evidence should produce a review state, not a fabricated pass.

### 4. Human-in-the-loop

Important sustainability decisions remain reviewable by people.

### 5. Enterprise-grade simplicity

Complex sustainability intelligence should become understandable at a glance.

---

# 🌱 What Makes GreenPulse Different?

Traditional workflow:

```text
Spreadsheet
   ↓
Manual calculations
   ↓
Consultant review
   ↓
Separate compliance work
   ↓
Static PDF
```

GreenPulse workflow:

```text
Operational Data
      ↓
Automated Intelligence
      ↓
Carbon + Energy + Waste
      ↓
ESG / BRSR Analysis
      ↓
AI Recommendations
      ↓
Human Review
      ↓
Audit-Ready Reporting
```

The goal is to transform sustainability from a **periodic reporting task** into a **continuous intelligence workflow**.

---

# 🛣️ Future Roadmap

Potential post-hackathon extensions include:

* GreenPulse AI Copilot
* Deeper Scope 3 coverage
* Automated enterprise integrations
* Additional sustainability frameworks
* Advanced supplier intelligence
* More comprehensive disclosure evidence management
* Multi-tenant enterprise administration
* Expanded anomaly models
* IoT / smart-meter integrations

---

# 🏆 Hackathon Context

**Track:** Sustainability & Green Technologies

**Project:** GreenPulse AI

**Category:** Full-Stack AI / Sustainability Intelligence

**Focus Areas:**

```text
Carbon Intelligence
Energy Intelligence
Waste Intelligence
ESG / BRSR Compliance
AI Recommendations
Green Score
Audit Reporting
```

---

# 🤝 Team

Built with a focus on combining:

**AI + Sustainability + Data Engineering + Compliance + Product Design**

---

# 📜 Disclaimer

GreenPulse AI is a hackathon/prototype platform intended for sustainability intelligence and compliance-readiness workflows.

Compliance outputs should be reviewed against the applicable regulations, reporting period, company circumstances, and authoritative regulatory guidance before being used for formal statutory reporting.

---

## ⭐ GreenPulse AI

> **The planet gives us signals.
> GreenPulse turns them into decisions.**

**Measure smarter. Act faster. Build greener.**
