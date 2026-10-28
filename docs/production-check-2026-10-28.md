# Production Checks: 28 October 2026

## Verified Through the Real Domains

- Public menu: HTTP 200; 42 total items reported.
- Public cart validation: HTTP 200; returned validated items, integer-cent
  total and menu version. No order was created.
- Sample menu image: HTTP 200 with image/png content type.
- Order history without authentication: HTTP 401.
- Admin AI daily brief without authentication: HTTP 401.
- Refresh without a session cookie: HTTP 401.
- www-to-api login preflight: HTTP 204, explicit www origin and credentials
  allowed.
- After the canonical-domain rollout, Google sign-in initiation redirects to
  accounts.google.com with callback
  `https://api.sydneyburger.com/api/auth/oauth/google/callback`.
- A simulated cancelled Google authorization returns to the official www
  login page; the OAuth state cookie is Secure and HttpOnly.

## Deployed Configuration Findings

### AI Provider Configuration Added

ECS revision 106 does not supply OPENAI_API_KEY in its environment or secret
references. The shared backend secret also has no OpenAI key. The runtime image
does not copy a .env file into its final stage. The reviewed insight client
returns deterministic fallback content when the key is absent.

That initial configuration could not call the real model through this client.
The owner subsequently supplied a replacement key in the Git-ignored local
backend configuration. A minimal gpt-4o-mini Chat Completions request with JSON
output returned HTTP 200 and the expected result, without sending customer data.

The key was added to the existing AWS Secrets Manager JSON, preserving other
entries, and verified by a private read-back comparison. ECS revision 108 adds
an OPENAI_API_KEY secret reference, retaining the same backend image and all
other runtime configuration. The ECS services-stable waiter completed and the
official API health endpoint returned HTTP 200 after rollout. The key is not in the task
definition's plaintext environment or in the frontend. An authenticated admin
AI request through the deployed application remains unverified.

### Stripe Test Event Subscriptions Repaired

The deployed Stripe key is a test-mode key. A read-only Stripe API request
succeeded and confirmed an enabled, non-live AWS webhook endpoint at
`https://d37gxrym542prf.cloudfront.net/api/stripe/webhook`.

Initially that endpoint subscribed only to checkout.session.completed. The
follow-up provider update added checkout.session.expired,
checkout.session.async_payment_failed and payment_intent.payment_failed.
A Stripe API read-back verified all four events on the enabled test endpoint.
This confirms subscriptions, not end-to-end event delivery or order reconciliation.

An enabled test-mode webhook also remains at the old Render backend. Confirm
whether it is still needed before disabling it. That endpoint was not modified.
The AWS endpoint URL and signing secret were preserved.

Stripe success/cancel return URLs point to the CloudFront hostname's /profile
route. The frontend still supports payment/orderId parameters there; this was
not classified as a broken route. Full redirect and payment behavior was not
tested.

### Canonical Login Domain Rollout

The deployed frontend bundle now uses `https://api.sydneyburger.com`. Backend
revision 107 sets API_URL to that origin and FRONTEND_URL to
`https://www.sydneyburger.com`, preserving existing trusted origins and secrets.
Frontend release 40603717017 completed successfully. Google accepted an
unauthenticated authorization request with the official API callback and showed
its sign-in page without redirect_uri_mismatch. No Google client setting was
modified. Health and credentialed CORS checks passed after deployment.

Before this change, the owner confirmed successful Google login and session
persistence after refresh on the CloudFront flow, and subsequently confirmed
successful Google login and refresh persistence on the final www/api flow.
Stripe redirects/webhooks were unchanged by the login-specific rollout; the
later subscription repair is recorded above.

## Not Verified

- Agent-run successful user/admin sign-in, refresh rotation and logout.
- Agent-run full Google OAuth round trip (owner manually confirmed success).
- Stripe Checkout completion and a signed webhook updating the corresponding
  order, including notification retries and customer/staff realtime events.
- Agent-run authenticated AI responses through the deployed HTTP application.
  A separate minimal provider request generated JSON; the owner subsequently
  generated a successful gpt-4o-mini report in the UI, verified in AgentRun.
- Render/AWS data or signing-secret consistency across their webhook endpoints.

The user confirmed a dedicated account exists but its credentials were not
available in a local file. No passwords were requested in chat or guessed.
Browser control was unavailable, so these checks used HTTP/API and deployment
configuration rather than a complete browser user journey.

No orders, payments, emails or account changes were created. Provider changes
included the AWS Stripe test webhook's event subscriptions and the AI secret
configuration described above. The canonical login deployment changed the
public runtime URLs. Secret values were never printed. Initial diagnostics used
memory only; the AI configuration upload required a mode-600 temporary input
file inside a mode-700 directory after CLI pipe incompatibility. The temporary
file and directory were removed in cleanup. The owner's Git-ignored local
configuration remains restricted to mode 600.

## Follow-Up Synthetic Monthly Dataset

At the owner's request, 392 marked synthetic orders were appended for the
preceding 30 complete Sydney dates. All 84 pre-existing order documents were
verified unchanged; a repeat apply inserted and modified nothing. No real
payments or notifications were triggered. See demo-month-dataset-2026-10-28.md
for the exact data boundary, repeatable command and AI verification results.

Maintenance invocations of the existing monthly insight and daily brief
services generated real gpt-4o-mini responses against the updated database.
The daily brief needed one retry after an oversized insight array was rejected
by the schema; this provider-format reliability issue remains unresolved.
