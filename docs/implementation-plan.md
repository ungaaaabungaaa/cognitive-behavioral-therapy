# CBT self-help prototype implementation

Approved project: NotesBuddy → cognitive-behavioral-therapy. The user authorized parallel work on 27 October 2026. Keep MyPortfolio unchanged. Original master revision `8d9c0efe2b0e86636c782ac5442dbc6f33cae774` is preserved on the remote branch `archive/before-cbt-2026-10-27`. Repository ID `MDEwOlJlcG9zaXRvcnkyNzYxNzgwNTI=` and its 17 stars must remain. Legacy Android sources have no license or project instructions; the new code is original, with MIT applying only to new files.

## Design and behavior

Deliver a small dependency-free browser application, named **Room to Think**, for personal reflection. Use a warm paper surface, ink typography, rust accent, notebook rules, and clear labels. Include a guided thought record (situation, feeling, rating, thought, evidence, balanced view, re-rating), a small-action exercise (plan, prediction, outcome), saved journal entries, and descriptive progress. Users can create, edit, delete, export, and import. No generated cover is approved yet.

This is a self-help prototype, without clinical assessment, diagnosis, AI treatment, or efficacy claims. NHS thought-record and reframing guidance inform original prompts; NICE distinguishes supported treatment from this unsupervised tool. Cite original sources. User data remains in this browser origin, is not encrypted, and is not sent to a server. Provide explicit Save, backup export, import preview with replace confirmation, and per-entry/all-data deletion confirmation. Do not persist unsaved drafts or ship analytics, remote fonts, or a service worker that can cache journals.

## Implementation steps

1. Preserve the source remotely, rename the approved repository, and verify identity/stars. Use an isolated feature worktree.
2. Write behavior tests first for record validation, safe bounded import/export, store failures, update/delete, summary calculations, and empty states. Implement pure model and repository adapters.
3. Add semantic responsive UI, accessible forms, journal editing, guided exercises, progress, backup import/export, and explicit data management.
4. Add a bounded loopback development server and a reproducible build that only copies public app files. Include no dependencies or hidden telemetry.
5. Test model, server boundaries/security headers, actual application flows and mobile layout. Document source provenance, privacy, limitations, setup, and deployment.
6. Commit/push, open a PR, and attach it. Root performs independent review and verified merge. Remove task-created caches/dependencies only after verified remote backup.

## Evidence required

Node tests and browser flows pass, including restart persistence, edit/delete, malicious import rendered as text, invalid/oversized import rejection without data loss, export/import round-trip, guided exercise, empty summary, and restricted server file access. CI runs clean install, tests, and build. Record exact browser checks and screenshots from the real running app. Publishing and hardware/clinical verification are separate claims.
