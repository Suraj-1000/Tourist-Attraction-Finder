import React, { useState, useEffect, useRef  } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./editPackage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import MapPicker from "../../../Components/MapPicker";

export default function EditPackagePage() {
  const { packageName } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false); 
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
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

  useEffect(() => {
    if (packageName) {
      fetchPackageDetails(packageName);
    }
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
  
        // Ensure the image URL is being correctly set
        const formattedData = {
          ...packageData,
          startDate: packageData.startDate ? packageData.startDate.split("T")[0] : "",
          endDate: packageData.endDate ? packageData.endDate.split("T")[0] : "",
          locationDetails: packageData.locationDetails || {
            latitude: 27.7172,
            longitude: 85.3240,
            formattedAddress: packageData.address || ""
          }
        };
  
        setFormData(formattedData);
  
        // Set the image URL correctly (imageUrl from backend)
        setImagePreview(packageData.imageUrl || ""); // Use imageUrl from backend
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
  
  
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "startDate" || name === "endDate") {
      calculateDurationAndTripType(name, value);
    }
  };
  


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file); // Show preview
        setImagePreview(imageUrl); 
        setFormData((prev) => ({ ...prev, image: file })); // Store the file for submission
    }
};

  



  const calculateDurationAndTripType = (field, value) => {
    let { startDate, endDate } = formData;
    if (field === "startDate") startDate = value;
    if (field === "endDate") endDate = value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max((end - start) / (1000 * 60 * 60 * 24), 0);
      setFormData((prev) => ({
        ...prev,
        duration: days + 1 ? `${days + 1} days` : "",
        tripType: days + 1 <= 3 ? "Short Trip" : "Long Trip",
        itinerary: generateItinerary(days + 1),
      }));
    }
  };

  const generateItinerary = (days) =>
    Array.from({ length: days }, (_, index) => ({
      day: `Day ${index + 1}`,
      mode: "",
      highlights: "",
      stay: "",
      meals: "",
      costBreakdown: "",
    }));

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message20'
      });
      return;
    }

    setUpdating(true);
    try {
      const updateFormData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "locationDetails") {
          updateFormData.append(key, JSON.stringify(formData[key]));
        } else if (key === "image" && formData[key]) {
          updateFormData.append("image", formData[key]);
        } else if (key === "itinerary") {
          // Ensure itinerary is properly stringified
          const itineraryData = formData.itinerary.map(day => ({
            day: day.day,
            mode: day.mode || '',
            highlights: day.highlights || '',
            stay: day.stay || '',
            meals: day.meals || '',
            costBreakdown: day.costBreakdown || ''
          }));
          updateFormData.append('itinerary', JSON.stringify(itineraryData));
        } else {
          updateFormData.append(key, formData[key] || "");
        }
      });

      // Log the form data for debugging
      console.log("Updating itinerary data:", formData.itinerary);

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

        <form onSubmit={handleUpdate} className="form20">
          <h2 className="h2-20">Update Itinerary Package</h2>

          <label className="label20">
            Title: <span className="required">*</span>
            <input 
              className={`input20 ${errors.title ? 'error-input' : ''}`}
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </label>
          <label className="label20">Image: <input type="file" name="image" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" /></label>
          {imagePreview && <img src={imagePreview} alt="Package Preview" className="image-preview20" />} {/* Image Preview */}
          <label className="label20">Highlight: <input className="input20" type="text" name="highlight" value={formData.highlight} onChange={handleChange} /></label>
          <label className="label20">Overview: <textarea className="textarea20" name="overview" value={formData.overview} onChange={handleChange} /></label>

          <h3 className="h3-20">Quick Info:</h3>
          <label className="label20">Address: <input className="input20" type="text" name="address" value={formData.address} onChange={handleChange} /></label>
          
          <div className="map-section20">
            <h3 className="h3-20">Select Location on Map</h3>
            <div className="map-container20">
              <MapPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.locationDetails}
              />
            </div>
          </div>

          <label className="label20">Reviews: <input className="input20" type="text" name="reviews" value={formData.reviews} onChange={handleChange} /></label>
          <label className="label20">Trip Type: <input className="input20" type="text" name="tripType" value={formData.tripType} readOnly /></label>

          <label className="label20">Start Date: <input className="input20" type="date" name="startDate" value={formData.startDate} onChange={handleChange} /></label>
          <label className="label20">End Date: <input className="input20" type="date" name="endDate" value={formData.endDate} onChange={handleChange} /></label>
          <label className="label20">Duration: <input className="input20" type="text" name="duration" value={formData.duration} readOnly /></label>

          <label className="label20">Category: <input className="input20" type="text" name="category" value={formData.category} onChange={handleChange} /></label>
          <label className="label20">
            Price: <span className="required">*</span>
            <input 
              className={`input20 ${errors.price ? 'error-input' : ''}`}
              type="text" 
              name="price" 
              value={formData.price} 
              onChange={handleChange}
              placeholder="Enter price (positive number)" 
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </label>
          <label className="label20">Group Size: <input className="input20" type="text" name="groupSize" value={formData.groupSize} onChange={handleChange} /></label>
          <label className="label20">Difficulty: <input className="input20" type="text" name="difficulty" value={formData.difficulty} onChange={handleChange} /></label>

          <label className="label20">Age Restriction: <input className="input20" type="text" name="ageRestriction" value={formData.ageRestriction} onChange={handleChange} /></label>
          <label className="label20">Pickup Details: <textarea className="textarea20" name="pickupDetails" value={formData.pickupDetails} onChange={handleChange} /></label>
          <label className="label20">Accessibility: <textarea className="textarea20" name="accessibility" value={formData.accessibility} onChange={handleChange} /></label>
          <label className="label20">Cancellation Policy: <textarea className="textarea20" name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleChange} /></label>
        
          <label className="label20">Operator: <input className="input20" type="text" name="operator" value={formData.operator} onChange={handleChange} /></label>

          <h3 className="h3-20">Day by Day Itinerary:</h3>
          {formData.itinerary.map((day, index) => (
            <div key={index}>
              <label className="label20">Day: <input className="input20" type="text" name="day" value={day.day} readOnly /></label>
              <label className="label20">Mode: <input className="input20" type="text" name="mode" value={day.mode} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label20">Highlights: <input className="input20" type="text" name="highlights" value={day.highlights} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label20">Stay: <input className="input20" type="text" name="stay" value={day.stay} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label20">Meals: <input className="input20" type="text" name="meals" value={day.meals} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label20">Cost Breakdown: <textarea className="textarea20" name="costBreakdown" value={day.costBreakdown} onChange={(e) => handleItineraryChange(index, e)} /></label>
            </div>
          ))}

          <label className="label20">What's Included: <textarea className="textarea20" name="included" value={formData.included} onChange={handleChange} /></label>
          <label className="label20">Additional Information: <textarea className="textarea20" name="additionalInfo" value={formData.additionalInfo} onChange={handleChange} /></label>

          <div className="button-container20">
           <Link to="/ItineraryPackage"><button type="button" className="cancel-btn20">Cancel</button></Link>
           <button type="submit" className="update-btn20" disabled={updating}>
    {updating ? "Updating..." : "Update"}
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
