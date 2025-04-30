import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Signup.css";
import axios from "axios";
import { FiEye, FiEyeOff, FiPlus, FiX, FiUpload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import AuthFooter from "../../Components/Footer/AuthFooter";

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isGuide, setIsGuide] = useState(false);
  const [guideDetails, setGuideDetails] = useState({
    languages: [''],
    licenseNumber: '',
    regionsOfExpertise: [''],
    serviceTypes: [],
    licenseDocument: null,
    educationCertificates: [],
    pricing: {
      perDay: 0
    },
    availability: [],
    isVerified: false,
    verificationStatus: 'pending',
    verificationDate: null,
    verifiedBy: null,
    rejectionReason: null
  });

  // Refs for file inputs
  const licenseInputRef = useRef(null);
  const certificateInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, default to homepage if none exists
  const from = location.state?.from || '/Home';

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(98|97)\d{8}$/;
    return phoneRegex.test(phone.trim());
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleGuideDetailsChange = (field, value, index = null) => {
    if (index !== null) {
      const updatedArray = [...guideDetails[field]];
      updatedArray[index] = value.trim();
      setGuideDetails({ ...guideDetails, [field]: updatedArray });
    } else if (field === 'pricing') {
      setGuideDetails(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          ...value
        }
      }));
    } else {
      setGuideDetails({ ...guideDetails, [field]: value });
    }
  };

  const addLanguage = () => {
    setGuideDetails({
      ...guideDetails,
      languages: [...guideDetails.languages, '']
    });
  };

  const removeLanguage = (index) => {
    const updatedLanguages = guideDetails.languages.filter((_, i) => i !== index);
    setGuideDetails({ ...guideDetails, languages: updatedLanguages });
  };

  const addRegion = () => {
    setGuideDetails({
      ...guideDetails,
      regionsOfExpertise: [...guideDetails.regionsOfExpertise, '']
    });
  };

  const removeRegion = (index) => {
    const updatedRegions = guideDetails.regionsOfExpertise.filter((_, i) => i !== index);
    setGuideDetails({ ...guideDetails, regionsOfExpertise: updatedRegions });
  };

  const handleServiceTypeChange = (serviceType) => {
    const updatedServiceTypes = guideDetails.serviceTypes.includes(serviceType)
      ? guideDetails.serviceTypes.filter(type => type !== serviceType)
      : [...guideDetails.serviceTypes, serviceType];
    setGuideDetails({ ...guideDetails, serviceTypes: updatedServiceTypes });
  };

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      
      setGuideDetails(prev => ({
        ...prev,
        licenseDocument: {
          preview: previewUrl,
          name: file.name,
          url: null
        }
      }));

      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await axios.post('http://localhost:4000/signups/upload-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.url) {
          setGuideDetails(prev => ({
            ...prev,
            licenseDocument: {
              ...prev.licenseDocument,
              url: response.data.url
            }
          }));
          toast.success("License document uploaded successfully");
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error("Failed to upload document. Please try again.");
        setGuideDetails(prev => ({
          ...prev,
          licenseDocument: null
        }));
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const handleCertificateUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped (size > 5MB)");
    }

    const newPreviews = validFiles.map(file => ({
      preview: URL.createObjectURL(file),
      name: file.name,
      url: null
    }));

    setGuideDetails(prev => ({
      ...prev,
      educationCertificates: [
        ...prev.educationCertificates,
        ...newPreviews
      ]
    }));

    const uploadPromises = validFiles.map((file, index) => {
      const formData = new FormData();
      formData.append('document', file);

      return axios.post('http://localhost:4000/signups/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(response => ({
        index,
        url: response.data.url
      }))
      .catch(error => {
        console.error('Error uploading certificate:', error);
        toast.error(`Failed to upload ${file.name}. Please try again.`);
        return {
          index,
          error: true
        };
      });
    });

    try {
      const results = await Promise.all(uploadPromises);
      
      setGuideDetails(prev => {
        const updatedCertificates = [...prev.educationCertificates];
        results.forEach(result => {
          if (!result.error) {
            updatedCertificates[result.index] = {
              ...updatedCertificates[result.index],
              url: result.url
            };
          }
        });
        return {
          ...prev,
          educationCertificates: updatedCertificates
        };
      });

      const successCount = results.filter(r => !r.error).length;
      if (successCount > 0) {
        toast.success(`${successCount} certificate(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Error in certificate uploads:', error);
    }
  };

  const removeLicenseDocument = () => {
    if (guideDetails.licenseDocument?.preview) {
      URL.revokeObjectURL(guideDetails.licenseDocument.preview);
    }
    setGuideDetails({
      ...guideDetails,
      licenseDocument: null
    });
  };

  const removeCertificate = (index) => {
    const certificate = guideDetails.educationCertificates[index];
    if (certificate?.preview) {
      URL.revokeObjectURL(certificate.preview);
    }
    setGuideDetails({
      ...guideDetails,
      educationCertificates: guideDetails.educationCertificates.filter((_, i) => i !== index)
    });
  };

  const handleAvailabilityChange = (dateIndex, slotIndex, field, value) => {
    setGuideDetails(prev => ({
      ...prev,
      availability: prev.availability.map((date, i) => {
        if (i === dateIndex) {
          if (field === 'date') {
            // Create a new Date object from the selected date
            const selectedDate = new Date(value);
            return {
              ...date,
              date: selectedDate,
              slots: date.slots
            };
          } else {
            return {
              ...date,
              slots: date.slots.map((slot, j) => 
                j === slotIndex ? { ...slot, [field]: value } : slot
              )
            };
          }
        }
        return date;
      })
    }));
  };

  const addAvailabilitySlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    setGuideDetails(prev => ({
      ...prev,
      availability: [
        ...prev.availability,
        {
          date: tomorrow,
          slots: [{ startTime: '09:00', endTime: '17:00', isBooked: false }]
        }
      ]
    }));
  };

  const removeAvailabilitySlot = (index) => {
    setGuideDetails(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  const formatDateForInput = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  // Add cleanup function for preview URLs
  useEffect(() => {
    return () => {
      // Clean up license preview URL
      if (guideDetails.licenseDocument?.preview) {
        URL.revokeObjectURL(guideDetails.licenseDocument.preview);
      }
      
      // Clean up certificate preview URLs
      guideDetails.educationCertificates.forEach(cert => {
        if (cert.preview) {
          URL.revokeObjectURL(cert.preview);
        }
      });
    };
  }, [guideDetails.licenseDocument, guideDetails.educationCertificates]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Trim all input values
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Validate first name
    if (!validateName(trimmedFirstName)) {
      toast.error("First name should contain only letters and spaces (2-50 characters)");
      setIsLoading(false);
      return;
    }

    // Validate last name
    if (!validateName(trimmedLastName)) {
      toast.error("Last name should contain only letters and spaces (2-50 characters)");
      setIsLoading(false);
      return;
    }

    // Validate email
    if (!validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Validate phone
    if (!validatePhone(trimmedPhone)) {
      toast.error("Phone number must start with 98 or 97 and contain 10 digits");
      setIsLoading(false);
      return;
    }

    // Validate password
    if (!validatePassword(trimmedPassword)) {
      toast.error("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character");
      setIsLoading(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      toast.error("You must agree to the terms and conditions");
      setIsLoading(false);
      return;
    }

    const signupData = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      phone: trimmedPhone,
      password: trimmedPassword,
      confirmPassword: trimmedConfirmPassword,
      termsAccepted,
      role: isGuide ? 'guide' : 'user',
      ...(isGuide && { 
        guideProfile: {
          ...guideDetails,
          isVerified: false,
          verificationStatus: 'pending',
          verificationDate: null,
          verifiedBy: null,
          rejectionReason: null
        }
      })
    };

    axios.post("http://localhost:4000/signups", signupData)
      .then((response) => {
        toast.success("Registration successful. An OTP has been sent to your email.");
        setIsOtpSent(true);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || 'Error during signup. Please try again.');
        setIsLoading(false);
      });
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsOtpLoading(true);

    try {
      const response = await axios.post("http://localhost:4000/signups/verify-otp", { 
        email, 
        otp,
        guideProfile: isGuide ? guideDetails : null // Include guide profile if user is a guide
      });

      if (response.data.message) {
        toast.success("Account created successfully! Please login to continue.");
        navigate('/login');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        toast.error("Unable to connect to the server. Please try again later.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred during OTP verification. Please try again.");
      }
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <>
      <div className="logo1"></div>
      <div className="main-container1">
        <div className="card1">
          <h1 className="title1">Create an Account</h1>
          <p className="subtitle1">Sign up to explore amazing destinations.</p>

          {!isOtpSent ? (
            <form onSubmit={handleSubmit}>
              <div className="input-row0">
                <div className="input-group0">
                  <label htmlFor="first-name">First Name</label>
                  <input
                    type="text"
                    id="first-name"
                    className="input-field0"
                    name="firstName"
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="input-group0">
                  <label htmlFor="last-name">Last Name</label>
                  <input
                    type="text"
                    id="last-name"
                    className="input-field0"
                    name="lastName"
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              <div className="input-row0">
                <div className="input-group0">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="input-field0"
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>
                <div className="input-group0">
                  <label htmlFor="phone">Phone No.</label>
                  <input
                    type="tel"
                    id="phone"
                    className="input-field0"
                    name="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    required
                  />
                </div>
              </div>

              <div className="input-row0">
                <div className="input-group0">
                  <label htmlFor="password">Password</label>
                  <div className="password-field">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      className="input-field0"
                      name="password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-icon inside"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
                <div className="input-group0">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <div className="password-field">
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      id="confirm-password"
                      className="input-field0"
                      name="confirmPassword"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-icon inside"
                      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    >
                      {confirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="role-selection-section">
                <p className="role-message">
                  Choose your role: Continue as a regular user or check below to become a guide and share your expertise!
                </p>
                <div className="guide-checkbox">
                  <input
                    type="checkbox"
                    id="guide-checkbox"
                    checked={isGuide}
                    onChange={(e) => setIsGuide(e.target.checked)}
                  />
                  <label htmlFor="guide-checkbox">
                    I want to register as a Guide
                  </label>
                </div>
              </div>

              {isGuide && (
                <div className="guide-details">
                  <h3 className="guide-title">Guide Information</h3>
                  
                  <div className="languages-section">
                    <label>Languages Spoken</label>
                    {guideDetails.languages.map((language, index) => (
                      <div key={index} className="input-with-remove">
                        <input
                          type="text"
                          value={language}
                          onChange={(e) => handleGuideDetailsChange('languages', e.target.value, index)}
                          placeholder="Language"
                        />
                        {guideDetails.languages.length > 1 && (
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeLanguage(index)}
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="add-button" onClick={addLanguage}>
                      <FiPlus /> Add Language
                    </button>
                  </div>

                  <div className="license-section">
                    <label>License Number</label>
                    <input
                      type="text"
                      value={guideDetails.licenseNumber}
                      onChange={(e) => handleGuideDetailsChange('licenseNumber', e.target.value)}
                      placeholder="Enter your guide license number"
                      className="input-field0"
                    />
                    
                    <div className="document-upload">
                      <label>License Document</label>
                      <input
                        type="file"
                        ref={licenseInputRef}
                        className="document-upload-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleLicenseUpload}
                      />
                      <button
                        type="button"
                        className="upload-button1"
                        onClick={() => licenseInputRef.current.click()}
                      >
                        <FiUpload /> Upload License Document
                      </button>
                      {/* License Document Preview */}
                      {guideDetails.licenseDocument && (
                        <div className="document-preview">
                          <div className="preview-header">
                            <span>License Document</span>
                            <button
                              type="button"
                              className="remove-file"
                              onClick={removeLicenseDocument}
                            >
                              <FiX />
                            </button>
                          </div>
                          <div className="preview-content">
                            {guideDetails.licenseDocument.preview ? (
                              <img 
                                src={guideDetails.licenseDocument.preview} 
                                alt="License Document Preview" 
                                className="preview-image"
                              />
                            ) : (
                              <div className="preview-placeholder">
                                <FiUpload />
                                <span>Document uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="regions-section">
                    <label>Regions of Expertise</label>
                    {guideDetails.regionsOfExpertise.map((region, index) => (
                      <div key={index} className="input-with-remove">
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => handleGuideDetailsChange('regionsOfExpertise', e.target.value, index)}
                          placeholder="Region (e.g., Kathmandu, Pokhara)"
                        />
                        {guideDetails.regionsOfExpertise.length > 1 && (
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeRegion(index)}
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="add-button" onClick={addRegion}>
                      <FiPlus /> Add Region
                    </button>
                  </div>

                  <div className="document-upload">
                    <label>Education Certificates</label>
                    <input
                      type="file"
                      ref={certificateInputRef}
                      className="document-upload-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleCertificateUpload}
                    />
                    <button
                      type="button"
                      className="upload-button1"
                      onClick={() => certificateInputRef.current.click()}
                    >
                      <FiUpload /> Upload Certificates
                    </button>
                    {/* Certificate Previews */}
                    {guideDetails.educationCertificates.length > 0 && (
                      <div className="certificates-preview">
                        <h4>Uploaded Certificates</h4>
                        <div className="preview-grid">
                          {guideDetails.educationCertificates.map((cert, index) => (
                            <div key={index} className="document-preview">
                              <div className="preview-header">
                                <span>{cert.name || `Certificate ${index + 1}`}</span>
                                <button
                                  type="button"
                                  className="remove-file"
                                  onClick={() => removeCertificate(index)}
                                >
                                  <FiX />
                                </button>
                              </div>
                              <div className="preview-content">
                                {cert.preview ? (
                                  <img 
                                    src={cert.preview} 
                                    alt={`Certificate ${index + 1} Preview`} 
                                    className="preview-image"
                                  />
                                ) : (
                                  <div className="preview-placeholder">
                                    <FiUpload />
                                    <span>Document uploaded</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="service-types">
                    <label>Service Types</label>
                    <div className="service-checkboxes">
                      {['Trekking', 'Cultural Tour', 'City Tour', 'Wildlife Safari'].map((type) => (
                        <label key={type} className="service-checkbox">
                          <input
                            type="checkbox"
                            checked={guideDetails.serviceTypes.includes(type)}
                            onChange={() => handleServiceTypeChange(type)}
                          />
                          <span className="checkmark"></span>
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pricing-section">
                    <h4>Pricing Information</h4>
                    <div className="input-group0">
                      <label>Price per Day (NPR)</label>
                      <input
                        type="number"
                        value={guideDetails.pricing.perDay}
                        onChange={(e) => handleGuideDetailsChange('pricing', { perDay: Number(e.target.value) })}
                        placeholder="Enter price per day"
                        min="0"
                        className="input-field0"
                      />
                    </div>
                  </div>

                  <div className="availability-section">
                    <h4>Availability</h4>
                    {guideDetails.availability.map((dateSlot, dateIndex) => (
                      <div key={dateIndex} className="availability-item">
                        <div className="date-header">
                          <input
                            type="date"
                            value={formatDateForInput(dateSlot.date)}
                            onChange={(e) => handleAvailabilityChange(dateIndex, 0, 'date', e.target.value)}
                            className="input-field0"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeAvailabilitySlot(dateIndex)}
                          >
                            <FiX />
                          </button>
                        </div>
                        {dateSlot.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="time-slot">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => handleAvailabilityChange(dateIndex, slotIndex, 'startTime', e.target.value)}
                              className="input-field0"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => handleAvailabilityChange(dateIndex, slotIndex, 'endTime', e.target.value)}
                              className="input-field0"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    <button type="button" className="add-button" onClick={addAvailabilitySlot}>
                      <FiPlus /> Add Availability
                    </button>
                  </div>
                </div>
              )}

              <div className="terms1">
                <input
                  type="checkbox"
                  id="terms"
                  name="termsAccepted"
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="terms" className="agree-terms-conditions1">
                  I agree to the Terms & Conditions
                </label>
              </div>

              <button className="submit-button1" type="submit" disabled={isLoading}>
                {isLoading ? "Signing Up..." : "Sign up"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="input-group01">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  className="input-field01"
                  name="otp"
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="######"
                  required
                />
              </div>

              <button className="submit-button1" type="submit" disabled={isOtpLoading}>
                {isOtpLoading ? "Verifying OTP..." : "Verify OTP"}
              </button>
            </form>
          )}

          <p className="or1">or</p>
          <div className="login-link1">
            <span className="have-account1">Already have an account? </span>
            <Link to="/login" state={{ from }} className="login-here1">Login here</Link>
          </div>
        </div>
      </div>
      <AuthFooter />
    </>
  );
}
