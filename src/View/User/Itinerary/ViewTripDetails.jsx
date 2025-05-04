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
  if (!priceString) {
      return "N/A"; 
  }

  // Ensure priceString is actually a string
  const priceStr = String(priceString);
  
  try {
    const priceInUSD = parseFloat(priceStr.replace(/[^0-9.]+/g, "")); 

    if (isNaN(priceInUSD)) {
      return "N/A";
    }

    if (!exchangeRates || !exchangeRates[currency]) {
        return "Loading..."; // Exchange rates not yet loaded
    }

    const conversionRate = exchangeRates[currency]; 
    const convertedPrice = (priceInUSD * conversionRate).toFixed(2);
    
    return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
  } catch (error) {
    console.error("Error converting price:", error, "Price value:", priceString);
    return "N/A";
  }
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
          _id: tripDetails._id,
          title: tripDetails.tripName,
          duration: tripDetails.duration,
          tripType: tripDetails.tripType,
          price: tripDetails.totalBudget ? tripDetails.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
          category: tripDetails.tripType || 'Short Trip',
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

  // Helper function to get initials from name
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
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

        {/* Updated Guide Information Section */}
        {tripDetails && tripDetails.guideIncluded && (
          <div className="guide-section-wrapper24">
            <h3 className="section-heading24">Guide Information</h3>
            <div className="guide-info-container24">
              <div className="guide-info-header24">
                <div className="guide-status24">
                  <span className="guide-badge24">Guide Included</span>
                </div>
              </div>
              
              {loadingGuide ? (
                <div className="guide-loading24">
                  <div className="loading-spinner24"></div>
                  <p>Loading guide details...</p>
                </div>
              ) : guideDetails ? (
                <div className="guide-compact-wrapper24">
                  <div className="guide-profile-header24">
                    {guideDetails.image ? (
                      <img 
                        src={guideDetails.image} 
                        alt={`${guideDetails.firstName} ${guideDetails.lastName}`}
                        className="guide-avatar24"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.classList.add('initials-avatar24');
                          e.target.parentNode.innerText = getInitials(guideDetails.firstName, guideDetails.lastName);
                        }}
                      />
                    ) : (
                      <div className="initials-avatar24">
                        {getInitials(guideDetails.firstName, guideDetails.lastName)}
                      </div>
                    )}
                    
                    <div className="guide-name-details24">
                      <h4>{guideDetails.firstName} {guideDetails.lastName}</h4>
                      <div className="guide-ratings24">
                        {guideDetails.guideProfile?.ratings?.average ? (
                          <div className="ratings-display24">
                            <span className="rating-value24">{guideDetails.guideProfile.ratings.average.toFixed(1)}</span>
                            <div className="stars-mini24">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} 
                                  className={`star-mini24 ${star <= Math.round(guideDetails.guideProfile.ratings.average) ? 'filled' : ''}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="reviews-count24">({guideDetails.guideProfile.ratings.total || 0})</span>
                          </div>
                        ) : (
                          <span className="no-ratings24">No ratings yet</span>
                        )}
                      </div>
                    </div>

                    {tripDetails.guideCost && (
                      <div className="guide-cost-badge24">
                        {convertPrice(tripDetails.guideCost)}
                      </div>
                    )}
                  </div>
                  
                  <div className="guide-attributes24">
                    {guideDetails.guideProfile?.languages?.length > 0 && (
                      <div className="attribute-item24">
                        <span className="attribute-icon24">🗣️</span>
                        <span className="attribute-text24">{guideDetails.guideProfile.languages.join(", ")}</span>
                      </div>
                    )}
                    
                    {guideDetails.guideProfile?.regionsOfExpertise?.length > 0 && (
                      <div className="attribute-item24">
                        <span className="attribute-icon24">🗺️</span>
                        <span className="attribute-text24">{guideDetails.guideProfile.regionsOfExpertise.join(", ")}</span>
                      </div>
                    )}
                    
                    {guideDetails.guideProfile?.serviceTypes?.length > 0 && (
                      <div className="attribute-item24">
                        <span className="attribute-icon24">🛎️</span>
                        <span className="attribute-text24">{guideDetails.guideProfile.serviceTypes.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="guide-not-available24">
                  <p>Guide details not available at the moment. The guide has been assigned but details cannot be retrieved.</p>
                </div>
              )}
            </div>
          </div>
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
                    _id: tripDetails._id,
                    title: tripDetails.tripName,
                    duration: tripDetails.duration,
                    tripType: tripDetails.tripType,
                    price: tripDetails.totalBudget ? tripDetails.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
                    category: tripDetails.tripType || 'Short Trip',
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