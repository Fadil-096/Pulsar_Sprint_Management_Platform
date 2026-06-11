import re

# ─── 1. Rewrite login HTML in app.js ───────────────────────────────────────
with open(r'public\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

nokia_svg = (
    '<svg viewBox="0 0 220 52" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:28px;width:auto;display:block">'
    '<polygon points="0,4 0,48 10,48 10,22 24,48 34,48 34,4 24,4 24,30 10,4" fill="#fff"/>'
    '<path d="M55,4 C44,4 40,12 40,26 C40,40 44,48 55,48 C66,48 70,40 70,26 C70,12 66,4 55,4 Z'
    ' M55,13 C60,13 61,19 61,26 C61,33 60,39 55,39 C50,39 49,33 49,26 C49,19 50,13 55,13 Z" fill="#fff"/>'
    '<polygon points="80,4 80,48 90,48 90,30 103,48 115,48 100,25 113,4 101,4 90,23 90,4" fill="#fff"/>'
    '<rect x="123" y="4" width="10" height="44" fill="#fff"/>'
    '<path d="M152,4 L142,4 L127,48 L137,48 L145,28 L159,28 L167,48 L177,48 L162,4 Z'
    ' M152,12 L157,24 L147,24 Z" fill="#fff"/>'
    '</svg>'
)

nokia_svg_blue = (
    '<svg viewBox="0 0 220 52" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:28px;width:auto;display:block">'
    '<polygon points="0,4 0,48 10,48 10,22 24,48 34,48 34,4 24,4 24,30 10,4" fill="#fff"/>'
    '<path d="M55,4 C44,4 40,12 40,26 C40,40 44,48 55,48 C66,48 70,40 70,26 C70,12 66,4 55,4 Z'
    ' M55,13 C60,13 61,19 61,26 C61,33 60,39 55,39 C50,39 49,33 49,26 C49,19 50,13 55,13 Z" fill="#fff"/>'
    '<polygon points="80,4 80,48 90,48 90,30 103,48 115,48 100,25 113,4 101,4 90,23 90,4" fill="#fff"/>'
    '<rect x="123" y="4" width="10" height="44" fill="#fff"/>'
    '<path d="M152,4 L142,4 L127,48 L137,48 L145,28 L159,28 L167,48 L177,48 L162,4 Z'
    ' M152,12 L157,24 L147,24 Z" fill="#fff"/>'
    '</svg>'
)

new_login_fn = r"""function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div id="loginView">

      <!-- Top bar -->
      <div class="lv-topbar">
        <div class="lv-logo">""" + nokia_svg + r"""</div>
        <div class="lv-topbar-right">
          <span class="lv-internal-tag">Internal Portal</span>
        </div>
      </div>

      <!-- Center content -->
      <div class="lv-body">
        <div class="lv-left">
          <div class="lv-headline">Sprint<br>Management<br>Platform</div>
          <p class="lv-sub">Track sprint velocity, team effort,<br>and delivery progress in one place.</p>
        </div>

        <div class="lv-form-panel">
          <h2 class="lv-form-title">Sign in</h2>
          <p class="lv-form-sub">Use your Nokia work account</p>

          <div class="lv-field">
            <label>Email</label>
            <input type="email" id="loginEmail" value="manager@nokia.com" placeholder="name@nokia.com" autocomplete="email" />
          </div>

          <div class="lv-field">
            <label>
              Password
              <a href="#" class="lv-forgot" onclick="return false">Forgot?</a>
            </label>
            <input type="password" id="loginPass" value="password" placeholder="Password" autocomplete="current-password" />
          </div>

          <div class="lv-role-label">Role</div>
          <div class="lv-roles">
            <div class="lv-role selected" id="roleManager" onclick="selectRole('manager')">
              <div class="lv-role-check" id="roleManagerCheck"></div>
              <div class="lv-role-name">Manager</div>
              <div class="lv-role-desc">Full dashboard access</div>
            </div>
            <div class="lv-role" id="roleEmployee" onclick="selectRole('employee')">
              <div class="lv-role-check" id="roleEmployeeCheck" style="opacity:0"></div>
              <div class="lv-role-name">Employee</div>
              <div class="lv-role-desc">Personal task view</div>
            </div>
          </div>

          <button class="lv-btn" onclick="doLogin()">Sign in &rarr;</button>

          <p class="lv-legal">By signing in you agree to Nokia's <a href="#" onclick="return false">Terms of Use</a> and <a href="#" onclick="return false">Privacy Policy</a>.</p>
        </div>
      </div>

    </div>
  `;
}"""

# Replace the renderLoginPage function
pattern = r'function renderLoginPage\(\) \{.*?^\}'
js = re.sub(pattern, new_login_fn, js, flags=re.DOTALL | re.MULTILINE)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('JS done')

# ─── 2. Rewrite login CSS in style.css ─────────────────────────────────────
with open(r'public\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

login_start = css.find('/* ── Login Page')
shell_start  = css.find('/* ── Shell / Layout', login_start)

new_login_css = r"""/* ── Login Page ─────────────────────────────────── */
/* Nokia.com inspired: dark navy-to-magenta gradient, white type, single page */

#loginView {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(135deg,
      #1a0533 0%,
      #2a0d5e 20%,
      #0d1b6b 50%,
      #061040 75%,
      #030920 100%
    );
  position: relative;
  overflow: hidden;
}

/* Nokia gradient sphere / glow — matches the site's hero orb */
#loginView::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -5%;
  width: 55vw;
  height: 90vh;
  background: radial-gradient(
    ellipse at 60% 40%,
    rgba(180, 50, 180, 0.45) 0%,
    rgba(100, 30, 200, 0.35) 30%,
    rgba(20, 60, 200, 0.2) 60%,
    transparent 80%
  );
  pointer-events: none;
}

/* Left edge magenta band */
#loginView::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #c026d3 0%, #7c3aed 50%, transparent 100%);
}

/* ── Top bar ─────────────────────────────────────── */
.lv-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  position: relative;
  z-index: 10;
}

.lv-logo { display: flex; align-items: center; }

.lv-internal-tag {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(255,255,255,0.15);
  padding: 4px 10px;
  border-radius: 4px;
}

/* ── Body layout ─────────────────────────────────── */
.lv-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 40px 48px 60px;
  position: relative;
  z-index: 10;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* ── Left: headline ──────────────────────────────── */
.lv-left {
  flex: 1;
  padding-right: 60px;
}

.lv-headline {
  font-size: clamp(40px, 5.5vw, 68px);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.08;
  letter-spacing: -2px;
  margin-bottom: 24px;
}

.lv-sub {
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  line-height: 1.65;
  font-weight: 400;
  max-width: 340px;
}

/* ── Right: form panel ───────────────────────────── */
.lv-form-panel {
  width: 380px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  padding: 36px 32px;
  backdrop-filter: blur(12px);
}

.lv-form-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.lv-form-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 28px;
}

/* ── Fields ──────────────────────────────────────── */
.lv-field {
  margin-bottom: 16px;
}

.lv-field label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 7px;
}

.lv-field input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 3px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.lv-field input::placeholder { color: rgba(255,255,255,0.25); }

.lv-field input:focus {
  border-color: rgba(200,100,255,0.6);
  background: rgba(255,255,255,0.10);
}

.lv-forgot {
  font-size: 11px;
  font-weight: 500;
  color: rgba(180,130,255,0.85);
  text-decoration: none;
  text-transform: none;
  letter-spacing: 0;
}
.lv-forgot:hover { color: #c084fc; text-decoration: underline; }

/* ── Role selector ───────────────────────────────── */
.lv-role-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 10px;
}

.lv-roles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
}

.lv-role {
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 3px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(255,255,255,0.04);
  position: relative;
  user-select: none;
}

.lv-role:hover {
  border-color: rgba(200,100,255,0.5);
  background: rgba(200,100,255,0.08);
}

.lv-role.selected {
  border-color: rgba(200,100,255,0.7);
  background: rgba(200,100,255,0.12);
}

.lv-role-check {
  position: absolute;
  top: 8px; right: 8px;
  width: 7px; height: 7px;
  background: #c084fc;
  border-radius: 50%;
  transition: opacity 0.15s;
}

.lv-role-name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.lv-role-desc {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}

/* ── Sign in button ──────────────────────────────── */
.lv-btn {
  width: 100%;
  padding: 12px 20px;
  background: #ffffff;
  color: #0a0a1a;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.lv-btn:hover { background: #e8e8f0; }
.lv-btn:active { background: #d0d0e0; }

/* ── Legal ───────────────────────────────────────── */
.lv-legal {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  margin-top: 20px;
  line-height: 1.6;
  text-align: center;
}

.lv-legal a {
  color: rgba(180,130,255,0.6);
  text-decoration: none;
}
.lv-legal a:hover { text-decoration: underline; }

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 860px) {
  .lv-body { flex-direction: column; gap: 40px; padding: 24px 24px 48px; }
  .lv-left { padding-right: 0; }
  .lv-form-panel { width: 100%; }
  .lv-topbar { padding: 18px 24px; }
  .lv-headline { font-size: 36px; letter-spacing: -1px; }
}

"""

css = css[:login_start] + new_login_css + css[shell_start:]

with open(r'public\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('CSS done')
print('Refresh http://localhost:3000')
