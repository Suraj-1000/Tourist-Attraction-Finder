import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./addPackage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MapPicker from "../../../Components/MapPicker";

export default function AddPackagePage() {
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    highlight: "",
    address: "",
    locationDetails: {
      latitude: 27.7172,
      longitude: 85.3240,
      formattedAddress: ""
    },
    reviews: "",
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
    physicalFitness: "",
    ageRestriction: "",
    pickupDetails: "",
    accessibility: "",
    cancellationPolicy: "",
  });

  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "startDate" || e.target.name === "endDate") {
      calculateDurationAndTripType(e.target.name, e.target.value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
  };

  const calculateDurationAndTripType = (field, value) => {
    let { startDate, endDate } = formData;
    if (field === "startDate") startDate = value;
    if (field === "endDate") endDate = value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end - start;
      const days = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days

      if (days >= 0) {
        const duration = `${days + 1} days`; // Include the last day
        const tripType = days + 1 <= 3 ? "Short Trip" : "Long Trip";

        setFormData((prev) => ({
          ...prev,
          duration,
          tripType,
          itinerary: generateItinerary(days + 1),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          duration: "",
          tripType: "",
          itinerary: [],
        }));
      }
    }
  };

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

  const handleItineraryChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedItinerary = [...prev.itinerary];
      updatedItinerary[index] = { 
        ...updatedItinerary[index], 
        [name]: value 
      };
      
      // Log the updated itinerary for debugging
      console.log("Updated itinerary:", updatedItinerary);
      
      return {
        ...prev,
        itinerary: updatedItinerary
      };
    });
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      locationDetails: {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: location.address
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.highlight?.trim()) newErrors.highlight = "Highlight is required";
    if (!formData.address?.trim()) newErrors.address = "Address is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.category?.trim()) newErrors.category = "Category is required";
    if (!formData.overview?.trim()) newErrors.overview = "Overview is required";
    if (!formData.included?.trim()) newErrors.included = "Included items are required";
    if (!formData.operator?.trim()) newErrors.operator = "Operator is required";

    // Price validation
    if (!formData.price) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(formData.price.replace(/[^0-9.-]+/g, ""));
      if (isNaN(price) || price < 0) {
        newErrors.price = "Price must be a positive number";
      }
    }

    // Group size validation
    if (formData.groupSize) {
      const size = parseInt(formData.groupSize);
      if (isNaN(size) || size < 1) {
        newErrors.groupSize = "Group size must be a positive number";
      }
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }

    // Image validation
    if (!formData.image) {
      newErrors.image = "Package image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly", {
        position: "top-center",
        autoClose: 3000,
        className: 'toast-message19'
      });
      return;
    }

    setLoading(true);
    try {
      const formDataToSubmit = new FormData();
      
      // Add all form data fields
      Object.keys(formData).forEach(key => {
        if (key === 'locationDetails') {
          formDataToSubmit.append(key, JSON.stringify(formData[key]));
        } else if (key === 'image' && formData[key]) {
          formDataToSubmit.append('image', formData[key]);
        } else if (key === 'itinerary') {
          // Ensure itinerary is properly stringified
          const itineraryData = formData.itinerary.map(day => ({
            day: day.day,
            mode: day.mode || '',
            highlights: day.highlights || '',
            stay: day.stay || '',
            meals: day.meals || '',
            costBreakdown: day.costBreakdown || ''
          }));
          formDataToSubmit.append('itinerary', JSON.stringify(itineraryData));
        } else {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      // Log the form data for debugging
      console.log("Submitting itinerary data:", formData.itinerary);

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
            message: `A new travel package "${formData.title}" has been added!`,
            userEmail: user.email,
            recipientType: 'user',
            read: false,
            details: {
              title: formData.title,
              category: formData.category,
              duration: formData.duration,
              price: formData.price,
              highlight: formData.highlight,
              image: response.data.imageUrl, // Use the image URL from the response
              address: formData.address,
              tripType: formData.tripType,
              startDate: formData.startDate,
              endDate: formData.endDate,
              groupSize: formData.groupSize,
              difficulty: formData.difficulty,
              overview: formData.overview,
              included: formData.included,
              additionalInfo: formData.additionalInfo
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
                <h2 style="color: #2c3e50;">New Package Alert: ${formData.title}</h2>
                <p style="color: #34495e;">Dear ${user.firstName},</p>
                <p style="color: #34495e;">We're excited to announce a new travel package that might interest you!</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #2c3e50;">Package Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 8px;"><strong>Title:</strong> ${formData.title}</li>
                    <li style="margin-bottom: 8px;"><strong>Category:</strong> ${formData.category}</li>
                    <li style="margin-bottom: 8px;"><strong>Duration:</strong> ${formData.duration}</li>
                    <li style="margin-bottom: 8px;"><strong>Trip Type:</strong> ${formData.tripType}</li>
                    <li style="margin-bottom: 8px;"><strong>Price:</strong> ${formData.price}</li>
                    <li style="margin-bottom: 8px;"><strong>Group Size:</strong> ${formData.groupSize}</li>
                    <li style="margin-bottom: 8px;"><strong>Difficulty:</strong> ${formData.difficulty}</li>
                  </ul>
                </div>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #2c3e50;">Overview:</h3>
                  <p style="color: #34495e;">${formData.overview}</p>
                  
                  <h4 style="color: #2c3e50; margin-top: 15px;">Highlights:</h4>
                  <p style="color: #34495e;">${formData.highlight}</p>
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
    }
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

        <form onSubmit={handleSubmit} className="form19">
          <h2 className="h2-19">Create New Itinerary Package</h2>

          <label className="label19">
            Title: <span className="required">*</span>
            <input 
              className={`input19 ${errors.title ? 'error-input' : ''}`}
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </label>
          <label className="label19">
            Image: <span className="required">*</span>
            <input 
              type="file" 
              name="image" 
              onChange={handleFileChange}
              className={errors.image ? 'error-input' : ''}
            />
            {errors.image && <span className="error-message">{errors.image}</span>}
          </label>
          <label className="label19">
            Highlight: <span className="required">*</span>
            <input 
              className={`input19 ${errors.highlight ? 'error-input' : ''}`}
              type="text" 
              name="highlight" 
              value={formData.highlight} 
              onChange={handleChange} 
            />
            {errors.highlight && <span className="error-message">{errors.highlight}</span>}
          </label>
          <label className="label19">
            Overview: <span className="required">*</span>
            <textarea 
              className={`textarea19 ${errors.overview ? 'error-input' : ''}`}
              name="overview" 
              value={formData.overview} 
              onChange={handleChange} 
            />
            {errors.overview && <span className="error-message">{errors.overview}</span>}
          </label>

          <h3 className="h3-19">Quick Info:</h3>
          <label className="label19">
            Address: <span className="required">*</span>
            <input 
              className={`input19 ${errors.address ? 'error-input' : ''}`}
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </label>
          <div className="map-section19">
            <h3 className="h3-19">Select Location on Map</h3>
            <div className="map-container19">
              <MapPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.locationDetails}
              />
            </div>
          </div>
          <label className="label19">
            Reviews: <span className="required">*</span>
            <input 
              className={`input19 ${errors.reviews ? 'error-input' : ''}`}
              type="text" 
              name="reviews" 
              value={formData.reviews} 
              onChange={handleChange} 
            />
            {errors.reviews && <span className="error-message">{errors.reviews}</span>}
          </label>
          <label className="label19">
            Trip Type: <span className="required">*</span>
            <input 
              className={`input19 ${errors.tripType ? 'error-input' : ''}`}
              type="text" 
              name="tripType" 
              value={formData.tripType} 
              readOnly 
            />
            {errors.tripType && <span className="error-message">{errors.tripType}</span>}
          </label>

          <label className="label19">
            Start Date: <span className="required">*</span>
            <input 
              className={`input19 ${errors.startDate ? 'error-input' : ''}`}
              type="date" 
              name="startDate" 
              value={formData.startDate} 
              onChange={handleChange} 
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </label>
          <label className="label19">
            End Date: <span className="required">*</span>
            <input 
              className={`input19 ${errors.endDate ? 'error-input' : ''}`}
              type="date" 
              name="endDate" 
              value={formData.endDate} 
              onChange={handleChange} 
            />
            {errors.endDate && <span className="error-message">{errors.endDate}</span>}
          </label>
          <label className="label19">
            Duration: <span className="required">*</span>
            <input 
              className={`input19 ${errors.duration ? 'error-input' : ''}`}
              type="text" 
              name="duration" 
              value={formData.duration} 
              readOnly 
            />
            {errors.duration && <span className="error-message">{errors.duration}</span>}
          </label>

          <label className="label19">
            Category: <span className="required">*</span>
            <input 
              className={`input19 ${errors.category ? 'error-input' : ''}`}
              type="text" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
            />
            {errors.category && <span className="error-message">{errors.category}</span>}
          </label>
          <label className="label19">
            Price: <span className="required">*</span>
            <input 
              className={`input19 ${errors.price ? 'error-input' : ''}`}
              type="text" 
              name="price" 
              value={formData.price} 
              onChange={handleChange}
              placeholder="Enter price (positive number)" 
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </label>
          <label className="label19">
            Group Size: <span className="required">*</span>
            <input 
              className={`input19 ${errors.groupSize ? 'error-input' : ''}`}
              type="text" 
              name="groupSize" 
              value={formData.groupSize} 
              onChange={handleChange} 
            />
            {errors.groupSize && <span className="error-message">{errors.groupSize}</span>}
          </label>
          <label className="label19">
            Difficulty: <span className="required">*</span>
            <input 
              className={`input19 ${errors.difficulty ? 'error-input' : ''}`}
              type="text" 
              name="difficulty" 
              value={formData.difficulty} 
              onChange={handleChange} 
            />
            {errors.difficulty && <span className="error-message">{errors.difficulty}</span>}
          </label>
          
          <label className="label19">
            Age Restriction: <span className="required">*</span>
            <input 
              className={`input19 ${errors.ageRestriction ? 'error-input' : ''}`}
              type="text" 
              name="ageRestriction" 
              value={formData.ageRestriction} 
              onChange={handleChange} 
            />
            {errors.ageRestriction && <span className="error-message">{errors.ageRestriction}</span>}
          </label>
          <label className="label19">
            Pickup Details: <span className="required">*</span>
            <textarea 
              className={`textarea19 ${errors.pickupDetails ? 'error-input' : ''}`}
              name="pickupDetails" 
              value={formData.pickupDetails} 
              onChange={handleChange} 
            />
            {errors.pickupDetails && <span className="error-message">{errors.pickupDetails}</span>}
          </label>
          <label className="label19">
            Accessibility: <span className="required">*</span>
            <textarea 
              className={`textarea19 ${errors.accessibility ? 'error-input' : ''}`}
              name="accessibility" 
              value={formData.accessibility} 
              onChange={handleChange} 
            />
            {errors.accessibility && <span className="error-message">{errors.accessibility}</span>}
          </label>
          <label className="label19">
            Cancellation Policy: <span className="required">*</span>
            <textarea 
              className={`textarea19 ${errors.cancellationPolicy ? 'error-input' : ''}`}
              name="cancellationPolicy" 
              value={formData.cancellationPolicy} 
              onChange={handleChange} 
            />
            {errors.cancellationPolicy && <span className="error-message">{errors.cancellationPolicy}</span>}
          </label>
        
          <label className="label19">
            Operator: <span className="required">*</span>
            <input 
              className={`input19 ${errors.operator ? 'error-input' : ''}`}
              type="text" 
              name="operator" 
              value={formData.operator} 
              onChange={handleChange} 
            />
            {errors.operator && <span className="error-message">{errors.operator}</span>}
          </label>

          <h3 className="h3-19">Day by Day Itinerary:</h3>
          {formData.itinerary.map((day, index) => (
            <div key={index}>
              <label className="label19">
                Day: <span className="required">*</span>
                <input 
                  className={`input19 ${errors.itinerary ? 'error-input' : ''}`}
                  type="text" 
                  name="day" 
                  value={day.day} 
                  readOnly 
                />
                {errors.itinerary && <span className="error-message">{errors.itinerary}</span>}
              </label>
              <label className="label19">
                Mode: <span className="required">*</span>
                <input 
                  className={`input19 ${errors.itinerary ? 'error-input' : ''}`}
                  type="text" 
                  name="mode" 
                  value={day.mode} 
                  onChange={(e) => handleItineraryChange(index, e)} 
                />
                {errors.itinerary && <span className="error-message">{errors.itinerary}</span>}
              </label>
              <label className="label19">
                Highlights: <span className="required">*</span>
                <input 
                  className={`input19 ${errors.itinerary ? 'error-input' : ''}`}
                  type="text" 
                  name="highlights" 
                  value={day.highlights} 
                  onChange={(e) => handleItineraryChange(index, e)} 
                />
                {errors.itinerary && <span className="error-message">{errors.itinerary}</span>}
              </label>
              <label className="label19">
                Stay: <span className="required">*</span>
                <input 
                  className={`input19 ${errors.itinerary ? 'error-input' : ''}`}
                  type="text" 
                  name="stay" 
                  value={day.stay} 
                  onChange={(e) => handleItineraryChange(index, e)} 
                />
                {errors.itinerary && <span className="error-message">{errors.itinerary}</span>}
              </label>
              <label className="label19">
                Meals: <span className="required">*</span>
                <input 
                  className={`input19 ${errors.itinerary ? 'error-input' : ''}`}
                  type="text" 
                  name="meals" 
                  value={day.meals} 
                  onChange={(e) => handleItineraryChange(index, e)} 
                />
                {errors.itinerary && <span className="error-message">{errors.itinerary}</span>}
              </label>
              <label className="label19">
                Cost Breakdown: <span className="required">*</span>
                <textarea 
                  className={`textarea19 ${errors.itinerary ? 'error-input' : ''}`}
                  name="costBreakdown" 
                  value={day.costBreakdown} 
                  onChange={(e) => handleItineraryChange(index, e)} 
                />
                {errors.itinerary && <span className="error-message">{errors.itinerary}</span>}
              </label>
            </div>
          ))}

          <label className="label19">
            What's Included: <span className="required">*</span>
            <textarea 
              className={`textarea19 ${errors.included ? 'error-input' : ''}`}
              name="included" 
              value={formData.included} 
              onChange={handleChange} 
            />
            {errors.included && <span className="error-message">{errors.included}</span>}
          </label>
          <label className="label19">
            Additional Information: <span className="required">*</span>
            <textarea 
              className={`textarea19 ${errors.additionalInfo ? 'error-input' : ''}`}
              name="additionalInfo" 
              value={formData.additionalInfo} 
              onChange={handleChange} 
            />
            {errors.additionalInfo && <span className="error-message">{errors.additionalInfo}</span>}
          </label>

          <div className="button-container19">
            <Link to="/ItineraryPackage"><button type="button" className="cancel-btn19">Cancel</button></Link>
            <button type="submit" className="create-btn19">
              {loading ? "Adding..." : "Create"}
            </button>
          </div>

          <style jsx>{`
            .required {
              color: red;
              margin-left: 2px;
            }
            .error-input {
              border: 1px solid red;
            }
            .error-message {
              color: red;
              font-size: 0.8rem;
              margin-top: 4px;
              display: block;
            }
          `}</style>
        </form>
      </div>
      <Footer />
    </>
  );
}
