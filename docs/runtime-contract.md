# Runtime contract

The browser reads only `index.html`, `src/app.mjs`, `src/model.mjs`, and `src/styles.css`. The development server serves these four fixed paths on IPv4 loopback. It accepts GET and HEAD only, rejects other paths and unexpected Host headers, sets a restrictive content security policy, and never receives journal content. `PORT` defaults to 8793 and must be an integer from 1024 to 65535. The static build contains those same four files; deploy them to an HTTPS origin with the headers from `docs/deployment.md`.

## Journal format v1

A JSON backup has exactly `format: "room-to-think"`, `version: 1`, and `entries: [...]`. Limit: 1 MiB UTF-8 and 200 entries. Unknown fields, invalid dates, duplicate IDs and invalid ratings reject the entire import before writing. Entries retain text as text, including markup. A backup replaces current data only after a preview and explicit confirmation. Exported JSON is unencrypted.

Both entry types require UUID `id`, `type`, a real `YYYY-MM-DD` `date`, UTC ISO `createdAt`/`updatedAt` timestamps, integer `before` rating 0–100 and nullable `after` rating 0–100. Updates cannot precede creation. Thought text fields are `situation`, `emotion`, `thought`, `evidenceFor`, `evidenceAgainst`, and `balanced`. Action text fields are `activity`, `when`, `prediction`, and `outcome`; both outcome and later rating are filled or both are empty. Each text field is at most 2000 characters. Required text cannot be blank. Ratings are subjective feeling intensity, not risk or diagnosis.

Local storage key: `room-to-think.v1`. The serialized value is the same backup format. Save validates the full next state before a single storage write; a failure retains the previous in-memory journal. Unreadable saved data blocks saving and provides raw recovery export before reset. No draft autosave, account, server persistence, API, telemetry, model, or service worker exists.

A storage event refreshes clean non-editor views. An active editor keeps its original snapshot and warns about another tab's change, even before any typing; a subsequent save rejects that stale snapshot. Leaving the editor reloads stored state. The guard is best effort, not a cross-tab transaction.
