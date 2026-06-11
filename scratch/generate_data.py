import random
import json

# Setup seed for reproducibility
random.seed(42)

# 1. Employees data
employees = [
    {"id": 1, "name": "Rishit Mahapatra", "email": "rishit.mahapatra@nokia.com", "team": "Core", "subTeam": "Backend"},
    {"id": 2, "name": "Ritu Kanchi", "email": "ritu.kanchi@nokia.com", "team": "Core", "subTeam": "Frontend"},
    {"id": 3, "name": "Geet Shukla", "email": "geet.shukla@nokia.com", "team": "Platform", "subTeam": "DevOps"},
    {"id": 4, "name": "Yuvraj Katara", "email": "yuvraj.katara@nokia.com", "team": "Platform", "subTeam": "QA"},
    {"id": 5, "name": "Sapna Rao", "email": "sapna.rao@nokia.com", "team": "Management", "subTeam": "Strategy"},
    {"id": 6, "name": "Rakesh Sharma", "email": "rakesh.sharma@nokia.com", "team": "Core", "subTeam": "Backend"},
    {"id": 7, "name": "Amit Patel", "email": "amit.patel@nokia.com", "team": "Core", "subTeam": "Backend"},
    {"id": 8, "name": "Sneha Reddy", "email": "sneha.reddy@nokia.com", "team": "Core", "subTeam": "Frontend"},
    {"id": 9, "name": "Vikram Malhotra", "email": "vikram.malhotra@nokia.com", "team": "Core", "subTeam": "Frontend"},
    {"id": 10, "name": "Priya Nair", "email": "priya.nair@nokia.com", "team": "Platform", "subTeam": "DevOps"},
    {"id": 11, "name": "Divya Joshi", "email": "divya.joshi@nokia.com", "team": "Platform", "subTeam": "QA"},
    {"id": 12, "name": "Rohan Verma", "email": "rohan.verma@nokia.com", "team": "Platform", "subTeam": "Security"},
    {"id": 13, "name": "Kavita Rao", "email": "kavita.rao@nokia.com", "team": "Platform", "subTeam": "Security"},
    {"id": 14, "name": "Anil Mehta", "email": "anil.mehta@nokia.com", "team": "Management", "subTeam": "Strategy"},
    {"id": 15, "name": "Neha Gupta", "email": "neha.gupta@nokia.com", "team": "Management", "subTeam": "PMO"},
    {"id": 16, "name": "Sanjay Dutt", "email": "sanjay.dutt@nokia.com", "team": "Management", "subTeam": "PMO"},
    {"id": 17, "name": "Manoj Tiwary", "email": "manoj.tiwary@nokia.com", "team": "Management", "subTeam": "Delivery"},
    {"id": 18, "name": "Shalini Sen", "email": "shalini.sen@nokia.com", "team": "Management", "subTeam": "Delivery"},
]

# 2. Sprints data
sprints = [
    {"fb": "FB-21", "start": "2025-03-17", "end": "2025-03-28"},
    {"fb": "FB-22", "start": "2025-03-31", "end": "2025-04-11"},
    {"fb": "FB-23", "start": "2025-04-14", "end": "2025-04-25"},
    {"fb": "FB-24", "start": "2025-04-28", "end": "2025-05-09"},
    {"fb": "FB-25", "start": "2025-05-12", "end": "2025-05-23"},
    {"fb": "FB-26", "start": "2025-05-26", "end": "2025-06-06"},
]

# Nokia-relevant features
features = [
    {"desc": "5G Network Slice Provisioning", "act_descs": [
        "Design dynamic slicing allocation",
        "Implement slice lifecycle status API",
        "Test slice isolation policies",
        "Write documentation for slice profiles",
        "Perform slice capability security audit"
    ]},
    {"desc": "OSS Alarm Correlation Engine", "act_descs": [
        "Implement real-time alarm stream parser",
        "Design correlation rule database schema",
        "Perform load testing on alarm pipeline",
        "Code review alarm correlation logic",
        "Optimize Redis caching layer for correlation"
    ]},
    {"desc": "NFV Orchestration API", "act_descs": [
        "Develop NFV descriptor parser",
        "Implement VNF scaling webhook",
        "Create E2E tests for NFV deployment flow",
        "Draft VNF descriptor onboarding guide",
        "Verify network slice integration API"
    ]},
    {"desc": "Subscriber Data Management", "act_descs": [
        "Design Cassandra schema for profile storage",
        "Implement secure subscriber lookup API",
        "Write data retention compliance scripts",
        "Optimize read latency on query handler",
        "Review Subscriber profile encryption method"
    ]},
    {"desc": "Network Topology Visualizer", "act_descs": [
        "Develop link aggregation graph render",
        "Integrate topology updates over WebSockets",
        "Create unit tests for visual layout engine",
        "Optimize canvas rendering of 10k nodes",
        "Refine layout spacing on web visualizer"
    ]},
    {"desc": "BSS Billing Integration", "act_descs": [
        "Implement CDR records export parser",
        "Integrate secure OAuth client for billing service",
        "Perform billing rate calculation tests",
        "Audit financial rounding compliance",
        "Document invoice formatting configurations"
    ]},
    {"desc": "RAN Performance Analytics", "act_descs": [
        "Develop cell throughput aggregators",
        "Design time-series metrics data model",
        "Optimize SQL aggregation query performance",
        "Review cell analytics math formulas",
        "Implement analytics PDF export worker"
    ]},
    {"desc": "Core Network Fault Manager", "act_descs": [
        "Implement SNMP traps handler loop",
        "Write automatic system alert router",
        "Create failure injection QA test suite",
        "Review fault management secure access role",
        "Optimize trap message deserialization"
    ]},
    {"desc": "API Gateway Security Layer", "act_descs": [
        "Implement rate limiter using token bucket",
        "Design client certificate parser middleware",
        "Verify CORS configuration on key endpoints",
        "Audit OAuth scopes validation",
        "Load test security proxy headers"
    ]},
    {"desc": "Microservices Health Monitor", "act_descs": [
        "Build health probes aggregator daemon",
        "Design dashboard status indicators",
        "Integrate health metrics with Slack alerts",
        "Conduct service health failure tests",
        "Write microservices integration checklist"
    ]},
    {"desc": "Automated Regression Suite", "act_descs": [
        "Migrate legacy API integration tests",
        "Configure Parallel Jest runners in CI",
        "Implement test coverage report visualizer",
        "Analyze flakey network mock failures",
        "Review test coverage delta gating"
    ]},
    {"desc": "Capacity Planning Module", "act_descs": [
        "Develop capacity usage predictor engine",
        "Implement resource alert threshold rules",
        "Optimize database queries for long-term stats",
        "Write capacity planning admin user guide",
        "Review predictive resource math algorithms"
    ]},
    {"desc": "SLA Compliance Dashboard", "act_descs": [
        "Compute SLA monthly availability logic",
        "Develop visual SLA chart widgets",
        "Conduct QA validation of SLA metric math",
        "Verify SLA notification mailer integration",
        "Write compliance report query procedures"
    ]},
    {"desc": "CI/CD Pipeline Hardening", "act_descs": [
        "Implement static vulnerability scanning step",
        "Configure signed commits verification rule",
        "Fix container image tag digest locking",
        "Conduct review of dev server deployment permissions",
        "Document hardened pipeline guidelines"
    ]},
    {"desc": "Multi-Vendor Element Manager", "act_descs": [
        "Implement multi-vendor device profile parser",
        "Write device status check heartbeat logic",
        "Verify multi-vendor configuration commands parser",
        "Test device connection timeouts handling",
        "Review multi-vendor connection security rules"
    ]},
]

# Activity choices and weights
activities = ['Development', 'Design', 'Testing', 'DevOps', 'Analysis', 'Documentation', 'Code Review']
activity_weights = [0.40, 0.10, 0.20, 0.10, 0.08, 0.06, 0.06]

tasks = []
task_id_counter = 1

# We need every employee to appear in at least 2 sprints.
# Let's pre-assign each employee to specific sprints.
# With 18 employees and 6 sprints, we can make sure that each employee has:
# - Employee 1: FB-21, FB-22, FB-23, FB-24, FB-25, FB-26 (needs to be in all for complete coverage)
# - Other employees: distributed so they each get at least 2-3 sprints.
employee_sprint_matrix = {emp["id"]: [] for emp in employees}

# Force Employee 1 (Rishit Mahapatra) in all sprints so the demo employee user is active
for s in sprints:
    employee_sprint_matrix[1].append(s["fb"])

# Assign other employees to random sprints such that each employee is in at least 3 sprints,
# and each sprint has enough employees.
for emp_id in range(2, 19):
    selected_sprints = random.sample([s["fb"] for s in sprints], 3)
    employee_sprint_matrix[emp_id].extend(selected_sprints)

# Now, generate tasks per sprint
for s_idx, s in enumerate(sprints):
    sprint_name = s["fb"]
    sprint_num = sprint_name.split("-")[1]
    
    # Each sprint must have 12-16 tasks. Let's make it 14 tasks per sprint.
    num_tasks = 14
    
    # Get employees assigned to this sprint
    available_emps = [emp for emp in employees if sprint_name in employee_sprint_matrix[emp["id"]]]
    
    # Status distributions:
    # FB-21, 22, 23: mostly 'Done' (70–80%), some 'In Progress' (10–15%), few 'Blocked' (5–10%), almost no 'To Do'
    # FB-24: mix of all 4 statuses — 'Done' ~35%, 'In Progress' ~40%, 'Blocked' ~10%, 'To Do' ~15%
    # FB-25, 26: mostly 'To Do' (80–90%), a few 'In Progress'
    if sprint_name in ['FB-21', 'FB-22', 'FB-23']:
        # 14 tasks: 10 Done, 2 In Progress, 1 Blocked, 1 To Do
        status_list = ['Done'] * 10 + ['In Progress'] * 2 + ['Blocked'] * 1 + ['To Do'] * 1
    elif sprint_name == 'FB-24':
        # 14 tasks: 5 Done, 5 In Progress, 2 Blocked, 2 To Do
        status_list = ['Done'] * 5 + ['In Progress'] * 5 + ['Blocked'] * 2 + ['To Do'] * 2
    else: # FB-25, FB-26
        # 14 tasks: 12 To Do, 2 In Progress
        status_list = ['To Do'] * 12 + ['In Progress'] * 2

    random.shuffle(status_list)
    
    # Ensure every available employee gets at least one task in this sprint if possible
    shuffled_emps = list(available_emps)
    random.shuffle(shuffled_emps)
    
    for t_idx in range(num_tasks):
        # Pick employee (ensure round robin so everyone gets assigned, then fill randomly)
        if t_idx < len(shuffled_emps):
            emp = shuffled_emps[t_idx]
        else:
            emp = random.choice(available_emps)
            
        feature_id = f"F-{sprint_num}{t_idx+1:02d}"
        
        # Pick a feature description and matching activity description
        feat = random.choice(features)
        feature_desc = feat["desc"]
        activity_desc = random.choice(feat["act_descs"])
        
        # Pick activity type based on weights
        activity = random.choices(activities, weights=activity_weights, k=1)[0]
        
        # Status
        status = status_list[t_idx]
        
        # Effort hours
        est = random.randint(4, 16)
        
        # Spent calculation:
        # Done: ±30% of est
        # In Progress: 30-70% of est
        # Blocked: 10-30% of est
        # To Do: 0
        if status == 'Done':
            variance = random.uniform(-0.30, 0.30)
            spent = round(est * (1.0 + variance), 1)
            # Ensure spent is at least 0.5 and not 0 for Done tasks
            spent = max(0.5, spent)
        elif status == 'In Progress':
            pct = random.uniform(0.30, 0.70)
            spent = round(est * pct, 1)
            spent = max(0.5, spent)
        elif status == 'Blocked':
            pct = random.uniform(0.10, 0.30)
            spent = round(est * pct, 1)
            spent = max(0.5, spent)
        else: # To Do
            spent = 0.0
            
        tasks.append({
            "id": task_id_counter,
            "fb": sprint_name,
            "empId": emp["id"],
            "featureId": feature_id,
            "featureDesc": feature_desc,
            "activity": activity,
            "description": activity_desc,
            "status": status,
            "est": est,
            "spent": spent
        })
        task_id_counter += 1

# Check compliance:
# "Every employee must appear in at least 2 sprints"
emp_sprint_counts = {emp["id"]: set() for emp in employees}
for t in tasks:
    emp_sprint_counts[t["empId"]].add(t["fb"])

non_compliant_emps = [emp_id for emp_id, s_set in emp_sprint_counts.items() if len(s_set) < 2]
if non_compliant_emps:
    print(f"WARNING: Non-compliant employees with < 2 sprints: {non_compliant_emps}")
else:
    print("SUCCESS: All employees appear in at least 2 sprints!")

# Write generated data to data.js
data_js_content = f"""/**
 * data.js — Nokia Sprint Platform Phase 1
 * ─────────────────────────────────────────
 * Richly generated synthetic data representing realistic telecom software sprints.
 * Matches schema required by the Sprint Management Dashboard UI.
 */

// ── EMPLOYEE DATA ──────────────────────────────────────────────────────────
const EMPLOYEES = {json.dumps(employees, indent=2)};

// ── SPRINT DATES ───────────────────────────────────────────────────────────
const SPRINTS = {json.dumps(sprints, indent=2)};

// ── TASK / SPRINT PLANNING DATA ────────────────────────────────────────────
const TASKS = {json.dumps(tasks, indent=2)};

// ── ACTIVE SPRINT ──────────────────────────────────────────────────────────
const ACTIVE_SPRINT = 'FB-24';

// ── LOGGED-IN USER (in a real app this comes from auth) ───────────────────
const DEMO_USERS = {{
  manager:  {{ empId: null, name: 'Manager',          initials: 'MG' }},
  employee: {{ empId: 1,    name: 'Rishit Mahapatra', initials: 'RM' }},
}};
"""

with open('../public/data.js', 'w', encoding='utf-8') as f:
    f.write(data_js_content)

print(f"Generated {len(tasks)} tasks.")
