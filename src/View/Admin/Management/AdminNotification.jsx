import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminNotification.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminNotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [openMenus, setOpenMenus] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Function to update notification count
  const updateNotificationCount = (notifications) => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
    localStorage.setItem('adminUnreadNotificationCount', count.toString());
    window.dispatchEvent(new Event('adminNotificationUpdate'));
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:4000/notifications/admin');
      const dbNotifications = response.data;
      setNotifications(dbNotifications);
      updateNotificationCount(dbNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    }
  };

  // Initialize notifications and set up periodic refresh
  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:4000/notifications/${notificationId}`, { read: true });
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      setNotifications(updatedNotifications);
      updateNotificationCount(updatedNotifications);
      localStorage.setItem('adminUnreadNotificationCount', updatedNotifications.filter(n => !n.read).length.toString());
      window.dispatchEvent(new Event('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Function to mark notification as unread
  const markAsUnread = async (notificationId) => {
    try {
      await axios.put(`http://localhost:4000/notifications/${notificationId}`, { read: false });
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: false }
          : notification
      );
      setNotifications(updatedNotifications);
      updateNotificationCount(updatedNotifications);
      localStorage.setItem('adminUnreadNotificationCount', updatedNotifications.filter(n => !n.read).length.toString());
      window.dispatchEvent(new Event('adminNotificationUpdate'));
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to mark notification as unread');
    }
  };

  // Function to delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:4000/notifications/${notificationId}`);
      const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
      setNotifications(updatedNotifications);
      updateNotificationCount(updatedNotifications);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Function to toggle menu for specific notification
  const toggleMenu = (id) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await axios.delete('http://localhost:4000/notifications/admin/all');
      setNotifications([]);
      updateNotificationCount([]);
      setShowClearConfirm(false);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'system':
        return 'system';
      case 'trip-approval':
        return 'trip-approval';
      case 'trip-declined':
        return 'trip-declined';
      case 'package-added':
        return 'package-added';
      case 'package-updated':
        return 'package-updated';
      default:
        return '';
    }
  };

  // Function to handle view package details
  const handleViewPackageDetails = (packageTitle) => {
    // Extract the package title from the notification message and navigate
    navigate(`/ItineraryPackageView/${encodeURIComponent(packageTitle)}`);
  };

  // Function to send notifications to all users with role 'user' when a new package is added
  const notifyUsersOfNewPackage = async (packageTitle) => {
    try {
      // Fetch all users with role 'user'
      const response = await axios.get('http://localhost:4000/users?role=user');
      const users = response.data;

      // Create notifications for each user
      const notifications = users.map(user => ({
        type: 'package-added',
        message: `A new package titled "${packageTitle}" has been added!`,
        userEmail: user.email,
        recipientType: 'user',
        details: {
          title: packageTitle
        }
      }));

      // Save notifications to the database
      await Promise.all(notifications.map(notification =>
        axios.post('http://localhost:4000/notifications', notification)
      ));

      console.log('Notifications sent to all users with role user');
    } catch (error) {
      console.error('Error sending notifications to users:', error);
    }
  };

  return (
    <>
      <Header />
      <div className="main-container30">
        <div className="heading30">
          <h1 className="title-heading30">Notification Preferences</h1>
          <p className="title-para30">Stay updated with alerts for your favorite activities!</p>
        </div>
        <div className="notifications-header30">
          <h2 className="h2-30">Notifications ({unreadCount})</h2>
          {notifications.length > 0 && (
            <button 
              className="clear-all-btn30"
              onClick={() => setShowClearConfirm(true)}
            >
              Clear All
            </button>
          )}
        </div>
        <div className="notification-container30">
          {notifications.length === 0 ? (
            <div className="no-notifications30">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                className={`notification-card30 ${getNotificationTypeClass(notification.type)} ${notification.read ? 'read' : 'unread'}`} 
                key={notification.id}
              >
                <div className="notification-content30">
                  <div className="notification-header30">
                    <span className="notification-time30">
                      {format(new Date(notification.timestamp), 'MMM d, yyyy HH:mm')}
                    </span>
                    <div className="menu-container30">
                      <button 
                        className="three-dots-btn30"
                        onClick={() => toggleMenu(notification.id)}
                      >
                        ⋮
                      </button>
                      {openMenus[notification.id] && (
                        <div className="dropdown-menu30">
                          <button
                            onClick={() => {
                              deleteNotification(notification.id);
                              toggleMenu(notification.id);
                            }}
                            className="dropdown-item30"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="notification-message30">
                    {notification.type === 'trip-approval' ? (
                      <>
                        Trip <span className="bold-title30">"{notification.details?.tripName}"</span> has been approved
                      </>
                    ) : notification.type === 'trip-declined' ? (
                      <>
                        Trip <span className="bold-title30">"{notification.details?.tripName}"</span> has been declined
                      </>
                    ) : (
                      notification.message
                    )}
                  </div>
                  {notification.details && (
                    <div className="notification-details30">
                      {notification.type === 'trip-declined' ? (
                        <div className="decline-reason30">
                          <span className="reason-label30">Decline Reason: </span>
                          {notification.details.declineMessage}
                          <div className="user-info30">
                            <span className="user-label30">User: </span>
                            {notification.details.userEmail}
                          </div>
                        </div>
                      ) : notification.type === 'trip-approval' ? (
                        <div className="approval-message30">
                          <span className="approval-label30">Status: </span>
                          Trip successfully approved
                          <div className="user-info30">
                            <span className="user-label30">User: </span>
                            {notification.details.userEmail}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                  <div className="notification-footer30">
                    <div className="notification-actions-group30">
                      {notification.read ? (
                        <button
                          onClick={() => markAsUnread(notification.id)}
                          className="mark-unread-btn30"
                        >
                          Mark as unread
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mark-read-btn30"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay30">
          <div className="modal-content30 confirm-modal30">
            <h3>Clear All Notifications</h3>
            <p>Are you sure you want to clear all notifications? This action cannot be undone.</p>
            <div className="modal-actions30">
              <button 
                className="cancel-btn30"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn30"
                onClick={clearAllNotifications}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
