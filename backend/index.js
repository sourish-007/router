import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { ConnectDB } from "./src/lib/db.js";

import tripRoutes from "./src/routes/trip.route.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true, 
}));

app.use(express.json());

app.use("/trip", tripRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
    ConnectDB();
});