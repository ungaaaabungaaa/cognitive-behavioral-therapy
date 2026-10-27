# Contributing

Use Node.js 22 or newer. Run `npm ci`, `npm run check`, and `npm run test:coverage`. The application has no dependencies. Keep source and browser code compatible with modern browsers, and keep hosting root-relative paths explicit.

Changes to data formats need versioning and failure tests before users import them. Add behavior tests for storage failures, malformed inputs, bounds, editing, or progress calculations when those rules change. Exercise the real browser flow after UI changes. Use invented data only.

Keep prompts neutral and cite primary sources for health-related content. Do not introduce diagnosis, treatment recommendations, efficacy claims, AI responses, remote services, or tracking without a separate design and privacy review. Avoid copying copyrighted worksheets. Describe AI assistance accurately when upstream policies require it.

A pull request should explain the user problem, behavior change, checks actually run, and any unverified limits. Do not include private data, generated logs, dependencies, or unapproved cover images.
