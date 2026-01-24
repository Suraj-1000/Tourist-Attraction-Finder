import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import "./Profile.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import { toast } from "react-hot-toast";
import EventPreferencesModal from "../Recommendation/EventPreferencesModal";

export default function ProfilePage() {
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

  // Store original values to detect changes
  const [originalUser, setOriginalUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
  });

  // Add validation states
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: ''
  });

  // Add touched states to track which fields user has interacted with
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    dateOfBirth: false,
    address: false,
    gender: false
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [userImage, setUserImage] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState([]);

  // Validation functions
  const validateFirstName = (value) => {
    if (!value.trim()) return "First name is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "First name should contain only letters and spaces";
    return "";
  };

  const validateLastName = (value) => {
    if (!value.trim()) return "Last name is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Last name should contain only letters and spaces";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (value) => {
    if (!value.trim()) return "Phone number is required";
    if (!/^(97|98)\d{8}$/.test(value)) return "Phone must start with 97 or 98 followed by 8 digits";
    return "";
  };

  const validateDateOfBirth = (value) => {
    if (!value) return "Date of birth is required";
    
    const today = new Date();
    const birthDate = new Date(value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 16) return "You must be at least 16 years old";
    return "";
  };

  const validateAddress = (value) => {
    if (!value.trim()) return "Address is required";
    return "";
  };

  const validateGender = (value) => {
    if (!value) return "Gender selection is required";
    return "";
  };

  // Handle field change and validation
  const handleFieldChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
    
    // Validate the field and immediately update errors
    let errorMessage = "";
    switch (field) {
      case "firstName":
        errorMessage = validateFirstName(value);
        break;
      case "lastName":
        errorMessage = validateLastName(value);
        break;
      case "email":
        errorMessage = validateEmail(value);
        break;
      case "phone":
        errorMessage = validatePhone(value);
        break;
      case "dateOfBirth":
        errorMessage = validateDateOfBirth(value);
        break;
      case "address":
        errorMessage = validateAddress(value);
        break;
      case "gender":
        errorMessage = validateGender(value);
        break;
      default:
        break;
    }
    
    // Update errors and touched state
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle field blur
  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Validate all fields
  const validateAllFields = () => {
    const newErrors = {
      firstName: validateFirstName(user.firstName),
      lastName: validateLastName(user.lastName),
      email: validateEmail(user.email),
      phone: validatePhone(user.phone),
      dateOfBirth: validateDateOfBirth(user.dateOfBirth),
      address: validateAddress(user.address),
      gender: validateGender(user.gender)
    };
    
    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      address: true,
      gender: true
    });
    
    // Return true if no errors, false if there are errors
    return !Object.values(newErrors).some(error => error);
  };

  // Filter non-numeric characters from phone input
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    // Limit to 10 digits
    if (value.length > 10) {
      return;
    }
    
    setUser(prev => ({ ...prev, phone: value }));
    setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
    setTouched(prev => ({ ...prev, phone: true }));
  };

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
        
        const userObj = {
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          gender: userData.gender || "",
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split("T")[0] : "",
          address: userData.address || "",
          role: userData.role || "",
          image: userData.image || null
        };
        
        setUser(userObj);
        setUserImage(userData.image || "");
        setUserPreferences(userData.eventPreferences || []);
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

  // Function to start editing
  const startEditing = () => {
    // Store original values for comparison when updating
    setOriginalUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
    });
    setOriginalImage(userImage);
    setIsEditing(true);
  };

  // Check if any changes have been made
  const hasChanges = () => {
    // Check if any text fields changed
    const fieldsChanged = 
      user.firstName !== originalUser.firstName ||
      user.lastName !== originalUser.lastName ||
      user.email !== originalUser.email ||
      user.phone !== originalUser.phone ||
      user.gender !== originalUser.gender ||
      user.dateOfBirth !== originalUser.dateOfBirth ||
      user.address !== originalUser.address;
    
    // Check if image changed
    const imageChanged = user.image instanceof File;
    
    return fieldsChanged || imageChanged;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Check if any changes were made
    if (!hasChanges()) {
      toast.error("No changes detected. Please make changes before updating.");
      return;
    }

    // Validate all fields before submission
    if (!validateAllFields()) {
      toast.error("Please fix all validation errors before submitting.");
      return;
    }
    
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

  const handlePreferencesUpdate = () => {
    setShowPreferencesModal(false);
    fetchUserDetails(); // Refresh user data
  };

  const getRoleDisplay = (role) => {
    return role === 'admin' ? 'Administrator' : 'Regular User';
  };

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Helper function to determine input class based on validation
  const getInputClassName = (fieldName) => {
    const baseClass = "input-field64";
    
    // If the field has a value, show validation state
    if (user[fieldName]) {
      return errors[fieldName] 
        ? `${baseClass} input-error64` 
        : `${baseClass} input-valid64`;
    }
    
    return baseClass;
  };
  
  // Helper function for textarea
  const getTextareaClassName = (fieldName) => {
    const baseClass = "textarea-field64";
    
    // If the field has a value, show validation state
    if (user[fieldName]) {
      return errors[fieldName] 
        ? `${baseClass} input-error64` 
        : `${baseClass} input-valid64`;
    }
    
    return baseClass;
  };

  if (loading) return <div className="loading64">Loading User details...</div>;

  return (
    <>
      <Header />
      <div className="main-container64">
        <div className="heading64">
          <h1 className="title-heading64">Profile Management</h1>
        </div>

        {!isEditing ? (
          // View Mode
          <div className="profile-view64">
            <div className="profile-header64">
              <button className="edit-profile-btn64" onClick={startEditing}>
                <FaEdit size={20} />
              </button>
              <div className="profile-image-container64">
                {userImage ? (
                  <img
                    src={userImage}
                    alt="Profile"
                    className="profile-image64"
                  />
                ) : (
                  <div className="initials-avatar64">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
              </div>
              <h2 className="profile-name64">{`${user.firstName} ${user.lastName}`}</h2>
              <div className="profile-role64">
                {getRoleDisplay(user.role)}
              </div>
            </div>

            <div className="profile-details64">
              <div className="details-grid64">
                <div className="detail-item64">
                  <div className="detail-label64">Email</div>
                  <div className="detail-value64">{user.email}</div>
                </div>
                <div className="detail-item64">
                  <div className="detail-label64">Phone</div>
                  <div className="detail-value64">{user.phone || "Not provided"}</div>
                </div>
                <div className="detail-item64">
                  <div className="detail-label64">Gender</div>
                  <div className="detail-value64">{user.gender || "Not provided"}</div>
                </div>
                <div className="detail-item64">
                  <div className="detail-label64">Date of Birth</div>
                  <div className="detail-value64">
                    {user.dateOfBirth || "Not provided"}
                  </div>
                </div>
                <div className="detail-item64" style={{ gridColumn: "1 / -1" }}>
                  <div className="detail-label64">Address</div>
                  <div className="detail-value64">{user.address || "Not provided"}</div>
                </div>
              </div>
            </div>

            <div className="preferences-section64">
              <h3>Event Preferences</h3>
              <div className="preferences-list64">
                {userPreferences.length > 0 ? (
                  userPreferences.map((pref, index) => (
                    <span key={index} className="preference-tag64">{pref}</span>
                  ))
                ) : (
                  <p>No preferences set yet</p>
                )}
              </div>
              <button 
                className="edit-preferences-btn64"
                onClick={() => setShowPreferencesModal(true)}
              >
                Edit Preferences
              </button>
            </div>
          </div>
        ) : (

          
          // Edit Mode
          <div className="form-card64">
            <h3 className="form-card-heading64">Edit Your Profile</h3>
            <div className="form-container64">
              <div className="left-side64">
                <label className="form-label64">
                  First Name <span className="required-asterisk64">*</span>
                </label>
                <input
                  type="text"
                  className={getInputClassName("firstName")}
                  value={user.firstName}
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  onBlur={() => handleFieldBlur("firstName")}
                  required
                  maxLength={50}
                />
                {errors.firstName && <div className="error-message64">{errors.firstName}</div>}
                {!errors.firstName && user.firstName && <div className="helper-text64">First name is valid</div>}

                <label className="form-label64">
                  Last Name <span className="required-asterisk64">*</span>
                </label>
                <input
                  type="text"
                  className={getInputClassName("lastName")}
                  value={user.lastName}
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  onBlur={() => handleFieldBlur("lastName")}
                  required
                  maxLength={50}
                />
                {errors.lastName && <div className="error-message64">{errors.lastName}</div>}
                {!errors.lastName && user.lastName && <div className="helper-text64">Last name is valid</div>}

                <label className="form-label64">
                  Email <span className="required-asterisk64">*</span>
                </label>
                <input
                  type="email"
                  className={getInputClassName("email")}
                  value={user.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  required
                />
                {errors.email && <div className="error-message64">{errors.email}</div>}
                {!errors.email && user.email && <div className="helper-text64">Email is valid</div>}

                <label className="form-label64">
                  Phone <span className="required-asterisk64">*</span>
                </label>
                <input
                  type="text"
                  className={getInputClassName("phone")}
                  value={user.phone}
                  onChange={handlePhoneChange}
                  onBlur={() => handleFieldBlur("phone")}
                  required
                  maxLength={10}
                  placeholder="Must start with 97 or 98"
                />
                {errors.phone && <div className="error-message64">{errors.phone}</div>}
                {!errors.phone && user.phone && <div className="helper-text64">Phone number is valid</div>}

                <label className="form-label64">
                  Address <span className="required-asterisk64">*</span>
                </label>
                <textarea
                  className={getTextareaClassName("address")}
                  value={user.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  onBlur={() => handleFieldBlur("address")}
                  placeholder="Enter your complete address"
                  required
                  rows={4}
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
                {errors.address && <div className="error-message64">{errors.address}</div>}
                {!errors.address && user.address && <div className="helper-text64">Address is valid</div>}
              </div>

              <div className="right-side64">
                <label className="form-label64">Profile Picture:</label>
                <div className="image-upload-circle64" onClick={() => fileInputRef.current.click()}>
                  {userImage ? (
                    <img src={userImage} alt="Profile" className="uploaded-image64" />
                  ) : (
                    <div className="initials-avatar64">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                  accept="image/*"
                />

                <label className="form-label64">
                  Gender <span className="required-asterisk64">*</span>
                </label>
                <div className="radio-container64">
                  <label className="radio-label64">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={user.gender === "Male"}
                      onChange={(e) => handleFieldChange("gender", e.target.value)}
                      required
                    />
                    Male
                  </label>
                  <label className="radio-label64">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={user.gender === "Female"}
                      onChange={(e) => handleFieldChange("gender", e.target.value)}
                      required
                    />
                    Female
                  </label>
                  <label className="radio-label64">
                    <input
                      type="radio"
                      name="gender"
                      value="Others"
                      checked={user.gender === "Others"}
                      onChange={(e) => handleFieldChange("gender", e.target.value)}
                      required
                    />
                    Others
                  </label>
                </div>
                {errors.gender && <div className="error-message64">{errors.gender}</div>}
                {!errors.gender && user.gender && <div className="helper-text64">Gender is selected</div>}

                <label className="form-label64">
                  Date of Birth <span className="required-asterisk64">*</span>
                </label>
                <input
                  type="date"
                  className={getInputClassName("dateOfBirth")}
                  value={user.dateOfBirth}
                  onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
                  onBlur={() => handleFieldBlur("dateOfBirth")}
                  required
                />
                {errors.dateOfBirth && <div className="error-message64">{errors.dateOfBirth}</div>}
                {!errors.dateOfBirth && user.dateOfBirth && <div className="helper-text64">Date of birth is valid</div>}
              </div>
            </div>

            <div className="button-container64">
              <button 
                className="cancel-button64" 
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button 
                className="add-button64" 
                onClick={handleUpdate}
                disabled={isUpdating || Object.values(errors).some(error => error)}
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
      
      <EventPreferencesModal 
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onComplete={handlePreferencesUpdate}
        initialPreferences={userPreferences}
      />
    </>
  );
}
