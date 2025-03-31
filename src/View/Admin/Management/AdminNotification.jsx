import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socketService from "../../../services/socketService";
import "./AdminNotification.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminNotificationPage() {
  const [notifications, setNotifications] = useState(() => {
    // Load notifications from localStorage on initial render
    const savedNotifications = localStorage.getItem('adminNotifications');
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [openMenus, setOpenMenus] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initialize socket connection
  useEffect(() => {
    const socket = socketService.getSocket();
    let isConnected = false;

    const handleConnect = () => {
      console.log('Connected to notification server');
      if (!isConnected) {
        isConnected = true;
        setConnectionStatus('connected');
        socket.emit('joinAdminRoom');
      }
    };

    const handleDisconnect = (reason) => {
      console.log('Disconnected:', reason);
      setConnectionStatus('disconnected');
      isConnected = false;
    };

    const handleConnectError = (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      isConnected = false;
    };

    const handleReconnectAttempt = (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      setReconnectAttempts(attempt);
    };

    const handleReconnect = (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
      if (!isConnected) {
        isConnected = true;
        setConnectionStatus('connected');
        socket.emit('joinAdminRoom');
      }
      setReconnectAttempts(0);
    };

    const handleNotification = (notification) => {
      if (notification.type === 'system' && notification.message === 'Connected to notification system') {
        return;
      }

      console.log('Received notification:', notification);
      setNotifications(prev => {
        // Check if notification already exists by checking id or matching trip name and status
        const exists = prev.some(n => {
          // Check if IDs match
          if (n.id === notification.id) return true;
          
          // Extract trip name and status from message for comparison
          const existingMatch = n.message.match(/Trip "([^"]+)" has been (approved|declined)/);
          const newMatch = notification.message.match(/Trip "([^"]+)" has been (approved|declined)/);
          
          if (existingMatch && newMatch) {
            const [, existingTrip, existingStatus] = existingMatch;
            const [, newTrip, newStatus] = newMatch;
            
            // If same trip name and status within 5 seconds, consider it a duplicate
            return existingTrip === newTrip && 
                   existingStatus === newStatus && 
                   Math.abs(new Date(n.timestamp) - new Date(notification.timestamp)) < 5000;
          }
          
          return false;
        });
        
        if (exists) {
          console.log('Duplicate notification detected, skipping...');
          return prev;
        }
        
        // Add new notification with parsed date
        const newNotification = {
          ...notification,
          timestamp: new Date(notification.timestamp).toISOString(),
          read: false
        };
        
        const updatedNotifications = [newNotification, ...prev];
        // Keep only the last 50 notifications to prevent localStorage from getting too large
        const trimmedNotifications = updatedNotifications.slice(0, 50);
        
        // Update localStorage
        localStorage.setItem('adminNotifications', JSON.stringify(trimmedNotifications));
        return trimmedNotifications;
      });
    };

    const handleNotificationDelete = (notificationId) => {
      console.log('Received notificationDelete event:', notificationId);
      setNotifications(prev => {
        const updatedNotifications = prev.filter(n => n.id !== notificationId);
        localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
        return updatedNotifications;
      });
    };

    // Load notifications from localStorage on mount
    const savedNotifications = localStorage.getItem('adminNotifications');
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications);
      setNotifications(parsedNotifications);
    }

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('notification', handleNotification);
    socket.on('notificationDelete', handleNotificationDelete);

    // Cleanup function
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('notification', handleNotification);
      socket.off('notificationDelete', handleNotificationDelete);
    };
  }, []);

  // Function to mark notification as read
  const markAsRead = (notificationId) => {
    console.log('Marking notification as read:', notificationId);
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));

    // Emit notification read event with the notification ID
    const socket = socketService.getSocket();
    socket.emit('notificationRead', notificationId);
  };

  // Function to mark notification as unread
  const markAsUnread = (notificationId) => {
    console.log('Marking notification as unread:', notificationId);
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: false }
        : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));

    // Emit notification unread event
    const socket = socketService.getSocket();
    socket.emit('notificationUnread', notificationId);
  };

  // Function to delete notification
  const deleteNotification = (notificationId) => {
    console.log('Deleting notification:', notificationId);
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
    
    // Emit notification delete event
    const socket = socketService.getSocket();
    socket.emit('notificationDelete', notificationId);
  };

  // Function to toggle menu for specific notification
  const toggleMenu = (id) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setShowClearConfirm(false);
    
    // Emit clear all event
    const socket = socketService.getSocket();
    socket.emit('clearAllNotifications');
    
    // Update localStorage
    localStorage.setItem('adminNotifications', JSON.stringify([]));
    
    toast.success('All notifications cleared', {
      position: "top-right",
      autoClose: 3000,
    });
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

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return '';
      case 'disconnected':
        return 'disconnected';
      case 'error':
        return 'error';
      default:
        return '';
    }
  };

  // Function to handle view package details
  const handleViewPackageDetails = (packageTitle) => {
    // Extract the package title from the notification message and navigate
    navigate(`/ItineraryPackageView/${encodeURIComponent(packageTitle)}`);
  };

  return (
    <>
      <Header />
      <div className="main-container30">
        <div className="heading30">
          <h1 className="title-heading30">Notification Preferences</h1>
          <p className="title-para30">Stay updated with alerts for your favorite activities!</p>
          <div className={`connection-status ${getConnectionStatusClass()}`}>
            {connectionStatus === 'connected' && 'Connected to notification server'}
            {connectionStatus === 'disconnected' && `Disconnected from server${reconnectAttempts > 0 ? ` (Reconnecting... Attempt ${reconnectAttempts})` : ''}`}
            {connectionStatus === 'error' && 'Error connecting to notification server'}
          </div>
        </div>
        <div className="notifications-header30">
          <h2 className="h2-30">Notifications ({notifications.length})</h2>
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
                    {notification.type === 'package-added' || notification.type === 'package-updated' ? (
                      <>
                        New package <span className="bold-title30">"{notification.message.match(/"([^"]+)"/)[1]}"</span> has been added
                      </>
                    ) : notification.type === 'trip-approval' ? (
                      <>
                        Trip <span className="bold-title30">"{notification.message.match(/"([^"]+)"/)[1]}"</span> has been approved
                      </>
                    ) : notification.type === 'trip-declined' ? (
                      <>
                        Trip <span className="bold-title30">"{notification.message.match(/"([^"]+)"/)[1]}"</span> has been declined
                      </>
                    ) : (
                      notification.message
                    )}
                  </div>
                  {notification.details && (
                    <div className="notification-details30">
                      {notification.type === 'package-added' || notification.type === 'package-updated' ? (
                        <div className="package-details30">
                          <span className="package-detail-item30">
                            <span className="package-name30">Trip Name: </span>
                            {notification.details.split('Category:')[0].trim()}
                          </span>
                          <span className="package-detail-item30">
                            Category: {notification.details.split('Category:')[1].split('Price:')[0].trim()}
                          </span>
                          <span className="package-detail-item30">
                            Price: {notification.details.split('Price:')[1].split('Duration:')[0].trim()}
                          </span>
                          <span className="package-detail-item30">
                            Duration: {notification.details.split('Duration:')[1].trim()}
                          </span>
                        </div>
                      ) : notification.type === 'trip-declined' ? (
                        <div className="decline-reason30">
                          <span className="reason-label30">Decline Reason: </span>
                          {notification.details}
                        </div>
                      ) : notification.type === 'trip-approval' ? (
                        <div className="approval-message30">
                          <span className="approval-label30">Status: </span>
                          {notification.details.includes('undefined') ? 'Trip successfully approved' : notification.details}
                        </div>
                      ) : (
                        notification.details
                      )}
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
                      {(notification.type === 'package-added' || notification.type === 'package-updated') && (
                        <button
                          onClick={() => handleViewPackageDetails(notification.message.match(/"([^"]+)"/)[1])}
                          className="view-details-btn30"
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
