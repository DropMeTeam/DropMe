# DropMe Deployment Report

## 1. Objective
This report documents the deployment strategy for the DropMe full-stack application using:
- **Render** for the Express.js backend
- **Vercel** for the React + Vite frontend

This deployment model satisfies the assignment requirement that the backend be deployed on a cloud platform and the frontend be deployed on a frontend hosting platform. fileciteturn0file0L14-L18

## 2. Deployment Architecture

### 2.1 Repository model
DropMe is maintained in a single GitHub repository as a monorepo. The backend and frontend are deployed as separate cloud services by selecting different root directories.

- Backend root directory: `server`
- Frontend root directory: `client`

### 2.2 Runtime architecture
- Browser sends requests from Vercel-hosted frontend
- Requests target Render-hosted REST API
- Backend connects to MongoDB Atlas
- Payment flow uses Stripe
- Static uploads are served by backend `/uploads`
- Real-time features use Socket.IO on the backend

## 3. Platforms Used

### Backend Platform
- **Platform:** Render
- **Service Type:** Web Service
- **Runtime:** Node.js
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** `server`

### Frontend Platform
- **Platform:** Vercel
- **Framework:** Vite + React
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `client`

## 4. Deployment Readiness Findings From Project Analysis
A deployment review of the project structure identified three production-sensitive areas:

### 4.1 Cookie policy adjustment required
The authentication cookie is currently configured for localhost behavior. To support cross-origin deployment between Vercel and Render, production should use:
- `sameSite: "none"`
- `secure: true`

### 4.2 Hardcoded localhost URLs must be removed
At least one frontend page still generates a backend receipt URL using `http://localhost:5000`. This must be replaced with an environment-driven base URL before production deployment.

### 4.3 Upload persistence limitation
The backend stores uploaded files on local disk. Render local storage is ephemeral. Therefore, uploaded files are not guaranteed to survive redeployments. For long-term reliability, object storage such as Cloudinary or S3 is recommended.

## 5. Backend Deployment Procedure

### Step 1: Create a MongoDB Atlas database
1. Create Atlas cluster
2. Create DB user
3. Whitelist access
4. Copy `MONGODB_URI`

### Step 2: Prepare backend environment variables
Required keys:
```env
NODE_ENV=production
MONGODB_URI=<mongodb_uri>
JWT_SECRET=<jwt_secret>
STRIPE_SECRET_KEY=<stripe_secret_key>
CLIENT_ORIGIN=https://<vercel-domain>
API_BASE_URL=https://<render-domain>
```

Optional keys based on enabled features:
```env
ADMIN_ORIGIN=https://<optional-admin-domain>
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_pass>
SMTP_FROM=<smtp_from>
CLIMATIQ_API_KEY=<climatiq_api_key>
CLIMATIQ_DATA_VERSION=32
MIN_TRAIN_PAYMENT_LKR=200
PRIVATE_CAR_CO2_KG_PER_LITER=2.35
RECEIPT_LOGO_URL=<optional>
DROPME_LOGO_PATH=<optional>
GEMINI_API_KEY=<optional>
GEMINI_MODEL=gemini-3-flash-preview
```

### Step 3: Create Render service
1. Connect GitHub repository
2. Select `DropMe`
3. Choose **Web Service**
4. Set root directory to `server`
5. Set build and start commands
6. Save environment variables
7. Deploy

### Step 4: Validate backend
Check:
- `/health`
- registration and login
- protected routes
- payment endpoints
- file/image loading
- CORS behavior

## 6. Frontend Deployment Procedure

### Step 1: Configure Vercel project
1. Import GitHub repository
2. Select root directory `client`
3. Choose Vite preset
4. Set build config

### Step 2: Add frontend environment variables
```env
VITE_API_BASE=https://<render-domain>
VITE_API_ORIGIN=https://<render-domain>
VITE_API_BASE_URL=https://<render-domain>
```

### Step 3: Deploy
1. Trigger deploy
2. Wait for successful build
3. Open Vercel URL

### Step 4: Sync backend CORS
After Vercel deployment, copy the frontend production URL and update Render:
```env
CLIENT_ORIGIN=https://<vercel-domain>
```
Redeploy the backend after saving the new value.

## 7. Recommended Deployment Sequence
1. Final code fixes committed
2. Backend deployed on Render
3. Frontend deployed on Vercel
4. Backend `CLIENT_ORIGIN` updated with Vercel URL
5. Backend redeployed
6. End-to-end tests executed

## 8. Functional Validation Matrix
After deployment, the following checks should be completed.

| Area | Validation |
|---|---|
| Backend availability | `GET /health` returns success |
| Authentication | Register, login, logout, `/api/auth/me` work |
| Private rides | Search, booking, receipt generation work |
| Train | Search, booking, payment verify, ticket download work |
| Bus | Routes, schedules, booking, PDF ticket work |
| Reviews | Submit and read review data successfully |
| Eco | Leaderboard and personal stats endpoints respond |
| Uploads | Images load from backend public URLs |
| CORS | No blocked requests from Vercel domain |
| Cookies | Auth persists in browser after login |

## 9. Live URL Records
Replace with actual values after deployment.

- Backend API URL: `https://<render-domain>`
- Backend Health URL: `https://<render-domain>/health`
- Frontend App URL: `https://<vercel-domain>`

## 10. Evidence to Attach
Screenshots should be added for:
- Render successful deploy page
- Vercel successful deploy page
- Live homepage
- Live login/register page
- Successful protected route access
- Successful booking flow page
- Successful ticket or receipt download page
- Browser devtools network panel with successful API calls

## 11. Risk Notes
- Render free tier can sleep after inactivity, causing first-request delay.
- Local uploads are not durable across redeploys.
- Cookie settings must be production-safe, otherwise login may fail across domains.
- Hardcoded localhost URLs can break receipt/ticket downloads.

## 12. Conclusion
DropMe can be deployed successfully using Render and Vercel from the same GitHub repository by deploying `server` and `client` as separate services. The deployment aligns with the coursework requirement for cloud-hosted backend, hosted frontend, environment variable documentation, live URL reporting, and deployment evidence. fileciteturn0file0L14-L18
