import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState('NPR');
    const [exchangeRates, setExchangeRates] = useState({
        NPR: 1,
        USD: 0.0075,    // 1 NPR = 0.0075 USD
        INR: 0.62,      // 1 NPR = 0.62 INR (approximate)
        EUR: 0.0069,    // 1 NPR = 0.0069 EUR
        GBP: 0.0059,    // 1 NPR = 0.0059 GBP
        AUD: 0.0114,    // 1 NPR = 0.0114 AUD
        CAD: 0.0102,    // 1 NPR = 0.0102 CAD
        SGD: 0.0101,    // 1 NPR = 0.0101 SGD
        // Add more initial rates as needed
    });

    const updateCurrency = (newCurrency) => {
        setCurrency(newCurrency);
    };

    useEffect(() => {
        const fetchExchangeRates = async () => {
            try {
                const response = await axios.get("http://localhost:4000/currency/exchange-rates");
                if (response.data && response.data.conversion_rates) {
                    setExchangeRates(response.data.conversion_rates);
                    localStorage.setItem("exchangeRates", JSON.stringify(response.data.conversion_rates));
                }
            } catch (error) {
                console.error("Error fetching exchange rates:", error);
                // If API fails, use the last known rates from localStorage or fallback to default rates
                const storedRates = localStorage.getItem("exchangeRates");
                if (storedRates) {
                    setExchangeRates(JSON.parse(storedRates));
                }
                // If no stored rates, keep using the default rates
            }
        };

        // Fetch rates immediately
        fetchExchangeRates();

        // Set up an interval to fetch rates every hour
        const interval = setInterval(fetchExchangeRates, 3600000); // 1 hour

        return () => clearInterval(interval);
    }, []);
    
    return (
        <CurrencyContext.Provider value={{ currency, exchangeRates, updateCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}
