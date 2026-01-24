import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from 'react-hot-toast';
import "./Password.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Password() {
  const navigate = useNavigate();

  // Get user email from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userEmail = storedUser?.email || "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userEmail) {
      toast.error("User email not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (newPassword.includes(' ')) {
      toast.error("Password cannot contain spaces");
      setIsLoading(false);
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      toast.error("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/changePassword", {
        email: userEmail,
        currentPassword,
        newPassword,
      });

      if (response.status === 200) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          navigate("/guide/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-container-guide">
      <div className="card-guide">
        <h1 className="title-guide">Change Password</h1>
        <form className="form-guide" onSubmit={handleChangePassword}>
          <label className="label-guide" htmlFor="current-password">Current Password</label>
          <div className="password-field-guide">
            <input
              id="current-password"
              type={currentPasswordVisible ? "text" : "password"}
              placeholder="Enter current password"
              className="input-guide"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="eye-icon-guide" 
              onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}
            >
              {currentPasswordVisible ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <label className="label-guide" htmlFor="new-password">New Password</label>
          <div className="password-field-guide">
            <input
              id="new-password"
              type={newPasswordVisible ? "text" : "password"}
              placeholder="Enter new password"
              className="input-guide"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="eye-icon-guide" 
              onClick={() => setNewPasswordVisible(!newPasswordVisible)}
            >
              {newPasswordVisible ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <label className="label-guide" htmlFor="confirm-password">Confirm New Password</label>
          <div className="password-field-guide">
            <input
              id="confirm-password"
              type={confirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm new password"
              className="input-guide"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="eye-icon-guide" 
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              {confirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button 
            type="submit" 
            className="button-guide" 
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
