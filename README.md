# DropMe — Carpooling + Public Transport (MERN + Google Maps)

DropMe is a ride-sharing (pool/carpool) and public transport trip planner built on the MERN stack.

## Key flows (MVP)
- Plan a trip: pickup + drop-off (Google Places Autocomplete)
- Pick time + time window
- Choose mode: Pool / Private / Transit
- Pool matching: find nearby driver offers (geospatial + time window scoring)
- Real-time updates: Socket.IO rooms for rider/driver

## Setup
### Install
```bash
npm install
```

### Env
Create `server/.env`:
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/dropme
JWT_SECRET=change_me_super_secret
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

Create `client/.env`:
```bash
VITE_API_BASE=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=YOUR_BROWSER_KEY
```

Enable Google APIs: Maps JavaScript, Places, Directions.

### Run
```bash
npm run dev
```

Client: http://localhost:5173  
Server: http://localhost:5000
