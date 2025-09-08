# Router - Advanced Route Matching System

An advanced live route matching algorithm that matches riders based on overlapping routes and timing compatibility, using route geometry analysis rather than simple radius-based matching.

## Features

- **Route Geometry Matching**: Uses Google Maps Directions API for accurate route polyline comparison
- **Intelligent Overlap Calculation**: Analyzes route segment proximity and calculates overlap percentages
- **Time-based Filtering**: Matches rides within ±30 minutes departure window
- **Route Deviation Control**: Limits additional distance to ≤15% of original route
- **Real-time Visualization**: Interactive map showing route overlaps and matches

![Route Matching Demo](https://github.com/sourish-007/router/blob/main/frontend/src/assets/image1.png)

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Google Maps Services** for route geometry
- **Turf.js** for geospatial calculations

### Frontend
- **React** with Vite
- **Google Maps React API** for visualization
- **Tailwind CSS** for styling

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- Google Maps API Key

### Installation

1. Clone the repository
```bash
git clone <https://github.com/sourish-007/router.git>
cd sourish-007-router
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables

Create `.env` in the backend directory:
```env
MONGODB_URI=""
GOOGLE_MAPS_API=""
PORT=5000
```

Create `.env` in the frontend directory:
```env
VITE_MAPS_API_KEY=""
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npx nodemon index.js
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## API Documentation

### 1. Create Trip

**Endpoint:** `POST /trip/create-trips`

**Request Body:**
```json
{
  "pickup_lat": 12.9716,
  "pickup_lng": 77.5946,
  "drop_lat": 12.9352,
  "drop_lng": 77.6245,
  "departure_time": "2025-09-08T10:30:00.000Z",
  "userId": "sou123",
  "userName": "Sourish"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "trip": {
    "tripId": "sv8grnlx",
    "userId": "sou123",
    "userName": "Sourish",
    "pickup_location": [77.5946, 12.9716],
    "dropoff_location": [77.6245, 12.9352],
    "departure_time": "2025-09-08T10:30:00.000Z",
    "route_polyline": "encoded_polyline_string",
    "route_coordinates": [[12.97161, 77.59452], ...],
    "total_distance": 6641,
    "pickup_address": "KG Halli, D' Souza Layout, Ashok Nagar, Bengaluru",
    "drop_address": "KHB Colony, 4th Block, Koramangala, Bengaluru"
  }
}
```

### 2. Find Matches

**Endpoint:** `GET /trip/matches/:tripId`

**Response:**
```json
{
  "success": true,
  "tripId": "054tja0l",
  "trip": {
    "pickup_address": "KSR Bengaluru City Junction, Majestic, Bengaluru",
    "drop_address": "Hosur Rd, KHB Colony, 5th Block, Koramangala, Bengaluru",
    "departure_time": "2025-09-07T05:17:00.000Z",
    "route_coordinates": [[12.97813, 77.5698], ...]
  },
  "total_matches": 1,
  "matches": [
    {
      "tripId": "ubcl4pdo",
      "userId": "sourishsarkar0011@gmail.com",
      "userName": "sourish_007",
      "pickup_address": "Kempegowda, Majestic, Bengaluru",
      "drop_address": "Hosur Rd, KHB Colony, 5th Block, Koramangala, Bengaluru",
      "departure_time": "2025-09-07T04:51:00.000Z",
      "match_percentage": 77.45,
      "overlap_percentage": 98.64,
      "route_deviation_percentage": 3.93,
      "additional_distance_km": 0.38,
      "time_difference_minutes": 26,
      "pickup_distance_km": 0.38,
      "drop_distance_km": 0,
      "route_coordinates": [[12.9771, 77.57286], ...]
    }
  ]
}
```

## Matching Algorithm

The route matching system uses a sophisticated multi-factor scoring algorithm:

### 1. Route Overlap Calculation
- Analyzes route segments using Haversine distance
- Uses 1km proximity threshold for segment matching
- Calculates percentage of route segments that overlap

### 2. Route Deviation Analysis
- Measures additional distance required for pickup/drop deviations
- Filters out matches requiring >15% additional distance
- Considers impact on original route efficiency

### 3. Time Compatibility
- Filters trips within ±30 minutes departure window
- Factors time difference into final match score

### 4. Match Scoring Formula
```
Match Score = (Overlap% × 0.5) + (Deviation Score × 2) + (Time Score × 1.5)

Where:
- Deviation Score = max(0, (15 - deviation%))
- Time Score = max(0, (30 - time_diff_minutes))
```

## Sample Test Data

### Bengaluru Route Examples

**Koramangala to Electronic City**
```json
{
  "pickup_lat": 12.9279,
  "pickup_lng": 77.6271,
  "drop_lat": 12.8456,
  "drop_lng": 77.6603,
  "departure_time": "2025-09-08T09:00:00.000Z",
  "userId": "user001",
  "userName": "Test User 1"
}
```

**Whitefield to MG Road**
```json
{
  "pickup_lat": 12.9698,
  "pickup_lng": 77.7499,
  "drop_lat": 12.9760,
  "drop_lng": 77.6063,
  "departure_time": "2025-09-08T09:15:00.000Z",
  "userId": "user002",
  "userName": "Test User 2"
}
```

## Database Schema

### Trip Model
```javascript
{
  tripId: String,        // Unique 8-character identifier
  userId: String,        // User identifier
  userName: String,      // User display name
  pickup_location: [Number],    // [lng, lat]
  dropoff_location: [Number],   // [lng, lat]
  departure_time: Date,
  route_polyline: String,       // Encoded polyline from Google Maps
  route_coordinates: [[Number]], // Decoded coordinate array
  total_distance: Number,       // Distance in meters
  pickup_address: String,
  drop_address: String
}
```

## Performance Optimizations

- **Route Caching**: Google Maps API results cached to avoid redundant calls
- **Geospatial Indexing**: MongoDB 2dsphere indexes for location queries
- **Efficient Filtering**: Multi-stage filtering (time → overlap → deviation)
- **Coordinate Compression**: Optimized route coordinate storage

## Testing

Use the provided sample coordinates to test the matching algorithm:

1. Create multiple trips using the sample data
2. Note the returned `tripId` values
3. Call the matches endpoint to see overlapping routes
4. Verify match percentages and route visualizations

The system demonstrates high accuracy in detecting route overlaps, as shown in the demo with 98.64% overlap and only 3.93% route deviation for near-identical routes.

## Project Structure

```
sourish-007-router/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database schemas
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Route matching logic
│   │   └── lib/            # Database connection
│   └── index.js            # Server entry point
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   └── App.jsx        # Main application
    └── index.html         # Entry HTML