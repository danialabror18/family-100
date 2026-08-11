# AGENTS.md

## Cursor Cloud specific instructions

### What this is
`Family 100` is a fully static, client-side web app (vanilla HTML/CSS/JS ES modules) — a game-show survey board. There is no backend, no build step, no package manager, and no automated tests or linters in the repo. Files: `index.html`, `app.js`, `styles.css`, and `data/survey.json`.

### Running it (dev)
Serve the folder over HTTP (do NOT open `index.html` via `file://` — `app.js` is an ES module and it `fetch()`es `./data/survey.json`, both of which require an HTTP origin). See `README.md` for the canonical command:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. `python3` and `node` are both preinstalled, so no dependency install is needed; the startup update script is effectively a no-op.

### Editing questions
Round content lives in `data/survey.json` (12 rounds). It is loaded with `cache: "no-store"`, so edits show up on a plain page refresh. Invalid JSON makes the board display `SURVEY BELUM SIAP` instead of a question — validate JSON after edits.

### Gotchas
- A `404 /favicon.ico` in the console is expected and harmless (no favicon is shipped).
