import React, { useState, useEffect } from "react";
import "./User-Header.css";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHistory, faHeart, faLock, faExclamationTriangle, faTrash, faSignOutAlt, faBell, faGlobe, faDollarSign, faBookmark, faStar } from "@fortawesome/free-solid-svg-icons";

export default function UserHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attractionDropdownOpen, setAttractionDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [recommendationDropdownOpen, setRecommendationDropdownOpen] = useState(false);
  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(() => {
    const storedCount = localStorage.getItem('unreadNotificationCount');
    return storedCount ? parseInt(storedCount, 10) : 0;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser || !storedUser.email) return;

      const response = await axios.get(`http://localhost:4000/notifications/user/${storedUser.email}`);
      const dbNotifications = response.data;
      setNotifications(dbNotifications);
      const unreadCount = dbNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
      localStorage.setItem('unreadNotificationCount', unreadCount.toString());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initialize user and fetch initial notifications
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchNotifications();
    }
  }, []);

  // Set up notification refresh and event listeners
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(fetchNotifications, 30000);

      const handleNotificationUpdate = () => {
        fetchNotifications();
      };

      const handleTripStatusUpdate = (event) => {
        const { userEmail } = event.detail;
        if (user.email === userEmail) {
          fetchNotifications();
        }
      };

      window.addEventListener('notificationUpdate', handleNotificationUpdate);
      window.addEventListener('tripStatusUpdate', handleTripStatusUpdate);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('notificationUpdate', handleNotificationUpdate);
        window.removeEventListener('tripStatusUpdate', handleTripStatusUpdate);
      };
    }
  }, [user]);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      console.log('Stored user:', storedUser); // Debug log

      // Check for both _id and id since the stored format might vary
      const userId = storedUser?._id || storedUser?.id;
      
      if (userId) {
        const currentTime = new Date().toISOString();
        console.log('Attempting to update logout time for user:', userId); // Debug log
        console.log('Logout time:', currentTime); // Debug log

        const response = await axios.post(`http://localhost:4000/adminDashboard/logout/${userId}`, {
          logoutTime: currentTime
        });
        
        console.log('Logout response:', response.data); // Debug log

        // Only proceed with logout if the update was successful
        localStorage.removeItem("user"); 
        setUser(null);
        toast.success("Logged out successfully!", {
          duration: 3000,
          position: 'top-center',
          className: 'toast-success1000'
        });
        setShowLogoutModal(false);
        navigate("/"); 
      } else {
        console.error('No valid user ID found in localStorage:', storedUser); // Debug log
        toast.error("Error: Could not find user ID");
      }
    } catch (error) {
      console.error("Error during logout:", error.response?.data || error); // Enhanced error logging
      toast.error(`Error updating logout time: ${error.response?.data?.message || error.message}`, {
        duration: 3000,
        position: 'top-center',
        className: 'toast-error1000'
      });
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText === 'CONFIRM') {
      const userId = user.id;
      try {
        const response = await axios.delete(`http://localhost:4000/deleteAccount/${userId}`);
        toast.success(response.data.message, {
          duration: 4000,
          position: 'top-center',
          className: 'toast-success1000'
        });
        
        localStorage.removeItem("user");
        setUser(null);
        setShowDeleteModal(false);
        navigate("/");
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. Please try again.', {
          duration: 4000,
          position: 'top-center',
          className: 'toast-error1000'
        });
      }
    } else {
      toast.error("Please type 'CONFIRM' to delete your account.", {
        duration: 3000,
        position: 'top-center',
        className: 'toast-error1000'
      });
    }
  };

  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Function to check if a dropdown item is active
  const isDropdownActive = (paths) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  // Add this function to check if an icon is active
  const isIconActive = (path) => {
    return location.pathname === path;
  };

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <>
      <div className="header1000">
        <div className="welcome1000">
          <span className="welcome-text1000">Welcome!,</span>
          <span className="welcome-user1000"> {user ? user.firstName : "Guest"}</span>
        </div>
        <div className="iconcontainer1000">
          <Link to="/Notification" className={`icon1000 ${isIconActive('/Notification') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faBell} className="header-icon1000" />
            {unreadCount > 0 && (
              <span className="notification-badge1000">{unreadCount}</span>
            )}
          </Link>
          <Link to="/Language" className={`icon1000 ${isIconActive('/Language') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faGlobe} className="header-icon1000" />
          </Link>
          <Link to="/Currencies" className={`icon1000 ${isIconActive('/Currencies') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faDollarSign} className="header-icon1000" />
          </Link>
          <div className={`icon1000 icon_user1000 dropdown1000 ${userDropdownOpen ? 'active' : ''}`} onClick={() => setUserDropdownOpen((prev) => !prev)}>
            <FontAwesomeIcon icon={faUser} className="header-icon1000" />
            <div className={`dropdown-menu1000 user-menu1000 ${userDropdownOpen ? "show" : ""}`}>
              <Link to="/Profile"><div className="dropdown-item1000"><FontAwesomeIcon icon={faUser} style={{ color: "#007bff" }}  className="icon-gap" /> Profile Management</div></Link>  
              <Link to="/History"><div className="dropdown-item1000"><FontAwesomeIcon icon={faHistory} style={{ color: "#28a745" }}  className="icon-gap" /> History</div></Link>
              <Link to="/Favorites"><div className="dropdown-item1000"><FontAwesomeIcon icon={faHeart} style={{ color: "red" }} className="icon-gap" /> Favorites</div></Link>
              <Link to="/Booking-History"><div className="dropdown-item1000"><FontAwesomeIcon icon={faBookmark} style={{ color: "#6f42c1" }} className="icon-gap" /> Booking History</div></Link>
              
              <Link to="/Change-Password"><div className="dropdown-item1000"><FontAwesomeIcon icon={faLock} style={{ color: "darkorange" }} className="icon-gap" /> Change Password</div></Link>
              <Link to="/Emergency"><div className="dropdown-item1000"><FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "crimson" }} className="icon-gap" /> Emergency Events</div></Link>
              <div className="dropdown-item1000" onClick={handleDeleteAccount}><FontAwesomeIcon icon={faTrash} style={{ color: "black" }} className="icon-gap" /> Delete Account</div>
              <div className="dropdown-item1000 user-info1000">
                <div className="icon_img1000">
                  {user?.image ? (
                    <img className='img1000' src={user.image} alt="User" />
                  ) : (
                    <div className="initials-avatar1000">
                      {getInitials(user?.firstName, user?.lastName)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="user-name1000">{user ? `${user.firstName} ${user.lastName}` : "Guest"}</div>
                  <div className="user-email1000">{user?.email || "guest@example.com"}</div>
                </div>
              </div>
              <div className="dropdown-item1000" onClick={handleLogout}><FontAwesomeIcon icon={faSignOutAlt} style={{ color: "darkred" }} className="icon-gap" /> Logout</div>
            </div>
          </div>
        </div>
        <div className="nav1000">
          <div className="nav-bar1000">
            <div className="logo1000"><Link to="/Home"></Link></div>
            <Link 
              to="/Home" 
              className={`nav-item1000 ${isActive('/Home') ? 'active' : ''}`}
            >
              Home
            </Link>
            <div 
              className={`nav-item1000 dropdown1000 ${isDropdownActive(['/Upload-Images', '/Search-Attraction']) ? 'active' : ''}`}
              onMouseEnter={() => setAttractionDropdownOpen(true)}
              onMouseLeave={() => setAttractionDropdownOpen(false)}
            >
              <span className="dropdown-toggle1000">Search Attraction</span>
              <div className={`dropdown-menu1000 ${attractionDropdownOpen ? "show" : ""}`}>
                <Link to="/Upload-Images" className={`dropdown-item1000 ${isActive('/Upload-Images') ? 'active' : ''}`}>Upload Images</Link>
                <Link to="/Search-Attraction" className={`dropdown-item1000 ${isActive('/Search-Attraction') ? 'active' : ''}`}>Search Attraction</Link>
              </div>
            </div>
            <div 
              className={`nav-item1000 dropdown1000 ${isDropdownActive(['/Itinerary-Package', '/Plan-Your-Trip', '/View-Trip']) ? 'active' : ''}`}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <span className="dropdown-toggle1000">Itinerary Planner</span>
              <div className={`dropdown-menu1000 ${dropdownOpen ? "show" : ""}`}>
                <Link to="/Itinerary-Package" className={`dropdown-item1000 ${isActive('/Itinerary-Package') ? 'active' : ''}`}>Package</Link>
                <Link to="/Plan-Your-Trip" className={`dropdown-item1000 ${isActive('/Plan-Your-Trip') ? 'active' : ''}`}>Plan Your Trip</Link>
                <Link to="/View-Trip" className={`dropdown-item1000 ${isActive('/View-Trip') ? 'active' : ''}`}>View Planned Trip</Link>
              </div>
            </div>
           
            <div 
              className={`nav-item1000 dropdown1000 ${isDropdownActive(['/Location-Based', '/Event-Based']) ? 'active' : ''}`}
              onMouseEnter={() => setRecommendationDropdownOpen(true)}
              onMouseLeave={() => setRecommendationDropdownOpen(false)}
            >
              <span className="dropdown-toggle1000">Recommendation</span>
              <div className={`dropdown-menu1000 ${recommendationDropdownOpen ? "show" : ""}`}>
                <Link to="/Location-Based" className={`dropdown-item1000 ${isActive('/Location-Based') ? 'active' : ''}`}>Location-Based</Link>
                <Link to="/Event-Based" className={`dropdown-item1000 ${isActive('/Event-Based') ? 'active' : ''}`}>Event-Based</Link>
              </div>
            </div>
            <Link to="/Explore-Map" className={`nav-item1000 ${isActive('/Explore-Map') ? 'active' : ''}`}>Explore Map</Link>
            <div 
              className={`nav-item1000 dropdown1000 ${isDropdownActive(['/Review', '/Guide']) ? 'active' : ''}`}
              onMouseEnter={() => setReviewDropdownOpen(true)}
              onMouseLeave={() => setReviewDropdownOpen(false)}
            >
            
              <span className="dropdown-toggle1000">Others</span>
              <div className={`dropdown-menu1000 ${reviewDropdownOpen ? "show" : ""}`}>
                <Link to="/Guide" className={`dropdown-item1000 ${isActive('/Guide') ? 'active' : ''}`}>Guide</Link>
                <Link to="/Review" className={`dropdown-item1000 ${isActive('/Review') ? 'active' : ''}`}>Reviews</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay1000">
          <div className="modal-content1000">
            <div className="modal-header1000">Confirm Logout</div>
            <div className="modal-body1000">Are you sure you want to log out?</div>
            <div className="modal-buttons1000">
              <button 
                className="modal-button1000 cancel-button1000" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button1000 confirm-button1000" 
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay1000">
          <div className="modal-content1000">
            <div className="modal-header1000">Delete Account</div>
            <div className="modal-body1000">
              <p>This action cannot be undone. Please type 'CONFIRM' to delete your account.</p>
              <input
                type="text"
                className="delete-input1000"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'CONFIRM'"
              />
            </div>
            <div className="modal-buttons1000">
              <button 
                className="modal-button1000 cancel-button1000" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button 
                className="modal-button1000 confirm-button1000" 
                onClick={confirmDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
