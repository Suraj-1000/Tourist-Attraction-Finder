import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../Components/Auth/AuthContext";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./History.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchUserHistory = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/user-history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setHistory(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history. Please try again later.");
      toast.error("Failed to load history", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, [user?._id]); // Only re-run when user ID changes

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <Header />
      <div className="history-container">
        <h2>Track Your Travel History</h2>
        <p>Access a detailed history of your past trips and visits.</p>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search History..."
            className="search-input"
          />
        </div>

        {history.length === 0 ? (
          <div className="no-history">
            <h3>No history available.</h3>
            <p>You have no history items.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item._id} className="history-item">
                {/* Render history item details */}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default History; 