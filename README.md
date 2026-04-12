<div align="center">

# 🚍🚆🚗 DropMe  
### *Smart Carpooling & Public Transport Mobility Platform*

<p align="center">
  <img src="docs/images/dropme-banner.png" alt="DropMe Banner" width="100%" />
</p>

<p align="center">
  <a href="https://drop-me-client.vercel.app"><img src="https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel" alt="Frontend on Vercel"></a>
  <a href="https://dropme-7mbe.onrender.com"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Backend on Render"></a>
  <img src="https://img.shields.io/badge/Stack-MERN-3C873A?style=for-the-badge" alt="MERN Stack">
  <img src="https://img.shields.io/badge/Maps-Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet">
  <img src="https://img.shields.io/badge/Payments-Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe">
</p>

<p align="center">
  <strong>DropMe</strong> is a full-stack transport and mobility web application built with the <strong>MERN stack</strong>.<br/>
  It combines <strong>carpooling</strong>, <strong>train ticket booking</strong>, <strong>bus route scheduling & ticket booking</strong>,<br/>
  and <strong>eco-friendly travel tracking</strong> into one modern platform.
</p>

</div>

---

## 📌 Project Overview

DropMe is designed to improve daily transportation by helping users choose the most convenient and eco-friendly way to travel.  
The application supports:

- **Carpooling / private ride planning**
- **Train ticket searching and booking**
- **Bus route scheduling and bus ticket booking**
- **Reviews and ratings for drivers**
- **Eco leaderboard for sustainable travel contributions**

The system is built as a **full-stack MERN web application**, with:

- **MongoDB** for data storage
- **Express.js** and **Node.js** for the RESTful backend
- **React + Vite** for the frontend
- **Leaflet** for interactive map services
- **Stripe** for payment gateway integration
- **Socket.IO** for real-time communication features

---

## 🌐 Live Deployment

### Frontend
🔗 **Vercel:** [https://drop-me-client.vercel.app](https://drop-me-client.vercel.app)

### Backend
🔗 **Render:** [https://dropme-7mbe.onrender.com](https://dropme-7mbe.onrender.com)

### Backend Health Check
🔗 **Health Endpoint:** [https://dropme-7mbe.onrender.com/health](https://dropme-7mbe.onrender.com/health)

---

## ✨ Main Features

### 1. 🚗 Carpooling
- Create ride offers
- Search for available rides
- Book seats from driver offers
- Request private rides
- View and manage ride bookings
- Real-time updates using Socket.IO

<p align="center">
  <img src="docs/images/carpooling-module.png" alt="Carpooling Module" width="85%" />
</p>

---

### 2. 🚆 Train Ticket Booking
- Search trains between stations
- View nearest stations
- Explore train schedules
- Book train tickets
- Download / view train ticket details
- Ticket verification and admin handling

<p align="center">
  <img src="docs/images/train-booking-module.png" alt="Train Booking Module" width="85%" />
</p>

---

### 3. 🚌 Bus Route Scheduling & Ticket Booking
- Create and manage bus routes
- Schedule buses for routes
- Search available bus journeys
- Check seat availability
- Book bus tickets
- Generate downloadable PDF tickets

<p align="center">
  <img src="docs/images/bus-booking-module.png" alt="Bus Booking Module" width="85%" />
</p>

---

### 4. ⭐ Reviews, Ratings & Driver Profiles
- Submit travel reviews
- Rate drivers after completed rides
- View public driver profile details
- View public driver review history
- Improve service trust and transparency

<p align="center">
  <img src="docs/images/reviews-module.png" alt="Reviews and Ratings Module" width="85%" />
</p>

---

### 5. 🌱 Eco Leaderboard
- Track eco-friendly travel contributions
- Display sustainability-based user achievements
- Encourage passengers to use public transport and shared mobility options

<p align="center">
  <img src="docs/images/eco-leaderboard-module.png" alt="Eco Leaderboard Module" width="85%" />
</p>

---

## 👨‍💻 Team Contribution Overview

This project was developed by **4 team members**, each focusing on a major business module.

| Team Member | Main Module |
|---|---|
| Member 1 | Carpooling / Private Ride Module |
| Member 2 | Train Ticket Booking Module |
| Member 3 | Bus Route Scheduling & Ticket Booking Module |
| Member 4 | Reviews, Ratings & Eco Leaderboard Module |

> Replace the names above with your actual member names and registration numbers.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    A[React + Vite Frontend] --> B[Express.js REST API]
    B --> C[(MongoDB Atlas)]
    A --> D[Leaflet Map Services]
    B --> E[Stripe Payment Gateway]
    B --> F[Socket.IO Real-Time Layer]
    B --> G[Email / Notification Services]
## 🧰 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Socket.IO Client
- Leaflet

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Stripe
- Socket.IO
- Multer
- Nodemailer
- Zod Validation

### External APIs / Services
- **Leaflet** – map rendering and location-based functionality
- **Stripe** – online payment gateway for transport bookings

---

## 📁 Repository Structure

```text
DropMe/
├── client/                  # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                  # Express + MongoDB backend
│   ├── src/
│   └── package.json
│
├── package.json             # Monorepo root
└── README.md
```

---

## 🔐 Session Management & Security

DropMe includes secure session and access-control mechanisms:

- JWT-based authentication
- Protected routes for authenticated users
- Role-based access control for:
  - riders
  - drivers
  - train admins
  - bus admins
  - private/admin roles
- Validation and structured error handling
- Secure API communication between frontend and backend

---

## ⚙️ Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/DropMeTeam/DropMe.git
cd DropMe
```

### 2. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd ../client
npm install
```

---

### 3. Environment Variables

#### `server/.env`
```env
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
CLIENT_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
PORT=5000
SYSTEM_ADMIN_EMAIL=<your_admin_email>
SYSTEM_ADMIN_PASSWORD=<your_admin_password>
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_pass>
FROM_EMAIL=<display_name_and_email>
API_BASE_URL=http://localhost:5000
```

#### `client/.env`
```env
VITE_API_BASE=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=<your_google_maps_browser_key>
```

---

### 4. Run the Backend

```bash
cd server
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

### 5. Run the Frontend

```bash
cd client
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

### 6. Local Development URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health Check: `http://localhost:5000/health`

---

## 🚀 Deployment

The project is deployed from the same GitHub repository using separate root directories.

### Backend Deployment — Render

- **Platform:** Render
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Live URL:** `https://dropme-7mbe.onrender.com`

#### Backend Deployment Steps
1. Connect GitHub repository to Render
2. Create a new **Web Service**
3. Set root directory to `server`
4. Set build command to `npm install`
5. Set start command to `npm start`
6. Add backend environment variables
7. Deploy and verify `/health`

### Frontend Deployment — Vercel

- **Platform:** Vercel
- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Output Directory:** `dist`
- **Live URL:** `https://drop-me-client.vercel.app`

#### Frontend Deployment Steps
1. Connect GitHub repository to Vercel
2. Import the same repository
3. Set root directory to `client`
4. Set build command to `npm run build`
5. Set install command to `npm install`
6. Set output directory to `dist`
7. Add frontend environment variables
8. Deploy and verify frontend loading

---

## 🧾 Environment Variables Used in Production

### Backend Variables
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `CLIENT_ORIGIN`
- `ADMIN_ORIGIN`
- `PORT`
- `SYSTEM_ADMIN_EMAIL`
- `SYSTEM_ADMIN_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `API_BASE_URL`

### Frontend Variables
- `VITE_API_BASE`
- `VITE_GOOGLE_MAPS_API_KEY`

> Secrets are not exposed in this README.

---

## 🔗 API Documentation

### Base URL
```text
https://dropme-7mbe.onrender.com/api
```

### Authentication & Users
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`

### Carpooling / Private Rides
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

### Payments
- `POST /api/payments/stripe/session`
- `GET /api/payments/stripe/verify`
- `POST /api/payments/stripe/train/session`
- `GET /api/payments/stripe/train/verify`
- `POST /api/payments/stripe/bus/session`
- `GET /api/payments/stripe/bus/verify`

### Train Booking
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

### Train Admin
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

### Bus Routes & Ticket Booking
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

### Reviews, Ratings & Eco Features
- `GET /api/reviews/mine/pending`
- `GET /api/reviews/mine/given`
- `POST /api/reviews`
- `GET /api/reviews/drivers/:driverId/public-profile`
- `GET /api/reviews/drivers/:driverId/public-reviews`
- `GET /api/eco/leaderboard`
- `GET /api/eco/me`

### Other Feature Routes
- `GET /api/driver-registration/me`
- `POST /api/driver-registration/submit`
- `GET /api/bus-owner/buses`
- `POST /api/bus-owner/buses`
- `GET /api/geo/search`
- `GET /api/admin/drivers/pending`
- `POST /api/admin/drivers/:id/approve`
- `POST /api/admin/drivers/:id/reject`
- `GET /api/admin/bus-registrations/pending`
- `GET /api/admin/bus-registrations/approved`
- `POST /api/admin/bus-registrations/:id/approve`
- `POST /api/admin/bus-registrations/:id/reject`

---

## 🧪 Testing

The project submission includes separate documentation for:

- Unit Testing
- Integration Testing
- Performance Testing
- Testing Environment Configuration

### Testing Evidence

You said you will add testing images, so place them here:

<p align="center">
  <img src="docs/images/testing-summary.png" alt="Testing Summary" width="85%" />
</p>

### Suggested Testing Screenshot Sections
- Unit testing results
- Integration testing results
- Performance testing results
- Postman API evidence
- Browser validation screenshots

---

## 📷 Screenshots & Demo Evidence

### Home Page
![Home Page](docs/images/home-page.png)

### Carpooling Module
![Carpooling](docs/images/carpooling-module.png)

### Train Booking Module
![Train Booking](docs/images/train-booking-module.png)

### Bus Booking Module
![Bus Booking](docs/images/bus-booking-module.png)

### Reviews & Ratings Module
![Reviews](docs/images/reviews-module.png)

### Eco Leaderboard
![Eco Leaderboard](docs/images/eco-leaderboard-module.png)

### Render Deployment Evidence
![Render Deployment](docs/images/render-deployment.png)

### Vercel Deployment Evidence
![Vercel Deployment](docs/images/vercel-deployment.png)

---

## 📈 Future Improvements

- Advanced route optimization
- More real-time transport updates
- Mobile-responsive PWA enhancements
- Smarter eco recommendation engine
- Expanded analytics dashboard
- Cloud storage for uploaded files
- More advanced reporting and admin insights

---

## 📝 Submission Checklist

- [x] Full-stack backend and frontend implemented
- [x] Backend deployed on Render
- [x] Frontend deployed on Vercel
- [x] Environment variables documented without exposing secrets
- [x] Live URLs included
- [x] Main API routes documented
- [x] Deployment section included
- [x] Testing section included
- [ ] Testing images to be added
- [ ] Final team member names and IDs to be added

---

## 👥 Team Details

**Module:** SE3040 – Application Frameworks  
**Assignment:** Full Stack Application Development  
**Year:** Year 03  

| Member Name | Registration Number | Main Contribution |
|---|---|---|
| Member 1 | ITxxxxxxx | Carpooling / Private Ride Module |
| Member 2 | ITxxxxxxx | Train Ticket Booking Module |
| Member 3 | ITxxxxxxx | Bus Scheduling & Bus Ticket Booking |
| Member 4 | ITxxxxxxx | Reviews, Ratings & Eco Leaderboard |
    

 


