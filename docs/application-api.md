# Application API

All application routes are prefixed with /api. Authenticated routes accept Authorization: Bearer access-token. Tokens expire after 15 minutes.

The Express API also exposes operational endpoints GET /health and GET /ready on port 8081. Kubernetes probes call these container endpoints directly; /ready checks the PostgreSQL connection. The web Nginx container exposes its own /health response, which is separate from API readiness.

## Identity
- POST /auth/register — email plus password (12–72 characters); returns a short-lived access token.
- POST /auth/login — verifies credentials and returns an access token.
- GET /me — current account profile.

## Portfolio management (authenticated, owner scoped)
- GET /portfolios — list the caller's portfolios.
- POST /portfolios — create a draft with slug, displayName, headline, bio, profession, experience[], skills[], projects[], and templateKey.
- PUT /portfolios/:slug — update a portfolio owned by the caller.
- POST /portfolios/:slug/publish — publish the page.
- POST /portfolios/:slug/unpublish — remove it from the public directory.
- DELETE /portfolios/:slug — delete the portfolio.

## Public
- GET /public/:slug — read a published portfolio only.

## Assets (authenticated)
- POST /assets/upload-url — request a ten-minute signed URL for an image. Supported types: JPEG, PNG and WebP. Upload bytes directly to the returned URL with the exact content type. Store the object name in the portfolio content record.

## Error semantics
400 input validation, 401 missing/expired token, 404 unknown or inaccessible portfolio, 409 duplicate email/slug, 429 rate limit, 503 asset storage not configured, 500 unexpected failure. API errors do not return stack traces or database details.
