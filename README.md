# ReadyHire Finance

AI-powered interview preparation platform for finance professionals. 51 roles, 30+ company profiles, 25 case studies across 5 career levels.

## Quick Deploy to Netlify

### Step 1 — Local Setup

```bash
unzip readyhire-netlify.zip
cd readyhire-netlify
npm install
```

### Step 2 — Test Locally (optional)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Copy environment template and add your API key
cp .env.example .env
# Edit .env and add your Anthropic API key

# Run with serverless functions
netlify dev
# Opens at http://localhost:8888
```

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: ReadyHire Finance"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/readyhire-finance.git
git push -u origin main
```

### Step 4 — Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repo
4. Build settings will auto-detect from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **"Deploy site"**

### Step 5 — Add API Key (CRITICAL)

1. In Netlify dashboard → **Site configuration** → **Environment variables**
2. Click **"Add a variable"**
3. Add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-your-key-here`
4. **Trigger a redeploy** (Deploys → Trigger deploy → Deploy site)

### Step 6 — Custom Domain (optional)

1. In Netlify → **Domain management** → **Add a domain**
2. Follow DNS setup instructions
3. Free SSL is automatic

---

## Architecture

```
Browser  →  /.netlify/functions/ai-feedback   →  Anthropic API
         →  /.netlify/functions/ai-generate    →  Anthropic API
                    ↑
         API key lives here (server-side only, never sent to browser)
```

## Project Structure

```
readyhire-netlify/
├── netlify/
│   └── functions/
│       ├── ai-feedback.js    ← Secure feedback endpoint
│       └── ai-generate.js    ← Secure question/case generation
├── src/
│   ├── App.jsx               ← Main application (all components)
│   ├── index.css              ← Tailwind + custom styles
│   └── main.jsx               ← React entry point
├── public/
│   └── favicon.svg            ← App icon
├── index.html                 ← HTML with SEO meta tags
├── netlify.toml               ← Netlify build + function config
├── package.json               ← Dependencies
├── vite.config.js             ← Vite bundler config
├── tailwind.config.js         ← Tailwind config
├── postcss.config.js          ← PostCSS config
├── .env.example               ← API key template
├── .gitignore                 ← Git ignore rules
└── README.md                  ← This file
```

## What's Fixed (vs original)

| Issue | Before | After |
|-------|--------|-------|
| API Security | Direct browser calls to Anthropic (blocked by CORS, no key) | Netlify Functions proxy — key stays server-side |
| Data Persistence | All state lost on refresh | localStorage saves user, profile, history, scores |
| Trial System | Reset on every login | Trial start date persisted, survives refresh/relogin |
| Admin Access | Hardcoded email gave anyone admin | Removed hardcoded admin backdoor |
| Social Proof | Fake user count & testimonials | Honest product metrics (51 roles, 30+ companies) |
| SEO | No meta tags | Full Open Graph, Twitter Card, description, keywords |
| Typo | `font-exrabold` | `font-extrabold` |
| CSS | Duplicate `italic italic` class | Single `italic` |

## Cost Estimates

| Service | Cost |
|---------|------|
| Netlify hosting | Free (100GB bandwidth/month) |
| Netlify Functions | Free (125k invocations/month) |
| Anthropic API | ~£0.003 per AI feedback call |
| Custom domain | ~£10/year (optional) |

**Usage scenarios:**
- 50 users × 10 sessions = 500 requests ≈ £1.50/month
- 500 users × 10 sessions = 5,000 requests ≈ £15/month
- Heavy usage: upgrade Netlify to Pro ($19/month) for more functions

## Remaining Improvements (Post-Launch)

These are recommended but not blocking:

- **Real authentication** — integrate Firebase Auth or Supabase Auth
- **Real payments** — integrate Stripe for the £19/month Premium tier
- **Database** — move from localStorage to Supabase/Firebase for cross-device sync
- **Case study AI grading** — currently uses random scoring; wire up to AI endpoint
- **Voice transcription** — add speech-to-text to auto-fill answers from recordings
- **Accessibility** — add aria-labels, focus management, improve contrast ratios
- **Code splitting** — break the single App.jsx into modules for maintainability

## Tech Stack

- React 18 + Vite
- Tailwind CSS 3
- Lucide Icons
- Netlify Functions (serverless)
- Anthropic Claude API

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next question |
| `D` | Toggle dark mode |
| `?` | Show shortcuts |
| `Esc` | Close modal |
