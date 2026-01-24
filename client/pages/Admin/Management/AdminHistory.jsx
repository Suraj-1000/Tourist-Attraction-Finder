import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./AdminHistory.css";
import Header from "../../../components/Admin Header/Admin-Header";
import Footer from "../../../components/Footer/AuthFooter";

export default function AdminHistoryPage() {
  const [history, setHistory] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [showMenuIndex, setShowMenuIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllUserHistory = async () => {
    try {
      const response = await axios.get('http://localhost:4000/admin/history/all');
      if (response.data.success) {
        setHistory(response.data.data);
        setFilteredHistory(response.data.data);
      } else {
        toast.error('Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading history data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUserHistory();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter((entry) =>
      entry.itemName?.toLowerCase().includes(query) ||
      entry.userId?.username?.toLowerCase().includes(query) ||
      entry.action?.toLowerCase().includes(query) ||
      entry.itemType?.toLowerCase().includes(query) ||
      new Date(entry.timestamp).toLocaleString().toLowerCase().includes(query)
    );

    setFilteredHistory(filtered);
    if (filtered.length === 0) {
      toast.info('No matching results found');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      if (checkedItems.size === 0) {
        toast.error('No items selected');
        return;
      }

      const selectedIds = Array.from(checkedItems).map(index => filteredHistory[index]._id);
      const response = await axios.post('http://localhost:4000/admin/history/delete-multiple', {
        ids: selectedIds
      });

      if (response.data.success) {
        const updatedHistory = history.filter(item => !selectedIds.includes(item._id));
        setHistory(updatedHistory);
        setFilteredHistory(updatedHistory);
        setCheckedItems(new Set());
        toast.success(`${selectedIds.length} items deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete selected items');
    }
  };

  const handleDeleteItem = async (index) => {
    try {
      const itemToDelete = filteredHistory[index];
      const response = await axios.delete(`http://localhost:4000/admin/history/${itemToDelete._id}`);

      if (response.data.success) {
        const updatedHistory = history.filter(item => item._id !== itemToDelete._id);
        setHistory(updatedHistory);
        setFilteredHistory(updatedHistory.filter(item =>
          item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.itemType?.toLowerCase().includes(searchQuery.toLowerCase())
        ));
        setShowMenuIndex(null);
        toast.success('Item deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const renderUserInfo = (entry) => {
    return entry.userFullName || 'Unknown User';
  };

  return (
    <>
      <Header />
      <div className="main-container28">
        <div className="heading28">
          <h1 className="title-heading28">User Activity History</h1>
          <p className="title-para28">View and manage all user activity history.</p>
        </div>

        <div className="search-container28">
          <input 
            className="search-location28" 
            type="text" 
            placeholder="Search by user, action, or item..." 
            value={searchQuery}
            onChange={handleSearch}
          />
          {filteredHistory.length > 0 && (
            <button 
              className="delete-button28" 
              onClick={handleDeleteSelected}
            >
              {checkedItems.size > 0 ? `Delete Selected (${checkedItems.size})` : 'Delete All'}
            </button>
          )}
        </div>

        <div className="history-container28">
          {loading ? (
            <p className="loading28">Loading history...</p>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((entry, index) => (
              <div className="history-card28" key={index}>
                <input
                  type="checkbox"
                  className="checkbox28"
                  checked={checkedItems.has(index)}
                  onChange={() => {
                    const updatedCheckedItems = new Set(checkedItems);
                    if (updatedCheckedItems.has(index)) {
                      updatedCheckedItems.delete(index);
                    } else {
                      updatedCheckedItems.add(index);
                    }
                    setCheckedItems(updatedCheckedItems);
                  }}
                />

                <div className="history-content28">
                  <p className="user-info28">
                    {renderUserInfo(entry)}
                    {entry.userEmail && <span className="user-email28">({entry.userEmail})</span>}
                  </p>
                  <p>
                    <strong>Action:</strong> {entry.action}
                  </p>
                  <p>
                    <strong>Item:</strong> {entry.itemName}
                  </p>
                  <p>
                    <strong>Type:</strong> {entry.itemType}
                  </p>
                  <p className="history-time28">📅 {new Date(entry.timestamp).toLocaleString()}</p>
                </div>

                <span 
                  className="menu-icon28" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuIndex(showMenuIndex === index ? null : index);
                  }}
                >
                  ⋮
                </span>

                {showMenuIndex === index && (
                  <div className="dropdown-menu28">
                    <button className="remove-btn28" onClick={() => handleDeleteItem(index)}>
                      Delete entry
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
