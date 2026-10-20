# Project Specification: RepoReady — AI Project Handoff & Setup Checker

**Team Name:** HACKGG4Z  
**Registered Track:** AI Builder Challenge — Module 1  
**Registered Theme:** AI and Developer Tools  

---

## 1. Problem Statement & Background
Software project handoffs between student teams, open-source contributors, contractors, and incoming developers are notoriously prone to failure. Incoming developers frequently spend hours or days troubleshooting undocumented dependencies, missing environment variables, missing prerequisite runtimes, and broken setup scripts.

Existing linters check code syntax and formatting (ESLint, Prettier, Ruff), and general-purpose AI chat tools can provide unstructured code explanations, but no tool provides a **repeatable, evidence-backed, cross-manifest handoff audit workflow** that couples deterministic verification with transparent scoring and structured AI remediation guidance.

---

## 2. Product Differentiation
RepoReady is **NOT** a general-purpose chat assistant. Its core differentiation is a structured, repeatable developer workflow:
1. **Deterministic Cross-Manifest Inspection**: Rigorously cross-checks README commands against `package.json` scripts, `requirements.txt` dependencies, and `.env.example` variables.
2. **Transparent, Explainable 0–100 Heuristic Scoring**: 4-tier severity deductions (`critical`: -12, `high`: -8, `medium`: -5, `low`: -2) clamped strictly between 0 and 100.
3. **Interactive Issue Tracking Workflow**: Supports tracking findings as `Open`, `In Progress`, or `Resolved`, clearly distinguishing user-reported remediation from automated re-checks.
4. **Server-Side AI Issue Explainer with Safe Deterministic Fallback**: Integrates Google Gemini (`gemini-1.5-flash`) and OpenAI (`gpt-4o-mini`) via Vite server middleware with secret sanitization. If no API key is configured, RepoReady transparently operates offline using a grounded 4-field deterministic guidance engine.
5. **Instant Before-vs-After Remediation Demo**: One-click toggle between an un-audited repository (38/100, multiple blockers) and its remediated counterpart (96/100, 0 critical issues) for instant evaluation.
6. **Standardized Markdown Handoff Export**: Exports comprehensive `RepoReady-Report-<project>.md` for pull request attachments and team handoffs.

---

## 3. Ideal Customer Profile (ICP)
- **Primary Persona**: Computer science students, hackathon participants, and capstone project teams handing off group repositories to evaluators or incoming team cohorts.
- **Secondary Persona**: Junior full-stack developers, engineering leads in small agencies/startups, and open-source maintainers auditing repositories before merging templates or onboarding contributors.
- **Key Pain Point**: Wasting hours debugging "it works on my machine" issues caused by undocumented runtime requirements, missing `.env.example` templates, unpinned packages, and absent test instructions.

---

## 4. Scope & Boundaries

### In-Scope
- Inspection of 5 core developer onboarding files: `README.md`, `package.json`, `requirements.txt`, `.env.example`, and test runner configurations/guides.
- Multi-input entry: manual tabbed text entry and multi-file drag-and-drop / upload with automatic filename routing.
- Distinction between *Provided*, *Not Provided for this Scan*, and *Confirmed Missing from Repository*.
- Deterministic heuristic analysis covering 18 transparent rules across 6 categories.
- 4-Tier severity scoring model (Critical: -12, High: -8, Medium: -5, Low: -2).
- Interactive issue tracking workflow (`Open`, `In Progress`, `Resolved`).
- AI Issue Explainer with 4 structured output fields (beginner explanation, handoff impact, prioritized steps, verification check).
- Instant before-vs-after remediation comparison demo (TaskTrack API).
- Export of comprehensive Markdown Handoff Reports with onboarding checklist.

### Explicit Audit Boundaries & Non-Goals
- **Arbitrary Binary Execution**: RepoReady does not run `npm install`, compile C/Rust extensions, or execute scripts on the host system.
- **Credential Validation**: Does not ping live databases or third-party APIs with found keys.
- **Fake AI Claims**: When no API key is present in the environment, the tool explicitly reports AI as unconfigured and serves deterministic fallback guidance.
- **Backend Infrastructure Overhead**: Operates as a light Vite application without database, authentication, or cloud service dependencies.

---

## 5. Functional Requirements Matrix

| ID | Requirement | Description | Status |
|---|---|---|---|
| **FR-01** | Multi-Scenario Demo Loader | Select from 4 pre-built scenarios including Before (38 pts) vs After (96 pts) comparison. | Implemented & Tested |
| **FR-02** | Multi-File Input & Routing | Paste text or drag & drop files into browser; automatic name-based routing. | Implemented & Tested |
| **FR-03** | Honest File State Tracking | Distinguishes provided files, unprovided files, and confirmed missing files. | Implemented & Tested |
| **FR-04** | Cross-Manifest Rule Engine | Scans 18 deterministic rules across 6 categories with finding deduplication. | Implemented & Tested |
| **FR-05** | Finding Representation | Details category, 4-tier severity, exact evidence, why it matters, and code snippet fix. | Implemented & Tested |
| **FR-06** | Issue Tracking Workflow | Allows setting status to Open, In Progress, or Resolved (Self-Reported). | Implemented & Tested |
| **FR-07** | Transparent Heuristic Scoring | 0–100 score calculation with documented formula and penalty breakdown modal. | Implemented & Tested |
| **FR-08** | AI Issue Explainer | Server-side proxy for Gemini 1.5 Flash / OpenAI with secret sanitization. | Implemented & Tested |
| **FR-09** | Deterministic AI Fallback | Offline 4-field structured guidance when external AI keys are not configured. | Implemented & Tested |
| **FR-10** | Standardized Report Export | Preview, copy to clipboard, or download `RepoReady-Report-<project>.md`. | Implemented & Tested |

---

## 6. Technical Architecture

```
+-----------------------------------------------------------------------------------+
|                              BROWSER CLIENT (React 19)                            |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  | Sample Selector &  |     |   Dropzone / Multi-  |     |   Tabbed Textarea    |  |
|  | Comparison Toggle  |     |   File Upload API   |     |   Code Editors       |  |
|  +---------+----------+     +----------+----------+     +----------+-----------+  |
|            |                           |                           |              |
|            +---------------------------+---------------------------+              |
|                                        |                                          |
|                                        v                                          |
|                           +--------------------------+                            |
|                           |  ProjectFiles & Statuses  |                            |
|                           +------------+-------------+                            |
|                                        |                                          |
|                                        v                                          |
|                           +--------------------------+                            |
|                           |   Deterministic Rule     |                            |
|                           |    Heuristic Engine      |                            |
|                           |      (analyzer.ts)       |                            |
|                           +------------+-------------+                            |
|                                        |                                          |
|                +-----------------------+-----------------------+                  |
|                v                                               v                  |
|  +---------------------------+                   +-----------------------------+  |
|  |     ScoreBreakdown        |                   |      Finding[] Matrix       |  |
|  |  - Raw Baseline (0-100)   |                   |  - 4-Tier Severity (Crit/   |  |
|  |  - Adjusted Score         |                   |    High/Medium/Low)         |  |
|  |  - Category Points Matrix |                   |  - Exact Evidence Snippets  |  |
|  |  - Penalty Table          |                   |  - Issue Status Tracking    |  |
|  +-------------+-------------+                   +--------------+--------------+  |
|                |                                                |                 |
|                +-----------------------+------------------------+                 |
|                                        |                                          |
|                                        v                                          |
|                     +--------------------------------------+                      |
|                     |     Interactive Dashboard UI         |                      |
|                     |  - Score Gauge & Category Bars       |                      |
|                     |  - Filterable Finding Cards          |                      |
|                     |  - Issue Tracking (Open/Prog/Resolved|                      |
|                     |  - AI Explainer Guidance Card        |                      |
|                     |  - Markdown Report Generator (.md)   |                      |
+---------------------+------------------+-------------------+----------------------+
                                         | fetch('/api/ai-explain')
                                         v
+-----------------------------------------------------------------------------------+
|               VITE SERVER MIDDLEWARE (vite.config.ts - Dev & Preview)             |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  | Secret Sanitizer   | --> | Provider Router     | --> | External LLM API     |  |
|  | (Grep / Strip Keys)|     | (Gemini / OpenAI)   |     | (8s Timeout Guard)   |  |
|  +--------------------+     +----------+----------+     +----------+-----------+  |
|                                        |                           |              |
|                                        |                           v              |
|                                        |                +----------------------+  |
|                                        |                | Schema & Type        |  |
|                                        |                | Response Validator   |  |
|                                        |                +----------+-----------+  |
|                                        |                           |              |
|                                        | (If no key or failed)     |              |
|                                        v                           v              |
|                             +----------------------------------------------+      |
|                             | Deterministic Fallback / Validated JSON Output|     |
|                             +----------------------------------------------+      |
+-----------------------------------------------------------------------------------+
|  *Note on Static Production Hosting (GitHub Pages, S3, Netlify Static):           |
|  In purely static hosting environments where server middleware is absent,         |
|  client-side error handling intercepts 404 responses and automatically serves    |
|  the grounded deterministic fallback. No API keys are ever shipped to client.   |
+-----------------------------------------------------------------------------------+
```

---

## 7. Automated Verification & Acceptance Criteria
- 17 automated tests pass synchronously via `npm test` (`node --experimental-strip-types test/test_suite.ts`).
- Full coverage of rule detection, demo comparison, issue resolution tracking vs. re-analysis verification, score bounds, AI schema validation, and missing API key offline fallback.
- TypeScript strict checking and Vite bundling pass cleanly via `npm run build` (`tsc -b && vite build`) in < 1.5 seconds.
- Zero runtime crashes or unhandled promise rejections on sparse or malformed inputs.
- All evaluation claims are grounded in deterministic observations and transparently documented limitations.

