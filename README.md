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
