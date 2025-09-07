import { Router } from "express";
import { createTrip, getMatches } from "../controllers/trip.controller.js";

const router = Router();

router.post('/create-trips', createTrip);
router.get('/matches/:tripId', getMatches);

export default router;