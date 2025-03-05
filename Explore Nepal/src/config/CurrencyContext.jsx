import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(localStorage.getItem("selectedCurrency") || "USD");
    const [exchangeRates, setExchangeRates] = useState({});

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
        <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRates }}>
            {children}
        </CurrencyContext.Provider>
    );
};
