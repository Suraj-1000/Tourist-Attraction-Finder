import React, { useState, useEffect, useContext  } from "react";
import axios from "axios";
import "./AdminCurrency.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import { FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminCurrencyPage() {
  const [exchangeRates, setExchangeRates] = useState({});
  const [selectedCurrencyFrom, setSelectedCurrencyFrom] = useState("USD");
  const [selectedCurrencyTo, setSelectedCurrencyTo] = useState("NPR");
  const [inputPrice, setInputPrice] = useState("");
  const [convertedPrice, setConvertedPrice] = useState("");
  const [conversionHistory, setConversionHistory] = useState([]);
  const { currency, updateCurrency } = useContext(CurrencyContext);

  const apiKey = "2bc865e457a5535f8e6631e5"; 

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
        className: 'toast-message32',
      });
    } else {
      toast.error('Please enter an amount to convert', {
        className: 'toast-message32',
      });
    }
  };

  const handleSwap = () => {
    setSelectedCurrencyFrom(selectedCurrencyTo);
    setSelectedCurrencyTo(selectedCurrencyFrom);
    setConvertedPrice("");
    setInputPrice("");
    toast.info('Currencies swapped successfully!', {
      className: 'toast-message32',
    });
  };

  const handleClearHistory = () => {
    setConversionHistory([]);
    toast.success('Conversion history cleared!', {
      className: 'toast-message32',
    });
  };

  const handleCurrencyChange = (e) => {
    updateCurrency(e.target.value);
    toast.success(`Currency preference updated to ${e.target.value}`, {
      className: 'toast-message32',
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
      <div className="main-container32">
        <div className="heading32">
          <h1 className="title-heading32">Currency Converter</h1>
          <p className="title-para32">Select currencies and convert prices.</p>
        </div>

        <div className="flex-container32">
          <div className="currency-table-container32">
            <h2 className="table-heading32">Currency Prices in Nepal (NPR)</h2>
            <table className="currency-table32">
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

          <div className="right-container32">
          <h2 className="currency-heading32" style={{ textAlign: 'center' }}>Adjust Prices to Your Preference</h2>
          <div className="currency-selection-card32">
            <h2 className="selection-heading32">Select Another Currency</h2>
            <select value={currency} onChange={handleCurrencyChange}>
              {Object.keys(exchangeRates).map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
           
            <p className="selected-currency32">
              Selected Currency: <span className="currency-value32">{currency}</span>
            </p>
          </div>



            <div className="currency-converter32">
              <h2 className="converter-heading32">Currency Converter</h2>
              <div className="converter-inputs32">
                <div className="currency-row32">
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

                <div className="currency-row32">
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

                <div className="buttons-container32">
                  <button className="swap-btn32" onClick={handleSwap}>Swap</button>
                  <button className="convert-btn32" onClick={handleConvert}>Convert</button>
                </div>
              </div>

              <div className="conversion-result32">
                {convertedPrice && (
                  <p>{inputPrice} {selectedCurrencyFrom} = {convertedPrice} {selectedCurrencyTo}</p>
                )}
              </div>
            </div>

            <div className="conversion-history32">
              <h3 className="history-heading32">Conversion History</h3>
              <button className="clear-history-button32" onClick={handleClearHistory}>
                <FaTrash /> Clear History
              </button>
              <ul className="history-list32">
                {conversionHistory.map((history, index) => (
                  <li key={index}>
                    {history.amount} {history.from} = {history.converted} {history.to} on {history.date}
                  </li>
                ))}
              </ul>
            </div>

            
          </div>
        </div>
        {/* Additional Content Section Inside right-container32 */}
        <div className="additional-info32">
              <h3 className="additional-heading32">Did You Know?</h3>
              <p className="additional-text32">
                Currency conversion rates can fluctuate frequently. It's always good to check the latest rates before making transactions!
              </p>
              <h3 className="historical-data-heading32">Historical Data</h3>
              <p className="historical-data-text32">
                You can view historical exchange rates for better insights into trends over time.
              </p>
            </div>
      </div>
      <Footer />
    </>
  );
}
