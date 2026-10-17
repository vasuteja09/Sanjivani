# Sanjivani AI (CodeShield AI)
> **"Detect Vulnerabilities. Understand Risks. Write Safer Code."**

**Sanjivani AI** is an AI-powered static code vulnerability detection and secure code remediation platform designed for software developers, computer science students, and engineering teams.

Unlike generic conversational chatbots that guess about security issues, Sanjivani AI pairs **deterministic static analysis (Bandit)** with **contextual AI remediation and comparison workflows**. The platform helps developers understand what a security issue is, why it matters, where it occurs, and how to fix and rescan it.

---

## 1. Core Workflow

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Submit Code    │  ───► │ Static Analysis │  ───► │ Identify Flaws │
│ (Editor/Upload) │       │ (Bandit Engine) │       │ (Rule & Line #) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Review Results  │  ◄─── │  Rescan Code    │  ◄─── │ Explain Risks & │
│ (Diff & Report) │       │ (Verification)  │       │ Suggest Fixes   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Submit Code**: Paste code directly into the syntax-highlighted Monaco editor or upload a `.py` source file.
2. **Analyze Code**: Real static analysis executed in an isolated temporary sandbox via Bandit (without executing the code).
3. **Identify Vulnerabilities**: Normalize results into consistent severity badges, CWE mappings, confidence scores, and line numbers.
4. **Explain with AI**: Generate plain-English explanations of risks and consequences (with rule-based fallback if offline).
5. **Review Remediation**: Inspect side-by-side comparisons of original vulnerable code and recommended secure replacements.
6. **Rescan & Compare**: Verify that the fix resolves the original finding without introducing new regressions.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with Vite and TypeScript
- **Styling**: Tailwind CSS v4 design system (light cybersecurity theme)
- **Code Editor**: Monaco Editor (`@monaco-editor/react`) with syntax highlighting and line numbers
- **Visualizations**: Recharts for severity breakdown bar charts
- **Icons**: Lucide React
- **Router**: React Router DOM v7
- **HTTP Client**: Axios with centralized error interceptors

### Backend
- **Framework**: FastAPI (Python 3.11+) with async request handling
- **Static Analysis Engine**: Bandit 1.9.4 for deterministic Python AST vulnerability scanning
- **Data Persistence**: SQLite with SQLAlchemy ORM (WAL mode, foreign key enforcement)
- **Validation**: Pydantic v2 schemas and SettingsConfigDict
- **AI Integration**: Configurable OpenAI-compatible client (`AsyncOpenAI`) with structured JSON schema enforcement
- **Testing**: Pytest and Pytest-Asyncio with HTTPX TestClient

---

## 3. Project Directory Structure

```
d:\SANJIVANI\
├── frontend/
│   ├── public/
│   │   └── favicon.svg           # Brand shield vector icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # AppLayout, Sidebar, Header
│   │   │   └── ui/               # SeverityBadge, EmptyState, Toast
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx      # Dashboard with live metrics & charts
│   │   │   ├── ScannerPage.tsx       # Monaco workspace & sample picker
│   │   │   ├── ResultsPage.tsx       # Findings table & detail drawer
│   │   │   ├── RemediationPage.tsx   # Side-by-side diff & rescan flow
│   │   │   ├── HistoryPage.tsx       # Persistent audit logs with delete
│   │   │   ├── SecurityGuidePage.tsx # Educational security topics & code
│   │   │   └── SettingsPage.tsx      # Runtime status & privacy disclosures
│   │   ├── services/             # Axios API client services
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx               # Routing & Toast provider
│   │   ├── main.tsx              # DOM mount
│   │   └── index.css             # Design tokens & Inter font
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts            # Proxy configured to http://127.0.0.1:8000
│
├── backend/
│   ├── app/
│   │   ├── api/                  # REST endpoints (health, status, scans, findings, samples)
│   │   ├── core/                 # Config & security (secret redaction, path safety)
│   │   ├── models/               # SQLAlchemy models (Scan, Finding with cascade delete)
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── scanners/             # Base scanner, Bandit scanner, normalizer
│   │   ├── ai/                   # Prompts & OpenAI-compatible client with fallback
│   │   ├── database.py           # SQLite connection with WAL mode
│   │   └── main.py               # FastAPI application & security middleware
│   ├── samples/                  # Harmless educational demonstration files
│   │   ├── insecure_sql.py       # SQL Injection vector (Bandit B608)
│   │   ├── hardcoded_secret.py   # Exposed keys & passwords (Bandit B105)
│   │   ├── unsafe_command.py     # Shell execution (Bandit B602/B605)
│   │   └── safer_example.py      # Clean secure pattern (Parameterized + Env)
│   ├── tests/                    # Automated pytest suite (9 tests)
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 4. Security & Privacy Safeguards

1. **Zero Execution of User Code**: Submitted code is scanned purely as static text using abstract syntax trees (ASTs). It is never executed, imported, or run in the Python runtime.
2. **Volatile File Storage**: Uploaded files and editor snippets are written to cryptographically random temporary files (`tempfile.mkstemp`) and unlinked immediately in `finally` blocks.
3. **Automatic Secret Redaction**: All API keys (AWS, OpenAI, Bearer tokens) and hardcoded passwords are redacted as `[REDACTED]` prior to SQLite storage or AI provider transmission.
4. **Path Traversal Protection**: Uploaded filenames are sanitized through `pathlib.Path(name).name` with directory traversal characters stripped.
5. **Prompt Injection Resistance**: The AI integration enforces strict JSON schemas, uses temperature 0.2, and instructs the system prompt to treat all user code and comments as untrusted data.
6. **No Leaked Server Secrets**: Backend `.env` secrets are never returned over any API route or bundled into client-side Vite variables.

---

## 5. Installation & Setup Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **PowerShell** (Windows) or **Bash** (macOS/Linux)

---

### Step 1: Backend Setup (PowerShell)

Open a PowerShell terminal and navigate to the backend directory:

```powershell
cd d:\SANJIVANI\backend

# 1. Install dependencies
python -m pip install -r requirements.txt

# 2. Verify Bandit is installed and accessible
python -m bandit --version

# 3. Create .env configuration (copy from example)
Copy-Item .env.example .env

# 4. Start the FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will automatically create and initialize `sanjivani.db` SQLite database and start listening on `http://127.0.0.1:8000`.

---

### Step 2: Frontend Setup (PowerShell)

Open a second PowerShell terminal and navigate to the frontend directory:

```powershell
cd d:\SANJIVANI\frontend

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

### Step 3: Run the Automated Test Suite

To verify backend health, scanner detection accuracy, secret redaction, rescan comparisons, and fallback functionality:

```powershell
cd d:\SANJIVANI\backend
python -m pytest tests/ -v
```

All 9 automated tests will execute and pass:
- `test_health_check` (status ok, scanner available)
- `test_scanner_status` (Bandit version reported)
- `test_bandit_scanner_available`
- `test_bandit_detects_sql_injection` (detects B608 on vulnerable sample)
- `test_secret_redaction` (masks keys as `[REDACTED]`)
- `test_submit_valid_scan_and_get` (CRUD and cascade delete)
- `test_submit_empty_code_rejected` (returns 400)
- `test_submit_unsupported_language_rejected` (returns 422)
- `test_ai_fallback_explanation` (rule-based fallback when key not configured)

---

## 6. Configuring AI Assistance (Optional)

Sanjivani AI includes **built-in rule-based remediation templates** for all supported rules, allowing the system to run completely offline without an API key.

To enable dynamic AI explanations and contextual code fix generation:

1. Open `d:\SANJIVANI\backend\.env`
2. Configure your OpenAI-compatible provider credentials:
   ```env
   AI_API_KEY=your_actual_api_key_here
   AI_BASE_URL=https://api.openai.com/v1
   AI_MODEL=gpt-4o-mini
   ```
   *(Works with OpenAI, OpenRouter, Groq, or local Ollama servers)*
3. Restart the backend process (`Ctrl+C` and rerun `python -m uvicorn app.main:app ...`).
4. The Header and Settings pages will immediately reflect `AI: Enabled`.

---

## 7. Step-by-Step Demonstration Walkthrough

Follow this demonstration flow when presenting Sanjivani AI to judges:

### Demonstration 1: SQL Injection Detection & Remediation
1. Open the application at `http://localhost:5173`.
2. Notice the live engine indicator in the header: **"Engine: Bandit Online"**.
3. Click **"Scan Your Code"** in the sidebar.
4. Under **"Try Sample"**, select **"SQL Injection Vector"**.
5. Observe the vulnerable string-concatenated SQL query loaded into the Monaco Editor.
6. Click **"Analyze Code"**.
7. The Results page opens showing finding **"Potential SQL Injection (String Query)"** under rule **B608 (CWE-89)** on Line 12.
8. Click **"Explain with AI"** to see a security analysis of how SQL injection works and why it matters.
9. Click **"Launch AI Remediation Assistant"**.
10. Review the side-by-side view comparing the vulnerable code against the suggested parameterized query.
11. Click **"Rescan Corrected Code"**.
12. Review the Rescan Comparison Report confirming **"1 finding no longer detected by configured checks"**.

### Demonstration 2: Hardcoded Secrets & Masking
1. Return to **Scan Code** and select **"Hardcoded Credentials & Tokens"**.
2. Click **"Analyze Code"**.
3. Observe finding **"Possible hardcoded password string" (B105)**.
4. Notice that in the evidence snippet and database records, secret values are automatically masked as `[REDACTED_PASSWORD]` and `[REDACTED_API_KEY]`.
5. Open the **Security Guide** from the sidebar to review the best practices for Environment Variable management.

### Demonstration 3: Scan History & Persistence
1. Navigate to **Scan History**.
2. Notice all completed scans are listed with timestamps, findings counts, and severity badges.
3. Refresh the browser page or restart the backend server; observe that all audit records persist cleanly in SQLite.
4. Click **"Delete"** on any test scan; confirm the deletion and observe the record and its findings removed from the database.

---

## 8. Limitations & Future Scope

- **Primary Language**: The initial version features Python as a first-class language via Bandit. Support for JavaScript/TypeScript via Semgrep rulepacks is architecturally supported and ready for integration.
- **Scanner Scope**: Bandit identifies common syntactic and AST security anti-patterns. Dynamic runtime attacks (e.g. CSRF or race conditions) require DAST or interactive application security testing tools.
- **AI Recommendations**: Remediations are suggestions and should be vetted with unit tests prior to deployment.

---

## 9. License

Developed for academic research and educational demonstration purposes.
