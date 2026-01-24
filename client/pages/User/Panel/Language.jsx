import React, { useEffect, useRef, useState } from "react";
import "./Language.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import axios from "axios"; // Import axios for API requests

export default function LanguagePage() {
  const translateRef = useRef(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    fetchLanguages();
    loadGoogleTranslate();

    // Retrieve the previously selected language from localStorage
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
      setTimeout(() => updateGoogleTranslateDropdown(savedLanguage), 1000);
    }
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await axios.get("http://localhost:4000/language");
      setLanguages(response.data);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  const loadGoogleTranslate = () => {
    if (!window.googleTranslateLoaded) {
      window.googleTranslateLoaded = true;
  
      window.googleTranslateElementInit = () => {
        if (window.google?.translate && translateRef.current) {
          new window.google.translate.TranslateElement(
            { pageLanguage: "en", autoDisplay: false },
            "google_translate_element62"
          );
          console.log("✅ Google Translate initialized.");
        }
      };
  
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
  
      // Wait for the script to load before checking the dropdown
      script.onload = () => {
        console.log("✅ Google Translate script loaded.");
        setTimeout(() => updateGoogleTranslateDropdown(selectedLanguage), 2000);
      };
    }
  };
  
  const updateGoogleTranslateDropdown = (code, retries = 0) => {
    const googleTranslateDropdown = document.querySelector(".goog-te-combo");
  
    if (googleTranslateDropdown) {
      googleTranslateDropdown.value = code;
      googleTranslateDropdown.dispatchEvent(new Event("change", { bubbles: true }));
      console.log("✅ Language updated successfully:", code);
    } else {
      if (retries < 15) { // Increase retries to 15
        console.warn(`Google Translate dropdown not found, retrying... (${retries + 1})`);
        setTimeout(() => updateGoogleTranslateDropdown(code, retries + 1), 1000);
      } else {
        console.error("❌ Google Translate dropdown could not be found after multiple attempts.");
      }
    }
  };
  
  

  const handleLanguageChange = (code) => {
    setSelectedLanguage(code);
    localStorage.setItem("selectedLanguage", code);
    updateGoogleTranslateDropdown(code);
  };




  return (
    <>
      <Header />
      <div className="main-container62">
        <div className="heading62">
          <h1 className="title-heading62">Language Translator</h1>
          <p className="title-para62">Select a language to translate the page.</p>
        </div>

        <div className="div62 card62">

          <h3 className="h3-62">Select Your Preferred Language</h3>

          <div className="language-grid62">
            {languages.map((lang) => (
              <div
                key={lang._id}
                className={`language-card62 notranslate ${selectedLanguage === lang.code ? "selected" : ""}`}
                onClick={() => handleLanguageChange(lang.code)}
                data-language={lang.name}
              >
                <div className="language-flag-container62">
                  <span className="language-flag62">{lang.flag}</span>
                </div>
                <span className="language-name62">{lang.name}</span>
                {selectedLanguage === lang.code && <span className="tick-mark62">✔</span>}

              </div>
            ))}
          </div>

          <div id="google_translate_element62" ref={translateRef} style={{ display: 'none' }}></div>

          <div className="info-section62">
            <h2 className="info-title62">Why Use Our Translator?</h2>
            <p className="info-text62">
              Our language translation feature helps you access content in your preferred language, making it easier to understand and navigate our site.
            </p>
            <p className="info-text62">
              If you need help, check our <a href="/help" className="info-link62">help section</a> for more information.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
