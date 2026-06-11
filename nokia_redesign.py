import re

# ── 1. Update style.css login section ─────────────────────────────────────
with open(r'public\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Find the login section and the shell section, replace everything between them
login_start = css.find('/* ── Login Page')
shell_start = css.find('/* ── Shell / Layout', login_start)

new_login_css = r"""/* ── Login Page — Nokia Enterprise Style ────────── */
/* Inspired by nokia.com: white, clean, minimal, high-contrast */

#loginView {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

/* ── LEFT PANEL — Nokia Brand ──────────────────── */
.login-left {
  position: relative;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3.5rem 4rem;
  overflow: hidden;
  border-right: 1px solid #E8ECF0;
}

/* Nokia blue top bar accent — like nokia.com header */
.login-left::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: #124191;
}

/* Subtle pattern */
.login-left::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 280px; height: 280px;
  background: radial-gradient(circle at bottom right, #EEF3FA 0%, transparent 70%);
  pointer-events: none;
}

.login-left-inner {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-logo-wrap {
  margin-bottom: 4rem;
}

.login-logo-img {
  height: 32px;
  width: auto;
  display: block;
  /* Nokia logo on white background — make it dark */
  filter: brightness(0) saturate(100%) invert(16%) sepia(90%) saturate(1200%) hue-rotate(200deg) brightness(80%);
}

.login-left-tagline {
  font-size: 38px;
  font-weight: 800;
  color: #111827;
  line-height: 1.18;
  letter-spacing: -1.2px;
  margin-bottom: 1.25rem;
}

.login-left-tagline .tagline-blue {
  color: #124191;
}

.login-left-desc {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.75;
  max-width: 340px;
  margin-bottom: 3rem;
  font-weight: 400;
}

.login-left-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.login-feature-icon {
  width: 36px;
  height: 36px;
  background: #EEF3FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  color: #124191;
}

.login-left-footer {
  font-size: 12px;
  color: #9CA3AF;
  letter-spacing: 0.01em;
  padding-top: 2rem;
  border-top: 1px solid #F3F4F6;
  position: relative;
  z-index: 2;
}

/* No animated orbs on light version */
.login-orb { display: none; }

/* ── RIGHT PANEL — Form ─────────────────────────── */
.login-right {
  background: #F9FAFB;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 3.5rem;
}

.login-form-wrap {
  width: 100%;
  max-width: 400px;
  animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}

.login-mobile-logo { display: none; margin-bottom: 2rem; }

/* Form card */
.login-form-card {
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
}

.login-form-header { margin-bottom: 1.75rem; }

.login-form-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.login-form-subtitle {
  font-size: 14px;
  color: #6B7280;
}

.login-form-body { display: flex; flex-direction: column; gap: 0; }

/* Input wrapper with icon */
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap .input-icon {
  position: absolute;
  left: 13px;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: color 0.15s;
}

.input-wrap input {
  padding-left: 40px !important;
}

.input-wrap:focus-within .input-icon { color: #124191; }

/* Light theme field overrides */
.login-form-card .field { margin-bottom: 18px; }

.login-form-card .field label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 7px;
  text-transform: none;
  letter-spacing: 0;
}

.login-form-card .field input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background: #fff;
  color: #111827;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}

.login-form-card .field input::placeholder { color: #9CA3AF; }

.login-form-card .field input:focus {
  border-color: #124191;
  box-shadow: 0 0 0 3px rgba(18, 65, 145, 0.1);
}

/* Forgot link */
.forgot-link {
  font-size: 12px;
  font-weight: 500;
  color: #124191;
  text-decoration: none;
  transition: opacity 0.15s;
}
.forgot-link:hover { text-decoration: underline; }

/* Role section */
.role-section { margin: 4px 0 20px; }

.role-section-label {
  font-size: 11px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  display: block;
}

.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
}

.role-card {
  border: 1.5px solid #E5E7EB;
  border-radius: 10px;
  padding: 14px 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.18s ease;
  background: #fff;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.role-card:hover {
  border-color: #124191;
  background: #F0F5FF;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(18,65,145,0.12);
}

.role-card.selected {
  border: 2px solid #124191;
  background: #EEF3FA;
  box-shadow: 0 0 0 3px rgba(18,65,145,0.08);
}

.role-card-check {
  position: absolute;
  top: 8px; right: 8px;
  width: 18px; height: 18px;
  background: #124191;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.role-card .role-icon {
  font-size: 22px;
  margin-bottom: 6px;
  display: block;
}

.role-card h3 {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.role-card p {
  font-size: 11px;
  color: #6B7280;
  line-height: 1.3;
}

/* Sign In button — Nokia blue, solid */
.btn-login {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: #124191;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: all 0.18s ease;
  position: relative;
  margin-top: 4px;
}

.btn-login::before { display: none; }

.btn-login:hover {
  background: #0D316E;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(18,65,145,0.35);
}

.btn-login:active {
  background: #0A2555;
  transform: scale(0.99) translateY(0);
  box-shadow: none;
}

/* Form footer */
.login-form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 11px;
  color: #9CA3AF;
}
.login-footer-dot { opacity: 0.5; }

/* ── Mobile responsive ────────────────────────────── */
@media (max-width: 900px) {
  #loginView { grid-template-columns: 1fr; }
  .login-left {
    padding: 2.5rem 2rem 2rem;
    min-height: auto;
  }
  .login-left-inner { justify-content: flex-start; }
  .login-left-tagline { font-size: 26px; }
  .login-left-desc, .login-left-features { display: none; }
  .login-logo-wrap { margin-bottom: 0; }
  .login-right { padding: 2rem 1.5rem 3rem; background: #fff; }
  .login-form-card { box-shadow: none; border: none; padding: 0; }
  .login-mobile-logo { display: block; }
}

"""

css = css[:login_start] + new_login_css + css[shell_start:]

with open(r'public\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('CSS updated')

# ── 2. Update app.js login HTML — wrap form in login-form-card ─────────────
with open(r'public\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Find the form wrap div and insert login-form-card wrapper
old_form_header = '<div class="login-form-header">'
new_form_header = '<div class="login-form-card">\n          <div class="login-form-header">'

js = js.replace(old_form_header, new_form_header, 1)

# Find the closing of form-footer and add closing tag for login-form-card
old_footer_end = '</div>\n\n          <div class="login-form-footer">'
new_footer_end = '</div>\n\n          <div class="login-form-footer">'
# We need to close the card after the button, before the footer
# find btn-login closing and footer
old_pattern = '            </button>\n          </div>\n\n          <div class="login-form-footer">'
new_pattern = '            </button>\n          </div>\n\n          </div><!-- /.login-form-card -->\n\n          <div class="login-form-footer">'
js = js.replace(old_pattern, new_pattern, 1)

# Also update logo filter for light theme
js = js.replace(
    'style="height:26px;filter:brightness(0) invert(1);"',
    'style="height:26px;filter:brightness(0) saturate(100%) invert(16%) sepia(90%) saturate(1200%) hue-rotate(200deg) brightness(80%);"'
)

# Update tagline to use blue accent span
js = js.replace(
    '<div class="login-left-tagline">Sprint Management<br>Platform</div>',
    '<div class="login-left-tagline">Sprint<br><span class="tagline-blue">Management</span><br>Platform</div>'
)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('JS updated')
print('Done! Refresh http://localhost:3000')
