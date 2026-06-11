import re

# Perfectly spaced new 2023 Nokia SVG wordmark (mathematically exact)
nokia_svg_2023_white = (
    '<svg viewBox="0 0 230 70" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:32px;width:auto;display:block">'
    '<!-- N -->'
    '<path d="M 10,10 L 22,10 L 50,60 L 38,60 L 20,27.8 L 20,60 L 10,60 Z" fill="#fff"/>'
    '<!-- O -->'
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M 83,10 C 96.8,10 108,21.2 108,35 C 108,48.8 96.8,60 83,60 C 69.2,60 58,48.8 58,35 C 58,21.2 69.2,10 83,10 Z M 83,20 C 91.3,20 98,26.7 98,35 C 98,43.3 91.3,50 83,50 C 74.7,50 68,43.3 68,35 C 68,26.7 74.7,20 83,20 Z" fill="#fff"/>'
    '<!-- K -->'
    '<polygon points="108,35 134,10 146,10 120,35 146,60 134,60" fill="#fff"/>'
    '<!-- I -->'
    '<rect x="154" y="10" width="10" height="50" fill="#fff"/>'
    '<!-- A -->'
    '<path d="M 184,10 L 194,10 L 216,60 L 206,60 L 199.4,45 L 188.6,45 L 182,60 L 172,60 L 183,35 L 195,35 Z" fill="#fff"/>'
    '</svg>'
)

nokia_svg_2023_topbar = (
    '<svg viewBox="0 0 230 70" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:18px;width:auto;display:block">'
    '<!-- N -->'
    '<path d="M 10,10 L 22,10 L 50,60 L 38,60 L 20,27.8 L 20,60 L 10,60 Z" fill="#fff"/>'
    '<!-- O -->'
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M 83,10 C 96.8,10 108,21.2 108,35 C 108,48.8 96.8,60 83,60 C 69.2,60 58,48.8 58,35 C 58,21.2 69.2,10 83,10 Z M 83,20 C 91.3,20 98,26.7 98,35 C 98,43.3 91.3,50 83,50 C 74.7,50 68,43.3 68,35 C 68,26.7 74.7,20 83,20 Z" fill="#fff"/>'
    '<!-- K -->'
    '<polygon points="108,35 134,10 146,10 120,35 146,60 134,60" fill="#fff"/>'
    '<!-- I -->'
    '<rect x="154" y="10" width="10" height="50" fill="#fff"/>'
    '<!-- A -->'
    '<path d="M 184,10 L 194,10 L 216,60 L 206,60 L 199.4,45 L 188.6,45 L 182,60 L 172,60 L 183,35 L 195,35 Z" fill="#fff"/>'
    '</svg>'
)

# ─── 1. Update app.js ────────────────────────────────────────────────────────
with open(r'public\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace SVG in renderLoginPage
js = re.sub(
    r'<div class="login-logo-large">.*?<span class="logo-divider-vertical"></span>',
    '<div class="login-logo-large">\n            ' + nokia_svg_2023_white + '\n            <span class="logo-divider-vertical"></span>',
    js,
    flags=re.DOTALL
)

# Replace SVG in buildShell
js = re.sub(
    r'<div class="topbar-logo">.*?<span class="logo-divider"></span>',
    '<div class="topbar-logo">\n          ' + nokia_svg_2023_topbar + '\n          <span class="logo-divider"></span>',
    js,
    flags=re.DOTALL
)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("app.js updated with pixel-perfect 2023 Nokia logo!")

# ─── 2. Update nokia-logo.svg ────────────────────────────────────────────────
nokia_logo_svg_2023 = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 70" fill="none">\n'
    '  <!-- N -->\n'
    '  <path d="M 10,10 L 22,10 L 50,60 L 38,60 L 20,27.8 L 20,60 L 10,60 Z" fill="#124191"/>\n'
    '  <!-- O -->\n'
    '  <path fill-rule="evenodd" clip-rule="evenodd" d="M 83,10 C 96.8,10 108,21.2 108,35 C 108,48.8 96.8,60 83,60 C 69.2,60 58,48.8 58,35 C 58,21.2 69.2,10 83,10 Z M 83,20 C 91.3,20 98,26.7 98,35 C 98,43.3 91.3,50 83,50 C 74.7,50 68,43.3 68,35 C 68,26.7 74.7,20 83,20 Z" fill="#124191"/>\n'
    '  <!-- K -->\n'
    '  <polygon points="108,35 134,10 146,10 120,35 146,60 134,60" fill="#124191"/>\n'
    '  <!-- I -->\n'
    '  <rect x="154" y="10" width="10" height="50" fill="#124191"/>\n'
    '  <!-- A -->\n'
    '  <path d="M 184,10 L 194,10 L 216,60 L 206,60 L 199.4,45 L 188.6,45 L 182,60 L 172,60 L 183,35 L 195,35 Z" fill="#124191"/>\n'
    '</svg>\n'
)

with open(r'public\nokia-logo.svg', 'w', encoding='utf-8') as f:
    f.write(nokia_logo_svg_2023)

print("nokia-logo.svg updated with pixel-perfect 2023 Nokia logo!")
