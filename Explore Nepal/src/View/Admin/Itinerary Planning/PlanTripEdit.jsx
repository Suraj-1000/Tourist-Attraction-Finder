import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PlanTripEdit.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function PlanTripUpdatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tripName: "",
    startDate: "",
    endDate: "",
    tripType: "", 
    duration: "",
    destinations: "",
    adventureActivities: "",
    culturalExperiences: "",
    relaxation: "",
    foodCulinary: "",
    nightlifeEntertainment: "",
    customActivities: "", 
    travelStyle: "", 
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

  const { tripName } = useParams(); 



  useEffect(() => {
    if (tripName) {
      fetchTripDetails(tripName);
    }
  }, [tripName]);


  const fetchTripDetails = async (tripName) => {
    try {
      const encodedTripName = encodeURIComponent(tripName);
      console.log(`Fetching details for package: ${encodedTripName}`);

      const response = await axios.get(`http://localhost:4000/adminTrip/trip`, {
        params: { tripName },
      });

      if (response.status === 200) {
        console.log("Trip Data:", response.data);

        setFormData({
          ...response.data,
          startDate: response.data.startDate ? response.data.startDate.split("T")[0] : "",
          endDate: response.data.endDate ? response.data.endDate.split("T")[0] : "",accommodationType: Array.isArray(response.data.accommodationType)
          ? response.data.accommodationType[0] || ""
          : response.data.accommodationType || "",
        mealsPreferences: Array.isArray(response.data.mealsPreferences)
          ? response.data.mealsPreferences[0] || ""
          : response.data.mealsPreferences || "",
        dietaryPreferences: Array.isArray(response.data.dietaryPreferences)
          ? response.data.dietaryPreferences[0] || ""
          : response.data.dietaryPreferences || "",
        });
        
      } else {
        alert("❌ No Trip Found.");
      }
    } catch (error) {
      console.error("Error fetching trip details:", error);
      alert("❌ Failed to load trip details.");
    }
};


const handleUpdate = async (e) => {
  e.preventDefault();

  let updatedFormData = { ...formData };

  // 🚀 Ensure itinerary remains an array, not a string
  if (typeof updatedFormData.itinerary === "string") {
    updatedFormData.itinerary = JSON.parse(updatedFormData.itinerary);
  }

  try {
    const response = await axios.put(
      "http://localhost:4000/adminTrip/updateTrip",
      updatedFormData,
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.status === 200) {
      alert("✅ Trip updated successfully!");
      navigate(-1);
    } else {
      alert("❌ Failed to update trip.");
    }
  } catch (error) {
    console.error("🔥 Error updating trip:", error);
    alert("❌ Error updating trip. Check the console for details.");
  }
};




  return (
    <>
      <Header />
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
              <input className="input23" type="text" name="destinations" value={formData.destinations} onChange={handleChange} placeholder="Enter your destination" />
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
                  <input className="travel-style-input23" type="radio" name="travelStyle" value="Solo" checked={formData.travelStyle === "Solo"} onChange={handleChange} />
                  <span className="icon">👤</span> Solo
              </label>
              <label className="travel-style-label23">
                  <input className="travel-style-input23" type="radio" name="travelStyle" value="Couples" checked={formData.travelStyle === "Couples"}  onChange={handleChange} />
                  <span className="icon">❤️</span> Couples
              </label>
              <label className="travel-style-label23">
                  <input className="travel-style-input23" type="radio" name="travelStyle" value="Groups" checked={formData.travelStyle === "Groups"}  onChange={handleChange} />
                  <span className="icon">👥</span> Groups
              </label>
              <label className="travel-style-label23">
                  <input className="travel-style-input23" type="radio" name="travelStyle" value="Family" checked={formData.travelStyle === "Family"}  onChange={handleChange} />
                  <span className="icon">👨‍👩‍👧‍👦</span> Family
              </label>
          </div>


          <h2 className="h2-23">Select Your Accommodation Preferences</h2>

<h3 className="h3-23">Accommodation Type:</h3>
<div className="accommodation-options23">
    {["Guesthouses", "Hostels", "Mid-Range", "3-Star Hotels", "Homestays", "Luxury", "5-Star Hotels", "Resorts"].map((type) => (
        <label key={type} className="radio-label23">
            <input
                className="radio-input23"
                type="radio"
                name="accommodationType"
                value={type}
                checked={formData.accommodationType === type}  
                onChange={handleChange}  
            />
            {type}
        </label>
    ))}
</div>

<h3 className="h3-23">Meals Preferences:</h3>
<div className="meals-preferences-options23">
    {["All-Inclusive", "Self-Catering"].map((type) => (
        <label key={type} className="radio-label23">
            <input
                type="radio"
                name="mealsPreferences"
                value={type}
                checked={formData.mealsPreferences === type}  // ✅ Fix: Compare as string
                onChange={handleChange}
            />
            {type}
        </label>
    ))}
</div>

<h3 className="h3-23">Dietary Preferences:</h3>
<div className="dietary-preferences-options23">
    {["Vegetarian", "Vegan", "Gluten-Free", "Nut-Free"].map((type) => (
        <label key={type} className="radio-label23">
            <input
                className="radio-input23"
                type="radio"
                name="dietaryPreferences"
                value={type}
                checked={formData.dietaryPreferences === type}  // ✅ Fix: Compare as string
                onChange={handleChange}
            />
            {type}
        </label>
    ))}
</div>

<label className="radio-label21">
    Other (please specify):
    <input
        type="text"
        name="customDietaryPreference"
        value={formData.customDietaryPreference || ""}
        onChange={handleChange}
        className="other-dietary-input21"
        placeholder="Enter your dietary preference here..."
    />
</label>


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
            <Link to="/ViewTrip"><button type="button" className="cancel-btn23">Cancel</button></Link>
            <button type="submit" className="create-btn23">Update</button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
