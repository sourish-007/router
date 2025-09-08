import { Trip } from "../models/trip.model.js";

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
           Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateRouteOverlap = (route1Coords, route2Coords) => {
  if (!route1Coords || !route2Coords || route1Coords.length === 0 || route2Coords.length === 0) {
    return 0;
  }
  let totalOverlapDistance = 0;
  let totalRoute1Distance = 0;
  const proximityThreshold = 1.0;
  for (let i = 0; i < route1Coords.length - 1; i++) {
    const [lat1, lng1] = route1Coords[i];
    const [lat2, lng2] = route1Coords[i + 1];
    if (!lat1 || !lng1 || !lat2 || !lng2) continue;
    const segmentDistance = haversineDistance(lat1, lng1, lat2, lng2);
    totalRoute1Distance += segmentDistance;
    let segmentHasOverlap = false;
    for (let j = 0; j < route2Coords.length - 1; j++) {
      const [lat3, lng3] = route2Coords[j];
      const [lat4, lng4] = route2Coords[j + 1];
      if (!lat3 || !lng3 || !lat4 || !lng4) continue;
      const midPoint1Lat = (lat1 + lat2) / 2;
      const midPoint1Lng = (lng1 + lng2) / 2;
      const midPoint2Lat = (lat3 + lat4) / 2;
      const midPoint2Lng = (lng3 + lng4) / 2;
      const distanceBetweenSegments = haversineDistance(
        midPoint1Lat, midPoint1Lng, midPoint2Lat, midPoint2Lng
      );
      if (distanceBetweenSegments <= proximityThreshold) {
        segmentHasOverlap = true;
        break;
      }
    }
    if (segmentHasOverlap) {
      totalOverlapDistance += segmentDistance;
    }
  }
  const percentage = totalRoute1Distance > 0 ? (totalOverlapDistance / totalRoute1Distance) * 100 : 0;
  return Math.min(percentage, 100);
};

const calculateRouteDeviation = (currentTrip, candidate) => {
  const pickupDistance = haversineDistance(
    currentTrip.pickup_location[1],
    currentTrip.pickup_location[0],
    candidate.pickup_location[1],
    candidate.pickup_location[0]
  );
  const dropDistance = haversineDistance(
    currentTrip.dropoff_location[1],
    currentTrip.dropoff_location[0],
    candidate.dropoff_location[1],
    candidate.dropoff_location[0]
  );
  const additionalDistance = (pickupDistance + dropDistance);
  const originalDistance = currentTrip.total_distance / 1000;
  return originalDistance > 0 ? (additionalDistance / originalDistance) * 100 : 100;
};

const calculateMatchScore = (overlapPercentage, routeDeviation, timeDiff) => {
  const overlapScore = overlapPercentage * 0.5;
  const deviationScore = Math.max(0, (15 - routeDeviation)) * 2;
  const timeScore = Math.max(0, (30 - timeDiff)) * 1.5;
  return overlapScore + deviationScore + timeScore;
};

export const findMatches = async (currentTrip) => {
  try {
    const allTrips = await Trip.find({
      tripId: { $ne: currentTrip.tripId },
      userId: { $ne: currentTrip.userId }
    });
    const matches = [];
    if (!currentTrip.route_coordinates || currentTrip.route_coordinates.length === 0) {
      return matches;
    }
    for (const candidate of allTrips) {
      if (!candidate.route_coordinates || candidate.route_coordinates.length === 0) {
        continue;
      }
      const timeDiff = Math.abs(
        new Date(currentTrip.departure_time) - new Date(candidate.departure_time)
      ) / (1000 * 60);
      if (timeDiff > 30) continue;
      const overlapPercentage = calculateRouteOverlap(
        currentTrip.route_coordinates,
        candidate.route_coordinates
      );
      if (overlapPercentage < 5) continue;
      const routeDeviation = calculateRouteDeviation(currentTrip, candidate);
      if (routeDeviation > 15) continue;
      const pickupDistance = haversineDistance(
        currentTrip.pickup_location[1],
        currentTrip.pickup_location[0],
        candidate.pickup_location[1],
        candidate.pickup_location[0]
      );
      const dropDistance = haversineDistance(
        currentTrip.dropoff_location[1],
        currentTrip.dropoff_location[0],
        candidate.dropoff_location[1],
        candidate.dropoff_location[0]
      );
      const additionalDistanceKm = pickupDistance + dropDistance;
      const matchScore = calculateMatchScore(overlapPercentage, routeDeviation, timeDiff);
      matches.push({
        tripId: candidate.tripId,
        userId: candidate.userId,
        userName: candidate.userName,
        pickup_address: candidate.pickup_address,
        drop_address: candidate.drop_address,
        departure_time: candidate.departure_time,
        match_percentage: Math.min(Math.round(matchScore * 100) / 100, 100),
        overlap_percentage: Math.round(overlapPercentage * 100) / 100,
        route_deviation_percentage: Math.round(routeDeviation * 100) / 100,
        additional_distance_km: Math.round(additionalDistanceKm * 100) / 100,
        time_difference_minutes: Math.round(timeDiff),
        pickup_distance_km: Math.round(pickupDistance * 100) / 100,
        drop_distance_km: Math.round(dropDistance * 100) / 100,
        route_coordinates: candidate.route_coordinates
      });
    }
    return matches.sort((a, b) => b.match_percentage - a.match_percentage);
  } catch (error) {
    console.error("Error in findMatches:", error);
    throw error;
  }
};