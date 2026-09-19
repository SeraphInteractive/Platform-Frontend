# Project Rules & Guidelines

## 1. Commenting Style
- **NEVER** use decorative ASCII banner/divider comments with long chains of characters (e.g. `/* ======================================================== */`, `// --------------------------`, or `// **************************`).
- Keep code clean and self-documenting. Use minimal, plain comments only when genuinely necessary for non-obvious logic.

## 2. Remote Synchronization (Dual-Remote Push)
- Whenever UI changes or frontend updates are committed and pushed in `vote-ui`, **ALWAYS** push to BOTH remotes:
  1. `origin` (`git@github.com:SeraphInteractive/Platform-Frontend.git`)
  2. `personal` (`git@github.com:Yancovert/Platform-Frontend-Preview.git`)
- When pulling or syncing, verify both remotes remain in sync so that personal Vercel auto-deployments (`https://vote-ui-five.vercel.app`) and Seraph upstream repository stay identical.

## 3. Design & Typography
- Maintain the obsidian dark theme.
- Wikipedia-style documentation: Clean encyclopedic typography, no decorative icons/emojis in formal articles, no em dashes, and real mathematical notation.
