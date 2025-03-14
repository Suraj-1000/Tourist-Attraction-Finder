import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./AdminHistory.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";

export default function AdminHistoryPage() {
  const [history, setHistory] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [showMenuIndex, setShowMenuIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHistory, setFilteredHistory] = useState([]);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("userHistory")) || [];
    setHistory(storedHistory);
    setFilteredHistory(storedHistory);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter((entry) =>
      entry.attraction.toLowerCase().includes(query) ||
      entry.user.toLowerCase().includes(query) ||
      entry.action.toLowerCase().includes(query) ||
      entry.timestamp.toLowerCase().includes(query)
    );

    setFilteredHistory(filtered);
    if (filtered.length === 0) {
      toast.info('No matching results found');
    }
  };

  const handleCheckboxChange = (index) => {
    const updatedCheckedItems = new Set(checkedItems);
    if (updatedCheckedItems.has(index)) {
      updatedCheckedItems.delete(index);
    } else {
      updatedCheckedItems.add(index);
    }
    setCheckedItems(updatedCheckedItems);
  };

  const handleDeleteOrClear = () => {
    try {
      if (checkedItems.size > 0) {
        const updatedHistory = history.filter((_, index) => !checkedItems.has(index));
        setHistory(updatedHistory);
        setFilteredHistory(updatedHistory);
        localStorage.setItem("userHistory", JSON.stringify(updatedHistory));
        setCheckedItems(new Set());
        toast.success(`${checkedItems.size} item${checkedItems.size > 1 ? 's' : ''} deleted successfully!`);
      } else {
        if (history.length === 0) {
          toast.error('No history to clear');
          return;
        }
        setHistory([]);
        setFilteredHistory([]);
        localStorage.setItem("userHistory", JSON.stringify([]));
        setSearchQuery("");
        toast.success('All history cleared successfully!');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleRemoveItem = (index) => {
    try {
      const actualIndex = history.indexOf(filteredHistory[index]);
      const updatedHistory = history.filter((_, i) => i !== actualIndex);
      setHistory(updatedHistory);
      setFilteredHistory(updatedHistory.filter(item => 
        item.attraction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.timestamp.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      localStorage.setItem("userHistory", JSON.stringify(updatedHistory));
      setShowMenuIndex(null);
      toast.success('Item removed successfully!');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleMenuClick = (index) => {
    setShowMenuIndex(showMenuIndex === index ? null : index);
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
          <input 
            className="search-location28" 
            type="text" 
            placeholder="Search History..." 
            value={searchQuery}
            onChange={handleSearch}
          />
          {history.length > 0 && (
            <button 
              className="delete-button28" 
              onClick={handleDeleteOrClear}
            >
              {checkedItems.size > 0 ? 'Delete' : 'Clear All'}
            </button>
          )}
        </div>

        <div className="history-container28">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((entry, index) => (
              <div className="history-card28" key={index}>
                <input
                  type="checkbox"
                  className="checkbox28"
                  checked={checkedItems.has(index)}
                  onChange={() => handleCheckboxChange(index)}
                />

                <div className="history-content28">
                  <p>
                    <strong>{entry.user}</strong> {entry.action}{" "}
                    <strong>{entry.attraction}</strong>
                  </p>
                  <p className="history-time28">📅 {entry.timestamp}</p>
                </div>

                <span 
                  className="menu-icon28" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(index);
                  }}
                >
                  ⋮
                </span>

                {showMenuIndex === index && (
                  <div className="dropdown-menu28">
                    <button className="remove-btn28" onClick={() => handleRemoveItem(index)}>
                      Remove from history
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="no-history28">
              {searchQuery ? "No matching results found." : "No history available."}
            </p>
          )}
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </>
  );
}
