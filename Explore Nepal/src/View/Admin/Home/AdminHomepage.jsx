import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaSearch, FaUsers, FaUserShield, FaMale, FaFemale, FaEye, FaEdit, 
  FaTrash, FaTachometerAlt, FaHistory, FaUserPlus, FaTimes 
} from "react-icons/fa";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import "./AdminHomePage.css";

export default function AdminHomepage() {
  const [users, setUsers] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [dashboardSort, setDashboardSort] = useState("a-z");
  const [loginSort, setLoginSort] = useState("a-z");
  const [registerSort, setRegisterSort] = useState("a-z");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [loginSearch, setLoginSearch] = useState("");
  const [registerSearch, setRegisterSearch] = useState("");
  const [dashboardRole, setDashboardRole] = useState("all");
  const [loginRole, setLoginRole] = useState("all");
  const [registerRole, setRegisterRole] = useState("all");
  const [activeSort, setActiveSort] = useState("newer");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminDashboard/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const totalUsers = users.length;
  const totalAdmins = users.filter(user => user.role === "admin").length;
  const totalMales = users.filter(user => user.gender === "Male").length;
  const totalFemales = users.filter(user => user.gender === "Female").length;

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user =>
    (dashboardRole === "all" || user.role === dashboardRole) &&
    (`${user.firstName} ${user.lastName}`.toLowerCase().includes(dashboardSearch.toLowerCase()) || user.email.includes(dashboardSearch))
  );

  // Filter further based on gender if 'male' or 'female' is selected
  const genderFilteredUsers = dashboardSort === "male"
    ? filteredUsers.filter(user => user.gender === "Male")
    : dashboardSort === "female"
    ? filteredUsers.filter(user => user.gender === "Female")
    : filteredUsers;

  // Sort the filtered users based on the selected sort option (A-Z, Z-A)
  const sortedUsers = genderFilteredUsers.sort((a, b) => {
    if (dashboardSort === "a-z") {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    }
    if (dashboardSort === "z-a") {
      return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
    }
    return 0;
  });

  // Message based on sort option and filter
  const message = () => {
    if (dashboardSort === "a-z") {
      return `Users Sorted from A to Z: ${genderFilteredUsers.length}`;
    }
    if (dashboardSort === "z-a") {
      return `Users Sorted from Z to A: ${genderFilteredUsers.length}`;
    }
    if (dashboardSort === "male") {
      return `Displaying Male Users: ${genderFilteredUsers.length}`;
    }
    if (dashboardSort === "female") {
      return `Displaying Female Users: ${genderFilteredUsers.length}`;
    }
    return `Displaying Total Users: ${genderFilteredUsers.length}`;
  };

  // Sort and Message component for reuse
  const SortAndMessage = () => (
    <div className="message-sort-container35">
      <p className="message35">{message()}</p>
      <div className="sort-container35">
        <select
          className="filter-box35"
          value={dashboardSort}
          onChange={(e) => setDashboardSort(e.target.value)}
        >
          <option value="a-z">Sort A-Z</option>
          <option value="z-a">Sort Z-A</option>
          <option value="male">Sort by Male</option>
          <option value="female">Sort by Female</option>
        </select>
      </div>
    </div>
  );

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    const formatDate = (dateString) => {
      if (!dateString) return 'Not provided';
      const date = new Date(dateString);
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day} ${year}`;
    };

    return (
      <div className="modal-overlay35">
        <div className="modal-content35">
          <button className="modal-close35" onClick={onClose}>
            <FaTimes />
          </button>
          <div className="modal-header35">
            <img 
              src={user.image || "default-avatar.png"} 
              alt={`${user.firstName} ${user.lastName}`}
              className="modal-user-image35"
            />
            <h2>{user.firstName} {user.lastName}</h2>
          </div>
          <div className="user-details35">
            <div className="detail-item35">
              <span className="detail-label35">Email:</span>
              <span className="detail-value35">{user.email}</span>
            </div>
            <div className="detail-item35">
              <span className="detail-label35">Role:</span>
              <span className="detail-value35">{user.role}</span>
            </div>
            <div className="detail-item35">
              <span className="detail-label35">Gender:</span>
              <span className="detail-value35">{user.gender}</span>
            </div>
            <div className="detail-item35">
              <span className="detail-label35">Phone:</span>
              <span className="detail-value35">{user.phone || 'Not provided'}</span>
            </div>
            <div className="detail-item35">
              <span className="detail-label35">Date of Birth:</span>
              <span className="detail-value35">{formatDate(user.dateOfBirth)}</span>
            </div>
            <div className="detail-item35">
              <span className="detail-label35">Address:</span>
              <span className="detail-value35">{user.address || 'Not provided'}</span>
            </div>
            <div className="detail-item35">
              <span className="detail-label35">Joined Date:</span>
              <span className="detail-value35">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleUserUpdate = (updatedUser) => {
    setUsers(users.map(user => 
      user._id === updatedUser._id ? updatedUser : user
    ));
  };

  const EditModal = ({ user, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
    });

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.put(
          `http://localhost:4000/adminDashboard/users/${user._id}`,
          formData,
          { headers: { 'Content-Type': 'application/json' } }
        );
        onUpdate(response.data);
        onClose();
        toast.success(`${formData.firstName} ${formData.lastName}'s profile updated successfully!`);
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("Failed to update user. Please try again.");
      }
    };

    return (
      <div className="modal-overlay35">
        <div className="modal-content35 edit-modal35">
          <button className="modal-close35" onClick={onClose}>
            <FaTimes />
          </button>
          <h2>Edit User Profile</h2>
          <form onSubmit={handleSubmit} className="edit-form35">
            <div className="form-row35">
              <div className="form-group35">
                <label>First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group35">
                <label>Last Name:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row35">
              <div className="form-group35">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group35">
                <label>Phone:</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row35">
              <div className="form-group35">
                <label>Gender:</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="form-group35">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group35 full-width35">
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="submit-btn35">Update Profile</button>
          </form>
        </div>
      </div>
    );
  };

  // First, modify the sortByDate function to properly handle date sorting
  const sortByDate = (users, dateField, sortOption) => {
    let sortedUsers = [...users];
    
    switch(sortOption) {
      case "newer":
        return sortedUsers.sort((a, b) => {
          const dateA = new Date(a[dateField]);
          const dateB = new Date(b[dateField]);
          return dateB - dateA; // Newest first
        });
      case "older":
        return sortedUsers.sort((a, b) => {
          const dateA = new Date(a[dateField]);
          const dateB = new Date(b[dateField]);
          return dateA - dateB; // Oldest first
        });
      case "male":
        return sortedUsers.filter(user => user.gender === "Male").sort((a, b) => {
          return new Date(b[dateField]) - new Date(a[dateField]); // Sort by date within gender
        });
      case "female":
        return sortedUsers.filter(user => user.gender === "Female").sort((a, b) => {
          return new Date(b[dateField]) - new Date(a[dateField]); // Sort by date within gender
        });
      default:
        return sortedUsers.sort((a, b) => {
          return new Date(b[dateField]) - new Date(a[dateField]); // Default to newest first
        });
    }
  };

  // Update the getFilteredUsers function to include role filtering
  const getFilteredUsers = (users, search, sortOption, roleFilter) => {
    let filtered = users.filter(user =>
      (roleFilter === "all" || user.role === roleFilter) &&
      (`${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
      user.email.toLowerCase().includes(search.toLowerCase()))
    );

    if (sortOption === "male") {
      filtered = filtered.filter(user => user.gender === "Male");
    } else if (sortOption === "female") {
      filtered = filtered.filter(user => user.gender === "Female");
    }

    return filtered.sort((a, b) => {
      if (sortOption === "a-z") {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortOption === "z-a") {
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      }
      return 0;
    });
  };

  // Add these message functions
  const getLoginMessage = (users, sortOption) => {
    const count = users.length;
    switch(sortOption) {
      case "newer":
        return `Displaying Users by Newest Login: ${count}`;
      case "older":
        return `Displaying Users by Oldest Login: ${count}`;
      case "male":
        return `Displaying Male Users: ${count}`;
      case "female":
        return `Displaying Female Users: ${count}`;
      default:
        return `Displaying Total Users: ${count}`;
    }
  };

  const getRegistrationMessage = (users, sortOption) => {
    const count = users.length;
    switch(sortOption) {
      case "newer":
        return `Displaying Users by Newest Registration: ${count}`;
      case "older":
        return `Displaying Users by Oldest Registration: ${count}`;
      case "male":
        return `Displaying Male Users: ${count}`;
      case "female":
        return `Displaying Female Users: ${count}`;
      default:
        return `Displaying Total Users: ${count}`;
    }
  };

  // Add message function for Active Logins
  const getActiveMessage = (users, sortOption) => {
    const activeUsers = users.filter(user => isUserActive(user));
    const totalUsers = users.length;
    
    switch(sortOption) {
      case "newer":
        return `Online Users (Newest First): ${activeUsers.length} of ${totalUsers}`;
      case "older":
        return `Online Users (Oldest First): ${activeUsers.length} of ${totalUsers}`;
      case "male":
        const activeMales = activeUsers.filter(user => user.gender === "Male").length;
        return `Online Male Users: ${activeMales}`;
      case "female":
        const activeFemales = activeUsers.filter(user => user.gender === "Female").length;
        return `Online Female Users: ${activeFemales}`;
      default:
        return `Currently Online Users: ${activeUsers.length} of ${totalUsers}`;
    }
  };

  // Update the isUserActive function
  const isUserActive = (user) => {
    if (!user.lastLogin) return false;
    
    const lastLoginTime = new Date(user.lastLogin).getTime();
    const currentTime = new Date().getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    // Check if there's a more recent logout
    if (user.logoutTime) {
      const logoutTime = new Date(user.logoutTime).getTime();
      if (logoutTime > lastLoginTime) {
        return false;
      }
    }
    
    return (currentTime - lastLoginTime) <= thirtyMinutes;
  };

  // Update the user card display in the Active Logins section
  const formatDateTime = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DeleteConfirmationModal = ({ user, onClose, onConfirm }) => {
    if (!user) return null;

    return (
      <div className="modal-overlay35">
        <div className="modal-content35 delete-modal35">
          <button className="modal-close35" onClick={onClose}>
            <FaTimes />
          </button>
          <div className="delete-modal-content35">
            <FaTrash className="delete-icon35" />
            <h2>Delete Confirmation</h2>
            <p>
              Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div className="delete-modal-buttons35">
              <button className="cancel-btn35" onClick={onClose}>
                Cancel
              </button>
              <button className="confirm-delete-btn35" onClick={onConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    
    axios.delete(`http://localhost:4000/adminDashboard/users/${userToDelete._id}`)
      .then(() => {
        setUsers(users.filter(u => u._id !== userToDelete._id));
        toast.success(`${userToDelete.firstName} ${userToDelete.lastName} has been deleted successfully!`);
        setShowDeleteModal(false);
        setUserToDelete(null);
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user. Please try again.");
      });
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
      />
      <div className="main-container35">
        {/* Enhanced Sidebar Navigation */}
        <div className="side-nav35">
          <h2>Admin Dashboard</h2>
          <ul className="nav-links35">
            <li>
              <a
                href="#"
                className={activePage === "dashboard" ? "active" : ""}
                onClick={() => setActivePage("dashboard")}
              >
                <FaTachometerAlt className="nav-icon" />
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className={activePage === "recent-logins" ? "active" : ""}
                onClick={() => setActivePage("recent-logins")}
              >
                <FaHistory className="nav-icon" />
                Recently Logged In
              </a>
            </li>
            <li>
              <a
                href="#"
                className={activePage === "recent-registrations" ? "active" : ""}
                onClick={() => setActivePage("recent-registrations")}
              >
                <FaUserPlus className="nav-icon" />
                Recently Registered
              </a>
            </li>
            <li>
              <a
                href="#"
                className={activePage === "active-logins" ? "active" : ""}
                onClick={() => setActivePage("active-logins")}
              >
                <FaUsers className="nav-icon" />
                Active Logins
              </a>
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="content-area35">
          {/* Conditional Heading for Active Page */}
          <div className="heading35">
            <h1 className="title-heading35">
              {activePage === "dashboard"
                ? "Admin Dashboard"
                : activePage === "recent-registrations"
                ? "Recently Registered Users"
                : activePage === "recent-logins"
                ? "Recently Logged In Users"
                : "Active Users"}
            </h1>
          </div>

          {/* Dashboard Section */}
          {activePage === "dashboard" && (
            <>

              {/* Stats Section */}
              <div className="stats-container35">
                <div className="card35 users-card">
                  <FaUsers className="icon35" />
                  <h3>Total Users</h3>
                  <p>{totalUsers}</p>
                </div>
                <div className="card35 admins-card">
                  <FaUserShield className="icon35" />
                  <h3>Total Admins</h3>
                  <p>{totalAdmins}</p>
                </div>
                <div className="card35 males-card">
                  <FaMale className="icon35" />
                  <h3>Total Males</h3>
                  <p>{totalMales}</p>
                </div>
                <div className="card35 females-card">
                  <FaFemale className="icon35" />
                  <h3>Total Females</h3>
                  <p>{totalFemales}</p>
                </div>
              </div>

              <div className="search-container35">
                <div className="search-box35">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={dashboardSearch}
                    onChange={(e) => setDashboardSearch(e.target.value)}
                  />
                  <FaSearch className="search-icon35" style={{ color: '#3498db' }} />
                </div>
                <div className="filters-container35">
                  <select
                    className="filter-box35"
                    value={dashboardRole}
                    onChange={(e) => setDashboardRole(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              {/* Message and Sort Dropdown */}
              <SortAndMessage />

              {/* User List with Updated View Details Button */}
              <div className="user-list35">
                {getFilteredUsers(users, dashboardSearch, dashboardSort, dashboardRole).map((user) => (
                  <div key={user._id} className="user-card35">
                    <div className="icons35">
                      <FaEdit 
                        className="icon35 edit35" 
                        title="Edit" 
                        onClick={() => handleEdit(user)}
                        style={{ color: 'black', cursor: 'pointer' }} 
                      />
                      <FaTrash 
                        className="icon35 delete35" 
                        title="Delete" 
                        onClick={() => handleDelete(user)}
                        style={{ color: 'black', cursor: 'pointer' }} 
                      />
                    </div>

                    <div className="card-top35">
                      <img src={user.image || "default-avatar.png"} alt="User" className="user-image35" />
                      <div className="details35">
                        <h3>{user.firstName} {user.lastName}</h3>
                        <p><strong>Email: </strong>{user.email}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                        <p><strong>Gender:</strong> {user.gender}</p>
                      </div>
                    </div>

                    <button 
                      className="view-details-btn35" 
                      title="View Details"
                      onClick={() => handleViewDetails(user)}
                    >
                      <FaEye style={{ marginRight: '5px' }} /> View Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recent Registrations Section */}
          {activePage === "recent-registrations" && (
            <>
              <div className="search-container35">
                <div className="search-box35">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={registerSearch}
                    onChange={(e) => setRegisterSearch(e.target.value)}
                  />
                  <FaSearch className="search-icon35" style={{ color: '#3498db' }} />
                </div>
                <div className="filters-container35">
                  <select
                    className="filter-box35"
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

            

                  
              <div className="message-sort-container35">
                <p className="message35">
                  {getRegistrationMessage(
                    sortByDate(
                      users.filter(user => 
                        (registerRole === "all" || user.role === registerRole) &&
                        (`${user.firstName} ${user.lastName}`.toLowerCase().includes(registerSearch.toLowerCase()) || 
                        user.email.toLowerCase().includes(registerSearch.toLowerCase()))
                      ),
                      'createdAt',
                      registerSort
                    ),
                    registerSort
                  )}
                </p>
                <div className="sort-container35">
                  <select
                    className="filter-box35"
                    value={registerSort}
                    onChange={(e) => setRegisterSort(e.target.value)}
                  >
                    <option value="newer">Newer Date</option>
                    <option value="older">Older Date</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="recent-registrations35">
                {sortByDate(
                  users.filter(user => 
                    (registerRole === "all" || user.role === registerRole) &&
                    (`${user.firstName} ${user.lastName}`.toLowerCase().includes(registerSearch.toLowerCase()) || 
                    user.email.toLowerCase().includes(registerSearch.toLowerCase()))
                  ),
                  'createdAt',
                  registerSort
                ).map((user) => (
                  <div key={user._id} className="user-card35">
                    <div className="card-top35">
                      <img src={user.image || "default-avatar.png"} alt="User" className="user-image35" />
                      <div className="details35">
                        <h3>{user.firstName} {user.lastName}</h3>
                        <p><strong>Email: </strong>{user.email}</p>
                        <p><strong>Role: </strong>{user.role}</p>
                        <p><strong>Gender: </strong>{user.gender}</p>
                        <p><strong>Registered: </strong>
                          {new Date(user.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <button 
                      className="view-details-btn35" 
                      title="View Details"
                      onClick={() => handleViewDetails(user)}
                    >
                      <FaEye style={{ marginRight: '5px' }} /> View Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recent Logins Section */}
          {activePage === "recent-logins" && (
            <>
              <div className="search-container35">
                <div className="search-box35">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={loginSearch}
                    onChange={(e) => setLoginSearch(e.target.value)}
                  />
                  <FaSearch className="search-icon35" style={{ color: '#3498db' }} />
                </div>
                <div className="filters-container35">
                  <select
                    className="filter-box35"
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              
             


              <div className="message-sort-container35">
                <p className="message35">
                  {getLoginMessage(
                    sortByDate(
                      users.filter(user => 
                        user.lastLogin && 
                        (loginRole === "all" || user.role === loginRole) &&
                        (`${user.firstName} ${user.lastName}`.toLowerCase().includes(loginSearch.toLowerCase()) || 
                        user.email.toLowerCase().includes(loginSearch.toLowerCase()))
                      ),
                      'lastLogin',
                      loginSort
                    ),
                    loginSort
                  )}
                </p>
                <div className="sort-container35">
                  <select
                    className="filter-box35"
                    value={loginSort}
                    onChange={(e) => setLoginSort(e.target.value)}
                  >
                    <option value="newer">Newer Date</option>
                    <option value="older">Older Date</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="recent-logins35">
                {sortByDate(
                  users.filter(user => 
                    user.lastLogin && 
                    (loginRole === "all" || user.role === loginRole) &&
                    (`${user.firstName} ${user.lastName}`.toLowerCase().includes(loginSearch.toLowerCase()) || 
                    user.email.toLowerCase().includes(loginSearch.toLowerCase()))
                  ),
                  'lastLogin',
                  loginSort
                ).map((user) => (
                  <div key={user._id} className="user-card35">
                    <div className="card-top35">
                      <img src={user.image || "default-avatar.png"} alt="User" className="user-image35" />
                      <div className="details35">
                        <h3>{user.firstName} {user.lastName}</h3>
                        <p><strong>Email: </strong>{user.email}</p>
                        <p><strong>Role: </strong>{user.role}</p>
                        <p><strong>Gender: </strong>{user.gender}</p>
                        <p><strong>Last Login: </strong>
                          {new Date(user.lastLogin).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <button 
                      className="view-details-btn35" 
                      title="View Details"
                      onClick={() => handleViewDetails(user)}
                    >
                      <FaEye style={{ marginRight: '5px' }} /> View Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Active Logins Section */}
          {activePage === "active-logins" && (
            <>
              <div className="search-container35">
                <div className="search-box35">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={activeSearch}
                    onChange={(e) => setActiveSearch(e.target.value)}
                  />
                  <FaSearch className="search-icon35" style={{ color: '#3498db' }} />
                </div>
                <div className="filters-container35">
                  <select
                    className="filter-box35"
                    value={activeRole}
                    onChange={(e) => setActiveRole(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              <div className="message-sort-container35">
                <p className="message35">
                  {getActiveMessage(
                    sortByDate(
                      users.filter(user => 
                        (activeRole === "all" || user.role === activeRole) &&
                        (`${user.firstName} ${user.lastName}`.toLowerCase().includes(activeSearch.toLowerCase()) || 
                        user.email.toLowerCase().includes(activeSearch.toLowerCase()))
                      ),
                      'lastLogin',
                      activeSort
                    ),
                    activeSort
                  )}
                </p>
                <div className="sort-container35">
                  <select
                    className="filter-box35"
                    value={activeSort}
                    onChange={(e) => setActiveSort(e.target.value)}
                  >
                    <option value="newer">Newer Date</option>
                    <option value="older">Older Date</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="active-logins35">
                {sortByDate(
                  users.filter(user => 
                    (activeRole === "all" || user.role === activeRole) &&
                    (`${user.firstName} ${user.lastName}`.toLowerCase().includes(activeSearch.toLowerCase()) || 
                    user.email.toLowerCase().includes(activeSearch.toLowerCase()))
                  ),
                  'lastLogin',
                  activeSort
                ).map((user) => (
                  <div key={user._id} className="user-card35">
                    <div className="card-top35">
                      <img src={user.image || "default-avatar.png"} alt="User" className="user-image35" />
                      <div className="details35">
                        <h3>{user.firstName} {user.lastName}</h3>
                        <p><strong>Email: </strong>{user.email}</p>
                        <p><strong>Role: </strong>{user.role}</p>
                        <p><strong>Gender: </strong>{user.gender}</p>
                        
                        <div className="activity-details35" style={{
                          padding: '10px',
                          margin: '10px 0',
                          backgroundColor: 'rgba(236, 240, 241, 0.3)',
                          borderRadius: '5px'
                        }}>
                          <p><strong>Last Login: </strong>{formatDateTime(user.lastLogin)}</p>
                          
                          {user.logoutTime && (
                            <p style={{ color: '#e74c3c' }}>
                              <strong>Last Logout: </strong>{formatDateTime(user.logoutTime)}
                            </p>
                          )}

                          {user.lastLogin && user.logoutTime && new Date(user.logoutTime) > new Date(user.lastLogin) && (
                            <p style={{ color: '#7f8c8d', fontSize: '0.9em' }}>
                              <strong>Session Duration: </strong>
                              {(() => {
                                const loginTime = new Date(user.lastLogin);
                                const logoutTime = new Date(user.logoutTime);
                                const durationMinutes = Math.floor((logoutTime - loginTime) / 1000 / 60);
                                const hours = Math.floor(durationMinutes / 60);
                                const minutes = durationMinutes % 60;
                                return hours > 0 
                                  ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
                                  : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                              })()}
                            </p>
                          )}

                          <p className="active-status" style={{ 
                            color: isUserActive(user) ? '#2ecc71' : '#e74c3c',
                            fontWeight: 'bold',
                            marginTop: '5px'
                          }}>
                            <strong>Current Status: </strong>
                            {isUserActive(user) ? (
                              <>
                                <span style={{ color: '#2ecc71' }}>●</span> Online
                              </>
                            ) : (
                              <>
                                <span style={{ color: '#e74c3c' }}>●</span> Offline
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="view-details-btn35" 
                      title="View Details"
                      onClick={() => handleViewDetails(user)}
                    >
                      <FaEye style={{ marginRight: '5px' }} /> View Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Render Modal */}
      {showModal && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }} 
        />
      )}
      
      {showEditModal && (
        <EditModal 
          user={editUser} 
          onClose={() => {
            setShowEditModal(false);
            setEditUser(null);
          }}
          onUpdate={handleUserUpdate}
        />
      )}
      
      {showDeleteModal && (
        <DeleteConfirmationModal 
          user={userToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
      
      <Footer />
    </>
  );
}
