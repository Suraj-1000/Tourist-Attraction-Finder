import React, { useState } from "react";
import "./PassReset.css";
import { useNavigate } from "react-router-dom"; 
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";

const ResetButton = ({ handlePasswordReset }) => {
  return (
    <button
      type="submit"
      className="button2"
      onClick={handlePasswordReset}
    >
      Update Password
    </button>
  );
};

export default function PassReset() {
  const navigate = useNavigate();
  
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Validate that passwords match
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/pass_reset", {
        resetCode,
        newPassword,
        confirmPassword
      });

      if (response.status === 200) {
        toast.success(response.data.message);
        navigate("/passConfirm");  // Redirect user to the login page after a successful reset
      } else {
        toast.error(response.data.message);  // Display error message
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <div className="main-container2">
      <div className="logo2"></div>
        <div className="card2">
          <h1 className="title2">Reset Your Password</h1>
          <p className="subtitle2">Enter a new password for your account.</p>
          <form className="form2" onSubmit={handlePasswordReset}>
            <label htmlFor="reset-token">Reset Token</label>
            <input
              id="reset-token"
              type="text"
              placeholder="Enter reset token"
              className="input2"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
            />
            <label htmlFor="new-password">New Password</label>
            <div className="password-field2">
              <input
                id="new-password"
                type={newPasswordVisible ? "text" : "password"}
                placeholder="Enter new password"
                className="input2 input-full2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-icon2 inside2"
                onClick={() => setNewPasswordVisible(!newPasswordVisible)}
              >
                {newPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="password-field2">
              <input
                id="confirm-password"
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="Confirm new password"
                className="input2 input-full2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-icon2 inside2"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              >
                {confirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <ResetButton handlePasswordReset={handlePasswordReset} />
          </form>
          <p className="or2">or</p>
          <p className="login-here2">
            Remember your password?{" "}
            <Link to="/login" className="link2">Login here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
