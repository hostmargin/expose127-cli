# How to publish hostmargin publicly (source stays private)

## The strategy

```
Private GitHub repo (your source)
        │
        │  npm run build   → obfuscates src/ into dist/
        │  npm publish     → pushes only dist/ + README to npm
        ▼
npm registry (public, obfuscated)
        │
        │  npx hostmargin 3000
        ▼
Anyone's machine (gets the unreadable blob, not your source)
```

---

## One-time setup

### 1. Create a free npm account
Go to https://npmjs.com → Sign Up
Pick a username. Your package will be at:
  https://npmjs.com/package/hostmargin

### 2. Login to npm from your terminal
```bash
npm login
# Enter your npm username, password, email
# It will ask for OTP if you have 2FA enabled (recommended)
```

### 3. Create a private GitHub repo
Go to https://github.com/new
- Name: hostmargin-cli
- Set to **Private** ← important
- Do not add README (you already have one)

### 4. Push your source to GitHub
```bash
cd hostmargin-cli
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hostmargin-cli.git
git push -u origin main
```

Your source is now private on GitHub. npm will never see it.

---

## Every time you publish a new version

### Step 1 — Bump the version
```bash
# For a bug fix:
npm version patch    # 1.0.0 → 1.0.1

# For new features:
npm version minor    # 1.0.0 → 1.1.0

# For breaking changes:
npm version major    # 1.0.0 → 2.0.0
```

### Step 2 — Build + publish (one command)
```bash
npm publish
```

That's it. `npm publish` automatically runs `npm run build` first
(because of the `prepublishOnly` script), then uploads only the
`dist/` folder and `README.md` to npm.

---

## Verify what gets uploaded BEFORE publishing

```bash
npm pack --dry-run
```

You will see something like:
```
npm notice
npm notice 📦  hostmargin@1.0.0
npm notice === Tarball Contents ===
npm notice 1.5kB  README.md
npm notice 10.2kB dist/banner.js      ← obfuscated ✔
npm notice 13.0kB dist/cli.js         ← obfuscated ✔
npm notice 3.7kB  dist/config.js      ← obfuscated ✔
npm notice 11.5kB dist/forwarder.js   ← obfuscated ✔
npm notice 9.1kB  dist/index.js       ← obfuscated ✔
npm notice 11.0kB dist/logger.js      ← obfuscated ✔
npm notice 17.9kB dist/tunnel.js      ← obfuscated ✔
npm notice 7.7kB  dist/validate.js    ← obfuscated ✔
npm notice === Tarball Details ===
npm notice name:          hostmargin
npm notice version:       1.0.0
npm notice filename:      hostmargin-1.0.0.tgz
npm notice total files:   9
```

Notice: no src/ files. Your source is NOT in there.

---

## What users do

```bash
# Zero install — works anywhere with Node.js 16+
npx hostmargin 3000

# Or install permanently
npm install -g hostmargin
hostmargin 3000
```

---

## Confirming source code is NOT visible

After publishing, anyone can inspect your package at:
  https://unpkg.com/hostmargin/dist/cli.js

They will see the obfuscated output — not your source.

---

## GitHub Actions (optional — auto-publish on git tag)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'   # triggers on: git tag v1.0.1 && git push --tags

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then in GitHub repo → Settings → Secrets → add `NPM_TOKEN`
(get token from npmjs.com → Account → Access Tokens → Generate New Token → Automation)

Now publishing is:
```bash
git tag v1.0.1
git push --tags
# GitHub Actions builds + publishes automatically
```
