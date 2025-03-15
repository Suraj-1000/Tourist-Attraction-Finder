import React from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import "./PassConfirm.css";

export default function PassConfirm() {
  const navigate = useNavigate();  // Initialize useNavigate

  // Handle button click to navigate to the login page
  const handleGoToLogin = () => {
    navigate("/login");  // Navigate to the login page
  };

  return (
    <>
      
      <div className="container3">
      <div className="logo3"></div>
        <div className="card3">
          <h1 className="title3">Successful!</h1>
          <div className="png3">
            {/* <img src="./success.png" alt="success" className="img" /> */}
          </div>
          <p className="message3">
            Password reset successful. Please login with your new password.
          </p>
          <button className="button3" onClick={handleGoToLogin}>Go to Login</button> {/* Add onClick handler */}
          <p className="support-text3">
            If you face any issues, contact our support team.
          </p>
        </div>
      </div>
    </>
  );
}
