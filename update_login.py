import re, datetime

with open(r'public\app.js', 'r', encoding='utf-8') as f:
    content = f.read()

year = datetime.datetime.now().year

new_login = r"""function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div id="loginView">

      <div class="login-left">
        <div class="login-left-inner">
          <div class="login-logo-wrap">
            <img src="nokia-logo.svg" alt="Nokia" class="login-logo-img" />
          </div>
          <div class="login-left-tagline">Sprint Management<br>Platform</div>
          <div class="login-left-desc">
            Unified sprint tracking, effort analytics, and team visibility built for Nokia engineering teams.
          </div>
          <div class="login-left-features">
            <div class="login-feature-item">
              <span class="login-feature-icon">&#9889;</span>
              <span>Real-time sprint velocity tracking</span>
            </div>
            <div class="login-feature-item">
              <span class="login-feature-icon">&#128202;</span>
              <span>Effort variance &amp; burndown analytics</span>
            </div>
            <div class="login-feature-item">
              <span class="login-feature-icon">&#128101;</span>
              <span>Team workload heatmap</span>
            </div>
          </div>
        </div>
        <div class="login-left-footer">
          &copy; """ + str(year) + r""" Nokia Corporation &middot; Internal Use Only
        </div>
        <div class="login-orb login-orb-1"></div>
        <div class="login-orb login-orb-2"></div>
        <div class="login-orb login-orb-3"></div>
      </div>

      <div class="login-right">
        <div class="login-form-wrap">

          <div class="login-mobile-logo">
            <img src="nokia-logo.svg" alt="Nokia" style="height:26px;filter:brightness(0) invert(1);" />
          </div>

          <div class="login-form-header">
            <h2 class="login-form-title">Welcome back</h2>
            <p class="login-form-subtitle">Sign in to your Nokia account to continue</p>
          </div>

          <div class="login-form-body">
            <div class="field">
              <label>Work Email</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                </span>
                <input type="email" id="loginEmail" value="manager@nokia.com" placeholder="you@nokia.com" />
              </div>
            </div>
            <div class="field">
              <label style="display:flex;justify-content:space-between;align-items:center">
                <span>Password</span>
                <a href="#" class="forgot-link" onclick="return false">Forgot password?</a>
              </label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type="password" id="loginPass" value="password" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" />
              </div>
            </div>

            <div class="role-section">
              <span class="role-section-label">Sign in as</span>
              <div class="role-grid">
                <div class="role-card selected" id="roleManager" onclick="selectRole('manager')">
                  <div class="role-card-check" id="roleManagerCheck">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <span class="role-icon">&#128084;</span>
                  <h3>Manager</h3>
                  <p>Full visibility &amp; control</p>
                </div>
                <div class="role-card" id="roleEmployee" onclick="selectRole('employee')">
                  <div class="role-card-check" id="roleEmployeeCheck" style="opacity:0">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <span class="role-icon">&#128100;</span>
                  <h3>Employee</h3>
                  <p>Personal sprint tasks</p>
                </div>
              </div>
            </div>

            <button class="btn-login" onclick="doLogin()" id="loginBtn">
              <span>Sign In</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

          <div class="login-form-footer">
            <span>Protected by Nokia Identity Services</span>
            <span class="login-footer-dot">&middot;</span>
            <span>SSO Enabled</span>
          </div>

        </div>
      </div>

    </div>
  `;
}"""

pattern = r'function renderLoginPage\(\) \{.*?\n\}'
result = re.sub(pattern, new_login, content, flags=re.DOTALL)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(result)

print('Login page updated successfully')
