# expose127

> Expose your localhost to the internet instantly — get a random public URL powered by hmrg.xyz
```
$ npx expose127 3000

  +--------------------------------------------------+
  |   EXPOSE127  --  instant public tunnel URLs      |
  +--------------------------------------------------+
  Instant public URLs for your localhost  |  v1.0.0  |  hmrg.xyz

  Public URL   https://fast-wave-4821.hmrg.xyz
  Forwarding   https://fast-wave-4821.hmrg.xyz → http://localhost:3000
  Status       online

  ────────────────────────────────────────────────
  Time       Method   Status   Path
  ────────────────────────────────────────────────
  14:23:01   GET      200      /
  14:23:04   POST     201      /api/users
```

---

## Install
```bash
# Zero install — just run it
npx expose127 <port>

# Or install globally
npm install -g expose127
expose127 <port>
```

---

## Usage
```bash
# Expose port 3000
expose127 3000

# Expose Laravel (php artisan serve)
expose127 8000

# Expose with a custom subdomain
expose127 8000 --subdomain my-project

# Expose a local HTTPS server
expose127 3000 --protocol https

# Short alias
expose127 t 3000
```

---

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --subdomain <n>` | Request a custom subdomain | random |
| `-p, --protocol <proto>` | Local protocol http or https | http |
| `-v, --version` | Print version | |
| `-h, --help` | Show help | |

---

## How it works
```
Your app (localhost:3000)
        │
        │  WebSocket tunnel
        ▼
expose127 CLI
        │
        ▼
hmrg.xyz tunnel server
        │
        ▼
https://fast-wave-4821.hmrg.xyz  ← share this with anyone
```

---

## Requirements

- Node.js 16 or higher
- Works on Windows, Mac and Linux

---

## Links

- Website: https://expose127.hostmargin.com
- Issues: https://client.hostmargin.com/submitticket.php?step=2&deptid=1
- npm: https://npmjs.com/package/expose127

---

## License

MIT