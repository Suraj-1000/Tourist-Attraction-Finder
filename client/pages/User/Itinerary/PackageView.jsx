import React, { useState, useEffect, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PackageView.css";
import { CurrencyContext } from "../../../context/CurrencyContext";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserDetailsForm from '../../../pages/Payment/UserDetailsForm';
import MapDisplay from "../../../components/MapDisplay";
import { FaStar } from 'react-icons/fa';

export default function ItineraryPackageViewPage() {
    const { currency, exchangeRates } = useContext(CurrencyContext);
    const { packageName } = useParams(); 
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showUserForm, setShowUserForm] = useState(false);
    const [guideDetails, setGuideDetails] = useState(null);
    const [loadingGuide, setLoadingGuide] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const handleBack = () => {
        navigate(-1); 
    };

    const formatNumberWithCommas = (number) => {
      try {
        if (number === null || number === undefined) return "0";
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      } catch (error) {
        console.error("Error formatting number:", error, number);
        return "0";
      }
    };
  
  const convertPrice = (priceString) => {
    // If input is null, undefined or NaN
    if (priceString === null || priceString === undefined) {
      return "N/A"; 
    }

    try {
      // Ensure we're working with a string
      const priceStr = String(priceString);
      
      // Extract numeric value from string
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
      if (packageName) {
        fetchPackageDetails(packageName);
      }
    }, [packageName]);
    
    useEffect(() => {
      if (packageData && packageData.guideIncluded && packageData.guideId) {
        // Only fetch guide details if guideId is a string (not already an object from the server)
        if (typeof packageData.guideId === 'string' || typeof packageData.guideId === 'object' && !guideDetails) {
          fetchGuideDetails(packageData.guideId);
        }
      }
    }, [packageData, guideDetails]);

    const fetchPackageDetails = async (title) => {
      try {
        const encodedPackageName = encodeURIComponent(title);
        console.log(`Fetching details for package: ${encodedPackageName}`);
  
        const response = await axios.get(`http://localhost:4000/adminPackage/package`, {
          params: { title: packageName } 
        });
  
        if (response.status === 200) {
          // Transform the reviews data to match AdminHistory format
          const packageData = response.data;
          
          // Log the guide information to debug the issue
          console.log("Guide Information from API:", {
            guideIncluded: packageData.guideIncluded,
            guideId: packageData.guideId,
            guideCost: packageData.guideCost
          });
          
          // If the server populated guideId as an object, use it directly instead of fetching again
          if (packageData.guideIncluded && packageData.guideId && typeof packageData.guideId === 'object') {
            console.log("Guide details came pre-populated from server");
            setGuideDetails(packageData.guideId);
            setLoadingGuide(false);
          }
          
          if (packageData.reviews) {
            packageData.reviews = packageData.reviews.map(review => ({
              ...review,
              userFullName: review.userId ? `${review.userId.firstName} ${review.userId.lastName}` : null,
              userId: review.userId || null
            }));
          }
          setPackageData(packageData);
        } else {
          setError("No Package Found.");
        }
      } catch (error) {
        console.error("Error fetching package details:", error);
        setError("Failed to load package details.");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchGuideDetails = async (guideId) => {
      setLoadingGuide(true);
      try {
        // If guideId is already an object with all the guide details, use it directly
        if (typeof guideId === 'object' && guideId._id) {
          console.log("Using guide details from object:", guideId.firstName, guideId.lastName);
          setGuideDetails(guideId);
          return;
        }
        
        // Otherwise, fetch guide details from the API
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const guideFetchId = typeof guideId === 'object' ? guideId._id : guideId;
        console.log("Fetching guide details for ID:", guideFetchId);

        const response = await axios.get(`http://localhost:4000/api/guides/${guideFetchId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          console.log("Guide details fetched from API successfully");
          setGuideDetails(response.data);
        }
      } catch (error) {
        console.error("Error fetching guide details:", error);
      } finally {
        setLoadingGuide(false);
      }
    };
  
    if (loading) return <div className="loading55">Loading packages details...</div>;
    if (error) return <div className="error55">{error}</div>;
    if (!packageData) return <div className="error55">No packages found.</div>;
  

  const handleBookNow = () => {
    if (!user) {
        toast.error("Please log in to book a package", {
            position: "top-right",
            autoClose: 3000,
            className: 'toast-message17'
        });
        return;
    }
    setShowUserForm(true);
  };

  const handlePaymentSubmit = async (formData) => {
    try {
        // Safe function to extract price value
        const extractPrice = (priceValue) => {
          try {
            if (!priceValue) return "0";
            return String(priceValue).replace(/[^0-9.-]+/g, "") || "0";
          } catch (error) {
            console.error("Error extracting price:", error, priceValue);
            return "0";
          }
        };
        
        const paymentDetails = {
            ...formData,
            packageDetails: {
                _id: packageData._id,
                title: packageData.title,
                duration: packageData.duration,
                tripType: packageData.tripType,
                price: extractPrice(packageData.price),
                category: packageData.category,
                groupSize: packageData.groupSize,
                difficulty: packageData.difficulty,
                startDate: packageData.startDate || null,
                endDate: packageData.endDate || null,
                address: packageData.address || null,
                destination: packageData.destination || null,
                destinations: packageData.address || packageData.destinations || null
            },
            userId: user._id,
            amount: extractPrice(packageData.price),
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

  const renderUserInfo = (review) => {
    // Check for userFullName first
    if (review.userFullName && review.userFullName !== 'undefined undefined') {
      return review.userFullName;
    }

    // Check for userId object with firstName and lastName
    if (review.userId && typeof review.userId === 'object') {
      const firstName = review.userId.firstName || '';
      const lastName = review.userId.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }

    // If we have a string userId with firstName and lastName
    if (typeof review.userId === 'string' && review.firstName && review.lastName) {
      return `${review.firstName} ${review.lastName}`.trim();
    }

    return 'Anonymous';
  };

  return (
    <>
      <Header />
      <div className="main-container55">
        <div className="heading55">
            <Link to="/PlanYourTrip">
                <button className="plan-trip-btn55">
                    Plan Your Trip <img src="/images/arow.png" alt="arrow" className="arrow-down55" />
                </button>
            </Link>
        </div>
        <div className="form55">
            <h2 className="main-heading55">{packageData.title || "No Title Available"}</h2>

            <div className="image-section55">
            <img src={packageData.imageUrl || "https://via.placeholder.com/600"} alt={packageData.title || "No Image Available"} className="image55" />
            </div>

            <p className="highlight55"> {packageData.highlight || "No Highlights Available"}</p>
            <h3 className="additional-heading55">Overview:</h3>
            <p className="description55"> {packageData.overview || "No Overview Available"}</p>

            <h3 className="Quick-info55">Quick Info</h3>
            <ul className="quick-infoDetail55">
                <li>
                    <p className="address55"><strong>Address:</strong> {packageData.address || "No Address Available"}</p>
                </li>
                <li>
                    <p className="reviews55">
                        <strong>Reviews and opinions:</strong> {packageData.reviews?.length || 0} reviews ({packageData.averageRating?.toFixed(1) || '0.0'} average rating)
                    </p>
                </li>
                <li>
                    <p className="trip-type55"><strong>Trip Type:</strong> {packageData.tripType || "Not Specified"}</p>
                </li>
                <li>
                    <p className="duration55"><strong>Duration:</strong> {packageData.duration || "Not Specified"}</p>
                </li>
                <li>
                    <p className="category55"><strong>Category:</strong> {packageData.category || "Not Specified"}</p>
                </li>
                <li>
                    <p className="price55"><strong>Price:</strong> <span className="span55" style={{ color: 'green', fontWeight:"bold" }}>{packageData.price ? convertPrice(packageData.price) : "Price Not Available"}</span></p>
                </li>
                <li>
                    <p className="group-size55"><strong>Group Size:</strong> {packageData.groupSize || "Not Specified"}</p>
                </li>
                <li>
                    <p className="difficulty55"><strong>Difficulty:</strong> {packageData.difficulty || "Not Specified"}</p>
                </li>
            </ul>

            {/* Add Map Display Section */}
            {packageData.locationDetails && (
                <div className="map-section55">
                    <h3 className="section-heading55">Location Map</h3>
                    <div className="map-wrapper55">
                        <MapDisplay
                            latitude={packageData.locationDetails.latitude}
                            longitude={packageData.locationDetails.longitude}
                            formattedAddress={packageData.locationDetails.formattedAddress}
                        />
                    </div>
                </div>
            )}
            
            {/* Guide Information Section */}
            {packageData.guideIncluded && (
              <div className="guide-section-wrapper55">
                <h3 className="section-heading55">Guide Information</h3>
                <div className="guide-info-container55">
                  <div className="guide-info-header55">
                    <div className="guide-status55">
                      <span className="guide-badge55">Guide Included</span>
                    </div>
                  </div>
                  
                  {loadingGuide ? (
                    <div className="guide-loading55">
                      <div className="loading-spinner55"></div>
                      <p>Loading guide details...</p>
                    </div>
                  ) : guideDetails ? (
                    <div className="guide-compact-wrapper55">
                      <div className="guide-profile-header55">
                        {guideDetails.image ? (
                          <img 
                            src={guideDetails.image} 
                            alt={`${guideDetails.firstName} ${guideDetails.lastName}`}
                            className="guide-avatar55"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = `<div class="initials-avatar55">${getInitials(guideDetails.firstName, guideDetails.lastName)}</div>`;
                            }}
                          />
                        ) : (
                          <div className="initials-avatar55">
                            {getInitials(guideDetails.firstName, guideDetails.lastName)}
                          </div>
                        )}
                        
                        <div className="guide-name-details55">
                          <h4>{guideDetails.firstName} {guideDetails.lastName}</h4>
                          <div className="guide-ratings55">
                            {guideDetails.guideProfile?.ratings?.average ? (
                              <div className="ratings-display55">
                                <span className="rating-value55">{guideDetails.guideProfile.ratings.average.toFixed(1)}</span>
                                <div className="stars-mini55">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} 
                                      className={`star-mini55 ${star <= Math.round(guideDetails.guideProfile.ratings.average) ? 'filled' : ''}`}>★</span>
                                  ))}
                                </div>
                                <span className="reviews-count55">
                                  ({guideDetails.guideProfile.reviews?.length || 0} reviews)
                                </span>
                              </div>
                            ) : (
                              <span className="no-ratings55">No ratings yet</span>
                            )}
                          </div>
                        </div>

                        {packageData.guideCost && (
                          <div className="guide-cost-badge55">
                            {convertPrice(packageData.guideCost)}
                          </div>
                        )}
                      </div>
                      
                      <div className="guide-attributes55">
                        {guideDetails.guideProfile?.languages?.length > 0 && (
                          <div className="attribute-item55">
                            <span className="attribute-icon55">🗣️</span>
                            <span className="attribute-text55">
                              <strong>Languages:</strong> {guideDetails.guideProfile.languages.join(", ")}
                            </span>
                          </div>
                        )}
                        
                        {guideDetails.guideProfile?.regionsOfExpertise?.length > 0 && (
                          <div className="attribute-item55">
                            <span className="attribute-icon55">🗺️</span>
                            <span className="attribute-text55">
                              <strong>Expertise:</strong> {guideDetails.guideProfile.regionsOfExpertise.join(", ")}
                            </span>
                          </div>
                        )}
                        
                        {guideDetails.guideProfile?.serviceTypes?.length > 0 && (
                          <div className="attribute-item55">
                            <span className="attribute-icon55">🛎️</span>
                            <span className="attribute-text55">
                              <strong>Services:</strong> {guideDetails.guideProfile.serviceTypes.join(", ")}
                            </span>
                          </div>
                        )}
                        
                        {guideDetails.guideProfile?.yearsOfExperience && (
                          <div className="attribute-item55">
                            <span className="attribute-icon55">⏱️</span>
                            <span className="attribute-text55">
                              <strong>Experience:</strong> {guideDetails.guideProfile.yearsOfExperience} years
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="guide-not-available55">
                      <p>Guide details not available at the moment. The guide has been assigned but details cannot be retrieved.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <h3 className="day-by-day55">Day by Day Itinerary</h3>
            <div className="day-by-day-itinerary55">
            {packageData.itinerary?.length > 0 ? (
                packageData.itinerary.map((day, index) => (
                <div key={index} className="itinerary-card55">
                    <h3>{day.day || `Day ${index + 1}`}: {day.title}</h3>
                    <p><strong>Mode:</strong> {day.mode || "Not Specified"}</p>
                    <p><strong>Highlights:</strong> {day.highlights || "Not Specified"}</p>
                    <p><strong>Stay:</strong> {day.stay || "Not Specified"}</p>
                    <p><strong>Meals Included:</strong> {day.meals || "Not Specified"}</p>
                    <p><strong>Cost Breakdown:</strong></p>
                    <ul>
                        {day.costBreakdown?.split(',').map((cost, i) => (
                            <li key={i}>{cost.trim()}</li>
                        )) || <li>Not Specified</li>}
                    </ul>
                </div>
                ))
            ) : (
                <p className="info-item55">No itinerary available.</p>
                )}
                </div>


                <div className="whats-include55">
                    <h3 className="include55">What's Included:</h3>
                    <ol>
                        {packageData.included ? packageData.included.split(', ').map((item, index) => (
                            <li key={index}>{item}</li>
                        )) : <li>No inclusion details available.</li>}
                    </ol>
                </div>

                <div className="reviews-section55">
                    <h3 className="section-title55">Reviews & Ratings</h3>
                    <div className="rating-summary55">
                        <div className="average-rating55">
                            <span className="rating-number55">{packageData.averageRating?.toFixed(1) || '0.0'}</span>
                            <div className="stars-container55">
                                {[...Array(5)].map((_, index) => (
                                    <FaStar
                                        key={index}
                                        className={`star ${index < Math.round(packageData.averageRating || 0) ? 'filled' : 'empty'}`}
                                        style={{
                                            color: index < Math.round(packageData.averageRating || 0) ? '#ffd700' : '#e0e0e0',
                                            marginRight: '2px'
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="total-reviews55">{packageData.totalReviews || 0} reviews</span>
                        </div>
                    </div>
                    
                    <div className="reviews-list55">
                        {packageData.reviews && packageData.reviews.length > 0 ? (
                            packageData.reviews.map((review, index) => (
                                <div key={index} className="review-card55">
                                    <div className="review-card-header55">
                                        <div className="reviewer-info55">
                                            <h3>{renderUserInfo(review)}</h3>
                                            <span className="review-date55">{new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="review-rating55">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={`star ${i < review.rating ? 'filled' : 'empty'}`}
                                                    style={{
                                                        color: i < review.rating ? '#ffd700' : '#e0e0e0',
                                                        marginRight: '2px'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="review-text55">{review.review}</p>
                                </div>
                            ))
                        ) : (
                            <p className="no-reviews55">No reviews yet. Be the first to review!</p>
                        )}
                    </div>
                </div>

                <div className="add-info55">
                    <h3 className="info55">Additional Information:</h3>
                    <ol>
                        {packageData.additionalInfo ? packageData.additionalInfo.split(', ').map((item, index) => (
                            <li key={index}>{item}</li>
                        )) : <li>No additional information available.</li>}
                    </ol>
                </div>

                <h3 className="additional-details55">Additional Details</h3>
                <ul className="additional-details-list55">
                    <li><p><strong>Operator:</strong> {packageData.operator || "Not Specified"}</p></li>
                    <li><p><strong>Age Restriction:</strong> {packageData.ageRestriction || "Not Specified"}</p></li>
                    <li><p><strong>Pickup Details:</strong> {packageData.pickupDetails || "Not Specified"}</p></li>
                    <li><p><strong>Accessibility:</strong> {packageData.accessibility || "Not Specified"}</p></li>
                    <li><p><strong>Cancellation Policy:</strong> {packageData.cancellationPolicy || "Not Specified"}</p></li>
                </ul>


            <h3 className="last55">Ready to book your adventure? "Secure your spot for the Annapurna Base Camp Trek!"</h3>
            <div className="button-container55">
                <button className="back-btn55" onClick={handleBack}>
                    Back
                </button>
                <button className="book-now-btn55" onClick={handleBookNow}>Book Now</button>
            </div>

            {/* User Details Form Modal */}
            {showUserForm && packageData && (
                <UserDetailsForm
                    packageDetails={{
                        _id: packageData._id,
                        title: packageData.title,
                        duration: packageData.duration,
                        category: packageData.category,
                        price: extractPrice(packageData.price),
                        groupSize: packageData.groupSize,
                        difficulty: packageData.difficulty,
                        startDate: packageData.startDate || null,
                        endDate: packageData.endDate || null,
                        destinations: packageData.address || packageData.destinations || null
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
