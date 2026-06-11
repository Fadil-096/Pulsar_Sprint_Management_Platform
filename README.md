# Nokia Sprint Platform — Phase 1

Web-based sprint management system. Replaces the Excel VBA master sheet with a
real-time, role-based web platform.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | ≥ 14 | https://nodejs.org |

No other dependencies — the server uses only Node's built-in `http` and `fs` modules.
Chart.js is loaded from CDN at runtime.

---

## How to Run

### Step 1 — Unzip the project
```
Unzip nokia sprint.zip anywhere on your computer.
You will see a folder called: nokia-sprint/
```

### Step 2 — Open a terminal in that folder
- **Windows**: Open the `nokia-sprint` folder → Shift + Right-click → "Open PowerShell window here"
- **Mac/Linux**: Open Terminal → `cd /path/to/nokia-sprint`

### Step 3 — Start the server
```bash
node server.js
```

You should see:
```
  Nokia Sprint Platform — Phase 1
  ─────────────────────────────────
  Running at: http://localhost:3000
  Press Ctrl+C to stop
```

### Step 4 — Open the app
Open your browser and go to:
```
http://localhost:3000
```

### Step 5 — Log in
- Select **Manager** or **Employee** role
- Click **Continue** (no real auth in Phase 1 — any email/password works)

### Stop the server
Press `Ctrl + C` in the terminal.

---

## Replacing Sample Data with Real Data

Open `public/data.js` — it is the only file you need to edit.

### 1. Employees (`EMPLOYEES` array)
```js
{ id: 1, name: 'Real Name', email: 'real@nokia.com', team: 'Core', subTeam: 'Backend' },
```
Copy from Master Sheet → `Employee_data` tab.

### 2. Sprints (`SPRINTS` array)
```js
{ fb: 'FB-23', start: '2025-04-14', end: '2025-04-25' },
```
Copy from Master Sheet → `Sprint_Date` tab.  
Dates must be in `YYYY-MM-DD` format.

### 3. Tasks (`TASKS` array)
```js
{
  id: 1,
  fb: 'FB-23',           // Sprint FB number
  empId: 1,              // Must match an id in EMPLOYEES
  featureId: 'F-101',    // Feature ID column
  featureDesc: '...',    // Feature Description column
  activity: 'Dev',       // Activity Type column
  description: '...',    // Activity Description column
  status: 'Done',        // Activity Status ('Done'|'In Progress'|'Blocked'|'To Do')
  est: 8,                // Est Effort (hours)
  spent: 9,              // Spent Effort (hours)
},
```
Copy from Master Sheet → `Sprint_Planning` tab.

### 4. Active Sprint
```js
const ACTIVE_SPRINT = 'FB-23';   // Change to current sprint FB
```

---

## File Structure

```
nokia-sprint/
├── public/
│   ├── index.html   ← Entry point (do not edit)
│   ├── style.css    ← All styles
│   ├── data.js      ← ⭐ Edit this with your real data
│   └── app.js       ← All UI logic
├── server.js        ← Node.js static server
├── package.json
└── README.md
```

---

## Phase Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Web platform + real-time analytics dashboard | ✅ This build |
| Phase 2 | AI sprint delay prediction (XGBoost / Random Forest) | Planned |
| Phase 3 | Graph-based skill intelligence + NLP task matching | Planned |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node: command not found` | Install Node.js from nodejs.org |
| Port 3000 already in use | Run `PORT=3001 node server.js` |
| Charts not loading | Check internet connection (Chart.js loads from CDN) |
| Blank page | Open browser DevTools → Console and share the error |
