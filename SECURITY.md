# Security and privacy

This prototype stores potentially sensitive journal text in unencrypted browser local storage. It is intended for personal learning on a private device. It is not suitable for clinical records, a shared device, or an application that needs authenticated/encrypted storage.

New/imported entries are schema-checked, size-bounded and rendered through text nodes. Import does not evaluate markup or scripts. All data is validated before a single storage write. A stale snapshot check reduces accidental overwrites by another tab; local storage does not provide cross-tab transactional guarantees.

The local server serves a fixed allowlist, binds to loopback, rejects unexpected Host headers, permits GET/HEAD, sets security headers, and has no write endpoint. Static deployments need equivalent headers and HTTPS. No telemetry, remote dependencies, or service worker is shipped.

Report a security defect with GitHub private vulnerability reporting where available. If that is unavailable, open an issue with a minimal public-safe description and request a private channel. Never include real journal entries, backups, personal details, or credentials in issues. Version 0.1 is the only supported line at present; no response-time guarantee is offered.
