import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState({
        USD: 1,
        NPR: 132.95,
        EUR: 0.92,
        GBP: 0.79,
        AUD: 1.52,
        // Add more currencies as needed
    });

    const updateCurrency = (newCurrency) => {
        setCurrency(newCurrency);
    };

    useEffect(() => {
        const fetchExchangeRates = async () => {
            try {
                const response = await axios.get("http://localhost:4000/currency/exchange-rates");
                setExchangeRates(response.data.conversion_rates);
                localStorage.setItem("exchangeRates", JSON.stringify(response.data.conversion_rates));
            } catch (error) {
                console.error("Error fetching exchange rates:", error);
            }
        };
    
        const storedRates = localStorage.getItem("exchangeRates");
        if (storedRates) {
            setExchangeRates(JSON.parse(storedRates));
        } else {
            fetchExchangeRates();
        }
    }, []);
    
    

    return (
        <CurrencyContext.Provider value={{ currency, exchangeRates, updateCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}
