# Smart Campus Navigator — Codex project handoff

This folder contains the campus frontend, map review, mobile work, and a Python backend for credential login and shared ChromaDB storage. On 23 November 2026 the owner authorised accounts and private persistence in addition to the earlier homepage/map work. See `CURRENT_STATE.md` for current scope and verification.

## Current web app setup

The web app is live at [Smart Campus Navigator](https://smart-campus-web-production-7dd97290.up.railway.app). Create an account, then sign into that same account on another device to access your saved places and notes. Railway stores accounts and ChromaDB on a persistent volume; this computer can be turned off. Hosting currently uses limited trial credit. See [Public deployment](docs/PUBLIC_DEPLOYMENT.md) for maintenance and verification. The local command below uses a separate local database.

From this project folder, use the installed project environment:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --workers 1 --no-proxy-headers
```

Open **http://127.0.0.1:8765**, create an account, and use **My saved places** to save destinations and private notes. Data persists in the ignored `private-data/` directory. Stop with Ctrl+C. The HTML files now need this backend for sign-in and storage.

For a fresh checkout, run `python -m venv .venv` and `.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt` first. Read [Accounts and storage](docs/ACCOUNTS_AND_STORAGE.md) for API reuse, configuration, tests and shared-server requirements.

The numbered planning/setup workflow below is the **original handoff**. Its planning-only and direct-file statements are historical; `CURRENT_STATE.md` records the later authorizations. Lessons, arrival planning and reminders remain later work.

## Android phone app — added 23 November 2026

The owner approved Android-first Capacitor navigation using device location.
Source, native project, preview and setup instructions are in
[`mobile/README.md`](mobile/README.md). A verified debug APK is available at
[`mobile/releases/SmartCampus-0.1.0-debug.apk`](mobile/releases/SmartCampus-0.1.0-debug.apk),
with a labelled waypoint simulation. Physical-device checks and reviewed USIU
entrances/paths remain required. Read `CURRENT_STATE.md` for current
approvals, including separate ongoing work. The original setup below is
historical and does not supersede later owner instructions.

## 1. Extract and open the correct folder

Download `campus-navigator-codex.zip` and use Windows **Extract All**. Put the extracted `campus-navigator-codex` folder somewhere convenient, such as your Documents folder. Extract before opening; do not work inside the ZIP.

In VS Code choose **File > Open Folder**, then select the folder containing this README and `AGENTS.md`. Alternatively, open `campus-navigator.code-workspace` from the extracted folder.

The frontend is at `prototype/campus-navigator.html`. Serve it with the backend command above, then sign in for live search, category filters, the route demo and private saved places. Its map/directions remain illustrative. No frontend framework or build step was added.

## 2. Open Codex in VS Code

Use the [official Codex IDE setup page](https://learn.chatgpt.com/docs/ide) and choose Visual Studio Code to install/enable the official extension. You can also find the OpenAI Codex extension in VS Code's Extensions view (`Ctrl+Shift+X`). Verify the publisher is OpenAI.

Open the Codex icon. If it is not visible, press `Ctrl+Shift+P` and run **Codex: Open Codex Sidebar**. [Official instructions](https://learn.chatgpt.com/docs/ide).

Select **Sign in with ChatGPT** and complete the browser sign-in with your own account. This is the subscription sign-in path; it does not require creating an API key. Account/workspace availability and usage limits still apply. [Authentication documentation](https://learn.chatgpt.com/docs/auth?surface=cli).

Keep the normal workspace permission boundaries. If Windows presents a sandbox setup problem, follow its supported setup flow and [Windows guidance](https://learn.chatgpt.com/docs/windows/windows-sandbox); there is no project-specific reason to disable isolation. Do not install WSL just to read these files or preview the sample.

## 3. Start with the supplied planning message

Open `CODEX_START_PROMPT.md`, copy its complete contents and paste them into a new Codex chat for this folder. The prompt explicitly requests no file changes.

Codex discovers `AGENTS.md` project instructions when starting its session. Keep this file at the root of the folder/repository you open, and start a new session after adding or materially changing instructions. The first prompt asks Codex to report the instructions it loaded. [Official AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Expected result: an audit, architectural options, missing-data decisions and a concrete Phase 1 plan. It should not build the mobile app or install a framework yet. No Node, Python, mobile SDK or backend setup is needed for this first review.

## 4. Create a local checkpoint before code changes

Git is useful for reviewing and reverting edits; a remote GitHub repository is not needed for the local VS Code workflow. The archive does not contain a `.git` history.

If Git is installed, open **Terminal > New Terminal** in this project. Confirm the terminal is in this extracted project folder, then run each line:

```powershell
git --version
git init
git add .
git commit -m "Initial campus navigator project handoff"
```

If Git asks for your identity, set it for this repository using your actual name and your chosen commit email, then repeat the commit:

```powershell
git config user.name "Your name"
git config user.email "Your chosen commit email"
git commit -m "Initial campus navigator project handoff"
```

Do not type the example identity literally. If Git is unavailable, you can still do the read-only planning task; add version control before approving substantial code edits. No remote repository is created by these commands.

## 5. Authorise only the phase you choose

After reviewing the plan and resolving Phase 1 blockers, an example next message is:

> Implement Phase 1 in TASKS.md using the plan we just agreed. Preserve the approved design and existing working features. Explain the changed code in manageable chunks, run the relevant checks, and update the project status with what was actually verified. Complete Phase 1 only. Do not configure mobile, backend or paid services as part of this phase unless they are already in the approved plan.

The owner has now authorised the Phase 1 implementation described in `CURRENT_STATE.md`. The example above illustrates approval of a bounded phase; it does not authorise later phases. Resolve their architecture when needed rather than immediately running `npm install` or generating a new application. This package has no `package.json` or build command.

## Files in this project

| File/folder | Purpose |
| --- | --- |
| `AGENTS.md` | Instructions Codex should follow across tasks |
| `PROJECT_BRIEF.md` | Complete confirmed feature requirements |
| `CURRENT_STATE.md` | Honest baseline, verification history and next action |
| `TASKS.md` | Phases, checklists and acceptance criteria |
| `DECISIONS.md` | Confirmed choices and questions still open |
| `CODEX_START_PROMPT.md` | The first message to paste into Codex |
| `campus-navigator.code-workspace` | Opens this folder as a VS Code workspace |
| `prototype/campus-navigator.html` | Phase 1 UI, responsive styles and preserved schematic routing demo |
| `prototype/data/facilities.demo.js` | Shared unverified facility/category/alias fixtures and drawing positions |
| `prototype/catalogue.js` | Catalogue validation and shared search/category matching |
| `backend/` | Account/session verification, ChromaDB persistence and the same-origin web/API server |
| `prototype/login.html`, `login.js`, `account.css` | Responsive registration/sign-in and account styles |
| `prototype/api.js`, `auth-guard.js`, `personal-data.js` | Shared authenticated client, page access and private saved-place UI |
| `tests/test_accounts.py` | Real Chroma account/isolation/persistence integration tests |
| `docs/ACCOUNTS_AND_STORAGE.md` | Current web setup, configuration, API contract and deployment limits |
| `design-references/` | Three supplied design images and an explanation |
| `references/original-guide.md` | Historical code walkthrough; not the current feature specification |
| `docs/OFFICIAL_SOURCES.md` | Official setup links and date checked |
| `.gitignore` | Excludes common secrets, generated output and local data from future Git commits |

## If you already have a newer application project

Keep that application's source. Do not replace it with this prototype. Give Codex this handoff alongside the current repository, then ask it to compare them without changing files. Review and merge any existing `AGENTS.md`; do not overwrite it blindly. Keep requirements/designs as reference documents and make the live repository the code baseline.

## If you prefer Codex in the cloud

The same project folder can be committed to a repository that your Codex account can access. For an ongoing project, a private repository keeps the project together and allows versioned review. Do not upload only the ZIP as the repository's source; commit the extracted files with `AGENTS.md` at the repository root.

Use the [official Cloud setup](https://learn.chatgpt.com/docs/cloud): choose **Work in > Cloud**, select an available environment and make the repository available through a supported connected account. The documentation also describes starting without a repository where the default environment is available. Availability depends on the workspace. Reuse `CODEX_START_PROMPT.md` after the files are accessible.

For this prototype-only planning stage there is no application dependency install script or project secret to configure. The handoff is portable; it has not created a GitHub repository, cloud environment or deployment for you.

## If setup looks different

- No Codex sidebar: use the Command Palette command above and check that the official extension is enabled.
- Codex does not see the brief: open the extracted folder containing `AGENTS.md`, not its parent or only the HTML file.
- Instructions appear stale: start a new Codex session in the intended root and ask which instructions loaded.
- A sign-in or Windows setup error occurs: keep its exact message; do not paste tokens or credentials into chat.
- The next agent proposes OCR or home-commute calculations: point it to the confirmed choices in `DECISIONS.md`.
