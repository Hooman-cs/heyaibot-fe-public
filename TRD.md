# Technical Requirements Document (TRD)
## HeyAiBot Frontend Portal

Document version: 2.0  
Last updated: March 16, 2026  
Repository: `p:\heyaibot-fe`

This document reflects the current implementation in this repository, not an idealized future-state platform design.

### Evidence Labels
- Confirmed: directly verified from code in this repository.
- Inferred: strongly suggested by code shape, naming, and control flow, but not fully provable from this repo alone.
- Unknown: depends on infrastructure or external services not present in this repository.

---

## 1. Executive Summary

### 1.1 Product Purpose
HeyAiBot is a customer-facing SaaS portal for configuring, purchasing, and accessing AI chatbot capabilities for websites. The repo contains:
- public marketing pages,
- account registration and authentication,
- subscription and payment workflows,
- a user/super-admin dashboard,
- a studio-launch bridge into chatbot management surfaces,
- an embeddable chat widget and related client utilities.

### 1.2 Primary Actors
- Visitor: unauthenticated user browsing the marketing site, pricing, FAQ, and contact pages.
- Registered user: authenticated user with an account but no active subscription or expired access.
- Subscribed user: authenticated user with an active or grace-period subscription that unlocks chatbot/studio access.
- Super admin: authenticated privileged user who can manage plans, view global subscription history, and access elevated studio functionality.

### 1.3 Repository Boundary
Confirmed:
- This repo owns the portal UI, auth orchestration, subscription persistence, plan management, and payment verification.
- This repo persists `Users`, `Plans`, and `Subscriptions` in DynamoDB.

Confirmed:
- This repo depends heavily on an external backend at `https://backend-chat1.vercel.app` for chatbot website configuration, chat history, lead capture, branding, prompt management, and session/message APIs.

Implication:
- This repository is not the complete HeyAiBot platform. It is the frontend portal plus a small backend-for-frontend layer.

### 1.4 Business Capability Summary
Confirmed current capabilities:
- Create accounts with email/password.
- Sign in with credentials, Google, Microsoft Azure AD, or Apple.
- Display pricing plans with monthly/yearly selection and dual currency checkout paths.
- Charge via Razorpay for INR and Stripe for USD.
- Persist subscription snapshots and compute subscription status dynamically.
- Show plan, billing history, lead/chat summaries, and launch links from the dashboard.
- Open legacy admin surfaces using custom signed tokens derived from the NextAuth secret.

Unknown or external:
- actual chatbot inference engine,
- chatbot data store and knowledge base backend,
- production deployment topology.

---

## 2. Technology Stack and Runtime

### 2.1 Application Stack
Confirmed from `package.json`:

| Layer | Technology | Version / Note | Usage in Repo |
|---|---|---|---|
| Framework | Next.js | `^15.1.0` | Hybrid App Router + Pages Router application |
| UI | React | `^18.3.1` | Core UI runtime |
| Rendering | React DOM | `^18.3.1` | Browser rendering |
| Auth | NextAuth | `^4.24.11` | Credentials + OAuth login, JWT sessions |
| Data store client | AWS SDK DynamoDB | `^3.835.0` | DynamoDB table access via document client |
| Payments | Razorpay | `^2.9.6` | INR order creation |
| Payments | Stripe | `^20.4.1` | USD hosted checkout session creation |
| Crypto | bcryptjs | `^3.0.2` | Password hashing and password verification |
| Crypto | Node `crypto` | built-in | HMAC validation for custom tokens and Razorpay signature verification |
| Styling | Tailwind CSS 4 + CSS modules | mixed | Tailwind utility classes and module CSS coexist |
| Animation/UI | framer-motion, lucide-react, react-icons | present | Supplemental UI libraries |

### 2.2 Router Strategy
Confirmed:
- `app/` exists and is active for the landing page, shared layout, providers, and some wrapper routes.
- `pages/` remains active and contains most business-critical routes, including dashboard, login, register, pricing, admin panels, and all API routes.

This means the runtime architecture is intentionally or historically hybrid:
- App Router owns the root shell and some newer route wrappers.
- Pages Router still owns most authenticated business flows.

### 2.3 Session Runtime
Confirmed:
- `app/layout.tsx` wraps the App Router tree in `SessionProvider` through `app/providers.tsx`.
- `pages/_app.js` wraps the Pages Router tree in `SessionProvider`.
- NextAuth session strategy is JWT, not database sessions.

### 2.4 Build and Runtime Commands
Confirmed from `package.json`:
- `npm run dev` -> `next dev --turbopack`
- `npm run build` -> `next build`
- `npm run start` -> `next start`
- `npm run lint` -> `next lint`

### 2.5 Observed Build Status
Confirmed in this environment on March 16, 2026:
- Command attempted: `cmd /c npm.cmd run build`
- Outcome: Next.js build started, detected `.env.local`, then failed with `spawn EPERM`

Interpretation:
- The repo is not currently validated as build-clean in this environment.
- The failure may be environment-specific, but release readiness cannot be assumed from this repo state alone.

### 2.6 Runtime Assumptions
Confirmed:
- The app expects environment variables for AWS, NextAuth, OAuth providers, Razorpay, and Stripe.
- The app expects outbound network access to third-party services and the HeyAiBot external backend.

Inferred:
- Intended hosting is likely Vercel or another Node-compatible Next.js host.

---

## 3. System Architecture

### 3.1 High-Level Architecture
Confirmed current decomposition:

1. Portal frontend
- marketing pages,
- auth pages,
- pricing and checkout,
- dashboard,
- legacy admin surfaces,
- widget/demo UI.

2. Backend-for-frontend in `pages/api`
- NextAuth handler,
- plan CRUD,
- payment order creation and verification,
- subscription reads,
- studio-launch token generation,
- custom token verification helpers.

3. Persistence layer in `app/model`
- `user-db.js`
- `plan-db.js`
- `subscription-db.js`
- `dynamodb.js`

4. External chatbot/studio platform
- consumed through `config.apiBaseUrl`
- provides website credentials, branding, chat history, lead capture, child prompts, execution helpers, and other bot-management APIs.

### 3.2 Frontend Surface Areas
Confirmed primary portal surfaces:
- `app/page.tsx`: landing page
- `pages/features.js`
- `pages/faq.js`
- `pages/contact.js`
- `pages/login.js`
- `pages/register.js`
- `pages/pricing.js`
- `pages/dashboard.js`
- `pages/subscription-history.js`
- `pages/admin-plans.js`
- `pages/AdminPanel.js`
- `pages/SuperAdmin.js`

### 3.3 Shared UI and Utility Layers
Confirmed:
- `app/Navbar.jsx` and `app/Footer.jsx` are reused across portal pages.
- `app/components/dashboard/*` provides dashboard tabs and billing/history UIs.
- `app/components/ChatWidget/*` and `public/widget.js` support embedded chatbot usage.
- `app/components/utils/api/*` wraps calls to the external backend.

### 3.4 Data Access Layer
Confirmed:
- All persisted business data in this repo is accessed through the DynamoDB document client.
- There are three primary models in active use: users, plans, subscriptions.

### 3.5 External Platform Boundary
Confirmed external backend responsibilities, based on request URLs in this repo:
- website CRUD and credentials,
- branding retrieval and updates,
- client chat configuration,
- welcome messages,
- child prompt management,
- chat request persistence,
- chat conversation history,
- session bulk/user-message/bot-reply APIs,
- lead capture APIs,
- URL execution helper.

TRD rule:
- Treat those APIs as consumed contracts only.
- Do not describe their internal implementation because that code is not in this repo.

### 3.6 Route Wrapping and Migration State
Confirmed:
- App Router wrapper pages under `app/Admin/*` and `app/SuperAdmin/*` import legacy page components from `pages/`.
- The studio launch API redirects to legacy routes `/AdminPanel` and `/SuperAdmin`, not to the App Router wrapper routes.

Implication:
- The repo appears to be mid-migration or carrying parallel route systems rather than having a single consolidated architecture.

---

## 4. Functional Modules

### 4.1 Public Marketing Pages
Confirmed:
- The landing page in `app/page.tsx` markets HeyAiBot as a website lead capture AI assistant.
- `features`, `faq`, and `contact` provide standard marketing/support content.
- Navigation adapts between authenticated and unauthenticated states.

Requirements implied by implementation:
- Visitors must be able to discover pricing and register without auth.
- Authenticated users should be able to jump directly to the dashboard.

### 4.2 Registration and Login
Confirmed:
- Registration posts to `/api/register`.
- Login supports credentials and social providers.
- Social providers create a local user record on first login if one does not already exist.
- Credentials login is blocked for social-only users with no password.

### 4.3 Session Management and Protected Routes
Confirmed:
- Middleware adds no-cache headers to `/dashboard`, `/admin-plans`, and `/subscription-history`.
- Route protection is mostly handled client-side via `useSession()` checks and redirects.
- The dashboard adapts behavior based on `session.user.isSuperAdmin`.

Limit:
- Middleware does not perform auth enforcement; it only sets cache headers.

### 4.4 Pricing and Plan Selection
Confirmed:
- Plans are loaded from `/api/admin/plans`.
- The pricing page filters to active plans.
- User currency is determined client-side using GeoJS country lookup.
- Billing cycle UI supports monthly and yearly.
- Checkout path branches by currency:
  - INR -> Razorpay modal
  - USD -> Stripe hosted checkout

### 4.5 Payment Initiation and Verification
Confirmed:
- `/api/payment/create-order` computes displayed price server-side from plan data and requested billing cycle.
- `/api/payment/verify` creates a subscription record and updates the user's current plan after successful payment verification.
- Razorpay verification is POST-based using signature verification.
- Stripe verification is GET-based using the success redirect `session_id`, not a signed webhook handler.

### 4.6 Subscription State and Entitlements
Confirmed:
- `Subscriptions` store a snapshot of plan features at purchase time.
- Current status is derived at read time from `expire_date` and `grace_expire_date`.
- `/api/user/subscription` normalizes old and new feature snapshot shapes.
- `/api/user/max-bot` extracts bot and token entitlements from feature keys using regex and fallback logic.

### 4.7 Dashboard
Confirmed user dashboard behavior:
- fetches current subscription,
- resolves active plan name from session,
- shows bot usage, chat totals, and leads totals,
- shows billing history,
- links to launch studio.

Confirmed super-admin dashboard behavior:
- can view total revenue and active subscription counts,
- can manage plans,
- can view global revenue/history,
- can launch the super-admin studio surface.

### 4.8 Studio Launch and Token Handoff
Confirmed:
- `/api/launch-studio` creates a custom HMAC-signed token using `NEXTAUTH_SECRET`.
- Super admins are redirected to `/SuperAdmin?token=...`.
- Normal subscribed users are redirected to `/AdminPanel?token=...`.
- Expired or unsubscribed users are redirected to `/pricing`.

### 4.9 AdminPanel and SuperAdmin Surfaces
Confirmed:
- `pages/AdminPanel.js` and `pages/SuperAdmin.js` are the primary launched studio surfaces.
- These pages validate the custom token using `/api/verify-token` or `/api/verify-superadmin-token`.
- They then call the external backend to perform website CRUD and related functions.

### 4.10 Embedded Widget and Chat Utilities
Confirmed:
- `app/components/ChatWidget/ChatWidget.js` and `public/widget.js` allow runtime embedding of the chatbot.
- The widget depends on external backend endpoints for branding, configuration, chat history, lead capture, and AI response generation.

Unknown:
- how widely this widget is used in production,
- how versioned the external widget contract is.

---

## 5. API Inventory

This section documents the in-repo API routes that form the backend-for-frontend layer.

### 5.1 `/api/auth/[...nextauth]`
- Methods: `GET`, `POST` through NextAuth's multipurpose route handler.
- Auth requirement: no pre-auth required; route itself performs auth initiation and callback handling.
- Inputs:
  - provider-specific OAuth callback payloads,
  - credentials payload with `email` and `password` for credentials login.
- Outputs:
  - NextAuth session/callback responses,
  - session payload enriched with `id`, `isSuperAdmin`, `name`, `plan`, and `planName`.
- Side effects:
  - creates a user on first successful social login,
  - reads and refreshes user and plan data during JWT/session callbacks.
- Dependencies:
  - `getUserByEmail`, `createUser`, `getUserById`
  - `getPlanById`
  - Google, Azure AD, Apple OAuth providers
  - `NEXTAUTH_SECRET`

### 5.2 `/api/register`
- Methods: `POST`
- Auth requirement: none
- Input shape:
  - `name`
  - `email`
  - `password`
- Output shape:
  - `201 { message: "User registered successfully" }`
  - `400` for missing fields or duplicate user
  - `500` for server failure
- Side effects:
  - creates a DynamoDB `Users` record with hashed password and default plan `"none"`
- Dependencies:
  - `getUserByEmail`
  - `createUser`

### 5.3 `/api/admin/plans`
- Methods:
  - `GET`
  - `POST`
  - `PUT`
  - `PATCH`
- Auth requirement:
  - `GET`: none
  - mutating methods: authenticated super admin required
- Input shape:
  - `POST`: plan payload passed directly to `createPlan`
  - `PUT`: `{ id, ...planData }`
  - `PATCH`: `{ id, status }`
- Output shape:
  - `GET { plans: [...] }`
  - mutating success payloads with `success: true`
- Side effects:
  - creates or updates `Plans`
  - toggles plan status active/inactive
- Dependencies:
  - `getServerSession`
  - `createPlan`, `getAllPlans`, `updatePlan`, `togglePlanStatus`

### 5.4 `/api/payment/create-order`
- Methods: `POST`
- Auth requirement: authenticated user required
- Input shape:
  - `planId`
  - `currency` defaulting to `"INR"`
  - `billingCycle` defaulting to `"monthly"`
- Output shape:
  - Razorpay branch:
    - `{ gateway, orderId, amount, currency }`
  - Stripe branch:
    - `{ gateway, url }`
  - validation failures for bad plan or currency
- Side effects:
  - creates a Razorpay order or Stripe checkout session
  - does not persist subscription data yet
- Dependencies:
  - `getPlanById`
  - `getServerSession`
  - Razorpay SDK
  - Stripe SDK
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `STRIPE_SECRET_KEY`
  - `NEXTAUTH_URL`

### 5.5 `/api/payment/verify`
- Methods:
  - `POST` for Razorpay callback from frontend
  - `GET` for Stripe success redirect session verification
- Auth requirement:
  - `POST`: authenticated user session required
  - `GET`: no session required; relies on Stripe session metadata
- Input shape:
  - POST:
    - `razorpay_order_id`
    - `razorpay_payment_id`
    - `razorpay_signature`
    - `planId`
    - `billingCycle`
  - GET:
    - query param `session_id`
- Output shape:
  - POST success: `{ success: true }`
  - GET success: redirect to `/dashboard?payment_success=true`
  - failure redirects or JSON errors depending on branch
- Side effects:
  - verifies payment integrity
  - creates a `Subscriptions` record
  - updates the user's current plan in `Users`
- Dependencies:
  - `getPlanById`
  - `createSubscription`
  - `updateUserPlan`
  - Stripe SDK
  - Node `crypto`

### 5.6 `/api/payments`
- Methods: `GET`
- Auth requirement: authenticated user required
- Input shape: none
- Output shape:
  - array of enriched subscription records
  - super admin receives all subscriptions
  - normal user receives only their own subscription history
- Side effects: none
- Dependencies:
  - `getServerSession`
  - `getAllSubscriptions`, `getUserSubscriptionHistory`
  - `getUserById`
  - `getPlanById`

### 5.7 `/api/user/subscription`
- Methods: `GET`
- Auth requirement: authenticated user required
- Input shape: none
- Output shape:
  - `{ subscription: sub }`
  - with compatibility mapping that writes `sub.snapshot_features`
- Side effects:
  - mutates the returned object in memory to backfill legacy `snapshot_features`
- Dependencies:
  - `getServerSession`
  - `getUserSubscription`

### 5.8 `/api/user/max-bot`
- Methods: `GET`
- Auth requirement: authenticated user required
- Input shape: none
- Output shape:
  - `{ maxBot, tokenCount, expireDate }`
- Behavior:
  - returns zero entitlements for users with no subscription
  - returns zero entitlements for expired subscriptions even if `expireDate` is present
  - uses regex/fallback logic to locate bot and token features inside the plan snapshot
- Side effects: none
- Dependencies:
  - `getServerSession`
  - `getUserSubscription`

### 5.9 `/api/launch-studio`
- Methods: `GET`
- Auth requirement: authenticated NextAuth token required
- Input shape: none
- Output shape:
  - redirect to `/login`, `/pricing`, `/AdminPanel?token=...`, or `/SuperAdmin?token=...`
- Side effects:
  - issues a custom HMAC-signed token tied to `NEXTAUTH_SECRET`
- Dependencies:
  - `getToken` from `next-auth/jwt`
  - `getUserSubscription`
  - Node `crypto`

### 5.10 `/api/verify-token`
- Methods: `POST`
- Auth requirement: none, but a valid custom user token is required in the payload
- Input shape:
  - `{ token }`
- Output shape:
  - on success:
    - `{ valid: true, payload: { userId, paymentId, isSuperAdmin } }`
  - on failure: `{ valid: false, reason }`
- Side effects: none
- Dependencies:
  - Node `crypto`
  - `NEXTAUTH_SECRET`

### 5.11 `/api/verify-superadmin-token`
- Methods: `POST`
- Auth requirement: none, but a valid custom super-admin token is required in the payload
- Input shape:
  - `{ token }`
- Output shape:
  - `{ valid: true, isSuperAdmin: true, userId }` on success
  - error payload on failure
- Side effects: none
- Dependencies:
  - Node `crypto`
  - `NEXTAUTH_SECRET`

---

## 6. Data Model and Persistence

### 6.1 Persistence Overview
Confirmed:
- The active persistence layer in this repo is DynamoDB.
- Three active tables are referenced directly in model files:
  - `Users`
  - `Plans`
  - `Subscriptions`

Inferred:
- Table names are fixed literal strings in code, not environment-configured.

### 6.2 `Users` Entity
Confirmed fields from `app/model/user-db.js`:

| Field | Type | Notes |
|---|---|---|
| `user_id` | string | Primary key |
| `user_name` | string | Display name |
| `user_email` | string | Queried through `EmailIndex` |
| `password` | string or null | bcrypt hash for email users, null for social-only users |
| `isSuperAdmin` | boolean | Role flag |
| `plan` | string | Current plan id or `"none"` |
| `authProvider` | string | `email`, `google`, `azure-ad`, `apple`, or similar |
| `createdAt` | ISO timestamp | Creation time |

Confirmed access patterns:
- query by email via `EmailIndex`
- get by `user_id`
- update only the `plan` field through `updateUserPlan`

### 6.3 `Plans` Entity
Confirmed fields from `app/model/plan-db.js`:

| Field | Type | Notes |
|---|---|---|
| `plan_id` | string | Primary key |
| `plan_name` | string | Display label |
| `amount_mrp` | number | INR MRP |
| `amount` | number | INR selling price |
| `amount_mrp_usd` | number | USD MRP |
| `amount_usd` | number | USD selling price |
| `allowed_billing_cycles` | array | Defaults to `["monthly", "yearly"]` |
| `yearly_discount` | number | Defaults to `20` |
| `duration` | number | Defaults to `30` days |
| `grace_period` | number | Defaults to `7` days |
| `status` | string | `active` or `inactive` |
| `system_features` | object | Machine-readable entitlements |
| `display_features` | array | UI-friendly features |

Confirmed access patterns:
- full table scan for plan listing
- get by `plan_id`
- update by `plan_id`
- toggle `status`

### 6.4 `Subscriptions` Entity
Confirmed fields from `app/model/subscription-db.js`:

| Field | Type | Notes |
|---|---|---|
| `payment_id` | string | Primary key |
| `order_id` | string | Gateway order/session identifier |
| `user_id` | string | User foreign key |
| `plan_id` | string | Plan foreign key |
| `amount` | number | Stored payment amount |
| `currency` | string | Usually `INR` or `USD` |
| `gateway` | string | `Razorpay` or `Stripe` |
| `billing_cycle` | string | Usually `monthly` or `yearly`; may also contain `custom` |
| `scheduled_plan_id` | string or null | Intended downgrade scheduling field |
| `prorated_credit` | number | Intended upgrade credit field |
| `status` | string | Initially stored as `Active`, later recomputed dynamically |
| `start_date` | ISO timestamp | Creation time |
| `expire_date` | ISO timestamp | End of entitlement |
| `grace_expire_date` | ISO timestamp | End of grace period |
| `discount` | number | Stored discount amount |
| `snapshot_system_features` | object | Plan entitlement snapshot |
| `snapshot_display_features` | array | Plan display snapshot |

Confirmed access patterns:
- query by user through `UserIndex`
- full table scan for global subscription history
- update `scheduled_plan_id` via `scheduleDowngrade`

### 6.5 Derived Status Logic
Confirmed:
- subscription status is recomputed when read:
  - `Active` if current time is before `expire_date`
  - `Action Required` if current time is after `expire_date` but before `grace_expire_date`
  - `Expired` otherwise

Important implication:
- persisted `status` is not authoritative after creation.
- runtime reads mutate returned objects in memory to reflect current status.

### 6.6 Cross-Entity Relationships
Confirmed:
- `Users.plan` stores the currently assigned plan id.
- `Subscriptions.user_id` links to `Users.user_id`.
- `Subscriptions.plan_id` links to `Plans.plan_id`.

Inferred:
- The authoritative history of purchases is `Subscriptions`.
- The authoritative current-user plan shown in sessions is a combination of `Users.plan`, `Plans`, and latest subscription lookup.

### 6.7 Index Assumptions
Inferred from code and not otherwise provisioned in this repo:
- `Users` has a GSI named `EmailIndex` keyed by `user_email`.
- `Subscriptions` has a GSI named `UserIndex` keyed by `user_id`.

These indexes are required for the app to work as coded.

### 6.8 Schema Evolution Notes
Confirmed:
- The code contains compatibility logic for older `snapshot_features` versus newer `snapshot_system_features`.
- There are extensive commented legacy implementations in model and API files.

Implication:
- The data model has already changed at least once and still carries transition code.

---

## 7. Core Flows

### 7.1 Email Registration
1. Visitor opens `/register`.
2. Client posts `name`, `email`, and `password` to `/api/register`.
3. API validates required fields and checks for duplicate email via `getUserByEmail`.
4. Password is hashed with bcrypt in `createUser`.
5. New user is stored with:
   - `isSuperAdmin: false`
   - `plan: "none"`
   - `authProvider: "email"`
6. User is redirected to `/login?success=Account created`.

### 7.2 Credential Login
1. User submits email/password on `/login`.
2. `signIn("credentials")` sends credentials to NextAuth.
3. Credentials provider loads user by email.
4. If `password` is missing, login is rejected with a social-login-only message.
5. bcrypt compares plaintext password to stored hash.
6. JWT callback enriches token with id, role, plan id, and plan name.
7. Session callback exposes that data on `session.user`.
8. Client redirects to `/dashboard`.

### 7.3 Social Login
1. User clicks Google, Microsoft, or Apple on `/login`.
2. OAuth completes through NextAuth provider flow.
3. `signIn` callback checks whether a local user already exists by email.
4. If not, `createUser` stores a new local account with null password and provider name.
5. JWT/session callbacks enrich session with plan and role data from DynamoDB.
6. Client lands on `/dashboard`.

### 7.4 Session Enrichment with Plan Name
1. After login, JWT callback reads the current user record.
2. If `user.plan` is not `"none"`, `getPlanById` resolves the plan name.
3. Token stores:
   - `id`
   - `isSuperAdmin`
   - `name`
   - `plan`
   - `planName`
4. On later requests, JWT callback refreshes token data from `getUserById`.

### 7.5 Plan Listing and Currency Detection
1. Pricing page loads active plans from `/api/admin/plans`.
2. Client calls GeoJS country endpoint.
3. If country is `IN`, currency is set to `INR`; otherwise `USD`.
4. User selects monthly or yearly billing.
5. UI computes displayed amounts using plan fields and yearly discount.
6. Only plans supporting the selected cycle are shown.

### 7.6 INR Checkout via Razorpay
1. User clicks checkout on pricing page with currency `INR`.
2. Client posts to `/api/payment/create-order`.
3. API validates session and plan, computes final INR price, and creates Razorpay order.
4. Client loads Razorpay checkout script dynamically.
5. Razorpay modal collects payment.
6. On success, client posts payment identifiers and signature to `/api/payment/verify`.
7. API verifies HMAC signature with `RAZORPAY_KEY_SECRET`.
8. API computes subscription expiry and grace dates.
9. API creates subscription snapshot and updates `Users.plan`.
10. Client navigates to `/dashboard`.

### 7.7 USD Checkout via Stripe
1. User clicks checkout on pricing page with currency `USD`.
2. Client posts to `/api/payment/create-order`.
3. API validates session and plan, computes final USD price, and creates a Stripe checkout session.
4. Session metadata stores:
   - `userId`
   - `planId`
   - `billingCycle`
5. Client redirects to Stripe-hosted checkout URL.
6. Stripe redirects back to `/api/payment/verify?session_id=...`.
7. API retrieves the Stripe session, checks `payment_status === "paid"`, loads the plan, computes dates, creates subscription, updates user plan, and redirects to `/dashboard?payment_success=true`.

### 7.8 Subscription Creation and Plan Assignment
1. Successful payment branch resolves the plan.
2. Duration is chosen as:
   - `365` if `billingCycle === "yearly"`
   - `plan.duration || 30` otherwise
3. Grace days are `plan.grace_period || 7`.
4. `createSubscription` writes the subscription row with feature snapshots.
5. `updateUserPlan` writes the plan id into the user row.

### 7.9 Dashboard Entitlement Resolution
1. Dashboard checks `useSession()`.
2. If not authenticated, client redirects to `/login`.
3. For normal users, dashboard calls `/api/user/subscription`.
4. Subscription status is used to show plan state and resolve allowed bot count.
5. Dashboard calls the external backend for website credentials, then derives:
   - bot count,
   - total leads,
   - total conversations.
6. For super admins, dashboard calls `/api/payments` and aggregates revenue and active subscription counts.

### 7.10 Launch Studio for Normal User
1. User clicks studio launch link, which points to `/api/launch-studio`.
2. API reads the NextAuth JWT via `getToken`.
3. API loads latest subscription by user id.
4. If missing or expired, redirect to `/pricing`.
5. If active or in grace period, API signs a custom token containing:
   - `userId`
   - `isSuperAdmin: false`
   - `paymentId`
   - `iat`
   - `exp`
6. API redirects to `/AdminPanel?token=...`.
7. `pages/AdminPanel.js` persists token in `sessionStorage`, validates it via `/api/verify-token`, then uses it to call the external backend.

### 7.11 Launch Studio for Super Admin
1. Super admin clicks launch link to `/api/launch-studio`.
2. API detects `isSuperAdmin === true` from the NextAuth token.
3. API signs a token containing:
   - `userId`
   - `isSuperAdmin: true`
   - `iat`
   - `exp`
4. API redirects to `/SuperAdmin?token=...`.
5. `pages/SuperAdmin.js` stores token in `sessionStorage`, validates it via `/api/verify-superadmin-token`, then calls the external backend with super-admin behavior.

### 7.12 Token Verification for AdminPanel and SuperAdmin
1. Panel reads token from query string or storage.
2. Token is POSTed to a verification endpoint.
3. Verification recomputes HMAC signature using `NEXTAUTH_SECRET`.
4. Verification decodes JSON payload and checks expiration.
5. User token endpoint also rejects super-admin tokens.
6. Super-admin endpoint requires `isSuperAdmin === true`.

---

## 8. External Integrations and Contracts

| Integration | Confirmed Usage | Contract Expected by This Repo | Failure Impact |
|---|---|---|---|
| DynamoDB | User/plan/subscription persistence | Tables `Users`, `Plans`, `Subscriptions` and GSIs `EmailIndex`, `UserIndex` must exist and be reachable with valid AWS credentials | Auth, pricing, subscription history, and entitlements fail |
| Razorpay | INR order creation and signature verification | Valid key id/secret, ability to create orders, payment response fields `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` | INR checkout fails |
| Stripe | USD checkout sessions and session retrieval | Valid secret key, checkout sessions enabled, successful redirect with `session_id` | USD checkout fails |
| GeoJS | Pricing currency selection | Returns country JSON from `https://get.geojs.io/v1/ip/country.json` | Pricing falls back to USD |
| `backend-chat1.vercel.app` | Website CRUD, credentials, branding, chats, leads, prompts, session APIs | Stable endpoints matching URL paths hardcoded in this repo | Dashboard data, admin panels, widget behavior, and chat history fail |
| `jdpcglobal.com/api/save_contact_us` | Contact form submission | Accepts POST JSON with hardcoded `key`, name, phone, email, message | Contact form fails |
| Google OAuth | Social login | Valid client id/secret and callback support | Google login unavailable |
| Microsoft Azure AD OAuth | Social login | Valid client id/secret and tenant id | Microsoft login unavailable |
| Apple OAuth | Social login | Valid Apple client id/secret | Apple login unavailable |

### 8.1 External Backend Contract Surface
Confirmed external endpoints used by this repo include patterns such as:
- `/api/websites/user/:userId/credentials`
- `/api/websites/header`
- `/api/websites/client-config`
- `/api/websites/chat-config`
- `/api/chat-requests/...`
- `/api/chats/...`
- `/api/session/...`
- `/api/branding/...`
- `/api/childprompt/...`
- `/api/generate-ai-response`
- `/api/execute-urls`

Unknown:
- auth model and versioning guarantees of that backend,
- whether those endpoints are stable, documented, or backward-compatible.

### 8.2 Contact API Contract
Confirmed:
- `pages/contact.js` posts to an external endpoint directly from the client.
- Payload contains a hardcoded `key`.

Implication:
- Contact functionality is tightly coupled to a third-party endpoint and exposes an integration key in browser-delivered code.

---

## 9. Configuration and Environment

### 9.1 Environment Variable Matrix

| Variable | Required | Used In | Purpose |
|---|---|---|---|
| `NEXTAUTH_SECRET` | Yes | auth route, launch token signing, token verification | Core auth and custom token signature secret |
| `NEXTAUTH_URL` | Yes in non-local deployments | payment create-order | Stripe success/cancel URL base |
| `GOOGLE_CLIENT_ID` | Optional unless Google login enabled | NextAuth | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional unless Google login enabled | NextAuth | Google OAuth |
| `MICROSOFT_CLIENT_ID` | Optional unless Microsoft login enabled | NextAuth | Azure AD OAuth |
| `MICROSOFT_CLIENT_SECRET` | Optional unless Microsoft login enabled | NextAuth | Azure AD OAuth |
| `MICROSOFT_TENANT_ID` | Optional unless Microsoft login enabled | NextAuth | Azure AD tenant routing |
| `APPLE_ID` | Optional unless Apple login enabled | NextAuth | Apple OAuth |
| `APPLE_CLIENT_SECRET` | Optional unless Apple login enabled | NextAuth | Apple OAuth |
| `AWS_REGION` | Yes | DynamoDB client | AWS region |
| `AWS_ACCESS_KEY_ID` | Yes | DynamoDB client | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | Yes | DynamoDB client | AWS credentials |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes for INR checkout | client pricing page, server order creation | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Yes for INR checkout | server order creation, verify route | Razorpay secret |
| `STRIPE_SECRET_KEY` | Yes for USD checkout | create-order, verify | Stripe secret |

### 9.2 Hardcoded Runtime Configuration
Confirmed in source:

| Location | Hardcoded Value | Risk |
|---|---|---|
| `app/components/utils/config.js` | `aiApiKey` value | Client-visible secret-like value |
| `app/components/utils/config.js` | `baseUrl: https://www.heyaibot.com` | Environment inflexibility |
| `app/components/utils/config.js` | `apiBaseUrl: https://backend-chat1.vercel.app` | Hard-wired backend endpoint |
| `pages/contact.js` | `key: OPLjdk_sKLEO2MDBBWPT3789S_KLS` | Client-visible integration key |
| `pages/contact.js` | `https://jdpcglobal.com/api/save_contact_us` | Hard-wired external dependency |
| `public/widget.js` | external backend URL | Widget environment inflexibility |

### 9.3 Configuration Model Assessment
Confirmed:
- Critical infrastructure settings are partly environment-driven and partly hardcoded in shipped client code.

Implication:
- The repo is only partially twelve-factor compliant.
- Environment portability is limited.

---

## 10. Current Gaps, Risks, and Technical Debt

### 10.1 Security and Secrets Risks
Confirmed:
- `app/components/utils/config.js` contains a hardcoded client-visible `aiApiKey`.
- `pages/contact.js` contains a hardcoded client-visible `key` and direct external contact endpoint.
- Custom launch tokens are transferred in query strings before being moved into `sessionStorage`.

Risk:
- Browser-visible keys and query-string tokens increase exposure through logs, history, screenshots, referers, or copied URLs.

### 10.2 Mixed Architecture and Duplication
Confirmed:
- The app mixes `pages/` and `app/` routing for core flows.
- App Router wrapper routes import legacy page components rather than replacing them.
- `pages/admin-plans.js` and `app/components/dashboard/AdminPlansTab.js` both cover plan-management UI.

Risk:
- Duplicated behavior and parallel route systems increase maintenance cost and regression risk.

### 10.3 Wrapper Route Integrity Issues
Confirmed from inspection:
- The inspected App Router wrapper under `app/SuperAdmin/SuperAdminManagement/[backendApiKey]/page.js` imports `../../../../pages/AdminPanel` instead of `pages/SuperAdmin`.
- The inspected `app/Admin/AdminManagement/[backendApiKey]/page.js` showed the same wrapper content during review.

Risk:
- App Router management routes may not render the intended screen and may already be miswired.

### 10.4 Custom JWT Handoff Outside Standard NextAuth Boundaries
Confirmed:
- Studio launch does not rely solely on the NextAuth session inside the studio surfaces.
- Instead, it generates a secondary HMAC-signed token using `NEXTAUTH_SECRET`.

Risk:
- This introduces a second auth model to maintain.
- Security invariants now depend on both NextAuth and custom token logic staying consistent.

### 10.5 Client-Side Token Persistence
Confirmed:
- `AdminPanel` and `SuperAdmin` store custom tokens in `sessionStorage`.
- The code includes history and back-button manipulation to manage access behavior.

Risk:
- Client storage is easier to misuse than server-backed sessions.
- Session semantics become harder to reason about and test.

### 10.6 Payment Data Consistency Risk
Confirmed:
- `/api/payment/create-order` computes `finalPrice` including yearly discounts.
- `/api/payment/verify` stores `plan.amount` or `plan.amount_usd` into the subscription, not the computed final charged yearly amount.

Risk:
- Recorded subscription amounts may not match the actual charge for yearly billing.
- Revenue reporting in `/api/payments` may be inaccurate.

### 10.7 Billing Cycle Consistency Risk
Confirmed:
- `pages/pricing.js` sends `billingCycle: "custom"` for plans that do not support yearly billing.
- `/api/payment/verify` stores `billing_cycle` from the incoming request/session metadata.

Risk:
- Subscription rows may contain `custom` even though the rest of the system appears to expect `monthly` or `yearly`.

### 10.8 Token Verification Payload Mismatch
Confirmed:
- `/api/verify-token` returns only `{ userId, paymentId, isSuperAdmin }`.
- `pages/AdminPanel.js` later expects `payload.exp` and `payload.iat` to derive session timers and expiry behavior.

Risk:
- Admin panel expiry logic is likely incomplete or incorrect because verification strips fields the panel expects.

### 10.9 Stripe Verification Model
Confirmed:
- Stripe success handling is implemented through a redirect GET handler on `/api/payment/verify`.
- There is no signed Stripe webhook handler in this repo.

Risk:
- Payment confirmation depends on redirect/session retrieval flow rather than webhook-first accounting.
- This is more fragile than a webhook-based source of truth.

### 10.10 Legacy Schema and Commented-Code Accumulation
Confirmed:
- Many files include large blocks of commented legacy implementations.
- Old `features` / `snapshot_features` naming still leaks into dashboard and compatibility logic.

Risk:
- Harder onboarding, higher review cost, and more room for incorrect assumptions during future changes.

### 10.11 External Backend Coupling
Confirmed:
- Major business capabilities are implemented against hardcoded external backend endpoints not versioned in this repo.

Risk:
- This repo cannot independently guarantee compatibility.
- A backend contract change could break dashboard, widget, or studio behavior without any change in this repo.

### 10.12 Build and Release Readiness Risk
Confirmed:
- `cmd /c npm.cmd run build` failed with `spawn EPERM` in this environment.
- No automated test suite was discovered in this repo.

Risk:
- Current release confidence is low.
- There is no locally verified build artifact or test safety net from this review.

### 10.13 Authorization Model Boundaries
Confirmed:
- `/api/admin/plans` allows unauthenticated `GET`, which is used by pricing.
- Mutating plan operations require super admin.

Assessment:
- Public plan listing is likely intentional.
- If plan metadata should be private in the future, the endpoint design will need to split public pricing data from admin plan management.

---

## 11. Execution Roadmap

### Phase 1: Security and Configuration Cleanup
Goals:
- remove client-visible secrets,
- reduce hardcoded environment coupling,
- tighten token handling.

Recommended work:
- Move `aiApiKey`, contact API key, and external service URLs out of client-shipped source where possible.
- Replace query-string studio token handoff with a safer server-mediated or cookie/session-based approach.
- Audit `sessionStorage` usage for custom auth tokens and reduce exposure window.
- Centralize runtime configuration behind environment variables and server-side configuration boundaries.

Acceptance targets:
- no secret-like values committed in client bundles,
- no auth-bearing query-string redirects for studio access,
- documented configuration contract for all environments.

### Phase 2: Architecture Consolidation
Goals:
- reduce routing duplication,
- establish a single canonical UI path for admin and super-admin flows.

Recommended work:
- Decide whether the long-term standard is App Router or Pages Router.
- Eliminate wrapper-style duplication between `pages/` and `app/`.
- Correct miswired wrapper imports under `app/Admin/*` and `app/SuperAdmin/*`.
- Consolidate plan-management UI so there is one authoritative implementation.

Acceptance targets:
- single canonical route tree for each major workflow,
- no legacy wrapper pages importing business-critical screens unnecessarily,
- clear ownership of admin UIs.

### Phase 3: API Contract Hardening and Validation
Goals:
- make BFF behavior internally consistent and explicit,
- reduce schema drift and edge-case bugs.

Recommended work:
- Add schema validation for request bodies on payment, plan, and token endpoints.
- Normalize `billing_cycle` values to a controlled enum.
- Store actual charged amounts in subscriptions instead of plan list prices.
- Decide on a single feature snapshot schema and remove compatibility clutter after migration.
- Align `/api/verify-token` response shape with what `AdminPanel` expects, or simplify panel logic.
- Introduce a proper Stripe webhook flow if accounting integrity matters.

Acceptance targets:
- request/response contracts documented and validated,
- subscription records accurately reflect charges and billing cycle,
- token verification and panel state logic are coherent.

### Phase 4: Observability, Testing, and Release Readiness
Goals:
- make changes verifiable,
- improve operational confidence.

Recommended work:
- Add automated tests for:
  - registration,
  - credentials login,
  - social-login first-user creation,
  - plan CRUD auth boundaries,
  - Razorpay verification,
  - Stripe success handling,
  - subscription status computation,
  - launch-studio redirects.
- Add build verification in CI.
- Add structured logging and error monitoring for payment and auth flows.
- Document expected DynamoDB tables/indexes and external backend contract dependencies.

Acceptance targets:
- repeatable CI build,
- test coverage for payment and entitlement-critical flows,
- observable production errors and documented dependencies.

---

## Assumptions and Defaults

- This TRD describes the current codebase behavior as of March 16, 2026.
- DynamoDB table definitions and GSIs are inferred from code references; infrastructure provisioning is not present in this repo.
- The external chatbot/studio backend is out of scope for internal architecture detail.
- No hidden product specification was assumed beyond what is implemented in source.
- Where code and UI wording disagree, implementation behavior was treated as authoritative.

---

## Summary Assessment

HeyAiBot frontend is a workable portal/BFF codebase with clear business intent and meaningful subscription logic, but it is not yet architecturally clean or operationally hardened. The most important current realities are:
- the platform is split across this repo and a hard-coupled external backend,
- core business data lives in DynamoDB,
- payment and entitlement flows are present but carry correctness risks,
- the admin/studio path uses a secondary custom token system,
- and the codebase shows active migration/legacy overlap between Next.js routing systems.

For engineering use, this repo should be treated as production-intent but not yet fully production-hardened.
