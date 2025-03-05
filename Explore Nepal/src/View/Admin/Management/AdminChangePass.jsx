import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./AdminChangePass.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!userEmail) {
      alert("User email not found. Please log in again.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/changePassword", {
        email: userEmail,
        currentPassword,
        newPassword,
      });

      if (response.status === 200) {
        alert("✅ Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("❌ Error updating password:", error);
      alert(error.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <>
      <Header />
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

            <button type="submit" className="button27">Update Password</button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
