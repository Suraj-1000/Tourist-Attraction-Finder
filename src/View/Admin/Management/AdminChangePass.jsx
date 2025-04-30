import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./AdminChangePass.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";

export default function PassReset() {
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
      toast.error("User email not found. Please log in again.", {
        className: 'toast-message27',
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (newPassword.includes(' ')) {
      toast.error("Password cannot contain spaces", {
        className: 'toast-message27',
      });
      setIsLoading(false);
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      toast.error("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character", {
        className: 'toast-message27',
      });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!", {
        className: 'toast-message27',
      });
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
        toast.success("Password updated successfully!", {
          className: 'toast-message27',
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.data.message, {
          className: 'toast-message27',
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Something went wrong.", {
        className: 'toast-message27',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      <div className="main-container27">
        <div className="card27">
          <h1 className="title27">Change Password</h1>
          <form className="form27" onSubmit={handleChangePassword}>
            <label className="label27" htmlFor="current-password">Current Password</label>
            <div className="password-field27">
              <input
                id="current-password"
                type={currentPasswordVisible ? "text" : "password"}
                placeholder="Enter current password"
                className="input27"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button type="button" className="eye-icon27" onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}>
                {currentPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <label className="label27" htmlFor="new-password">New Password</label>
            <div className="password-field27">
              <input
                id="new-password"
                type={newPasswordVisible ? "text" : "password"}
                placeholder="Enter new password"
                className="input27"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="button" className="eye-icon27" onClick={() => setNewPasswordVisible(!newPasswordVisible)}>
                {newPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <label className="label27" htmlFor="confirm-password">Confirm New Password</label>
            <div className="password-field27">
              <input
                id="confirm-password"
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="Confirm new password"
                className="input27"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" className="eye-icon27" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                {confirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <button 
              type="submit" 
              className="button27" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-text27">
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
