import { Trip } from "../models/trip.model.js";
import { getRouteDetails } from "../utils/getroutedetails.js";
import polyline from '@mapbox/polyline';
import { findMatches } from "../utils/route.matching.js";

const generateUniqueTripId = async () => {
  let tripId;
  let isUnique = false;
  while (!isUnique) {
    tripId = Math.random().toString(36).substring(2, 10);
    const existingTrip = await Trip.findOne({ tripId });
    if (!existingTrip) {
      isUnique = true;
    }
  }
  return tripId;
};

export const createTrip = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, departure_time, userId, userName } = req.body;

    if (!pickup_lat || !pickup_lng || !drop_lat || !drop_lng || !departure_time || !userId || !userName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const routeData = await getRouteDetails(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const tripId = await generateUniqueTripId();

    const decodedCoordinates = polyline.decode(routeData.polyline);
    const routeCoordinates = decodedCoordinates.map(coord => [coord[0], coord[1]]);

    const newTrip = new Trip({
      tripId,
      userId,
      userName,
      riderId: userId,
      departure_time: new Date(departure_time),
      pickup_location: [pickup_lng, pickup_lat],
      dropoff_location: [drop_lng, drop_lat],
      route_polyline: routeData.polyline,
      route_coordinates: routeCoordinates,
      total_distance: routeData.distance,
      pickup_address: routeData.pickup_address,
      drop_address: routeData.drop_address
    });

    await newTrip.save();

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip: newTrip
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMatches = async (req, res) => {
  try {
    const { tripId } = req.params;

    const currentTrip = await Trip.findOne({ tripId });
    if (!currentTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const tripForMatching = {
      ...currentTrip.toObject(),
      coordinates: currentTrip.route_coordinates
    };
    
    const matches = await findMatches(tripForMatching);

    res.json({
      success: true,
      tripId,
      trip: {
        pickup_address: currentTrip.pickup_address,
        drop_address: currentTrip.drop_address,
        departure_time: currentTrip.departure_time
      },
      total_matches: matches.length,
      matches
    });
  } catch (error) {
    console.error("Error finding matches:", error);
    res.status(500).json({ error: error.message });
  }
};