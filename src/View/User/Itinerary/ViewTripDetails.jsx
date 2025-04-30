import React, { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./ViewTripDetails.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserDetailsForm from '../../../View/Payment/UserDetailsForm';
import MapDisplay from "../../../Components/MapDisplay";

export default function ViewTripDetailsPage() {
  const { tripName } = useParams(); 
  const [tripDetails, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currency, exchangeRates } = useContext(CurrencyContext);
  const [showUserForm, setShowUserForm] = useState(false);
  const [guideDetails, setGuideDetails] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

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

  useEffect(() => {
    if (tripDetails && tripDetails.guideIncluded && tripDetails.guideId) {
      fetchGuideDetails(tripDetails.guideId);
    }
  }, [tripDetails]);

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

  const fetchGuideDetails = async (guideId) => {
    setLoadingGuide(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(`http://localhost:4000/api/guides/${guideId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setGuideDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching guide details:", error);
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      toast.error("Please log in to book a trip", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message24'
      });
      return;
    }
    setShowUserForm(true);
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      const paymentDetails = {
        ...formData,
        packageDetails: {
          title: tripDetails.tripName,
          duration: tripDetails.duration,
          tripType: tripDetails.tripType,
          price: tripDetails.totalBudget ? tripDetails.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
          category: tripDetails.tripType,
          groupSize: "Custom",
          difficulty: "Custom",
          startDate: tripDetails.startDate || null,
          endDate: tripDetails.endDate || null,     
          destinations: tripDetails.destinations || null
        },
        userId: user._id,
        amount: tripDetails.totalBudget ? tripDetails.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
        transactionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      if (formData.paymentPartner === 'khalti') {
        // Initialize Khalti payment
        const response = await axios.post('http://localhost:4000/api/khalti/initiate', paymentDetails);
        if (response.data.payment_url) {
          window.location.href = response.data.payment_url;
        }
      }
      // eSewa payment is handled by the EsewaPayment component
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast.error('Failed to initialize payment. Please try again.');
      setShowUserForm(false);
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
        
        {/* Add Map Display Section */}
        {tripDetails.locationDetails && (
          <div className="map-section24">
            <h3 className="section-heading24">Location Map</h3>
            <div className="map-wrapper24">
              <MapDisplay 
                latitude={tripDetails.locationDetails.latitude}
                longitude={tripDetails.locationDetails.longitude}
                formattedAddress={tripDetails.locationDetails.formattedAddress}
              />
            </div>
          </div>
        )}

        <h3 className="section-heading24">How Do You Want to Spend Your Time?</h3>
        <p className="info-item24"><strong>Adventure Activities:</strong> {tripDetails.adventureActivities?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Cultural Experiences:</strong> {tripDetails.culturalExperiences?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Relaxation:</strong> {tripDetails.relaxation?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Food & Culinary:</strong> {tripDetails.foodCulinary?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Nightlife & Entertainment:</strong> {tripDetails.nightlifeEntertainment?.join(", ") || "None Selected"}</p>
        <p className="info-item24"><strong>Custom Activities:</strong> {tripDetails.customActivities || "None Provided"}</p>
        
        <h3 className="section-heading24">Travel Style</h3>
        <p className="info-item24">{tripDetails.travelStyle || "Not Specified"}
          {(tripDetails.travelStyle === "Family" || tripDetails.travelStyle === "Groups") && tripDetails.groupSize && (
            <span className="group-size24"> - Group Size: {tripDetails.groupSize} {tripDetails.groupSize === 1 ? 'person' : 'people'}</span>
          )}
        </p>

        <h3 className="section-heading24">Accommodation Preferences</h3>
        <p className="info-item24"><strong>Type:</strong> {tripDetails.accommodationType || "Not Specified"}</p>
        <p className="info-item24"><strong>Meals Preferences:</strong> {tripDetails.mealsPreferences || "Not Specified"}</p>
        <p className="info-item24"><strong>Dietary Preferences:</strong> {tripDetails.dietaryPreferences === "None" ? "No specific dietary preferences" : tripDetails.dietaryPreferences}</p>
        {tripDetails.customDietaryPreference && (
          <p className="info-item24"><strong>Other Dietary Preferences:</strong> {tripDetails.customDietaryPreference}</p>
        )}
        
        <h3 className="section-heading24">Transportation Preferences</h3>
        <p className="info-item24"><strong>Type:</strong> {tripDetails.transportationType || "Not Specified"}</p>

        {tripDetails && tripDetails.guideIncluded && (
          <>
            <h3 className="section-heading24">Guide Information</h3>
            <div className="guide-info-container24" style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <p className="info-item24"><strong>Guide Included:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>Yes</span></p>
              {loadingGuide ? (
                <p className="info-item24" style={{ color: '#6c757d', fontStyle: 'italic' }}>Loading guide details...</p>
              ) : guideDetails ? (
                <>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '15px',
                    marginTop: '15px'
                  }}>
                    <p className="info-item24"><strong>Guide Name:</strong> {guideDetails.firstName} {guideDetails.lastName}</p>
                    <p className="info-item24"><strong>Languages:</strong> {guideDetails.guideProfile?.languages?.join(", ") || "Not specified"}</p>
                    <p className="info-item24"><strong>Expertise:</strong> {guideDetails.guideProfile?.regionsOfExpertise?.join(", ") || "Not specified"}</p>
                    <p className="info-item24"><strong>Services:</strong> {guideDetails.guideProfile?.serviceTypes?.join(", ") || "Not specified"}</p>
                  </div>
                  <p className="info-item24" style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    background: '#e9ecef', 
                    borderRadius: '5px',
                    fontWeight: 'bold'
                  }}>
                    <strong>Guide Cost:</strong> {convertPrice(tripDetails.guideCost)} ({tripDetails.duration})
                  </p>
                </>
              ) : (
                <p className="info-item24" style={{ color: '#dc3545' }}>Guide details not available</p>
              )}
            </div>
          </>
        )}

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
                
                <div className="cost-breakdown-container24">
                    <p className="cost-breakdown-title24">Cost Breakdown:</p>
                    <ul className="cost-breakdown-list24">
                        {day.costBreakdown?.split(',').map((cost, i) => {
                            const [item, value] = cost.split(':').map(str => str.trim());
                            return (
                                <li key={i} className="cost-breakdown-item24">
                                    <span>{item}</span>
                                    <span className="cost-breakdown-value24">{value}</span>
                                </li>
                            );
                        }) || <li className="cost-breakdown-item24">Not Specified</li>}
                    </ul>
                </div>
            </div>
            ))
        ) : (
            <p className="info-item24">No itinerary available.</p>
            )}
            </div>

        <div className="section-heading24">Status</div>
        <div className="info-item24">
          {tripDetails.status?.toLowerCase() === "pending" ? (
            <div className="status-indicator status-pending">
              ⏳ Pending Review
            </div>
          ) : tripDetails.status?.toLowerCase() === "approved" ? (
            <div className="status-indicator status-approved">
              ✅ Approved
            </div>
          ) : tripDetails.status?.toLowerCase() === "declined" ? (
            <>
              <div className="status-indicator status-declined">
                ❌ Declined
              </div>
              {tripDetails.declineMessage && (
                <div className="decline-message24">
                  <strong>Reason for decline:</strong> {tripDetails.declineMessage}
                </div>
              )}
            </>
          ) : (
            <div className="status-indicator status-declined">
              ❌ Unknown Status
            </div>
          )}
        </div>

        <div className="section-heading24">Trip Budget</div>
        <div className="budget-info24">
            <div className="budget-item24">
                <strong>Total Budget:</strong>
                <span className="budget-value24">{tripDetails.totalBudget ? convertPrice(tripDetails.totalBudget) : "Budget Not Available"}</span>
            </div>
            <div className="budget-item24">
                <strong>Transport:</strong>
                <span className="budget-value24">{tripDetails.transportCost ? convertPrice(tripDetails.transportCost) : "Not Available"}</span>
            </div>
            <div className="budget-item24">
                <strong>Accommodation:</strong>
                <span className="budget-value24">{tripDetails.accommodationCost ? convertPrice(tripDetails.accommodationCost) : "Not Available"}</span>
            </div>
            <div className="budget-item24">
                <strong>Meals:</strong>
                <span className="budget-value24">{tripDetails.mealsCost ? convertPrice(tripDetails.mealsCost) : "Not Available"}</span>
            </div>
            <div className="budget-item24">
                <strong>Activities:</strong>
                <span className="budget-value24">{tripDetails.activitiesCost ? convertPrice(tripDetails.activitiesCost) : "Not Available"}</span>
            </div>
        </div>

        {/* Add User Details Section */}
        <div className="section-heading24">User Details</div>
        <div className="user-details-container24">
            <div className="user-details-grid24">
                <div className="user-detail-item24">
                    <span className="detail-label24">Name:</span>
                    <span className="detail-value24">{tripDetails.userName || "Not Available"}</span>
                </div>
                <div className="user-detail-item24">
                    <span className="detail-label24">Email:</span>
                    <span className="detail-value24">{tripDetails.userEmail || "Not Available"}</span>
                </div>
                <div className="user-detail-item24">
                    <span className="detail-label24">Address:</span>
                    <span className="detail-value24">{tripDetails.userAddress || "Not Available"}</span>
                </div>
            </div>
        </div>

        <div className="button-container24">
            <div className="button-wrapper24">
                <Link to="/View-Trip">
                    <button className="back-btn24">Back</button>
                </Link>
                {tripDetails.status?.toLowerCase() === "approved" ? (
                    <button className="book-now-btn24" onClick={handleBookNow}>Book Now</button>
                ) : tripDetails.status?.toLowerCase() === "pending" ? (
                    <div className="message-container24">
                        <p className="important-message24">⏳ Your booking request is under approval. Please check back later.</p>
                    </div>
                ) : tripDetails.status?.toLowerCase() === "declined" ? (
                    <div className="message-container24">
                        <p className="important-message24">❌ Your booking request has been declined.</p>
                    </div>
                ) : (
                    <div className="message-container24">
                        <p className="important-message24">❌ Booking not available.</p>
                    </div>
                )}
            </div>
        </div>

        {/* User Details Form Modal */}
        {showUserForm && tripDetails && (
            <UserDetailsForm
                packageDetails={{
                    title: tripDetails.tripName,
                    duration: tripDetails.duration,
                    tripType: tripDetails.tripType,
                    price: tripDetails.totalBudget ? tripDetails.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
                    category: tripDetails.tripType,
                    groupSize: "Custom",
                    difficulty: "Custom",
                    startDate: tripDetails.startDate || null,
                    endDate: tripDetails.endDate || null,
                    address: tripDetails.userAddress || null,
                    destinations: tripDetails.destinations || null
                }}
                onSubmit={handlePaymentSubmit}
                onCancel={() => setShowUserForm(false)}
            />
        )}
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </>
  );
}