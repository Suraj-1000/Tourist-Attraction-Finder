import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Notification.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast configuration
const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    className: "toast-message"
};

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [openMenus, setOpenMenus] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Function to update notification count
  const updateNotificationCount = (notifications) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setUnreadCount(unreadCount);
    localStorage.setItem('unreadNotificationCount', unreadCount.toString());
    window.dispatchEvent(new Event('notificationUpdate'));
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      if (!user || !user.email) {
        toast.error('Please log in to view notifications', toastConfig);
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:4000/notifications/user/${user.email}`);
      const dbNotifications = response.data;
      setNotifications(dbNotifications);
      updateNotificationCount(dbNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications', toastConfig);
    }
  };

  // Update notification read status in database
  const updateNotificationStatus = async (notificationId, isRead) => {
    try {
      await axios.put(`http://localhost:4000/notifications/${notificationId}`, {
        read: isRead
      });
      console.log(`Notification ${notificationId} marked as ${isRead ? 'read' : 'unread'}`);
      fetchNotifications(); // Refresh notifications after update
    } catch (error) {
      console.error('Error updating notification status:', error);
      toast.error('Failed to update notification status', toastConfig);
    }
  };

  // Delete notification from database
  const deleteNotificationFromDB = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:4000/notifications/${notificationId}`);
      console.log(`Notification ${notificationId} deleted`);
      fetchNotifications(); // Refresh notifications after deletion
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification', toastConfig);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('No user found in localStorage');
      return;
    }

    // Initial fetch of notifications
    fetchNotifications();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Update notification count whenever notifications change
  useEffect(() => {
    updateNotificationCount(notifications);
  }, [notifications]);

  const markAsRead = async (notificationId) => {
    try {
      await updateNotificationStatus(notificationId, true);
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
      updateNotificationCount(updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification status', toastConfig);
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      await updateNotificationStatus(notificationId, false);
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: false } : notif
    );
    setNotifications(updatedNotifications);
      updateNotificationCount(updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to update notification status', toastConfig);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteNotificationFromDB(notificationId);
      // Update local state immediately for better UX
      setNotifications(prevNotifications =>
        prevNotifications.filter(notif => notif.id !== notificationId)
      );
      // Update unread count if the deleted notification was unread
      if (user?.email) {
        const response = await axios.get(`http://localhost:4000/notifications/user/${user.email}`);
        const unreadCount = response.data.filter(n => !n.read).length;
        // Update header's notification count through localStorage
        localStorage.setItem('unreadNotificationCount', unreadCount.toString());
        window.dispatchEvent(new Event('notificationUpdate'));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification', toastConfig);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(`http://localhost:4000/notifications/user/${user.email}/all`);
      setNotifications([]);
      setShowClearConfirm(false);
      updateNotificationCount([]);
      toast.success('All notifications cleared', toastConfig);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications', toastConfig);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
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

  const handleViewPackageDetails = (packageTitle) => {
    navigate(`/ItineraryPackageView/${encodeURIComponent(packageTitle)}`);
  };

  const renderNotificationDetails = (notification) => {
    if (!notification.details) return null;
    
    const { tripName, status, declineMessage } = notification.details;
    
    return (
      <div className="notification-details61">
        {status === 'approved' && (
          <div className="status-badge approved">Approved</div>
        )}
        {status === 'declined' && (
          <>
            <div className="status-badge declined">Declined</div>
            {declineMessage && (
              <div className="decline-message">
                Reason: {declineMessage}
              </div>
            )}
          </>
        )}
      </div>
    );
  };



  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container"
      />
      <div className="main-container61">
        <div className="heading61">
          <h1 className="title-heading61">Notifications</h1>
          <p className="title-para61">Stay updated with your trip status and new packages!</p>
        </div>

        <div className="notifications-header61">
          <h2 className="h2-61">Notifications ({unreadCount})</h2>
          {notifications.length > 0 && (
            <button 
              className="clear-all-btn61"
              onClick={() => setShowClearConfirm(true)}
            >
              Clear All
            </button>
          )}
        </div>

        <div className="notification-container61">
          {notifications.length === 0 ? (
            <div className="no-notifications61">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                className={`notification-card61 ${getNotificationTypeClass(notification.type)} ${notification.read ? 'read' : 'unread'}`} 
                key={notification.id}
              >
                <div className="notification-content61">
                  <div className="notification-header61">
                    <span className="notification-time61">
                      {format(new Date(notification.timestamp), 'MMM d, yyyy HH:mm')}
                    </span>
                    <div className="menu-container61">
                      <button 
                        className="three-dots-btn61"
                        onClick={() => toggleMenu(notification.id)}
                      >
                        ⋮
                      </button>
                      {openMenus[notification.id] && (
                        <div className="dropdown-menu61">
                          <button
                            onClick={() => {
                              deleteNotification(notification.id);
                              toggleMenu(notification.id);
                            }}
                            className="dropdown-item61"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="notification-message61">
                    {notification.type === 'trip-approval' ? (
                      <>
                        Your trip <span className="bold-title61">"{notification.details?.tripName}"</span> has been approved!
                      </>
                    ) : notification.type === 'trip-declined' ? (
                      <>
                        Your trip <span className="bold-title61">"{notification.details?.tripName}"</span> has been declined.
                      </>
                    ) : notification.type === 'package-added' ? (
                      <>
                        A new travel package <span className="bold-title61">"{notification.details?.title}"</span> has been added!
                      </>
                    ) : (
                      notification.message
                    )}
                  </div>

                  {notification.details && (
                    <div className="notification-details61">
                      {notification.type === 'trip-declined' ? (
                        <div className="decline-reason61">
                          <div className="status-info61">
                            <span className="status-label61">Status: </span>
                            <span className="status-value61 declined">Declined</span>
                          </div>
                          {notification.details.declineMessage && (
                            <div className="decline-message61">
                              <span className="reason-label61">Reason: </span>
                              {notification.details.declineMessage}
                            </div>
                          )}
                        </div>
                      ) : notification.type === 'trip-approval' ? (
                        <div className="approval-message61">
                          <div className="status-info61">
                            <span className="status-label61">Status: </span>
                            <span className="status-value61 approved">Approved</span>
                          </div>
                        </div>
                      ) : notification.type === 'package-added' ? (
                        <div className="package-details61">
                          <div className="package-info61">
                            <div className="package-image61">
                              <img src={notification.details.image} alt={notification.details.title} />
                            </div>
                            <div className="package-content61">
                              <div className="info-row61">
                                <span className="info-label61">Category:</span>
                                <span className="info-value61">{notification.details.category}</span>
                              </div>
                              <div className="info-row61">
                                <span className="info-label61">Duration:</span>
                                <span className="info-value61">{notification.details.duration}</span>
                              </div>
                              <div className="info-row61">
                                <span className="info-label61">Trip Type:</span>
                                <span className="info-value61">{notification.details.tripType}</span>
                              </div>
                              <div className="info-row61">
                                <span className="info-label61">Price:</span>
                                <span className="info-value61">{notification.details.price}</span>
                              </div>
                              <div className="info-row61">
                                <span className="info-label61">Group Size:</span>
                                <span className="info-value61">{notification.details.groupSize}</span>
                              </div>
                              <div className="info-row61">
                                <span className="info-label61">Difficulty:</span>
                                <span className="info-value61">{notification.details.difficulty}</span>
                              </div>
                            </div>
                          </div>
                          <div className="package-overview61">
                            <h4>Overview</h4>
                            <p>{notification.details.overview}</p>
                            <h4>Highlights</h4>
                            <p>{notification.details.highlight}</p>
                          </div>
                          <button
                            onClick={() => handleViewPackageDetails(notification.details.title)}
                            className="view-package-btn61"
                          >
                            View Package Details
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="notification-footer61">
                    <div className="notification-actions-group61">
                      {notification.read ? (
                        <button
                          onClick={() => markAsUnread(notification.id)}
                          className="mark-unread-btn61"
                        >
                          Mark as unread
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mark-read-btn61"
                        >
                          Mark as read
                        </button>
                      )}
                      {(notification.type === 'package-added' || notification.type === 'package-updated') && (
                        <button
                          onClick={() => handleViewPackageDetails(notification.details?.title)}
                          className="view-details-btn61"
                        >
                          View Package
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
        <div className="modal-overlay61">
          <div className="modal-content61 confirm-modal61">
            <h3>Clear All Notifications</h3>
            <p>Are you sure you want to clear all notifications? This action cannot be undone.</p>
            <div className="modal-actions61">
              <button 
                className="cancel-btn61"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn61"
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
