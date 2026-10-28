# AWS Deployment

AWS is the selected deployment platform. The working AWS entry point is
https://d37gxrym542prf.cloudfront.net. CloudFront serves the S3 frontend and
forwards `/api/*` to the Application Load Balancer and ECS Fargate backend.
MongoDB Atlas, Resend and Stripe remain external services.

On 28 October 2026 the apex, `www.sydneyburger.com` and `api.sydneyburger.com`
were switched to CloudFront with an issued us-east-1 ACM certificate. Real-domain
HTTPS requests returned HTTP 200 from AWS; the API health response was
`{"status":"ok"}`. These names no longer route traffic to Vercel/Render.

The AWS deployment workflow's `VITE_API_URL` is `https://api.sydneyburger.com`.
The frontend uses that domain for API and realtime requests, while the backend
uses `https://www.sydneyburger.com` as its frontend destination.

## Recovery Record: 27 October 2026

- Restored the missing `menu-images/catalog/` PNGs from
  `docs/assets/menu-image-originals/` to the existing private image bucket.
- Recreated `burger-club-alb` in the existing subnets using the existing ALB
  security group, and forwarded HTTP port 80 to `burger-club-api-tg`.
- Updated the existing CloudFront API origin to the new ALB DNS name:
  `burger-club-alb-1437812063.ap-southeast-2.elb.amazonaws.com`.
- Restored the ECS service desired count from zero to one. ALB and Fargate
  resources now incur ongoing usage charges again.
- Started the existing Deploy AWS workflow for both frontend and backend at
  commit `13bd60e2eae1a687659851f3d0b981ca63071420`.
- Deployment run `40436834726` completed successfully; ECS revision 105 has
  one running task and a completed rollout.
- Added an uncached `/socket.io/*` CloudFront behavior using the API origin
  and forwarding policy. An Engine.IO polling handshake returned HTTP 200
  and advertised the WebSocket upgrade.
- Verified AWS `/api/health`, public menu data and browser menu/image rendering.
- No security-group ingress was expanded and neither S3 bucket was made public.

## Custom Domain Cutover

### Current Status: 28 October 2026

The owner changed the www CNAME to `sydneyburger.com`, removing the inherited
Vercel CAA restriction. Replacement certificate
`arn:aws:acm:us-east-1:654654367739:certificate/37c695a1-498d-42d4-863a-c9dfb1a99f17`
is ISSUED and covers the apex, www and api names. It was attached to CloudFront
distribution `E2NJO3MTM48Z0J` together with those three aliases. TLS uses SNI and
the `TLSv1.2_2021` policy. CloudFront reports Deployed and traffic DNS is switched.

HTTPS preflight using the final hostnames against CloudFront (without changing
DNS or disabling certificate verification) returned HTTP 200 for apex and www,
and HTTP 200 with `{"status":"ok"}` for api `/api/health`.

Backend task revision 106 is stable and the CloudFront health endpoint returns
HTTP 200. The saved traffic DNS records in Porkbun are:

| Type | Host | Target | TTL |
| --- | --- | --- | --- |
| ALIAS | root (blank) | `d37gxrym542prf.cloudfront.net` | 600 |
| CNAME | www | `d37gxrym542prf.cloudfront.net` | 600 |
| CNAME | api | `d37gxrym542prf.cloudfront.net` | 600 |

The root ALIAS replaced the old Vercel A record. The www/api CNAMEs point to
CloudFront. Authoritative DNS confirmed both CNAMEs; ordinary HTTPS requests
to apex and www returned S3/CloudFront headers and HTTP 200, and api health
returned HTTP 200. Certificate-validation and mail/TXT records were preserved.

The subsequent canonical-login rollout set backend API_URL to
`https://api.sydneyburger.com` and FRONTEND_URL to `https://www.sydneyburger.com`.
ECS revision 107 is stable. Frontend release 40603717017 at main commit 950e36b
completed successfully with the matching API deployment variable.

Verification confirmed the deployed entry bundle uses the official API origin,
OAuth initiation uses `https://api.sydneyburger.com/api/auth/oauth/google/callback`,
and a cancelled Google authorization returns to `https://www.sydneyburger.com/login`.
The OAuth state cookie remains Secure and HttpOnly; credentialed CORS allows
the www origin. A Google authorization probe reached the sign-in page without
redirect_uri_mismatch. No Google console setting was changed.

The owner verified successful login and refresh persistence on both the old
CloudFront flow and the final canonical-domain flow. Payment and real AI
functionality remain separate unverified checks.

The follow-up Stripe configuration update added checkout.session.expired,
checkout.session.async_payment_failed and payment_intent.payment_failed to the
existing AWS test webhook, preserving checkout.session.completed. A provider
API read-back verified all four subscriptions. The CloudFront webhook URL,
signing secret, return URLs and legacy Render endpoint were not changed.

The subsequent AI configuration rollout registered ECS revision 108 with an
OPENAI_API_KEY reference to the existing Secrets Manager JSON. The other secret
entries, image and domain configuration were preserved. A minimal gpt-4o-mini
JSON generation request returned HTTP 200 before rollout; a private secret
read-back comparison passed. No customer data was sent in that probe. The ECS
services-stable waiter completed, and the official API health endpoint returned
HTTP 200. Authenticated admin AI behavior still needs an application test.

### Initial Certificate Request

After the owner signed into the console, an ACM public certificate was created
successfully in us-east-1 with export disabled and DNS validation selected:
`arn:aws:acm:us-east-1:654654367739:certificate/f34bee2b-38d0-4f1a-8b6e-78eee2b31cf8`.
It initially awaited DNS validation, then failed CAA checks as recorded below.
The replacement certificate above is now issued. These validation CNAMEs were
added in Porkbun (Host is relative to
`sydneyburger.com`):

| Host | Target |
| --- | --- |
| `_451bffcbcff6488e0c14df344854da2d.www` | `_ee014b926dfd96de77c235d441e0933b.wzccmgtwzk.acm-validations.aws.` |
| `_06526133814db237a6f9fa5244df224d` | `_9361b1890b59a790c7ccd2e357d19d54.wzccmgtwzk.acm-validations.aws.` |
| `_2dcf3fd94e9ae797fcc0b830d03ad1ae.api` | `_800f7f18596829ba812991ff65b7bdb1.wzccmgtwzk.acm-validations.aws.` |

Keep the validation records for automatic certificate renewal.

### Issuance Failure Diagnosis

Certificate `f34bee2b-38d0-4f1a-8b6e-78eee2b31cf8` ultimately failed with
`CAA_ERROR`. Apex and API ownership validation succeeded; www failed issuance.
Public DNS queries show that `www.sydneyburger.com` follows its CNAME to
`cname.vercel-dns.com`, whose CAA records permit letsencrypt.org, sectigo.com,
pki.goog and globalsign.com, but not Amazon. Checking only the apex CAA records
therefore missed the effective restriction on www.

Before requesting a replacement certificate, move the www CNAME temporarily
from `cname.vercel-dns.com` to `sydneyburger.com`. The apex A record still points
to the existing Vercel site at `76.76.21.21`; leave it in place until the AWS
certificate is issued and attached. Recheck www CAA resolution after the DNS
change, then request a new certificate for the same three exact domains.
The failed certificate cannot be used for the CloudFront cutover.

AWS guidance: https://docs.aws.amazon.com/acm/latest/userguide/troubleshooting-caa.html

On 28 October 2026 all three validation CNAMEs were added in Porkbun and their
public DNS answers were verified. The traffic records were initially left
unchanged pending certificate issuance. ECS revision 106 adds the three
custom-domain origins to `TRUSTED_ORIGINS` while preserving the existing
CloudFront OAuth callback and payment configuration during the transition.

Authoritative nameservers identify Porkbun as the DNS provider. The deployment
IAM user `burger-deploy` cannot perform `acm:RequestCertificate`; the earlier CLI
request was denied. The later console request above succeeded. The IAM user also lacks
`route53:ListHostedZones`, although DNS is hosted externally in this case.

To move the existing names to AWS:

1. An authorized AWS administrator requests a DNS-validated ACM certificate
   in **us-east-1**, covering `www.sydneyburger.com`, `sydneyburger.com` and
   `api.sydneyburger.com`.
2. Add the exact ACM-generated validation CNAME records in Porkbun and wait
   until the certificate is issued.
3. Attach that certificate and the intended domain aliases to distribution
   `E2NJO3MTM48Z0J`; use a current TLS security policy. Wait for deployment.
4. Point `www` and `api` at `d37gxrym542prf.cloudfront.net` in Porkbun. Configure
   the apex using the provider's supported ALIAS/flattening option or an HTTPS
   redirect after checking its existing records. Preserve unrelated records.
5. Update backend frontend/API URL settings, OAuth authorized callbacks and
   Stripe webhook/return URLs for the final canonical domain. Publish the
   frontend with the corresponding API origin.
6. Verify HTTPS, authenticated sessions, OAuth, Stripe test checkout and
   real-time updates before treating the custom domains as the live entry point.

Until then, use the working CloudFront HTTPS address. Do not describe the
custom-domain migration as complete.

The following sections describe the architecture and deployment procedure.

## Target Architecture

```text
Browser
  -> Route 53 custom domain
  -> CloudFront distribution
       -> S3 bucket for the React build
       -> optional /api behavior to an Application Load Balancer
  -> Application Load Balancer
  -> ECS service on Fargate
  -> Burger Club backend container from ECR
  -> MongoDB Atlas
  -> Stripe / Resend / Google OAuth
```

Recommended split:

- **Frontend:** S3 private bucket + CloudFront.
- **Backend:** ECS Fargate service behind an Application Load Balancer.
- **Container registry:** Amazon ECR.
- **Database:** keep MongoDB Atlas.
- **Secrets:** AWS Secrets Manager or Systems Manager Parameter Store.
- **Logs:** CloudWatch Logs from ECS.
- **DNS/TLS:** Route 53 + AWS Certificate Manager.

## Frontend: S3 + CloudFront

Build the Vite frontend:

```bash
cd frontend
npm ci
npm run build
```

Create an S3 bucket for static assets. For a production-style setup, keep the
bucket private and let CloudFront access it through Origin Access Control
rather than making the bucket public.

Upload the build output:

```bash
aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET --delete
```

Create a CloudFront distribution:

- Origin: the S3 bucket.
- Viewer protocol policy: redirect HTTP to HTTPS.
- Default root object: `index.html`.
- Custom error responses for SPA routing:
  - `403 -> /index.html -> 200`
  - `404 -> /index.html -> 200`

After each frontend release, invalidate cached entry points:

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.html" "/asset-manifest.json"
```

## Backend: ECS Fargate

The backend includes a production Dockerfile at:

```text
backend/Dockerfile
```

Build and tag the backend image:

```bash
cd backend
docker build -t burger-club-api .
```

Create an ECR repository, authenticate Docker, then tag and push:

```bash
aws ecr create-repository --repository-name burger-club-api

aws ecr get-login-password --region YOUR_AWS_REGION \
  | docker login --username AWS --password-stdin \
    YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com

docker tag burger-club-api:latest \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com/burger-club-api:latest

docker push \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.YOUR_AWS_REGION.amazonaws.com/burger-club-api:latest
```

Create an ECS cluster and a Fargate task definition:

- Launch type: Fargate.
- Container image: the ECR image.
- Container port: `5001`.
- Task CPU/memory: start small, for example `0.25 vCPU` and `0.5 GB`.
- Network mode: `awsvpc`.
- Logs: send container logs to CloudWatch.
- Health check path through the load balancer: `/api/health`.

Create an Application Load Balancer:

- Listener: HTTPS `443`.
- Target group target type: `ip`.
- Target group health path: `/api/health`.
- Security group allows inbound HTTPS from the internet.
- ECS task security group allows inbound traffic from the ALB security group.

## Backend Environment Variables

Store sensitive values in Secrets Manager or Parameter Store and inject them
into the ECS task definition.

Required production values:

```env
NODE_ENV=production
PORT=5001
MONGO_URI=...
JWT_SECRET=at-least-32-characters
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
API_URL=https://YOUR_API_DOMAIN
RESEND_API_KEY=...
EMAIL_FROM=Burger Club <noreply@YOUR_EMAIL_DOMAIN>
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_SUCCESS_URL=https://YOUR_FRONTEND_DOMAIN/payment/return?payment=success
STRIPE_CANCEL_URL=https://YOUR_FRONTEND_DOMAIN/payment/return?payment=cancelled
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Important details:

- `FRONTEND_URL` must exactly match the browser origin used by CloudFront.
- The CSRF origin check depends on `FRONTEND_URL`.
- `API_URL` should point to the public HTTPS API domain.
- Stripe success and cancel URLs should point to the CloudFront frontend domain.
- Google OAuth redirect URI should point to the AWS API domain:
  `https://YOUR_API_DOMAIN/api/auth/oauth/google/callback`.

## MongoDB Atlas

Keep MongoDB Atlas as the database. Allow network access from the ECS service.
For a more controlled setup, place ECS tasks in private subnets with NAT and
allow the NAT gateway egress IP in Atlas.

## Stripe Webhooks

Create a Stripe webhook endpoint for the AWS API domain:

```text
https://YOUR_API_DOMAIN/api/stripe/webhook
```

Subscribe to the checkout/payment events used by the backend and copy the
resulting `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## Deployment Checklist

1. Build frontend and upload `frontend/dist` to S3.
2. Invalidate CloudFront cache.
3. Build backend Docker image.
4. Push image to ECR.
5. Register a new ECS task definition revision.
6. Update the ECS service to the new task definition.
7. Confirm `/api/health` passes through the ALB.
8. Update Stripe, Google OAuth, and Resend domains/redirect URLs.
9. Test signup, login, refresh session, menu load, checkout, webhook payment
   update, and order history.

## Continuous Deployment

The GitHub Actions workflow at `.github/workflows/deploy.yml` deploys the
release commit after the `CI` workflow succeeds on `main`. It can also be run
manually from the Actions page.

The workflow:

1. Authenticates to AWS through GitHub OIDC with short-lived credentials.
2. Builds the frontend, syncs it to S3, and invalidates CloudFront.
3. Builds an ARM64 backend image tagged with the Git commit SHA.
4. Pushes both the immutable SHA tag and `latest` to ECR.
5. Registers a new ECS task definition revision and updates the ECS service.

The IAM role trusts only the `production` GitHub environment in this
repository. Its trust and deployment policies are versioned under
`infrastructure/aws/`.

The workflow preserves the ECS service desired count. If the service is
stopped at `0` to control costs, a deployment publishes the new task definition
without starting a Fargate task.

The ECR lifecycle policy keeps the 10 most recent commit images and removes
untagged images after seven days.

## AWS References

- [Amazon S3 static website hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Amazon CloudFront overview](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [Amazon ECS on AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Push Docker images to Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)
