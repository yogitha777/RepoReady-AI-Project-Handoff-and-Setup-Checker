# RepoReady Standard Analysis Workflow Guide

This workflow guide provides a standard, repeatable operating procedure for evaluating any repository before handoff, grading, or developer onboarding.

---

## 🔄 Repeatable 6-Step Workflow

### Step 1: Open Dashboard
Launch the RepoReady application in your browser:
```bash
cd Module1_Final_Submission/prototype
npm run dev
# Open http://localhost:5173
```

### Step 2: Ingest Repository Manifests
You have two options for loading project content:
- **Option A (Multi-File Drop)**: Drag and drop repository files (`README.md`, `package.json`, `requirements.txt`, `.env.example`, `vitest.config.ts` or `jest.config.js`) directly onto the editor area. The files will automatically populate their respective tabs.
- **Option B (Manual Text Paste)**: Click on individual tabs across the top of the editor and paste the file content.
- **Option C (Built-In Scenario)**: Select a preset from the sample project dropdown in the top header (`TaskTrack API`, `InsightAI Service`, or `PulseFlow Platform`) to immediately demonstrate or test the workflow.

### Step 3: Confirm File Presence Posture
For each tab, adjust the status toggle if necessary:
- **Provided**: The file exists and its contents are loaded for analysis.
- **Not Provided**: The file was omitted by the user for this scan (will not penalize as a missing file).
- **Missing from Repo**: The file does not exist in the repository (triggers missing manifest rules).

### Step 4: Run Inspection Engine
Click the **"Analyze Project"** button in the header. The deterministic engine executes in sub-second time and presents:
- Overall Readiness Score & Grade (e.g. `Severe Gaps`, `Needs Review`, `Handoff Ready`).
- 6-dimension evaluation progress bars with click-to-filter capability.
- Count of Critical, Warning, Info, and Resolved items.

### Step 5: Triage and Remediate Findings
1. Use the **Severity Filters** (`Critical`, `Warnings`, `Info`) or the search input to isolate blocking issues.
2. Click **"View why it matters & recommended fix"** on any finding card to view the exact reasoning and copy ready-to-paste markdown or config snippets.
3. Apply the fixes in your target codebase.
4. Click **"Mark Resolved"** on the card to see your score update dynamically in real time.

### Step 6: Export Handoff Report
1. Click **"Export Report"** in the top navigation bar.
2. Review the generated Markdown report in the preview dialog.
3. Click **"Download .md File"** to save `RepoReady-Report-<project>.md` or **"Copy Markdown"** to paste it into a PR summary, issue ticket, or project documentation archive.

---

## 📊 Score Interpretation Guide

| Score Range | Status Grade | Recommended Action |
|---|---|---|
| **85 – 100** | **Handoff Ready** | Excellent posture. Onboarding engineers can execute install, test, and run commands without external guidance. |
| **60 – 84** | **Needs Review** | Functional baseline exists, but missing runtime prerequisites, unpinned dependencies, or undocumented variables will cause setup friction. |
| **0 – 59** | **Severe Gaps** | High risk of onboarding failure. Key installation scripts, security protections, or test procedures are missing or contradictory. Immediate remediation required before handoff. |
