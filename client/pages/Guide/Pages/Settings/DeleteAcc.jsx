import React, { useState } from "react";
import { toast } from 'react-hot-toast';
import "./DeleteAcc.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DeleteAcc() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get user from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id;

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId) {
      toast.error("User not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    if (confirmText !== 'CONFIRM') {
      toast.error("Please type 'CONFIRM' to delete your account.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:4000/deleteAccount/${userId}`);
      
      if (response.status === 200) {
        toast.success("Account deleted successfully!");
        localStorage.removeItem("user");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-container-guide">
      <div className="card-guide">
        <h1 className="title-guide">Delete Account</h1>
        <div className="warning-section">
          <h2 className="warning-title">⚠️ Warning</h2>
          <p className="warning-text">
            This action cannot be undone. All your data will be permanently deleted.
            Please be certain before proceeding.
          </p>
        </div>
        <form className="form-guide" onSubmit={handleDeleteAccount}>
          <div className="confirm-section">
            <label className="label-guide">
              Type 'CONFIRM' to delete your account:
            </label>
            <input
              type="text"
              className="input-guide"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'CONFIRM'"
              required
            />
          </div>
          <button 
            type="submit" 
            className="delete-button-guide" 
            disabled={isLoading}
          >
            {isLoading ? "Deleting Account..." : "Delete Account"}
          </button>
          <button 
            type="button" 
            className="cancel-button-guide"
            onClick={() => navigate("/guide/dashboard")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
