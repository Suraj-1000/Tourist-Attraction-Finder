import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminProfileManage.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminProfileManagePage() {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    image: "",
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [userImage, setUserImage] = useState("");

  useEffect(() => {
    fetchUserDetails();
  }, []);

  // Fetch Logged-in User's Details
  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found in localStorage");
        alert("You are not logged in.");
        navigate("/login"); // Redirect to login if no token
        return;
      }

      const response = await axios.get(
        "http://localhost:4000/adminUpdateProfile/getProfile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const userData = response.data;
        localStorage.setItem("user", JSON.stringify(userData)); // ✅ Store updated user in localStorage
        setUser({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          gender: userData.gender || "",
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split("T")[0] : "",
          image: userData.image || "",
        });
        setUserImage(userData.image || "");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("Failed to load user details.");
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

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        alert("You are not logged in.");
        navigate("/login");
        return;
      }

      const formData = new FormData();
      Object.keys(user).forEach((key) => {
        formData.append(key, user[key]);
      });

      const response = await axios.put(
        "http://localhost:4000/adminUpdateProfile/updateProfile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert("Profile updated successfully!");
        localStorage.setItem("user", JSON.stringify(response.data)); // ✅ Update localStorage
        setUser({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phone: response.data.phone,
          gender: response.data.gender,
          dateOfBirth: response.data.dateOfBirth.split("T")[0],
          image: response.data.image,
        });
        setUserImage(response.data.image || "");
        fetchUserDetails(); // ✅ Fetch updated user data immediately
      } else {
        alert("Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Update failed: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  if (loading) return <div className="loading26">Loading User details...</div>;

  return (
    <>
      <Header />
      <div className="main-container26">
        <div className="heading26">
          <h1 className="title-heading26">Admin Profile Management</h1>
        </div>

        <div className="form-card26">
          <h3 className="form-card-heading26">Manage Your Profile:</h3>
          <div className="form-container26">
            <div className="left-side26">
              <label className="form-label26">First Name:</label>
              <input
                type="text"
                className="input-field26"
                value={user.firstName || ""}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                required
              />

              <label className="form-label26">Last Name:</label>
              <input
                type="text"
                className="input-field26"
                value={user.lastName || ""}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                required
              />

              <label className="form-label26">Email:</label>
              <input
                type="email"
                className="input-field26"
                value={user.email || ""}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                required
              />

              <label className="form-label26">Phone:</label>
              <input
                type="text"
                className="input-field26"
                value={user.phone || ""}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                required
              />
            </div>

            <div className="right-side26">
              <label className="form-label26">Change Your Profile Picture:</label>
              <div className="image-upload-circle26" onClick={() => fileInputRef.current.click()}>
                {userImage ? (
                  <img src={userImage} alt="Profile" className="uploaded-image26" />
                ) : (
                  <div className="upload-icon26">+</div>
                )}
              </div>
              <input
                type="file"
                className="file-input15"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImageUpload}
                accept="image/*"
              />

              <label className="form-label26">Date of Birth:</label>
              <input
                type="date"
                className="input-field26"
                value={user.dateOfBirth}
                onChange={(e) => setUser({ ...user, dateOfBirth: e.target.value })}
              />

              <label className="form-label26">Gender:</label>
              <div className="radio-container26">
                <label className="radio-label26">
                  <input
                    className="radio-input26"
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
                    className="radio-input26"
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
                    className="radio-input26"
                    type="radio"
                    name="gender"
                    value="Others"
                    checked={user.gender === "Others"}
                    onChange={(e) => setUser({ ...user, gender: e.target.value })}
                  />
                  Others
                </label>
              </div>
            </div>
          </div>

          <div className="button-container26">
            <button className="cancel-button26" onClick={() => navigate(-1)}>Cancel</button>
            <button className="add-button26" onClick={handleUpdate}>Update</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
