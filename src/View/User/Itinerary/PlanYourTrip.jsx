import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./PlanYourTrip.css";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import MapPicker from "../../../Components/MapPicker";

// Add toast configuration at the top after imports
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light"
};

export default function PlanYourTripPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tripName: "",
    startDate: "",
    endDate: "",
    tripType: "", 
    duration: "",
    destinations: "",
    locationDetails: {
      latitude: 27.7172,
      longitude: 85.3240,
      formattedAddress: ""
    },
    adventureActivities: [],
    culturalExperiences: [],
    relaxation: [],
    foodCulinary: [],
    nightlifeEntertainment: [],
    customActivities: "", 
    travelStyle: "",
    accommodationType: "", 
    mealsPreferences: "", 
    dietaryPreferences: [],
    customDietaryPreference: "", 
    transportationType: "", 
    itinerary: [],
    personalizedExperiences: "",
    travelInsurance: false, 
    includeEvents: false, 
    totalBudget: "",
    transportCost: "",
    accommodationCost: "",
    mealsCost: "",
    activitiesCost: "",
    userId: "",
    userName: "",
    userEmail: "",
    userAddress: "",
    groupSize: "",
    guideIncluded: false,
    guideId: "",
    guideCost: 0
  });

  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Add a state for approved guides list
  const [approvedGuides, setApprovedGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);

  // Get current date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to create a trip");
          return;
        }

        const response = await axios.get(
          "http://localhost:4000/adminUpdateProfile/getProfile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data) {
          // Update localStorage with complete user data
          localStorage.setItem("user", JSON.stringify(response.data));
          setUser(response.data);
          setFormData(prev => ({
            ...prev,
            userName: `${response.data.firstName} ${response.data.lastName}`,
            userEmail: response.data.email,
            userAddress: response.data.address,
            userId: response.data._id
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data. Please try again.");
      }
    };

    fetchUserData();
  }, []);

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
    }
  };

  const COST_RANGES = {
    transport: {
        Flights: 1500,
        "Private Car/Van": 1200,
        Buses: 500,
        None: 0,
    },
    accommodation: {
        None: 0,
        Guesthouses: 800,
        Hostels: 600,
        "Mid-Range": 1200,
        "3-Star Hotels": 2000,
        Homestays: 900,
        Luxury: 3500,
        "5-Star Hotels": 5000,
        Resorts: 6000,
    },
    meals: {
        None: 0,
        "All-Inclusive": 1200,
        "Self-Catering": 800,
    },
    activities: {
        Adventure: {
            "Hiking & Trekking": 1200,
            Paragliding: 2500,
            Rafting: 1800,
        },
        Cultural: {
            Temples: 500,
            Museums: 600,
            Festivals: 800,
        },
        Relaxation: {
            "Lakeside Strolls": 200,
            "Hot Springs": 800,
            Spas: 1500,
        },
        Culinary: {
            "Food Tours": 1000,
            "Street Food": 500,
            "Cooking Classes": 1200,
        },
        Nightlife: {
            Clubs: 800,
            "Live Music": 600,
        },
        Custom: {
            "Custom Activity": 1000,
        },
        Dietary: {
            "Vegetarian": 600,
            "Vegan": 800,
            "Gluten-Free": 900,
            "Nut-Free": 800,
            "Custom Dietary": 900
        }
    },
    travelStyles: {
        single: 1.2,
        couples: 0.9,
        family: 0.8,
        groups: 0.7,
    },
    travelInsurance: 1500,
    eventsFestivals: {
        local: 600,
        special: 1000,
    },
    guide: {
      perDay: 1000,
    },
};

const calculateCostBreakdown = (data) => {
  let {
      duration,
      accommodationType,
      transportationType,
      mealsPreferences,
      travelStyle,
      groupSize,
      adventureActivities,
      culturalExperiences,
      relaxation,
      foodCulinary,
      nightlifeEntertainment,
      customActivities,
      dietaryPreferences,
      customDietaryPreference,
      travelInsurance: includeInsurance,
      includeEvents,
      guideIncluded,
      guideCost
  } = data;

  let days = parseInt(duration) || 1;
  let totalBudget = 0;

  // If no accommodationType, transportationType, or mealsPreferences are selected,
  // set their costs to 0 instead of using default values
  let accommodationTypeValue = Array.isArray(accommodationType) ? accommodationType[0] : accommodationType;
  let mealsPreferencesValue = Array.isArray(mealsPreferences) ? mealsPreferences[0] : mealsPreferences;
  let transportTypeValue = Array.isArray(transportationType) ? transportationType[0] : transportationType;

  // Initialize costs with 0 by default
  let minTransport = 0;
  let minAccommodation = 0;
  let minMeals = 0;
  
  // Only set costs if options are actually selected
  if (transportTypeValue && transportTypeValue !== "None") {
    minTransport = COST_RANGES.transport[transportTypeValue] || 0;
  }
  
  if (accommodationTypeValue && accommodationTypeValue !== "None") {
    minAccommodation = COST_RANGES.accommodation[accommodationTypeValue] || 0;
  }
  
  if (mealsPreferencesValue && mealsPreferencesValue !== "None") {
    minMeals = COST_RANGES.meals[mealsPreferencesValue] || 0;
  }

  // Calculate total activity costs including custom activities
  let totalActivityCost = 0;
  if (adventureActivities.length > 0 || culturalExperiences.length > 0 || 
      relaxation.length > 0 || foodCulinary.length > 0 || nightlifeEntertainment.length > 0) {
    [...adventureActivities, ...culturalExperiences, ...relaxation, ...foodCulinary, ...nightlifeEntertainment].forEach(activity => {
        for (let category in COST_RANGES.activities) {
            if (COST_RANGES.activities[category][activity]) {
                totalActivityCost += COST_RANGES.activities[category][activity];
            }
        }
    });
  }

  // Add cost for custom activities if present
  if (customActivities && customActivities.trim() !== "") {
      totalActivityCost += COST_RANGES.activities.Custom["Custom Activity"];
  }

  // Add cost for dietary preferences
  if (dietaryPreferences && dietaryPreferences.length > 0 && dietaryPreferences[0] !== "None") {
      const dietaryPref = Array.isArray(dietaryPreferences) ? dietaryPreferences[0] : dietaryPreferences;
      if (COST_RANGES.activities.Dietary[dietaryPref]) {
          totalActivityCost += COST_RANGES.activities.Dietary[dietaryPref];
      }
  }

  // Add cost for custom dietary preferences if present
  if (customDietaryPreference && customDietaryPreference.trim() !== "") {
      totalActivityCost += COST_RANGES.activities.Dietary["Custom Dietary"];
  }

  let insuranceCost = includeInsurance ? COST_RANGES.travelInsurance : 0;
  let eventsCost = includeEvents ? COST_RANGES.eventsFestivals.local : 0;

  let travelStyleMultiplier = 1.0;
  if (travelStyle) {
    travelStyleMultiplier = COST_RANGES.travelStyles[travelStyle.toLowerCase()] || 1.0;
  }

  // Adjust multiplier based on group size for Family and Groups
  if (travelStyle === "Family" || travelStyle === "Groups") {
    const size = parseInt(groupSize) || 1;
    if (size > 1) {
      // Additional discount for larger groups
      travelStyleMultiplier *= (1 - (Math.min(size - 1, 10) * 0.05)); // 5% discount per additional person up to 50%
    }
  }

  // Add guide cost if guide is included
  let guideTotalCost = 0;
  if (guideIncluded && guideCost) {
    guideTotalCost = parseFloat(guideCost) * days;
  }

  let adjustedTransport = (minTransport * days * travelStyleMultiplier).toFixed(2);
  let adjustedAccommodation = (minAccommodation * days * travelStyleMultiplier).toFixed(2);
  let adjustedMeals = (minMeals * days * travelStyleMultiplier).toFixed(2);
  let adjustedActivities = (totalActivityCost * travelStyleMultiplier).toFixed(2);

  totalBudget = (
      parseFloat(adjustedTransport) + 
      parseFloat(adjustedAccommodation) + 
      parseFloat(adjustedMeals) + 
      parseFloat(adjustedActivities) + 
      insuranceCost + 
      eventsCost +
      guideTotalCost
  ).toFixed(2);

  return {
      ...data,
      totalBudget,
      transportCost: adjustedTransport,
      accommodationCost: adjustedAccommodation,
      mealsCost: adjustedMeals,
      activitiesCost: adjustedActivities,
      insuranceCost: insuranceCost.toFixed(2),
      eventsCost: eventsCost.toFixed(2),
      guideCost: guideTotalCost.toFixed(2)
  };
};

const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  if (type === 'checkbox' && name === 'guideIncluded') {
    // Special handling for the guide checkbox
    setFormData((prev) => {
      let updatedData = { 
        ...prev, 
        [name]: checked,
        guideId: '', // Always clear guide ID when toggling checkbox
        guideCost: 0,  // Clear guide cost when toggling checkbox
      };
      
      // If we're including a guide and don't have other selections yet, 
      // we need to ensure we reset other costs to zero
      if (checked) {
        // Only show guide cost and zero out other costs if they haven't been selected
        if (!prev.transportationType || prev.transportationType === "None") {
          updatedData.transportCost = "0.00";
        }
        
        if (!prev.accommodationType || prev.accommodationType === "None") {
          updatedData.accommodationCost = "0.00";
        }
        
        if (!prev.mealsPreferences || prev.mealsPreferences === "None") {
          updatedData.mealsCost = "0.00";
        }
        
        if (prev.adventureActivities?.length === 0 && 
            prev.culturalExperiences?.length === 0 && 
            prev.relaxation?.length === 0 &&
            prev.foodCulinary?.length === 0 &&
            prev.nightlifeEntertainment?.length === 0) {
          updatedData.activitiesCost = "0.00";
        }
      }
      
      setSelectedGuide(null); // Reset selected guide state
      return calculateCostBreakdown(updatedData);
    });
  } else if (name === "guideId") {
    // When changing guide selection
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      
      // If empty value, clear selected guide
      if (!value) {
        setSelectedGuide(null);
        updatedData.guideCost = 0;
      } else {
        // Find the selected guide and update guide cost
        const selectedGuide = approvedGuides.find(guide => guide._id === value);
        if (selectedGuide && selectedGuide.guideProfile && selectedGuide.guideProfile.pricing) {
          updatedData.guideCost = selectedGuide.guideProfile.pricing.perDay || COST_RANGES.guide.perDay;
          setSelectedGuide(selectedGuide);
        }
      }
      
      return calculateCostBreakdown(updatedData);
    });
  } else {
    // Original code for other form elements
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      if (name === "startDate" || name === "endDate") {
        calculateDurationAndTripType(name, value);
      }

      if ([
        "duration", "accommodationType", "transportationType", "mealsPreferences",
        "adventureActivities", "culturalExperiences", "relaxation", "foodCulinary",
        "nightlifeEntertainment", "travelInsurance", "includeEvents"
      ].includes(name)) {
        return calculateCostBreakdown(updatedData);
      }

      return updatedData;
    });
  }
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

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === 'dietaryPreferences') {
      // For dietary preferences, treat as radio buttons
      setFormData(prev => ({
        ...prev,
        dietaryPreferences: [value]
      }));
    } else {
      // Default handling for other checkboxes
      setFormData((prev) => {
        const currentValues = Array.isArray(prev[name]) ? prev[name] : []; 
        return {
          ...prev,
          [name]: checked ? [...currentValues, value] : currentValues.filter((item) => item !== value),
        };
      });
    }
  };

  // Add a dedicated handler for dietary preferences
  const handleDietaryPreferenceChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.tripName?.trim()) newErrors.tripName = "Trip name is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.destinations?.trim()) newErrors.destinations = "Destination is required";
    if (!formData.travelStyle) newErrors.travelStyle = "Travel style is required";
    if (!formData.accommodationType) newErrors.accommodationType = "Accommodation type is required";
    if (!formData.transportationType) newErrors.transportationType = "Transportation type is required";
    if (!formData.mealsPreferences) newErrors.mealsPreferences = "Meals preference is required";
    
    // Past date validation
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      if (startDate < currentDate) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }
    
    if (formData.endDate) {
      const endDate = new Date(formData.endDate);
      if (endDate < currentDate) {
        newErrors.endDate = "End date cannot be in the past";
      }
    }
    
    // Make sure there's at least some data in the itinerary
    if (!formData.itinerary || formData.itinerary.length === 0 || 
        formData.itinerary.every(day => !day.mode && !day.highlights && !day.stay && !day.meals)) {
      newErrors.itinerary = "Day by day itinerary must have at least basic information";
    }

    // Group size validation for Family and Groups
    if ((formData.travelStyle === "Family" || formData.travelStyle === "Groups") && 
        (!formData.groupSize || formData.groupSize < 1)) {
      newErrors.groupSize = "Please specify the group size";
    }

    // Guide validation
    if (formData.guideIncluded && !formData.guideId) {
      newErrors.guideId = "Please select a guide";
    }

    // Date validation (ensuring end date is after start date)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly", toastConfig);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        toast.error("Please log in to create a trip", toastConfig);
        return;
      }

      // Prepare form data with updated user details
      const formDataToSubmit = {
        ...formData,
        userId: user._id,
        userName: formData.userName || `${user.firstName} ${user.lastName}`,
        userEmail: formData.userEmail || user.email,
        userAddress: formData.userAddress || user.address,
        status: "pending",
        // Ensure dietary preferences is properly handled
        dietaryPreferences: Array.isArray(formData.dietaryPreferences) && formData.dietaryPreferences.length > 0 
          ? formData.dietaryPreferences[0] 
          : "None"
      };

      // Convert arrays to proper format
      if (Array.isArray(formDataToSubmit.accommodationType)) {
        formDataToSubmit.accommodationType = formDataToSubmit.accommodationType[0];
      }
      if (Array.isArray(formDataToSubmit.mealsPreferences)) {
        formDataToSubmit.mealsPreferences = formDataToSubmit.mealsPreferences[0];
      }

      // Ensure itinerary is properly formatted
      if (formDataToSubmit.itinerary) {
        formDataToSubmit.itinerary = JSON.stringify(formDataToSubmit.itinerary);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found. Please log in again.", toastConfig);
        return;
      }

      const response = await axios.post(
        "http://localhost:4000/adminAddTrip",
        formDataToSubmit,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
        }
      );

      if (response.data && response.data.message === "Trip added successfully!") {
        toast.success("Trip added successfully!", toastConfig);
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error.response?.data?.message || "Error adding trip. Please try again.";
      toast.error(errorMessage, toastConfig);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      destinations: location.address,
      locationDetails: {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: location.address
      }
    }));
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-container21">
        <div className="heading21">
          <h1 className="title-heading21">Plan Your Trip with Us</h1>
          <p className="title-para21">Create your perfect trip by choosing destinations, activities, and accommodations!</p>
        </div>

        <form onSubmit={handleSubmit} className="form21">
          <h2 className="h2-21">Trip Details</h2>
          <div className="label-container21">
              <label className="label21">
                Trip Name: <span className="required">*</span>
                <input 
                  className={`input21 ${errors.tripName ? 'error-input' : ''}`}
                  type="text" 
                  name="tripName" 
                  value={formData.tripName} 
                  onChange={handleChange}
                />
                {errors.tripName && <p className="error-message21">{errors.tripName}</p>}
              </label>
              <label className="label21">
                Start Date: <span className="required">*</span>
                <input 
                  className={`input21 ${errors.startDate ? 'error-input' : ''}`}
                  type="date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleChange}
                  min={today}
                />
                {errors.startDate && <p className="error-message21">{errors.startDate}</p>}
              </label>
              <label className="label21">
                End Date: <span className="required">*</span>
                <input 
                  className={`input21 ${errors.endDate ? 'error-input' : ''}`}
                  type="date" 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleChange}
                  min={formData.startDate || today}
                />
                {errors.endDate && <p className="error-message21">{errors.endDate}</p>}
              </label>
              <label className="label21">Days:
                  <input className="input21" type="text" name="duration" value={formData.duration} readOnly />
              </label>
          </div>


          
          <h3 className="h3-21">Choose Your Trip Type</h3>
          <div className="radio-container21">
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="tripType" value="Short Trip" checked={formData.tripType === "Short Trip"} onChange={handleChange} /> Short Trip
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="tripType" value="Long Trip" checked={formData.tripType === "Long Trip"} onChange={handleChange} /> Long Trip
              </label>
          </div>

          
          <h3 className="h3-21">Select Your Destinations</h3>
          <div className="label-input-container23">
              <label className="label23">Destination: <span className="required">*</span></label>
              <MapPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.locationDetails}
              />
              {errors.destinations && <p className="error-message21">{errors.destinations}</p>}
          </div>


          
          <h2 className="h2-21">How Do You Want to Spend Your Time?</h2>

          <div className="activity-container21">
              <div className="activity-section21">
                  <h3 className="h3-21">Adventure Activities:</h3>
                  <label className="label-21"><input className="input-21" type="checkbox" name="adventureActivities" value="Hiking & Trekking" onChange={handleCheckboxChange}/> Hiking & Trekking</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="adventureActivities" value="Paragliding" onChange={handleCheckboxChange} /> Paragliding</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="adventureActivities" value="Rafting" onChange={handleCheckboxChange} /> Rafting</label>
              </div>

              <div className="activity-section21">
                  <h3 className="h3-21">Cultural Experiences:</h3>
                  <label className="label-21"><input className="input-21" type="checkbox" name="culturalExperiences" value="Temples" onChange={handleCheckboxChange}/> Temples</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="culturalExperiences" value="Museums" onChange={handleCheckboxChange} /> Museums</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="culturalExperiences" value="Festivals" onChange={handleCheckboxChange} /> Festivals</label>
              </div>
          </div>

          <div className="activity-container21">
              <div className="activity-section21">
                  <h3 className="h3-21">Relaxation:</h3>
                  <label className="label-21"><input className="input-21" type="checkbox" name="relaxation" value="Lakeside Strolls" onChange={handleCheckboxChange} /> Lakeside Strolls</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="relaxation" value="Hot Springs" onChange={handleCheckboxChange} /> Hot Springs</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="relaxation" value="Spas" onChange={handleCheckboxChange} /> Spas</label>
              </div>

              <div className="activity-section21">
                  <h3 className="h3-21">Food & Culinary:</h3>
                  <label className="label-21"><input className="input-21" type="checkbox" name="foodCulinary" value="Food Tours" onChange={handleCheckboxChange} /> Food Tours</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="foodCulinary" value="Street Food" onChange={handleCheckboxChange} /> Street Food</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="foodCulinary" value="Cooking Classes" onChange={handleCheckboxChange} /> Cooking Classes</label>
              </div>
          </div>

          <div className="activity-container21">
              <div className="activity-section21">
                  <h3 className="h3-21">Nightlife & Entertainment:</h3>
                  <label className="label-21"><input className="input-21" type="checkbox" name="nightlifeEntertainment" value="Clubs" onChange={handleCheckboxChange} /> Clubs</label>
                  <label className="label-21"><input className="input-21" type="checkbox" name="nightlifeEntertainment" value="Live Music" onChange={handleCheckboxChange} /> Live Music</label>
              </div>

              <div className="activity-section21">
                <h3 className="h3-21">Others (Custom Activities):</h3>
                <label className="label-21"><textarea className="custom-textarea21" name="customActivities" value={formData.customActivities} onChange={handleChange}  placeholder="Enter your custom activities here..." /></label>
          </div>

          </div>

          <h3 className="h3-21">Travel Style: <span className="required">*</span></h3>
          {errors.travelStyle && <p className="error-message21">{errors.travelStyle}</p>}
          <div className="travel-style-options21">
              <label className="travel-style-label21">
                  <input 
                      className="travel-style-input21" 
                      type="radio" 
                      name="travelStyle" 
                      value="Solo" 
                      checked={formData.travelStyle === "Solo"}
                      onChange={handleChange} 
                  />
                  <span className="icon">👤</span> Solo
              </label>
              <label className="travel-style-label21">
                  <input 
                      className="travel-style-input21" 
                      type="radio" 
                      name="travelStyle" 
                      value="Couples" 
                      checked={formData.travelStyle === "Couples"}
                      onChange={handleChange} 
                  />
                  <span className="icon">❤️</span> Couples
              </label>
              <label className="travel-style-label21">
                  <input 
                      className="travel-style-input21" 
                      type="radio" 
                      name="travelStyle" 
                      value="Groups" 
                      checked={formData.travelStyle === "Groups"}
                      onChange={handleChange} 
                  />
                  <span className="icon">👥</span> Groups
              </label>
              <label className="travel-style-label21">
                  <input 
                      className="travel-style-input21" 
                      type="radio" 
                      name="travelStyle" 
                      value="Family" 
                      checked={formData.travelStyle === "Family"}
                      onChange={handleChange} 
                  />
                  <span className="icon">👨‍👩‍👧‍👦</span> Family
              </label>
          </div>

          {(formData.travelStyle === "Family" || formData.travelStyle === "Groups") && (
            <div className="group-size-input21">
              <label className="label21">
                Number of People:
                <input
                  type="number"
                  min="1"
                  max="20"
                  name="groupSize"
                  value={formData.groupSize}
                  onChange={handleChange}
                  className={`input21 ${errors.groupSize ? 'error-input' : ''}`}
                />
              </label>
              {errors.groupSize && <span className="error-message21">{errors.groupSize}</span>}
            </div>
          )}

          <h2 className="h2-21">Select Your Accommodation Preferences</h2>

          <h3 className="h3-21">Accommodation Type: <span className="required">*</span></h3>
          {errors.accommodationType && <p className="error-message21">{errors.accommodationType}</p>}
          <div className="accommodation-options21">
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="Guesthouses" onChange={handleCheckboxChange} />
                  Guesthouses
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="Hostels" onChange={handleCheckboxChange} />
                  Hostels
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="Mid-Range" onChange={handleCheckboxChange} />
                  Mid-Range
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="3-Star Hotels" onChange={handleCheckboxChange} />
                  3-Star Hotels
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="Homestays" onChange={handleCheckboxChange} />
                  Homestays
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="Luxury" onChange={handleCheckboxChange} />
                  Luxury
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="5-Star Hotels" onChange={handleCheckboxChange} />
                  5-Star Hotels
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="Resorts" onChange={handleCheckboxChange} />
                  Resorts
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="accommodationType" value="None" onChange={handleCheckboxChange} />
                  None
              </label>
          </div>

          <h3 className="h3-21">Meals Preferences: <span className="required">*</span></h3>
          {errors.mealsPreferences && <p className="error-message21">{errors.mealsPreferences}</p>}
          <div className="meals-preferences-options21">
              <label className="radio-label21">
                  <input type="radio" name="mealsPreferences" value="All-Inclusive" onChange={handleCheckboxChange} />
                  All-Inclusive
              </label>
              <label className="radio-label21">
                  <input type="radio" name="mealsPreferences" value="Self-Catering" onChange={handleCheckboxChange} />
                  Self-Catering
              </label>
              <label className="radio-label21">
                  <input type="radio" name="mealsPreferences" value="None" onChange={handleCheckboxChange} />
                  None
              </label>
          </div>

          <h3 className="h3-21">Dietary Preferences:</h3>
          <div className="dietary-preferences-options21">
              <label className="radio-label21">
                  <input 
                      className="radio-input21" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Vegetarian" 
                      checked={formData.dietaryPreferences.includes("Vegetarian")}
                      onChange={(e) => handleCheckboxChange(e)}
                  />
                  Vegetarian
              </label>
              <label className="radio-label21">
                  <input 
                      className="radio-input21" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Vegan" 
                      checked={formData.dietaryPreferences.includes("Vegan")}
                      onChange={(e) => handleCheckboxChange(e)}
                  />
                  Vegan
              </label>
              <label className="radio-label21">
                  <input 
                      className="radio-input21" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Gluten-Free" 
                      checked={formData.dietaryPreferences.includes("Gluten-Free")}
                      onChange={(e) => handleCheckboxChange(e)}
                  />
                  Gluten-Free
              </label>
              <label className="radio-label21">
                  <input 
                      className="radio-input21" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Nut-Free" 
                      checked={formData.dietaryPreferences.includes("Nut-Free")}
                      onChange={(e) => handleCheckboxChange(e)}
                  />
                  Nut-Free
              </label>
              <label className="radio-label21">
                  <input 
                      className="radio-input21" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="None" 
                      checked={formData.dietaryPreferences.length === 0}
                      onChange={(e) => handleCheckboxChange(e)}
                  />
                  None
              </label>
          </div>

          <div className="custom-dietary-preference21">
              <label className="label21">
                  Other Dietary Preferences:
                  <input
                      type="text"
                      name="customDietaryPreference"
                      value={formData.customDietaryPreference || ""}
                      onChange={handleChange}
                      placeholder="Enter any other dietary preferences"
                      className="input21"
                  />
              </label>
          </div>

          <h2 className="h2-21">Guide Selection</h2>

          <h3 className="h3-21">Would you like to include a guide?</h3>
          <div className="guide-option">
            <label className="label-21">
              <input
                type="checkbox"
                name="guideIncluded"
                checked={formData.guideIncluded}
                onChange={handleChange}
                className="input-21"
              />
              Include a professional guide for your trip
            </label>
          </div>

          {formData.guideIncluded && (
            <div className="guide-selection" style={{ marginTop: '20px' }}>
              <h3 className="h3-21" style={{ marginBottom: '15px' }}>Select your guide:</h3>
              {approvedGuides.length > 0 ? (
                <div className="select-wrapper" style={{ marginBottom: '20px' }}>
                  <select
                    name="guideId"
                    value={formData.guideId}
                    onChange={handleChange}
                    className={`select-input ${errors.guideId ? 'error-input' : ''}`}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">Select a guide</option>
                    {approvedGuides.map((guide) => (
                      <option key={guide._id} value={guide._id}>
                        {guide.firstName} {guide.lastName} - NPR {guide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay}/day
                      </option>
                    ))}
                  </select>
                  {errors.guideId && <span className="error-message21" style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '5px' }}>{errors.guideId}</span>}
                </div>
              ) : (
                <p className="no-guides-message" style={{ color: '#666', fontStyle: 'italic' }}>No guides available. Please try again later.</p>
              )}

              {selectedGuide && (
                <div className="guide-details" style={{ 
                  background: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  marginBottom: '25px'
                }}>
                  <h4 style={{ fontSize: '18px', marginBottom: '15px', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Guide Details:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <p><strong>Name:</strong> {selectedGuide.firstName} {selectedGuide.lastName}</p>
                    <p><strong>Languages:</strong> {selectedGuide.guideProfile?.languages?.join(", ") || "Not specified"}</p>
                    <p><strong>Regions of Expertise:</strong> {selectedGuide.guideProfile?.regionsOfExpertise?.join(", ") || "Not specified"}</p>
                    <p><strong>Service Types:</strong> {selectedGuide.guideProfile?.serviceTypes?.join(", ") || "Not specified"}</p>
                    <p><strong>Price per Day:</strong> NPR {selectedGuide.guideProfile?.pricing?.perDay || COST_RANGES.guide.perDay}</p>
                    <p><strong>Total Guide Cost:</strong> NPR {formData.guideCost || "0.00"} ({formData.duration})</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <h2 className="h2-21">Select Your Transportation Preferences</h2>

          <h3 className="h3-21">Transportation Type: <span className="required">*</span></h3>
          {errors.transportationType && <p className="error-message21">{errors.transportationType}</p>}
          <div className="transportation-options21">
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="transportationType" value="Flights" onChange={handleChange} />
                  <span className="icon">✈️</span> Flights
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="transportationType" value="Private Car/Van" onChange={handleChange} />
                  <span className="icon">🚗</span> Private Car/Van
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="transportationType" value="Buses" onChange={handleChange} />
                  <span className="icon">🚌</span> Buses
              </label>

              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="transportationType" value="None" onChange={handleChange} />
                  <span className="icon">❌</span> None
              </label>
          </div>


          <h2 className="h2-21">Create your Day by Day Itinerary:</h2>
          <h3 className="h3-21">Day by Day Itinerary: <span className="required">*</span></h3>
          {errors.itinerary && <p className="error-message21">{errors.itinerary}</p>}
          {formData.itinerary.map((day, index) => (
            <div key={index} className="itinerary-day-item21">
              <div className="itinerary-input-group21">
                <label className="itinerary-label21">Day:<input className="itinerary-input21" type="text" name="day" value={day.day} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter day..."/></label>
                <label className="itinerary-label21">Mode:<input className="itinerary-input21" type="text" name="mode" value={day.mode} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter mode..." /></label>
              </div>

              <div className="itinerary-input-group21">
                <label className="itinerary-label21">Highlights:<input className="itinerary-input21" type="text" name="highlights" value={day.highlights} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter highlights..."/> </label>
                <label className="itinerary-label21">Stay:<input className="itinerary-input21"
                    type="text" name="stay" value={day.stay} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter stay..."/></label>
              </div>

              <div className="itinerary-input-group21">
                <label className="itinerary-label21">Meals:<input className="itinerary-input21" type="text" name="meals" value={day.meals}onChange={(e) => handleItineraryChange(index, e)}placeholder="Enter meals..."/></label>
                <label className="itinerary-label21">Cost Breakdown:<textarea className="itinerary-textarea21"name="costBreakdown" value={day.costBreakdown} onChange={(e) => handleItineraryChange(index, e)}placeholder="Cost Breakdown..."/></label>
              </div>
            </div>
          ))}



          <h2 className="h2-21">Add Extra Features to Your Trip</h2>

          <h3 className="h3-21">Personalized Experiences:</h3>
          <textarea className="extra-features-textarea21" name="personalizedExperiences"value={formData.personalizedExperiences}onChange={handleChange} placeholder="Tell us about any special experiences you want to include..."></textarea>

          <h3 className="extra-features-subheader21">Travel Insurance:</h3>
          <label className="label-21"><input className="extra-features-checkbox21"type="checkbox" name="travelInsurance"checked={formData.travelInsurance}onChange={(e) => setFormData({ ...formData, travelInsurance: e.target.checked })}/>Add Travel Insurance for your trip</label>
          <h3 className="extra-features-subheader21">Events/Festivals:</h3>
          <label className="label-21"><input className="extra-features-checkbox21"type="checkbox"name="includeEvents"checked={formData.includeEvents}onChange={(e) => setFormData({ ...formData, includeEvents: e.target.checked })}/>Include local events/festivals during your travel dates?</label>


                    
          <h2 className="h2-21">Set Your Trip Budget</h2>
          <label className="label21"> Total Budget: <input className="input21" type="text" name="totalBudget" value={formData.totalBudget} onChange={handleChange} placeholder="Enter your total trip budget" /></label>
          <h3 className="h3-21">Auto-Calculated Cost Breakdown:</h3>
          <div className="cost-section21">
          <div className="cost-input-group21">
            <label className="cost-label21">Transport:<input className="cost-input21" type="text" name="transportCost" value={formData.transportCost} readOnly placeholder="Auto-calculated" /></label>
            <label className="cost-label21">Accommodation:<input className="cost-input21" type="text" name="accommodationCost" value={formData.accommodationCost} readOnly placeholder="Auto-calculated" /></label></div>
          <div className="cost-input-group21">
            <label className="cost-label21">Meals:<input className="cost-input21" type="text" name="mealsCost" value={formData.mealsCost} readOnly placeholder="Auto-calculated" /></label>
            <label className="cost-label21">Activities:<input className="cost-input21" type="text" name="activitiesCost" value={formData.activitiesCost} readOnly placeholder="Auto-calculated" /></label>
          </div>
          {formData.guideIncluded && (
            <div className="cost-input-group21">
              <label className="cost-label21">Guide Cost:<input className="cost-input21" type="text" name="guideCostDisplay" value={formData.guideCost || "N/A"} readOnly placeholder="Auto-calculated" /></label>
            </div>
          )}
        </div>

          <h2 className="h2-21">Your Details</h2>
          <div className="user-details-container21">
            <div className="user-details-grid21">
              <div className="user-detail-item21">
                <label className="label21">Full Name:
                  <input 
                    className="input21" 
                    type="text" 
                    name="userName" 
                    value={formData.userName} 
                    onChange={handleChange}
                  />
                </label>
              </div>
              <div className="user-detail-item21">
                <label className="label21">Email:
                  <input 
                    className="input21" 
                    type="email" 
                    name="userEmail" 
                    value={formData.userEmail} 
                    onChange={handleChange}
                  />
                </label>
              </div>
              <div className="user-detail-item21">
                <label className="label21">Address:
                  <input 
                    className="input21" 
                    type="text" 
                    name="userAddress" 
                    value={formData.userAddress} 
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="button-container21">
            <Link to="/View-Trip"><button type="button" className="cancel-btn21">Cancel</button></Link>
            <button type="submit" className="create-btn21" disabled={isSubmitting}>Create</button>
          </div>
        </form>
      </div>
      <Footer />
      <style jsx="true">{`
        .error-input {
          border: 1px solid #ff0000;
        }

        .error-message21 {
          color: #ff0000;
          font-size: 0.8rem;
          margin-top: 4px;
        }

        .group-size-input21 {
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}
