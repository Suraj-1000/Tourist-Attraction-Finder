import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaStar } from 'react-icons/fa';
import './Profile.css';
import '../../Admin/Management/GuideApproval.css';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const [replyingToReviewId, setReplyingToReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    image: null,
    guideProfile: {
      languages: [],
      licenseNumber: '',
      licenseDocument: null,
      educationCertificates: [],
      regionsOfExpertise: [],
      serviceTypes: [],
      pricing: {
        perDay: 0
      },
      availability: [],
      ratings: {
        average: 0,
        total: 0
      },
      reviews: [],
      verificationStatus: 'pending',
      isVerified: false,
      verificationDate: null,
      verifiedBy: null,
      rejectionReason: null
    }
  });
  const [verifierDetails, setVerifierDetails] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const certificateInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [userImage, setUserImage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [validFields, setValidFields] = useState({});
  const [formModified, setFormModified] = useState(false);
  const [showNoChangesError, setShowNoChangesError] = useState(false);

  useEffect(() => {
    fetchGuideDetails();
  }, []);

  const fetchGuideDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not logged in.");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:4000/adminUpdateProfile/getGuideProfile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const userData = response.data;
        console.log("Guide Profile Data:", userData.guideProfile); // Debug log
        
        const formattedUser = {
          ...userData,
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split("T")[0] : "",
          guideProfile: {
            ...userData.guideProfile,
            verificationStatus: userData.guideProfile?.verificationStatus || 'pending',
            isVerified: userData.guideProfile?.isVerified || false,
            verificationDate: userData.guideProfile?.verificationDate || null,
            verifiedBy: userData.guideProfile?.verifiedBy || null,
            rejectionReason: userData.guideProfile?.rejectionReason || null,
            languages: userData.guideProfile?.languages || [],
            licenseNumber: userData.guideProfile?.licenseNumber || '',
            licenseDocument: userData.guideProfile?.licenseDocument || null,
            educationCertificates: userData.guideProfile?.educationCertificates || [],
            regionsOfExpertise: userData.guideProfile?.regionsOfExpertise || [],
            serviceTypes: userData.guideProfile?.serviceTypes || [],
            pricing: userData.guideProfile?.pricing || {
              perDay: 0,
              packages: []
            },
            availability: userData.guideProfile?.availability || [],
            ratings: userData.guideProfile?.ratings || {
              average: 0,
              total: 0
            },
            reviews: userData.guideProfile?.reviews || []
          }
        };

        console.log("Formatted User Data:", formattedUser.guideProfile); // Debug log
        setUser(formattedUser);
        
        // Create a deep copy for original data comparison
        setOriginalUser(JSON.parse(JSON.stringify(formattedUser)));
        
        // Reset form modified state
        setFormModified(false);
        setShowNoChangesError(false);
        
        // Initialize validation states
        if (formattedUser.email) {
          validateEmail(formattedUser.email);
        }
        
        if (formattedUser.phone) {
          validatePhone(formattedUser.phone);
        }
        
        if (formattedUser.dateOfBirth) {
          validateDateOfBirth(formattedUser.dateOfBirth);
        }
        
        setUserImage(userData.image || "");
        localStorage.setItem("user", JSON.stringify(formattedUser));

        // Fetch verifier details if verified
        if (userData.guideProfile?.verifiedBy) {
          try {
            const verifierResponse = await axios.get(
              `http://localhost:4000/adminUpdateProfile/getAdminDetails/${userData.guideProfile.verifiedBy}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (verifierResponse.status === 200) {
              setVerifierDetails(verifierResponse.data);
            }
          } catch (error) {
            console.error("Error fetching verifier details:", error);
          }
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching guide details:", error);
      toast.error("Failed to load guide details.");
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

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const formData = new FormData();
      formData.append('document', file);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:4000/adminUpdateProfile/uploadDocument',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.url) {
          setUser(prev => ({
            ...prev,
            guideProfile: {
              ...prev.guideProfile,
              licenseDocument: {
                preview: URL.createObjectURL(file),
                name: file.name,
                url: response.data.url
              }
            }
          }));
          toast.success("License document uploaded successfully");
          trackFormChange();
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error("Failed to upload document. Please try again.");
      }
    }
  };

  const handleCertificateUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped (size > 5MB)");
    }

    const token = localStorage.getItem('token');
    const uploadPromises = validFiles.map(file => {
      const formData = new FormData();
      formData.append('document', file);

      return axios.post(
        'http://localhost:4000/adminUpdateProfile/uploadDocument',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      .then(response => ({
        preview: URL.createObjectURL(file),
        name: file.name,
        url: response.data.url
      }))
      .catch(error => {
        console.error('Error uploading certificate:', error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      });
    });

    try {
      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(result => result !== null);

      setUser(prev => ({
        ...prev,
        guideProfile: {
          ...prev.guideProfile,
          educationCertificates: [
            ...prev.guideProfile.educationCertificates,
            ...validResults
          ]
        }
      }));
      
      if (validResults.length > 0) {
        toast.success(`${validResults.length} certificate(s) uploaded successfully`);
        trackFormChange();
      }
    } catch (error) {
      console.error('Error in certificate uploads:', error);
    }
  };

  // Function to track form changes
  const trackFormChange = () => {
    if (originalUser) {
      setFormModified(true);
      // Hide no changes error when user starts modifying the form
      setShowNoChangesError(false);
    }
  };

  // Add this to any onChange handler that should track changes
  const handleInputChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
    trackFormChange();
  };

  // Update handle update function
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Check if form has been modified
    if (!formModified) {
      setShowNoChangesError(true);
      toast.error("No changes detected. Please make changes before updating.");
      return;
    }
    
    setIsUpdating(true);

    // Validation
    const validationErrors = {};
    const phoneRegex = /^(98|97)\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate phone
    if (!phoneRegex.test(user.phone)) {
      validationErrors.phone = "Phone number must start with 98 or 97 and be 10 digits long";
    }

    // Validate email
    if (!emailRegex.test(user.email)) {
      validationErrors.email = "Please enter a valid email address";
    }

    // Validate date of birth (must be at least 16 years old)
    if (user.dateOfBirth) {
      const dobDate = new Date(user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      
      if (age < 16) {
        validationErrors.dateOfBirth = "You must be at least 16 years old";
      }
    } else {
      validationErrors.dateOfBirth = "Date of birth is required";
    }

    // Check if we have any errors
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the validation errors");
      setIsUpdating(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Basic user info
      formData.append('firstName', user.firstName || '');
      formData.append('lastName', user.lastName || '');
      formData.append('email', user.email || '');
      formData.append('phone', user.phone || '');
      formData.append('gender', user.gender || '');
      formData.append('dateOfBirth', user.dateOfBirth || '');
      formData.append('address', user.address || '');

      // Handle guide profile data
      const guideProfileData = {
        languages: user.guideProfile.languages || [],
        licenseNumber: user.guideProfile.licenseNumber || '',
        licenseDocument: user.guideProfile.licenseDocument,
        educationCertificates: user.guideProfile.educationCertificates || [],
        regionsOfExpertise: user.guideProfile.regionsOfExpertise || [],
        serviceTypes: user.guideProfile.serviceTypes || [],
        pricing: {
          perDay: user.guideProfile.pricing?.perDay || 0,
          packages: user.guideProfile.pricing?.packages || []
        },
        availability: user.guideProfile.availability || [],
        ratings: user.guideProfile.ratings || { average: 0, total: 0 },
        reviews: user.guideProfile.reviews || []
      };

      // Append guide profile as a stringified object
      formData.append('guideProfile', JSON.stringify(guideProfileData));

      if (user.image instanceof File) {
        formData.append('image', user.image);
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:4000/adminUpdateProfile/updateGuideProfile',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        setOriginalUser({
          ...user,
          guideProfile: guideProfileData
        });
        
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setFormModified(false);
        await fetchGuideDetails(); // Refresh the data
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };
  
  // State to store fetched user names
  const [userNames, setUserNames] = useState({});
  
  // Function to render user name for reviews
  const renderUserInfo = (review) => {
    try {
      // Check if the review has a populated touristId object
      if (review.touristId && typeof review.touristId === 'object') {
        // Extract firstName and lastName from touristId object
        const firstName = review.touristId.firstName || '';
        const lastName = review.touristId.lastName || '';
        
        // If both firstName and lastName exist, return formatted name
        if (firstName && lastName) {
          return `${firstName} ${lastName}`;
        } 
        // If only one exists, return what we have
        else if (firstName || lastName) {
          return (firstName || lastName).trim();
        }
        
        // If we have touristId object but no name, check for email
        if (review.touristId.email) {
          return review.touristId.email.split('@')[0]; // Show username part of email
        }
      }
      
      // If touristId is a string, check if we already fetched the name
      if (typeof review.touristId === 'string') {
        const userId = review.touristId;
        
        // If we already have the name cached, use it
        if (userNames[userId]) {
          return userNames[userId];
        }
        
        // Otherwise, use a default display name based on ID for now
        // and fetch the details asynchronously
        setTimeout(() => {
          fetchUserDetails(userId).then(userDetails => {
            if (userDetails) {
              const name = userDetails.firstName && userDetails.lastName 
                ? `${userDetails.firstName} ${userDetails.lastName}`
                : userDetails.firstName || userDetails.lastName || userDetails.email;
                
              if (name) {
                setUserNames(prev => ({
                  ...prev,
                  [userId]: name
                }));
              }
            }
          });
        }, 0);
        
        // Return a formatted version of the user ID
        return `User ${userId.substring(0, 5)}`;
      }
      
      // Check for direct properties on the review object itself
      if (review.firstName && review.lastName) {
        return `${review.firstName} ${review.lastName}`.trim();
      }
      
      if (review.touristName) {
        return review.touristName;
      }
      
      if (review.email) {
        return review.email.split('@')[0]; // Show username part of email
      }
    } catch (err) {
      console.error('Error rendering user info:', err);
    }
    
    return 'Tourist';
  };
  
  // Function to fetch user details by ID
  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    try {
      // Use our user-basic endpoint that doesn't require authentication
      const response = await axios.get(`http://localhost:4000/signups/user-basic/${userId}`);
      
      if (response.status === 200 && response.data.user) {
        console.log('Fetched user details:', response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
    return null;
  };
  
  // Function to handle clicking reply button
  const handleReplyClick = (reviewId) => {
    setReplyingToReviewId(reviewId);
    setReplyText('');
  };
  
  // Function to cancel replying
  const handleCancelReply = () => {
    setReplyingToReviewId(null);
    setReplyText('');
  };
  
  // Function to submit reply
  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }
    
    setSubmittingReply(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Sending token:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const response = await axios.post(
        `http://localhost:4000/reviews/guide/reply/${reviewId}`,
        { 
          reply: replyText.trim()
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        toast.success('Reply submitted successfully');
        
        // Update local state
        setUser(prevUser => {
          const updatedReviews = prevUser.guideProfile.reviews.map(review => 
            review._id === reviewId ? { ...review, reply: replyText.trim() } : review
          );
          
          return {
            ...prevUser,
            guideProfile: {
              ...prevUser.guideProfile,
              reviews: updatedReviews
            }
          };
        });
        
        // Reset reply state
        setReplyingToReviewId(null);
        setReplyText('');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Add these new field validation handlers
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    setValidFields(prev => ({
      ...prev,
      email: isValid
    }));
    
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        email: "Please enter a valid email address"
      }));
    } else {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.email;
        return newErrors;
      });
    }
    
    return isValid;
  };
  
  const validatePhone = (phone) => {
    const phoneRegex = /^(98|97)\d{8}$/;
    const isValid = phoneRegex.test(phone);
    
    setValidFields(prev => ({
      ...prev,
      phone: isValid
    }));
    
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        phone: "Phone must start with 98 or 97 and be 10 digits long"
      }));
    } else {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.phone;
        return newErrors;
      });
    }
    
    return isValid;
  };
  
  const validateDateOfBirth = (dob) => {
    if (!dob) {
      setValidFields(prev => ({
        ...prev,
        dateOfBirth: false
      }));
      
      setErrors(prev => ({
        ...prev,
        dateOfBirth: "Date of birth is required"
      }));
      
      return false;
    }
    
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    
    const isValid = age >= 16;
    
    setValidFields(prev => ({
      ...prev,
      dateOfBirth: isValid
    }));
    
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: "You must be at least 16 years old"
      }));
    } else {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.dateOfBirth;
        return newErrors;
      });
    }
    
    return isValid;
  };
  
  const validateAvailabilityDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate >= today;
  };

  // Handle phone input with validation
  const handlePhoneInput = (e) => {
    const value = e.target.value;
    
    // Only allow digits for phone numbers
    if (!/^\d*$/.test(value) && value !== '') {
      return;
    }
    
    // Limit to 10 digits
    if (value.length <= 10) {
      setUser({
        ...user,
        phone: value
      });
      
      // Don't show validation errors while typing, but update valid state
      if (value.length === 10) {
        validatePhone(value);
      } else {
        setValidFields(prev => ({
          ...prev,
          phone: false
        }));
      }
    }
  };

  // Function to compare if the user has made changes
  const hasUserMadeChanges = () => {
    if (!originalUser) return true;
    return JSON.stringify(user) !== JSON.stringify(originalUser);
  };

  if (loading) return <div className="loading">Loading Guide details...</div>;

  return (
    <div className="main-container64">
      <div className="heading64">
        <h1 className="title-heading64">Guide Profile Management</h1>
      </div>

      {!isEditing ? (
        // View Mode
        <div className="profile-view64">
          <div className="profile-header64">
            <button className="edit-profile-btn64" onClick={() => setIsEditing(true)}>
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
            
            <div className="profile-role-container64">
              <div className="profile-role64">Guide</div>
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
                <div className="detail-value64">{user.dateOfBirth || "Not provided"}</div>
              </div>
              <div className="detail-item64">
                <div className="detail-label64">Address</div>
                <div className="detail-value64">{user.address || "Not provided"}</div>
              </div>
            </div>

            <div className="guide-specific-details64">
              <div className="guide-info-section64">
                <h4>Languages</h4>
                <div className="tags-container64">
                  {user.guideProfile.languages.map((lang, index) => (
                    <span key={index} className="tag64">{lang}</span>
                  ))}
                </div>
              </div>

              <div className="guide-info-section64">
                <h4>Regions of Expertise</h4>
                <div className="tags-container64">
                  {user.guideProfile.regionsOfExpertise.map((region, index) => (
                    <span key={index} className="tag64">{region}</span>
                  ))}
                </div>
              </div>

              <div className="guide-info-section64">
                <h4>Service Types</h4>
                <div className="tags-container64">
                  {user.guideProfile.serviceTypes.map((service, index) => (
                    <span key={index} className="tag64">{service}</span>
                  ))}
                </div>
              </div>

              <div className="guide-info-section64">
                <h4>License Information</h4>
                <p>License Number: {user.guideProfile.licenseNumber}</p>
                {user.guideProfile.licenseDocument && (
                  <div className="document-preview64">
                    <img src={user.guideProfile.licenseDocument.url} alt="License" />
                  </div>
                )}
              </div>

              <div className="guide-info-section64">
                <h4>Education Certificates</h4>
                <div className="certificates-grid64">
                  {user.guideProfile.educationCertificates.map((cert, index) => (
                    
                      <div className="document-preview64">
                        <img src={cert.url} alt="Certificate" />
                      </div>
                    
                  ))}
                </div>
              </div>

              <div className="guide-info-section64">
                <h4>Pricing</h4>
                <p>Rate per Day: NPR {user.guideProfile.pricing.perDay}</p>
              </div>

              <div className="guide-info-section64">
                <h4>Availability</h4>
                <div className="availability-grid64">
                  {user.guideProfile.availability.map((day, index) => (
                    <div key={index} className="availability-slot64">
                      <div className="availability-date64">
                        <input
                          type="date"
                          className="input-field64"
                          value={day.date.split('T')[0]}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            // Prevent selecting past dates
                            if (!validateAvailabilityDate(newDate)) {
                              toast.error("Cannot select past dates for availability");
                              return;
                            }
                            
                            const newAvailability = [...user.guideProfile.availability];
                            newAvailability[index] = {
                              ...newAvailability[index],
                              date: newDate
                            };
                            setUser({
                              ...user,
                              guideProfile: {
                                ...user.guideProfile,
                                availability: newAvailability
                              }
                            });
                          }}
                          min={new Date().toISOString().split('T')[0]} // Disable past dates
                        />
                      </div>
                      <div className="availability-time64">
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex}>
                            {slot.startTime} - {slot.endTime}
                            {slot.isBooked ? " (Booked)" : " (Available)"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="guide-info-section64">
                <h4>Ratings & Reviews</h4>
                <div className="rating-summary25">
                  <div className="average-rating25">
                    <span className="rating-number25">
                      {user.guideProfile.ratings?.average ? 
                        user.guideProfile.ratings.average.toFixed(1) : 
                        '0.0'}
                    </span>
                    <div className="stars-container25">
                      {[...Array(5)].map((_, index) => (
                        <FaStar
                          key={index}
                          className={`star ${index < Math.round(user.guideProfile.ratings?.average || 0) ? 'filled' : 'empty'}`}
                          style={{
                            color: index < Math.round(user.guideProfile.ratings?.average || 0) ? '#ffd700' : '#e0e0e0',
                            marginRight: '2px'
                          }}
                        />
                      ))}
                    </div>
                    <span className="total-reviews25">
                      ({user.guideProfile.ratings?.total || 0} reviews)
                    </span>
                  </div>
                </div>
                
                <div className="reviews-list25">
                  {user.guideProfile.reviews && user.guideProfile.reviews.length > 0 ? (
                    user.guideProfile.reviews.map((review, index) => (
                      <div key={index} className="review-card25">
                        <div className="review-card-header25">
                          <div className="reviewer-info25">
                            <h3>{renderUserInfo(review)}</h3>
                            <span className="review-date25">
                              {new Date(review.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="review-rating25">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`star ${i < review.rating ? 'filled' : 'empty'}`}
                                style={{
                                  color: i < review.rating ? '#ffd700' : '#e0e0e0',
                                  marginRight: '2px'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="review-text25">{review.comment}</p>
                        {review.reply ? (
                          <div className="guide-reply-section">
                            <strong>Your Response:</strong>
                            <p>{review.reply}</p>
                          </div>
                        ) : replyingToReviewId === review._id ? (
                          <div className="reply-form-container">
                            <textarea
                              className="reply-textarea"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              rows={3}
                            />
                            <div className="reply-form-buttons">
                              <button 
                                className="cancel-reply-button" 
                                onClick={handleCancelReply}
                                disabled={submittingReply}
                              >
                                Cancel
                              </button>
                              <button 
                                className="submit-reply-button" 
                                onClick={() => handleSubmitReply(review._id)}
                                disabled={submittingReply}
                              >
                                {submittingReply ? 'Submitting...' : 'Submit Reply'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="reply-action-section">
                            <button 
                              className="reply-button" 
                              onClick={() => handleReplyClick(review._id)}
                            >
                              Reply to this review
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-reviews25">No reviews yet.</p>
                  )}
                </div>
              </div>

              <div className="guide-info-section64">
                <h4>Verification Information</h4>
                <div className="verification-info64">
                  {user.guideProfile.verificationDate && (
                    <div className="verification-info-item64">
                      <span className="verification-label64">Verified On:</span>
                      <span className="verification-value64">
                        {new Date(user.guideProfile.verificationDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {verifierDetails && (
                    <>
                      <div className="verification-info-item64">
                        <span className="verification-label64">Verified By:</span>
                        <span className="verification-value64">
                          {`${verifierDetails.firstName} ${verifierDetails.lastName}`}
                        </span>
                      </div>
                      <div className="verification-info-item64">
                        <span className="verification-label64">Admin Email:</span>
                        <span className="verification-value64">
                          {verifierDetails.email}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {user.guideProfile.rejectionReason && (
                    <div className="verification-info-item64">
                      <span className="verification-label64">Rejection Reason:</span>
                      <span className="verification-value64">
                        {user.guideProfile.rejectionReason}
                      </span>
                    </div>
                  )}
                  
                  <div className="verification-info-item64 status-badge-container">
                    <span className="verification-label64">Verification Status:</span>
                    <div className={`badge-status ${
                      user.guideProfile?.verificationStatus === 'approved' ? 'badge-verified' :
                      user.guideProfile?.verificationStatus === 'rejected' ? 'badge-rejected' :
                      'badge-pending'
                    }`}>
                      {user.guideProfile?.verificationStatus === 'approved' ? 'Verified' : 
                       user.guideProfile?.verificationStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="form-card64">
          <h3 className="form-card-heading64">Edit Your Profile</h3>
          <div className="form-container64">
            <div className="left-side64">
              <div className="profile-section64">
                <h4 className="section-title64">Profile Picture</h4>
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
                  onChange={(e) => {
                    handleImageUpload(e);
                    trackFormChange();
                  }}
                  accept="image/*"
                />
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">Basic Information</h4>
                
                {showNoChangesError && (
                  <div className="no-changes-dialog">
                    <i className="fas fa-exclamation-circle"></i>
                    No changes detected. Please make changes before updating.
                  </div>
                )}
                
                <div className="input-group64">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="input-field64"
                    value={user.firstName}
                    onChange={(e) => {
                      handleInputChange('firstName', e.target.value);
                    }}
                    required
                  />
                </div>

                <div className="input-group64">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="input-field64"
                    value={user.lastName}
                    onChange={(e) => {
                      handleInputChange('lastName', e.target.value);
                    }}
                    required
                  />
                </div>

                <div className="input-group64">
                  <label>Email</label>
                  <input
                    type="email"
                    className={`input-field64 ${errors.email ? 'error-field' : validFields.email ? 'valid-field' : ''}`}
                    value={user.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={(e) => validateEmail(e.target.value)}
                    required
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>

                <div className="input-group64">
                  <label>Phone</label>
                  <input
                    type="text"
                    className={`input-field64 ${errors.phone ? 'error-field' : validFields.phone ? 'valid-field' : ''}`}
                    value={user.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={() => validatePhone(user.phone)}
                    placeholder="Phone number starting with 97 or 98"
                    maxLength={10}
                    required
                  />
                  {errors.phone && <div className="error-message">{errors.phone}</div>}
                  {!errors.phone && <div className="helper-text">Phone must start with 97 or 98 (10 digits total)</div>}
                </div>

                <div className="input-group64">
                  <label>Gender</label>
                  <select
                    className="input-field64"
                    value={user.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="input-group64">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    className={`input-field64 ${errors.dateOfBirth ? 'error-field' : validFields.dateOfBirth ? 'valid-field' : ''}`}
                    value={user.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    onBlur={(e) => validateDateOfBirth(e.target.value)}
                  />
                  {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth}</div>}
                </div>

                <div className="input-group64">
                  <label>Address</label>
                  <textarea
                    className="input-field64"
                    value={user.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows="3"
                  />
                </div>
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">Languages</h4>
                {user.guideProfile.languages.map((lang, index) => (
                  <div key={index} className="input-group64">
                    <div className="slot-input64">
              <input
                type="text"
                        className="input-field64"
                        value={lang}
                        onChange={(e) => {
                          const newLanguages = [...user.guideProfile.languages];
                          newLanguages[index] = e.target.value;
                          handleInputChange('guideProfile.languages', newLanguages);
                        }}
                      />
                      <button
                        type="button"
                        className="remove-button64"
                        onClick={() => {
                          const newLanguages = user.guideProfile.languages.filter((_, i) => i !== index);
                          handleInputChange('guideProfile.languages', newLanguages);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-button64"
                  onClick={() => {
                    handleInputChange('guideProfile.languages', [...user.guideProfile.languages, '']);
                  }}
                >
                  Add Language
                </button>
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">Regions of Expertise</h4>
                <div className="regions-input-container64">
                  {user.guideProfile.regionsOfExpertise.map((region, index) => (
                    <div key={index} className="slot-input64">
                      <input
                        type="text"
                        className="input-field64"
                        value={region}
                        onChange={(e) => {
                          const newRegions = [...user.guideProfile.regionsOfExpertise];
                          newRegions[index] = e.target.value;
                          handleInputChange('guideProfile.regionsOfExpertise', newRegions);
                        }}
                        placeholder="Enter region"
                      />
                      <button
                        type="button"
                        className="remove-button64"
                        onClick={() => {
                          const newRegions = user.guideProfile.regionsOfExpertise.filter((_, i) => i !== index);
                          handleInputChange('guideProfile.regionsOfExpertise', newRegions);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-button64"
                    onClick={() => {
                      handleInputChange('guideProfile.regionsOfExpertise', [...user.guideProfile.regionsOfExpertise, '']);
                    }}
                  >
                    Add Region
                  </button>
                </div>
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">Service Types</h4>
                <div className="service-types-input-container64">
                  {user.guideProfile.serviceTypes.map((service, index) => (
                    <div key={index} className="slot-input64">
                      <input
                        type="text"
                        className="input-field64"
                        value={service}
                        onChange={(e) => {
                          const newServices = [...user.guideProfile.serviceTypes];
                          newServices[index] = e.target.value;
                          handleInputChange('guideProfile.serviceTypes', newServices);
                        }}
                        placeholder="Enter service type"
                      />
                      <button
                        type="button"
                        className="remove-button64"
                        onClick={() => {
                          const newServices = user.guideProfile.serviceTypes.filter((_, i) => i !== index);
                          handleInputChange('guideProfile.serviceTypes', newServices);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-button64"
                    onClick={() => {
                      handleInputChange('guideProfile.serviceTypes', [...user.guideProfile.serviceTypes, '']);
                    }}
                  >
                    Add Service Type
                  </button>
                </div>
              </div>
            </div>

            <div className="right-side64">
              <div className="profile-section64">
                <h4 className="section-title64">Availability</h4>
                <div className="availability-slots64">
                  {user.guideProfile.availability.map((day, index) => (
                    <div key={index} className="availability-slot64">
                      <button
                        type="button"
                        className="remove-button64"
                        onClick={() => {
                          const newAvailability = user.guideProfile.availability.filter((_, i) => i !== index);
                          handleInputChange('guideProfile.availability', newAvailability);
                        }}
                      >
                        Remove
                      </button>
                      <div className="availability-date64">
                        <input
                          type="date"
                          className="input-field64"
                          value={day.date.split('T')[0]}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            // Prevent selecting past dates
                            if (!validateAvailabilityDate(newDate)) {
                              toast.error("Cannot select past dates for availability");
                              return;
                            }
                            
                            const newAvailability = [...user.guideProfile.availability];
                            newAvailability[index] = {
                              ...newAvailability[index],
                              date: newDate
                            };
                            handleInputChange('guideProfile.availability', newAvailability);
                          }}
                          min={new Date().toISOString().split('T')[0]} // Disable past dates
                        />
                      </div>
                      <div className="time-slots-container64">
                        <div className="time-slots-header64">
                          <h5>Time Slots</h5>
                          <button
                            type="button"
                            className="add-button64"
                            onClick={() => {
                              const newAvailability = [...user.guideProfile.availability];
                              newAvailability[index].slots.push({
                                startTime: "09:00",
                                endTime: "17:00",
                                isBooked: false
                              });
                              handleInputChange('guideProfile.availability', newAvailability);
                            }}
                          >
                            Add Slot
                          </button>
                        </div>
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="slot-input64">
                            <input
                              type="time"
                              className="input-field64"
                              value={slot.startTime}
                              onChange={(e) => {
                                const newAvailability = [...user.guideProfile.availability];
                                newAvailability[index].slots[slotIndex].startTime = e.target.value;
                                handleInputChange('guideProfile.availability', newAvailability);
                              }}
                            />
                            <span>to</span>
                            <input
                              type="time"
                              className="input-field64"
                              value={slot.endTime}
                              onChange={(e) => {
                                const newAvailability = [...user.guideProfile.availability];
                                newAvailability[index].slots[slotIndex].endTime = e.target.value;
                                handleInputChange('guideProfile.availability', newAvailability);
                              }}
                            />
                            <button
                              type="button"
                              className="remove-button64"
                              onClick={() => {
                                const newAvailability = [...user.guideProfile.availability];
                                newAvailability[index].slots = newAvailability[index].slots.filter((_, i) => i !== slotIndex);
                                handleInputChange('guideProfile.availability', newAvailability);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="add-button64"
                  onClick={() => {
                    // Get current date in YYYY-MM-DD format
                    const today = new Date().toISOString().split('T')[0];
                    
                    handleInputChange('guideProfile.availability', [
                      ...user.guideProfile.availability,
                      {
                        date: today,
                        slots: [{
                          startTime: "09:00",
                          endTime: "17:00",
                          isBooked: false
                        }]
                      }
                    ]);
                  }}
                >
                  Add New Date
                </button>
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">License Information</h4>
                <div className="input-group64">
                  <label>License Number</label>
                  <input
                    type="text"
                    className="input-field64"
                    value={user.guideProfile.licenseNumber}
                    onChange={(e) => handleInputChange('guideProfile.licenseNumber', e.target.value)}
                  />
                </div>
                <div className="input-group64">
                  <label>License Document</label>
                  <button
                    type="button"
                    className="add-button64"
                    onClick={() => licenseInputRef.current.click()}
                  >
                    Upload License
                  </button>
                  <input
                    type="file"
                    ref={licenseInputRef}
                    style={{ display: "none" }}
                    onChange={handleLicenseUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {user.guideProfile.licenseDocument && (
                    <div className="document-preview64">
                      <img src={user.guideProfile.licenseDocument.url} alt="License" />
                      <button
                        type="button"
                        className="remove-button64"
                        onClick={() => {
                          handleInputChange('guideProfile.licenseDocument', null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">Education Certificates</h4>
                <button
                  type="button"
                  className="add-button64"
                  onClick={() => certificateInputRef.current.click()}
                >
                  Upload Certificates
                </button>
                <input
                  type="file"
                  ref={certificateInputRef}
                  style={{ display: "none" }}
                  onChange={handleCertificateUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                />
                <div className="certificates-preview64">
                  {user.guideProfile.educationCertificates.map((cert, index) => (
                    <div key={index} className="certificate-preview-item64">
                      <img src={cert.url} alt="Certificate" />
                      <button
                        type="button"
                        className="remove-button64"
                        onClick={() => {
                          const newCertificates = user.guideProfile.educationCertificates.filter((_, i) => i !== index);
                          handleInputChange('guideProfile.educationCertificates', newCertificates);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-section64">
                <h4 className="section-title64">Pricing</h4>
                <div className="input-group64">
                  <label>Rate per Day (NPR)</label>
                  <input
                    type="number"
                    className="input-field64"
                    value={user.guideProfile.pricing.perDay}
                    onChange={(e) => handleInputChange('guideProfile.pricing.perDay', Number(e.target.value))}
                    min="0"
            />
          </div>
        </div>
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
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 