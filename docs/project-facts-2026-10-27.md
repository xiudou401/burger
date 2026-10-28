# Sydney Burger: Verified Portfolio Facts

Verified on 27 October 2026 (Australia/Sydney).
Source revision: `13bd60e`. Working tree was clean before this report.

## Verification Results

| Check | Result |
| --- | --- |
| Backend tests: `npm test` | 43 suites, 234 tests passed |
| Frontend tests: `npm test` | 28 files, 154 tests passed |
| Backend and frontend: `npm run typecheck` | Both passed |
| Backend and frontend: `npm run lint` | Both passed |
| Backend compilation: `npm exec -- tsc` | Passed |
| Frontend production bundle: `npm exec -- vite build` | Passed |
| Public homepage | HTTP 200; application shell rendered |
| Public `/api/health` | Returned `{"status":"ok"}` |
| Public `/api/menu-items` | HTTP 200; paginated data with 42 total menu items |
| Browser menu rendering | Failed on initial load and after one retry; console reported `ApiError: Request timeout` |
| Sample CloudFront menu image | HEAD and ordinary GET both returned HTTP 403 |

Tests exercise mocked dependencies in many service/repository cases. These
results do not establish live Stripe, database, email, or AI-provider integration
correctness. Build checks used installed dependencies and skipped npm prebuild
hooks; a clean dependency installation was not tested.

The public menu API returned data while the browser failed. A later single-item
API probe took approximately 8.47 seconds from this environment. This is a
single observation, not a benchmark or proof of the root cause. Browser network
conditions, the deployed API origin, hosting latency, and request timeouts need
further investigation. Health success does not establish database readiness.

## Strongest Implemented Capabilities

### 1. Recoverable Checkout and Payment State

- Persisted per-user checkout attempt keys survive reloads; cart changes retain
  older attempt keys so superseded unpaid Stripe sessions can be closed.
- The server validates cart contents, prices and order snapshots. Reused
  attempts must match the original items and quantities.
- Checkout-session creation uses claims and leases; resumed Stripe sessions
  are checked for payment, expiration and open status.
- Signed webhooks are verified before payment updates. Amount, AUD currency,
  metadata and order reference are checked against the saved order.
- Conditional updates and webhook claims handle repeated events and races.
- Frontend cleanup preserves a newer cart or newer checkout when an older
  order completes payment.
- Evidence: `backend/src/services/checkout-order.service.ts`,
  `backend/src/services/stripe-payment.service.ts`,
  `backend/src/controllers/stripe.controller.test.ts`,
  `backend/src/services/order.service.test.ts`,
  `frontend/src/utils/checkout-attempt.test.ts`.

### 2. Retryable Payment Notifications

- Paid-order notifications are persisted as outbox events with a unique event
  key instead of being executed directly inside the paid webhook handler.
- A worker claims events, records failures, retries eligible events and
  reclaims stale processing work. Completion updates check the claim token.
- Tests cover event enqueueing, successful processing and side-effect failure.
- Evidence: `backend/src/services/outbox.service.ts`,
  `backend/src/repositories/outbox-event.repository.ts`,
  `backend/src/services/outbox.service.test.ts`.
- Boundary: do not claim exactly-once notification delivery or an atomic
  transaction covering both the order update and outbox insertion. The reviewed
  service performs these as separate operations; duplicate paid events can
  re-enqueue the event idempotently.

### 3. AI Operations Insights Grounded in Backend Data

- Admin daily briefs, chat and alert investigation use deterministic MongoDB
  analytics and restricted operational tools.
- Tool selection and bounded investigation branches are implemented in backend
  application code. Do not describe this as unrestricted autonomous model
  planning or model-selected function calls.
- JSON responses are schema-validated; fallback insights are available when
  the model client is unavailable. Runs record tools and execution information.
- Tests cover verified analytics context, daily briefs, fallback, failed runs,
  cancellation investigation, item performance and attachment-rate tools.
- Evidence: `backend/src/services/admin-insight.service.ts`,
  `backend/src/services/admin-agent-tools.ts`,
  `backend/src/services/admin-insight.service.test.ts`.
- Boundary: no live authenticated AI request was made in this verification.
  Current routes reviewed expose admin insights; do not reuse older claims of
  a customer-facing menu chatbot without checking the current implementation.

### 4. Authentication and Operational Access

- JWT access tokens, HttpOnly refresh cookies, refresh-session rotation,
  token-family replay handling, origin/header CSRF checks and role permissions.
- Tests include concurrent refresh grace periods, replay revocation and
  rollback when replacement-session creation/linking fails.
- Evidence: `backend/src/services/auth-session.service.test.ts`,
  `backend/src/middleware/security.test.ts`,
  `frontend/src/store/auth/auth-provider.test.tsx`.
- Boundary: these controls do not establish an independent security audit or
  compliance certification.

### 5. Frontend Tooling and Cloud Assets

- React 19/TypeScript frontend now uses Vite, with lazy-loaded page bundles
  visible in the successful production build.
- Backend generates short-lived S3 presigned image upload URLs; the live menu
  API returns CloudFront image URLs.
- Evidence: `frontend/package.json`, `frontend/vite.config.mts`,
  `backend/src/services/upload.service.ts`, `frontend/vercel.json`.
- A live API image URL, ending in
  `/menu-images/catalog/smoky-bacon-cheese.png`, returned HTTP 403 on both HEAD
  and GET. This establishes a failure for that sampled image, not every image;
  the bucket/origin policy and object existence were not inspected.
- Boundary: S3 upload was not exercised end to end; successful CDN image
  delivery cannot currently be claimed based on this verification.
  ECS/Fargate is an optional documented deployment path, not verified as the
  current live backend. Do not claim a measured speed improvement from Vite.

## Resume Bullet Bank

Select four or five according to the job; do not paste every bullet into one
resume. Describe the platform as a deployed portfolio project using Stripe
test mode, without implying paying customers or commercial-scale traffic.

- Built and deployed a full-stack restaurant ordering platform using React,
  TypeScript, Express and MongoDB, covering customer checkout, role-based staff
  operations and real-time order updates.
- Engineered recoverable Stripe checkout with persisted attempt keys,
  server-validated order snapshots, signed webhooks and conditional payment
  updates to handle retries, stale sessions and concurrent requests.
- Implemented a MongoDB-backed outbox worker with event deduplication, processing
  leases and failure retries for paid-order notifications.
- Built AI operations briefs and alert investigations grounded in MongoDB
  analytics, with restricted read-only tools, schema-validated responses,
  deterministic fallback and execution logging.
- Implemented refresh-token rotation, replay handling and role-based access
  controls, with regression tests for concurrent authentication flows.
- Maintained 388 passing automated tests across frontend and backend, including
  checkout recovery, webhook handling, authentication and AI insight workflows.

## Interview Stories to Prepare

1. Checkout recovery: a customer pays an older order after changing their cart.
   Explain attempt identity, order snapshots, payment authority and why the new
   cart must survive. Point to the regression tests.
2. Notification reliability: email fails after payment succeeds. Explain the
   outbox retry path, claims, duplicate-event handling and delivery limits.
3. AI evidence boundaries: a manager asks why cancellations increased. Explain
   verified metrics, restricted order evidence, bounded investigation and why
   correlation does not establish customer intent.

## Before Sending the Portfolio Link

- Investigate the observed browser menu timeout and verify menu rendering,
  filtering, images and cart quotes after the fix or environment diagnosis.
- Investigate the sampled CloudFront image's HTTP 403, including its object key,
  origin access and distribution configuration; then verify image rendering.
- Verify sign-in and refresh recovery using a designated demo account.
- Exercise Stripe test-mode checkout, reload/retry, changed-cart handling and
  webhook-driven order confirmation. Do not use a real payment.
- Verify staff order updates and customer real-time updates.
- Verify an authenticated AI daily brief and a provider-unavailable fallback.
- Replace pending claims with dated observations after completing those checks.

No authenticated sessions, payments, emails or production data were changed
as part of this verification.

## Follow-up Diagnosis and Repair

- The deployed public JavaScript bundle explicitly uses
  `https://api.sydneyburger.com`. A direct connection to that hostname timed
  out, while the main site's `/api` rewrite returned menu data.
- `frontend/vercel.json` now clears `VITE_API_URL` for Vercel builds, selecting
  the existing same-origin Render rewrite. The exact build command completed
  successfully, including the shared-package prebuild. Its entry bundle no
  longer contains the unreachable custom API hostname.
- This frontend configuration is a local change pending deployment; it has
  not yet resolved the live browser failure.
- The sampled S3 image key returned Not Found. The image bucket's CloudFront
  policy and origin signing configuration matched the intended distribution.
  The bucket listing under `menu-images/` returned no objects.
- Restoration of the repository's 42 public catalog PNGs was initiated after
  a dry-run preview, without deletion or public bucket access changes.
- The first sync encountered connection failures after partial uploads. A
  second sync with bounded timeouts completed successfully, restoring the
  remaining files. A CloudFront GET for `chicken-burger.png` returned HTTP 200.
- The originally failing `smoky-bacon-cheese.png` also now returns HTTP 200
  with `image/png` content type.
- The frontend change is still pending deployment. Google OAuth callback
  configuration, authenticated flows, test payment and AI remain unverified.

## AWS Recovery Supersedes the Vercel Proposal

The owner selected AWS as the deployment platform. The proposed Vercel build
override was withdrawn; `frontend/vercel.json` is back to its original state.

- ECS initially had desired/running task counts of zero. Its old ALB no longer
  existed, although the target group, subnets and security groups remained.
- Recreated the ALB with the existing network rules and target group, updated
  the CloudFront API origin and restored one Fargate task. These services
  resume ongoing AWS usage charges.
- Corrected GitHub's public `VITE_API_URL` deployment variable from the Render
  custom domain to `https://d37gxrym542prf.cloudfront.net`.
- Triggered the configured AWS deployment workflow for both frontend/backend
  from main at the baseline revision. Deployment run: 40436834726.
- Through the AWS CloudFront route, health and menu endpoints returned HTTP
  200. Browser verification showed menu items, prices and restored images.
- `www.sydneyburger.com` still resolves to Vercel; `api.sydneyburger.com` still
  resolves to Render. CloudFront currently has no custom aliases or matching
  ACM certificate in us-east-1. Custom-domain migration is separate pending
  DNS/certificate work; the current IAM user cannot list Route 53 hosted zones.
- Authentication completion, Stripe test checkout and live AI remain unverified.
- AWS workflow 40436834726 completed successfully. ECS revision 105 is running
  one task with rollout state COMPLETED, using the current main release.
- Added the missing uncached CloudFront `/socket.io/*` behavior. Its polling
  handshake returns HTTP 200 and advertises WebSocket upgrade support; this
  does not verify an authenticated end-to-end order event.
- Google sign-in initiation redirects to accounts.google.com with the AWS
  CloudFront callback URL. The full Google consent/login flow was not performed.
- Porkbun hosts authoritative DNS. The attempted us-east-1 ACM certificate
  request was denied for missing `acm:RequestCertificate`; no certificate was
  created. Domain migration needs an authorized AWS administrator and Porkbun
  DNS access. See `aws-deployment.md` for the concrete remaining steps.

## Custom Domains Verified: 28 October 2026

The first console certificate failed with CAA_ERROR inherited from the www
Vercel CNAME target. After the owner changed that target, replacement certificate
`37c695a1-498d-42d4-863a-c9dfb1a99f17` was issued and attached to the distribution
with apex, www and api aliases. CloudFront deployment completed.

The owner saved an apex ALIAS and www/api CNAMEs to the AWS distribution in
Porkbun. Authoritative DNS confirms www/api point to CloudFront. Ordinary HTTPS
requests to apex and www now return HTTP 200 with S3/CloudFront headers; api
`/api/health` returns HTTP 200 and `{"status":"ok"}`.

This verifies DNS/TLS routing, not completed user sign-in, Stripe payment or live
AI workflows.

## Canonical Login URLs: 28 October 2026

The owner confirmed Google login and refresh persistence on the initial
CloudFront flow. The subsequent domain rollout set frontend VITE_API_URL and
backend API_URL to `https://api.sydneyburger.com`, and backend FRONTEND_URL to
`https://www.sydneyburger.com`. ECS revision 107 is stable; frontend workflow
40603717017 completed successfully.

Production probes verified the frontend bundle's API origin, official API OAuth
callback, Secure/HttpOnly state cookie, cancelled-authorization redirect to www,
credentialed CORS and health. A Google authorization probe accepted the new
callback. The owner subsequently confirmed successful Google login and refresh
persistence on the final configuration.

A follow-up provider update added the three supported failure/expiration events
to the AWS Stripe test webhook; a read-back verified all four subscriptions.
The webhook URL, signing secret, payment return URLs and old Render endpoint
were preserved. Full payment reconciliation and real AI output remain unverified.

## AI Provider Configuration: 28 October 2026

A replacement API key was supplied through the Git-ignored backend environment
file and securely added to AWS Secrets Manager. ECS revision 108 references
that JSON key without a plaintext key in the task definition. A minimal
gpt-4o-mini JSON generation probe returned HTTP 200 with the expected output;
no customer data was included. ECS revision 108 completed its stable rollout;
the official API health endpoint returned HTTP 200. This proves provider
connectivity and a healthy deployment, not an authenticated AI workflow in the
deployed application.

## Synthetic Analytics Demo: 28 October 2026

Added 392 explicitly marked synthetic orders for 28 September to 27 October
in Sydney time, preserving all 84 earlier orders unchanged. Repeat application
inserted and modified zero records. The data produces intentional cancellation
and payment-failure scenarios; simulated revenue is not real trading history.

The owner's earlier UI result was verified in AgentRun as gpt-4o-mini. After
seeding, maintenance calls to the existing insight services also generated
monthly analysis and a daily brief using gpt-4o-mini. A daily-brief attempt
failed on excess card count before a successful retry; do not claim this
output-format issue has been fixed. See demo-month-dataset-2026-10-28.md.
