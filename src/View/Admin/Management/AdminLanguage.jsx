import React, { useEffect, useRef, useState } from "react";
import "./AdminLanguage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import axios from "axios"; // Import axios for API requests

export default function AdminLanguagePage() {
  const translateRef = useRef(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState({ name: "", code: "", flag: "" });
  const [editingLanguageId, setEditingLanguageId] = useState(null);

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
            "google_translate_element33"
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

  const handleNewLanguageChange = (e) => {
    const { name, value } = e.target;
    setNewLanguage((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleEdit = (language) => {
    setNewLanguage({
      name: language.name,
      code: language.code,
      flag: language.flag
    });
    setEditingLanguageId(language._id);
  };

  const handleAddOrUpdateLanguage = async (e) => {
    e.preventDefault();
    if (newLanguage.name && newLanguage.code && newLanguage.flag) {
      try {
        if (editingLanguageId) {
          const response = await axios.put(`http://localhost:4000/language/${editingLanguageId}`, newLanguage);
          setLanguages((prevLanguages) =>
            prevLanguages.map((lang) => (lang._id === editingLanguageId ? response.data : lang))
          );
          setEditingLanguageId(null);
        } else {
          const response = await axios.post("http://localhost:4000/language", newLanguage);
          setLanguages([...languages, response.data]);
        }
        setNewLanguage({ name: "", code: "", flag: "" });
      } catch (error) {
        console.error("Error saving language:", error);
      }
    }
  };

  const handleDelete = async (languageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this language?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:4000/language/${languageId}`);
        setLanguages((prev) => prev.filter((lang) => lang._id !== languageId));
        alert("✅ Language deleted successfully.");
      } catch (error) {
        console.error("Error deleting language:", error);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="main-container33">
        <div className="heading33">
          <h1 className="title-heading33">Language Translator</h1>
          <p className="title-para33">Select a language to translate the page.</p>
        </div>

        <div className="div33 card33">
          <h3 className="h3-33" style={{ marginBottom: "20px" }}>Add Your Preferred Language</h3>
          <form className="add-language-form33" onSubmit={handleAddOrUpdateLanguage}>
            <input
              type="text"
              name="name"
              placeholder="Language Name"
              value={newLanguage.name}
              onChange={handleNewLanguageChange}
              required
            />
            <input
              type="text"
              name="code"
              placeholder="Language Code"
              value={newLanguage.code}
              onChange={handleNewLanguageChange}
              required
            />
            <input
              type="text"
              name="flag"
              placeholder="Language Flag"
              value={newLanguage.flag}
              onChange={handleNewLanguageChange}
              required
            />
            <button type="submit">{editingLanguageId ? "Update" : "Add Language"}</button>
          </form>

          <h3 className="h3-33">Select Your Preferred Language</h3>

          <div className="language-grid33">
            {languages.map((lang) => (
              <div
                key={lang._id}
                className={`language-card33 notranslate ${selectedLanguage === lang.code ? "selected" : ""}`}
                onClick={() => handleLanguageChange(lang.code)}
                data-language={lang.name}
              >
                <div className="language-flag-container33">
                  <span className="language-flag33">{lang.flag}</span>
                </div>
                <span className="language-name33">{lang.name}</span>
                {selectedLanguage === lang.code && <span className="tick-mark33">✔</span>}

                <div className="overlay33">
                  <img
                    src="/images/edit.png"
                    alt="Edit"
                    className="edit-icon33"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(lang);
                    }}
                  />
                  <img
                    src="/images/dlete.png"
                    alt="Delete"
                    className="delete-icon33"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(lang._id);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div id="google_translate_element33" ref={translateRef} style={{ display: 'none' }}></div>

          <div className="info-section33">
            <h2 className="info-title33">Why Use Our Translator?</h2>
            <p className="info-text33">
              Our language translation feature helps you access content in your preferred language, making it easier to understand and navigate our site.
            </p>
            <p className="info-text33">
              If you need help, check our <a href="/help" className="info-link33">help section</a> for more information.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
