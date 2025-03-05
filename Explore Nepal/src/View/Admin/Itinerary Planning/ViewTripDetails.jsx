import React, { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./ViewTripDetails.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function ViewTripDetailsPage() {
  const { tripName } = useParams(); 
  const [tripDetails, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currency, exchangeRates } = useContext(CurrencyContext);

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const convertPrice = (priceString) => {
  if (!priceString || isNaN(priceString)) {
      return "N/A"; 
  }

  const priceInUSD = parseFloat(priceString.replace(/[^0-9.]+/g, "")); 

  if (!exchangeRates || !exchangeRates[currency]) {
      return "Loading..."; // Exchange rates not yet loaded
  }

  const conversionRate = exchangeRates[currency]; 
  const convertedPrice = (priceInUSD * conversionRate).toFixed(2);
  
  return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
};


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
        params: { tripName } 
      });

      if (response.status === 200) {
        setTripData(response.data);
      } else {
        setError("No Trip Found.");
      }
    } catch (error) {
      console.error("Error fetching trip details:", error);
      setError("Failed to load trip details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading24">Loading trip details...</div>;
  if (error) return <div className="error24">{error}</div>;
  if (!tripDetails) return <div className="error24">No trips found.</div>;


 
  return (
    <>
      <Header />
      <div className="main-container24">
        <div className="heading24">
        <Link to="/PlanYourTrip"><button className="plan-trip-btn24">Plan Your Trip <img src="/images/arow.png" alt="arrow" className="arrow-down24" /></button></Link>
        </div>
        <div className="form24">
        <h1 className="main-heading24">{tripDetails.tripName || "No Trip Name Provided"}</h1>
        <h3 className="section-heading24">Trip Details</h3>
        <p className="info-item24"><strong>Start Date:</strong> {new Date(tripDetails.startDate).toLocaleDateString("en-GB")}</p>
        <p className="info-item24"><strong>End Date:</strong> {new Date(tripDetails.endDate).toLocaleDateString("en-GB")}</p>

        <p className="info-item24"><strong>Duration:</strong> {tripDetails.duration || "Not Specified"}</p>
        <p className="info-item24"><strong>Trip Type:</strong> {tripDetails.tripType || "Not Specified"}</p>
        <p className="info-item24"><strong>Destinations:</strong> {tripDetails.destinations || "Not Specified"}</p>
        
        <h3 className="section-heading24">How Do You Want to Spend Your Time?</h3>
        <p className="info-item24"><strong>Adventure Activities:</strong> {tripDetails.adventureActivities?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Cultural Experiences:</strong> {tripDetails.culturalExperiences?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Relaxation:</strong> {tripDetails.relaxation?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Food & Culinary:</strong> {tripDetails.foodCulinary?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Nightlife & Entertainment:</strong> {tripDetails.nightlifeEntertainment?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Custom Activities:</strong> {tripDetails.customActivities || "None Provided"}</p>
        
        <h3 className="section-heading24">Travel Style</h3>
        <p className="info-item24">{tripDetails.travelStyle || "Not Specified"}</p>

        <h3 className="section-heading24">Accommodation Preferences</h3>
        <p className="info-item24"><strong>Type:</strong> {tripDetails.accommodationType || "Not Specified"}</p>
        <p className="info-item24"><strong>Meals Preferences:</strong> {tripDetails.mealsPreferences || "Not Specified"}</p>
        <p className="info-item24"><strong>Dietary Preferences:</strong> {tripDetails.dietaryPreferences || "Not Specified"}</p>
        <p className="info-item24"><strong>Other Dietary Preferences:</strong> {tripDetails.customDietaryPreference || "Not Specified"}</p>
        
        <h3 className="section-heading24">Transportation Preferences</h3>
        <p className="info-item24"><strong>Type:</strong> {tripDetails.transportationType || "Not Specified"}</p>

        <h3 className="section-heading24">Day by Day Itinerary</h3>
        <div className="itinerary-container24">
        {tripDetails.itinerary?.length > 0 ? (
            tripDetails.itinerary.map((day, index) => (
            <div key={index} className="itinerary-card24">
                <h4 className="day-heading24">{day.day || index + 1}:</h4>
                <p className="info-item24"><strong>Mode:</strong> {day.mode || "Not Specified"}</p>
                <p className="info-item24"><strong>Highlights:</strong> {day.highlights || "Not Specified"}</p>
                <p className="info-item24"><strong>Stay:</strong> {day.stay || "Not Specified"}</p>
                <p className="info-item24"><strong>Meals:</strong> {day.meals || "Not Specified"}</p>
                <p className="info-item24"><strong>Cost Breakdown:</strong></p>
                <ul>
                    {day.costBreakdown?.split(',').map((cost, i) => (
                        <li key={i}>{cost.trim()}</li>
                    )) || <li>Not Specified</li>}
                </ul>
            </div>
            ))
        ) : (
            <p className="info-item24">No itinerary available.</p>
            )}
            </div>


        
        <h3 className="section-heading24">Trip Budget</h3>
        <p className="info-item24"><strong>Total Budget:</strong> <span className="span24" style={{ color: 'green', fontWeight:"bold" }}>{tripDetails.totalBudget ? convertPrice(tripDetails.totalBudget) : "Budget Not Available"}</span></p>
        <p className="info-item24"><strong>Transport:</strong> <span className="span24" style={{ color: 'green', fontWeight:"bold" }}>{tripDetails.transportCost ? convertPrice(tripDetails.transportCost) : "Transport Cost Not Available"}</span></p>
        <p className="info-item24"><strong>Accommodation:</strong> <span className="span24" style={{ color: 'green', fontWeight:"bold" }}>{tripDetails.accommodationCost ? convertPrice(tripDetails.accommodationCost) : "Accomodation Cost Not Available"}</span></p>
        <p className="info-item24"><strong>Meals:</strong> <span className="span24" style={{ color: 'green', fontWeight:"bold" }}>{tripDetails.mealsCost ? convertPrice(tripDetails.mealsCost) : "Meals Cost Not Available"}</span></p>
        <p className="info-item24"><strong>Activities:</strong> <span className="span24" style={{ color: 'green', fontWeight:"bold" }}>{tripDetails.activitiesCost ? convertPrice(tripDetails.activitiesCost) : "Activities Cost Not Available"}</span></p>

        <p className="info-item24">
          <strong>Status:</strong>
          {tripDetails.status?.toLowerCase() === "pending" ? (
            <span> ⏳ Pending</span>
          ) : tripDetails.status?.toLowerCase() === "approved" ? (
            <span> ✅ Approved</span>
          ) : result.status?.toLowerCase() === "declined" ? (
            <span> ❌ Declined</span>
          ) : (
            <span> ❌ Unknown</span>
          )}
        </p>


        
        <div className="button-container24">
          <Link to="/ViewTrip">
            <button className="back-btn24">Back</button>
          </Link>
          {tripDetails.status?.toLowerCase() === "approved" ? (
            <button className="book-now-btn24">Book Now</button>
          ) : tripDetails.status?.toLowerCase() === "pending" ? (
            <p className="important-message24">⏳ Your booking request is under approval. Please check back later.</p>
          ) : result.status?.toLowerCase() === "declined" ? (
           <p className="important-message22">❌ Your booking request has been declined.</p>
          ) : (
            <p className="important-message22">❌ Booking not available.</p>
          )}
        </div>
        </div>


        
      </div>
      <Footer />
    </>
  );
}