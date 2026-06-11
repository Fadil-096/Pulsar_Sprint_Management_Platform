import re

# ─── 1. Rewrite app.js ───────────────────────────────────────────────────────
with open(r'public\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Helper function to get icons for tabs
get_icon_fn = """function getIconForTab(id) {
  const icons = {
    'dashboard': '📊',
    'sprints': '🗓️',
    'tasks': '✅',
    'employees': '👥',
    'reports': '📄',
    'my-tasks': '✅',
    'log-task': '➕',
    'progress': '📈',
  };
  return icons[id] || '•';
}"""

# Insert getIconForTab helper function near the top or before renderLoginPage
js = js.replace("let state = {", get_icon_fn + "\n\nlet state = {")

# Nokia SVG logos
nokia_svg_white = (
    '<svg viewBox="0 0 230 70" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:38px;width:auto;display:block">'
    '<polygon points="10,10 10,60 20,60 20,28 40,60 50,60 50,10 40,10 40,42 20,10" fill="#fff"/>'
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M 79,10 C 90.6,10 100,21.2 100,35 C 100,48.8 90.6,60 79,60 C 67.4,60 58,48.8 58,35 C 58,21.2 67.4,10 79,10 Z M 79,20 C 84.5,20 89,26.7 89,35 C 89,43.3 84.5,50 79,50 C 73.5,50 69,43.3 69,35 C 69,26.7 73.5,20 79,20 Z" fill="#fff"/>'
    '<polygon points="108,10 108,60 118,60 118,38 134,60 146,60 125,33 144,10 132,10 118,29 118,10" fill="#fff"/>'
    '<rect x="154" y="10" width="10" height="50" fill="#fff"/>'
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M 189,10 L 199,10 L 216,60 L 204,60 L 199,45 L 189,45 L 184,60 L 172,60 Z M 194,20 L 199,35 L 189,35 Z" fill="#fff"/>'
    '</svg>'
)

nokia_svg_topbar = (
    '<svg viewBox="0 0 230 70" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:18px;width:auto;display:block">'
    '<polygon points="10,10 10,60 20,60 20,28 40,60 50,60 50,10 40,10 40,42 20,10" fill="#fff"/>'
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M 79,10 C 90.6,10 100,21.2 100,35 C 100,48.8 90.6,60 79,60 C 67.4,60 58,48.8 58,35 C 58,21.2 67.4,10 79,10 Z M 79,20 C 84.5,20 89,26.7 89,35 C 89,43.3 84.5,50 79,50 C 73.5,50 69,43.3 69,35 C 69,26.7 73.5,20 79,20 Z" fill="#fff"/>'
    '<polygon points="108,10 108,60 118,60 118,38 134,60 146,60 125,33 144,10 132,10 118,29 118,10" fill="#fff"/>'
    '<rect x="154" y="10" width="10" height="50" fill="#fff"/>'
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M 189,10 L 199,10 L 216,60 L 204,60 L 199,45 L 189,45 L 184,60 L 172,60 Z M 194,20 L 199,35 L 189,35 Z" fill="#fff"/>'
    '</svg>'
)

new_login_fn = r"""function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div id="loginView">
      <div class="login-left-pane">
        <div class="login-left-content">
          <div class="login-logo-large">
            """ + nokia_svg_white + r"""
            <span class="logo-divider-vertical"></span>
            <span class="logo-sprint-text">Sprint</span>
          </div>
          <p class="login-tagline">Connecting People. Delivering Results.</p>
        </div>
      </div>
      <div class="login-right-pane">
        <div class="login-form-wrap">
          <h2 class="login-form-heading">Sign In</h2>
          <p class="login-form-subheading">Use your Nokia work account credentials</p>

          <div class="field">
            <label for="loginEmail">Email Address</label>
            <input type="email" id="loginEmail" value="manager@nokia.com" placeholder="name@nokia.com" autocomplete="email" />
          </div>

          <div class="field">
            <div class="login-field-header">
              <label for="loginPass">Password</label>
              <a href="#" class="forgot-link" onclick="return false">Forgot Password?</a>
            </div>
            <input type="password" id="loginPass" value="password" placeholder="••••••••" autocomplete="current-password" />
          </div>

          <div class="field">
            <label>Select Role</label>
            <div class="role-segmented-control">
              <label class="role-segment active" id="roleManagerOpt">
                <input type="radio" name="loginRole" value="manager" checked onclick="selectRole('manager')" />
                <span>Manager</span>
              </label>
              <label class="role-segment" id="roleEmployeeOpt">
                <input type="radio" name="loginRole" value="employee" onclick="selectRole('employee')" />
                <span>Employee</span>
              </label>
            </div>
          </div>

          <button class="btn btn-primary btn-full btn-login" onclick="doLogin()">Sign In</button>
        </div>
      </div>
    </div>
  `;
}"""

# Replace renderLoginPage function
pattern = r'function renderLoginPage\(\) \{.*?^\}'
js = re.sub(pattern, new_login_fn, js, flags=re.DOTALL | re.MULTILINE)

new_select_role_fn = r"""function selectRole(r) {
  state.role = r;
  const mo = document.getElementById('roleManagerOpt');
  const eo = document.getElementById('roleEmployeeOpt');
  if (mo) mo.classList.toggle('active', r === 'manager');
  if (eo) eo.classList.toggle('active', r === 'employee');
}"""

# Replace selectRole function
pattern_role = r'function selectRole\(r\) \{.*?^\}'
js = re.sub(pattern_role, new_select_role_fn, js, flags=re.DOTALL | re.MULTILINE)

# Replace buildShell function
new_build_shell_fn = r"""function buildShell() {
  const managerTabs = [
    { id: 'dashboard',  label: 'Dashboard'  },
    { id: 'sprints',    label: 'Sprints'    },
    { id: 'tasks',      label: 'All Tasks'  },
    { id: 'employees',  label: 'Team'       },
    { id: 'reports',    label: 'Reports'    },
  ];
  const employeeTabs = [
    { id: 'my-tasks',  label: 'My Tasks'    },
    { id: 'log-task',  label: 'Log Task'    },
    { id: 'progress',  label: 'My Progress' },
  ];
  const tabs = state.role === 'manager' ? managerTabs : employeeTabs;
  const u = state.user;

  document.getElementById('app').innerHTML = `
    <div id="mainView">
      <div class="topbar">
        <div class="topbar-logo">
          """ + nokia_svg_topbar + r"""
          <span class="logo-divider"></span>
          <span class="logo-sprint">Sprint</span>
        </div>
        <div class="topbar-right">
          <span class="role-topbadge">${state.role === 'manager' ? 'Manager' : 'Employee'}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar">${u.initials}</div>
            <span style="font-size:13px;font-weight:500;color:#FFFFFF">${u.name}</span>
          </div>
          <button class="btn btn-sm" onclick="doLogout()">Sign out</button>
        </div>
      </div>
      <div class="main-layout-row">
        <div class="sidebar" id="sidebar">
          <div class="sidebar-section-title">Navigation</div>
          ${tabs.map(t => `<button class="nav-tab" id="tab-${t.id}" onclick="showTab('${t.id}')">${getIconForTab(t.id)} <span class="nav-label">${t.label}</span></button>`).join('')}
        </div>
        <div class="content" id="content"></div>
      </div>
    </div>
  `;
}"""

pattern_shell = r'function buildShell\(\) \{.*?^\}'
js = re.sub(pattern_shell, new_build_shell_fn, js, flags=re.DOTALL | re.MULTILINE)

# Restyle Chart.js init methods in app.js
new_dashboard_charts = r"""function initDashboardCharts() {
  renderHeatmap();

  const active = TASKS.filter(t => t.fb === ACTIVE_SPRINT);
  const total  = active.length;

  // Burndown
  makeChart('burndownChart', {
    type: 'line',
    data: {
      labels: ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10'],
      datasets: [
        {
          label: 'Ideal',
          data: Array.from({length: 10}, (_, i) => +(total - (total / 9) * i).toFixed(1)),
          borderColor: '#CCCCCC',
          borderDash: [5, 4],
          tension: 0.1,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Actual',
          data: [total, total, total - 1, total - 1, total - 2, total - 2, total - 3, null, null, null],
          borderColor: '#005AFF',
          backgroundColor: 'rgba(0, 90, 255, 0.05)',
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#005AFF',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#FFFFFF' }, ticks: { color: '#0D0D0D' } },
        x: { grid: { color: '#FFFFFF' }, ticks: { color: '#0D0D0D' } },
      },
    },
  });

  // Status donut
  const counts = ['Done','In Progress','Blocked','To Do'].map(s => active.filter(t => t.status === s).length);
  makeChart('statusChart', {
    type: 'doughnut',
    data: {
      labels: ['Done','In Progress','Blocked','To Do'],
      datasets: [{ data: counts, backgroundColor: ['#007A4D','#005AFF','#CC0000','#6B6B6B'], borderWidth: 0, hoverOffset: 4 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '68%' },
  });

  // Effort bars
  const names  = EMPLOYEES.slice(0, 4).map(e => e.name.split(' ')[0]);
  const ests   = EMPLOYEES.slice(0, 4).map(e => TASKS.filter(t => t.empId === e.id).reduce((a,t) => a + t.est, 0));
  const spents = EMPLOYEES.slice(0, 4).map(e => TASKS.filter(t => t.empId === e.id).reduce((a,t) => a + t.spent, 0));
  makeChart('effortChart', {
    type: 'bar',
    data: {
      labels: names,
      datasets: [
        { label: 'Estimated', data: ests,   backgroundColor: '#00B4FF', borderRadius: 0 },
        { label: 'Spent',     data: spents, backgroundColor: '#005AFF', borderRadius: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#FFFFFF' }, ticks: { color: '#0D0D0D' } },
        x: { grid: { display: false }, ticks: { color: '#0D0D0D' } },
      },
    },
  });
}"""

pattern_db_charts = r'function initDashboardCharts\(\) \{.*?^\}'
js = re.sub(pattern_db_charts, new_dashboard_charts, js, flags=re.DOTALL | re.MULTILINE)

new_report_charts = r"""function initReportCharts() {
  // Velocity trend
  const vels = SPRINTS.map(s => {
    const st = TASKS.filter(t => t.fb === s.fb);
    return st.length ? Math.round((st.filter(t => t.status === 'Done').length / st.length) * 100) : null;
  });
  makeChart('velocityChart', {
    type: 'line',
    data: {
      labels: SPRINTS.map(s => s.fb),
      datasets: [
        { label: 'Velocity %', data: vels, borderColor: '#005AFF', backgroundColor: 'rgba(0, 90, 255, 0.05)', tension: 0.3, pointRadius: 5, pointBackgroundColor: '#005AFF', fill: true },
        { label: 'Target',     data: SPRINTS.map(() => 70), borderColor: '#CCCCCC', borderDash: [5,4], pointRadius: 0, fill: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: '#FFFFFF' }, ticks: { color: '#0D0D0D' } },
        x: { grid: { display: false }, ticks: { color: '#0D0D0D' } },
      },
    },
  });

  // Accuracy
  const names = EMPLOYEES.map(e => e.name.split(' ')[0]);
  const acc   = EMPLOYEES.map(e => {
    const et = TASKS.filter(t => t.empId === e.id);
    const est = et.reduce((a,t) => a + t.est, 0);
    const spt = et.reduce((a,t) => a + t.spent, 0);
    return est ? Math.max(0, Math.round((1 - Math.abs(spt - est) / est) * 100)) : 100;
  });
  makeChart('accuracyChart', {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{ data: acc, backgroundColor: '#00D4A0', borderRadius: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: '#FFFFFF' }, ticks: { color: '#0D0D0D' } },
        x: { grid: { display: false }, ticks: { color: '#0D0D0D' } },
      },
    },
  });
}"""

pattern_report_charts = r'function initReportCharts\(\) \{.*?^\}'
js = re.sub(pattern_report_charts, new_report_charts, js, flags=re.DOTALL | re.MULTILINE)

new_progress_charts = r"""function initProgressCharts() {
  const me      = EMPLOYEES.find(e => e.id === (state.user.empId || 1));
  const myTasks = TASKS.filter(t => t.empId === me.id);

  makeChart('myEffortChart', {
    type: 'bar',
    data: {
      labels: myTasks.map(t => t.featureId),
      datasets: [
        { label: 'Estimated', data: myTasks.map(t => t.est),   backgroundColor: '#00B4FF', borderRadius: 0 },
        { label: 'Spent',     data: myTasks.map(t => t.spent), backgroundColor: '#005AFF', borderRadius: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#FFFFFF' }, ticks: { color: '#0D0D0D' } },
        x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 30, color: '#0D0D0D' } },
      },
    },
  });

  const counts = ['Done','In Progress','Blocked','To Do'].map(s => myTasks.filter(t => t.status === s).length);
  makeChart('myStatusChart', {
    type: 'doughnut',
    data: {
      labels: ['Done','In Progress','Blocked','To Do'],
      datasets: [{ data: counts, backgroundColor: ['#007A4D','#005AFF','#CC0000','#6B6B6B'], borderWidth: 0, hoverOffset: 4 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '68%',
    },
  });
}"""

pattern_progress_charts = r'function initProgressCharts\(\) \{.*?^\}'
js = re.sub(pattern_progress_charts, new_progress_charts, js, flags=re.DOTALL | re.MULTILINE)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("app.js rewritten successfully!")
