import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaCompass, FaCalendarAlt, FaCog, FaSignOutAlt, FaChevronDown, FaKey, FaTrash, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showToursDropdown, setShowToursDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          // For guides, fetch their complete profile to get verification status
          if (user.role === 'guide') {
            const token = localStorage.getItem("token");
            if (token) {
              const response = await axios.get(
                "http://localhost:4000/adminUpdateProfile/getGuideProfile",
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (response.status === 200) {
                setUserProfile(response.data);
              }
            } else {
              setUserProfile(user);
            }
          } else {
            setUserProfile(user);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Fall back to local storage data if API call fails
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          setUserProfile(user);
        }
      }
    };
    
    fetchUserProfile();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText === 'CONFIRM') {
      try {
        const userId = userProfile._id;
        const response = await axios.delete(`http://localhost:4000/deleteAccount/${userId}`);
        toast.success(response.data.message);
        localStorage.removeItem("user");
        setUserProfile(null);
        setShowDeleteModal(false);
        navigate("/");
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. Please try again.');
      }
    } else {
      toast.error("Please type 'CONFIRM' to delete your account.");
    }
  };

  const confirmLogout = async () => {
    try {
      const userId = userProfile?._id || userProfile?.id;
      if (userId) {
        const currentTime = new Date().toISOString();
        await axios.post(`http://localhost:4000/adminDashboard/logout/${userId}`, {
          logoutTime: currentTime
        });
        
        localStorage.removeItem("user");
        toast.success("Logged out successfully!", {
          duration: 3000,
          position: 'top-center',
          className: 'toast-success1000'
        });
        setShowLogoutModal(false);
        navigate("/");
      } else {
        setShowLogoutModal(false);
        localStorage.removeItem("user");
        setUserProfile(null);
        navigate("/");
        toast.error("Session expired. Please log in again.", {
          duration: 3000,
          position: 'top-center',
          className: 'toast-error1000'
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(`Error updating logout time: ${error.response?.data?.message || error.message}`, {
        duration: 3000,
        position: 'top-center',
        className: 'toast-error1000'
      });
    }
  };

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const menuItems = [
    { path: '/guide/dashboard', name: 'Dashboard', icon: <MdDashboard /> },
    { path: '/guide/profile', name: 'Profile', icon: <FaUser /> },
    { path: '/guide/bookings', name: 'Bookings', icon: <FaCalendarAlt /> },
    {
      name: 'My Tours',
      icon: <FaCompass />,
      isDropdown: true,
      items: [
        { path: '/guide/my-tours', name: 'Trip Approval', icon: <FaCheckCircle /> },
        { path: '/guide/calendar', name: 'Calendar View', icon: <FaCalendarAlt /> },
      ]
    },
    {
      name: 'Settings',
      icon: <FaCog />,
      isDropdown: true,
      items: [
        { path: '/guide/settings/password', name: 'Change Password', icon: <FaKey /> },
        { path: '/guide/settings/delete', name: 'Delete Account', icon: <FaTrash /> },
      ]
    },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" />
          <h2>Guide Portal</h2>
         
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            item.isDropdown ? (
              <div key={index} className="nav-dropdown">
                <button
                  className={`nav-item ${location.pathname.includes(item.name.toLowerCase()) ? 'active' : ''}`}
                  onClick={() => {
                    if (item.name === 'My Tours') setShowToursDropdown(!showToursDropdown);
                    if (item.name === 'Settings') setShowSettingsDropdown(!showSettingsDropdown);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                  <FaChevronDown className={`dropdown-arrow ${
                    (item.name === 'My Tours' && showToursDropdown) ||
                    (item.name === 'Settings' && showSettingsDropdown) ? 'rotated' : ''
                  }`} />
                </button>
                <div className={`dropdown-content ${
                  (item.name === 'My Tours' && showToursDropdown) ||
                  (item.name === 'Settings' && showSettingsDropdown) ? 'show' : ''
                }`}>
                  {item.items.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={subItem.path}
                      className={`nav-item sub-item ${location.pathname === subItem.path ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="nav-icon">{subItem.icon}</span>
                      <span className="nav-text">{subItem.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
              </Link>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          {userProfile && (
            <div className="user-profile">
              <div className="user-avatar">
                {userProfile.image ? (
                  <img src={userProfile.image} alt="Profile" className="profile-img" />
                ) : (
                  <div className="initials-avatar">
                    {getInitials(userProfile.firstName, userProfile.lastName)}
                  </div>
                )}
              </div>
              <div className="user-info">
                <h3>{`${userProfile.firstName} ${userProfile.lastName}`}</h3>
                <p>{userProfile.email}</p>
                <div className={`verification-badge ${
                  userProfile.guideProfile?.verificationStatus === 'approved' ? 'badge-verified' :
                  userProfile.guideProfile?.verificationStatus === 'rejected' ? 'badge-rejected' :
                  'badge-pending'
                }`}>
                  {userProfile.guideProfile?.verificationStatus === 'approved' ? 'Verified' : 
                   userProfile.guideProfile?.verificationStatus || 'Pending'}
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon"><FaSignOutAlt /></span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </div>

      <button className="hamburger-btn" onClick={toggleSidebar}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

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
};

export default Sidebar; 
