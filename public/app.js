/**
 * app.js — Nokia Sprint Management Platform
 * Frontend SPA Logic
 */

// ── UTILITIES ────────────────────────────────────────────────────────────
function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── ROUTER ───────────────────────────────────────────────────────────────
const router = {
  routes: {},
  currentPath: '',
  
  add(path, handler) {
    this.routes[path] = handler;
  },
  
  navigate(path) {
    if (this.currentPath === path) return;
    this.currentPath = path;
    
    // Check auth
    const user = api.getCurrentUser();
    if (!user && path !== '/login') {
      return this.navigate('/login');
    }
    if (user && path === '/login') {
      return this.navigate(user.role === 'manager' ? '/manager/dashboard' : '/employee/tasks');
    }

    // Role protection
    if (user && path.startsWith('/manager') && user.role !== 'manager') {
      return this.navigate('/employee/tasks');
    }
    if (user && path.startsWith('/employee') && user.role !== 'employee') {
      return this.navigate('/manager/dashboard');
    }

    const handler = this.routes[path] || this.routes['*'];
    if (handler) {
      window.history.pushState({}, '', '#' + path);
      handler();
      this.updateActiveNav();
    }
  },

  updateActiveNav() {
    document.querySelectorAll('.nav-tab').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('data-path') === this.currentPath) {
        el.classList.add('active');
      }
    });
  },

  init() {
    window.addEventListener('popstate', () => {
      const path = window.location.hash.slice(1) || '/';
      this.navigate(path === '/' ? (api.getCurrentUser() ? (api.getCurrentUser().role === 'manager' ? '/manager/dashboard' : '/employee/tasks') : '/login') : path);
    });
    
    const path = window.location.hash.slice(1) || '/';
    this.navigate(path === '/' ? (api.getCurrentUser() ? (api.getCurrentUser().role === 'manager' ? '/manager/dashboard' : '/employee/tasks') : '/login') : path);
  }
};

// ── LAYOUT ───────────────────────────────────────────────────────────────
function renderLayout(contentHTML) {
  const user = api.getCurrentUser();
  if (!user) return;

  const appEl = document.getElementById('app');
  const roleBadge = user.role === 'manager' ? 'MANAGER' : 'EMPLOYEE';
  
  const managerNav = `
    <button class="nav-tab" data-path="/manager/dashboard" onclick="router.navigate('/manager/dashboard')">
      <span>Dashboard</span>
    </button>
    <button class="nav-tab" data-path="/manager/sprints" onclick="router.navigate('/manager/sprints')">
      <span>Sprints</span>
    </button>
    <button class="nav-tab" data-path="/manager/tasks" onclick="router.navigate('/manager/tasks')">
      <span>All Tasks</span>
    </button>
    <button class="nav-tab" data-path="/manager/team" onclick="router.navigate('/manager/team')">
      <span>Team</span>
    </button>
    <button class="nav-tab" data-path="/manager/leaves" onclick="router.navigate('/manager/leaves')">
      <span>Leaves</span>
    </button>
    <button class="nav-tab" data-path="/manager/reports" onclick="router.navigate('/manager/reports')">
      <span>Reports</span>
    </button>
    <button class="nav-tab" data-path="/manager/notifications" onclick="router.navigate('/manager/notifications')">
      <span>Notifications <span id="nav-badge" class="badge badge-manager" style="display:none;margin-left:auto">0</span></span>
    </button>
  `;

  const employeeNav = `
    <button class="nav-tab" data-path="/employee/tasks" onclick="router.navigate('/employee/tasks')">
      <span>My Tasks</span>
    </button>
    <button class="nav-tab" data-path="/employee/leaves" onclick="router.navigate('/employee/leaves')">
      <span>Leaves</span>
    </button>
    <button class="nav-tab" data-path="/employee/progress" onclick="router.navigate('/employee/progress')">
      <span>My Progress</span>
    </button>
    <button class="nav-tab" data-path="/employee/notifications" onclick="router.navigate('/employee/notifications')">
      <span>Notifications <span id="nav-badge" class="badge badge-employee" style="display:none;margin-left:auto">0</span></span>
    </button>
  `;

  appEl.innerHTML = `
    <div id="mainView">
      <div class="topbar">
        <div class="topbar-logo">
          <svg width="60" height="15" viewBox="0 0 100 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H6.5L24.5 17V0H30.5V25H24L6 8V25H0V0Z" fill="#005AFF"/>
            <path d="M50.5 0C57.5 0 63.5 5.5 63.5 12.5C63.5 19.5 57.5 25 50.5 25C43.5 25 37.5 19.5 37.5 12.5C37.5 5.5 43.5 0 50.5 0ZM50.5 19.5C54.5 19.5 57.5 16.5 57.5 12.5C57.5 8.5 54.5 5.5 50.5 5.5C46.5 5.5 43.5 8.5 43.5 12.5C43.5 16.5 46.5 19.5 50.5 19.5Z" fill="#005AFF"/>
            <path d="M70.5 0H76.5V10.5L88.5 0H96L83.5 11L96.5 25H89L79 14.5L76.5 17V25H70.5V0Z" fill="#005AFF"/>
            <path d="M102.5 0H108.5V25H102.5V0Z" fill="#005AFF"/>
            <path d="M125 0H132L144 25H137.5L134.5 18.5H122.5L119.5 25H113L125 0ZM132.5 13.5L128.5 5L124.5 13.5H132.5Z" fill="#005AFF"/>
          </svg>
          <div class="logo-divider"></div>
          <span class="logo-sprint">Sprint Platform</span>
        </div>
        <div class="topbar-right">
          <span class="role-topbadge">${roleBadge}</span>
          <div style="text-align:right">
            <div style="font-size:12px;font-weight:600;color:#fff">${escapeHTML(user.name)}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6)">${escapeHTML(user.team)}</div>
          </div>
          <div class="avatar">${escapeHTML(user.initials)}</div>
          <button class="btn btn-secondary btn-sm" onclick="api.logout()" style="margin-left:12px">Sign Out</button>
        </div>
      </div>
      <div class="main-layout-row">
        <div class="sidebar">
          ${user.role === 'manager' ? managerNav : employeeNav}
        </div>
        <div class="content" id="mainContent">
          ${contentHTML}
        </div>
      </div>
    </div>
  `;
  
  router.updateActiveNav();
  updateUnreadBadge();
  
  // Start notification polling
  if (!window.pollInterval) {
    window.pollInterval = setInterval(updateUnreadBadge, 30000);
  }
}

async function updateUnreadBadge() {
  try {
    const data = await api.getUnreadNotificationCount();
    const badge = document.getElementById('nav-badge');
    if (badge) {
      if (data.count > 0) {
        badge.textContent = data.count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.warn('Failed to fetch unread count', err);
  }
}

// ── VIEWS: LOGIN ─────────────────────────────────────────────────────────
window.renderLoginPage = function() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <div id="loginView">
      <div class="login-left-pane">
        <div class="login-left-content">
          <div class="login-logo-large">
            <svg width="120" height="30" viewBox="0 0 100 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H6.5L24.5 17V0H30.5V25H24L6 8V25H0V0Z" fill="#FFFFFF"/>
              <path d="M50.5 0C57.5 0 63.5 5.5 63.5 12.5C63.5 19.5 57.5 25 50.5 25C43.5 25 37.5 19.5 37.5 12.5C37.5 5.5 43.5 0 50.5 0ZM50.5 19.5C54.5 19.5 57.5 16.5 57.5 12.5C57.5 8.5 54.5 5.5 50.5 5.5C46.5 5.5 43.5 8.5 43.5 12.5C43.5 16.5 46.5 19.5 50.5 19.5Z" fill="#FFFFFF"/>
              <path d="M70.5 0H76.5V10.5L88.5 0H96L83.5 11L96.5 25H89L79 14.5L76.5 17V25H70.5V0Z" fill="#FFFFFF"/>
              <path d="M102.5 0H108.5V25H102.5V0Z" fill="#FFFFFF"/>
              <path d="M125 0H132L144 25H137.5L134.5 18.5H122.5L119.5 25H113L125 0ZM132.5 13.5L128.5 5L124.5 13.5H132.5Z" fill="#FFFFFF"/>
            </svg>
            <div class="logo-divider-vertical"></div>
            <div class="logo-sprint-text" style="color:#fff">Sprint</div>
          </div>
          <div class="login-tagline">Track team performance & sprint velocity.</div>
        </div>
      </div>
      <div class="login-right-pane">
        <div class="login-form-wrap">
          <h2 class="login-form-heading">Sign In</h2>
          <p class="login-form-subheading">Access the internal sprint platform.</p>
          
          <form id="loginForm">
            <div class="field">
              <div class="role-segmented-control">
                <label class="role-segment active">
                  <input type="radio" name="role" value="manager" checked onchange="updateRoleSegment(this)">
                  <span>MANAGER</span>
                </label>
                <label class="role-segment">
                  <input type="radio" name="role" value="employee" onchange="updateRoleSegment(this)">
                  <span>EMPLOYEE</span>
                </label>
              </div>
            </div>
            
            <div class="field">
              <label>Email Address</label>
              <input type="email" id="loginEmail" placeholder="firstname.lastname@nokia.com" required value="kaisa.laine@nokia.com">
            </div>
            
            <div class="field">
              <div class="login-field-header">
                <label>Password</label>
                <a href="#" class="forgot-link" onclick="alert('Contact IT Helpdesk')">Forgot Password?</a>
              </div>
              <input type="password" id="loginPassword" placeholder="••••••••" required value="Nokia@123">
            </div>
            
            <div id="loginError" style="color:var(--error-red);font-size:12px;margin-bottom:12px;display:none"></div>
            
            <button type="submit" class="btn btn-primary btn-full btn-login">Secure Sign In</button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-login');
    const errEl = document.getElementById('loginError');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    try {
      btn.textContent = 'Authenticating...';
      btn.disabled = true;
      errEl.style.display = 'none';
      
      const res = await api.login(email, password, role);
      if (res.success) {
        router.navigate(role === 'manager' ? '/manager/dashboard' : '/employee/tasks');
      }
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
    } finally {
      btn.textContent = 'Secure Sign In';
      btn.disabled = false;
    }
  });
};

window.updateRoleSegment = function(radio) {
  document.querySelectorAll('.role-segment').forEach(el => el.classList.remove('active'));
  radio.parentElement.classList.add('active');
  const emailInput = document.getElementById('loginEmail');
  if (radio.value === 'manager') {
    emailInput.value = 'kaisa.laine@nokia.com';
  } else {
    emailInput.value = 'mikko.virtanen@nokia.com';
  }
};

// ── VIEWS: MANAGER ───────────────────────────────────────────────────────

router.add('/manager/dashboard', async () => {
  renderLayout('<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span class="spinner"></span> Loading Dashboard...</div>');
  try {
    const sprints = await api.getSprints();
    const activeSprint = sprints.find(s => s.status === 'active') || sprints[0];
    
    if (!activeSprint) {
      renderLayout('<div class="content"><h2>Dashboard</h2><p>No sprints found. Create a sprint first.</p></div>');
      return;
    }

    const stats = await api.getSprintStats(activeSprint.sprintId);
    
    const html = `
      <div class="section-title-lg">
        Sprint Dashboard
        <select class="cell-select" style="min-width:200px" id="sprintSelect" onchange="loadManagerDashboard(this.value)">
          ${sprints.map(s => `<option value="${s.sprintId}" ${s.sprintId === activeSprint.sprintId ? 'selected' : ''}>${s.sprintId} — ${s.sprintName}</option>`).join('')}
        </select>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">SPRINT VELOCITY</div>
          <div class="metric-value">${stats.velocity}%</div>
          <div class="metric-sub">${stats.doneTasks}/${stats.totalTasks} tasks completed</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">EFFORT VARIANCE</div>
          <div class="metric-value" style="color: ${stats.effortVariance > 10 ? 'var(--error-red)' : 'var(--text-light)'}">${stats.effortVariance > 0 ? '+' : ''}${stats.effortVariance}%</div>
          <div class="metric-sub">Est: ${stats.totalEstimatedHours}h | Spent: ${stats.totalSpentHours}h</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">BLOCKED TASKS</div>
          <div class="metric-value" style="color: ${stats.blockedTasks > 0 ? 'var(--error-red)' : 'var(--text-light)'}">${stats.blockedTasks}</div>
          <div class="metric-sub">Requires manager attention</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">SUBTASKS</div>
          <div class="metric-value">${stats.subtaskStats.total}</div>
          <div class="metric-sub">${stats.subtaskStats.done} Done</div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="section-title">Burndown Chart</div>
          <div class="chart-wrap" style="height:250px">
            <canvas id="burndownChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="section-title">Task Status Breakdown</div>
          <div class="chart-wrap" style="height:250px; display:flex; justify-content:center">
            <canvas id="donutChart"></canvas>
          </div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="section-title">Team Workload Heatmap (Hrs/Day)</div>
          <div class="heatmap-grid" style="grid-template-columns: 80px repeat(5, 1fr);">
            <div class="heatmap-cell"></div>
            <div class="heatmap-label">Mon</div>
            <div class="heatmap-label">Tue</div>
            <div class="heatmap-label">Wed</div>
            <div class="heatmap-label">Thu</div>
            <div class="heatmap-label">Fri</div>
            ${stats.teamWorkload.map(member => `
              <div class="heatmap-label" style="text-align:right;padding-right:8px">${member.name.split(' ')[0]}</div>
              ${member.dailyHours.map(hrs => {
                const intensity = Math.min(hrs / 8, 1);
                return `<div class="heatmap-cell" style="background: rgba(0, 90, 255, ${intensity}); color: ${intensity > 0.5 ? '#fff' : 'inherit'}">${hrs}h</div>`;
              }).join('')}
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="section-title">Effort vs Spent (Hrs)</div>
          <div class="chart-wrap" style="height:250px">
            <canvas id="barChart"></canvas>
          </div>
        </div>
      </div>
    `;
    renderLayout(html);
    initCharts(stats);
  } catch (err) {
    renderLayout(`<div class="content">Error loading dashboard: ${err.message}</div>`);
  }
});

window.loadManagerDashboard = function(sprintId) {
  // Hack to refresh with new sprint ID
  router.navigate('/manager/dashboard?s=' + sprintId);
}

function initCharts(stats) {
  // Burndown Chart
  const burndownCtx = document.getElementById('burndownChart');
  if (burndownCtx) {
    new Chart(burndownCtx, {
      type: 'line',
      data: {
        labels: stats.burndown.map(b => b.day),
        datasets: [
          {
            label: 'Ideal Remaining Tasks',
            data: stats.burndown.map(b => b.ideal),
            borderColor: 'rgba(0, 90, 255, 0.3)',
            borderDash: [5, 5],
            fill: false,
            tension: 0
          },
          {
            label: 'Actual Remaining Tasks',
            data: stats.burndown.map(b => b.actual),
            borderColor: '#005AFF',
            backgroundColor: 'rgba(0, 90, 255, 0.1)',
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // Donut Chart
  const donutCtx = document.getElementById('donutChart');
  if (donutCtx) {
    new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Done', 'In Progress', 'Blocked', 'To Do'],
        datasets: [{
          data: [stats.doneTasks, stats.inProgressTasks, stats.blockedTasks, stats.todoTasks],
          backgroundColor: ['#00D4A0', '#005AFF', '#EF4444', '#777777'],
          borderWidth: 0
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }

  // Bar Chart
  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: stats.teamWorkload.map(m => m.name.split(' ')[0]),
        datasets: [
          {
            label: 'Estimated',
            data: stats.teamWorkload.map(m => m.estimatedHours),
            backgroundColor: 'rgba(0, 90, 255, 0.3)'
          },
          {
            label: 'Spent',
            data: stats.teamWorkload.map(m => m.spentHours),
            backgroundColor: '#005AFF'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

// ── VIEWS: MANAGER SPRINT MANAGEMENT ─────────────────────────────────────
router.add('/manager/sprints', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Sprints...</div>');
  try {
    const sprints = await api.getSprints();
    
    let html = `
      <div class="section-title-lg">Sprint Management</div>
      <div class="card">
        <div class="section-title">Active & Past Sprints</div>
        <table class="data-table" style="margin-bottom:24px">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Date Range</th>
              <th>Tasks</th>
              <th>Velocity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sprints.map(s => `
              <tr>
                <td style="font-weight:600">${s.sprintId}</td>
                <td>${escapeHTML(s.sprintName)}</td>
                <td><span class="badge badge-${s.status === 'completed' ? 'done' : s.status === 'active' ? 'active' : 'todo'}">${s.status.toUpperCase()}</span></td>
                <td>${formatDate(s.startDate)} - ${formatDate(s.endDate)}</td>
                <td>${s.doneCount} / ${s.taskCount}</td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-track"><div class="progress-fill" style="width:${s.velocity}%"></div></div>
                    <span class="progress-pct">${s.velocity}%</span>
                  </div>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="viewSprint('${s.sprintId}')">Manage</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Create New Sprint</div>
        <form id="addSprintForm" class="form-row">
          <div class="field">
            <label>Sprint Name</label>
            <input type="text" id="nsName" required placeholder="e.g. Q3 Innovation Sprint">
          </div>
          <div class="field">
            <label>Start Date</label>
            <input type="date" id="nsStart" required class="date-picker-wrap">
          </div>
          <div class="field">
            <label>End Date</label>
            <input type="date" id="nsEnd" required class="date-picker-wrap">
          </div>
          <div class="field">
            <label>Sprint Goal</label>
            <input type="text" id="nsGoal" placeholder="Primary objective">
          </div>
          <div class="field" style="grid-column: span 2">
            <button type="submit" class="btn btn-primary" id="btnCreateSprint">Create Sprint & Enter Planner Mode</button>
          </div>
        </form>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');

    document.getElementById('addSprintForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnCreateSprint');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      
      try {
        await api.createSprint({
          sprintName: document.getElementById('nsName').value,
          sprintGoal: document.getElementById('nsGoal').value,
          startDate: document.getElementById('nsStart').value,
          endDate: document.getElementById('nsEnd').value
        });
        router.navigate('/manager/sprints');
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'Create Sprint & Enter Planner Mode';
      }
    });
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

window.viewSprint = async function(sprintId) {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Sprint Details...</div>');
  try {
    const sprint = await api.getSprintDetails(sprintId);
    
    let actionsHtml = '';
    if (sprint.status === 'created') {
      actionsHtml = `
        <button class="btn btn-primary btn-sm" onclick="changeSprintStatus('${sprintId}', 'planner')">Enter Planner Mode</button>
      `;
    } else if (sprint.status === 'planner') {
      actionsHtml = `
        <button class="btn btn-primary btn-sm" onclick="changeSprintStatus('${sprintId}', 'active')">Start Sprint (Active Mode)</button>
      `;
    } else if (sprint.status === 'active') {
      actionsHtml = `
        <button class="btn btn-danger btn-sm" onclick="changeSprintStatus('${sprintId}', 'completed')">End Sprint</button>
      `;
    }

    const employees = await api.getEmployees();

    let html = `
      <div class="section-title-lg">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-secondary btn-sm" onclick="router.navigate('/manager/sprints')">← Back</button>
          ${sprintId} — ${escapeHTML(sprint.sprintName)}
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <span class="badge badge-${sprint.status === 'completed' ? 'done' : sprint.status === 'active' ? 'active' : 'todo'}">${sprint.status.toUpperCase()}</span>
          ${actionsHtml}
        </div>
      </div>

      <div class="card">
        <div class="section-title">Sprint Members</div>
        <table class="data-table" style="margin-bottom:24px">
          <thead>
            <tr>
              <th>Member</th>
              <th>Team</th>
              <th>Est. Hours</th>
              <th>Spent Hours</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${sprint.members.map(m => `
              <tr>
                <td>${escapeHTML(m.name)}</td>
                <td>${escapeHTML(m.team)}</td>
                <td>${m.estimatedHours}h</td>
                <td>${m.spentHours}h</td>
                <td>
                  <button class="btn btn-danger btn-sm" onclick="removeMember('${sprintId}', ${m.userId})">Remove</button>
                </td>
              </tr>
            `).join('')}
            ${sprint.members.length === 0 ? '<tr><td colspan="5" style="text-align:center">No members added yet.</td></tr>' : ''}
          </tbody>
        </table>

        ${sprint.status === 'created' || sprint.status === 'planner' ? `
        <div class="section-title">Add Member & Assign Initial Task</div>
        <form id="addMemberForm" class="form-row">
          <div class="field">
            <label>Select Employee</label>
            <select id="amUser" required>
              <option value="">-- Choose Employee --</option>
              ${employees.filter(e => !sprint.members.find(m => m.userId === e.id)).map(e => `<option value="${e.id}">${escapeHTML(e.name)} (${escapeHTML(e.team)})</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Initial Task Title</label>
            <input type="text" id="amTask" required placeholder="e.g. Update API Gateway">
          </div>
          <div class="field">
            <label>Estimated Hours</label>
            <input type="number" id="amHours" required min="1" max="100" placeholder="e.g. 20">
          </div>
          <div class="field" style="display:flex;align-items:flex-end">
            <button type="submit" class="btn btn-secondary">Add to Sprint</button>
          </div>
        </form>
        ` : ''}
      </div>
      
      <div class="card">
        <div class="section-title">Sprint Tasks</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Title</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Est. Hours</th>
              <th>Spent Hours</th>
            </tr>
          </thead>
          <tbody>
            ${sprint.tasks.map(t => `
              <tr>
                <td style="font-weight:600">${t.taskId}</td>
                <td>${escapeHTML(t.title)}</td>
                <td>${escapeHTML(t.assigneeName)}</td>
                <td><span class="badge badge-${t.status}">${t.status.toUpperCase()}</span></td>
                <td>${t.estimatedHours}h</td>
                <td>${t.spentHours}h</td>
              </tr>
            `).join('')}
            ${sprint.tasks.length === 0 ? '<tr><td colspan="6" style="text-align:center">No tasks assigned yet.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');

    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
      addMemberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.request('/sprint-members', {
            method: 'POST',
            body: JSON.stringify({
              sprintId,
              userId: document.getElementById('amUser').value,
              taskTitle: document.getElementById('amTask').value,
              estimatedHours: parseInt(document.getElementById('amHours').value, 10)
            })
          });
          viewSprint(sprintId);
        } catch (err) {
          alert(err.message);
        }
      });
    }

  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
};

window.changeSprintStatus = async function(sprintId, status) {
  try {
    await api.updateSprintStatus(sprintId, status);
    viewSprint(sprintId);
  } catch (err) {
    alert(err.message);
  }
};

window.removeMember = async function(sprintId, userId) {
  if (!confirm('Remove this member? Their tasks will also be deleted.')) return;
  try {
    await api.request(`/sprint-members/${sprintId}/${userId}`, { method: 'DELETE' });
    viewSprint(sprintId);
  } catch (err) {
    alert(err.message);
  }
};

// ── VIEWS: MANAGER ALL TASKS ─────────────────────────────────────────────
router.add('/manager/tasks', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Tasks...</div>');
  try {
    const tasks = await api.getTasks();
    const sprints = await api.getSprints();
    
    let html = `
      <div class="section-title-lg">All Tasks Master List</div>
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Sprint</th>
              <th>Assignee</th>
              <th>Title</th>
              <th>Subtasks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td style="font-weight:600">${t.taskId}</td>
                <td>${t.sprintId}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar" style="width:24px;height:24px;font-size:9px">${escapeHTML(t.assigneeInitials)}</div>
                    <span>${escapeHTML(t.assigneeName)}</span>
                  </div>
                </td>
                <td>${escapeHTML(t.title)}</td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-track"><div class="progress-fill" style="width:${t.completionPct}%"></div></div>
                    <span class="progress-pct">${t.subtaskDoneCount}/${t.subtaskCount}</span>
                  </div>
                </td>
                <td>
                  <select class="cell-select" onchange="updateTaskStatus('${t.taskId}', this.value)">
                    <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To Do</option>
                    <option value="inprogress" ${t.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
                    <option value="blocked" ${t.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                    <option value="done" ${t.status === 'done' ? 'selected' : ''}>Done</option>
                  </select>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="viewTaskQueries('${t.taskId}')">View Queries</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

window.updateTaskStatus = async function(taskId, status) {
  try {
    await api.updateTaskStatus(taskId, status);
  } catch (err) {
    alert(err.message);
    router.navigate('/manager/tasks'); // Reload to reset dropdown
  }
};

window.viewTaskQueries = async function(taskId) {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Queries...</div>');
  try {
    const task = await api.getTaskDetails(taskId);
    
    let html = `
      <div class="section-title-lg">
        <button class="btn btn-secondary btn-sm" onclick="router.navigate('/manager/tasks')" style="margin-right:12px">← Back</button>
        Queries for ${taskId}: ${escapeHTML(task.title)}
      </div>
      <div class="card">
        ${task.queries.map(q => `
          <div style="border:1px solid var(--border-default); border-radius:var(--radius-card); padding:16px; margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <strong>${escapeHTML(q.raiserName)}</strong>
              <span class="badge badge-${q.status === 'resolved' ? 'done' : 'blocked'}">${q.status.toUpperCase()}</span>
            </div>
            <div style="background:var(--bg-app);padding:12px;border-radius:4px;margin-bottom:12px;font-size:13px">
              ${escapeHTML(q.queryText)}
            </div>
            ${q.status === 'resolved' ? `
              <div style="margin-left:24px;border-left:2px solid var(--nokia-blue);padding-left:12px">
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">${escapeHTML(q.replierName)} replied:</div>
                <div style="font-size:13px">${escapeHTML(q.replyText)}</div>
              </div>
            ` : `
              <form class="reply-form" style="display:flex;gap:8px" onsubmit="submitReply(event, '${q.queryId}', '${taskId}')">
                <input type="text" required placeholder="Type your reply to resolve this query..." style="flex:1;padding:8px;border:1px solid var(--border-default);border-radius:3px">
                <button type="submit" class="btn btn-primary">Reply & Resolve</button>
              </form>
            `}
          </div>
        `).join('')}
        ${task.queries.length === 0 ? '<p>No queries raised for this task.</p>' : ''}
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
};

window.submitReply = async function(e, queryId, taskId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  try {
    await api.replyQuery(queryId, input.value);
    viewTaskQueries(taskId);
  } catch (err) {
    alert(err.message);
  }
};

// ── VIEWS: MANAGER LEAVES ────────────────────────────────────────────────
router.add('/manager/leaves', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Leaves...</div>');
  try {
    const leaves = await api.getLeaves();
    
    let html = `
      <div class="section-title-lg">Leave Requests</div>
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Team</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar" style="width:24px;height:24px;font-size:9px">${escapeHTML(l.employeeInitials)}</div>
                    <span>${escapeHTML(l.employeeName)}</span>
                  </div>
                </td>
                <td>${escapeHTML(l.team)}</td>
                <td>${escapeHTML(l.leaveType)}</td>
                <td>${formatDate(l.startDate)} - ${formatDate(l.endDate)}</td>
                <td>${l.durationDays} days</td>
                <td>${escapeHTML(l.reason)}</td>
                <td><span class="badge badge-${l.status === 'approved' ? 'done' : l.status === 'rejected' ? 'blocked' : 'todo'}">${l.status.toUpperCase()}</span></td>
                <td>
                  ${l.status === 'pending' ? `
                    <button class="btn btn-primary btn-sm" onclick="handleLeave('${l.id}', 'approve')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="handleLeave('${l.id}', 'reject')" style="margin-left:4px">Reject</button>
                  ` : `
                    <span style="font-size:11px;color:var(--text-secondary)">Decided on ${formatDate(l.decidedAt)}</span>
                  `}
                </td>
              </tr>
            `).join('')}
            ${leaves.length === 0 ? '<tr><td colspan="8" style="text-align:center">No leave requests found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

window.handleLeave = async function(id, action) {
  try {
    await api.updateLeaveStatus(id, action);
    router.navigate('/manager/leaves');
  } catch (err) {
    alert(err.message);
  }
};

// ── VIEWS: MANAGER NOTIFICATIONS ─────────────────────────────────────────
router.add('/manager/notifications', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Notifications...</div>');
  try {
    const notifs = await api.getNotifications();
    
    let html = `
      <div class="section-title-lg">
        Notifications
        <button class="btn btn-secondary btn-sm" onclick="markAllRead()">Mark All as Read</button>
      </div>
      <div class="card" style="padding:0">
        ${notifs.map(n => `
          <div style="padding:16px 24px;border-bottom:1px solid var(--border-default);background:${n.isRead ? 'var(--bg-primary)' : 'rgba(0,90,255,0.03)'};display:flex;align-items:flex-start;gap:16px">
            <div style="width:8px;height:8px;border-radius:50%;background:${n.isRead ? 'transparent' : 'var(--nokia-blue)'};margin-top:6px"></div>
            <div style="flex:1">
              <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${n.type} ${n.senderName ? '• From ' + escapeHTML(n.senderName) : ''} ${n.referenceId ? '• Ref: ' + n.referenceId : ''}</div>
              <div style="font-weight:600;margin-bottom:4px">${escapeHTML(n.title)}</div>
              <div style="font-size:13px;color:var(--text-secondary)">${escapeHTML(n.message)}</div>
            </div>
            ${!n.isRead ? `<button class="btn btn-secondary btn-sm" onclick="markRead('${n.id}')">Mark Read</button>` : ''}
          </div>
        `).join('')}
        ${notifs.length === 0 ? '<div style="padding:24px;text-align:center">No notifications.</div>' : ''}
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');
    updateUnreadBadge();
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

window.markRead = async function(id) {
  try {
    await api.markNotificationRead(id);
    router.navigate(router.currentPath); // reload
  } catch (err) { alert(err.message); }
};
window.markAllRead = async function() {
  try {
    await api.markAllNotificationsRead();
    router.navigate(router.currentPath); // reload
  } catch (err) { alert(err.message); }
};

// ── MISC MANAGER ROUTES ──────────────────────────────────────────────────
router.add('/manager/team', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Team...</div>');
  try {
    const employees = await api.getEmployees();
    
    let html = `
      <div class="section-title-lg">Team Directory</div>
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Email</th>
              <th>Department</th>
              <th>Team / Sub-Team</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(e => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar" style="width:24px;height:24px;font-size:9px">${escapeHTML(e.initials)}</div>
                    <span>${escapeHTML(e.name)}</span>
                  </div>
                </td>
                <td>${escapeHTML(e.email)}</td>
                <td>${escapeHTML(e.department)}</td>
                <td>${escapeHTML(e.team)} / ${escapeHTML(e.subTeam)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

router.add('/manager/reports', () => {
  renderLayout('<div class="content"><div class="section-title-lg">Reports Generation</div><div class="card"><p>PDF/Excel export functionality is handled by python scripts offline based on PDF spec, or will be implemented here later.</p></div></div>');
});

// ── VIEWS: EMPLOYEE MY TASKS ─────────────────────────────────────────────
router.add('/employee/tasks', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Tasks...</div>');
  try {
    const user = api.getCurrentUser();
    const tasks = await api.getEmployeeTasks(user.id);
    
    const activeTasks = tasks.filter(t => t.sprintStatus === 'active');
    const plannerTasks = tasks.filter(t => t.sprintStatus === 'planner');

    let html = `
      <div class="section-title-lg">My Tasks</div>
      
      ${plannerTasks.length > 0 ? `
        <div style="background:#FFF3CD; border:1px solid #FFE69C; padding:16px; border-radius:var(--radius-card); margin-bottom:24px;">
          <h3 style="font-size:14px; margin-bottom:8px; color:#664D03">Planner Mode Active</h3>
          <p style="font-size:13px; color:#664D03; margin-bottom:0">Your manager has activated planner mode for upcoming sprints. Please review your tasks and create necessary subtasks before the sprint starts.</p>
        </div>
      ` : ''}

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Sprint</th>
              <th>Title</th>
              <th>Status</th>
              <th>Subtasks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td style="font-weight:600">${t.taskId}</td>
                <td>${t.sprintId} <span class="badge badge-${t.sprintStatus === 'completed' ? 'done' : t.sprintStatus === 'active' ? 'active' : 'todo'}">${t.sprintStatus.toUpperCase()}</span></td>
                <td>${escapeHTML(t.title)}</td>
                <td><span class="badge badge-${t.status}">${t.status.toUpperCase()}</span></td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-track"><div class="progress-fill" style="width:${t.completionPct}%"></div></div>
                    <span class="progress-pct">${t.subtaskDoneCount}/${t.subtaskCount}</span>
                  </div>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="router.navigate('/employee/log-task?id=${t.taskId}')">Log Work / View</button>
                </td>
              </tr>
            `).join('')}
            ${tasks.length === 0 ? '<tr><td colspan="6" style="text-align:center">No tasks assigned to you.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

// ── VIEWS: EMPLOYEE LOG TASK ─────────────────────────────────────────────
router.add('/employee/log-task', async () => {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const taskId = urlParams.get('id');
  if (!taskId) return router.navigate('/employee/tasks');

  renderLayout('<div class="content"><span class="spinner"></span> Loading Task Details...</div>');
  try {
    const task = await api.getTaskDetails(taskId);
    // Need sprint info to check status
    const sprints = await api.getSprints();
    const sprint = sprints.find(s => s.sprintId === task.sprintId);
    
    const isPlanner = sprint && sprint.status === 'planner';
    const isActive = sprint && sprint.status === 'active';

    let html = `
      <div class="section-title-lg">
        <button class="btn btn-secondary btn-sm" onclick="router.navigate('/employee/tasks')" style="margin-right:12px">← Back</button>
        Log Work: ${taskId}
      </div>

      <div class="two-col">
        <div class="card">
          <div class="section-title">Task Information</div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:12px;font-size:13px;margin-bottom:24px">
            <div style="color:var(--text-secondary);font-weight:600;text-transform:uppercase">Title</div>
            <div style="font-weight:600">${escapeHTML(task.title)}</div>
            <div style="color:var(--text-secondary);font-weight:600;text-transform:uppercase">Sprint</div>
            <div>${task.sprintId} <span class="badge badge-${sprint ? (sprint.status === 'active' ? 'active' : 'todo') : ''}">${sprint ? sprint.status.toUpperCase() : ''}</span></div>
            <div style="color:var(--text-secondary);font-weight:600;text-transform:uppercase">Task Status</div>
            <div>
              <select class="cell-select" onchange="updateTaskStatusEmp('${taskId}', this.value)" ${!isActive ? 'disabled' : ''}>
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="inprogress" ${task.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
                <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
              </select>
            </div>
            <div style="color:var(--text-secondary);font-weight:600;text-transform:uppercase">Est. Hours</div>
            <div>${task.estimatedHours}h</div>
            <div style="color:var(--text-secondary);font-weight:600;text-transform:uppercase">Spent Hours</div>
            <div>${task.spentHours}h</div>
          </div>

          <div class="section-title">Raise Query</div>
          <form class="form-row" onsubmit="submitQuery(event, '${taskId}')">
            <div class="field" style="grid-column: span 2">
              <textarea id="queryText" required placeholder="Describe your blocker or question for the manager..." rows="3" style="width:100%"></textarea>
            </div>
            <div class="field" style="grid-column: span 2">
              <button type="submit" class="btn btn-secondary">Submit Query</button>
            </div>
          </form>
          
          <div style="margin-top:24px">
            ${task.queries.map(q => `
              <div style="border-left:3px solid ${q.status === 'resolved' ? '#00D4A0' : '#CC0000'}; padding-left:12px; margin-bottom:16px">
                <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">${formatDate(q.createdAt)} - ${q.status.toUpperCase()}</div>
                <div style="font-size:13px;margin-bottom:4px">${escapeHTML(q.queryText)}</div>
                ${q.status === 'resolved' ? `<div style="font-size:12px;background:var(--bg-app);padding:8px;border-radius:4px"><strong>Reply:</strong> ${escapeHTML(q.replyText)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="section-title">Subtasks</div>
          
          ${isPlanner ? `
            <form id="addSubtaskForm" class="form-row" style="background:var(--bg-app);padding:16px;border-radius:var(--radius-card);margin-bottom:24px">
              <div class="field" style="grid-column: span 2">
                <label>New Subtask Title</label>
                <input type="text" id="stTitle" required placeholder="e.g. Write unit tests">
              </div>
              <div class="field">
                <label>Est. Hours</label>
                <input type="number" id="stHours" required min="1" max="40" placeholder="e.g. 5">
              </div>
              <div class="field" style="display:flex;align-items:flex-end">
                <button type="submit" class="btn btn-primary btn-full">Add Subtask</button>
              </div>
            </form>
          ` : `
            ${!isActive ? '<div style="margin-bottom:16px;font-size:12px;color:var(--text-secondary)">Sprint has not started yet. Subtask creation is disabled.</div>' : '<div style="margin-bottom:16px;font-size:12px;color:var(--text-secondary)">Sprint is ACTIVE. Subtask creation is locked.</div>'}
          `}

          <div style="display:flex;flex-direction:column;gap:12px">
            ${task.subtasks.map(s => `
              <div style="border:1px solid var(--border-default); padding:12px; border-radius:var(--radius-btn)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <span style="font-weight:600;font-size:13px">${s.subtaskId}: ${escapeHTML(s.title)}</span>
                  ${isActive ? `
                    <select class="cell-select" onchange="updateSubtaskStatus('${s.subtaskId}', this.value)">
                      <option value="todo" ${s.status === 'todo' ? 'selected' : ''}>To Do</option>
                      <option value="inprogress" ${s.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
                      <option value="blocked" ${s.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                      <option value="done" ${s.status === 'done' ? 'selected' : ''}>Done</option>
                    </select>
                  ` : `
                    <span class="badge badge-${s.status}">${s.status.toUpperCase()}</span>
                  `}
                </div>
                <div style="font-size:12px;color:var(--text-secondary)">Est: ${s.estimatedHours}h | Spent: ${s.spentHours}h</div>
              </div>
            `).join('')}
            ${task.subtasks.length === 0 ? '<div style="font-size:13px;color:var(--text-secondary);text-align:center">No subtasks created.</div>' : ''}
          </div>
        </div>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');

    if (isPlanner) {
      document.getElementById('addSubtaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.createSubtask({
            taskId,
            title: document.getElementById('stTitle').value,
            estimatedHours: parseInt(document.getElementById('stHours').value, 10)
          });
          // Reload
          router.navigate(router.currentPath);
        } catch (err) { alert(err.message); }
      });
    }

  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

window.updateTaskStatusEmp = async function(taskId, status) {
  try {
    await api.updateTaskStatus(taskId, status);
  } catch (err) { alert(err.message); router.navigate(router.currentPath); }
};

window.updateSubtaskStatus = async function(subtaskId, status) {
  try {
    await api.updateSubtaskStatus(subtaskId, status);
  } catch (err) { alert(err.message); router.navigate(router.currentPath); }
};

window.submitQuery = async function(e, taskId) {
  e.preventDefault();
  const txt = document.getElementById('queryText').value;
  try {
    await api.raiseQuery(taskId, txt);
    router.navigate(router.currentPath);
  } catch (err) { alert(err.message); }
};

// ── VIEWS: EMPLOYEE LEAVES ───────────────────────────────────────────────
router.add('/employee/leaves', async () => {
  renderLayout('<div class="content"><span class="spinner"></span> Loading Leaves...</div>');
  try {
    const user = api.getCurrentUser();
    const leaves = await api.getEmployeeLeaves(user.id);
    const users = await api.getUsers();
    const managers = users.filter(u => u.role === 'manager');
    
    let html = `
      <div class="section-title-lg">My Leaves</div>
      <div class="two-col">
        <div class="card">
          <div class="section-title">Apply for Leave</div>
          <form id="applyLeaveForm" class="form-row">
            <div class="field" style="grid-column:span 2">
              <label>Select Manager to Notify</label>
              <select id="lManager" required>
                <option value="">-- Choose Manager --</option>
                ${managers.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Leave Type</label>
              <select id="lType" required>
                <option value="Sick">Sick Leave</option>
                <option value="Vacation">Vacation</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="field"></div>
            <div class="field">
              <label>Start Date</label>
              <input type="date" id="lStart" required class="date-picker-wrap">
            </div>
            <div class="field">
              <label>End Date</label>
              <input type="date" id="lEnd" required class="date-picker-wrap">
            </div>
            <div class="field" style="grid-column:span 2">
              <label>Reason</label>
              <input type="text" id="lReason" required>
            </div>
            <div class="field" style="grid-column:span 2">
              <button type="submit" class="btn btn-primary">Submit Leave Request</button>
            </div>
          </form>
        </div>
        
        <div class="card">
          <div class="section-title">Leave History</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${leaves.map(l => `
                <tr>
                  <td>${formatDate(l.startDate)} - ${formatDate(l.endDate)}</td>
                  <td>${escapeHTML(l.leaveType)}</td>
                  <td><span class="badge badge-${l.status === 'approved' ? 'done' : l.status === 'rejected' ? 'blocked' : 'todo'}">${l.status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
              ${leaves.length === 0 ? '<tr><td colspan="3" style="text-align:center">No leave requests found.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
    renderLayout('<div class="content">' + html + '</div>');

    document.getElementById('applyLeaveForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.applyLeave({
          managerId: document.getElementById('lManager').value,
          leaveType: document.getElementById('lType').value,
          startDate: document.getElementById('lStart').value,
          endDate: document.getElementById('lEnd').value,
          reason: document.getElementById('lReason').value
        });
        router.navigate('/employee/leaves');
      } catch (err) { alert(err.message); }
    });
  } catch (err) {
    renderLayout(`<div class="content">Error: ${err.message}</div>`);
  }
});

router.add('/employee/progress', () => {
  renderLayout('<div class="content"><div class="section-title-lg">My Progress</div><div class="card"><p>Personal performance metrics coming soon.</p></div></div>');
});

router.add('/employee/notifications', router.routes['/manager/notifications']); // Share view

router.add('/login', window.renderLoginPage);

// ── Start Router ───────────────────────────────────────────────────────── ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
