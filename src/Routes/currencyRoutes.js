import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// GET route to fetch exchange rates
router.get("/exchange-rates", async (req, res) => {
    try {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        // Get rates with NPR as base currency
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/NPR`);
        
        // The API now directly gives us rates for 1 NPR to other currencies
        const rates = response.data.conversion_rates;
        
        res.json({
            conversion_rates: rates,
            base_code: "NPR",
            time_last_update_utc: response.data.time_last_update_utc
        });
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
});

export default router; // Use ES module export
