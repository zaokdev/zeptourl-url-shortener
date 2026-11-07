# ZeptoURL: frontend

A deliberately minimal React client for ZeptoURL. It exists to exercise the AWS backend: Cognito sign-in, then creating, listing, copying and deleting short links through API Gateway.

For the architecture and the infrastructure, see the [root README](../README.md).

## Stack

- **Vite**, **React** and **TypeScript**
- **Tailwind CSS** with **shadcn** / **Base UI** components
- **TanStack Query** for API state, and **React Router** for routing
- **AWS Amplify** and Amplify UI for Cognito authentication
- **Vitest** for tests, and **Oxlint** for linting

## Configuration

Copy `.env.example` to `.env.development` / `.env.production` and fill it in from the Terraform outputs:

| Variable | Terraform output |
| --- | --- |
| `VITE_API_URL` | `api_endpoint` |
| `VITE_USER_POOL_ID` | The last segment of `issuer_url` |
| `VITE_USER_POOL_CLIENT_ID` | `client_id` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at `http://localhost:5173` |
| `npm run build` | Production build → `dist/production/` |
| `npm run build:dev` | Build against the dev stack → `dist/development/` |
| `npm test` | Run the unit tests |
| `npm run lint` | Lint with Oxlint |

## Deploying

The app is a static SPA served from a private S3 bucket behind CloudFront.

1. Build it.
2. Sync the hashed assets with long-lived caching.
3. Upload `index.html` with `no-cache`.
4. Invalidate `/index.html` on CloudFront.

The exact commands are in the [root README](../README.md#2-frontend) and in [PLAN.md §7](PLAN.md#7-deployment-frontend-side).
