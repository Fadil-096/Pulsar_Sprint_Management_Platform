import re

# Official 2023 Nokia SVG path from Wikimedia Commons
nokia_svg_official_white = (
    '<svg viewBox="0 0 338.667 79.687" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:32px;width:auto;display:block">'
    '<path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z" fill="#fff"/>'
    '</svg>'
)

nokia_svg_official_topbar = (
    '<svg viewBox="0 0 338.667 79.687" xmlns="http://www.w3.org/2000/svg" aria-label="Nokia" style="height:18px;width:auto;display:block">'
    '<path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z" fill="#fff"/>'
    '</svg>'
)

# ─── 1. Update app.js ────────────────────────────────────────────────────────
with open(r'public\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace SVG in renderLoginPage
js = re.sub(
    r'<div class="login-logo-large">.*?<span class="logo-divider-vertical"></span>',
    '<div class="login-logo-large">\n            ' + nokia_svg_official_white + '\n            <span class="logo-divider-vertical"></span>',
    js,
    flags=re.DOTALL
)

# Replace SVG in buildShell
js = re.sub(
    r'<div class="topbar-logo">.*?<span class="logo-divider"></span>',
    '<div class="topbar-logo">\n          ' + nokia_svg_official_topbar + '\n          <span class="logo-divider"></span>',
    js,
    flags=re.DOTALL
)

with open(r'public\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("app.js updated with official Wikimedia 2023 Nokia logo!")

# ─── 2. Update nokia-logo.svg ────────────────────────────────────────────────
nokia_logo_svg_2023 = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 338.667 79.687" fill="#005aff">\n'
    '  <path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z"/>\n'
    '</svg>\n'
)

with open(r'public\nokia-logo.svg', 'w', encoding='utf-8') as f:
    f.write(nokia_logo_svg_2023)

print("nokia-logo.svg updated with official Wikimedia 2023 Nokia logo!")
