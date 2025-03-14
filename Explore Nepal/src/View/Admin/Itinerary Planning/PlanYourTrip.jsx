import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./PlanYourTrip.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";

export default function PlanYourTripPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tripName: "",
    startDate: "",
    endDate: "",
    tripType: "", 
    duration: "",
    destinations: "",
    adventureActivities: [],
    culturalExperiences: [],
    relaxation: [],
    foodCulinary: [],
    nightlifeEntertainment: [],
    customActivities: "", 
    travelStyle: "Solo",
    accommodationType: "", 
    mealsPreferences: "", 
    dietaryPreferences: "", 
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
    activitiesCost: ""
  });

  const COST_RANGES = {
    transport: {
        Flights: 50, // Updated to Nepal pricing
        "Private Car/Van": 50,
        Buses: 11, // Updated to Nepal pricing
        None: 0,
    },
    accommodation: {
        Guesthouses: 25,
        Hostels: 20,
        "Mid-Range": 50,
        "3-Star Hotels": 75,
        Homestays: 30,
        Luxury: 120,
        "5-Star Hotels": 200,
        Resorts: 250,
    },
    meals: {
        "All-Inclusive": 40,
        "Self-Catering": 20,
    },
    activities: {
        Adventure: {
            "Hiking & Trekking": 40,
            Paragliding: 100,
            Rafting: 60,
        },
        Cultural: {
            Temples: 15,
            Museums: 20,
            Festivals: 25,
        },
        Relaxation: {
            "Lakeside Strolls": 5,
            "Hot Springs": 30,
            Spas: 50,
        },
        Culinary: {
            "Food Tours": 40,
            "Street Food": 15,
            "Cooking Classes": 35,
        },
        Nightlife: {
            Clubs: 30,
            "Live Music": 20,
        },
    },
    travelStyles: {
        single: 0.9,  // Cheaper (10% discount)
        couples: 1.39, // Adjusted to match calculation
        family: 0.8,  // Discounted (20% discount)
        groups: 0.8,  // Discounted (20% discount)
    },
    travelInsurance: 50, // Cost of travel insurance per trip
    eventsFestivals: {
        local: 20, // Cost for including local events/festivals
        special: 30, // Cost for including special events
    }
};

const calculateCostBreakdown = (data) => {
  let {
      duration,
      accommodationType,
      transportationType,
      mealsPreferences,
      travelStyle,
      adventureActivities,
      culturalExperiences,
      relaxation,
      foodCulinary,
      nightlifeEntertainment,
      travelInsurance: includeInsurance,
      includeEvents,
  } = data;

  let days = parseInt(duration) || 1;
  let totalBudget = 0;

  // Read first value from arrays
  let accommodationTypeValue = Array.isArray(accommodationType) ? accommodationType[0] : accommodationType;
  let mealsPreferencesValue = Array.isArray(mealsPreferences) ? mealsPreferences[0] : mealsPreferences;

  let minTransport = COST_RANGES.transport[transportationType] || 20;
  let minAccommodation = COST_RANGES.accommodation[accommodationTypeValue] || 25;
  let minMeals = COST_RANGES.meals[mealsPreferencesValue] || 20;

  // Calculate total activity costs
  let totalActivityCost = 0;
  [...adventureActivities, ...culturalExperiences, ...relaxation, ...foodCulinary, ...nightlifeEntertainment].forEach(activity => {
      for (let category in COST_RANGES.activities) {
          if (COST_RANGES.activities[category][activity]) {
              totalActivityCost += COST_RANGES.activities[category][activity];
          }
      }
  });

  let insuranceCost = includeInsurance ? COST_RANGES.travelInsurance : 0;
  let eventsCost = includeEvents ? COST_RANGES.eventsFestivals.local : 0;

  let travelStyleMultiplier = COST_RANGES.travelStyles[travelStyle] || 1.0;

  // Apply multiplier ONLY to transport, accommodation, meals, and activities
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
    
    // For radio buttons, ensure we're setting a valid value
    if (name === "travelStyle" && value === "") {
        return; // Don't set empty values for travelStyle
    }
    
    setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };

        if (name === "startDate" || name === "endDate") {
            calculateDurationAndTripType(name, value);
        }

        if (["duration", "accommodationType", "transportationType", "mealsPreferences",
            "adventureActivities", "culturalExperiences", "relaxation", "foodCulinary", 
            "nightlifeEntertainment", "travelInsurance", "includeEvents"].includes(name)) {

            return calculateCostBreakdown(updatedData);
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
  
    setFormData((prev) => {
      const currentValues = prev[name] || []; 
      return {
        ...prev,
        [name]: checked ? [...currentValues, value] : currentValues.filter((item) => item !== value),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSubmit = { ...formData };

    // Convert arrays to strings
    formDataToSubmit.accommodationType = Array.isArray(formData.accommodationType) 
      ? formData.accommodationType.join(", ") 
      : formData.accommodationType;
    formDataToSubmit.mealsPreferences = Array.isArray(formData.mealsPreferences) 
      ? formData.mealsPreferences.join(", ") 
      : formData.mealsPreferences;
    formDataToSubmit.dietaryPreferences = Array.isArray(formData.dietaryPreferences) 
      ? formData.dietaryPreferences.join(", ") 
      : formData.dietaryPreferences;

    if (formDataToSubmit.itinerary) {
      formDataToSubmit.itinerary = JSON.stringify(formDataToSubmit.itinerary);
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/adminAddTrip",
        formDataToSubmit,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success("Trip added successfully!", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message21'
      });

      // Navigate after a short delay to allow the toast to be visible
      setTimeout(() => {
        navigate(-1);
      }, 2000);

    } catch (error) {
      console.error("Error submitting form", error);
      toast.error("Error adding trip. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message21'
      });
    }
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
              <label className="label21">Trip Name:
                  <input className="input21" type="text" name="tripName" value={formData.tripName} onChange={handleChange} />
              </label>
              <label className="label21">Start Date:
                  <input className="input21" type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
              </label>
              <label className="label21">End Date:
                  <input className="input21" type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
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
          <div className="label-input-container21">
              <label className="label21">Destination:</label>
              <input className="input21" type="text" name="destinations" value={formData.destinations} onChange={handleChange} placeholder="Enter your destination" />
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

          <h3 className="h3-21">Travel Style:</h3>
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


          <h2 className="h2-21">Select Your Accommodation Preferences</h2>

          <h3 className="h3-21">Accommodation Type:</h3>
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
          </div>

          <h3 className="h3-21">Meals Preferences:</h3>
          <div className="meals-preferences-options21">
              <label className="radio-label21">
                  <input type="radio" name="mealsPreferences" value="All-Inclusive" onChange={handleCheckboxChange} />
                  All-Inclusive
              </label>
              <label className="radio-label21">
                  <input type="radio" name="mealsPreferences" value="Self-Catering" onChange={handleCheckboxChange} />
                  Self-Catering
              </label>
          </div>

          <h3 className="h3-21">Dietary Preferences:</h3>
          <div className="dietary-preferences-options21">
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="dietaryPreferences" value="Vegetarian" onChange={handleCheckboxChange} />
                  Vegetarian
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="dietaryPreferences" value="Vegan" onChange={handleCheckboxChange} />
                  Vegan
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="dietaryPreferences" value="Gluten-Free" onChange={handleCheckboxChange} />
                  Gluten-Free
              </label>
              <label className="radio-label21">
                  <input className="radio-input21" type="radio" name="dietaryPreferences" value="Nut-Free" onChange={handleCheckboxChange} />
                  Nut-Free
              </label>
              <label className="radio-label21">
                Other (please specify):
                <input
                  type="text"
                  name="otherDietaryPreference"
                  onChange={handleChange}
                  className="other-dietary-input21"
                  placeholder="Enter your dietary preference here..."
                />
              </label>


          </div>


          <h2 className="h2-21">Select Your Transportation Preferences</h2>

          <h3 className="h3-21">Transportation Type:</h3>
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
          <h3 className="h3-21">Day by Day Itinerary:</h3>
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
        </div>

          
          <div className="button-container21">
            <Link to="/ItineraryPackage"><button type="button" className="cancel-btn21">Cancel</button></Link>
            <button type="submit" className="create-btn21">Create</button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
