import re

filepath = 'c:\\Users\\fadil\\Downloads\\nokia sprint\\nokia-sprint\\public\\app.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix escaped backticks and interpolation
content = content.replace('\\`', '`')
content = content.replace('\\$', '$')

# Check if '/login' route is missing
if "router.add('/login'" not in content:
    # Add it right before the router.init() call or at the end
    login_route = """
router.add('/login', window.renderLoginPage);

// ── Start Router ─────────────────────────────────────────────────────────
"""
    if "// ── Start Router" in content:
        content = content.replace("// ── Start Router", login_route.strip())
    else:
        content += "\n" + login_route

# Make sure router.add('/manager/dashboard', window.renderManagerDashboard) exists too
if "router.add('/manager/dashboard'" not in content:
    dashboard_route = """
router.add('/manager/dashboard', window.renderManagerDashboard);
"""
    if "router.add('/login'" in content:
        content = content.replace("router.add('/login', window.renderLoginPage);", "router.add('/login', window.renderLoginPage);\n" + dashboard_route)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
