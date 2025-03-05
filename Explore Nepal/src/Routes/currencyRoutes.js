import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// GET route to fetch exchange rates
router.get("/exchange-rates", async (req, res) => {
    try {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
});

export default router; // Use ES module export
