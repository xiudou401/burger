# Demo Video Script

Use this as a 60-90 second walkthrough for portfolio reviews or interviews.

## Goal

Show that Burger Club is not just a menu UI. It is a deployed full-stack
ordering system with real checkout, authenticated user flows, server-side price
validation, and production-style deployment.

## Recording Setup

- Open the live app: `https://burger-vert.vercel.app`
- Use a seeded demo customer or a test account.
- Keep Stripe in test mode.
- Use Stripe test card: `4242 4242 4242 4242`
- Keep browser zoom around 90-100%.
- Start from the menu page with an empty cart.

## 60-90 Second Flow

### 1. Opening Context

Show the menu page.

Suggested narration:

```text
This is Burger Club, a Sydney-focused full-stack restaurant ordering platform.
It supports AUD pricing, customer accounts, server-validated carts, Stripe
Checkout, and staff/admin workflows.
```

### 2. Menu And Cart

Search or scroll the menu, add two burgers to the cart, and open the cart.

Suggested narration:

```text
The frontend is built with React and TypeScript. Menu browsing supports search,
pagination, and menu version checks. Cart totals are not trusted from the
browser; the backend validates the cart before checkout.
```

### 3. Authentication

If already logged in, briefly show the profile/account area. If not, log in with
the demo customer.

Suggested narration:

```text
Authentication uses short-lived JWT access tokens in memory and HttpOnly
refresh-cookie sessions. The backend also applies CSRF origin and custom-header
checks on auth routes.
```

### 4. Stripe Checkout

Click checkout, redirect to Stripe, enter the test card, and complete payment.

Suggested narration:

```text
Checkout uses Stripe Checkout. The backend creates the Checkout Session from
server-validated cart data, and Stripe receives integer AUD cents rather than
floating point prices.
```

### 5. Payment Return And Recent Orders

Return to the profile page, show the payment success state and recent order.

Suggested narration:

```text
The frontend success redirect only improves the user experience. The source of
truth is the Stripe webhook, which verifies the webhook signature and updates
the order status idempotently so repeated webhook events do not duplicate order
confirmation work.
```

### 6. Closing Architecture Note

Show README or simply stay on the profile page.

Suggested narration:

```text
The live demo is deployed with Vercel, Render, MongoDB Atlas, Resend, and
Stripe. I also documented an optional AWS path using S3, CloudFront, ECR, ECS
Fargate, and an Application Load Balancer.
```

## Short Version

Use this if the video must stay under one minute:

```text
Burger Club is a Sydney-focused full-stack restaurant ordering platform built
with React, TypeScript, Express, MongoDB, and Stripe. The user can browse an AUD
menu, add items to the cart, and pay through Stripe Checkout. Before checkout,
the backend validates cart prices and menu version so the browser is never the
source of truth for payment totals. Authentication uses JWT access tokens,
HttpOnly refresh cookies, refresh-token rotation, CSRF checks, and rate-limited
auth routes. Stripe webhooks verify signatures and update order status
idempotently. The app is deployed on Vercel and Render with MongoDB Atlas,
Resend, and Stripe, and the repo also includes an optional AWS deployment path
for S3, CloudFront, ECR, ECS Fargate, and an ALB.
```

## What To Avoid

- Do not spend too long typing credentials on camera.
- Do not show real secret keys, Render environment variables, Stripe secrets, or
  Resend API keys.
- Do not rely on email delivery during the recording; use an already verified
  account if possible.
- Do not explain every implementation detail in the video. Save deep details
  for the interview conversation.

## Interview Follow-Up Talking Points

- Why prices are stored as integer cents.
- Why Stripe webhook events are the payment source of truth.
- Why refresh tokens are kept in HttpOnly cookies while access tokens stay in
  memory.
- Why CSRF checks are needed when refresh cookies use cross-site deployment.
- How menu versioning prevents stale cart checkout.
- How the optional AWS deployment would map the current Vercel/Render setup to
  S3, CloudFront, ECS Fargate, and an ALB.
