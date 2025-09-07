import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({});
const apiKey = process.env.GOOGLE_MAPS_API;

if (!apiKey) {
    throw new Error("API key is undefined in the .env file.");
}

export const getRouteDetails = async (pickup_lat, pickup_lng, drop_lat, drop_lng) => {
    try {
        const response = await client.directions({
            params: {
                origin: { lat: pickup_lat, lng: pickup_lng },
                destination: { lat: drop_lat, lng: drop_lng },
                key: apiKey,
            },
            timeout: 2000,
        });

        if (response.data.status !== 'OK' || !response.data.routes || response.data.routes.length === 0) {
            throw new Error(response.data.error_message || 'No routes found for the given coordinates.');
        }

        const route = response.data.routes[0];
        const leg = route.legs[0];

        const routeData = {
            polyline: route.overview_polyline.points,
            distance: leg.distance.value,
            pickup_address: leg.start_address,
            drop_address: leg.end_address,
        };

        return routeData;

    } catch (error) {
        console.error("Google Maps API request failed:", error);
        throw new Error('Failed to fetch route details from Google Maps.');
    }
};