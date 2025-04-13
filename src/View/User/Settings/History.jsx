import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./History.css";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDropdown, setShowDropdown] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        const response = await axios.get('http://localhost:4000/user-history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setHistory(response.data.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching history:", error);
        toast.error('Failed to load history');
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/user-history/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setHistory(prev => prev.filter(item => item._id !== id));
      setShowDropdown(null);
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const itemsToDelete = Array.from(selectedItems);
      for (const id of itemsToDelete) {
        await axios.delete(`http://localhost:4000/user-history/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      setHistory(prev => prev.filter(item => !selectedItems.has(item._id)));
      setSelectedItems(new Set());
      toast.success('Selected items deleted');
    } catch (error) {
      toast.error('Failed to delete selected items');
    }
  };

  const handleCheckboxChange = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const filteredHistory = history.filter(item =>
    searchQuery === "" ||
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearAll = async () => {
    if (!user || history.length === 0) {
      return;
    }

    try {
      // Delete all history from database
      await axios.delete('http://localhost:4000/user-history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Clear local state
      setHistory([]);
      setSelectedItems(new Set());
      toast.success('All history cleared successfully');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="page-container65">
      <Header />
      <div className="main-container65">
        <div className="heading65">
          <h1 className="title-heading65">Track Your Travel History</h1>
          <p className="title-para65">Access a detailed history of your past trips and visits.</p>
        </div>

        <div className="search-container65">
          <input
            type="text"
            placeholder="Search History..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input65"
          />
          {selectedItems.size > 0 ? (
            <button
              className="delete-selected-button65"
              onClick={handleDeleteSelected}
            >
              Delete Selected
            </button>
          ) : (
            <button
              className="clear-button65"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
        </div>

        <div className="history-list65">
          {loading ? (
            <div className="loading65">Loading history...</div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div className="history-item65" key={item._id}>
                <div className="history-checkbox65">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item._id)}
                    onChange={() => handleCheckboxChange(item._id)}
                  />
                </div>
                <div className="history-content65">
                  <div className="history-header65">
                    <span className="user-name65">{user.firstName}</span>
                    <span className="action65">{item.action}</span>
                    <span className="item-name65">{item.itemName}</span>
                  </div>
                  <div className="history-time65">
                    <span className="time-icon65">📅</span>
                    {formatDate(item.timestamp)}
                  </div>
                </div>
                <div className="dropdown-container65">
                  <button
                    className="more-options65"
                    onClick={() => setShowDropdown(showDropdown === item._id ? null : item._id)}
                  >
                    ⋮
                  </button>
                  {showDropdown === item._id && (
                    <div className="dropdown-menu65">
                      <button
                        className="delete-option65"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-history65">
              {searchQuery ? "No matching results found." : "No history available."}
            </p>
          )}
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}
