import pandas as pd
import random
from datetime import datetime, timedelta

# Set seed for reproducibility
random.seed(123)

# 1. Employee Data
# 15 employees total
employees_list = [
    # Core
    {"Employee Name": "Mikko Virtanen", "Employee Email ID": "mikko.virtanen@nokia.com", "Team": "Core", "Sub Team": "Backend"},
    {"Employee Name": "Aditya Patel", "Employee Email ID": "aditya.patel@nokia.com", "Team": "Core", "Sub Team": "Backend"},
    {"Employee Name": "Elena Petrova", "Employee Email ID": "elena.petrova@nokia.com", "Team": "Core", "Sub Team": "Frontend"},
    # Platform
    {"Employee Name": "Matti Korhonen", "Employee Email ID": "matti.korhonen@nokia.com", "Team": "Platform", "Sub Team": "DevOps"},
    {"Employee Name": "Sneha Rao", "Employee Email ID": "sneha.rao@nokia.com", "Team": "Platform", "Sub Team": "QA"},
    {"Employee Name": "Lukas Schmidt", "Employee Email ID": "lukas.schmidt@nokia.com", "Team": "Platform", "Sub Team": "QA"},
    # Management
    {"Employee Name": "Kaisa Laine", "Employee Email ID": "kaisa.laine@nokia.com", "Team": "Management", "Sub Team": "Strategy"},
    {"Employee Name": "Rajesh Nair", "Employee Email ID": "rajesh.nair@nokia.com", "Team": "Management", "Sub Team": "PMO"},
    # Network
    {"Employee Name": "Antti Koskinen", "Employee Email ID": "antti.koskinen@nokia.com", "Team": "Network", "Sub Team": "Infrastructure"},
    {"Employee Name": "Sandeep Sharma", "Employee Email ID": "sandeep.sharma@nokia.com", "Team": "Network", "Sub Team": "Infrastructure"},
    {"Employee Name": "Sofia Fischer", "Employee Email ID": "sofia.fischer@nokia.com", "Team": "Network", "Sub Team": "Cloud"},
    {"Employee Name": "Jan Virtanen", "Employee Email ID": "jan.virtanen@nokia.com", "Team": "Network", "Sub Team": "Cloud"},
    # Security
    {"Employee Name": "Ville Nieminen", "Employee Email ID": "ville.nieminen@nokia.com", "Team": "Security", "Sub Team": "AppSec"},
    {"Employee Name": "Jyoti Mishra", "Employee Email ID": "jyoti.mishra@nokia.com", "Team": "Security", "Sub Team": "AppSec"},
    {"Employee Name": "Markus Meyer", "Employee Email ID": "markus.meyer@nokia.com", "Team": "Security", "Sub Team": "Compliance"},
]
df_employees = pd.DataFrame(employees_list)

# 2. Sprint Date Data
# 6 sprints: FB-23 to FB-28
# 10 working days each (Monday to Friday, 2 weeks)
# Starts 2025-04-14
start_date = datetime.strptime("2025-04-14", "%Y-%m-%d")
sprints_list = []
current_start = start_date

for i in range(23, 29):
    fb = f"FB-{i}"
    # Sprint runs Monday to Friday of the second week (12 days total duration: Start is day 0, End is day 11)
    # E.g. FB-23 starts Mon 2025-04-14, ends Fri 2025-04-25
    current_end = current_start + timedelta(days=11)
    sprints_list.append({
        "FB": fb,
        "Start": current_start.strftime("%Y-%m-%d"),
        "End": current_end.strftime("%Y-%m-%d")
    })
    # Next sprint starts on the Monday after this sprint ends (which is 14 days after current_start)
    current_start = current_start + timedelta(days=14)

df_sprints = pd.DataFrame(sprints_list)

# 3. Sprint Planning Data
# ~8-10 tasks per sprint. Let's make exactly 9 tasks per sprint (54 rows total).
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

# Generate 9 tasks per sprint
for s in sprints_list:
    fb = s["FB"]
    sprint_num = int(fb.split("-")[1])
    
    # Status rules per sprint
    if sprint_num in [23, 24, 25]: # Past
        # 9 tasks: 7 Done, 1 In Progress, 1 Blocked
        statuses = ["Done"] * 7 + ["In Progress"] * 1 + ["Blocked"] * 1
    elif sprint_num == 26: # Active
        # 9 tasks: 3 Done, 3 In Progress, 1 Blocked, 2 To Do
        statuses = ["Done"] * 3 + ["In Progress"] * 3 + ["Blocked"] * 1 + ["To Do"] * 2
    else: # Future (27, 28)
        # 9 tasks: 7 To Do, 2 In Progress
        statuses = ["To Do"] * 7 + ["In Progress"] * 2
        
    random.shuffle(statuses)
    
    # Randomly select 9 employees to assign tasks to in this sprint (no duplicates in the same sprint)
    assigned_employees = random.sample(employees_list, 9)
    
    # Randomly select features (a feature can span multiple tasks)
    for idx, emp in enumerate(assigned_employees):
        feat = random.choice(features)
        
        # Decide an activity type based on team roles for realism:
        # Network/Platform/Security Team get DevOps/Testing/Security tasks
        # Core gets Development/Design
        # Management gets Analysis/Documentation
        team = emp["Team"]
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
            
        # Get specific activity description
        activity_desc = feat["act_descs"].get(activity, f"Perform {activity.lower()} for {feat['desc'].lower()}")
        
        status = statuses[idx]
        
        # Est Effort (3 to 16)
        est = random.randint(3, 16)
        
        # Spent Effort:
        # Done: within ±20% of est
        # In Progress: 30-70% of est
        # Blocked: 10-30% of est
        # To Do: 0
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
            
        planning_list.append({
            "FB": fb,
            "Employee Name": emp["Employee Name"],
            "Feature ID": feat["id"],
            "Feature Description": feat["desc"],
            "Activity Type": activity,
            "Activity Description": activity_desc,
            "Activity Status": status,
            "Est Effort": est,
            "Spent Effort": spent
        })

df_planning = pd.DataFrame(planning_list)

# Write to Excel workbook
output_path = "../public/sprint_data.xlsx"
with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
    df_employees.to_excel(writer, sheet_name="Employee_data", index=False)
    df_sprints.to_excel(writer, sheet_name="Sprint_Date", index=False)
    df_planning.to_excel(writer, sheet_name="Sprint_Planning", index=False)

print(f"Excel file successfully generated at {output_path}")
print(f"Employees: {len(df_employees)}, Sprints: {len(df_sprints)}, Tasks: {len(df_planning)}")
