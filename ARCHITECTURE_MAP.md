# Entry Points
- `manifest.json` - Chrome extension configuration, permissions, and script loading
- `background.js` - Service worker initialization and lifecycle

# Functional Areas
- **Configuration & Core Utilities** (`functions.js`, `manifest.json`)
  - Shared utilities and configuration helpers
- **Popup Interface** (`popup.html`, `popup.js`)
  - Browser action display and interaction
- **Settings Page** (`options.html`, `options.js`)
  - User preferences and configuration UI
- **Assets** (`icons/`)
  - Extension icons and visual resources

# Directory Roles
- `icons/` - Extension branding and UI icons
- `.git/` - Version control (do not modify)

# Safe Modification Rules
- Safe: HTML structure and styling in `popup.html`, `options.html`
- Safe: UI logic in `popup.js`, `options.js`
- Safe: Shared utilities in `functions.js`
- Safe: Icon assets in `icons/`
- Do NOT modify: `manifest.json` without explicit request
- Do NOT modify: `background.js` without explicit request
- Do NOT modify: `.git/`, `LICENSE`, `README.md` without explicit request

# Navigation Rules for AI Agent
- Start with: `manifest.json` to understand extension entry points
- For popup features: Read `popup.html`, then `popup.js`, then `functions.js`
- For settings features: Read `options.html`, then `options.js`, then `functions.js`
- For background logic: Read `background.js`, then `functions.js`
- Do NOT scan entire repository for file discovery; use file paths specified in `manifest.json`
- Do NOT modify permissions, scripts list, or entry points in `manifest.json`
- Do NOT change background script behavior unless explicitly requested
