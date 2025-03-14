import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import "./AdminProfileManage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { toast } from "react-hot-toast";

export default function AdminProfileManagePage() {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    role: '',
    image: null
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [userImage, setUserImage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not logged in.");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:4000/adminUpdateProfile/getProfile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const userData = response.data;
        localStorage.setItem("user", JSON.stringify(userData));
        setUser({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          gender: userData.gender || "",
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split("T")[0] : "",
          address: userData.address || "",
          role: userData.role || "",
          image: userData.image || null
        });
        setUserImage(userData.image || "");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details.");
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserImage(imageUrl);
      setUser({ ...user, image: file });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const formData = new FormData();
      
      // Explicitly append each field, ensuring address is included
      formData.append('firstName', user.firstName || '');
      formData.append('lastName', user.lastName || '');
      formData.append('email', user.email || '');
      formData.append('phone', user.phone || '');
      formData.append('gender', user.gender || '');
      formData.append('dateOfBirth', user.dateOfBirth || '');
      formData.append('address', user.address || ''); // Always include address, even if empty

      if (user.image instanceof File) {
        formData.append('image', user.image);
      }

      // Log the form data for debugging
      console.log('Form data being sent:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:4000/adminUpdateProfile/updateProfile',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        console.log('Server response:', response.data); // Add this log
        toast.success('Profile updated successfully');
        setIsEditing(false);
        await fetchUserDetails(); // Refresh the data
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleDisplay = (role) => {
    return role === 'admin' ? 'Administrator' : 'Regular User';
  };

  if (loading) return <div className="loading26">Loading User details...</div>;

  return (
    <>
      <Header />
      <div className="main-container26">
        <div className="heading26">
          <h1 className="title-heading26">Profile Management</h1>
        </div>

        {!isEditing ? (
          // View Mode
          <div className="profile-view26">
            <div className="profile-header26">
              <button className="edit-profile-btn26" onClick={() => setIsEditing(true)}>
                <FaEdit size={20} />
              </button>
              <div className="profile-image-container26">
                <img
                  src={userImage || "default-avatar.png"}
                  alt="Profile"
                  className="profile-image26"
                />
              </div>
              <h2 className="profile-name26">{`${user.firstName} ${user.lastName}`}</h2>
              <div className="profile-role26">
                {getRoleDisplay(user.role)}
              </div>
            </div>

            <div className="profile-details26">
              <div className="details-grid26">
                <div className="detail-item26">
                  <div className="detail-label26">Email</div>
                  <div className="detail-value26">{user.email}</div>
                </div>
                <div className="detail-item26">
                  <div className="detail-label26">Phone</div>
                  <div className="detail-value26">{user.phone || "Not provided"}</div>
                </div>
                <div className="detail-item26">
                  <div className="detail-label26">Gender</div>
                  <div className="detail-value26">{user.gender || "Not provided"}</div>
                </div>
                <div className="detail-item26">
                  <div className="detail-label26">Date of Birth</div>
                  <div className="detail-value26">
                    {user.dateOfBirth || "Not provided"}
                  </div>
                </div>
                <div className="detail-item26" style={{ gridColumn: "1 / -1" }}>
                  <div className="detail-label26">Address</div>
                  <div className="detail-value26">{user.address || "Not provided"}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="form-card26">
            <h3 className="form-card-heading26">Edit Your Profile</h3>
            <div className="form-container26">
              <div className="left-side26">
                <label className="form-label26">First Name:</label>
                <input
                  type="text"
                  className="input-field26"
                  value={user.firstName}
                  onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                  required
                />

                <label className="form-label26">Last Name:</label>
                <input
                  type="text"
                  className="input-field26"
                  value={user.lastName}
                  onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                  required
                />

                <label className="form-label26">Email:</label>
                <input
                  type="email"
                  className="input-field26"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  required
                />

                <label className="form-label26">Phone:</label>
                <input
                  type="text"
                  className="input-field26"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  required
                />

                <label className="form-label26">Address:</label>
                <textarea
                  className="textarea-field26"
                  value={user.address}
                  onChange={(e) => setUser({ ...user, address: e.target.value })}
                  placeholder="Enter your complete address (Required)"
                  required
                  rows={4}
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              <div className="right-side26">
                <label className="form-label26">Profile Picture:</label>
                <div className="image-upload-circle26" onClick={() => fileInputRef.current.click()}>
                  {userImage ? (
                    <img src={userImage} alt="Profile" className="uploaded-image26" />
                  ) : (
                    <div className="upload-icon26">+</div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                  accept="image/*"
                />

                <label className="form-label26">Gender:</label>
                <div className="radio-container26">
                  <label className="radio-label26">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={user.gender === "Male"}
                      onChange={(e) => setUser({ ...user, gender: e.target.value })}
                    />
                    Male
                  </label>
                  <label className="radio-label26">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={user.gender === "Female"}
                      onChange={(e) => setUser({ ...user, gender: e.target.value })}
                    />
                    Female
                  </label>
                  <label className="radio-label26">
                    <input
                      type="radio"
                      name="gender"
                      value="Others"
                      checked={user.gender === "Others"}
                      onChange={(e) => setUser({ ...user, gender: e.target.value })}
                    />
                    Others
                  </label>
                </div>

                <label className="form-label26">Date of Birth:</label>
                <input
                  type="date"
                  className="input-field26"
                  value={user.dateOfBirth}
                  onChange={(e) => setUser({ ...user, dateOfBirth: e.target.value })}
                />
              </div>
            </div>

            <div className="button-container26">
              <button 
                className="cancel-button26" 
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button 
                className="add-button26" 
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
