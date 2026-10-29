# Sinarmas Landing Page (Static Bundle)

This folder contains the complete, self-contained static extraction of the **SearchPoint Landing Page** configured for the **Sinarmas** environment variant (`TENANT=sinarmas`).

---

## 📁 Directory Structure

```text
landing-sinarmas/
├── index.html           # Main production static HTML entrypoint
├── index-relative.html  # Portable variant with relative paths (for subpath hosting)
├── landing.rsc          # RSC prefetch payload
├── login.rsc            # RSC login prefetch payload
├── server.js            # Zero-dependency Node.js static preview server
├── _next/               # Compiled JS runtime chunks, CSS stylesheets, and WOFF2 font files
│   └── static/
│       ├── chunks/      # React & Turbopack JS chunks and CSS styles
│       └── media/       # WOFF2 font assets (Manrope, IBM Plex Serif, Inter)
├── icons/               # Sinarmas official brand logos & SVG integrations
│   ├── logo.svg         # Sinarmas vector brand logo
│   └── brands/          # Enterprise connector icons (OneDrive, SharePoint, Teams, etc.)
├── favicons/            # Sinarmas favicons (.ico, .png)
├── images/              # Walkthrough and tutorial screenshots
└── videos/              # Video walkthroughs (mac-installer.mp4)
```

---

## 🎨 Tenant & Brand Configuration Verified

- **Tenant Attribute**: `<html lang="en" data-tenant="sinarmas">`
- **Brand Colors**: Sinarmas red accent (`--primary: oklch(0.603 0.235 26.909)`)
- **Logo**: Sinarmas brand logo (`/icons/logo.svg`)
- **Favicons**: Sinarmas customized icons (`/favicons/sinarmas.ico`, `/favicons/sinarmas.png`)
- **Page Title**: `SearchPoint — Sinarmas`
- **Hero & Copy**: Tenant-specific messaging ("Secure enterprise search for Sinarmas")

---

## ⚡ Active Animations & Interactions Included

1. **WebGL2 Cloud Shader Canvas**: Dynamic GPU-accelerated cloud gradient background in the hero.
2. **Dynamic Harmonic Sine Waves (`HeroWaves`)**: Smooth 6-strand sinusoidal animation running at 60 FPS via `requestAnimationFrame`.
3. **Concentric Orbits & Particles (`HeroOrbits`)**: SVG orbital motion and floating particles.
4. **Interactive Desktop Search Demo**: Typing animation simulating spotlight queries, with clickable category tabs and filter states.
5. **Theme Switcher**: Dark mode / Light mode toggle.
6. **Language Switcher**: English (EN) and Indonesian (ID) toggle.
7. **Collapsible Accordions**: Interactive Enterprise security audits and FAQ sections.
8. **CSS Keyframe Animations**: Flowing gradient mesh, star movement, breathing pulses, and glowing borders.

---

## 🚀 How to Run / Preview

### Option 1: Built-in Node.js Server (Zero Dependencies)
```bash
node server.js
```
Then open [http://localhost:3000](http://localhost:3000) in your browser. (You can also set `PORT=8080 node server.js`).

### Option 2: Python 3
```bash
python3 -m http.server 3000
```
Then open [http://localhost:3000](http://localhost:3000).

### Option 3: npx serve
```bash
npx serve .
```

### Option 4: Deploy to Static Hosting
Drop the contents of `landing-sinarmas/` into any static web server or hosting service:
- **Nginx / Apache / Caddy**
- **Cloudflare Pages / Vercel / Netlify**
- **AWS S3 / Google Cloud Storage / Azure Blob Storage**
