# RepoReady — AI Project Handoff & Setup Checker

**RepoReady** is a developer tool and handoff audit engine built for the **AI Builder Challenge — Module 1** under the registered innovation theme **AI and Developer Tools** by team **HACKGG4Z**.

RepoReady inspects a software project's documentation and configuration manifests (`README.md`, `package.json`, `requirements.txt`, `.env.example`, test configs), surfaces likely handoff and onboarding roadblocks, provides an interactive issue-tracking workflow, attaches AI-powered or deterministic beginner-friendly remediation guidance, and generates a standardized Markdown readiness report.

---

## 🎯 Product Differentiation

General-purpose AI chat assistants can read code and offer free-form commentary, but they lack consistency, cross-manifest deterministic validation, and structured handoff tracking.

**RepoReady's differentiation:**
1. **Deterministic Cross-Manifest Inspection**: Rigorously cross-checks README commands against `package.json` scripts, `requirements.txt` dependencies, and `.env.example` variables.
2. **Transparent, Explainable 0–100 Heuristic Scoring**: Documented 4-tier severity deductions (`critical`: -12, `high`: -8, `medium`: -5, `low`: -2) clamped strictly between 0 and 100.
3. **Interactive Issue Tracking Workflow**: Supports tracking findings as `Open`, `In Progress`, or `Resolved (Self-Reported)`, clearly distinguishing user-reported remediation from technical verification on re-analysis.
4. **Server-Side AI Issue Explainer with Graceful Deterministic Fallback**: Integrates Google Gemini (`gemini-1.5-flash`) and OpenAI (`gpt-4o-mini`) via Vite server middleware with secret sanitization. If no API key is configured or when hosted in static environments, RepoReady transparently operates offline using a grounded 4-field deterministic guidance engine.
5. **Instant Demonstration Scenarios**: One-click toggle between an un-audited baseline sample (38/100, multiple blockers) and its remediated counterpart (96/100, 0 critical issues) for instant evaluation.
6. **Standardized Markdown Handoff Export**: Exports comprehensive `RepoReady-Report-<project>.md` for pull request attachments and team handoffs.

---

## 🚀 Key Features

1. **Four Demonstration Scenarios**:
   - **[Demo Sample] TaskTrack API — Baseline (With Gaps)**: Represents an un-audited submission with missing install/start commands, runtime prerequisites, undocumented environment variables, exposed secret leak, and stub test script (Score: 38/100, Grade: Severe Gaps).
   - **[Demo Sample] TaskTrack API — Remediated Setup Documentation**: The exact same repository remediated with RepoReady suggested fixes, pinned dependencies, engine constraints, and test suite (Score: 96/100, Grade: Handoff Ready).
   - **[Demo Sample] InsightAI Service (FastAPI & SQLAlchemy)**: Python data microservice with unpinned requirements, missing virtualenv setup guide, and zero test instructions (Score: 68/100, Grade: Needs Review).
   - **[Demo Sample] CloudSync Engine (TypeScript Production Service)**: Gold-standard microservice documentation (Score: 97/100, Grade: Handoff Ready).
2. **Multi-Input Flexibility**:
   - Tabbed editors for direct pasting.
   - Multi-file drag-and-drop / file picker with automatic file-name routing.
   - Honest visibility tracking: explicitly distinguishes *Provided*, *Not Provided for this Scan*, and *Confirmed Missing from Repository*.
3. **Four-Tier Severity Scoring Matrix**:
   - Evaluates 6 core onboarding categories:
     - Installation & Setup (25 pts max)
     - Dependencies & Manifests (20 pts max)
     - Runtime & Prerequisites (15 pts max)
     - Environment & Configuration (20 pts max)
     - Testing & Verification (10 pts max)
     - Maintenance & Handoff (10 pts max)
   - Severity deductions: Critical (-12 pts), High (-8 pts), Medium (-5 pts), Low (-2 pts).
4. **Issue Tracking & Verification Distinction**:
   - Mark issues as *Open*, *In Progress*, or *Resolved (Self-Reported)*.
   - **Self-Reported Resolution vs. Re-Analysis Verification**: Setting an issue to "Resolved" updates the session's adjusted score for workflow tracking, but is clearly documented as developer self-reported. A finding is only technically verified when manifest files are edited and re-analysis naturally produces 0 findings for that rule.
5. **AI Issue Explainer with Strict Response Validation**:
   - Produces a 4-field structured explanation: (1) Beginner Explanation, (2) Why It Matters for Handoff, (3) Prioritized Actionable Steps, and (4) Suggested Verification Check.
   - Validates response schema and types before rendering; falls back cleanly if the model returns malformed JSON or unhandled properties.

---

## 🛡️ Privacy & AI Deployment Architecture

### 1. Deployment Modes & Static Production Fallback
- **Development & Preview (`npm run dev` / `npm run preview`)**: Handled by Vite server middleware (`aiExplainerPlugin` in `vite.config.ts`), which mounts `/api/ai-status` and `/api/ai-explain`. The middleware reads API keys from server environment variables and communicates directly with Gemini or OpenAI.
- **Static Production Hosting (GitHub Pages, S3, Netlify Static, Cloudflare Pages)**: In static production deployments, server-side middleware endpoints are not present. RepoReady detects when the backend is unreachable (or returns HTTP 404) and automatically operates in **Safe Offline Deterministic Mode**.
- **No Client-Side API Keys**: API keys are NEVER embedded, bundled, or exposed in frontend client code, build assets (`dist/`), or repository archives.

### 2. Privacy & Data Handling Notice
- **Local Deterministic Analysis**: The core 18-rule inspection and scoring engine runs 100% locally in your browser. No files, code, or manifests leave your machine during deterministic evaluation.
- **Live AI Requests**: When an external API key is configured and the user explicitly requests an AI explanation, RepoReady transmits only sanitized finding metadata (finding ID, category, title, description, and redacted evidence). The server middleware strips potential tokens, API keys, and connection strings before calling external LLMs.
- **Privacy Warning**: Users should **NEVER** paste real production passwords, active API tokens, private keys, or confidential intellectual property into the tool. Use sanitized `.env.example` templates with dummy placeholder values.

---

## 🛠️ Tech Stack & Architecture

- **Client Framework**: React 19 + TypeScript (Strict mode, ESM)
- **Build Tool**: Vite 8 with custom server middleware plugin (`aiExplainerPlugin`) mounted to dev and preview servers
- **Icons**: `lucide-react`
- **Styling**: Bespoke Dark Navy Developer Theme (zero runtime CSS bloat, CSS variables, high density)
- **Deterministic Heuristic Engine**: 100% Client-side rule analyzer with finding deduplication, boundary validation, and input completeness safeguards.
- **AI Integration**: Server-side proxy handling `/api/ai-status` and `/api/ai-explain` with Gemini 1.5 Flash (`gemini-1.5-flash`) and OpenAI GPT-4o-mini (`gpt-4o-mini`), 8-second timeout guard, schema validation, and grounded deterministic fallback.

---

## 📋 Prerequisites

- **Node.js**: `>= 20.0.0` (Tested on Node v24.19.0)
- **npm**: `>= 10.0.0` (Tested on npm 11.17.0)

---

## ⚡ Quick Start

```bash
# 1. Navigate to prototype directory
cd Module1_Final_Submission/prototype

# 2. Install dependencies
npm install

# 3. (Optional) Configure AI Provider Key in environment
# export GEMINI_API_KEY="your-gemini-api-key"
# or
# export OPENAI_API_KEY="your-openai-api-key"
# Note: If no key is set, RepoReady runs in local deterministic fallback mode automatically!

# 4. Start development server
npm run dev

# 5. Open in browser (default: http://localhost:5173)
```

To build and preview production assets:
```bash
npm run build
npm run preview
```

---

## 🧪 Automated Testing

RepoReady includes an automated verification test suite exercising all 6 core analysis rules, sample projects, score restoration, demo comparison, 4-tier penalties, AI schema validation, offline fallbacks, and report formatting:

```bash
npm test
```

### Actual Test Execution Output (17 Passed, 0 Failed):
```
====================================================
   REPOREADY AUTOMATED TEST SUITE EXECUTION   
   Theme: AI and Developer Tools | Team: HACKGG4Z   
====================================================

  ✓ PASS: Sample 1 (Broken Express API) detects critical handoff gaps
  ✓ PASS: Sample (Incomplete Python) detects unpinned requirements and venv omission
  ✓ PASS: Sample (Gold Standard) achieves Handoff Ready posture
  ✓ PASS: Demo Comparison: Remediated project resolves critical gaps and achieves >= 90 score
  ✓ PASS: Issue tracking workflow distinguishes open, in_progress, and resolved status
  ✓ PASS: Score model applies exact 4-tier penalties (critical: -12, high: -8, medium: -5, low: -2)
  ✓ PASS: Deterministic AI fallback generates grounded 4-field guidance safely
  ✓ PASS: Finding deduplication ensures no duplicate findings in analysis
  ✓ PASS: Markdown Report Exporter generates complete report structure with AI and tracking
  ✓ PASS: Warns user when only 1 file is provided for evaluation
  ✓ PASS: Gracefully handles invalid JSON in package.json (DEP-005)
  ✓ PASS: Correctly distinguishes missing file from not_provided file
  ✓ PASS: Score bounds guarantee: score stays strictly within [0, 100]
  ✓ PASS: Distinguishes technical code fix on re-analysis from self-reported resolution
  ✓ PASS: Validates AI model response structure and rejects malformed payloads
  ✓ PASS: Safe offline fallback handles missing API key gracefully
  ✓ PASS: Fallback generator robustly produces guidance across all 6 categories

----------------------------------------------------
Test Execution Summary: 17 passed, 0 failed
----------------------------------------------------
```

---

> **Deterministic Documentation Heuristic:** RepoReady analyzes documentation and manifest files to determine onboarding clarity, configuration consistency, and handoff transparency. RepoReady does not execute application code, verify compiler builds, or validate credentials against live backends. A missing file declaration indicates unprovided inputs rather than verified project failure.
>
> **Live AI Verification Status: UNTESTED (NO API KEY CONFIGURED):** Automated tests and default local runs operate via the offline deterministic fallback engine because live API keys are not pre-packaged in the environment. External live AI generation has NOT been tested against external LLM providers in this environment. What was tested and verified is the offline deterministic fallback engine, schema validation, and missing-key error handling pathways. Fallback testing must NOT be described as live AI testing.
>
> **Stranger Test Status:** Marked as **NOT YET CONDUCTED** with an outside developer unfamiliar with the tool. A standardized 15-minute protocol is documented in `Build-Log.md`.
