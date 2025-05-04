import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./editPackage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import MapPicker from "../../../Components/MapPicker";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";

// Constant for guide pricing fallback
const COST_RANGES = {
  guide: {
    perDay: 2000 // Default guide cost per day (NPR)
  }
};

// Validation schema using Yup
const PackageSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, "Title must be at least 5 characters")
    .required("Title is required"),
  highlight: Yup.string()
    .min(10, "Highlight must be at least 10 characters")
    .required("Highlight is required"),
  address: Yup.string()
    .min(5, "Address must be at least 5 characters")
    .required("Address is required"),
  startDate: Yup.date()
    .min(new Date().toISOString().split('T')[0], "Start date must be today or a future date")
    .required("Start date is required"),
  endDate: Yup.date()
    .min(
      Yup.ref('startDate'),
      "End date must be same day or after start date"
    )
    .required("End date is required"),
  category: Yup.string()
    .matches(/^[a-zA-Z\s,&-]+$/, "Category can only contain letters, spaces, commas, & and -")
    .required("Category is required"),
  price: Yup.string()
    .matches(/^[1-9]\d*(\.\d{1,2})?$/, "Price must be a positive number with up to 2 decimal places")
    .required("Price is required"),
  groupSize: Yup.string()
    .matches(/^\d+$/, "Group size must be a number")
    .required("Group size is required"),
  difficulty: Yup.string()
    .matches(/^[a-zA-Z\s-]+$/, "Difficulty can only contain letters, spaces and -")
    .required("Difficulty is required"),
  overview: Yup.string()
    .min(20, "Overview must be at least 20 characters")
    .required("Overview is required"),
  included: Yup.string()
    .min(10, "Included items must be at least 10 characters")
    .required("Included items are required"),
  additionalInfo: Yup.string()
    .min(10, "Additional information must be at least 10 characters")
    .required("Additional information is required"),
  operator: Yup.string()
    .min(3, "Operator must be at least 3 characters")
    .required("Operator is required"),
  ageRestriction: Yup.string()
    .min(5, "Age restriction must be at least 5 characters")
    .required("Age restriction is required"),
  pickupDetails: Yup.string()
    .min(10, "Pickup details must be at least 10 characters")
    .required("Pickup details are required"),
  accessibility: Yup.string()
    .min(10, "Accessibility must be at least 10 characters")
    .required("Accessibility is required"),
  cancellationPolicy: Yup.string()
    .min(10, "Cancellation policy must be at least 10 characters")
    .required("Cancellation policy is required"),
  guideId: Yup.string()
    .test('guide-validation', "Please select a guide", function(value) {
      // If guideIncluded is true, then guideId is required
      return !this.parent.guideIncluded || (this.parent.guideIncluded && value);
    }),
  itinerary: Yup.array().of(
    Yup.object().shape({
      mode: Yup.string().required("Mode is required"),
      highlights: Yup.string().required("Highlights are required"),
      stay: Yup.string().required("Stay is required"),
      meals: Yup.string().required("Meals are required"),
      costBreakdown: Yup.string().required("Cost breakdown is required")
    })
  )
});

// Custom Label component for required fields
const RequiredLabel = ({ text }) => (
  <span className="required-label">
    {text} <span className="required">*</span>
  </span>
);

export default function EditPackagePage() {
  const { packageName } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false); 
  const [approvedGuides, setApprovedGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({
    title: "",
    imageUrl: "",
    highlight: "",
    address: "",
    locationDetails: {
      latitude: 27.7172,
      longitude: 85.3240,
      formattedAddress: ""
    },
    tripType: "",
    startDate: "",
    endDate: "",
    duration: "",
    category: "",
    price: "",
    groupSize: "",
    difficulty: "",
    overview: "",
    itinerary: [],
    included: "",
    additionalInfo: "",
    operator: "",
    ageRestriction: "",
    pickupDetails: "",
    accessibility: "",
    cancellationPolicy: "",
    guideIncluded: false,
    guideId: "",
    guideCost: 0
  });
  const formRef = useRef(null);
  const originalValues = useRef(null);

  useEffect(() => {
    if (packageName) {
      fetchPackageDetails(packageName);
    }
    fetchApprovedGuides();
  }, [packageName]);

  const fetchPackageDetails = async (title) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:4000/adminPackage/package`, {
        params: { title: packageName },
      });
  
      console.log("Fetched package data:", response.data);
  
      if (response.status === 200) {
        const packageData = response.data;
  
        // Format data for the form
        const formattedData = {
          ...packageData,
          startDate: packageData.startDate ? packageData.startDate.split("T")[0] : "",
          endDate: packageData.endDate ? packageData.endDate.split("T")[0] : "",
          locationDetails: packageData.locationDetails || {
            latitude: 27.7172,
            longitude: 85.3240,
            formattedAddress: packageData.address || ""
          },
          // Extract numeric price value only
          price: packageData.price ? packageData.price.toString().replace(/[^0-9.]/g, "") : "",
          guideIncluded: packageData.guideIncluded || false,
          guideId: packageData.guideId && packageData.guideId._id ? packageData.guideId._id : packageData.guideId || "",
          guideCost: packageData.guideCost || 0
        };
  
        setInitialValues(formattedData);
        // Store original values for comparison
        originalValues.current = JSON.stringify(formattedData);
        // Reset hasChanges flag
        setHasChanges(false);
        
        // Log guide information for debugging
        console.log("Guide Information from package:", {
          guideIncluded: formattedData.guideIncluded,
          guideId: formattedData.guideId,
          guideCost: formattedData.guideCost
        });
        
        // Set selected guide if guide is included and populated from server
        if (packageData.guideIncluded && packageData.guideId) {
          if (typeof packageData.guideId === 'object' && packageData.guideId._id) {
            // If the API returned a populated guide object, use it directly
            console.log("Using guide details directly from API response:", packageData.guideId.firstName, packageData.guideId.lastName);
            setSelectedGuide(packageData.guideId);
          }
        }
  
        // Set the image URL correctly (imageUrl from backend)
        if (packageData.imageUrl) {
        setImagePreview(packageData.imageUrl || "");
          // We don't set imageFile here since we don't have the actual file object
          // The user will need to select a new image if they want to change it
          console.log("Set image preview from existing URL:", packageData.imageUrl);
        }
      } else {
        toast.error("No Package Found.", {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message20'
        });
      }
    } catch (error) {
      console.error("Error fetching package details:", error);
      toast.error("Failed to load package details.", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message20'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchApprovedGuides = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, user may need to login");
        return;
      }

      const response = await axios.get("http://localhost:4000/api/guides/approved", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setApprovedGuides(response.data);
      }
    } catch (error) {
      console.error("Error fetching guides:", error);
      // Don't show an error toast as this is not critical for form operation
      // Fallback to empty guides array which is already the default
      if (error.response && error.response.status === 401) {
        console.log("Authentication issue with guides API - user may need to re-login");
        // You could redirect to login or handle silently
      }
    }
  };
  
  // Helper function to parse price values safely
  const parsePrice = (priceString) => {
    if (!priceString) return 0;
    
    try {
      // Extract numeric value from string
      const numericValue = priceString.toString().replace(/[^0-9.]+/g, "");
      return parseInt(numericValue) || 0;
    } catch (error) {
      console.error("Error parsing price:", error, priceString);
      return 0;
    }
  };

  // Calculate total price
  const calculateTotalPrice = (values) => {
    let basePrice = parsePrice(values.price);
    let guideCost = values.guideIncluded ? parsePrice(values.guideCost) : 0;
    
    const totalPrice = basePrice + guideCost;
    return totalPrice > 0 ? `NPR ${totalPrice.toLocaleString()}` : "NPR 0";
  };
  
  // Get total price as a number
  const getTotalPriceValue = (values) => {
    let basePrice = parsePrice(values.price);
    let guideCost = values.guideIncluded ? parsePrice(values.guideCost) : 0;
    return basePrice + guideCost;
  };
  
  // Calculate duration in days
  const calculateDurationInDays = (startDate, endDate) => {
    if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
      const timeDiff = end - start;
      return Math.max(Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1, 1); // At least 1 day
    }
    return 1;
  };

  // Generate itinerary for the specified number of days
  const generateItinerary = (days) => {
    return Array.from({ length: days }, (_, index) => ({
      day: `Day ${index + 1}`,
      mode: "",
      highlights: "",
      stay: "",
      meals: "",
      costBreakdown: "",
    }));
  };

  const handleLocationSelect = (location, setFieldValue) => {
    setFieldValue('address', location.address);
    setFieldValue('locationDetails', {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: location.address
    });
  };

  const handleImageUpload = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setFieldValue('image', file);
      setHasChanges(true);
    }
  };

  const handleUpdate = async (values, { setSubmitting }) => {
    console.log("EditPackage: handleUpdate function called", values);
    
    // Check if there are any changes
    if (!hasChanges && !imageFile) {
      toast.error("No changes detected. Please make changes before updating.", {
        position: "top-right",
        autoClose: 5000,
        className: 'toast-message20'
      });
      setSubmitting(false);
      return;
    }
    
    // Skip validation for certain fields if needed
    let canProceed = true;
    let validationIssues = [];
    
    // Basic validations critical for server-side processing
    if (!values.title || values.title.length < 5) {
      validationIssues.push("Title is required and must be at least 5 characters");
      canProceed = false;
    }
    
    if (!values.price || isNaN(parseFloat(values.price))) {
      validationIssues.push("Price is required and must be a valid number");
      canProceed = false;
    }
    
    if (!canProceed) {
      console.log("Validation issues:", validationIssues);
      toast.error(validationIssues.join(", "), {
        position: "top-right",
        autoClose: 5000,
        className: 'toast-message20'
      });
      setSubmitting(false);
      return;
    }
    
    setUpdating(true);
    setSubmitting(true);
    
    try {
      // Extract all form data into FormData object
      const updateFormData = new FormData();
      
      // Only include the image if it's been selected by the user - use the state variable
      if (imageFile) {
        updateFormData.append('image', imageFile);
      }

      // Calculate duration if dates are available
      if (values.startDate && values.endDate) {
        const days = calculateDurationInDays(values.startDate, values.endDate);
        updateFormData.append('duration', `${days} days`);
      } else {
        // Ensure duration is a string, not an array
        const duration = Array.isArray(values.duration) 
          ? values.duration[0] // Take the first element if it's an array
          : values.duration;
        updateFormData.append('duration', duration);
      }

      // Calculate the total price (base price + guide cost)
      const totalPrice = getTotalPriceValue(values);
      
      // Store only the numeric value in the 'price' field - no NPR prefix or formatting
      updateFormData.append('price', totalPrice.toString());
      
      // Also send the base price separately for reference - numeric only
      updateFormData.append('basePrice', parsePrice(values.price).toString());

      // Special handling for locationDetails
      updateFormData.append('locationDetails', JSON.stringify(values.locationDetails));
      
      // Special handling for itinerary
      const itineraryData = values.itinerary.map(day => ({
        day: day.day,
        mode: day.mode || '',
        highlights: day.highlights || '',
        stay: day.stay || '',
        meals: day.meals || '',
        costBreakdown: day.costBreakdown || ''
      }));
      updateFormData.append('itinerary', JSON.stringify(itineraryData));
      
      // Add all other fields except those already handled
      Object.keys(values).forEach(key => {
        if (
          key !== 'image' && 
          key !== 'locationDetails' && 
          key !== 'itinerary' && 
          key !== 'price' && 
          key !== 'guideId' && 
          key !== 'guideCost'
        ) {
          if (key === 'guideIncluded') {
            updateFormData.append(key, values[key] ? 'true' : 'false');
          } else {
            updateFormData.append(key, values[key]);
          }
        }
      });
      
      // Add guide fields if guide is included
      if (values.guideIncluded && values.guideId) {
        updateFormData.append('guideId', values.guideId);
      }
      
      // Only include guideCost if guideIncluded is true, send as number
      if (values.guideIncluded) {
        updateFormData.append('guideCost', Number(values.guideCost) || 0);
      }

      console.log("Submitting package update with guide information:");
      console.log("Guide Included:", values.guideIncluded);
      console.log("Guide ID:", values.guideId);
      console.log("Guide Cost:", values.guideCost);
      console.log("Base Price:", values.price);
      console.log("Total Price:", totalPrice);
      console.log("Image file present:", !!imageFile);

      const response = await axios.put(
        "http://localhost:4000/adminPackage/updatePackage",
        updateFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        toast.success("Package updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message20'
        });
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      } else {
        toast.error("Failed to update package.", {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message20'
        });
      }
    } catch (error) {
      console.error("Error updating package:", error);
      toast.error(error.response?.data?.message || "Unknown error occurred", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message20'
      });
    } finally {
      setUpdating(false);
      setSubmitting(false);
    }
  };

  // Helper function to scroll to the first error
  const scrollToError = (errors, touched) => {
    if (Object.keys(errors).length > 0 && Object.keys(touched).length > 0) {
      // Get the first error field name
      const firstErrorField = Object.keys(errors).find(fieldName => touched[fieldName]);
      
      if (firstErrorField) {
        // Find the error element in the DOM
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        
        // Special handling for itinerary array errors
        if (!errorElement && firstErrorField === 'itinerary') {
          // Find the first itinerary field with an error
          const itineraryErrors = errors.itinerary;
          if (Array.isArray(itineraryErrors)) {
            for (let i = 0; i < itineraryErrors.length; i++) {
              if (itineraryErrors[i] && touched.itinerary && touched.itinerary[i]) {
                const itineraryField = Object.keys(itineraryErrors[i])[0];
                const itineraryErrorElement = document.querySelector(`[name="itinerary[${i}].${itineraryField}"]`);
                if (itineraryErrorElement) {
                  itineraryErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
              }
            }
          }
        }
        
        // Scroll to the error element if found
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Helper function to check for form changes
  const checkForChanges = (values) => {
    // If image file was selected, there are changes
    if (imageFile) {
      setHasChanges(true);
      return;
    }
    
    // Compare current values with original values
    const currentValuesStr = JSON.stringify(values);
    if (currentValuesStr !== originalValues.current) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-container20">
        <div className="heading20">
          <h1 className="title-heading20">Plan Your Perfect Itinerary</h1>
          <p className="title-para20">Edit Your Travel Package, Effortlessly!</p>
        </div>

        {loading ? (
          <div className="loading">Loading package details...</div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={PackageSchema}
            onSubmit={handleUpdate}
            enableReinitialize={true}
            innerRef={formRef}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => {
              // Check for changes whenever values change
              useEffect(() => {
                checkForChanges(values);
              }, [values]);
              
              // Custom change handler to track changes
              const handleFieldChange = (e) => {
                handleChange(e);
                setHasChanges(true);
              };
              
              // Handle date changes (start and end dates)
              const handleDateChange = (e) => {
                handleFieldChange(e);
                
                const { name, value } = e.target;
                const { startDate, endDate } = name === "startDate" 
                  ? { startDate: value, endDate: values.endDate }
                  : { startDate: values.startDate, endDate: value };
                  
                if (startDate && endDate) {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const timeDiff = end - start;
                  const days = timeDiff / (1000 * 60 * 60 * 24);
                  
                  if (days >= 0) {
                    const duration = `${days + 1} days`; // Include the last day
                    const tripType = days + 1 <= 3 ? "Short Trip" : "Long Trip";
                    const newItinerary = values.itinerary.length === days + 1 
                      ? values.itinerary 
                      : generateItinerary(days + 1);
                    
                    setFieldValue("duration", duration);
                    setFieldValue("tripType", tripType);
                    setFieldValue("itinerary", newItinerary);
                    
                    // Update guide cost if applicable
                    if (values.guideIncluded && values.guideId) {
                      const selectedGuide = approvedGuides.find(guide => guide._id === values.guideId);
                      if (selectedGuide && selectedGuide.guideProfile && selectedGuide.guideProfile.pricing) {
                        const perDayCost = selectedGuide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay;
                        setFieldValue("guideCost", perDayCost * (days + 1));
                      }
                    }
                  }
                }
              };
              
              // Handle guide selection
              const handleGuideChange = (e) => {
                const { checked, name, value } = e.target;
                
                if (name === "guideIncluded") {
                  setFieldValue("guideIncluded", checked);
                  setHasChanges(true);
                  if (!checked) {
                    setFieldValue("guideId", "");
                    setFieldValue("guideCost", 0);
                    setSelectedGuide(null);
                  }
                } else if (name === "guideId") {
                  setFieldValue("guideId", value);
                  setHasChanges(true);
                  
                  if (!value) {
                    setSelectedGuide(null);
                    setFieldValue("guideCost", 0);
                  } else {
                    const selectedGuide = approvedGuides.find(guide => guide._id === value);
                    if (selectedGuide) {
                      setSelectedGuide(selectedGuide);
                      
                      // Calculate guide cost
                      if (values.startDate && values.endDate) {
                        const days = calculateDurationInDays(values.startDate, values.endDate);
                        const perDayCost = selectedGuide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay;
                        setFieldValue("guideCost", perDayCost * days);
                      }
                    }
                  }
                }
              };
              
              // Check for errors and scroll to them
              useEffect(() => {
                if (Object.keys(errors).length > 0 && Object.keys(touched).length > 0) {
                  scrollToError(errors, touched);
                }
              }, [errors, touched]);
              
              return (
                <Form className="form20">
          <h2 className="h2-20">Update Itinerary Package</h2>

                  {/* Title field */}
                  <div className="label20">
                    <RequiredLabel text="Title:" />
                    <Field
                      className={`input20 ${errors.title && touched.title ? 'error-input' : touched.title ? 'valid-input' : ''}`}
              type="text" 
              name="title" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="title" component="span" className="error-message" />
                  </div>

                  {/* Image field */}
                  <div className="label20">
                    <RequiredLabel text="Image:" />
            <input 
              type="file" 
              name="image" 
              ref={fileInputRef} 
                      onChange={(e) => handleImageUpload(e, setFieldValue)}
              accept="image/*" 
                      className={errors.image && touched.image ? 'error-input' : ''}
                    />
                    <ErrorMessage name="image" component="span" className="error-message" />
                  </div>
                  
                  {imagePreview && (
                    <img src={imagePreview} alt="Package Preview" className="image-preview20" />
                  )}

                  {/* Highlight field */}
                  <div className="label20">
                    <RequiredLabel text="Highlight:" />
                    <Field
                      className={`input20 ${errors.highlight && touched.highlight ? 'error-input' : touched.highlight ? 'valid-input' : ''}`}
              type="text" 
              name="highlight" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="highlight" component="span" className="error-message" />
                  </div>

                  {/* Overview field */}
                  <div className="label20">
                    <RequiredLabel text="Overview:" />
                    <Field
                      as="textarea"
                      className={`textarea20 ${errors.overview && touched.overview ? 'error-input' : touched.overview ? 'valid-input' : ''}`}
              name="overview" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="overview" component="span" className="error-message" />
                  </div>

          <h3 className="h3-20">Quick Info:</h3>
                  
                  {/* Address field */}
                  <div className="label20">
                    <RequiredLabel text="Address:" />
                    <Field
                      className={`input20 ${errors.address && touched.address ? 'error-input' : touched.address ? 'valid-input' : ''}`}
              type="text" 
              name="address" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="address" component="span" className="error-message" />
                  </div>

                  {/* Map picker */}
          <div className="map-section20">
            <h3 className="h3-20">Select Location on Map</h3>
            <div className="map-container20">
              <MapPicker
                        onLocationSelect={(location) => handleLocationSelect(location, setFieldValue)}
                        initialLocation={values.locationDetails}
              />
            </div>
          </div>

                  {/* Trip type field */}
                  <div className="label20">
                    <RequiredLabel text="Trip Type:" />
                    <Field
                      className={`input20 ${errors.tripType && touched.tripType ? 'error-input' : touched.tripType ? 'valid-input' : ''}`}
              type="text" 
              name="tripType" 
              readOnly 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="tripType" component="span" className="error-message" />
                  </div>

                  {/* Date fields */}
                  <div className="label20">
                    <RequiredLabel text="Start Date:" />
                    <Field
                      className={`input20 ${errors.startDate && touched.startDate ? 'error-input' : touched.startDate ? 'valid-input' : ''}`}
              type="date" 
              name="startDate" 
                      onChange={handleDateChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <ErrorMessage name="startDate" component="span" className="error-message" />
                  </div>
                  
                  <div className="label20">
                    <RequiredLabel text="End Date:" />
                    <Field
                      className={`input20 ${errors.endDate && touched.endDate ? 'error-input' : touched.endDate ? 'valid-input' : ''}`}
              type="date" 
              name="endDate" 
                      onChange={handleDateChange}
                      min={values.startDate || new Date().toISOString().split('T')[0]}
                    />
                    <ErrorMessage name="endDate" component="span" className="error-message" />
                  </div>
                  
                  <div className="label20">
                    <RequiredLabel text="Duration:" />
                    <Field
                      className={`input20 ${errors.duration && touched.duration ? 'error-input' : touched.duration ? 'valid-input' : ''}`}
              type="text" 
              name="duration" 
              readOnly 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="duration" component="span" className="error-message" />
                  </div>

                  {/* Category field */}
                  <div className="label20">
                    <RequiredLabel text="Category:" />
                    <Field
                      className={`input20 ${errors.category && touched.category ? 'error-input' : touched.category ? 'valid-input' : ''}`}
              type="text" 
              name="category" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="category" component="span" className="error-message" />
                  </div>

                  {/* Group size field */}
                  <div className="label20">
                    <RequiredLabel text="Group Size:" />
                    <Field
                      className={`input20 ${errors.groupSize && touched.groupSize ? 'error-input' : touched.groupSize ? 'valid-input' : ''}`}
              type="text" 
              name="groupSize" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="groupSize" component="span" className="error-message" />
                  </div>
                  
                  {/* Difficulty field */}
                  <div className="label20">
                    <RequiredLabel text="Difficulty:" />
                    <Field
                      className={`input20 ${errors.difficulty && touched.difficulty ? 'error-input' : touched.difficulty ? 'valid-input' : ''}`}
              type="text" 
              name="difficulty" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="difficulty" component="span" className="error-message" />
                  </div>

                  {/* Age restriction field */}
                  <div className="label20">
                    <RequiredLabel text="Age Restriction:" />
                    <Field
                      className={`input20 ${errors.ageRestriction && touched.ageRestriction ? 'error-input' : touched.ageRestriction ? 'valid-input' : ''}`}
              type="text" 
              name="ageRestriction" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="ageRestriction" component="span" className="error-message" />
                  </div>

                  {/* Pickup details field */}
                  <div className="label20">
                    <RequiredLabel text="Pickup Details:" />
                    <Field
                      as="textarea"
                      className={`textarea20 ${errors.pickupDetails && touched.pickupDetails ? 'error-input' : touched.pickupDetails ? 'valid-input' : ''}`}
              name="pickupDetails" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="pickupDetails" component="span" className="error-message" />
                  </div>

                  {/* Accessibility field */}
                  <div className="label20">
                    <RequiredLabel text="Accessibility:" />
                    <Field
                      as="textarea"
                      className={`textarea20 ${errors.accessibility && touched.accessibility ? 'error-input' : touched.accessibility ? 'valid-input' : ''}`}
              name="accessibility" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="accessibility" component="span" className="error-message" />
                  </div>

                  {/* Cancellation policy field */}
                  <div className="label20">
                    <RequiredLabel text="Cancellation Policy:" />
                    <Field
                      as="textarea"
                      className={`textarea20 ${errors.cancellationPolicy && touched.cancellationPolicy ? 'error-input' : touched.cancellationPolicy ? 'valid-input' : ''}`}
              name="cancellationPolicy" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="cancellationPolicy" component="span" className="error-message" />
                  </div>

                  {/* Operator field */}
                  <div className="label20">
                    <RequiredLabel text="Operator:" />
                    <Field
                      className={`input20 ${errors.operator && touched.operator ? 'error-input' : touched.operator ? 'valid-input' : ''}`}
              type="text" 
              name="operator" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="operator" component="span" className="error-message" />
                  </div>

          <h3 className="h3-20">Day by Day Itinerary:</h3>
                  
                  {/* Itinerary fields */}
                  <FieldArray name="itinerary">
                    {() => (
                      values.itinerary.map((day, index) => (
            <div key={index}>
                          <div className="label20">
                <RequiredLabel text={`Day: ${index + 1}`} />
                            <Field
                              className="input20"
                  type="text" 
                              name={`itinerary[${index}].day`}
                  readOnly 
                  onChange={(e) => {
                    const { value } = e.target;
                    handleFieldChange({ target: { name: `itinerary[${index}].day`, value } });
                  }}
                />
                          </div>
                          
                          <div className="label20">
                <RequiredLabel text={`Mode: ${index + 1}`} />
                            <Field
                              className={`input20 ${
                                errors.itinerary && 
                                errors.itinerary[index] && 
                                errors.itinerary[index].mode && 
                                touched.itinerary && 
                                touched.itinerary[index] && 
                                touched.itinerary[index].mode 
                                  ? 'error-input' 
                                  : touched.itinerary && 
                                    touched.itinerary[index] && 
                                    touched.itinerary[index].mode 
                                      ? 'valid-input' 
                                      : ''
                              }`}
                  type="text" 
                              name={`itinerary[${index}].mode`}
                              onChange={(e) => {
                                const { value } = e.target;
                                handleFieldChange({ target: { name: `itinerary[${index}].mode`, value } });
                              }}
                            />
                            <ErrorMessage name={`itinerary[${index}].mode`} component="span" className="error-message" />
                          </div>
                          
                          <div className="label20">
                <RequiredLabel text={`Highlights: ${index + 1}`} />
                            <Field
                              className={`input20 ${
                                errors.itinerary && 
                                errors.itinerary[index] && 
                                errors.itinerary[index].highlights && 
                                touched.itinerary && 
                                touched.itinerary[index] && 
                                touched.itinerary[index].highlights 
                                  ? 'error-input' 
                                  : touched.itinerary && 
                                    touched.itinerary[index] && 
                                    touched.itinerary[index].highlights 
                                      ? 'valid-input' 
                                      : ''
                              }`}
                  type="text" 
                              name={`itinerary[${index}].highlights`}
                              onChange={(e) => {
                                const { value } = e.target;
                                handleFieldChange({ target: { name: `itinerary[${index}].highlights`, value } });
                              }}
                            />
                            <ErrorMessage name={`itinerary[${index}].highlights`} component="span" className="error-message" />
                          </div>
                          
                          <div className="label20">
                <RequiredLabel text={`Stay: ${index + 1}`} />
                            <Field
                              className={`input20 ${
                                errors.itinerary && 
                                errors.itinerary[index] && 
                                errors.itinerary[index].stay && 
                                touched.itinerary && 
                                touched.itinerary[index] && 
                                touched.itinerary[index].stay 
                                  ? 'error-input' 
                                  : touched.itinerary && 
                                    touched.itinerary[index] && 
                                    touched.itinerary[index].stay 
                                      ? 'valid-input' 
                                      : ''
                              }`}
                  type="text" 
                              name={`itinerary[${index}].stay`}
                              onChange={(e) => {
                                const { value } = e.target;
                                handleFieldChange({ target: { name: `itinerary[${index}].stay`, value } });
                              }}
                            />
                            <ErrorMessage name={`itinerary[${index}].stay`} component="span" className="error-message" />
                          </div>
                          
                          <div className="label20">
                <RequiredLabel text={`Meals: ${index + 1}`} />
                            <Field
                              className={`input20 ${
                                errors.itinerary && 
                                errors.itinerary[index] && 
                                errors.itinerary[index].meals && 
                                touched.itinerary && 
                                touched.itinerary[index] && 
                                touched.itinerary[index].meals 
                                  ? 'error-input' 
                                  : touched.itinerary && 
                                    touched.itinerary[index] && 
                                    touched.itinerary[index].meals 
                                      ? 'valid-input' 
                                      : ''
                              }`}
                  type="text" 
                              name={`itinerary[${index}].meals`}
                              onChange={(e) => {
                                const { value } = e.target;
                                handleFieldChange({ target: { name: `itinerary[${index}].meals`, value } });
                              }}
                            />
                            <ErrorMessage name={`itinerary[${index}].meals`} component="span" className="error-message" />
                          </div>
                          
                          <div className="label20">
                <RequiredLabel text={`Cost Breakdown: ${index + 1}`} />
                            <Field
                              as="textarea"
                              className={`textarea20 ${
                                errors.itinerary && 
                                errors.itinerary[index] && 
                                errors.itinerary[index].costBreakdown && 
                                touched.itinerary && 
                                touched.itinerary[index] && 
                                touched.itinerary[index].costBreakdown 
                                  ? 'error-input' 
                                  : touched.itinerary && 
                                    touched.itinerary[index] && 
                                    touched.itinerary[index].costBreakdown 
                                      ? 'valid-input' 
                                      : ''
                              }`}
                              name={`itinerary[${index}].costBreakdown`}
                              onChange={(e) => {
                                const { value } = e.target;
                                handleFieldChange({ target: { name: `itinerary[${index}].costBreakdown`, value } });
                              }}
                            />
                            <ErrorMessage name={`itinerary[${index}].costBreakdown`} component="span" className="error-message" />
            </div>
                        </div>
                      ))
                    )}
                  </FieldArray>

                  {/* What's included field */}
                  <div className="label20">
                    <RequiredLabel text="What's Included:" />
                    <Field
                      as="textarea"
                      className={`textarea20 ${errors.included && touched.included ? 'error-input' : touched.included ? 'valid-input' : ''}`}
              name="included" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="included" component="span" className="error-message" />
                  </div>

                  {/* Additional info field */}
                  <div className="label20">
                    <RequiredLabel text="Additional Information:" />
                    <Field
                      as="textarea"
                      className={`textarea20 ${errors.additionalInfo && touched.additionalInfo ? 'error-input' : touched.additionalInfo ? 'valid-input' : ''}`}
              name="additionalInfo" 
                      onChange={handleFieldChange}
                    />
                    <ErrorMessage name="additionalInfo" component="span" className="error-message" />
                  </div>

                  {/* Guide selection */}
           <div className="guide-checkbox-container">
            <label className="guide-checkbox-label">
                      <Field
                type="checkbox"
                name="guideIncluded"
                        onChange={handleGuideChange}
                className="guide-checkbox-input"
              />
              <span className="guide-checkbox-text">Include a professional guide for your trip</span>
            </label>
          </div>

                  {values.guideIncluded && (
            <div className="guide-selection20">
              <h3 className="h3-20">Select a guide:</h3>
              {approvedGuides.length > 0 ? (
                <div className="select-wrapper20">
                          <Field
                            as="select"
                    name="guideId"
                            onChange={handleGuideChange}
                            className={`input20 ${errors.guideId && touched.guideId ? 'error-input' : touched.guideId ? 'valid-input' : ''}`}
                  >
                    <option value="">Select a guide</option>
                    {approvedGuides.map((guide) => (
                      <option key={guide._id} value={guide._id}>
                        {guide.firstName} {guide.lastName} - NPR {guide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay}/day
                      </option>
                    ))}
                          </Field>
                          <ErrorMessage name="guideId" component="span" className="error-message" />
                </div>
              ) : (
                <p className="no-guides-message20">No guides available. Please try again later.</p>
              )}

              {selectedGuide && (
                <div className="guide-details20">
                  <h4 className="guide-details-heading">Guide Details:</h4>
                  <div className="guide-details-grid">
                    <p><strong>Name:</strong> {selectedGuide.firstName} {selectedGuide.lastName}</p>
                    <p><strong>Languages:</strong> {selectedGuide.guideProfile?.languages?.join(", ") || "Not specified"}</p>
                    <p><strong>Regions:</strong> {selectedGuide.guideProfile?.regionsOfExpertise?.join(", ") || "Not specified"}</p>
                    <p><strong>Services:</strong> {selectedGuide.guideProfile?.serviceTypes?.join(", ") || "Not specified"}</p>
                    <p><strong>Price/Day:</strong> NPR {selectedGuide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay}</p>
                            <p><strong>Total Cost:</strong> NPR {values.guideCost || "0.00"} ({values.duration})</p>
                  </div>
                </div>
              )}
            </div>
          )}

                  {/* Price section */}
          <div className="price-section20">
            <h4 className="price-heading20">Package Pricing</h4>
            <div className="price-input-section20">
                      <div className="label20">
                <RequiredLabel text="Base Package Price (NPR):" />
                        <Field
                          className={`input20 ${errors.price && touched.price ? 'error-input' : touched.price ? 'valid-input' : ''}`}
                  type="text" 
                  name="price" 
                  placeholder="Enter base price" 
                          pattern="[1-9][0-9]*\.?[0-9]{0,2}"
                          title="Please enter a positive number with up to 2 decimal places"
                          onKeyPress={(e) => {
                            const validChars = /[0-9.]/;
                            if (!validChars.test(e.key) || 
                                (e.key === '.' && e.target.value.includes('.')) || 
                                (e.key === '0' && e.target.value.length === 0)) {
                              e.preventDefault();
                            }
                          }}
                        />
                        <ErrorMessage name="price" component="span" className="error-message" />
                      </div>
            </div>
            
            <div className="pricing-summary20">
              <div className="price-line20">
                <span className="price-label20">Base Price:</span>
                        <span className="price-value20">NPR {parsePrice(values.price).toLocaleString()}</span>
              </div>
              
                      {values.guideIncluded && selectedGuide && (
                <div className="price-line20">
                  <span className="price-label20">Guide Cost ({selectedGuide.firstName} {selectedGuide.lastName}):</span>
                          <span className="price-value20">NPR {parsePrice(values.guideCost).toLocaleString()}</span>
                </div>
              )}
              
              <div className="price-line20 total-price-line20">
                <span className="price-label20">Total Package Price:</span>
                        <span className="price-value20 total-price-value20">{calculateTotalPrice(values)}</span>
              </div>
              
              <div className="price-note20">
                <p>Note: The total price (base price + guide cost) will be displayed to users.</p>
              </div>
            </div>
          </div>

                  {/* Form buttons */}
          <div className="button-container20">
                    <Link to="/ItineraryPackage">
                      <button type="button" className="cancel-btn20">Cancel</button>
                    </Link>
                    <button 
                      type="button" 
                      className="update-btn20" 
                      disabled={isSubmitting || updating}
                      onClick={() => {
                        // Submit form manually
                        if (formRef.current) {
                          console.log("Manually submitting form");
                          formRef.current.handleSubmit();
                          }
                      }}
                    >
                      {isSubmitting || updating ? "Updating..." : "Update"}
</button>
          </div>
                </Form>
              );
            }}
          </Formik>
        )}
      </div>
      <Footer />
    </>
  );
}
