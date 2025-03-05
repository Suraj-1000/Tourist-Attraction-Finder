import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminNotification.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminNotificationPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "reminder",
      title: "Trip Reminder",
      message: "Don't forget to pack your essentials for your upcoming trip!",
      timestamp: "Last Monday at 3:12 PM",
      actions: ["View Offer"],
    },
    {
      id: 2,
      type: "reminder",
      title: "Reminder",
      message: "Your Annapurna Base Camp Trek Starts in 3 days!",
      timestamp: "Last Monday at 10:35 AM",
      actions: [],
    },
    {
      id: 3,
      type: "flash-sale",
      title: "Flash Sale",
      message: "10% off on your next Adventure Activity!",
      timestamp: "Last Sunday at 3:08 PM",
      actions: ["View Offer"],
    },
    {
      id: 4,
      type: "flash-sale",
      title: "Flash Sale",
      message: "10% off on your next Adventure Activity!",
      timestamp: "Last Sunday at 3:08 PM",
      actions: ["Accept", "Reject"],
    },
  ]);

  // State to manage open dropdowns
  const [openMenus, setOpenMenus] = useState({});

  // Function to toggle menu for specific notification
  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle the state of the clicked menu
    }));
  };

  return (
    <>
      <Header />
      <div className="main-container30">
        <div className="heading30">
          <h1 className="title-heading30">Notification Preferences</h1>
          <p className="title-para30">Stay updated with alerts for your favorite activities!</p>
        </div>
        <h2 className="h2-30">Notification</h2>
        <div className="notification-container30">
          {notifications.map((notification) => (
            <div className={`notification-card30 ${notification.type}`} key={notification.id}>
              <div className="notification-content30">
                <p className="notification-title30">
                  <strong className="username30">Suraj</strong>{" "}
                  <span className="action30">{notification.message}</span>
                </p>
                <p className="notification-time30">📅 Date & Time: {notification.timestamp}</p>
              </div>
              <div className="notification-actions30">
                {notification.actions.map((action, index) => {
                  let actionClass = action.toLowerCase().replace(' ', '-');
                  return (
                    <button key={index} className={`btn ${actionClass}`}>
                      {action}
                    </button>
                  );
                })}
              </div>
              {/* 3-dot menu icon */}
              <span className="menu-icon30" onClick={() => toggleMenu(notification.id)}>⋮</span>

              {/* Conditionally render the dropdown for the specific notification */}
              {openMenus[notification.id] && (
                <div className="dropdown-menu30">
                  <button className="dropdown-item30">Mark as Read</button>
                  <hr className="dropdown-divider30" />
                  <button className="remove-btn30">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
