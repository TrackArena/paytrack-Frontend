# Security Policy

## Reporting a Vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.

Email **security@paytrack.dev** with:
- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

You will receive a response within 48 hours. We ask that you give us reasonable time to patch before any public disclosure.

## Frontend-Specific Security Notes

- The frontend never stores Stellar secret keys
- JWT access tokens in localStorage have a 15-minute lifetime
- HTTP-only refresh tokens are managed server-side
- All financial validation happens on the backend — frontend values are display-only
- Content-Security-Policy headers are set by the backend

## Scope

In scope: XSS vulnerabilities, authentication bypass, token exposure, data leakage to third parties.

Out of scope: Issues in third-party dependencies not directly introduced by PayTrack code (report those to the upstream project).
