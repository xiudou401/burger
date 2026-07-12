# Optional AWS Deployment

This project currently runs well on Vercel, Render, MongoDB Atlas, Resend, and
Stripe. This guide documents an optional AWS path for portfolio or cloud
practice without replacing the live demo.

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

Build the Create React App frontend:

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
aws s3 sync build/ s3://YOUR_FRONTEND_BUCKET --delete
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

1. Build frontend and upload `frontend/build` to S3.
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
