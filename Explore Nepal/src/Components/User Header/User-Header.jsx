import React, { useState, useEffect  } from "react";
import "./User-Header.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faHistory, faHeart, faLock, faExclamationTriangle, faTrash, faSignOutAlt, faBell, faGlobe, faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";


export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attractionDropdownOpen, setAttractionDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully");
      navigate("/");
    }
  };


  const handleDeleteAccount = async () => {
    const confirmationText = prompt("Type 'CONFIRM' to delete your account. This action cannot be undone.");
  
    if (confirmationText === 'CONFIRM') {
      const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    
      if (confirmDelete) {
        const userId = user.id;
        try {
          const response = await axios.delete(`http://localhost:4000/deleteAccount/${userId}`);
          toast.success(response.data.message);
          localStorage.removeItem("user");
          setUser(null);
          navigate("/");
        } catch (error) {
          console.error('Error deleting account:', error);
          toast.error('Failed to delete account. Please try again.');
        }
      }
    } else {
      toast.error("Deletion cancelled. You must type 'CONFIRM' to proceed.");
    }
  };
  
  
  

  return (
    <>
      <div className="header1000">
        <div className="welcome1000">
          <span className="welcome-text1000">Welcome!,</span>
          <span className="welcome-user1000"> {user ? user.firstName : "Guest"}</span>
        </div>
        <div className="iconcontainer1000">
          <Link to="/" className="icon1000 icon_notification1000"></Link>
          <Link to="/" className="icon1000 icon_language1000"></Link>
          <Link to="/" className="icon1000 icon_currency1000"></Link>

          <div className="icon1000 icon_user1000 dropdown1000" onClick={() => setUserDropdownOpen((prev) => !prev)}>
            <div className={`dropdown-menu1000 user-menu1000 ${userDropdownOpen ? "show" : ""}`}>
              <Link to="/"><div className="dropdown-item1000"><FontAwesomeIcon icon={faUser} style={{ color: "#007bff" }}  className="icon-gap1000" /> Profile Management</div></Link>  
              <Link to="/"><div className="dropdown-item1000"><FontAwesomeIcon icon={faHistory} style={{ color: "#28a745" }}  className="icon-gap1000" /> History</div></Link>
              <Link to="/"><div className="dropdown-item1000"><FontAwesomeIcon icon={faHeart} style={{ color: "red" }} className="icon-gap1000" /> Favorites</div></Link>
              <Link to="/"><div className="dropdown-item1000"><FontAwesomeIcon icon={faLock} style={{ color: "darkorange" }} className="icon-gap1000" /> Change Password</div></Link>
              <Link to="/"><div className="dropdown-item1000"><FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "crimson" }} className="icon-gap1000" /> Emergency Events</div></Link>
              <div className="dropdown-item1000" onClick={handleDeleteAccount}><FontAwesomeIcon icon={faTrash} style={{ color: "black" }} className="icon-gap1000" /> Delete Account</div>
              <div className="dropdown-item1000 user-info1000">
                <div className="icon_img1000">
                  <img className='img1000' src={user?.image || "/images/cnp.png"} alt="User" />
                </div>
                <div>
                  <div className="user-name1000">{user ? `${user.firstName} ${user.lastName}` : "Guest"}</div>
                  <div className="user-email1000">{user?.email || "guest@example.com"}</div>
                </div>
              </div>
              <div className="dropdown-item1000" onClick={handleLogout}><FontAwesomeIcon icon={faSignOutAlt} style={{ color: "darkred" }} className="icon-gap1000" /> Logout</div>
            </div>
          </div>




        </div>
        <div className="nav1000">
          <div className="nav-bar1000">
            <div className="logo1000"></div>
            <Link to="/Homepage" className="nav-item1000">Home</Link>
            <div className="nav-item1000 dropdown1000"
                 onMouseEnter={() => setAttractionDropdownOpen(true)}
                 onMouseLeave={() => setAttractionDropdownOpen(false)}>
              <span className="dropdown-toggle1000">Search Attraction</span>
              <div className={`dropdown-menu1000 ${attractionDropdownOpen ? "show" : ""}`}>
                <Link to="/" className="dropdown-item1000">Upload Images</Link>
                <Link to="/" className="dropdown-item1000">Search Places</Link>
              </div>
            </div>
            <div className="nav-item1000 dropdown1000"
                 onMouseEnter={() => setDropdownOpen(true)}
                 onMouseLeave={() => setDropdownOpen(false)}>
              <span className="dropdown-toggle1000">Itinerary Planner</span>
              <div className={`dropdown-menu1000 ${dropdownOpen ? "show" : ""}`}>
                <Link to="/" className="dropdown-item1000">Package</Link>
                <Link to="/" className="dropdown-item1000">Plan Your Trip</Link>
                <Link to="/" className="dropdown-item1000">View Planned Trip</Link>
                <Link to="/" className="dropdown-item1000">Aprroval Planned Trip</Link>
              </div>
            </div>
            <span to="" className="nav-item1000">Explore Map</span>
            <span  className="nav-item1000">Reviews</span>
            <span  className="nav-item1000">Event</span>
          </div>
        </div>
      </div>
    </>
  );
}
