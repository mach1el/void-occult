import math

# We will generate an SVG and then tell the user how to convert it, or just output SVG.
# Since we don't know if Pillow is installed, let's just generate an SVG which can be opened in browser and saved as PNG.
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a1f"/>
      <stop offset="56%" stop-color="#07091a"/>
      <stop offset="100%" stop-color="#050610"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1440" fill="url(#bg)"/>
  
  <!-- Grid Lines -->
  <g stroke="#2e2552" stroke-width="2">
    <!-- Outer border -->
    <rect x="10" y="10" width="1060" height="1420" fill="none" rx="8"/>
    
    <!-- Vertical Lines -->
    <line x1="275" y1="10" x2="275" y2="1430" />
    <line x1="540" y1="10" x2="540" y2="365" />
    <line x1="540" y1="1075" x2="540" y2="1430" />
    <line x1="805" y1="10" x2="805" y2="1430" />
    
    <!-- Horizontal Lines -->
    <line x1="10" y1="365" x2="1070" y2="365" />
    <line x1="10" y1="720" x2="275" y2="720" />
    <line x1="805" y1="720" x2="1070" y2="720" />
    <line x1="10" y1="1075" x2="1070" y2="1075" />
  </g>
  
  <!-- Inner Center Area -->
  <text x="540" y="720" font-family="serif" font-size="60" font-weight="bold" fill="#ece6f7" text-anchor="middle" dominant-baseline="middle" letter-spacing="4">LÁ SỐ TỬ VI</text>
</svg>
"""

with open("khung-la-so.svg", "w") as f:
    f.write(svg_content)

print("Created khung-la-so.svg")
