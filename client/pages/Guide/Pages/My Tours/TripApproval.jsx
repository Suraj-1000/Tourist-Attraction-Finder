import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from "react-router-dom";
import "./TripApproval.css";
import { CurrencyContext } from "../../../../context/CurrencyContext";
import Footer from "../../../../components/Footer/AuthFooter";
import VerificationCheck from "../../../../components/VerificationCheck";

// Update the toast configuration
const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    className: "toast-message"
};

export default function TripApproval() {
    const { currency, exchangeRates } = useContext(CurrencyContext);
    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [processingTrip, setProcessingTrip] = useState({ tripName: null, action: null });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineMessage, setDeclineMessage] = useState("");
    const [tripToDecline, setTripToDecline] = useState(null);
    const [currentGuideId, setCurrentGuideId] = useState(null);

    // Function to get initials for avatar when no image is available
    const getInitials = (firstName, lastName) => {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return `${firstInitial}${lastInitial}`;
    };
    
    const formatNumberWithCommas = (number) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    const convertPrice = (priceString) => {
      if (!priceString || isNaN(priceString)) {
          return "N/A"; 
      }
    
      // Ensure priceString is actually a string
      const priceStr = String(priceString);
      
      try {
          const priceInUSD = parseFloat(priceStr.replace(/[^0-9.]+/g, "")); 
        
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
        // Get the current guide's ID from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.id) {
            setCurrentGuideId(user.id);
            console.log("Current guide ID set from localStorage:", user.id);
        } else if (user && user._id) {
            setCurrentGuideId(user._id);
            console.log("Current guide ID set from localStorage (_id):", user._id);
        } else {
            console.log("No guide ID found in localStorage:", user);
        }
        
        fetchTrips();
    }, []);
    
    useEffect(() => {
        filterTrips();
    }, [searchQuery, statusFilter, trips]);

    const fetchTrips = async () => {
        try {
            const response = await axios.get("http://localhost:4000/adminBookingApprove/trips");
            console.log("All trips fetched:", response.data);
            
            // Get the current guide's ID from localStorage if not already set
            let guideId = currentGuideId;
            if (!guideId) {
                const user = JSON.parse(localStorage.getItem("user"));
                if (user && user.id) {
                    guideId = user.id;
                    setCurrentGuideId(user.id);
                    console.log("Guide ID updated from localStorage (id):", user.id);
                } else if (user && user._id) {
                    guideId = user._id;
                    setCurrentGuideId(user._id);
                    console.log("Guide ID updated from localStorage (_id):", user._id);
                } else {
                    console.log("Still no guide ID found:", user);
                }
            }
            
            // Filter trips based on guideId
            let filteredTrips = [];
            
            if (guideId) {
                console.log("Filtering trips for guide ID:", guideId);
                
                // Debug: Log all guideIds in trips
                response.data.forEach((trip, index) => {
                    console.log(`Trip ${index}: tripName=${trip.tripName}, guideId=${trip.guideId}, guideIncluded=${trip.guideIncluded}`);
                });
                
                filteredTrips = response.data.filter(trip => {
                    // Case 1: Trip has no guide assigned (guideId is undefined/null)
                    if (!trip.guideId) {
                        console.log(`Trip ${trip.tripName}: No guide assigned, showing to all guides`);
                        return true;
                    }
                    
                    // Convert both IDs to strings for comparison to avoid type issues
                    const tripGuideId = String(trip.guideId);
                    const currentId = String(guideId);
                    
                    // Case 2: Trip is assigned to this guide
                    const isAssignedToCurrentGuide = tripGuideId === currentId;
                    
                    if (isAssignedToCurrentGuide) {
                        console.log(`Trip ${trip.tripName}: Assigned to current guide (${tripGuideId} === ${currentId})`);
                        return true;
                    } else {
                        console.log(`Trip ${trip.tripName}: Not assigned to current guide (${tripGuideId} !== ${currentId})`);
                        return false;
                    }
                });
                
                console.log(`After filtering: Found ${filteredTrips.length} trips for guide ${guideId}`);
            } else {
                // If no guide ID found, show all trips (admin view)
                console.log("No guide ID found, showing all trips (admin view)");
                filteredTrips = response.data;
            }
            
            setTrips(filteredTrips);
            setFilteredTrips(filteredTrips);
        } catch (error) {
            console.error("Error fetching trips:", error);
            toast.error("Failed to fetch trips. Please try again later.");
        }
    };

    const filterTrips = () => {
        let filtered = [...trips];

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(trip => trip.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(trip => 
                trip.tripName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trip.destinations.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredTrips(filtered);
    };

    const viewDetails = (trip) => {
        setSelectedTrip(trip);
        setShowDetailsModal(true);
        
        // If trip has guide, fetch guide details
        if(trip.guideIncluded && trip.guideId) {
            fetchGuideDetails(trip.guideId);
        }
    };

    // Function to fetch guide details
    const fetchGuideDetails = async (guideId) => {
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
                console.log("Guide details fetched:", response.data);
                // Store guide details separately like ViewTripDetails.jsx does
                setSelectedTrip(prevTrip => ({
                    ...prevTrip,
                    guideDetails: response.data
                }));
            }
        } catch (error) {
            console.error("Error fetching guide details:", error);
        }
    };

    // Update trip status
    const updateTripStatus = async (tripName, status, message = "") => {
        if (status === "declined" && !message) {
            handleDeclineClick({ tripName });
            return;
        }

        // Set the processing state with current tripName and action
        setProcessingTrip({ tripName, action: status });
        
        try {
            const encodedTripName = encodeURIComponent(tripName);
            
            const trip = trips.find(t => t.tripName === tripName);
            if (!trip) {
                throw new Error("Trip not found");
            }

            // First update the trip status
            const response = await axios.put(
                `http://localhost:4000/adminBookingApprove/trips/${encodedTripName}`,
                {
                    status,
                    declineMessage: message,
                    userEmail: trip.userEmail
                },
                { headers: { "Content-Type": "application/json" } }
            );

            if (!response.data) {
                throw new Error("Failed to update trip status");
            }

            // Create notification for user
            const userNotification = {
                type: status === 'approved' ? 'trip-approval' : 'trip-declined',
                message: status === 'approved' 
                    ? `Your trip "${tripName}" has been approved!` 
                    : `Your trip "${tripName}" has been declined. ${message ? `Reason: ${message}` : ''}`,
                userEmail: trip.userEmail,
                recipientType: 'user',
                details: {
                    tripName,
                    status,
                    declineMessage: message
                }
            };

            // Create notification for admin
            const adminNotification = {
                type: status === 'approved' ? 'trip-approval' : 'trip-declined',
                message: status === 'approved'
                    ? `Trip "${tripName}" has been approved`
                    : `Trip "${tripName}" has been declined. ${message ? `Reason: ${message}` : ''}`,
                recipientType: 'admin',
                details: {
                    tripName,
                    status,
                    declineMessage: message,
                    userEmail: trip.userEmail
                }
            };

            // Save notifications to database
            const [userNotifResponse, adminNotifResponse] = await Promise.all([
                axios.post('http://localhost:4000/notifications', userNotification),
                axios.post('http://localhost:4000/notifications', adminNotification)
            ]);

            if (!userNotifResponse.data || !adminNotifResponse.data) {
                throw new Error("Failed to create notifications");
            }

            // Update local state
            setTrips((prevTrips) =>
                prevTrips.map((t) =>
                    t.tripName === tripName 
                        ? { ...t, status, declineMessage: message }
                        : t
                )
            );

            // Trigger notification update for the user
            const notificationEvent = new CustomEvent('tripStatusUpdate', {
                detail: {
                    userEmail: trip.userEmail,
                    status: status
                }
            });
            window.dispatchEvent(notificationEvent);

            // Show success toast
            toast.success(
                status === 'approved' 
                    ? `Trip "${tripName}" has been approved successfully!` 
                    : `Trip "${tripName}" has been declined.`,
                toastConfig
            );

        } catch (error) {
            console.error("Error updating trip status:", error);
            toast.error(
                `Failed to ${status} trip "${tripName}". Please try again.`,
                toastConfig
            );
        } finally {
            // Reset processing state
            setProcessingTrip({ tripName: null, action: null });
            setShowDeclineModal(false);
            setDeclineMessage("");
            setTripToDecline(null);
            setShowDetailsModal(false);
        }
    };

    // Add new function to handle decline button click
    const handleDeclineClick = (trip) => {
        setTripToDecline(trip);
        setShowDeclineModal(true);
        setShowDetailsModal(false); // Close the details modal if it's open
    };

    // Helper function to check if a specific button is loading
    const isButtonLoading = (tripName, action) => {
        return processingTrip.tripName === tripName && processingTrip.action === action;
    };

    return (
        <VerificationCheck>
            <div className="guide-page-container">
                <ToastContainer {...toastConfig} />
                
                <div className="guide-page-header">
                    <h1 className="guide-page-title">Trip Management</h1>
                    
                    <div className="guide-info-message">
                        <p>
                            <i className="info-icon">ℹ️</i> 
                            Showing trips that are either assigned specifically to you or available to all guides. 
                            <span className="guide-assigned-tag-info">
                                Trips with <span className="guide-assigned-tag">Assigned to You</span> tag are exclusively for you.
                            </span>
                        </p>
                    </div>
                    
                    <div className="guide-search-filter">
                        <div className="guide-search-wrapper">
                            <input
                                type="text"
                                placeholder="Search trips by name or destination..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="guide-search-input"
                            />
                            <img src="/images/searchicon.png" alt="search" className="guide-search-icon" />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="guide-status-filter"
                        >
                            <option value="all">All Trips</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="declined">Declined</option>
                        </select>
                    </div>

                    <h2 className="guide-results-heading">
                        {statusFilter === "all" 
                            ? `All Trips (${filteredTrips.length})`
                            : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Trips (${filteredTrips.length})`
                        }
                        {searchQuery && ` - Search results for "${searchQuery}"`}
                    </h2>
                </div>

                <div className="guide-content">
                    {/* Pending Trips Section */}
                    {(statusFilter === "all" || statusFilter === "pending") && (
                        <div className="guide-section">
                            <h3 className="guide-section-title">Pending Trips</h3>
                            <div className="guide-cards-grid">
                                {filteredTrips
                                    .filter(trip => trip.status === "pending")
                                    .map((trip, index) => (
                                        <div key={trip._id} className="guide-card guide-card-pending" style={{ borderLeft: '5px solid #F25019' }}>
                                            <div className="guide-card-header">
                                                <span className="guide-card-index">#{index + 1}</span>
                                                <span className="guide-status-badge guide-status-pending">Pending</span>
                                                {trip.guideId && String(trip.guideId) === String(currentGuideId) && (
                                                    <span className="guide-assigned-tag">Assigned to You</span>
                                                )}
                                            </div>
                                            <div className="guide-card-content">
                                                <h4 className="guide-card-title">{trip.tripName}</h4>
                                                <div className="guide-card-info">
                                                    <p><strong>Destination:</strong> {trip.destinations}</p>
                                                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                                                    <p><strong>End Date:</strong> {trip.endDate}</p>
                                                    <p>
                                                        <strong>Budget:</strong> 
                                                        <span className="guide-budget-value">
                                                            {convertPrice(trip.totalBudget)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="guide-card-actions">
                                                    <span 
                                                        className="guide-view-details"
                                                        onClick={() => viewDetails(trip)}
                                                    >
                                                        View Details
                                                    </span>
                                                    <div className="guide-approval-buttons">
                                                        <button 
                                                            className="guide-reject-button" 
                                                            onClick={() => handleDeclineClick(trip)}
                                                            disabled={processingTrip.tripName !== null}
                                                        >
                                                            {isButtonLoading(trip.tripName, "declined") ? "Declining..." : "Decline"}
                                                        </button>
                                                        <button 
                                                            className="guide-approve-button" 
                                                            onClick={() => updateTripStatus(trip.tripName, "approved")}
                                                            disabled={processingTrip.tripName !== null}
                                                        >
                                                            {isButtonLoading(trip.tripName, "approved") ? "Approving..." : "Approve"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Approved Trips Section */}
                    {(statusFilter === "all" || statusFilter === "approved") && (
                        <div className="guide-section">
                            <h3 className="guide-section-title">Approved Trips</h3>
                            <div className="guide-cards-grid">
                                {filteredTrips
                                    .filter(trip => trip.status === "approved")
                                    .map((trip, index) => (
                                        <div key={trip._id} className="guide-card guide-card-approved" style={{ borderLeft: '5px solid #008000' }}>
                                            <div className="guide-card-header">
                                                <span className="guide-card-index">#{index + 1}</span>
                                                <span className="guide-status-badge guide-status-approved">Approved</span>
                                                {trip.guideId && String(trip.guideId) === String(currentGuideId) && (
                                                    <span className="guide-assigned-tag">Assigned to You</span>
                                                )}
                                            </div>
                                            <div className="guide-card-content">
                                                <h4 className="guide-card-title">{trip.tripName}</h4>
                                                <div className="guide-card-info">
                                                    <p><strong>Destination:</strong> {trip.destinations}</p>
                                                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                                                    <p><strong>End Date:</strong> {trip.endDate}</p>
                                                    <p>
                                                        <strong>Budget:</strong> 
                                                        <span className="guide-budget-value">
                                                            {convertPrice(trip.totalBudget)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span 
                                                    className="guide-view-details"
                                                    onClick={() => viewDetails(trip)}
                                                >
                                                    View Details
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Declined Trips Section */}
                    {(statusFilter === "all" || statusFilter === "declined") && (
                        <div className="guide-section">
                            <h3 className="guide-section-title">Declined Trips</h3>
                            <div className="guide-cards-grid">
                                {filteredTrips
                                    .filter(trip => trip.status === "declined")
                                    .map((trip, index) => (
                                        <div key={trip._id} className="guide-card guide-card-declined" style={{ borderLeft: '5px solid #ae0808' }}>
                                            <div className="guide-card-header">
                                                <span className="guide-card-index">#{index + 1}</span>
                                                <span className="guide-status-badge guide-status-declined">Declined</span>
                                                {trip.guideId && String(trip.guideId) === String(currentGuideId) && (
                                                    <span className="guide-assigned-tag">Assigned to You</span>
                                                )}
                                            </div>
                                            <div className="guide-card-content">
                                                <h4 className="guide-card-title">{trip.tripName}</h4>
                                                <div className="guide-card-info">
                                                    <p><strong>Destination:</strong> {trip.destinations}</p>
                                                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                                                    <p><strong>End Date:</strong> {trip.endDate}</p>
                                                    <p>
                                                        <strong>Budget:</strong> 
                                                        <span className="guide-budget-value">
                                                            {convertPrice(trip.totalBudget)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span 
                                                    className="guide-view-details"
                                                    onClick={() => viewDetails(trip)}
                                                >
                                                    View Details
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                {showDetailsModal && selectedTrip && (
                    <div className="guide-modal-overlay">
                        <div className="guide-modal-content">
                            <div className="guide-modal-header">
                                <h2 className="guide-modal-title">{selectedTrip.tripName}</h2>
                                <div className="guide-modal-header-right">
                                    <div className={`guide-modal-status-badge guide-status-${selectedTrip.status}`}>
                                        {selectedTrip.status.charAt(0).toUpperCase() + selectedTrip.status.slice(1)}
                                    </div>
                                    <div className="guide-modal-close" onClick={() => setShowDetailsModal(false)}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="guide-modal-subheader">
                                {selectedTrip.guideId && String(selectedTrip.guideId) === String(currentGuideId) ? (
                                    <div className="guide-assignment-badge assigned">
                                        <i className="assignment-icon">👤</i>
                                        This trip is exclusively assigned to you
                                    </div>
                                ) : (
                                    <div className="guide-assignment-badge available">
                                        <i className="assignment-icon">👥</i>
                                        This trip is available to all guides
                                    </div>
                                )}
                            </div>
                            
                            <div className="guide-modal-body">
                                <div className="guide-modal-section">
                                    <h3>Trip Details</h3>
                                    <div className="guide-detail-grid">
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Start Date:</span>
                                            <span className="guide-detail-value">{new Date(selectedTrip.startDate).toLocaleDateString("en-GB")}</span>
                                        </div>
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">End Date:</span>
                                            <span className="guide-detail-value">{new Date(selectedTrip.endDate).toLocaleDateString("en-GB")}</span>
                                        </div>
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Duration:</span>
                                            <span className="guide-detail-value">{selectedTrip.duration}</span>
                                        </div>
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Trip Type:</span>
                                            <span className="guide-detail-value">{selectedTrip.tripType}</span>
                                        </div>
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Destinations:</span>
                                            <span className="guide-detail-value">{selectedTrip.destinations}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="guide-modal-section">
                                    <h3>How Do You Want to Spend Your Time?</h3>
                                    <div className="guide-activities-grid">
                                        {selectedTrip.adventureActivities?.length > 0 && (
                                            <div className="guide-activity-category">
                                                <h4>Adventure Activities</h4>
                                                <ul>
                                                    {selectedTrip.adventureActivities.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.culturalExperiences?.length > 0 && (
                                            <div className="guide-activity-category">
                                                <h4>Cultural Experiences</h4>
                                                <ul>
                                                    {selectedTrip.culturalExperiences.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.relaxation?.length > 0 && (
                                            <div className="guide-activity-category">
                                                <h4>Relaxation Activities</h4>
                                                <ul>
                                                    {selectedTrip.relaxation.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.foodCulinary?.length > 0 && (
                                            <div className="guide-activity-category">
                                                <h4>Food & Culinary</h4>
                                                <ul>
                                                    {selectedTrip.foodCulinary.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.nightlifeEntertainment?.length > 0 && (
                                            <div className="guide-activity-category">
                                                <h4>Nightlife & Entertainment</h4>
                                                <ul>
                                                    {selectedTrip.nightlifeEntertainment.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {selectedTrip.customActivities && (
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Custom Activities:</span>
                                            <span className="guide-detail-value">{selectedTrip.customActivities}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="guide-modal-section">
                                    <h3>Travel Style</h3>
                                    <div className="guide-detail-item">
                                        <span className="guide-detail-value">{selectedTrip.travelStyle}</span>
                                    </div>
                                </div>

                                <div className="guide-modal-section">
                                    <h3>Accommodation Details</h3>
                                    <div className="guide-detail-grid">
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Type:</span>
                                            <span className="guide-detail-value">{selectedTrip.accommodationType}</span>
                                        </div>
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Meals Preferences:</span>
                                            <span className="guide-detail-value">{selectedTrip.mealsPreferences}</span>
                                        </div>
                                        <div className="guide-detail-item">
                                            <span className="guide-detail-label">Dietary Preferences:</span>
                                            <span className="guide-detail-value">{selectedTrip.dietaryPreferences}</span>
                                        </div>
                                        {selectedTrip.customDietaryPreference && (
                                            <div className="guide-detail-item">
                                                <span className="guide-detail-label">Other Dietary Preferences:</span>
                                                <span className="guide-detail-value">{selectedTrip.customDietaryPreference}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="guide-modal-section">
                                    <h3>Transportation Preferences</h3>
                                    <div className="guide-detail-item">
                                        <span className="guide-detail-label">Type:</span>
                                        <span className="guide-detail-value">{selectedTrip.transportationType}</span>
                                    </div>
                                </div>

                                {/* Guide Information Section */}
                                {selectedTrip.guideIncluded && (
                                    <div className="guide-modal-section">
                                        <h3>Guide Information</h3>
                                        <div className="guide-profile-container">
                                            <div className="guide-header">
                                                <div className="guide-badge">
                                                    <span>Guide Included</span>
                                                </div>
                                            </div>
                                            
                                            {selectedTrip.guideDetails ? (
                                                <div className="guide-details-wrapper">
                                                    <div className="guide-profile-section">
                                                        <div className="guide-profile-header">
                                                            {selectedTrip.guideDetails.image ? (
                                                                <img 
                                                                    src={selectedTrip.guideDetails.image} 
                                                                    alt={`${selectedTrip.guideDetails.firstName} ${selectedTrip.guideDetails.lastName}`}
                                                                    className="guide-avatar"
                                                                    onError={(e) => {e.target.src = "/images/default-guide-avatar.png"}}
                                                                />
                                                            ) : (
                                                                <div className="guide-initials-avatar">
                                                                    {getInitials(selectedTrip.guideDetails.firstName, selectedTrip.guideDetails.lastName)}
                                                                </div>
                                                            )}
                                                            <div className="guide-name-section">
                                                                <h4>{selectedTrip.guideDetails.firstName} {selectedTrip.guideDetails.lastName}</h4>
                                                                <div className="guide-ratings">
                                                                    {selectedTrip.guideDetails.guideProfile?.ratings?.average ? (
                                                                        <div className="rating-display">
                                                                            <span>{selectedTrip.guideDetails.guideProfile.ratings.average.toFixed(1)}</span>
                                                                            <span className="stars-mini">
                                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                                    <span key={star} className={`star-mini ${star <= Math.round(selectedTrip.guideDetails.guideProfile.ratings.average) ? 'filled' : ''}`}>★</span>
                                                                                ))}
                                                                            </span>
                                                                            <span className="reviews-count">({selectedTrip.guideDetails.guideProfile.ratings.total || 0})</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="no-ratings">No ratings yet</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="guide-compact-info">
                                                        <div className="guide-info-row">
                                                            {selectedTrip.guideDetails.guideProfile?.languages?.length > 0 && (
                                                                <div className="guide-info-item">
                                                                    <span className="info-icon">🗣️</span>
                                                                    <span>{selectedTrip.guideDetails.guideProfile.languages.join(", ")}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {selectedTrip.guideDetails.guideProfile?.regionsOfExpertise?.length > 0 && (
                                                                <div className="guide-info-item">
                                                                    <span className="info-icon">🗺️</span>
                                                                    <span>{selectedTrip.guideDetails.guideProfile.regionsOfExpertise.join(", ")}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="guide-info-row">
                                                            {selectedTrip.guideDetails.guideProfile?.serviceTypes?.length > 0 && (
                                                                <div className="guide-info-item">
                                                                    <span className="info-icon">🛎️</span>
                                                                    <span>{selectedTrip.guideDetails.guideProfile.serviceTypes.join(", ")}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {selectedTrip.guideCost && (
                                                                <div className="guide-cost-compact">
                                                                    <span className="guide-fee-label">Guide Fee:</span>
                                                                    <span className="guide-fee-value">{convertPrice(selectedTrip.guideCost)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="guide-not-available">
                                                    <p>Guide details not available at the moment. The guide has been assigned but details cannot be retrieved.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedTrip.itinerary && selectedTrip.itinerary.length > 0 && (
                                    <div className="guide-modal-section">
                                        <h3>Day by Day Itinerary</h3>
                                        <div className="guide-itinerary-grid">
                                            {selectedTrip.itinerary.map((day, index) => (
                                                <div key={index} className="guide-itinerary-day">
                                                    <h4>Day {index + 1}</h4>
                                                    <div className="guide-detail-item">
                                                        <span className="guide-detail-label">Mode:</span>
                                                        <span className="guide-detail-value">{day.mode}</span>
                                                    </div>
                                                    <div className="guide-detail-item">
                                                        <span className="guide-detail-label">Highlights:</span>
                                                        <span className="guide-detail-value">{day.highlights}</span>
                                                    </div>
                                                    <div className="guide-detail-item">
                                                        <span className="guide-detail-label">Stay:</span>
                                                        <span className="guide-detail-value">{day.stay}</span>
                                                    </div>
                                                    <div className="guide-detail-item">
                                                        <span className="guide-detail-label">Meals:</span>
                                                        <span className="guide-detail-value">{day.meals}</span>
                                                    </div>
                                                    <div className="guide-detail-item">
                                                        <span className="guide-detail-label">Cost Breakdown:</span>
                                                        <ul className="guide-cost-list">
                                                            {day.costBreakdown?.split(',').map((cost, i) => (
                                                                <li key={i}>{cost.trim()}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="guide-modal-section">
                                    <h3>User Information</h3>
                                    <div className="guide-user-info-container">
                                        <div className="guide-user-details-grid">
                                            <div className="guide-detail-item">
                                                <span className="guide-detail-label">Full Name:</span>
                                                <span className="guide-detail-value">{selectedTrip.userName}</span>
                                            </div>
                                            <div className="guide-detail-item">
                                                <span className="guide-detail-label">Email:</span>
                                                <span className="guide-detail-value">{selectedTrip.userEmail}</span>
                                            </div>
                                            <div className="guide-detail-item">
                                                <span className="guide-detail-label">Address:</span>
                                                <span className="guide-detail-value">{selectedTrip.userAddress}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="guide-modal-section">
                                    <h3>Trip Budget</h3>
                                    <div className="guide-budget-info">
                                        <div className="guide-budget-item">
                                            <span className="guide-budget-label">Total Budget:</span>
                                            <span className="guide-budget-value">{convertPrice(selectedTrip.totalBudget)}</span>
                                        </div>
                                        <div className="guide-budget-item">
                                            <span className="guide-budget-label">Transport Cost:</span>
                                            <span className="guide-budget-value">{convertPrice(selectedTrip.transportCost)}</span>
                                        </div>
                                        <div className="guide-budget-item">
                                            <span className="guide-budget-label">Accommodation Cost:</span>
                                            <span className="guide-budget-value">{convertPrice(selectedTrip.accommodationCost)}</span>
                                        </div>
                                        <div className="guide-budget-item">
                                            <span className="guide-budget-label">Meals Cost:</span>
                                            <span className="guide-budget-value">{convertPrice(selectedTrip.mealsCost)}</span>
                                        </div>
                                        <div className="guide-budget-item">
                                            <span className="guide-budget-label">Activities Cost:</span>
                                            <span className="guide-budget-value">{convertPrice(selectedTrip.activitiesCost)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add decline message section if status is declined */}
                                {selectedTrip.status === "declined" && selectedTrip.declineMessage && (
                                    <div className="guide-modal-section">
                                        <h3>Decline Reason</h3>
                                        <div className="guide-detail-item">
                                            <p className="guide-decline-message">{selectedTrip.declineMessage}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedTrip.status === "pending" && (
                                    <div className="guide-modal-actions">
                                        <button 
                                            className="guide-modal-decline-btn"
                                            onClick={() => handleDeclineClick(selectedTrip)}
                                            disabled={processingTrip.tripName !== null}
                                        >
                                            {isButtonLoading(selectedTrip.tripName, "declined") ? "Declining..." : "Decline"}
                                        </button>
                                        <button 
                                            className="guide-modal-approve-btn"
                                            onClick={() => updateTripStatus(selectedTrip.tripName, "approved")}
                                            disabled={processingTrip.tripName !== null}
                                        >
                                            {isButtonLoading(selectedTrip.tripName, "approved") ? "Approving..." : "Approve"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Decline Modal */}
                {showDeclineModal && (
                    <div className="guide-modal-overlay">
                        <div className="guide-modal-content">
                            <div className="guide-modal-header">
                                <h2 className="guide-modal-title">Decline Trip</h2>
                                <div className="guide-modal-close" onClick={() => setShowDeclineModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="guide-modal-body">
                                <textarea
                                    className="guide-decline-input"
                                    placeholder="Please provide a reason for declining this trip (required)..."
                                    value={declineMessage}
                                    onChange={(e) => setDeclineMessage(e.target.value)}
                                    rows={4}
                                    required
                                />
                                <div className="guide-modal-actions">
                                    <button 
                                        className="guide-cancel-button"
                                        onClick={() => setShowDeclineModal(false)}
                                        disabled={processingTrip.tripName !== null}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="guide-reject-button"
                                        onClick={() => {
                                            if (!declineMessage.trim()) {
                                                toast.error("Please provide a reason for declining the trip.");
                                                return;
                                            }
                                            updateTripStatus(tripToDecline.tripName, "declined", declineMessage);
                                        }}
                                        disabled={!declineMessage.trim() || processingTrip.tripName !== null}
                                    >
                                        {isButtonLoading(tripToDecline?.tripName, "declined") ? "Declining Trip..." : "Decline Trip"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VerificationCheck>
    );
}
