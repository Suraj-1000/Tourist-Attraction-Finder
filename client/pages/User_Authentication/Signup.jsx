import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Signup.css";
import axios from "axios";
import { FiEye, FiEyeOff, FiPlus, FiX, FiUpload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import AuthFooter from "../../components/Footer/AuthFooter";

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
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    termsAccepted: '',
    profileImage: '',
    licenseNumber: '',
    languages: [''],
    regionsOfExpertise: [''],
    serviceTypes: '',
    licenseDocument: '',
    pricing: '',
    educationCertificates: '',
  });

  // Form validation states
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    dateOfBirth: false,
    address: false,
    gender: false,
    termsAccepted: false,
    profileImage: false,
    licenseNumber: false,
    languages: [false],
    regionsOfExpertise: [false],
    serviceTypes: false,
    licenseDocument: false,
    pricing: false,
    educationCertificates: false,
  });

  // Valid states
  const [valid, setValid] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    dateOfBirth: false,
    address: false,
    gender: false,
    termsAccepted: false,
    profileImage: false,
    licenseNumber: false,
    languages: [false],
    regionsOfExpertise: [false],
    serviceTypes: false,
    licenseDocument: false,
    pricing: false,
    educationCertificates: false,
  });
  
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
    isAvailable: true,
    isVerified: false,
    verificationStatus: 'pending',
    verificationDate: null,
    verifiedBy: null,
    rejectionReason: null
  });

  // Refs for file inputs
  const licenseInputRef = useRef(null);
  const certificateInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, default to homepage if none exists
  const from = location.state?.from || '/Home';

  // Refs for error fields
  const fieldRefs = useRef({
    firstName: useRef(null),
    lastName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    gender: useRef(null),
    dateOfBirth: useRef(null),
    address: useRef(null),
    profileImage: useRef(null),
    licenseNumber: useRef(null),
    languages: useRef([]),
    regionsOfExpertise: useRef([]),
    serviceTypes: useRef(null),
    licenseDocument: useRef(null),
    pricing: useRef(null),
    termsAccepted: useRef(null),
    educationCertificates: useRef(null),
  });

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    if (!nameRegex.test(name.trim())) return "Name should contain only letters and spaces (2-50 characters)";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Phone number is required";
    if (phone.length !== 10) return "Phone number must be exactly 10 digits";
    const phoneRegex = /^(98|97)\d{8}$/;
    if (!phoneRegex.test(phone.trim())) return "Phone must start with 98 or 97 followed by 8 digits";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) return "Password must have at least 8 characters, one uppercase, one lowercase, one number, and one special character";
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return "Date of birth is required";
    
    const dobDate = new Date(dob);
    const today = new Date();
    
    // Check if date is invalid
    if (isNaN(dobDate.getTime())) return "Invalid date format";
    
    // Check if date is in the future
    if (dobDate > today) return "Date of birth cannot be in the future";
    
    // Calculate age
    const age = Math.floor((today - dobDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Check if user is at least 16 years old
    if (age < 16) return "You must be at least 16 years old to register";
    
    return "";
  };

  const validateAddress = (address) => {
    if (!address.trim()) return "Address is required";
    return "";
  };

  const validateGender = (gender) => {
    if (!gender) return "Please select your gender";
    return "";
  };

  const validateTerms = (accepted) => {
    if (!accepted) return "You must agree to the terms and conditions";
    return "";
  };

  const validateProfileImage = (image) => {
    if (!image || !image.url) return "Profile image is required";
    return "";
  };

  const validateLicenseNumber = (licenseNumber) => {
    if (!licenseNumber.trim()) return "License number is required";
    // License number must include letters, numbers and can have "-" or "/"
    const licenseRegex = /^[a-zA-Z0-9\-\/]+$/;
    if (!licenseRegex.test(licenseNumber.trim())) return "License number can only contain letters, numbers, hyphens (-) and slashes (/)";
    return "";
  };

  const validateLanguage = (language) => {
    if (!language.trim()) return "Language is required";
    const languageRegex = /^[a-zA-Z\s]+$/;
    if (!languageRegex.test(language.trim())) return "Language should contain only letters and spaces";
    return "";
  };

  const validateRegion = (region) => {
    if (!region.trim()) return "Region is required";
    const regionRegex = /^[a-zA-Z\s]+$/;
    if (!regionRegex.test(region.trim())) return "Region should contain only letters and spaces";
    return "";
  };

  const validateServiceTypes = (serviceTypes) => {
    if (!serviceTypes || serviceTypes.length === 0) return "At least one service type is required";
    return "";
  };

  const validateLicenseDocument = (doc) => {
    if (!doc || !doc.url) return "License document is required";
    return "";
  };

  const validatePricing = (price) => {
    if (!price || price <= 0) return "Price must be greater than 0";
    return "";
  };

  const validateEducationCertificates = (certificates) => {
    if (!certificates || certificates.length === 0) return "At least one education certificate is required";
    return "";
  };

  // Function to handle input blur (when input loses focus)
  const handleBlur = (field, index = null) => {
    if (index !== null) {
      // For array fields like languages and regions
      const newTouched = { ...touched };
      if (!newTouched[field][index]) {
        newTouched[field][index] = true;
        setTouched(newTouched);
        validateField(field, index);
      }
    } else {
      // For regular fields
      if (!touched[field]) {
        setTouched({ ...touched, [field]: true });
        validateField(field);
      }
    }
  };

  // Function to validate a specific field
  const validateField = (field, index = null) => {
    let errorMessage = "";
    let isValid = false;
    
    if (index !== null) {
      // Handle array fields
      switch (field) {
        case 'languages':
          errorMessage = validateLanguage(guideDetails.languages[index]);
          isValid = errorMessage === "";
          
          const languageErrors = [...errors.languages];
          languageErrors[index] = errorMessage;
          setErrors(prev => ({ ...prev, languages: languageErrors }));
          
          const languageValids = [...valid.languages];
          languageValids[index] = isValid;
          setValid(prev => ({ ...prev, languages: languageValids }));
          break;
          
        case 'regionsOfExpertise':
          errorMessage = validateRegion(guideDetails.regionsOfExpertise[index]);
          isValid = errorMessage === "";
          
          const regionErrors = [...errors.regionsOfExpertise];
          regionErrors[index] = errorMessage;
          setErrors(prev => ({ ...prev, regionsOfExpertise: regionErrors }));
          
          const regionValids = [...valid.regionsOfExpertise];
          regionValids[index] = isValid;
          setValid(prev => ({ ...prev, regionsOfExpertise: regionValids }));
          break;
          
        default:
          break;
      }
      return;
    }
    
    // Handle regular fields
    switch (field) {
      case 'firstName':
        errorMessage = validateName(firstName);
        isValid = errorMessage === "";
        break;
        
      case 'lastName':
        errorMessage = validateName(lastName);
        isValid = errorMessage === "";
        break;
        
      case 'email':
        errorMessage = validateEmail(email);
        isValid = errorMessage === "";
        break;
        
      case 'phone':
        errorMessage = validatePhone(phone);
        isValid = errorMessage === "";
        break;
        
      case 'password':
        errorMessage = validatePassword(password);
        isValid = errorMessage === "";
        
        // Also validate confirmPassword when password changes
        if (touched.confirmPassword) {
          const confirmError = validateConfirmPassword(password, confirmPassword);
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
          setValid(prev => ({ ...prev, confirmPassword: confirmError === "" }));
        }
        break;
        
      case 'confirmPassword':
        errorMessage = validateConfirmPassword(password, confirmPassword);
        isValid = errorMessage === "";
        break;
        
      case 'dateOfBirth':
        errorMessage = validateDateOfBirth(dateOfBirth);
        isValid = errorMessage === "";
        break;
        
      case 'address':
        errorMessage = validateAddress(address);
        isValid = errorMessage === "";
        break;
        
      case 'gender':
        errorMessage = validateGender(gender);
        isValid = errorMessage === "";
        break;
        
      case 'termsAccepted':
        errorMessage = validateTerms(termsAccepted);
        isValid = errorMessage === "";
        break;
        
      case 'profileImage':
        errorMessage = validateProfileImage(profileImage);
        isValid = errorMessage === "";
        break;
        
      case 'licenseNumber':
        errorMessage = validateLicenseNumber(guideDetails.licenseNumber);
        isValid = errorMessage === "";
        break;
        
      case 'serviceTypes':
        errorMessage = validateServiceTypes(guideDetails.serviceTypes);
        isValid = errorMessage === "";
        break;
        
      case 'licenseDocument':
        errorMessage = validateLicenseDocument(guideDetails.licenseDocument);
        isValid = errorMessage === "";
        break;
        
      case 'pricing':
        errorMessage = validatePricing(guideDetails.pricing.perDay);
        isValid = errorMessage === "";
        break;
        
      case 'educationCertificates':
        errorMessage = validateEducationCertificates(guideDetails.educationCertificates);
        isValid = errorMessage === "";
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    setValid(prev => ({ ...prev, [field]: isValid }));
  };

  // Helper functions for styling inputs based on validation
  const getInputStyle = (field) => {
    if (!touched[field]) return {};
    return {
      borderColor: errors[field] ? '#e63946' : valid[field] ? '#28a745' : '#cccccc'
    };
  };

  const getArrayInputStyle = (field, index) => {
    if (!touched[field][index]) return {};
    return {
      borderColor: errors[field][index] ? '#e63946' : valid[field][index] ? '#28a745' : '#cccccc'
    };
  };

  const handleGuideDetailsChange = (field, value, index = null) => {
    if (index !== null) {
      const updatedArray = [...guideDetails[field]];
      updatedArray[index] = value.trim();
      setGuideDetails({ ...guideDetails, [field]: updatedArray });
      
      // Update corresponding touched state if not already touched
      if (!touched[field][index]) {
        const newTouched = { ...touched };
        newTouched[field][index] = true;
        setTouched(newTouched);
      }
      
      // Validate the field
      setTimeout(() => validateField(field, index), 0);
    } else if (field === 'pricing') {
      setGuideDetails(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          ...value
        }
      }));
      
      // Set touched state for pricing
      if (!touched.pricing) {
        setTouched({ ...touched, pricing: true });
      }
      
      // Validate pricing immediately
      setTimeout(() => validateField('pricing'), 0);
    } else {
      setGuideDetails({ ...guideDetails, [field]: value });
      
      // Set touched state for the field
      if (!touched[field]) {
        setTouched({ ...touched, [field]: true });
      }
      
      // Validate the field
      setTimeout(() => validateField(field), 0);
    }
  };

  const addLanguage = () => {
    setGuideDetails({
      ...guideDetails,
      languages: [...guideDetails.languages, '']
    });
    
    // Update errors and valid arrays
    setErrors(prev => ({
      ...prev,
      languages: [...prev.languages, '']
    }));
    
    setValid(prev => ({
      ...prev,
      languages: [...prev.languages, false]
    }));
    
    setTouched(prev => ({
      ...prev,
      languages: [...prev.languages, false]
    }));
  };

  const removeLanguage = (index) => {
    const updatedLanguages = guideDetails.languages.filter((_, i) => i !== index);
    setGuideDetails({ ...guideDetails, languages: updatedLanguages });
    
    // Update errors, valid and touched arrays
    setErrors(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
    
    setValid(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
    
    setTouched(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addRegion = () => {
    setGuideDetails({
      ...guideDetails,
      regionsOfExpertise: [...guideDetails.regionsOfExpertise, '']
    });
    
    // Update errors and valid arrays
    setErrors(prev => ({
      ...prev,
      regionsOfExpertise: [...prev.regionsOfExpertise, '']
    }));
    
    setValid(prev => ({
      ...prev,
      regionsOfExpertise: [...prev.regionsOfExpertise, false]
    }));
    
    setTouched(prev => ({
      ...prev,
      regionsOfExpertise: [...prev.regionsOfExpertise, false]
    }));
  };

  const removeRegion = (index) => {
    const updatedRegions = guideDetails.regionsOfExpertise.filter((_, i) => i !== index);
    setGuideDetails({ ...guideDetails, regionsOfExpertise: updatedRegions });
    
    // Update errors, valid and touched arrays
    setErrors(prev => ({
      ...prev,
      regionsOfExpertise: prev.regionsOfExpertise.filter((_, i) => i !== index)
    }));
    
    setValid(prev => ({
      ...prev,
      regionsOfExpertise: prev.regionsOfExpertise.filter((_, i) => i !== index)
    }));
    
    setTouched(prev => ({
      ...prev,
      regionsOfExpertise: prev.regionsOfExpertise.filter((_, i) => i !== index)
    }));
  };

  const handleServiceTypeChange = (serviceType) => {
    const currentTypes = [...guideDetails.serviceTypes];
    if (currentTypes.includes(serviceType)) {
      setGuideDetails({
        ...guideDetails,
        serviceTypes: currentTypes.filter(type => type !== serviceType)
      });
    } else {
      setGuideDetails({
        ...guideDetails,
        serviceTypes: [...currentTypes, serviceType]
      });
    }
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
      
      // Set touched state for licenseDocument
      if (!touched.licenseDocument) {
        setTouched({ ...touched, licenseDocument: true });
      }

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
          
          // Validate licenseDocument
          setTimeout(() => validateField('licenseDocument'), 0);
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
    // No validation needed for certificates as they are not required
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
    
    // Set touched state for educationCertificates
    if (!touched.educationCertificates) {
      setTouched(prev => ({ ...prev, educationCertificates: true }));
    }

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
      
      // Validate education certificates after upload
      setTimeout(() => validateField('educationCertificates'), 0);
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
    
    // Update validation
    setErrors(prev => ({ ...prev, licenseDocument: 'License document is required' }));
    setValid(prev => ({ ...prev, licenseDocument: false }));
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
    
    // Validate education certificates after removal
    setTimeout(() => validateField('educationCertificates'), 0);
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      
      setProfileImage({
        preview: previewUrl,
        name: file.name,
        url: null
      });
      
      // Set touched state for profileImage
      if (!touched.profileImage) {
        setTouched({ ...touched, profileImage: true });
      }

      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await axios.post('http://localhost:4000/signups/upload-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.url) {
          setProfileImage(prev => ({
            ...prev,
            url: response.data.url
          }));
          toast.success("Profile image uploaded successfully");
          
          // Validate profileImage
          setTimeout(() => validateField('profileImage'), 0);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error("Failed to upload image. Please try again.");
        setProfileImage(null);
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const removeProfileImage = () => {
    if (profileImage?.preview) {
      URL.revokeObjectURL(profileImage.preview);
    }
    setProfileImage(null);
    
    // Update validation
    setErrors(prev => ({ ...prev, profileImage: 'Profile image is required' }));
    setValid(prev => ({ ...prev, profileImage: false }));
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

      // Clean up profile image preview URL
      if (profileImage?.preview) {
        URL.revokeObjectURL(profileImage.preview);
      }
    };
  }, [guideDetails.licenseDocument, guideDetails.educationCertificates, profileImage]);

  // Validate all fields
  const validateAllFields = () => {
    // Regular fields validation
    const firstNameError = validateName(firstName);
    const lastNameError = validateName(lastName);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    const termsError = validateTerms(termsAccepted);
    
    // Update errors and valid states
    setErrors(prev => ({
      ...prev,
      firstName: firstNameError,
      lastName: lastNameError,
      email: emailError,
      phone: phoneError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      termsAccepted: termsError
    }));
    
    setValid(prev => ({
      ...prev,
      firstName: firstNameError === "",
      lastName: lastNameError === "",
      email: emailError === "",
      phone: phoneError === "",
      password: passwordError === "",
      confirmPassword: confirmPasswordError === "",
      termsAccepted: termsError === ""
    }));
    
    // Set all fields as touched
    setTouched(prev => ({
      ...prev,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      termsAccepted: true
    }));
    
    // Basic validation for all users
    let isValid = !firstNameError && !lastNameError && !emailError && 
                  !phoneError && !passwordError && !confirmPasswordError && 
                  !termsError;
    
    // Additional validation for guides
    if (isGuide) {
      const dobError = validateDateOfBirth(dateOfBirth);
      const addressError = validateAddress(address);
      const genderError = validateGender(gender);
      const profileImageError = validateProfileImage(profileImage);
      const licenseNumberError = validateLicenseNumber(guideDetails.licenseNumber);
      const serviceTypesError = validateServiceTypes(guideDetails.serviceTypes);
      const licenseDocumentError = validateLicenseDocument(guideDetails.licenseDocument);
      const certificatesError = validateEducationCertificates(guideDetails.educationCertificates);
      
      // Validate pricing
      let pricingError = '';
      if (!guideDetails.pricing || !guideDetails.pricing.perDay) {
        pricingError = "Price per day is required";
      } else if (guideDetails.pricing.perDay <= 0) {
        pricingError = "Price must be greater than zero";
      }
      
      // Update errors and valid states for guide fields
      setErrors(prev => ({
        ...prev,
        dateOfBirth: dobError,
        address: addressError,
        gender: genderError,
        profileImage: profileImageError,
        licenseNumber: licenseNumberError,
        serviceTypes: serviceTypesError,
        licenseDocument: licenseDocumentError,
        pricing: pricingError,
        educationCertificates: certificatesError
      }));
      
      setValid(prev => ({
        ...prev,
        dateOfBirth: dobError === "",
        address: addressError === "",
        gender: genderError === "",
        profileImage: profileImageError === "",
        licenseNumber: licenseNumberError === "",
        serviceTypes: serviceTypesError === "",
        licenseDocument: licenseDocumentError === "",
        pricing: pricingError === "",
        educationCertificates: certificatesError === ""
      }));
      
      // Set guide fields as touched
      setTouched(prev => ({
        ...prev,
        dateOfBirth: true,
        address: true,
        gender: true,
        profileImage: true,
        licenseNumber: true,
        serviceTypes: true,
        licenseDocument: true,
        pricing: true,
        educationCertificates: true
      }));
      
      // Validate languages
      const languageErrors = [];
      const languageValids = [];
      const languageTouched = [];
      
      guideDetails.languages.forEach((lang, index) => {
        const error = validateLanguage(lang);
        languageErrors[index] = error;
        languageValids[index] = error === "";
        languageTouched[index] = true;
      });
      
      // Validate regions
      const regionErrors = [];
      const regionValids = [];
      const regionTouched = [];
      
      guideDetails.regionsOfExpertise.forEach((region, index) => {
        const error = validateRegion(region);
        regionErrors[index] = error;
        regionValids[index] = error === "";
        regionTouched[index] = true;
      });
      
      // Update arrays
      setErrors(prev => ({
        ...prev,
        languages: languageErrors,
        regionsOfExpertise: regionErrors
      }));
      
      setValid(prev => ({
        ...prev,
        languages: languageValids,
        regionsOfExpertise: regionValids
      }));
      
      setTouched(prev => ({
        ...prev,
        languages: languageTouched,
        regionsOfExpertise: regionTouched
      }));
      
      // Check if any language or region has error
      const hasLanguageError = languageErrors.some(error => error !== "");
      const hasRegionError = regionErrors.some(error => error !== "");
      
      // Update isValid for guide
      isValid = isValid && !dobError && !addressError && !genderError && 
                !profileImageError && !licenseNumberError && !serviceTypesError && 
                !licenseDocumentError && !pricingError && !certificatesError &&
                !hasLanguageError && !hasRegionError;
    }
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isValid = validateAllFields();
    
    if (!isValid) {
      // Find first error field and scroll to it
      const errorFields = Object.entries(errors).filter(([field, error]) => {
        if (Array.isArray(error)) {
          return error.some(err => err !== "");
        }
        return error !== "";
      });
      
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0][0];
        
        // Handle array fields
        if (Array.isArray(errors[firstErrorField])) {
          const errorIndex = errors[firstErrorField].findIndex(err => err !== "");
          if (errorIndex !== -1 && fieldRefs.current[firstErrorField].current[errorIndex]) {
            fieldRefs.current[firstErrorField].current[errorIndex].scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            toast.error(`Please correct the ${firstErrorField} field`);
          }
        } else if (fieldRefs.current[firstErrorField]?.current) {
          // Handle regular fields
          fieldRefs.current[firstErrorField].current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          toast.error(`Please correct the ${firstErrorField.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        } else {
          toast.error("Please correct the errors in the form");
        }
      } else {
        toast.error("Please correct the errors in the form");
      }
      return;
    }
    
    setIsLoading(true);

    // Trim all input values
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    const trimmedAddress = address.trim();

    const signupData = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      phone: trimmedPhone,
      password: trimmedPassword,
      confirmPassword: confirmPassword,
      termsAccepted,
      role: isGuide ? 'guide' : 'user',
      ...(isGuide && {
        gender,
        dateOfBirth: new Date(dateOfBirth),
        address: trimmedAddress,
        image: profileImage.url,
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
    
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }
    
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
    
    setPhone(value);
    setTouched(prev => ({ ...prev, phone: true }));
    
    // Validate phone immediately
    const phoneError = validatePhone(value);
    setErrors(prev => ({ ...prev, phone: phoneError }));
    setValid(prev => ({ ...prev, phone: phoneError === "" }));
  };

  const handleGenderChange = (value) => {
    setGender(value);
    setTouched(prev => ({ ...prev, gender: true }));
    setTimeout(() => {
      const genderError = validateGender(value);
      setErrors(prev => ({ ...prev, gender: genderError }));
      setValid(prev => ({ ...prev, gender: genderError === "" }));
    }, 0);
  };

  // Add handlers for immediate validation on field changes
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    setTouched(prev => ({ ...prev, firstName: true }));
    const error = validateName(value);
    setErrors(prev => ({ ...prev, firstName: error }));
    setValid(prev => ({ ...prev, firstName: error === "" }));
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    setTouched(prev => ({ ...prev, lastName: true }));
    const error = validateName(value);
    setErrors(prev => ({ ...prev, lastName: error }));
    setValid(prev => ({ ...prev, lastName: error === "" }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setTouched(prev => ({ ...prev, email: true }));
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error }));
    setValid(prev => ({ ...prev, email: error === "" }));
  };

  // Add handlers for password fields
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setTouched(prev => ({ ...prev, password: true }));
    
    // Validate password
    const passwordError = validatePassword(value);
    setErrors(prev => ({ ...prev, password: passwordError }));
    setValid(prev => ({ ...prev, password: passwordError === "" }));
    
    // If confirm password is already touched, validate it too
    if (touched.confirmPassword) {
      const confirmError = validateConfirmPassword(value, confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      setValid(prev => ({ ...prev, confirmPassword: confirmError === "" }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    
    // Validate confirm password
    const confirmError = validateConfirmPassword(password, value);
    setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    setValid(prev => ({ ...prev, confirmPassword: confirmError === "" }));
  };

  // Add handler for date of birth
  const handleDateOfBirthChange = (e) => {
    const value = e.target.value;
    setDateOfBirth(value);
    setTouched(prev => ({ ...prev, dateOfBirth: true }));
    
    // Validate date of birth
    const dobError = validateDateOfBirth(value);
    setErrors(prev => ({ ...prev, dateOfBirth: dobError }));
    setValid(prev => ({ ...prev, dateOfBirth: dobError === "" }));
  };

  // Add handler for address
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setTouched(prev => ({ ...prev, address: true }));
    
    // Validate address
    const addressError = validateAddress(value);
    setErrors(prev => ({ ...prev, address: addressError }));
    setValid(prev => ({ ...prev, address: addressError === "" }));
  };

  // Add handler for terms acceptance
  const handleTermsChange = (e) => {
    const checked = e.target.checked;
    setTermsAccepted(checked);
    setTouched(prev => ({ ...prev, termsAccepted: true }));
    
    // Validate terms
    const termsError = validateTerms(checked);
    setErrors(prev => ({ ...prev, termsAccepted: termsError }));
    setValid(prev => ({ ...prev, termsAccepted: termsError === "" }));
  };

  // Ensure language refs are updated when languages are added or removed
  useEffect(() => {
    fieldRefs.current.languages.current = Array(guideDetails.languages.length).fill().map((_, i) => fieldRefs.current.languages.current[i] || React.createRef());
  }, [guideDetails.languages.length]);

  // Ensure region refs are updated when regions are added or removed
  useEffect(() => {
    fieldRefs.current.regionsOfExpertise.current = Array(guideDetails.regionsOfExpertise.length).fill().map((_, i) => fieldRefs.current.regionsOfExpertise.current[i] || React.createRef());
  }, [guideDetails.regionsOfExpertise.length]);

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
                <div className="input-group0" ref={fieldRefs.current.firstName}>
                  <label htmlFor="first-name">
                    First Name <span className="required-field">*</span>
                  </label>
                  <input
                    type="text"
                    id="first-name"
                    className="input-field0"
                    name="firstName"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    onBlur={() => handleBlur('firstName')}
                    style={getInputStyle('firstName')}
                    placeholder="First Name"
                    required
                  />
                  {touched.firstName && errors.firstName ? (
                    <div className="error-message01">{errors.firstName}</div>
                  ) : touched.firstName && valid.firstName ? (
                    <div className="valid-message">First name is valid</div>
                  ) : null}
                </div>
                <div className="input-group0" ref={fieldRefs.current.lastName}>
                  <label htmlFor="last-name">
                    Last Name <span className="required-field">*</span>
                  </label>
                  <input
                    type="text"
                    id="last-name"
                    className="input-field0"
                    name="lastName"
                    value={lastName}
                    onChange={handleLastNameChange}
                    onBlur={() => handleBlur('lastName')}
                    style={getInputStyle('lastName')}
                    placeholder="Last Name"
                    required
                  />
                  {touched.lastName && errors.lastName ? (
                    <div className="error-message01">{errors.lastName}</div>
                  ) : touched.lastName && valid.lastName ? (
                    <div className="valid-message">Last name is valid</div>
                  ) : null}
                </div>
              </div>

              <div className="input-row0">
                <div className="input-group0" ref={fieldRefs.current.email}>
                  <label htmlFor="email">
                    Email <span className="required-field">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input-field0"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur('email')}
                    style={getInputStyle('email')}
                    placeholder="Email"
                    required
                  />
                  {touched.email && errors.email ? (
                    <div className="error-message01">{errors.email}</div>
                  ) : touched.email && valid.email ? (
                    <div className="valid-message">Email is valid</div>
                  ) : null}
                </div>
                <div className="input-group0" ref={fieldRefs.current.phone}>
                  <label htmlFor="phone">
                    Phone No. <span className="required-field">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="input-field0"
                    name="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => handleBlur('phone')}
                    style={getInputStyle('phone')}
                    placeholder="Phone Number (e.g., 9812345678)"
                    maxLength={10}
                    required
                  />
                  {touched.phone && errors.phone ? (
                    <div className="error-message01">{errors.phone}</div>
                  ) : touched.phone && valid.phone ? (
                    <div className="valid-message">Phone number is valid</div>
                  ) : null}
                </div>
              </div>

              <div className="input-row0">
                <div className="input-group0" ref={fieldRefs.current.password}>
                  <label htmlFor="password">
                    Password <span className="required-field">*</span>
                  </label>
                  <div className="password-field">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      className="input-field0"
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur('password')}
                      style={getInputStyle('password')}
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
                  {touched.password && errors.password ? (
                    <div className="error-message01">{errors.password}</div>
                  ) : touched.password && valid.password ? (
                    <div className="valid-message">Password is valid</div>
                  ) : null}
                </div>
                <div className="input-group0" ref={fieldRefs.current.confirmPassword}>
                  <label htmlFor="confirm-password">
                    Confirm Password <span className="required-field">*</span>
                  </label>
                  <div className="password-field">
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      id="confirm-password"
                      className="input-field0"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      style={getInputStyle('confirmPassword')}
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
                  {touched.confirmPassword && errors.confirmPassword ? (
                    <div className="error-message01">{errors.confirmPassword}</div>
                  ) : touched.confirmPassword && valid.confirmPassword ? (
                    <div className="valid-message">Passwords match</div>
                  ) : null}
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
                  
                  {/* Personal Information Section */}
                  <div className="personal-info-section">
                    <h4>Personal Information</h4>
                    
                    <div className="gender-selection" ref={fieldRefs.current.gender}>
                      <label>
                        Gender <span className="required-field">*</span>
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={gender === "Male"}
                            onChange={() => handleGenderChange("Male")}
                            required={isGuide}
                          />
                          <span className="radio-label">Male</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={gender === "Female"}
                            onChange={() => handleGenderChange("Female")}
                            required={isGuide}
                          />
                          <span className="radio-label">Female</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="gender"
                            value="Others"
                            checked={gender === "Others"}
                            onChange={() => handleGenderChange("Others")}
                            required={isGuide}
                          />
                          <span className="radio-label">Others</span>
                        </label>
                      </div>
                      {touched.gender && errors.gender ? (
                        <div className="error-message01">{errors.gender}</div>
                      ) : touched.gender && valid.gender ? (
                        <div className="valid-message">Gender is selected</div>
                      ) : null}
                    </div>
                    
                    <div className="input-group0" ref={fieldRefs.current.dateOfBirth}>
                      <label htmlFor="dateOfBirth">
                        Date of Birth <span className="required-field">*</span>
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        className="input-field0"
                        value={dateOfBirth}
                        onChange={handleDateOfBirthChange}
                        onBlur={() => handleBlur('dateOfBirth')}
                        style={getInputStyle('dateOfBirth')}
                        max={new Date().toISOString().split('T')[0]}
                        required={isGuide}
                      />
                      {touched.dateOfBirth && errors.dateOfBirth ? (
                        <div className="error-message01">{errors.dateOfBirth}</div>
                      ) : touched.dateOfBirth && valid.dateOfBirth ? (
                        <div className="valid-message">Date of birth is valid</div>
                      ) : null}
                    </div>
                    
                    <div className="input-group0" ref={fieldRefs.current.address}>
                      <label htmlFor="address">
                        Address <span className="required-field">*</span>
                      </label>
                      <input
                        type="text"
                        id="address"
                        className="input-field0"
                        value={address}
                        onChange={handleAddressChange}
                        onBlur={() => handleBlur('address')}
                        style={getInputStyle('address')}
                        placeholder="e.g., Kathmandu"
                        required={isGuide}
                      />
                      {touched.address && errors.address ? (
                        <div className="error-message01">{errors.address}</div>
                      ) : touched.address && valid.address ? (
                        <div className="valid-message">Address is valid</div>
                      ) : null}
                    </div>
                    
                    <div className="profile-image-upload" ref={fieldRefs.current.profileImage}>
                      <label>
                        Profile Image <span className="required-field">*</span>
                      </label>
                      <input
                        type="file"
                        ref={profileImageInputRef}
                        className="document-upload-input"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleProfileImageUpload}
                      />
                      <button
                        type="button"
                        className="upload-button1"
                        onClick={() => profileImageInputRef.current.click()}
                      >
                        <FiUpload /> Upload Profile Image
                      </button>
                      
                      {profileImage && (
                        <div className="document-preview">
                          <div className="preview-header">
                            <span>Profile Image</span>
                            <button
                              type="button"
                              className="remove-file"
                              onClick={removeProfileImage}
                            >
                              <FiX />
                            </button>
                          </div>
                          <div className="preview-content">
                            {profileImage.preview ? (
                              <img 
                                src={profileImage.preview} 
                                alt="Profile Image Preview" 
                                className="preview-image"
                              />
                            ) : (
                              <div className="preview-placeholder">
                                <FiUpload />
                                <span>Image uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {touched.profileImage && errors.profileImage ? (
                        <div className="error-message01">{errors.profileImage}</div>
                      ) : touched.profileImage && valid.profileImage ? (
                        <div className="valid-message">Profile image uploaded successfully</div>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="languages-section">
                    <label>
                      Languages Spoken <span className="required-field">*</span>
                    </label>
                    {guideDetails.languages.map((language, index) => (
                      <div key={index} className="input-with-remove" ref={el => fieldRefs.current.languages.current[index] = el}>
                        <input
                          type="text"
                          value={language}
                          onChange={(e) => handleGuideDetailsChange('languages', e.target.value, index)}
                          onBlur={() => handleBlur('languages', index)}
                          style={getArrayInputStyle('languages', index)}
                          placeholder="Language"
                          required={isGuide}
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
                        {touched.languages[index] && errors.languages[index] ? (
                          <div className="error-message01">{errors.languages[index]}</div>
                        ) : touched.languages[index] && valid.languages[index] ? (
                          <div className="valid-message">Language is valid</div>
                        ) : null}
                      </div>
                    ))}
                    <button type="button" className="add-button" onClick={addLanguage}>
                      <FiPlus /> Add Language
                    </button>
                  </div>

                  <div className="license-section">
                    <label>
                      License Number <span className="required-field">*</span>
                    </label>
                    <input
                      type="text"
                      value={guideDetails.licenseNumber}
                      onChange={(e) => handleGuideDetailsChange('licenseNumber', e.target.value)}
                      onBlur={() => handleBlur('licenseNumber')}
                      style={getInputStyle('licenseNumber')}
                      placeholder="Enter your guide license number"
                      className="input-field0"
                      ref={fieldRefs.current.licenseNumber}
                      required={isGuide}
                    />
                    {touched.licenseNumber && errors.licenseNumber ? (
                      <div className="error-message01">{errors.licenseNumber}</div>
                    ) : touched.licenseNumber && valid.licenseNumber ? (
                      <div className="valid-message">License number is valid</div>
                    ) : null}
                    
                    <div className="document-upload" ref={fieldRefs.current.licenseDocument}>
                      <label>
                        License Document <span className="required-field">*</span>
                      </label>
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
                      {touched.licenseDocument && errors.licenseDocument ? (
                        <div className="error-message01">{errors.licenseDocument}</div>
                      ) : touched.licenseDocument && valid.licenseDocument ? (
                        <div className="valid-message">License document uploaded successfully</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="regions-section">
                    <label>
                      Regions of Expertise <span className="required-field">*</span>
                    </label>
                    {guideDetails.regionsOfExpertise.map((region, index) => (
                      <div key={index} className="input-with-remove" ref={el => fieldRefs.current.regionsOfExpertise.current[index] = el}>
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => handleGuideDetailsChange('regionsOfExpertise', e.target.value, index)}
                          onBlur={() => handleBlur('regionsOfExpertise', index)}
                          style={getArrayInputStyle('regionsOfExpertise', index)}
                          placeholder="Region (e.g., Kathmandu, Pokhara)"
                          required={isGuide}
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
                        {touched.regionsOfExpertise[index] && errors.regionsOfExpertise[index] ? (
                          <div className="error-message01">{errors.regionsOfExpertise[index]}</div>
                        ) : touched.regionsOfExpertise[index] && valid.regionsOfExpertise[index] ? (
                          <div className="valid-message">Region is valid</div>
                        ) : null}
                      </div>
                    ))}
                    <button type="button" className="add-button" onClick={addRegion}>
                      <FiPlus /> Add Region
                    </button>
                  </div>

                  <div className="document-upload" ref={fieldRefs.current.educationCertificates}>
                    <label>
                      Education Certificates <span className="required-field">*</span>
                    </label>
                    <input
                      type="file"
                      ref={certificateInputRef}
                      className="document-upload-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleCertificateUpload}
                      required={isGuide && guideDetails.educationCertificates.length === 0}
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
                    {touched.educationCertificates && errors.educationCertificates ? (
                      <div className="error-message01">{errors.educationCertificates}</div>
                    ) : touched.educationCertificates && valid.educationCertificates ? (
                      <div className="valid-message">Certificates uploaded successfully</div>
                    ) : null}
                  </div>

                  <div className="service-types" ref={fieldRefs.current.serviceTypes}>
                    <label>
                      Service Types <span className="required-field">*</span>
                    </label>
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
                    {touched.serviceTypes && errors.serviceTypes ? (
                      <div className="error-message01">{errors.serviceTypes}</div>
                    ) : touched.serviceTypes && valid.serviceTypes ? (
                      <div className="valid-message">Service types selected</div>
                    ) : null}
                  </div>

                  <div className="pricing-section" ref={fieldRefs.current.pricing}>
                    <h4>Pricing Information</h4>
                    <div className="input-group0">
                      <label>
                        Price per Day (NPR) <span className="required-field">*</span>
                      </label>
                      <input
                        type="number"
                        value={guideDetails.pricing.perDay}
                        onChange={(e) => handleGuideDetailsChange('pricing', { perDay: Number(e.target.value) })}
                        onBlur={() => handleBlur('pricing')}
                        style={getInputStyle('pricing')}
                        placeholder="Enter price per day"
                        min="0"
                        className="input-field0"
                        required={isGuide}
                      />
                      {touched.pricing && errors.pricing ? (
                        <div className="error-message01">{errors.pricing}</div>
                      ) : touched.pricing && valid.pricing ? (
                        <div className="valid-message">Price is valid</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="terms1" ref={fieldRefs.current.termsAccepted}>
                <input
                  type="checkbox"
                  id="terms"
                  name="termsAccepted"
                  checked={termsAccepted}
                  onChange={handleTermsChange}
                />
                <label htmlFor="terms" className="agree-terms-conditions1">
                  I agree to the Terms & Conditions <span className="required-field">*</span>
                </label>
              </div>
              {touched.termsAccepted && errors.termsAccepted && (
                <div className="error-message01">{errors.termsAccepted}</div>
              )}

              <button className="submit-button1" type="submit" disabled={isLoading}>
                {isLoading ? "Signing Up..." : "Sign up"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="input-group01">
                <label htmlFor="otp">
                  Enter OTP <span className="required-field">*</span>
                </label>
                <input
                  type="text"
                  id="otp"
                  className="input-field01"
                  name="otp"
                  value={otp}
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
