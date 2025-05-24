import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./addPackage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

export default function AddPackagePage() {
  const [approvedGuides, setApprovedGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Initial form values
  const initialValues = {
    title: "",
    image: "",
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
  };

  useEffect(() => {
    fetchApprovedGuides();
  }, []);

  const fetchApprovedGuides = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get("http://localhost:4000/guides/approved", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        console.log("Raw guide data:", response.data);
        // Filter guides to only show approved and available ones
        const availableGuides = response.data.filter(guide => {
          console.log("Checking guide:", guide);
          const isAvailable = guide.guideProfile && 
            guide.guideProfile.verificationStatus === 'approved' &&
            guide.guideProfile.isVerified &&
            guide.guideProfile.isAvailable;
          console.log("Guide availability status:", isAvailable);
          return isAvailable;
        });
        console.log("Filtered available guides:", availableGuides);
        setApprovedGuides(availableGuides);
        setFilteredGuides(availableGuides);
      }
    } catch (error) {
      console.error("Error fetching guides:", error);
    }
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

  const handleLocationSelect = (location, setFieldValue) => {
    setFieldValue('address', location.address);
    setFieldValue('locationDetails', {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: location.address
    });
  };

  const handleImageChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setFieldValue('image', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log("AddPackage: handleSubmit function called", values);
    
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
    
    if (!imageFile) {
      validationIssues.push("Please select an image for the package");
      canProceed = false;
    }
    
    if (!canProceed) {
      console.log("Validation issues:", validationIssues);
      toast.error(validationIssues.join(", "), {
        position: "top-center",
        autoClose: 5000,
        className: 'toast-message19'
      });
      setSubmitting(false);
      
      // Now it's appropriate to scroll to the first error on form submission
      const formErrors = formRef.current?.errors || {};
      if (Object.keys(formErrors).length > 0) {
        const firstErrorField = Object.keys(formErrors)[0];
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          // Only scroll on actual form submission
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      return;
    }
    
    setLoading(true);
    setSubmitting(true);
    
    try {
      const formDataToSubmit = new FormData();
      
      // Calculate the total price (base price + guide cost)
      const totalPrice = getTotalPriceValue(values);
      
      // Add all form data fields
      Object.keys(values).forEach(key => {
        if (key === 'locationDetails') {
          formDataToSubmit.append(key, JSON.stringify(values[key]));
        } else if (key === 'image') {
          // Skip this field - we'll handle image separately
          // Do nothing here
        } else if (key === 'itinerary') {
          // Ensure itinerary is properly stringified
          const itineraryData = values.itinerary.map(day => ({
            day: day.day,
            mode: day.mode || '',
            highlights: day.highlights || '',
            stay: day.stay || '',
            meals: day.meals || '',
            costBreakdown: day.costBreakdown || ''
          }));
          formDataToSubmit.append('itinerary', JSON.stringify(itineraryData));
        } else if (key === 'guideIncluded') {
          // Ensure guideIncluded is sent as a boolean string
          formDataToSubmit.append(key, values[key] ? 'true' : 'false');
        } else if (key === 'guideId') {
          // Only include guideId if guideIncluded is true
          if (values.guideIncluded && values[key]) {
            formDataToSubmit.append(key, values[key]);
          }
        } else if (key === 'guideCost') {
          // Only include guideCost if guideIncluded is true, send as number
          if (values.guideIncluded) {
            formDataToSubmit.append(key, Number(values[key]) || 0);
          }
        } else if (key === 'price') {
          // Use the total price instead of base price - numeric only
          formDataToSubmit.append(key, totalPrice.toString());
          // Also send the base price separately for reference - numeric only
          formDataToSubmit.append('basePrice', parsePrice(values.price).toString());
        } else {
          formDataToSubmit.append(key, values[key]);
        }
      });
      
      // Handle image file separately - use the state variable directly
      if (imageFile) {
        formDataToSubmit.append('image', imageFile);
      }

      // Log the form data for debugging
      console.log("Submitting package data with guide information:");
      console.log("Guide Included:", values.guideIncluded);
      console.log("Guide ID:", values.guideId);
      console.log("Guide Cost:", values.guideCost);
      console.log("Base Price:", values.price);
      console.log("Total Price (numeric only):", totalPrice);
      console.log("Image file present:", !!imageFile);

      const response = await axios.post(
        'http://localhost:4000/adminPackage/Add-Package',
        formDataToSubmit,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Package added successfully:', response.data);

      // Fetch users and create notifications
      try {
        const usersResponse = await axios.get('http://localhost:4000/signups');
        const users = usersResponse.data.filter(user => user.role === 'user');

        // Create notifications for each user
        const notificationPromises = users.map(async (user) => {
          const notification = {
            type: 'package-added',
            message: `A new travel package "${values.title}" has been added!`,
            userEmail: user.email,
            recipientType: 'user',
            read: false,
            details: {
              title: values.title,
              category: values.category,
              duration: values.duration,
              price: values.price,
              highlight: values.highlight,
              image: response.data.imageUrl, // Use the image URL from the response
              address: values.address,
              tripType: values.tripType,
              startDate: values.startDate,
              endDate: values.endDate,
              groupSize: values.groupSize,
              difficulty: values.difficulty,
              overview: values.overview,
              included: values.included,
              additionalInfo: values.additionalInfo
            }
          };

          // Save notification
          await axios.post('http://localhost:4000/notifications', notification);

          // Send email notification
          const emailData = {
            to: user.email,
            subject: "New Travel Package Added!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">New Package Alert: ${values.title}</h2>
                <p style="color: #34495e;">Dear ${user.firstName},</p>
                <p style="color: #34495e;">We're excited to announce a new travel package that might interest you!</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #2c3e50;">Package Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 8px;"><strong>Title:</strong> ${values.title}</li>
                    <li style="margin-bottom: 8px;"><strong>Category:</strong> ${values.category}</li>
                    <li style="margin-bottom: 8px;"><strong>Duration:</strong> ${values.duration}</li>
                    <li style="margin-bottom: 8px;"><strong>Trip Type:</strong> ${values.tripType}</li>
                    <li style="margin-bottom: 8px;"><strong>Price:</strong> ${values.price}</li>
                    <li style="margin-bottom: 8px;"><strong>Group Size:</strong> ${values.groupSize}</li>
                    <li style="margin-bottom: 8px;"><strong>Difficulty:</strong> ${values.difficulty}</li>
                  </ul>
                </div>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #2c3e50;">Overview:</h3>
                  <p style="color: #34495e;">${values.overview}</p>
                  
                  <h4 style="color: #2c3e50; margin-top: 15px;">Highlights:</h4>
                  <p style="color: #34495e;">${values.highlight}</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <a href="http://localhost:3000/ItineraryPackage" 
                     style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Package Details
                  </a>
                </div>

                <p style="color: #7f8c8d; font-size: 0.9em; margin-top: 20px;">
                  Best regards,<br>
                  Explore Nepal Team
                </p>
              </div>
            `
          };

          await axios.post('http://localhost:4000/send-email', emailData);
        });

        // Wait for all notifications and emails to be sent
        await Promise.allSettled(notificationPromises);
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the package creation if notifications fail
      }

      // Show success message
      toast.success("Package added successfully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'toast-message19',
      });

      // Navigate back after a short delay
      setTimeout(() => {
        navigate(-1);
      }, 2000);

    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error response headers:", error.response?.headers);
      
      toast.error(error.response?.data?.message || "Failed to add package. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'toast-message19',
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Helper function to scroll to the first error
  const scrollToError = (errors, touched) => {
    // Only scroll to errors when form is submitted, not during typing
    // Implementation kept for reference but not used during data entry
    console.log("Error checking without scrolling");
    
    // We removed the scrolling behavior to avoid disrupting form input
    // Original code is left commented for reference
    /*
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
    */
  };

  // Add this function after fetchApprovedGuides
  const filterGuidesByCategory = (category) => {
    if (!category) {
      setFilteredGuides(approvedGuides);
      return;
    }

    // Split category by commas and trim whitespace
    const categories = category.split(',').map(cat => cat.trim().toLowerCase());
    
    // Filter guides who have at least one matching service type
    const matchingGuides = approvedGuides.filter(guide => {
      const guideServices = guide.guideProfile?.serviceTypes?.map(service => 
        service.toLowerCase()
      ) || [];
      
      // Check if any category matches any service type
      return categories.some(cat => 
        guideServices.some(service => service.includes(cat) || cat.includes(service))
      );
    });

    setFilteredGuides(matchingGuides);
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Header />
      <div className="main-container19">
        <div className="heading19">
          <h1 className="title-heading19">Plan Your Perfect Itinerary</h1>
          <p className="title-para19">Create Your Perfect Travel Package, Effortlessly!</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={PackageSchema}
          onSubmit={handleSubmit}
          innerRef={formRef}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => {
            // Handle date changes (start and end dates)
            const handleDateChange = (e) => {
              const { name, value } = e.target;
              handleChange(e);
              
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
                  const newItinerary = generateItinerary(days + 1);
                  
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
                if (!checked) {
                  setFieldValue("guideId", "");
                  setFieldValue("guideCost", 0);
                  setSelectedGuide(null);
                }
              } else if (name === "guideId") {
                setFieldValue("guideId", value);
                
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
            
            // Check for errors and scroll to them - modify this to not scroll during typing
            useEffect(() => {
              // Disable automatic scrolling during input
              // Only log errors but don't scroll to them
              if (Object.keys(errors).length > 0 && Object.keys(touched).length > 0) {
                console.log("Form has errors, but not scrolling to maintain focus");
              }
              // The following line is commented out to prevent automatic scrolling
              // scrollToError(errors, touched);
            }, [errors, touched]);
            
            return (
              <Form className="form19">
          <h2 className="h2-19">Create New Itinerary Package</h2>

                {/* Title field */}
                <div className="label19">
                  <RequiredLabel text="Title:" />
                  <Field
                    className={`input19 ${errors.title && touched.title ? 'error-input' : touched.title ? 'valid-input' : ''}`}
              type="text" 
              name="title" 
                  />
                  <ErrorMessage name="title" component="span" className="error-message19" />
                </div>

                {/* Image field */}
                <div className="label19">
                  <RequiredLabel text="Image:" />
            <input 
              type="file" 
                    onChange={(e) => handleImageChange(e, setFieldValue)}
                    className={errors.image && touched.image ? 'error-input' : ''}
                  />
                  <ErrorMessage name="image" component="span" className="error-message19" />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="image-preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                  )}
                </div>

                {/* Highlight field */}
                <div className="label19">
                  <RequiredLabel text="Highlight:" />
                  <Field
                    className={`input19 ${errors.highlight && touched.highlight ? 'error-input' : touched.highlight ? 'valid-input' : ''}`}
              type="text" 
              name="highlight" 
                  />
                  <ErrorMessage name="highlight" component="span" className="error-message19" />
                </div>

                {/* Overview field */}
                <div className="label19">
                  <RequiredLabel text="Overview:" />
                  <Field
                    as="textarea"
                    className={`textarea19 ${errors.overview && touched.overview ? 'error-input' : touched.overview ? 'valid-input' : ''}`}
              name="overview" 
                  />
                  <ErrorMessage name="overview" component="span" className="error-message19" />
                </div>

          <h3 className="h3-19">Quick Info:</h3>
                
                {/* Address field */}
                <div className="label19">
                  <RequiredLabel text="Address:" />
                  <Field
                    className={`input19 ${errors.address && touched.address ? 'error-input' : touched.address ? 'valid-input' : ''}`}
              type="text" 
              name="address" 
                  />
                  <ErrorMessage name="address" component="span" className="error-message19" />
                </div>

                {/* Map picker */}
          <div className="map-section19">
            <h3 className="h3-19">Select Location on Map</h3>
            <div className="map-container19">
              <MapPicker
                      onLocationSelect={(location) => handleLocationSelect(location, setFieldValue)}
                      initialLocation={values.locationDetails}
              />
            </div>
          </div>

                {/* Trip type field */}
                <div className="label19">
                  <RequiredLabel text="Trip Type:" />
                  <Field
                    className={`input19 ${errors.tripType && touched.tripType ? 'error-input' : touched.tripType ? 'valid-input' : ''}`}
              type="text" 
              name="tripType" 
              readOnly 
                  />
                  <ErrorMessage name="tripType" component="span" className="error-message19" />
                </div>

                {/* Date fields */}
                <div className="label19">
                  <RequiredLabel text="Start Date:" />
                  <Field
                    className={`input19 ${errors.startDate && touched.startDate ? 'error-input' : touched.startDate ? 'valid-input' : ''}`}
              type="date" 
              name="startDate" 
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <ErrorMessage name="startDate" component="span" className="error-message19" />
                </div>
                
                <div className="label19">
                  <RequiredLabel text="End Date:" />
                  <Field
                    className={`input19 ${errors.endDate && touched.endDate ? 'error-input' : touched.endDate ? 'valid-input' : ''}`}
              type="date" 
              name="endDate" 
                    onChange={handleDateChange}
                    min={values.startDate || new Date().toISOString().split('T')[0]}
                  />
                  <ErrorMessage name="endDate" component="span" className="error-message19" />
                </div>
                
                <div className="label19">
                  <RequiredLabel text="Duration:" />
                  <Field
                    className={`input19 ${errors.duration && touched.duration ? 'error-input' : touched.duration ? 'valid-input' : ''}`}
              type="text" 
              name="duration" 
              readOnly 
                  />
                  <ErrorMessage name="duration" component="span" className="error-message19" />
                </div>

                {/* Category field */}
                <div className="label19">
                  <RequiredLabel text="Category:" />
                  <Field
                    className={`input19 ${errors.category && touched.category ? 'error-input' : touched.category ? 'valid-input' : ''}`}
                    type="text" 
                    name="category" 
                    onChange={(e) => {
                      handleChange(e);
                      filterGuidesByCategory(e.target.value);
                    }}
                  />
                  <ErrorMessage name="category" component="span" className="error-message19" />
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
                  <div className="guide-selection19">
                    <h3 className="h3-19">Select a guide:</h3>
                    {filteredGuides.length > 0 ? (
                      <div className="select-wrapper19">
                        <Field
                          as="select"
                          name="guideId"
                          onChange={handleGuideChange}
                          className={`input19 ${errors.guideId && touched.guideId ? 'error-input' : touched.guideId ? 'valid-input' : ''}`}
                        >
                          <option value="">Select a guide</option>
                          {filteredGuides.map((guide) => (
                            <option key={guide._id} value={guide._id}>
                              {guide.firstName} {guide.lastName} - NPR {guide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay}/day
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="guideId" component="span" className="error-message19" />
                      </div>
                    ) : (
                      <p className="no-guides-message19">
                        {values.category 
                          ? "No guides available with matching service types. Please try a different category."
                          : "Please enter a category to see matching guides."}
                      </p>
                    )}

                    {selectedGuide && (
                      <div className="guide-details19">
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

                {/* Group size field */}
                <div className="label19">
                  <RequiredLabel text="Group Size:" />
                  <Field
                    className={`input19 ${errors.groupSize && touched.groupSize ? 'error-input' : touched.groupSize ? 'valid-input' : ''}`}
              type="text" 
              name="groupSize" 
                  />
                  <ErrorMessage name="groupSize" component="span" className="error-message19" />
                </div>
                
                {/* Difficulty field */}
                <div className="label19">
                  <RequiredLabel text="Difficulty:" />
                  <Field
                    className={`input19 ${errors.difficulty && touched.difficulty ? 'error-input' : touched.difficulty ? 'valid-input' : ''}`}
              type="text" 
              name="difficulty" 
                  />
                  <ErrorMessage name="difficulty" component="span" className="error-message19" />
                </div>

                {/* Age restriction field */}
                <div className="label19">
                  <RequiredLabel text="Age Restriction:" />
                  <Field
                    className={`input19 ${errors.ageRestriction && touched.ageRestriction ? 'error-input' : touched.ageRestriction ? 'valid-input' : ''}`}
              type="text" 
              name="ageRestriction" 
                  />
                  <ErrorMessage name="ageRestriction" component="span" className="error-message19" />
                </div>

                {/* Pickup details field */}
                <div className="label19">
                  <RequiredLabel text="Pickup Details:" />
                  <Field
                    as="textarea"
                    className={`textarea19 ${errors.pickupDetails && touched.pickupDetails ? 'error-input' : touched.pickupDetails ? 'valid-input' : ''}`}
              name="pickupDetails" 
                  />
                  <ErrorMessage name="pickupDetails" component="span" className="error-message19" />
                </div>

                {/* Accessibility field */}
                <div className="label19">
                  <RequiredLabel text="Accessibility:" />
                  <Field
                    as="textarea"
                    className={`textarea19 ${errors.accessibility && touched.accessibility ? 'error-input' : touched.accessibility ? 'valid-input' : ''}`}
              name="accessibility" 
                  />
                  <ErrorMessage name="accessibility" component="span" className="error-message19" />
                </div>

                {/* Cancellation policy field */}
                <div className="label19">
                  <RequiredLabel text="Cancellation Policy:" />
                  <Field
                    as="textarea"
                    className={`textarea19 ${errors.cancellationPolicy && touched.cancellationPolicy ? 'error-input' : touched.cancellationPolicy ? 'valid-input' : ''}`}
              name="cancellationPolicy" 
                  />
                  <ErrorMessage name="cancellationPolicy" component="span" className="error-message19" />
                </div>

                {/* Operator field */}
                <div className="label19">
                  <RequiredLabel text="Operator:" />
                  <Field
                    className={`input19 ${errors.operator && touched.operator ? 'error-input' : touched.operator ? 'valid-input' : ''}`}
              type="text" 
              name="operator" 
                  />
                  <ErrorMessage name="operator" component="span" className="error-message19" />
                </div>

          <h3 className="h3-19">Day by Day Itinerary:</h3>
                
                {/* Itinerary fields */}
                <FieldArray name="itinerary">
                  {() => values.itinerary.map((day, index) => (
                    <div key={index}>
                      <div className="label19">
                        <RequiredLabel text={`Day: ${index + 1}`} />
                        <Field
                          className="input19"
                type="text" 
                          name={`itinerary[${index}].day`}
                readOnly 
                        />
                      </div>
                      
                      <div className="label19">
                        <RequiredLabel text={`Mode: ${index + 1}`} />
                        <Field
                          className={`input19 ${
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
                        />
                        <ErrorMessage name={`itinerary[${index}].mode`} component="span" className="error-message19" />
                      </div>
                      
                      <div className="label19">
                        <RequiredLabel text={`Highlights: ${index + 1}`} />
                        <Field
                          className={`input19 ${
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
                        />
                        <ErrorMessage name={`itinerary[${index}].highlights`} component="span" className="error-message19" />
                      </div>
                      
                      <div className="label19">
                        <RequiredLabel text={`Stay: ${index + 1}`} />
                        <Field
                          className={`input19 ${
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
                        />
                        <ErrorMessage name={`itinerary[${index}].stay`} component="span" className="error-message19" />
                      </div>
                      
                      <div className="label19">
                        <RequiredLabel text={`Meals: ${index + 1}`} />
                        <Field
                          className={`input19 ${
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
                        />
                        <ErrorMessage name={`itinerary[${index}].meals`} component="span" className="error-message19" />
                      </div>
                      
                      <div className="label19">
                        <RequiredLabel text={`Cost Breakdown: ${index + 1}`} />
                        <Field
                          as="textarea"
                          className={`textarea19 ${
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
                        />
                        <ErrorMessage name={`itinerary[${index}].costBreakdown`} component="span" className="error-message19" />
                      </div>
                    </div>
                  ))}
                </FieldArray>

                {/* What's included field */}
                <div className="label19">
                  <RequiredLabel text="What's Included:" />
                  <Field
                    as="textarea"
                    className={`textarea19 ${errors.included && touched.included ? 'error-input' : touched.included ? 'valid-input' : ''}`}
                name="included" 
                  />
                  <ErrorMessage name="included" component="span" className="error-message19" />
                </div>

                {/* Additional info field */}
                <div className="label19">
                  <RequiredLabel text="Additional Information:" />
                  <Field
                    as="textarea"
                    className={`textarea19 ${errors.additionalInfo && touched.additionalInfo ? 'error-input' : touched.additionalInfo ? 'valid-input' : ''}`}
                name="additionalInfo" 
                  />
                  <ErrorMessage name="additionalInfo" component="span" className="error-message19" />
                </div>

                {/* Price section */}
          <div className="price-section19">
            <h4 className="price-heading19">Package Pricing</h4>
            <div className="price-input-section19">
                    <div className="label19">
                      <RequiredLabel text="Base Package Price (NPR):" />
                      <Field
                        className={`input19 ${errors.price && touched.price ? 'error-input' : touched.price ? 'valid-input' : ''}`}
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
                      <ErrorMessage name="price" component="span" className="error-message19" />
                    </div>
            </div>
            
            <div className="pricing-summary19">
              <div className="price-line19">
                <span className="price-label19">Base Price:</span>
                      <span className="price-value19">NPR {parsePrice(values.price).toLocaleString()}</span>
              </div>
              
                    {values.guideIncluded && selectedGuide && (
                <div className="price-line19">
                  <span className="price-label19">Guide Cost ({selectedGuide.firstName} {selectedGuide.lastName}):</span>
                        <span className="price-value19">NPR {parsePrice(values.guideCost).toLocaleString()}</span>
                </div>
              )}
              
              <div className="price-line19 total-price-line19">
                <span className="price-label19">Total Package Price:</span>
                      <span className="price-value19 total-price-value19">{calculateTotalPrice(values)}</span>
              </div>
              
              <div className="price-note19">
                <p>Note: The total price (base price + guide cost) will be displayed to users.</p>
              </div>
            </div>
          </div>

                {/* Form buttons */}
          <div className="button-container19">
                  <Link to="/ItineraryPackage">
                    <button type="button" className="cancel-btn19">Cancel</button>
                  </Link>
                  <button 
                    type="button" 
                    className="create-btn19" 
                    disabled={isSubmitting || loading}
                    onClick={() => {
                      // Submit form manually
                      if (formRef.current) {
                        console.log("Manually submitting form");
                        
                        // Before submission, check for errors and only scroll if there are errors
                        const hasErrors = Object.keys(formRef.current.errors || {}).length > 0;
                        
                        // Submit the form
                        formRef.current.handleSubmit();
                        
                        // If there are errors, only then scroll to the first error
                        // This prevents scrolling during regular typing/input
                        if (hasErrors) {
                          setTimeout(() => {
                            const firstErrorField = Object.keys(formRef.current.errors)[0];
                            const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
                            if (errorElement) {
                              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 100);
                        }
                      }
                    }}
                  >
                    {isSubmitting || loading ? "Adding..." : "Create"}
            </button>
          </div>
              </Form>
            );
          }}
        </Formik>
      </div>
      <Footer />
    </>
  );
}
