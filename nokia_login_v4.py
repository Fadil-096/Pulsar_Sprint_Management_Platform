import re

# ─── 1. Rewrite app.js login and logo sections ───────────────────────────────────────
with open(r'public\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Perfectly spaced official Nokia SVG wordmark
nokia_svg_white = (
    '<svg viewBox="0 0 230 70" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:32px;width:auto;display:block">'
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
      <div class="login-container">
        
        <!-- Header -->
        <div class="login-header">
          <div class="login-logo">""" + nokia_svg_white + r"""</div>
          <h1 class="login-title">Sprint Management Platform</h1>
          <p class="login-subtitle">Sign in to your Nokia work account</p>
        </div>

        <!-- Form Card -->
        <div class="login-card">
          <div class="login-field">
            <label for="loginEmail">Email Address</label>
            <input type="email" id="loginEmail" value="manager@nokia.com" placeholder="username@nokia.com" autocomplete="email" />
          </div>

          <div class="login-field">
            <div class="login-field-header">
              <label for="loginPass">Password</label>
              <a href="#" class="login-forgot-link" onclick="return false">Forgot?</a>
            </div>
            <input type="password" id="loginPass" value="password" placeholder="••••••••" autocomplete="current-password" />
          </div>

          <div class="login-field">
            <label>Access Role</label>
            <div class="login-roles-selector">
              <label class="login-role-option active" id="roleManagerOpt">
                <input type="radio" name="loginRole" value="manager" checked onclick="selectRole('manager')" />
                <span class="role-control-label">Manager</span>
              </label>
              <label class="login-role-option" id="roleEmployeeOpt">
                <input type="radio" name="loginRole" value="employee" onclick="selectRole('employee')" />
                <span class="role-control-label">Employee</span>
              </label>
            </div>
          </div>

          <button class="login-submit-btn" onclick="doLogin()">Sign In</button>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <p>Internal Nokia Use Only &nbsp;·&nbsp; <a href="#" onclick="return false">Support</a></p>
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

# Update the topbar logo inside buildShell function
# Locate SVG logo block inside app.js
logo_pattern = r'<svg style="height:22px;width:auto;display:block" viewBox="0 0 220 52" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia">.*?</svg>'
js = re.sub(logo_pattern, nokia_svg_topbar, js, flags=re.DOTALL)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('JS update done')

# ─── 2. Rewrite login CSS in style.css ─────────────────────────────────────
with open(r'public\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

login_start = css.find('/* ── Login Page')
shell_start  = css.find('/* ── Shell / Layout', login_start)

new_login_css = r"""/* ── Login Page ─────────────────────────────────── */
/* Nokia.com inspired: clean B2B dark navy & royal blue single-card theme */

#loginView {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, #001233 0%, #00091A 100%);
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

#loginView::before {
  content: '';
  position: absolute;
  top: -20%;
  right: -10%;
  width: 60vw;
  height: 80vh;
  background: radial-gradient(
    ellipse at 60% 40%,
    rgba(0, 90, 255, 0.15) 0%,
    rgba(0, 56, 174, 0.05) 50%,
    transparent 80%
  );
  pointer-events: none;
}

.login-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.login-subtitle {
  font-size: 13px;
  color: #8fa3c7;
  font-weight: 400;
}

.login-card {
  background: #0b1a3a;
  border: 1px solid #1c3566;
  border-radius: 6px;
  padding: 36px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.login-field {
  margin-bottom: 20px;
}

.login-field:last-of-type {
  margin-bottom: 24px;
}

.login-field label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #8fa3c7;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.login-field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.login-field-header label {
  margin-bottom: 0;
}

.login-forgot-link {
  font-size: 11px;
  color: #5B9BFF;
  text-decoration: none;
  font-weight: 500;
}

.login-forgot-link:hover {
  color: #85b7eb;
  text-decoration: underline;
}

.login-field input[type="email"],
.login-field input[type="password"] {
  width: 100%;
  padding: 12px 14px;
  background: #000c24;
  border: 1px solid #25448c;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  color: #ffffff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.login-field input[type="email"]::placeholder,
.login-field input[type="password"]::placeholder {
  color: #4b628f;
}

.login-field input[type="email"]:focus,
.login-field input[type="password"]:focus {
  border-color: #2979FF;
  box-shadow: 0 0 0 3px rgba(41, 121, 255, 0.25);
}

/* Segmented radio role selector */
.login-roles-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #000c24;
  border: 1px solid #25448c;
  border-radius: 4px;
  padding: 4px;
  gap: 4px;
}

.login-role-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 3px;
  user-select: none;
  transition: all 0.15s ease;
  background: transparent;
}

.login-role-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.role-control-label {
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #8fa3c7 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  margin-bottom: 0 !important;
}

.login-role-option.active {
  background: #0038ae;
}

.login-role-option.active .role-control-label {
  color: #ffffff !important;
}

.login-submit-btn {
  width: 100%;
  padding: 12px;
  background: #2979FF;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.login-submit-btn:hover {
  background: #1b5ec2;
}

.login-submit-btn:active {
  transform: scale(0.98);
}

.login-footer {
  text-align: center;
  font-size: 11px;
  color: #4b628f;
}

.login-footer a {
  color: #8fa3c7;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

"""

css = css[:login_start] + new_login_css + css[shell_start:]

with open(r'public\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('CSS update done')
