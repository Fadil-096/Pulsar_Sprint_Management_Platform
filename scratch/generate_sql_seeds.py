import random
from datetime import datetime, timedelta

# Set seed for reproducibility
random.seed(123)

# 1. Employee Data (15 employees)
employees_list = [
    # Core
    {"name": "Mikko Virtanen", "email": "mikko.virtanen@nokia.com", "team": "Core", "sub_team": "Backend"},
    {"name": "Aditya Patel", "email": "aditya.patel@nokia.com", "team": "Core", "sub_team": "Backend"},
    {"name": "Elena Petrova", "email": "elena.petrova@nokia.com", "team": "Core", "sub_team": "Frontend"},
    # Platform
    {"name": "Matti Korhonen", "email": "matti.korhonen@nokia.com", "team": "Platform", "sub_team": "DevOps"},
    {"name": "Sneha Rao", "email": "sneha.rao@nokia.com", "team": "Platform", "sub_team": "QA"},
    {"name": "Lukas Schmidt", "email": "lukas.schmidt@nokia.com", "team": "Platform", "sub_team": "QA"},
    # Management
    {"name": "Kaisa Laine", "email": "kaisa.laine@nokia.com", "team": "Management", "sub_team": "Strategy"},
    {"name": "Rajesh Nair", "email": "rajesh.nair@nokia.com", "team": "Management", "sub_team": "PMO"},
    # Network
    {"name": "Antti Koskinen", "email": "antti.koskinen@nokia.com", "team": "Network", "sub_team": "Infrastructure"},
    {"name": "Sandeep Sharma", "email": "sandeep.sharma@nokia.com", "team": "Network", "sub_team": "Infrastructure"},
    {"name": "Sofia Fischer", "email": "sofia.fischer@nokia.com", "team": "Network", "sub_team": "Cloud"},
    {"name": "Jan Virtanen", "email": "jan.virtanen@nokia.com", "team": "Network", "sub_team": "Cloud"},
    # Security
    {"name": "Ville Nieminen", "email": "ville.nieminen@nokia.com", "team": "Security", "sub_team": "AppSec"},
    {"name": "Jyoti Mishra", "email": "jyoti.mishra@nokia.com", "team": "Security", "sub_team": "AppSec"},
    {"name": "Markus Meyer", "email": "markus.meyer@nokia.com", "team": "Security", "sub_team": "Compliance"},
]

# 2. Sprint Date Data (6 sprints: FB-23 to FB-28)
start_date = datetime.strptime("2025-04-14", "%Y-%m-%d")
sprints_list = []
current_start = start_date

for i in range(23, 29):
    fb = f"FB-{i}"
    current_end = current_start + timedelta(days=11)
    sprints_list.append({
        "fb": fb,
        "start": current_start.strftime("%Y-%m-%d"),
        "end": current_end.strftime("%Y-%m-%d")
    })
    current_start = current_start + timedelta(days=14)

# 3. Features & Tasks details
features = [
    {"desc": "5G RAN Controller", "id": "F-101", "act_descs": {
        "Development": "Implement gRPC interface for RAN controller",
        "Design": "Create packet prioritization flow architecture",
        "Testing": "Validate latency bounds under heavy traffic load",
        "DevOps": "Set up low-latency kernel configurations on testing nodes",
        "Analysis": "Compare throughput stats against competitor platforms",
        "Documentation": "Draft RAN connection configuration manuals"
    }},
    {"desc": "Network Slice Manager", "id": "F-102", "act_descs": {
        "Development": "Implement slice state transition API endpoints",
        "Design": "Map resource reservation strategy for multi-tenancy",
        "Testing": "Run E2E isolation validation test scripts",
        "DevOps": "Configure Kubernetes slice resource quotas",
        "Analysis": "Assess slice allocation efficiency metrics",
        "Documentation": "Document OSS interface for slice orchestration"
    }},
    {"desc": "OSS Integration Layer", "id": "F-103", "act_descs": {
        "Development": "Build Kafka message consumers for node notifications",
        "Design": "Model Unified Event Schema for Nokia OSS integrations",
        "Testing": "Validate data integrity across event correlation pipeline",
        "DevOps": "Deploy dedicated Kafka cluster nodes via Helm charts",
        "Analysis": "Analyze event serialization overhead statistics",
        "Documentation": "Publish REST API schemas for integration partners"
    }},
    {"desc": "Alarm Management UI", "id": "F-104", "act_descs": {
        "Development": "Build virtualized scroll list view for 10k alerts",
        "Design": "Refine alert color codes and grouping layouts",
        "Testing": "Write automation test coverage for alert filter states",
        "DevOps": "Deploy Frontend assets to corporate CDN servers",
        "Analysis": "Analyze user interactions on alarms panel",
        "Documentation": "Draft alarm manager user handbook"
    }},
    {"desc": "SLA Monitoring Dashboard", "id": "F-105", "act_descs": {
        "Development": "Implement monthly uptime percentage math calculator",
        "Design": "Draw mockups for target metrics and SLA breaches panel",
        "Testing": "QA test warning alert triggers on SLA violation mocks",
        "DevOps": "Set up Grafana alerts integration with system notifications",
        "Analysis": "Audit customer SLA report accuracy",
        "Documentation": "Publish compliance verification procedures manual"
    }},
    {"desc": "API Gateway Refactor", "id": "F-106", "act_descs": {
        "Development": "Implement token bucket rate limiter in Go",
        "Design": "Design gateway request caching topology",
        "Testing": "Load test API Gateway against 50k RPS",
        "DevOps": "Set up service mesh configurations for gateway routing",
        "Analysis": "Measure Gateway latency overhead per microservice",
        "Documentation": "Document security policies and auth token structures"
    }},
    {"desc": "Cloud Native Migration", "id": "F-107", "act_descs": {
        "Development": "Migrate stateful file persistence to S3 storage API",
        "Design": "Architect stateless deployment patterns for Core services",
        "Testing": "Perform disaster recovery simulation audits",
        "DevOps": "Create AWS cloud formation scripts for core stack",
        "Analysis": "Evaluate cloud infrastructure cost efficiency details",
        "Documentation": "Write Kubernetes migration roadmap guidelines"
    }},
    {"desc": "Security Audit Module", "id": "F-108", "act_descs": {
        "Development": "Implement encryption at rest on Cassandra databases",
        "Design": "Map secure role-based access control (RBAC) scopes",
        "Testing": "Conduct automated pen testing on login endpoints",
        "DevOps": "Add Static Application Security Testing (SAST) to CI",
        "Analysis": "Assess vulnerability reports from scanner runs",
        "Documentation": "Update compliance and audit readiness policies"
    }},
    {"desc": "Performance Analytics Engine", "id": "F-109", "act_descs": {
        "Development": "Optimize ClickHouse time-series metric aggregations",
        "Design": "Design pre-aggregated counters for fast historical reads",
        "Testing": "Write integration test suite for KPI aggregators",
        "DevOps": "Configure DB sharding and replication properties",
        "Analysis": "Investigate CPU utilization bottlenecks on aggregators",
        "Documentation": "Document analytics DB architecture diagrams"
    }},
    {"desc": "Device Onboarding Service", "id": "F-110", "act_descs": {
        "Development": "Write automatic provisioning script for incoming hardware",
        "Design": "Define device registration schema and state machine",
        "Testing": "Verify retry logic on failed hardware registrations",
        "DevOps": "Deploy device registrar container in secure DMZ network",
        "Analysis": "Identify hardware onboarding timeout exceptions",
        "Documentation": "Create onboarding manual for network administrators"
    }},
]

planning_list = []

# Generate SQL insert statements
sql_output = []

sql_output.append("-- Seed data for Nokia Sprint Platform SQLite database\n")
sql_output.append("-- 1. Insert Employees")
for emp in employees_list:
    sql_output.append(
        f"INSERT INTO employees (name, email, team, sub_team) VALUES "
        f"('{emp['name']}', '{emp['email']}', '{emp['team']}', '{emp['sub_team']}');"
    )

sql_output.append("\n-- 2. Insert Sprints")
for spr in sprints_list:
    sql_output.append(
        f"INSERT INTO sprints (fb, start, end) VALUES "
        f"('{spr['fb']}', '{spr['start']}', '{spr['end']}');"
    )

# 1-based ID index lookup for employee name
emp_name_to_id = {emp["name"]: idx + 1 for idx, emp in enumerate(employees_list)}

sql_output.append("\n-- 3. Insert Tasks")
for s in sprints_list:
    fb = s["fb"]
    sprint_num = int(fb.split("-")[1])
    
    # Status rules per sprint
    if sprint_num in [23, 24, 25]: # Past
        statuses = ["Done"] * 7 + ["In Progress"] * 1 + ["Blocked"] * 1
    elif sprint_num == 26: # Active
        statuses = ["Done"] * 3 + ["In Progress"] * 3 + ["Blocked"] * 1 + ["To Do"] * 2
    else: # Future (27, 28)
        statuses = ["To Do"] * 7 + ["In Progress"] * 2
        
    random.shuffle(statuses)
    
    assigned_employees = random.sample(employees_list, 9)
    
    for idx, emp in enumerate(assigned_employees):
        feat = random.choice(features)
        
        team = emp["team"]
        if team == "Core":
            activity = random.choice(["Development", "Design", "Testing"])
        elif team == "Platform":
            activity = random.choice(["DevOps", "Testing", "Analysis"])
        elif team == "Management":
            activity = random.choice(["Analysis", "Documentation"])
        elif team == "Network":
            activity = random.choice(["DevOps", "Development", "Design"])
        else: # Security
            activity = random.choice(["Testing", "Documentation", "Analysis"])
            
        activity_desc = feat["act_descs"].get(activity, f"Perform {activity.lower()} for {feat['desc'].lower()}")
        status = statuses[idx]
        est = random.randint(3, 16)
        
        if status == "Done":
            factor = random.uniform(0.80, 1.20)
            spent = round(est * factor, 1)
            spent = max(0.5, spent)
        elif status == "In Progress":
            factor = random.uniform(0.30, 0.70)
            spent = round(est * factor, 1)
            spent = max(0.5, spent)
        elif status == "Blocked":
            factor = random.uniform(0.10, 0.30)
            spent = round(est * factor, 1)
            spent = max(0.5, spent)
        else: # To Do
            spent = 0.0
            
        emp_id = emp_name_to_id[emp["name"]]
        
        # Escape single quotes in strings
        esc_desc = feat['desc'].replace("'", "''")
        esc_act_desc = activity_desc.replace("'", "''")
        
        sql_output.append(
            f"INSERT INTO tasks (fb, emp_id, feature_id, feature_desc, activity, description, status, est_effort, spent_effort) VALUES "
            f"('{fb}', {emp_id}, '{feat['id']}', '{esc_desc}', '{activity}', '{esc_act_desc}', '{status}', {est}, {spent});"
        )

# Write to db/seed.sql
with open("../db/seed.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_output) + "\n")

print("Generated db/seed.sql successfully!")
print(f"Employees: {len(employees_list)}, Sprints: {len(sprints_list)}, Tasks: {len(sql_output) - len(employees_list) - len(sprints_list) - 5}")
