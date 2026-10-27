# Static deployment

Run `npm run build`. Deploy only `dist/` to an HTTPS static host at the root of a dedicated origin. The app currently uses root-relative asset paths. A subdirectory deployment needs those four paths adjusted together.

Configure these response headers at the host:

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Cache-Control: no-store
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Use the correct HTML, CSS, and JavaScript content types. Do not add analytics, remote JavaScript, remote fonts, a service worker, or other applications to the same origin. Same-origin scripts can read this unencrypted local journal. HTTPS protects transport; it does not encrypt browser storage.

The included server is a bounded local development server, not a production host. It exposes only fixed app files on `127.0.0.1`, rejects unexpected Host headers, and never provides a journal API. Review the actual host's logging, security headers, and privacy policy before making a live service available. A live deployment has not been performed in this build.

Changing the site address, port, or browser profile creates a different storage location. Export data before moving. Browser/site data removal also removes the journal; it does not remove downloaded JSON backups.
