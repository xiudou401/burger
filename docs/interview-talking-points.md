# Interview Talking Points

Use this guide to explain Burger Club in interviews. Keep the first pass short,
then go deeper when the interviewer asks follow-up questions.

## Project Pitch

Burger Club is a Sydney-focused full-stack restaurant ordering platform. It is
built with React, TypeScript, Express, MongoDB, and Stripe. Customers can browse
an AUD menu, sign in, validate a cart, pay with Stripe Checkout, and view recent
orders. Staff/admin users can manage operational workflows. The app is deployed
with Vercel and Render, with MongoDB Atlas, Resend, Google OAuth, and Stripe
integrated.

The main engineering goal was to make the project feel like a real ordering
system rather than a simple CRUD demo. That is why the project includes
server-side cart validation, webhook-driven payment state, refresh-token
sessions, CSRF protection, rate limiting, email verification, and deployment
documentation.

## 1. Auth Flow

### Short Explanation

The app uses short-lived JWT access tokens and HttpOnly refresh-token cookies.
The access token is kept in frontend memory and sent with the `Authorization`
header. The refresh token is stored in an HttpOnly cookie so frontend JavaScript
cannot read it. When the access token expires, the frontend calls the refresh
endpoint, the backend rotates the refresh session, and a new access token is
returned.

### How It Works

1. User signs up or logs in.
2. Backend validates the request body with Zod.
3. Passwords are hashed with PBKDF2-SHA512 using a random salt.
4. Backend creates:
   - a JWT access token
   - a random refresh token
   - a hashed refresh-token session in MongoDB
5. Backend sends the refresh token as an HttpOnly cookie.
6. Frontend stores the access token only in memory.
7. API requests use:
   - `Authorization: Bearer <accessToken>`
   - `credentials: include` for cookie-backed auth endpoints
8. If a normal API request returns `401`, the frontend performs a single-flight
   refresh so concurrent requests do not all rotate the same refresh token.
9. Refresh-token rotation atomically consumes the old session before creating a
   new one.

### Security Points To Mention

- Refresh tokens are not stored in localStorage.
- The refresh cookie is `HttpOnly`, `Secure` in production, scoped to
  `/api/auth`, and configured for cross-site deployment.
- Auth routes use CSRF protection through trusted `Origin` checking and a custom
  `X-CSRF-Protection` header.
- Login/signup/reset flows are rate limited.
- JWT signature verification uses constant-time comparison.
- Production mode requires real email configuration so development tokens are
  not leaked.

### Good Interview Answer

```text
I separated access and refresh tokens by risk. The access token is short-lived
and kept in memory, which avoids persistent XSS exposure through localStorage.
The refresh token is longer-lived but stored in an HttpOnly cookie, so the
browser can send it but frontend JavaScript cannot read it. Because cookies are
sent automatically, I added CSRF protection on auth routes using Origin checks
and a custom header. Refresh sessions are stored hashed in MongoDB and rotated
atomically, so a used refresh token cannot be reused.
```

### Likely Follow-Up Questions

**Why not store access tokens in localStorage?**

Because localStorage is readable by JavaScript. If an XSS bug exists, an attacker
could steal the token. Keeping the access token in memory reduces persistence.

**Why is HttpOnly not enough for CSRF?**

HttpOnly prevents JavaScript from reading the cookie, but the browser can still
send the cookie automatically. That is why refresh/logout/signup/login routes
also check request origin and a custom CSRF header.

**Why rotate refresh tokens?**

If a refresh token is stolen, rotation limits reuse. After a successful refresh,
the old session is consumed. If the old token appears again, it no longer works.

## 2. Stripe Payment Flow

### Short Explanation

The frontend never decides the final payment amount. Before checkout, the
backend validates the cart, calculates totals using integer AUD cents, creates a
Stripe Checkout Session, and stores the pending order. Stripe webhook events are
the source of truth for payment status.

### How It Works

1. User adds items to the cart.
2. Frontend asks the backend to validate the cart against the current menu.
3. Backend calculates item subtotals and order totals in integer cents.
4. Backend creates an order with pending payment state.
5. Backend creates a Stripe Checkout Session.
6. Frontend redirects the user to Stripe Checkout.
7. After payment, Stripe redirects the user back to the profile page.
8. Separately, Stripe sends a signed webhook to the backend.
9. Backend verifies the webhook signature.
10. Backend marks the order as paid or failed based on trusted Stripe events.
11. Repeated webhook events are handled idempotently.

### Security And Reliability Points

- Payment totals are calculated server-side.
- Money is represented as integer cents, not floating point dollars.
- Stripe webhook signature verification uses the raw request body.
- The success redirect is not trusted as payment proof.
- Webhook handling is idempotent so repeated Stripe events do not duplicate
  order confirmation work.
- Pending payment orders are tracked separately from paid orders.

### Good Interview Answer

```text
For payment, the browser is never the source of truth. The backend validates the
cart against the menu and sends Stripe integer minor units, so users cannot
change prices in the client. After checkout, the frontend success URL only
improves the UX. The backend waits for Stripe's signed webhook before marking an
order as paid. I also made the paid update idempotent because Stripe webhooks can
be retried.
```

### Likely Follow-Up Questions

**Why use webhooks instead of the success URL?**

The success URL proves only that the browser returned from Stripe. It does not
prove payment was completed. A signed Stripe webhook is a trusted server-to-
server event.

**Why store money as cents?**

Floating point numbers can introduce precision errors. Integer cents are safer
for totals and for Stripe minor-unit amounts.

**What happens if Stripe sends the same webhook twice?**

The backend checks whether the order is already paid before sending confirmation
work again. That makes webhook handling idempotent.

## 3. Cart Quote And Menu Version Consistency

### Short Explanation

The cart uses backend quote validation and menu versioning so checkout does not
use stale prices or stale menu data. The frontend can estimate totals for UX,
but the backend quote is the validated truth.

### How It Works

1. Backend exposes a menu version.
2. Frontend polls menu version periodically.
3. Cart quote validation sends:
   - cart item IDs and quantities
   - current menu version
4. Backend validates that requested items still exist and prices are current.
5. Backend returns a validated quote with menu version and item prices.
6. If the backend detects a menu-version conflict, the frontend refreshes the
   menu version and invalidates the old quote.
7. The cart quote engine uses debounce for cart edits, request cancellation, and
   stale-response checks to avoid old data overwriting newer state.

### Race Condition Handling

- Cart changes are debounced before automatic quote validation.
- Menu-version changes trigger quote refresh.
- In-flight quote requests are reused when the request key is the same.
- Older requests are aborted or ignored if a newer cart snapshot exists.
- Quote state stores the cart signature it was generated for.

### Good Interview Answer

```text
I wanted checkout to behave like a real ordering system where menu data can
change while a user is browsing. The frontend keeps a menu version and validates
the cart against the backend. If the menu version changes, the quote is treated
as stale and refreshed. I also store the cart signature with the quote, so a
response for an old cart cannot overwrite a newer cart state.
```

### Likely Follow-Up Questions

**Why not just trust frontend cart totals?**

Because users can modify browser state. The backend must validate item IDs,
quantities, prices, and menu version before checkout.

**Why poll menu version?**

It lets the frontend detect when staff/admin changes the menu and prompt or
refresh the cart quote before checkout.

**Why debounce quote validation?**

Cart quantity changes can happen quickly. Debouncing reduces unnecessary backend
requests while still keeping the quote fresh.

## 4. Deployment Architecture

### Current Live Deployment

```text
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas
Email: Resend
Payments: Stripe
OAuth: Google
```

The frontend uses relative `/api` requests. In development, Create React App
proxies them to the local backend. In production, Vercel rewrites `/api/*` to
the Render backend.

### Current Production Concerns

- Render backend uses production environment variables.
- Vercel frontend rewrites `/api` and `/img` traffic to Render.
- MongoDB Atlas hosts production data.
- Stripe has separate test/live keys and webhook secrets.
- Resend requires a verified sending domain for real recipients.
- Google OAuth redirect URLs must match the deployed backend callback URL.

### Optional AWS Deployment Path

The repository documents an optional AWS deployment path:

```text
Frontend -> S3 private bucket -> CloudFront
Backend -> Docker image -> ECR -> ECS Fargate -> Application Load Balancer
Database -> MongoDB Atlas
Secrets -> AWS Secrets Manager or Parameter Store
Logs -> CloudWatch
DNS/TLS -> Route 53 + ACM
```

### Good Interview Answer

```text
The live deployment uses Vercel for the React frontend and Render for the
Express API because it keeps the demo reliable and easy to maintain. The backend
connects to MongoDB Atlas and integrates with Stripe, Resend, and Google OAuth.
I also documented an AWS deployment path where the frontend moves to S3 and
CloudFront, and the backend runs as a Docker container on ECS Fargate behind an
Application Load Balancer. That shows how the same app could be moved toward a
more cloud-native production architecture.
```

### Likely Follow-Up Questions

**Why keep MongoDB Atlas instead of running MongoDB on AWS?**

Atlas is managed, reliable, and already production-style. For a portfolio
project, running MongoDB manually would add operational burden without improving
the core application.

**Why ECS Fargate instead of EC2?**

Fargate runs containers without managing servers. It is closer to a modern
managed container deployment and avoids manual patching, PM2, and instance
maintenance.

**Why not replace Vercel/Render immediately?**

The current deployment is stable and useful for the live demo. The AWS path is
documented as an optional production architecture, so it adds cloud credibility
without risking the working demo.

## Final 30-Second Summary

```text
Burger Club is a full-stack ordering platform designed to feel like a real
restaurant system. The strongest parts are the payment and authentication flows:
Stripe Checkout is backed by signed webhooks and idempotent order updates, while
auth uses JWT access tokens, HttpOnly refresh cookies, refresh-token rotation,
CSRF checks, and rate limiting. Cart checkout is protected by backend quote
validation and menu-version consistency so stale or modified frontend prices are
not trusted. The app is live on Vercel and Render with MongoDB Atlas, and the
repo also documents how I would deploy it on AWS with S3, CloudFront, ECR, ECS
Fargate, and an ALB.
```
