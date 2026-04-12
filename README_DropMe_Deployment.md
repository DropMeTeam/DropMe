# DropMe README

## Project Overview
DropMe is a full-stack transport and mobility platform built with the MERN stack. The system combines private ride booking, train booking, bus booking, payment integration, driver workflows, admin approvals, eco leaderboard features, and review management. The repository is structured as a monorepo with separate `client` and `server` applications.

## Repository Structure
```text
DropMe/
├── client/   # React + Vite frontend
├── server/   # Express + MongoDB backend
├── package.json
└── README.md
```

## Core Technology Stack
- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router, Socket.IO Client, Leaflet
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, Stripe, JWT, Multer, Nodemailer
- **Database:** MongoDB Atlas
- **Deployment targets:** Render for backend, Vercel for frontend

## Major Functional Modules
- Authentication and user profile management
- Private ride offers, requests, bookings, receipts, and ride completion
- Train station, schedule, booking, ticket generation, and admin verification flows
- Bus route, schedule, booking, seat availability, and PDF ticket flows
- Driver registration and admin approval workflow
- Bus owner registration and bus approval workflow
- Reviews and public driver profile flow
- Eco leaderboard and carbon impact tracking
- Geo search proxy and real-time updates using Socket.IO

## Important Deployment Observation From Project Analysis
Before production deployment, the current codebase needs a small production hardening pass so that login and document download flows work correctly across **Vercel frontend** and **Render backend**.

### 1. Cookie settings must be production-safe
The backend currently sets the auth cookie like this:
- `sameSite: "lax"`
- `secure: false`

That works on localhost, but it is risky for a cross-site frontend/backend deployment. For Vercel + Render, update the cookie config in `server/src/controllers/auth.controller.js` to use production-aware values:

```js
function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("client_token", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api",
  });
}
```

### 2. Replace remaining hardcoded localhost URLs in frontend
A few frontend files still fall back to `http://localhost:5000` directly for downloads or asset loading. For production consistency, they should always derive the API origin from environment variables.

The most important file to fix is:
- `client/src/pages/rides/CheckoutSuccess.jsx`

Replace the hardcoded receipt link with an env-based value:

```js
const apiOrigin = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/$/, "");
```

Then use:

```jsx
href={`${apiOrigin}/api/bookings/${bookingId}/receipt`}
```

### 3. Uploaded files on Render are not permanent
Your backend serves uploaded files from the local `/uploads` folder. On Render, local disk storage is **ephemeral**, so uploaded images/files can disappear after a redeploy or restart. For the final viva/demo, this means:
- it may work temporarily during the live demo,
- but it is **not durable storage**.

For a stronger production-grade deployment, move uploads to **Cloudinary**, **AWS S3**, or another object storage service.

## Prerequisites
Install these before local setup or deployment testing:
- Node.js 20+ recommended
- npm 10+
- MongoDB Atlas database
- GitHub repository access
- Render account
- Vercel account
- Stripe account for payment flows
- SMTP account if email flows are used

## Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/DropMeTeam/DropMe.git
cd DropMe
```

### 2. Install dependencies
Install per app instead of from the monorepo root.

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure environment variables
Create `server/.env` and `client/.env`.

#### `server/.env`
```env
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
CLIENT_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
PORT=5000
SMTP_HOST=<your_smtp_host>
SMTP_PORT=<your_smtp_port>
SMTP_USER=<your_smtp_user>
SMTP_PASS=<your_smtp_password>
SMTP_FROM=<your_from_email>
API_BASE_URL=http://localhost:5000
CLIMATIQ_API_KEY=<optional_if_used>
CLIMATIQ_DATA_VERSION=32
MIN_TRAIN_PAYMENT_LKR=200
PRIVATE_CAR_CO2_KG_PER_LITER=2.35
RECEIPT_LOGO_URL=<optional>
DROPME_LOGO_PATH=<optional>
GEMINI_API_KEY=<optional_if_review_moderation_is_used>
GEMINI_MODEL=gemini-3-flash-preview
```

#### `client/.env`
```env
VITE_API_BASE=http://localhost:5000
VITE_API_ORIGIN=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Run backend
```bash
cd server
npm run dev
```

### 5. Run frontend
```bash
cd client
npm run dev
```

### 6. Local URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## Deployment Plan
The repository is a **single GitHub repo**, but the backend and frontend will be deployed as **two separate services** from different root directories.

- **Backend:** Render → Root Directory = `server`
- **Frontend:** Vercel → Root Directory = `client`

This is the correct approach for your project structure. You do **not** need separate GitHub repositories.

---

# Backend Deployment on Render

## Step 1: Prepare the backend for deployment
Before connecting Render:
1. Commit the production cookie fix.
2. Commit the frontend receipt URL fix.
3. Push all changes to GitHub.
4. Confirm the backend starts locally with `npm start`.
5. Confirm the endpoint `GET /health` returns `{ ok: true }`.

## Step 2: Create MongoDB Atlas database
1. Log in to MongoDB Atlas.
2. Create a cluster.
3. Create a database user.
4. Add your IP or allow access from anywhere for testing.
5. Copy the connection string.
6. Replace the password and database name.

Example format:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/DropMe?retryWrites=true&w=majority
```

## Step 3: Create the backend service in Render
1. Log in to Render.
2. Click **New +**.
3. Select **Web Service**.
4. Connect your GitHub repository.
5. Select the `DropMe` repo.
6. Configure the service as follows:

- **Name:** `dropme-backend`
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free or paid plan depending on requirement

## Step 4: Add backend environment variables in Render
Add the following keys in the Render dashboard.

### Required
```env
NODE_ENV=production
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
CLIENT_ORIGIN=https://<your-vercel-domain>
API_BASE_URL=https://<your-render-domain>
```

### Recommended when used in your flows
```env
ADMIN_ORIGIN=https://<your-admin-domain-or-same-vercel-domain>
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_pass>
SMTP_FROM=<from_email>
CLIMATIQ_API_KEY=<climatiq_key>
CLIMATIQ_DATA_VERSION=32
MIN_TRAIN_PAYMENT_LKR=200
PRIVATE_CAR_CO2_KG_PER_LITER=2.35
RECEIPT_LOGO_URL=<optional_public_image_url>
DROPME_LOGO_PATH=<optional_local_or_public_logo_path>
GEMINI_API_KEY=<optional>
GEMINI_MODEL=gemini-3-flash-preview
```

Do **not** set `PORT` manually on Render unless needed. Render injects it automatically.

## Step 5: Deploy backend
1. Click **Create Web Service**.
2. Wait until the build completes.
3. Open the Render URL.
4. Test:
   - `https://<your-render-domain>/health`
   - `https://<your-render-domain>/api/auth/me` after login

## Step 6: Backend smoke test checklist
After deployment, test these flows:
- Health endpoint works
- User registration works
- Login works and browser receives cookie
- Protected routes return valid data
- Train, bus, and private ride list/search routes work
- Stripe checkout URL is generated
- Receipt and ticket downloads work
- Uploaded images load from backend URL
- No CORS error in browser console

---

# Frontend Deployment on Vercel

## Step 1: Prepare the frontend
Before connecting Vercel:
1. Confirm all API calls use environment variables.
2. Confirm `axios` is configured with `withCredentials: true`.
3. Confirm the backend CORS `CLIENT_ORIGIN` exactly matches the Vercel domain.
4. Push final code to GitHub.

## Step 2: Create the Vercel project
1. Log in to Vercel.
2. Click **Add New Project**.
3. Import the `DropMe` GitHub repository.
4. Configure the project:

- **Framework Preset:** Vite
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Step 3: Add frontend environment variables in Vercel
```env
VITE_API_BASE=https://<your-render-domain>
VITE_API_ORIGIN=https://<your-render-domain>
VITE_API_BASE_URL=https://<your-render-domain>
```

## Step 4: Deploy frontend
1. Click **Deploy**.
2. Wait for the build to complete.
3. Open the deployed Vercel URL.

## Step 5: Add the Vercel URL back into Render
After Vercel gives your final URL:
1. Copy the Vercel production URL.
2. Go back to Render.
3. Update `CLIENT_ORIGIN` with the exact Vercel URL.
4. Redeploy the backend.

This synchronization step is critical because CORS and cookie-based authentication depend on the exact frontend origin.

---

# Recommended Deployment Order
1. Push final source code to GitHub.
2. Deploy backend on Render first.
3. Copy the Render backend URL.
4. Deploy frontend on Vercel using the Render URL.
5. Copy the Vercel frontend URL.
6. Update backend `CLIENT_ORIGIN` in Render.
7. Redeploy backend.
8. Run end-to-end smoke testing.

---

# Live URL Section
Replace these placeholders after deployment.

- **Frontend Live URL:** `https://<your-vercel-domain>`
- **Backend Live URL:** `https://<your-render-domain>`
- **Backend Health URL:** `https://<your-render-domain>/health`

---

# Deployment Evidence Section
Add screenshots of the following after deployment:
1. Render dashboard showing successful backend deployment
2. Vercel dashboard showing successful frontend deployment
3. Browser opening the live frontend application
4. Browser opening backend `/health` endpoint
5. Successful login/register page screenshot
6. Successful booking/ticket/receipt page screenshot
7. Browser devtools showing successful API responses with no CORS errors

---

# Environment Variables Summary

## Backend Variables
| Variable | Required | Purpose |
|---|---:|---|
| `NODE_ENV` | Yes | Enables production behavior |
| `MONGODB_URI` | Yes | MongoDB Atlas connection |
| `JWT_SECRET` | Yes | JWT signing and verification |
| `STRIPE_SECRET_KEY` | Yes for payments | Stripe checkout/session creation |
| `CLIENT_ORIGIN` | Yes | Allows frontend origin in CORS |
| `API_BASE_URL` | Recommended | Builds public asset URLs |
| `ADMIN_ORIGIN` | Optional | Allows second frontend/admin origin |
| `SMTP_HOST` | Optional | Email transport |
| `SMTP_PORT` | Optional | Email transport port |
| `SMTP_USER` | Optional | Email transport username |
| `SMTP_PASS` | Optional | Email transport password |
| `SMTP_FROM` | Optional | Sender address |
| `CLIMATIQ_API_KEY` | Optional | Eco feature integration |
| `CLIMATIQ_DATA_VERSION` | Optional | Climatiq factor version |
| `MIN_TRAIN_PAYMENT_LKR` | Optional | Minimum train payment amount |
| `PRIVATE_CAR_CO2_KG_PER_LITER` | Optional | Carbon impact calculation |
| `RECEIPT_LOGO_URL` | Optional | Receipt branding |
| `DROPME_LOGO_PATH` | Optional | Train ticket branding |
| `GEMINI_API_KEY` | Optional | Review moderation integration |
| `GEMINI_MODEL` | Optional | Gemini model selection |

## Frontend Variables
| Variable | Required | Purpose |
|---|---:|---|
| `VITE_API_BASE` | Yes | Main API base URL |
| `VITE_API_ORIGIN` | Recommended | Explicit API origin for image/file links |
| `VITE_API_BASE_URL` | Recommended | Used in train booking UI components |

---

# API Endpoint Summary
This project contains these main route groups:

## Auth and users
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`

## Private rides
- `POST /api/offers`
- `GET /api/offers/my`
- `GET /api/offers/search`
- `POST /api/requests`
- `GET /api/requests/my`
- `POST /api/bookings/offers/:id/book`
- `GET /api/bookings/my`
- `PATCH /api/bookings/:bookingId/status`
- `PATCH /api/bookings/:bookingId/complete-ride`
- `POST /api/bookings/:bookingId/cancel`
- `GET /api/bookings/:bookingId/receipt`

## Payments
- `POST /api/payments/stripe/session`
- `GET /api/payments/stripe/verify`
- `POST /api/payments/stripe/train/session`
- `GET /api/payments/stripe/train/verify`
- `POST /api/payments/stripe/bus/session`
- `GET /api/payments/stripe/bus/verify`

## Train
- `GET /api/train/stations`
- `GET /api/train/search`
- `GET /api/train/nearest-stations`
- `GET /api/train/search-nearby`
- `GET /api/train/schedules/:id`
- `POST /api/train/bookings/checkout`
- `GET /api/train/bookings/mine`
- `GET /api/train/bookings/:id`
- `GET /api/train/bookings/:id/ticket`
- `PATCH /api/train/bookings/:id/cancel`

## Train admin
- `GET /api/admin/train/stations`
- `POST /api/admin/train/stations`
- `PATCH /api/admin/train/stations/:id`
- `DELETE /api/admin/train/stations/:id`
- `GET /api/admin/train/schedules`
- `GET /api/admin/train/schedules/:id`
- `POST /api/admin/train/schedules`
- `PUT /api/admin/train/schedules/:id`
- `DELETE /api/admin/train/schedules/:id`
- `POST /api/admin/train/tickets/verify`
- `PATCH /api/admin/train/tickets/:id/mark-used`

## Bus
- `GET /api/bus/routes`
- `POST /api/bus/routes`
- `GET /api/bus/routes/:id`
- `PATCH /api/bus/routes/:id`
- `DELETE /api/bus/routes/:id`
- `GET /api/bus/routes/:routeId/buses`
- `GET /api/bus/routes/:routeId/schedules`
- `POST /api/bus/routes/:routeId/schedules`
- `DELETE /api/bus/schedules/:id`
- `GET /api/bus/bookings/availability`
- `POST /api/bus/bookings/checkout`
- `GET /api/bus/bookings/mine`
- `GET /api/bus/bookings/:id`
- `GET /api/bus/bookings/:id/ticket-pdf`
- `PATCH /api/bus/bookings/:id/cancel`

## Driver, bus-owner, reviews, eco, geo, and admin approvals
- `GET /api/driver-registration/me`
- `POST /api/driver-registration/submit`
- `GET /api/bus-owner/buses`
- `POST /api/bus-owner/buses`
- `GET /api/reviews/mine/pending`
- `GET /api/reviews/mine/given`
- `POST /api/reviews`
- `GET /api/reviews/drivers/:driverId/public-profile`
- `GET /api/reviews/drivers/:driverId/public-reviews`
- `GET /api/eco/leaderboard`
- `GET /api/eco/me`
- `GET /api/geo/search`
- `GET /api/admin/drivers/pending`
- `POST /api/admin/drivers/:id/approve`
- `POST /api/admin/drivers/:id/reject`
- `GET /api/admin/bus-registrations/pending`
- `GET /api/admin/bus-registrations/approved`
- `POST /api/admin/bus-registrations/:id/approve`
- `POST /api/admin/bus-registrations/:id/reject`

---

# Testing Section
A detailed testing guide is provided in the separate **Testing Instruction Report**. At minimum, document:
- unit test execution,
- integration test execution,
- performance testing execution,
- environment configuration used for testing. fileciteturn0file0L17-L28

---

# Deployment Section Compliance
This README includes:
- backend deployment platform and setup steps,
- frontend deployment platform and setup steps,
- environment variables without exposing secrets,
- live URL placeholders,
- evidence checklist for deployment screenshots,
which aligns with the assignment requirement for a dedicated deployment section in `README.md`. fileciteturn0file0L14-L18
