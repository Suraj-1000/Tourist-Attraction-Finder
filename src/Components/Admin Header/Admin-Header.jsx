import React, { useState, useEffect } from "react";
import "./Admin-Header.css";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHistory, faHeart, faLock, faExclamationTriangle, faTrash, faSignOutAlt, faBell, faGlobe, faDollarSign, faBookmark } from "@fortawesome/free-solid-svg-icons";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attractionDropdownOpen, setAttractionDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [recommendationDropdownOpen, setRecommendationDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(() => {
    const storedCount = localStorage.getItem('adminUnreadNotificationCount');
    return storedCount ? parseInt(storedCount, 10) : 0;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Function to update unread count
  const updateUnreadCount = (notifications) => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/notifications/admin`);
      const dbNotifications = response.data;
      setNotifications(dbNotifications);
      updateUnreadCount(dbNotifications);
      localStorage.setItem('adminUnreadNotificationCount', dbNotifications.filter(n => !n.read).length.toString());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchNotifications();
    }

    // Set up notification refresh and event listeners
    const intervalId = setInterval(fetchNotifications, 30000);

    const handleNotificationUpdate = () => {
      const storedCount = localStorage.getItem('adminUnreadNotificationCount');
      if (storedCount !== null) {
        setUnreadCount(parseInt(storedCount, 10));
      }
    };

    window.addEventListener('adminNotificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('adminNotificationUpdate', handleNotificationUpdate);
    };
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      console.log('Stored user:', storedUser);

      const userId = storedUser?._id || storedUser?.id;
      
      if (userId) {
        const currentTime = new Date().toISOString();
        console.log('Attempting to update logout time for user:', userId);
        console.log('Logout time:', currentTime);

        const response = await axios.post(`http://localhost:4000/adminDashboard/logout/${userId}`, {
          logoutTime: currentTime
        });
        
        console.log('Logout response:', response.data);

        localStorage.removeItem("user"); 
        setUser(null);
        toast.success("Logged out successfully!", {
          duration: 3000,
          position: 'top-center',
          className: 'toast-success10'
        });
        setShowLogoutModal(false);
        navigate("/"); 
      } else {
        console.error('No valid user ID found in localStorage:', storedUser);
        toast.error("Error: Could not find user ID");
      }
    } catch (error) {
      console.error("Error during logout:", error.response?.data || error);
      toast.error(`Error updating logout time: ${error.response?.data?.message || error.message}`, {
        duration: 3000,
        position: 'top-center',
        className: 'toast-error10'
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
          className: 'toast-success10'
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
          className: 'toast-error10'
        });
      }
    } else {
      toast.error("Please type 'CONFIRM' to delete your account.", {
        duration: 3000,
        position: 'top-center',
        className: 'toast-error10'
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

  // Function to check if an icon is active
  const isIconActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className="header10">
        <div className="welcome10">
          <span className="welcome-text10">Welcome Admin!,</span>
          <span className="welcome-user"> {user ? user.firstName : "Guest"}</span>
        </div>
        <div className="iconcontainer10">
          <Link to="/AdminNotification" className={`icon1 ${isIconActive('/AdminNotification') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faBell} className="header-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge10">{unreadCount}</span>
            )}
          </Link>
          <Link to="/AdminLanguage" className={`icon1 ${isIconActive('/AdminLanguage') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faGlobe} className="header-icon" />
          </Link>
          <Link to="/AdminCurrencies" className={`icon1 ${isIconActive('/AdminCurrencies') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faDollarSign} className="header-icon" />
          </Link>
          <div className={`icon1 icon_user10 dropdown10 ${userDropdownOpen ? 'active' : ''}`} onClick={() => setUserDropdownOpen((prev) => !prev)}>
              <FontAwesomeIcon icon={faUser} className="header-icon" />
            <div className={`dropdown-menu10 user-menu10 ${userDropdownOpen ? "show" : ""}`}>
              <Link to="/AdminProfileManage"><div className="dropdown-item10"><FontAwesomeIcon icon={faUser} style={{ color: "#007bff" }}  className="icon-gap" /> Profile-Management</div></Link>  
              <Link to="/AdminHistory"><div className="dropdown-item10"><FontAwesomeIcon icon={faHistory} style={{ color: "#28a745" }}  className="icon-gap" /> History</div></Link>
              <Link to="/AdminFavorites"><div className="dropdown-item10"><FontAwesomeIcon icon={faHeart} style={{ color: "red" }} className="icon-gap" /> Favorites</div></Link>
              <Link to="/AdminBookingHistory"><div className="dropdown-item10"><FontAwesomeIcon icon={faBookmark} style={{ color: "#6f42c1" }} className="icon-gap" /> Booking History</div></Link>
              <Link to="/AdminChangePass"><div className="dropdown-item10"><FontAwesomeIcon icon={faLock} style={{ color: "darkorange" }} className="icon-gap" /> Change Password</div></Link>
              <Link to="/AdminEmergency"><div className="dropdown-item10"><FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "crimson" }} className="icon-gap" /> Emergency Events</div></Link>
              <div className="dropdown-item10" onClick={handleDeleteAccount}><FontAwesomeIcon icon={faTrash} style={{ color: "black" }} className="icon-gap" /> Delete Account</div>
              <div className="dropdown-item10 user-info10">
                <div className="icon_img10">
                  <img className='img10' src={user?.image || "/images/cnp.png"} alt="User" />
                </div>
                <div>
                  <div className="user-name10">{user ? `${user.firstName} ${user.lastName}` : "Guest"}</div>
                  <div className="user-email10">{user?.email || "guest@example.com"}</div>
                </div>
              </div>
              <div className="dropdown-item10" onClick={handleLogout}><FontAwesomeIcon icon={faSignOutAlt} style={{ color: "darkred" }} className="icon-gap" /> Logout</div>
            </div>
          </div>
        </div>
        <div className="nav10">
          <div className="nav-bar10">
            <div className="logo10"><Link to="/AdminHome"></Link></div>
            <Link 
              to="/AdminHome" 
              className={`nav-item10 ${isActive('/AdminHome') ? 'active' : ''}`}
            >
              Home
            </Link>
            <div 
              className={`nav-item10 dropdown10 ${isDropdownActive(['/AdminUpload-Images', '/AdminSearch-Attraction']) ? 'active' : ''}`}
              onMouseEnter={() => setAttractionDropdownOpen(true)}
              onMouseLeave={() => setAttractionDropdownOpen(false)}
            >
              <span className="dropdown-toggle10">Search Attraction</span>
              <div className={`dropdown-menu10 ${attractionDropdownOpen ? "show" : ""}`}>
                <Link to="/AdminSearch" className={`dropdown-item10 ${isActive('/AdminUpload-Images') ? 'active' : ''}`}>Upload Images</Link>
                <Link to="/AdminSearchAttraction" className={`dropdown-item10 ${isActive('/AdminSearch-Attraction') ? 'active' : ''}`}>Search Attraction</Link>
              </div>
            </div>
            <div 
              className={`nav-item10 dropdown10 ${isDropdownActive(['/ItineraryPackage', '/AdminBookingAD']) ? 'active' : ''}`}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <span className="dropdown-toggle10">Itinerary Planner</span>
              <div className={`dropdown-menu10 ${dropdownOpen ? "show" : ""}`}>
                <Link to="/ItineraryPackage" className={`dropdown-item10 ${isActive('/ItineraryPackage') ? 'active' : ''}`}>Package</Link>
                <Link to="/AdminBookingAD" className={`dropdown-item10 ${isActive('/AdminBookingAD') ? 'active' : ''}`}>Booking Approval</Link>
              </div>
            </div>
           
            <div 
              className={`nav-item10 dropdown10 ${isDropdownActive(['/AdminLocation-Based', '/AdminEvent-Based']) ? 'active' : ''}`}
              onMouseEnter={() => setRecommendationDropdownOpen(true)}
              onMouseLeave={() => setRecommendationDropdownOpen(false)}
            >
              <span className="dropdown-toggle10">Recommendation</span>
              <div className={`dropdown-menu10 ${recommendationDropdownOpen ? "show" : ""}`}>
                <Link to="/AdminLocation" className={`dropdown-item10 ${isActive('/AdminLocation-Based') ? 'active' : ''}`}>Location-Based</Link>
                <Link to="/AdminEvent" className={`dropdown-item10 ${isActive('/AdminEvent-Based') ? 'active' : ''}`}>Event-Based</Link>
              </div>
            </div>
            <Link to="/AdminMap" className={`nav-item10 ${isActive('/AdminMap') ? 'active' : ''}`}>Explore Map</Link>
            <Link to="/AdminReview" className={`nav-item10 ${isActive('/AdminReview') ? 'active' : ''}`}>Review</Link>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay10">
          <div className="modal-content10">
            <div className="modal-header10">Confirm Logout</div>
            <div className="modal-body10">Are you sure you want to log out?</div>
            <div className="modal-buttons10">
              <button 
                className="modal-button10 cancel-button10" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button10 confirm-button10" 
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay10">
          <div className="modal-content10">
            <div className="modal-header10">Delete Account</div>
            <div className="modal-body10">
              <p>This action cannot be undone. Please type 'CONFIRM' to delete your account.</p>
              <input
                type="text"
                className="delete-input10"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'CONFIRM'"
              />
            </div>
            <div className="modal-buttons10">
              <button 
                className="modal-button10 cancel-button10" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button 
                className="modal-button10 confirm-button10" 
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
