import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PlanTripEdit.css";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-hot-toast";
import MapPicker from "../../../Components/MapPicker";

export default function PlanTripUpdatePage() {
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
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const { id } = useParams();
  const [errors, setErrors] = useState({});

  const COST_RANGES = {
    transport: {
        Flights: 6650,
        "Private Car/Van": 6650,
        Buses: 1463,
        None: 0,
    },
    accommodation: {
        None: 0,
        Guesthouses: 3325,
        Hostels: 2660,
        "Mid-Range": 6650,
        "3-Star Hotels": 9975,
        Homestays: 3990,
        Luxury: 15960,
        "5-Star Hotels": 26600,
        Resorts: 33250,
    },
    meals: {
        None: 0,
        "All-Inclusive": 5320,
        "Self-Catering": 2660,
    },
    activities: {
        Adventure: {
            "Hiking & Trekking": 5320,
            Paragliding: 13300,
            Rafting: 7980,
        },
        Cultural: {
            Temples: 1995,
            Museums: 2660,
            Festivals: 3325,
        },
        Relaxation: {
            "Lakeside Strolls": 665,
            "Hot Springs": 3990,
            Spas: 6650,
        },
        Culinary: {
            "Food Tours": 5320,
            "Street Food": 1995,
            "Cooking Classes": 4655,
        },
        Nightlife: {
            Clubs: 3990,
            "Live Music": 2660,
        },
        Custom: {
            "Custom Activity": 3990, // Default cost for custom activities
        },
        Dietary: {
            "Vegetarian": 2660,
            "Vegan": 3325,
            "Gluten-Free": 3990,
            "Nut-Free": 3325,
            "Custom Dietary": 3990 // Default cost for custom dietary preferences
        }
    },
    travelStyles: {
        single: 1.2,    // Most expensive (20% more expensive)
        couples: 0.9,   // Small discount (10% off)
        family: 0.8,    // Larger discount (20% off)
        groups: 0.7,    // Heaviest discount (30% off)
    },
    travelInsurance: 6650,
    eventsFestivals: {
        local: 2660,
        special: 3990,
    }
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
  } = data;

  let days = parseInt(duration) || 1;
  let totalBudget = 0;

  let accommodationTypeValue = Array.isArray(accommodationType) ? accommodationType[0] : accommodationType;
  let mealsPreferencesValue = Array.isArray(mealsPreferences) ? mealsPreferences[0] : mealsPreferences;

  let minTransport = COST_RANGES.transport[transportationType] || 20;
  let minAccommodation = COST_RANGES.accommodation[accommodationTypeValue] || 25;
  let minMeals = COST_RANGES.meals[mealsPreferencesValue] || 20;

  // Calculate total activity costs including custom activities
  let totalActivityCost = 0;
  [...adventureActivities, ...culturalExperiences, ...relaxation, ...foodCulinary, ...nightlifeEntertainment].forEach(activity => {
      for (let category in COST_RANGES.activities) {
          if (COST_RANGES.activities[category][activity]) {
              totalActivityCost += COST_RANGES.activities[category][activity];
          }
      }
  });

  // Add cost for custom activities if present
  if (customActivities && customActivities.trim() !== "") {
      totalActivityCost += COST_RANGES.activities.Custom["Custom Activity"];
  }

  // Add cost for dietary preferences
  if (dietaryPreferences && COST_RANGES.activities.Dietary[dietaryPreferences]) {
      totalActivityCost += COST_RANGES.activities.Dietary[dietaryPreferences];
  }

  // Add cost for custom dietary preferences if present
  if (customDietaryPreference && customDietaryPreference.trim() !== "") {
      totalActivityCost += COST_RANGES.activities.Dietary["Custom Dietary"];
  }

  let insuranceCost = includeInsurance ? COST_RANGES.travelInsurance : 0;
  let eventsCost = includeEvents ? COST_RANGES.eventsFestivals.local : 0;

  let travelStyleMultiplier = COST_RANGES.travelStyles[travelStyle.toLowerCase()] || 1.0;

  // Adjust multiplier based on group size for Family and Groups
  if (travelStyle === "Family" || travelStyle === "Groups") {
    const size = parseInt(groupSize) || 1;
    if (size > 1) {
      // Additional discount for larger groups
      travelStyleMultiplier *= (1 - (Math.min(size - 1, 10) * 0.05)); // 5% discount per additional person up to 50%
    }
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
      eventsCost
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
  };
};

const handleChange = (e) => {
  const { name, value } = e.target;

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
          return calculateCostBreakdown(updatedData);  // Correctly updating state with calculated values
      }

      return updatedData;
  });
};

  const calculateDurationAndTripType = (field, value) => {
    let { startDate, endDate } = formData;
    if (field === "startDate") startDate = value;
    if (field === "endDate") endDate = value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end - start;
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days

      if (days > 0) {
        const duration = `${days} days`;
        const tripType = days <= 3 ? "Short Trip" : "Long Trip";

        setFormData((prev) => ({
          ...prev,
          duration,
          tripType,
          itinerary: generateItinerary(days),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          duration: "1 day",
          tripType: "Short Trip",
          itinerary: generateItinerary(1),
        }));
      }
    } else if (startDate) {
      setFormData((prev) => ({
        ...prev,
        duration: "1 day",
        tripType: "Short Trip",
        itinerary: generateItinerary(1),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        duration: "",
        tripType: "",
        itinerary: [],
      }));
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
  
    setFormData((prev) => {
      const currentValues = prev[name] || []; 
      return {
        ...prev,
        [name]: checked ? [...currentValues, value] : currentValues.filter((item) => item !== value),
      };
    });
  };

  const handleLocationSelect = (location) => {
    // Only update the form state, don't make any API calls
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

  useEffect(() => {
    if (id) {
      fetchTripDetails(id);
    }
  }, [id]);

  const fetchTripDetails = async (id) => {
    try {
      console.log(`Fetching details for trip ID: ${id}`);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please log in to edit trips");
        return;
      }

      const response = await axios.get(`http://localhost:4000/adminTrip/trip/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data) {
        console.log("Trip Data:", response.data);
        const tripData = response.data;

        // Format dates for input fields
        const startDate = tripData.startDate ? new Date(tripData.startDate).toISOString().split('T')[0] : "";
        const endDate = tripData.endDate ? new Date(tripData.endDate).toISOString().split('T')[0] : "";

        // Calculate duration if dates are available
        let duration = tripData.duration;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const timeDiff = end - start;
          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
          duration = `${days} days`;
        }

        // Handle dietary preferences properly
        let dietaryPreferences = tripData.dietaryPreferences;
        if (!dietaryPreferences) {
          dietaryPreferences = "None";
        } else if (Array.isArray(dietaryPreferences)) {
          dietaryPreferences = dietaryPreferences[0] || "None";
        }

        setFormData({
          ...tripData,
          startDate,
          endDate,
          duration,
          adventureActivities: Array.isArray(tripData.adventureActivities) ? tripData.adventureActivities : [],
          culturalExperiences: Array.isArray(tripData.culturalExperiences) ? tripData.culturalExperiences : [],
          relaxation: Array.isArray(tripData.relaxation) ? tripData.relaxation : [],
          foodCulinary: Array.isArray(tripData.foodCulinary) ? tripData.foodCulinary : [],
          nightlifeEntertainment: Array.isArray(tripData.nightlifeEntertainment) ? tripData.nightlifeEntertainment : [],
          dietaryPreferences,
          customDietaryPreference: tripData.customDietaryPreference || "",
          itinerary: Array.isArray(tripData.itinerary) ? tripData.itinerary : [],
          travelInsurance: Boolean(tripData.travelInsurance),
          includeEvents: Boolean(tripData.includeEvents),
          locationDetails: tripData.locationDetails || {
            latitude: 27.7172,
            longitude: 85.3240,
            formattedAddress: tripData.destinations || ""
          }
        });
      } else {
        toast.error(`No Trip Found with ID: "${id}"`);
      }
    } catch (error) {
      console.error("Error fetching trip details:", error);
      toast.error(`Failed to load trip details for ID "${id}"`);
    }
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

    // Group size validation for Family and Groups
    if ((formData.travelStyle === "Family" || formData.travelStyle === "Groups") && 
        (!formData.groupSize || formData.groupSize < 1)) {
      newErrors.groupSize = "Please specify the group size";
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
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to update trip");
        return;
      }

      // Calculate duration before sending
      let duration = formData.duration;
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const timeDiff = end - start;
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        duration = `${days} days`;
      }

      // Create the update data object
      const updateData = {
        ...formData,
        duration: duration,
        dietaryPreferences: Array.isArray(formData.dietaryPreferences) 
          ? formData.dietaryPreferences[0] || "None"
          : formData.dietaryPreferences || "None",
        transportationType: Array.isArray(formData.transportationType) 
          ? formData.transportationType[0] 
          : formData.transportationType,
        travelInsurance: Boolean(formData.travelInsurance),
        includeEvents: Boolean(formData.includeEvents),
        locationDetails: formData.locationDetails || {
          latitude: 27.7172,
          longitude: 85.3240,
          formattedAddress: formData.destinations || ""
        }
      };

      const response = await axios.put(
        "http://localhost:4000/adminTrip/updateTrip",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 200) {
        toast.success("Trip updated successfully!");
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating trip:", error);
      toast.error(error.response?.data?.message || "Error updating trip");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-container23">
        <div className="heading23">
          <h1 className="title-heading23">Update Your Trip Plan</h1>
          <p className="title-para23">Modify your destinations, activities, and accommodations to perfect your travel experience!</p>
        </div>

        <form onSubmit={handleUpdate} className="form23">
          <h2 className="h2-23">Update Your Trip Details</h2>
          <div className="label-container23">
              <label className="label23">Trip Name:
                  <input className="input23" type="text" name="tripName" value={formData.tripName} onChange={handleChange} />
              </label>
              <label className="label23">Start Date:
                  <input className="input23" type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
              </label>
              <label className="label23">End Date:
                  <input className="input23" type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
              </label>
              <label className="label23">Days:
                  <input className="input23" type="text" name="duration" value={formData.duration} readOnly />
              </label>
          </div>

          <h3 className="h3-23">Choose Your Trip Type</h3>
          <div className="radio-container23">
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="tripDuration" value="Short Trip" checked={formData.tripType === "Short Trip"} onChange={handleChange} /> Short Trip
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="tripDuration" value="Long Trip" checked={formData.tripType === "Long Trip"} onChange={handleChange} /> Long Trip
              </label>
          </div>

          <h3 className="h3-23">Select Your Destinations</h3>
          <div className="label-input-container23">
              <label className="label23">Destination:</label>
              <MapPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.locationDetails}
              />
          </div>

          <h2 className="h2-23">How Do You Want to Spend Your Time?</h2>

          <div className="activity-container23">
              <div className="activity-section23">
                  <h3 className="h3-23">Adventure Activities:</h3>
                  <label className="label-23"><input className="input-23" type="checkbox" name="adventureActivities" value="Hiking & Trekking" checked={formData.adventureActivities.includes("Hiking & Trekking")} onChange={handleCheckboxChange}/> Hiking & Trekking</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="adventureActivities" value="Paragliding"  checked={formData.adventureActivities.includes("Paragliding")}  onChange={handleCheckboxChange} /> Paragliding</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="adventureActivities" value="Rafting" checked={formData.adventureActivities.includes("Rafting")} onChange={handleCheckboxChange} /> Rafting</label>
              </div>

              <div className="activity-section23">
                  <h3 className="h3-23">Cultural Experiences:</h3>
                  <label className="label-23"><input className="input-23" type="checkbox" name="culturalExperiences" value="Temples"  checked={formData.culturalExperiences.includes("Temples")}  onChange={handleCheckboxChange}/> Temples</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="culturalExperiences" value="Museums" checked={formData.culturalExperiences.includes("Museums")}  onChange={handleCheckboxChange} /> Museums</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="culturalExperiences" value="Festivals"  checked={formData.culturalExperiences.includes("Festivals")}  onChange={handleCheckboxChange} /> Festivals</label>
              </div>
          </div>

          <div className="activity-container23">
              <div className="activity-section23">
                  <h3 className="h3-23">Relaxation:</h3>
                  <label className="label-23"><input className="input-23" type="checkbox" name="relaxation" value="Lakeside Strolls" checked={formData.relaxation.includes("Lakeside Strolls")}  onChange={handleCheckboxChange} /> Lakeside Strolls</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="relaxation" value="Hot Springs" checked={formData.relaxation.includes("Hot Springs")}  onChange={handleCheckboxChange} /> Hot Springs</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="relaxation" value="Spas" checked={formData.relaxation.includes("Spas")} onChange={handleCheckboxChange} /> Spas</label>
              </div>

              <div className="activity-section23">
                  <h3 className="h3-23">Food & Culinary:</h3>
                  <label className="label-23"><input className="input-23" type="checkbox" name="foodCulinary" value="Food Tours" checked={formData.foodCulinary.includes("Food Tours")}  onChange={handleCheckboxChange} /> Food Tours</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="foodCulinary" value="Street Food" checked={formData.foodCulinary.includes("Street Food")}  onChange={handleCheckboxChange} /> Street Food</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="foodCulinary" value="Cooking Classes" checked={formData.foodCulinary.includes("Cooking Classes")}  onChange={handleCheckboxChange} /> Cooking Classes</label>
              </div>
          </div>

          <div className="activity-container23">
              <div className="activity-section23">
                  <h3 className="h3-23">Nightlife & Entertainment:</h3>
                  <label className="label-23"><input className="input-23" type="checkbox" name="nightlifeEntertainment" value="Clubs" checked={formData.nightlifeEntertainment.includes("Clubs")} onChange={handleCheckboxChange} /> Clubs</label>
                  <label className="label-23"><input className="input-23" type="checkbox" name="nightlifeEntertainment" value="Live Music" checked={formData.nightlifeEntertainment.includes("Live Music")}  onChange={handleCheckboxChange} /> Live Music</label>
              </div>

              <div className="activity-section23">
                <h3 className="h3-23">Others (Custom Activities):</h3>
                <label className="label-23"><textarea className="custom-textarea23" name="customActivities" value={formData.customActivities || "N/A"}  onChange={handleChange}  placeholder="Enter your custom activities here..." /></label>
          </div>

          </div>

          <h3 className="h3-23">Travel Style:</h3>
          <div className="travel-style-options23">
              <label className="travel-style-label23">
                  <input 
                      className="travel-style-input23" 
                      type="radio" 
                      name="travelStyle" 
                      value="Solo" 
                      checked={formData.travelStyle === "Solo"}
                      onChange={handleChange} 
                  />
                  <span className="icon">👤</span> Solo
              </label>
              <label className="travel-style-label23">
                  <input 
                      className="travel-style-input23" 
                      type="radio" 
                      name="travelStyle" 
                      value="Couples" 
                      checked={formData.travelStyle === "Couples"}
                      onChange={handleChange} 
                  />
                  <span className="icon">❤️</span> Couples
              </label>
              <label className="travel-style-label23">
                  <input 
                      className="travel-style-input23" 
                      type="radio" 
                      name="travelStyle" 
                      value="Groups" 
                      checked={formData.travelStyle === "Groups"}
                      onChange={handleChange} 
                  />
                  <span className="icon">👥</span> Groups
              </label>
              <label className="travel-style-label23">
                  <input 
                      className="travel-style-input23" 
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
            <div className="group-size-input23">
              <label className="label23">
                Number of People:
                <input
                  type="number"
                  min="1"
                  max="20"
                  name="groupSize"
                  value={formData.groupSize}
                  onChange={handleChange}
                  className={`input23 ${errors.groupSize ? 'error-input23' : ''}`}
                />
              </label>
              {errors.groupSize && <span className="error-message23">{errors.groupSize}</span>}
            </div>
          )}

          <h2 className="h2-23">Select Your Accommodation Preferences</h2>

          <h3 className="h3-23">Accommodation Type:</h3>
          <div className="accommodation-options23">
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="Guesthouses" checked={formData.accommodationType === "Guesthouses"} onChange={handleChange} />
                  Guesthouses
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="Hostels" checked={formData.accommodationType === "Hostels"} onChange={handleChange} />
                  Hostels
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="Mid-Range" checked={formData.accommodationType === "Mid-Range"} onChange={handleChange} />
                  Mid-Range
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="3-Star Hotels" checked={formData.accommodationType === "3-Star Hotels"} onChange={handleChange} />
                  3-Star Hotels
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="Homestays" checked={formData.accommodationType === "Homestays"} onChange={handleChange} />
                  Homestays
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="Luxury" checked={formData.accommodationType === "Luxury"} onChange={handleChange} />
                  Luxury
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="5-Star Hotels" checked={formData.accommodationType === "5-Star Hotels"} onChange={handleChange} />
                  5-Star Hotels
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="Resorts" checked={formData.accommodationType === "Resorts"} onChange={handleChange} />
                  Resorts
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="accommodationType" value="None" checked={formData.accommodationType === "None"} onChange={handleChange} />
                  None
              </label>
          </div>

          <h3 className="h3-23">Meals Preferences:</h3>
          <div className="meals-preferences-options23">
              <label className="radio-label23">
                  <input type="radio" name="mealsPreferences" value="All-Inclusive" checked={formData.mealsPreferences === "All-Inclusive"} onChange={handleChange} />
                  All-Inclusive
              </label>
              <label className="radio-label23">
                  <input type="radio" name="mealsPreferences" value="Self-Catering" checked={formData.mealsPreferences === "Self-Catering"} onChange={handleChange} />
                  Self-Catering
              </label>
              <label className="radio-label23">
                  <input type="radio" name="mealsPreferences" value="None" checked={formData.mealsPreferences === "None"} onChange={handleChange} />
                  None
              </label>
          </div>

          <h3 className="h3-23">Dietary Preferences:</h3>
          <div className="dietary-preferences-options23">
              <label className="radio-label23">
                  <input 
                      className="radio-input23" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Vegetarian" 
                      checked={formData.dietaryPreferences === "Vegetarian"}
                      onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })}
                  />
                  Vegetarian
              </label>
              <label className="radio-label23">
                  <input 
                      className="radio-input23" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Vegan" 
                      checked={formData.dietaryPreferences === "Vegan"}
                      onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })}
                  />
                  Vegan
              </label>
              <label className="radio-label23">
                  <input 
                      className="radio-input23" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Gluten-Free" 
                      checked={formData.dietaryPreferences === "Gluten-Free"}
                      onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })}
                  />
                  Gluten-Free
              </label>
              <label className="radio-label23">
                  <input 
                      className="radio-input23" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="Nut-Free" 
                      checked={formData.dietaryPreferences === "Nut-Free"}
                      onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })}
                  />
                  Nut-Free
              </label>
              <label className="radio-label23">
                  <input 
                      className="radio-input23" 
                      type="radio" 
                      name="dietaryPreferences" 
                      value="None" 
                      checked={formData.dietaryPreferences === "None"}
                      onChange={(e) => setFormData({ ...formData, dietaryPreferences: e.target.value })}
                  />
                  None
              </label>
          </div>

          <div className="custom-dietary-preference23">
              <label className="label23">
                  Other Dietary Preferences:
                  <input
                      type="text"
                      name="customDietaryPreference"
                      value={formData.customDietaryPreference || ""}
                      onChange={handleChange}
                      placeholder="Enter any other dietary preferences"
                      className="input23"
                  />
              </label>
          </div>

          <h2 className="h2-23">Select Your Transportation Preferences</h2>

          <h3 className="h3-23">Transportation Type:</h3>
          <div className="transportation-options23">
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="transportationType" value="Flights" checked={formData.transportationType === "Flights"}   onChange={handleChange} />
                  <span className="icon">✈️</span> Flights
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="transportationType" value="Private Car/Van"  checked={formData.transportationType === "Private Car/Van"}  onChange={handleChange} />
                  <span className="icon">🚗</span> Private Car/Van
              </label>
              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="transportationType" value="Buses" checked={formData.transportationType === "Buses"}  onChange={handleChange} />
                  <span className="icon">🚌</span> Buses
              </label>

              <label className="radio-label23">
                  <input className="radio-input23" type="radio" name="transportationType" value="None" checked={formData.transportationType === "None"}  onChange={handleChange} />
                  <span className="icon">❌</span> None
              </label>
          </div>

          <h2 className="h2-23">Create your Day by Day Itinerary:</h2>
          <h3 className="h3-23">Day by Day Itinerary:</h3>
          {formData.itinerary.map((day, index) => (
            <div key={index} className="itinerary-day-item23">
              <div className="itinerary-input-group23">
                <label className="itinerary-label23">Day:<input className="itinerary-input23" type="text" name="day" value={day.day} readOnly onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter day..."/></label>
                <label className="itinerary-label23">Mode:<input className="itinerary-input23" type="text" name="mode" value={day.mode} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter mode..." /></label>
              </div>

              <div className="itinerary-input-group23">
                <label className="itinerary-label23">Highlights:<input className="itinerary-input23" type="text" name="highlights" value={day.highlights} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter highlights..."/> </label>
                <label className="itinerary-label23">Stay:<input className="itinerary-input23"
                    type="text" name="stay" value={day.stay} onChange={(e) => handleItineraryChange(index, e)} placeholder="Enter stay..."/></label>
              </div>

              <div className="itinerary-input-group23">
                <label className="itinerary-label23">Meals:<input className="itinerary-input23" type="text" name="meals" value={day.meals}onChange={(e) => handleItineraryChange(index, e)}placeholder="Enter meals..."/></label>
                <label className="itinerary-label23">Cost Breakdown:<textarea className="itinerary-textarea23"name="costBreakdown" value={day.costBreakdown} onChange={(e) => handleItineraryChange(index, e)}placeholder="Cost Breakdown..."/></label>
              </div>
            </div>
          ))}

          <h2 className="h2-23">Add Extra Features to Your Trip</h2>

          <h3 className="h3-23">Personalized Experiences:</h3>
          <textarea className="extra-features-textarea23" name="personalizedExperiences"value={formData.personalizedExperiences || "N/A"}onChange={handleChange} placeholder="Tell us about any special experiences you want to include..."></textarea>

          <h3 className="extra-features-subheader23">Travel Insurance:</h3>
          <label className="label-23"><input className="extra-features-checkbox23"type="checkbox" name="travelInsurance"checked={formData.travelInsurance}onChange={(e) => setFormData({ ...formData, travelInsurance: e.target.checked })}/>Add Travel Insurance for your trip</label>
          <h3 className="extra-features-subheader23">Events/Festivals:</h3>
          <label className="label-23"><input className="extra-features-checkbox23"type="checkbox"name="includeEvents"checked={formData.includeEvents}onChange={(e) => setFormData({ ...formData, includeEvents: e.target.checked })}/>Include local events/festivals during your travel dates?</label>

          <h2 className="h2-23">Set Your Trip Budget</h2>
          <label className="label23"> Total Budget: <input className="input23" type="text" name="totalBudget" value={formData.totalBudget || "N/A"} onChange={handleChange} placeholder="Enter your total trip budget" /></label>
          <h3 className="h3-23">Auto-Calculated Cost Breakdown:</h3>
          <div className="cost-section23">
          <div className="cost-input-group23">
            <label className="cost-label23">Transport:<input className="cost-input23" type="text" name="transportCost" value={formData.transportCost || "N/A"} readOnly placeholder="Auto-calculated" /></label>
            <label className="cost-label23">Accommodation:<input className="cost-input23" type="text" name="accommodationCost" value={formData.accommodationCost || "N/A"} readOnly placeholder="Auto-calculated" /></label></div>
          <div className="cost-input-group23">
            <label className="cost-label23">Meals:<input className="cost-input23" type="text" name="mealsCost" value={formData.mealsCost || "N/A"} readOnly placeholder="Auto-calculated" /></label>
            <label className="cost-label23">Activities:<input className="cost-input23" type="text" name="activitiesCost" value={formData.activitiesCost || "N/A"} readOnly placeholder="Auto-calculated" /></label>
          </div>
        </div>

          <div className="button-container23">
            <Link to="/View-Trip">
              <button type="button" className="cancel-btn23" disabled={isUpdating}>
                Cancel
              </button>
            </Link>
            <button 
              type="submit" 
              className="create-btn23" 
              disabled={isUpdating}
            >
              {isUpdating ? `Updating ${formData.tripName}...` : "Update"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}