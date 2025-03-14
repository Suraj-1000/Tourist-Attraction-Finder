import React, { useState, useEffect  } from "react";
import "./Admin-Header.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHistory, faHeart, faLock, faExclamationTriangle, faTrash, faSignOutAlt, faBell, faGlobe, faDollarSign } from "@fortawesome/free-solid-svg-icons";


export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attractionDropdownOpen, setAttractionDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser && storedUser._id) {
        await axios.post(`http://localhost:4000/adminDashboard/logout/${storedUser._id}`, {
          logoutTime: new Date().toISOString()
        });
      }

      localStorage.removeItem("user"); 
      setUser(null);
      toast.success("Logged out successfully!", {
        duration: 3000,
        position: 'top-center',
        className: 'toast-success10'
      });
      setShowLogoutModal(false);
      navigate("/"); 
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error updating logout time, but logged out successfully", {
        duration: 3000,
        position: 'top-center',
        className: 'toast-error10'
      });
      localStorage.removeItem("user"); 
      setUser(null);
      setShowLogoutModal(false);
      navigate("/"); 
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
  
  
  

  return (
    <>
      <div className="header10">
        <div className="welcome10">
          <span className="welcome-text10">Welcome!,</span>
          <span className="welcome-user"> {user ? user.firstName : "Guest"}</span>
        </div>
        <div className="iconcontainer10">
          <Link to="/AdminNotification" className="icon1 icon_notification10"></Link>
          <Link to="/AdminLanguage" className="icon1 icon_language10"></Link>
          <Link to="/AdminCurrencies" className="icon1 icon_currency10"></Link>

          <div className="icon1 icon_user10 dropdown10" onClick={() => setUserDropdownOpen((prev) => !prev)}>
            <div className={`dropdown-menu10 user-menu10 ${userDropdownOpen ? "show" : ""}`}>
              <Link to="/AdminProfileManage"><div className="dropdown-item10"><FontAwesomeIcon icon={faUser} style={{ color: "#007bff" }}  className="icon-gap" /> Profile Management</div></Link>  
              <Link to="/AdminHistory"><div className="dropdown-item10"><FontAwesomeIcon icon={faHistory} style={{ color: "#28a745" }}  className="icon-gap" /> History</div></Link>
              <Link to="/AdminFavorites"><div className="dropdown-item10"><FontAwesomeIcon icon={faHeart} style={{ color: "red" }} className="icon-gap" /> Favorites</div></Link>
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
            <div className="logo10"></div>
            <Link to="/AdminHome" className="nav-item10">Home</Link>
            <div className="nav-item10 dropdown10"
                 onMouseEnter={() => setAttractionDropdownOpen(true)}
                 onMouseLeave={() => setAttractionDropdownOpen(false)}>
              <span className="dropdown-toggle10">Search Attraction</span>
              <div className={`dropdown-menu10 ${attractionDropdownOpen ? "show" : ""}`}>
                <Link to="/AdminSearch" className="dropdown-item10">Upload Images</Link>
                <Link to="/AdminSearchAttraction" className="dropdown-item10">Search Places</Link>
              </div>
            </div>
            <div className="nav-item10 dropdown10"
                 onMouseEnter={() => setDropdownOpen(true)}
                 onMouseLeave={() => setDropdownOpen(false)}>
              <span className="dropdown-toggle10">Itinerary Planner</span>
              <div className={`dropdown-menu10 ${dropdownOpen ? "show" : ""}`}>
                <Link to="/ItineraryPackage" className="dropdown-item10">Package</Link>
                <Link to="/PlanYourTrip" className="dropdown-item10">Plan Your Trip</Link>
                <Link to="/ViewTrip" className="dropdown-item10">View Planned Trip</Link>
                <Link to="/AdminBookingAD" className="dropdown-item10">Aprroval Planned Trip</Link>
              </div>
            </div>
            <span to="" className="nav-item10">Explore Map</span>
            <span  className="nav-item10">Reviews</span>
            <span  className="nav-item10">Event</span>
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
