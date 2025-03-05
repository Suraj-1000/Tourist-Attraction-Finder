import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminHistory.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminHistoryPage() {
  const [showMenu, setShowMenu] = useState(false);
  const [isChecked, setIsChecked] = useState(false); 

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  return (
    <>
      <Header />
      <div className="main-container28">
        <div className="heading28">
          <h1 className="title-heading28">Track Your Travel History</h1>
          <p className="title-para28">Access a detailed history of your past trips and visits.</p>
        </div>

        <div className="search-container28">
          <div className="search-box28">
            <input
              className="search-location28"
              type="text"
              placeholder="Search History..."
            />
            <span className="icon-search28"></span>
          </div>

          <div className="search-box28">
            <button className="search-button28">
              Search
            </button>
          </div>
        </div>

        <div className="crum-container28">
          <p className="by-group28">📅 By Date</p>
          {isChecked && ( // Only show the Delete button when checkbox is checked
            <button className="delete-button28">Delete</button>
          )}
        </div>

        <div className="history-container28">
          <div className="history-card28">
            <input
              type="checkbox"
              className="checkbox28"
              onChange={handleCheckboxChange} // Track checkbox changes
            />
            <div className="history-content28">
              <p className="history-title28">
                <strong className="username28">Suraj</strong>{" "}
                <span className="action28">searched Annapurna Base Camp</span>
              </p>
              <p className="history-time28">📅 Date & Time: Last Wednesday at 9:42 AM</p>
            </div>
            <span className="menu-icon28" onClick={() => setShowMenu(!showMenu)}>⋮</span>
            {showMenu && (
              <div className="dropdown-menu28">
                <button className="remove-btn28">Remove from history</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
