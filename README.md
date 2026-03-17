# hostmargin

> Expose your localhost to the internet instantly — a random `*.hostmargin.com` URL, zero config.

```
$ npx hostmargin 3000

  ██╗  ██╗ ██████╗ ███████╗████████╗███╗   ███╗ █████╗ ██████╗  ...
  ...

  Public URL   https://fast-wave-4821.hostmargin.com
  Forwarding   https://fast-wave-4821.hostmargin.com → http://localhost:3000
  Status       online

  ──────────────────────────────────────────────────────────────
  Time       Method   Status   Path
  ──────────────────────────────────────────────────────────────
  14:23:01   GET      200      /
  14:23:01   GET      200      /static/app.js
  14:23:04   POST     201      /api/users
```

---

## Install

```bash
# Zero install — just run it
npx hostmargin <port>

# Or install globally
npm install -g hostmargin
```

## Usage

```bash
# Expose port 3000
hostmargin 3000

# Expose port 8000 with a custom subdomain
hostmargin tunnel 8000 --subdomain my-laravel-app

# Expose an HTTPS local server
hostmargin tunnel 3000 --protocol https

# Short alias
hostmargin t 3000
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --subdomain <n>` | Request a custom subdomain | random |
| `-p, --protocol <proto>` | Local server protocol (http/https) | http |
| `--host <host>` | Override tunnel server | tunnel.hostmargin.com |
| `--port <port>` | Override tunnel server port | 443 |
| `-v, --version` | Print version | |

## Programmatic API

```js
const { tunnel } = require('hostmargin');

const t = await tunnel(3000);
console.log(t.url);    // https://fast-wave-4821.hostmargin.com
// ...later
t.close();
```

## How it works

```
Your browser
    │
    ▼  https://fast-wave-4821.hostmargin.com
[Nginx on hostmargin.com]
    │
    ▼  proxy
[Tunnel server — Node.js]
    │
    │  WebSocket (persistent)
    ▼
[hostmargin CLI — your machine]
    │
    ▼  http://localhost:3000
[Your local app]
```

---

## License

MIT — made by [Hostmargin](https://hostmargin.com)
