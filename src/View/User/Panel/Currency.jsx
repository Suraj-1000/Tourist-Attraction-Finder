import React, { useState, useEffect, useContext  } from "react";
import axios from "axios";
import "./Currency.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CurrencyPage() {
  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedCurrencyFrom, setSelectedCurrencyFrom] = useState("USD");
  const [selectedCurrencyTo, setSelectedCurrencyTo] = useState("NPR");
  const [inputPrice, setInputPrice] = useState("");
  const [convertedPrice, setConvertedPrice] = useState("");
  const [conversionHistory, setConversionHistory] = useState([]);
  const { currency, updateCurrency } = useContext(CurrencyContext);

  const apiKey = "c7b6e0414beb80a037394c15"; 

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
      setExchangeRates(response.data.conversion_rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  const handleConvert = () => {
    const rateFrom = exchangeRates[selectedCurrencyFrom];
    const rateTo = exchangeRates[selectedCurrencyTo];

    if (rateFrom && rateTo && inputPrice) {
      const converted = (inputPrice * (rateTo / rateFrom)).toFixed(2);
      setConvertedPrice(converted);
      
      setConversionHistory(prevHistory => [
        ...prevHistory,
        {
          from: selectedCurrencyFrom,
          to: selectedCurrencyTo,
          amount: inputPrice,
          converted,
          date: new Date().toLocaleString(),
        },
      ]);

      toast.success(`Successfully converted ${inputPrice} ${selectedCurrencyFrom} to ${selectedCurrencyTo}`, {
        className: 'toast-message60',
      });
    } else {
      toast.error('Please enter an amount to convert', {
        className: 'toast-message60',
      });
    }
  };

  const handleSwap = () => {
    setSelectedCurrencyFrom(selectedCurrencyTo);
    setSelectedCurrencyTo(selectedCurrencyFrom);
    setConvertedPrice("");
    setInputPrice("");
    toast.info('Currencies swapped successfully!', {
      className: 'toast-message60',
    });
  };

  const handleClearHistory = () => {
    setConversionHistory([]);
    toast.success('Conversion history cleared!', {
      className: 'toast-message60',
    });
  };

  const handleCurrencyChange = (e) => {
    updateCurrency(e.target.value);
    toast.success(`Currency preference updated to ${e.target.value}`, {
      className: 'toast-message60',
    });
  };

  const desiredCurrencies = [
    "USD", "INR", "KWD", "CAD", "JPY", "CNY",
    "AED", "QAR", "SAR", "GBP", "EUR", "AUD",
    "SGD", "THB", "MYR", "KRW", "HKD", "BHD", "OMR",
  ];

  const currenciesInNPR = desiredCurrencies
    .filter(currency => exchangeRates[currency])
    .map(currency => ({
      currency,
      priceInNPR: (1 * exchangeRates.NPR / exchangeRates[currency]).toFixed(2),
    }));

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      <div className="main-container60">
        <div className="heading60">
          <h1 className="title-heading60">Currency Converter</h1>
          <p className="title-para60">Select currencies and convert prices.</p>
        </div>

        <div className="flex-container60">
          <div className="currency-table-container60">
            <h2 className="table-heading60">Currency Prices in Nepal (NPR)</h2>
            <table className="currency-table60">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>1 Unit = ? NPR</th>
                </tr>
              </thead>
              <tbody>
                {currenciesInNPR.map((currencyInfo, index) => (
                  <tr key={index}>
                    <td>{currencyInfo.currency}</td>
                    <td>{currencyInfo.priceInNPR}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="right-container60">
          <h2 className="currency-heading60" style={{ textAlign: 'center' }}>Adjust Prices to Your Preference</h2>
          <div className="currency-selection-card60">
            <h2 className="selection-heading60">Select Another Currency</h2>
            <select value={currency} onChange={handleCurrencyChange}>
              {Object.keys(exchangeRates).map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
           
            <p className="selected-currency60">
              Selected Currency: <span className="currency-value60">{currency}</span>
            </p>
          </div>



            <div className="currency-converter60">
              <h2 className="converter-heading60">Currency Converter</h2>
              <div className="converter-inputs60">
                <div className="currency-row60">
                  <select value={selectedCurrencyFrom} onChange={(e) => setSelectedCurrencyFrom(e.target.value)}>
                    {Object.keys(exchangeRates).map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    placeholder="Enter price"
                  />
                </div>

                <div className="currency-row60">
                  <select value={selectedCurrencyTo} onChange={(e) => setSelectedCurrencyTo(e.target.value)}>
                    {Object.keys(exchangeRates).map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={convertedPrice}
                    readOnly
                    placeholder="Converted price"
                  />
                </div>

                <div className="buttons-container60">
                  <button className="swap-btn60" onClick={handleSwap}>Swap</button>
                  <button className="convert-btn60" onClick={handleConvert}>Convert</button>
                </div>
              </div>

              <div className="conversion-result60">
                {convertedPrice && (
                  <p>{inputPrice} {selectedCurrencyFrom} = {convertedPrice} {selectedCurrencyTo}</p>
                )}
              </div>
            </div>

            <div className="conversion-history60">
              <h3 className="history-heading60">Conversion History</h3>
              <button className="clear-history-button60" onClick={handleClearHistory}>
                <FaTrash /> Clear History
              </button>
              <ul className="history-list60">
                {conversionHistory.map((history, index) => (
                  <li key={index}>
                    {history.amount} {history.from} = {history.converted} {history.to} on {history.date}
                  </li>
                ))}
              </ul>
            </div>

            
          </div>
        </div>
        {/* Additional Content Section Inside right-container60 */}
        <div className="additional-info60">
              <h3 className="additional-heading60">Did You Know?</h3>
              <p className="additional-text60">
                Currency conversion rates can fluctuate frequently. It's always good to check the latest rates before making transactions!
              </p>
              <h3 className="historical-data-heading60">Historical Data</h3>
              <p className="historical-data-text60">
                You can view historical exchange rates for better insights into trends over time.
              </p>
            </div>
      </div>
      <Footer />
    </>
  );
}
