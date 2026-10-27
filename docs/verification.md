# Verification record

27 October 2026, macOS, Node.js 24.18.0.

- Domain and server checks: 11 tests passed, no skips. Validation covers real calendar dates and timestamps, UUIDs, required fields, ratings, malformed/oversized backups, duplicates, record count limits, round trips, storage failures, updates/deletions, reloads, summary calculations and stale-tab overwrite detection.
- Server integration checks use a real temporary loopback server. They verify app files, response headers, GET/HEAD, and rejection of non-public paths, malformed paths, wrong methods, and unexpected Host headers.
- Static build copies four public files only. No journal data, source repository files, credentials, tests, or legacy Android files are included.
- Browser checks passed in the Codex in-app browser at 1280×720 using invented examples: thought creation, persisted reload, action planning and later outcome editing (independently checked by root), descriptive progress, unsaved-draft keep/discard confirmation, invalid backup rejection without changing records, valid backup preview and confirmed replacement, literal display of imported markup, and entry deletion. A real homepage screenshot is `app-desktop.png`. Mobile media rules were reviewed, but a resized mobile viewport has not been verified. No live deployment or clinical evaluation has been performed.

Node coverage measures imported model/server modules, not the browser interface. Root independently reviewed the core model/server/rendering rules and exercised the action flow. Root identified stale-tab overwrites and an untouched-editor conflict; both were corrected. CI results and final independent approval remain separate evidence.
