import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./addPackage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddPackagePage() {
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    highlight: "",
    address: "",
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
    const updatedItinerary = [...formData.itinerary];
    updatedItinerary[index] = { ...updatedItinerary[index], [name]: value };
    setFormData({ ...formData, itinerary: updatedItinerary });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData object
      const formDataToSubmit = new FormData();
      
      // Append all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'itinerary') {
          // Stringify the itinerary array
          formDataToSubmit.append(key, JSON.stringify(formData[key]));
        } else if (key === 'image' && formData[key]) {
          // Handle image file
          formDataToSubmit.append(key, formData[key]);
        } else {
          // Handle other fields
          formDataToSubmit.append(key, formData[key]);
        }
      });

      // Log the form data for debugging
      console.log('Submitting form data:', Object.fromEntries(formDataToSubmit));

      // Make the API request
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

          <label className="label19">Title: <input className="input19" type="text" name="title" value={formData.title} onChange={handleChange} /></label>
          <label className="label19">Image: <input type="file" name="image" onChange={handleFileChange} /></label>
          <label className="label19">Highlight: <input className="input19" type="text" name="highlight" value={formData.highlight} onChange={handleChange} /></label>
          <label className="label19">Overview: <textarea className="textarea19" name="overview" value={formData.overview} onChange={handleChange} /></label>

          <h3 className="h3-19">Quick Info:</h3>
          <label className="label19">Address: <input className="input19" type="text" name="address" value={formData.address} onChange={handleChange} /></label>
          <label className="label19">Reviews: <input className="input19" type="text" name="reviews" value={formData.reviews} onChange={handleChange} /></label>
          <label className="label19">Trip Type: <input className="input19" type="text" name="tripType" value={formData.tripType} readOnly /></label>

          <label className="label19">Start Date: <input className="input19" type="date" name="startDate" value={formData.startDate} onChange={handleChange} /></label>
          <label className="label19">End Date: <input className="input19" type="date" name="endDate" value={formData.endDate} onChange={handleChange} /></label>
          <label className="label19">Duration: <input className="input19" type="text" name="duration" value={formData.duration} readOnly /></label>

          <label className="label19">Category: <input className="input19" type="text" name="category" value={formData.category} onChange={handleChange} /></label>
          <label className="label19">Price: <input className="input19" type="text" name="price" value={formData.price} onChange={handleChange} /></label>
          <label className="label19">Group Size: <input  className="input19" type="text" name="groupSize" value={formData.groupSize} onChange={handleChange} /></label>
          <label className="label19">Difficulty: <input className="input19" type="text" name="difficulty" value={formData.difficulty} onChange={handleChange} /></label>
          
          <label className="label19">Age Restriction: <input className="input19" type="text" name="ageRestriction" value={formData.ageRestriction} onChange={handleChange} /></label>
          <label className="label19">Pickup Details: <textarea className="textarea19"name="pickupDetails" value={formData.pickupDetails} onChange={handleChange} /></label>
          <label className="label19">Accessibility: <textarea className="textarea19" name="accessibility" value={formData.accessibility} onChange={handleChange} /></label>
          <label className="label19">Cancellation Policy: <textarea className="textarea19" name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleChange} /></label>
        
          <label className="label19">Operator: <input className="input19" type="text" name="operator" value={formData.operator} onChange={handleChange} /></label>

          <h3 className="h3-19">Day by Day Itinerary:</h3>
          {formData.itinerary.map((day, index) => (
            <div key={index}>
              <label className="label19">Day: <input className="input19" type="text" name="day" value={day.day} readOnly /></label>
              <label className="label19">Mode: <input className="input19" type="text" name="mode" value={day.mode} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label19">Highlights: <input className="input19" type="text" name="highlights" value={day.highlights} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label19">Stay: <input className="input19" type="text" name="stay" value={day.stay} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label19">Meals: <input className="input19" type="text" name="meals" value={day.meals} onChange={(e) => handleItineraryChange(index, e)} /></label>
              <label className="label19">Cost Breakdown: <textarea className="textarea19" name="costBreakdown" value={day.costBreakdown} onChange={(e) => handleItineraryChange(index, e)} /></label>
            </div>
          ))}

          <label className="label19">What's Included: <textarea className="textarea19" name="included" value={formData.included} onChange={handleChange} /></label>
          <label className="label19">Additional Information: <textarea className="textarea19" name="additionalInfo" value={formData.additionalInfo} onChange={handleChange} /></label>

          <div className="button-container19">
            <Link to="/ItineraryPackage"><button type="button" className="cancel-btn19">Cancel</button></Link>
            <button type="submit" className="create-btn19">
              {loading ? "Adding..." : "Create"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
