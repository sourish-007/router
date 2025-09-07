import { PlaceType2 } from '@googlemaps/google-maps-services-js';
import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    tripId: {
        type: String,
        required: true,
        unique: true,
        length: 10,
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    riderId: {
        type: String,
        required: true
    },
    pickup_location: {
        type: [],
        required: true
    },
    dropoff_location: {
        type: [],
        required: true
    },
    departure_time: {
        type: Date,
        required: true
    },
    route_polyline: {
        type: String,
        required: true
    },
    route_coordinates: {
        type: [[Number]],
        required: true
    },
    total_distance: {
        type: Number,
        required: true
    },
    pickup_address: {
        type: String,
        required: true
    },
    drop_address: {
        type: String,
        required: true
    }
}, { timestamps: true });

tripSchema.index({ pickup_location: '2dsphere' });
tripSchema.index({ route_geometry: '2dsphere' });

export const Trip = mongoose.model('Trip', tripSchema);