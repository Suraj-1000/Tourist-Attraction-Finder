import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from "react-router-dom";
import "./AdminBookingAD.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";

export default function AdminBookingADPage() {
    const { currency, exchangeRates,  } = useContext(CurrencyContext);
    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineMessage, setDeclineMessage] = useState("");
    const [tripToDecline, setTripToDecline] = useState(null);

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
        fetchTrips();
    }, []);
    
    useEffect(() => {
        filterTrips();
    }, [searchQuery, statusFilter, trips]);

    const fetchTrips = async () => {
        try {
            const response = await axios.get("http://localhost:4000/adminBookingApprove/trips");
            setTrips(response.data);
            setFilteredTrips(response.data);
        } catch (error) {
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
    };

    // ✅ Update trip status
    const updateTripStatus = async (tripName, status, message = "") => {
        if (status === "declined" && !message) {
            handleDeclineClick({ tripName }); // Show decline modal if no message provided
            return;
        }

        setIsUpdating(true);
        try {
            const encodedTripName = encodeURIComponent(tripName);
            
            const requestBody = {
                status,
                declineMessage: message
            };

            const response = await axios.put(
                `http://localhost:4000/adminBookingApprove/trips/${encodedTripName}`,
                requestBody,
                { headers: { "Content-Type": "application/json" } }
            );

            // Update state in React
            setTrips((prevTrips) =>
                prevTrips.map((trip) =>
                    trip.tripName === tripName 
                        ? { ...trip, status, declineMessage: message }
                        : trip
                )
            );

            // Show success toast based on status
            if (status === "approved") {
                toast.success(`Trip "${tripName}" has been approved successfully!`, {
                    position: "top-right",
                    autoClose: 3000,
                    className: 'toast-message25'
                });
            } else {
                toast.error(`Trip "${tripName}" has been declined.`, {
                    position: "top-right",
                    autoClose: 3000,
                    className: 'toast-message25'
                });
            }

        } catch (error) {
            console.error("Update failed:", error.response?.data || error);
            toast.error(`Failed to ${status} "${tripName}". Please try again.`);
        } finally {
            setIsUpdating(false);
            setShowDeclineModal(false);
            setDeclineMessage("");
            setTripToDecline(null);
            setShowDetailsModal(false); // Close the details modal after action
        }
    };

    // Add new function to handle decline button click
    const handleDeclineClick = (trip) => {
        setTripToDecline(trip);
        setShowDeclineModal(true);
        setShowDetailsModal(false); // Close the details modal if it's open
    };

    return (
        <>
            <Header />
            <ToastContainer />
            <div className="main-container25">
                <div className="heading-container25">
                    <h1 className="title-heading25">Admin Trip Management</h1>
                    
                    {/* Updated Search and Filter Section */}
                    <div className="search-filter-container25">
                        <div className="search-wrapper25">
                            <input
                                type="text"
                                placeholder="Search trips by name or destination..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input25"
                            />
                            <img src="/images/searchicon.png" alt="search" className="search-icon25" />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-filter25"
                        >
                            <option value="all">All Trips</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="declined">Declined</option>
                        </select>
                    </div>

                    {/* Results Heading */}
                    <h2 className="results-heading25">
                        {statusFilter === "all" 
                            ? `All Trips (${filteredTrips.length})`
                            : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Trips (${filteredTrips.length})`
                        }
                        {searchQuery && ` - Search results for "${searchQuery}"`}
                    </h2>

                    {/* Pending Trips Section */}
                    {(statusFilter === "all" || statusFilter === "pending") && (
                        <div className="trips-section25">
                            <h3 className="section-heading25">Pending Trips</h3>
                            <div className="cards-container25">
                                {filteredTrips
                                    .filter(trip => trip.status === "pending")
                                    .map((trip, index) => (
                                        <div key={trip._id} className="trip-card25 pending-card">
                                            <div className="card-header25">
                                                <span className="card-index25">#{index + 1}</span>
                                                <span className="status-badge25 status-pending">Pending</span>
                                            </div>
                                            <div className="card-content25">
                                                <h4 className="trip-title25">{trip.tripName}</h4>
                                                <div className="trip-info25">
                                                    <p><strong>Destination:</strong> {trip.destinations}</p>
                                                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                                                    <p><strong>End Date:</strong> {trip.endDate}</p>
                                                    <p>
                                                        <strong>Budget:</strong> 
                                                        <span className="budget-value25">
                                                            {convertPrice(trip.totalBudget)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="card-actions25">
                                                    <span 
                                                        className="view-details-link25"
                                                        onClick={() => viewDetails(trip)}
                                                    >
                                                        View Details
                                                    </span>
                                                    <div className="approval-buttons25">
                                                        <button 
                                                            className="reject-button25" 
                                                            onClick={() => handleDeclineClick(trip)}
                                                            disabled={isUpdating}
                                                        >
                                                            {isUpdating ? "Declining..." : "Decline"}
                                                        </button>
                                                        <button 
                                                            className="approve-button25" 
                                                            onClick={() => updateTripStatus(trip.tripName, "approved")}
                                                            disabled={isUpdating}
                                                        >
                                                            {isUpdating ? "Approving..." : "Approve"}
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
                        <div className="trips-section25">
                            <h3 className="section-heading25">Approved Trips</h3>
                            <div className="cards-container25">
                                {filteredTrips
                                    .filter(trip => trip.status === "approved")
                                    .map((trip, index) => (
                                        <div key={trip._id} className="trip-card25 approved-card">
                                            <div className="card-header25">
                                                <span className="card-index25">#{index + 1}</span>
                                                <span className="status-badge25 status-approved">Approved</span>
                                            </div>
                                            <div className="card-content25">
                                                <h4 className="trip-title25">{trip.tripName}</h4>
                                                <div className="trip-info25">
                                                    <p><strong>Destination:</strong> {trip.destinations}</p>
                                                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                                                    <p><strong>End Date:</strong> {trip.endDate}</p>
                                                    <p>
                                                        <strong>Budget:</strong> 
                                                        <span className="budget-value25">
                                                            {convertPrice(trip.totalBudget)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span 
                                                    className="view-details-link25"
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
                        <div className="trips-section25">
                            <h3 className="section-heading25">Declined Trips</h3>
                            <div className="cards-container25">
                                {filteredTrips
                                    .filter(trip => trip.status === "declined")
                                    .map((trip, index) => (
                                        <div key={trip._id} className="trip-card25 declined-card">
                                            <div className="card-header25">
                                                <span className="card-index25">#{index + 1}</span>
                                                <span className="status-badge25 status-declined">Declined</span>
                                            </div>
                                            <div className="card-content25">
                                                <h4 className="trip-title25">{trip.tripName}</h4>
                                                <div className="trip-info25">
                                                    <p><strong>Destination:</strong> {trip.destinations}</p>
                                                    <p><strong>Start Date:</strong> {trip.startDate}</p>
                                                    <p><strong>End Date:</strong> {trip.endDate}</p>
                                                    <p>
                                                        <strong>Budget:</strong> 
                                                        <span className="budget-value25">
                                                            {convertPrice(trip.totalBudget)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span 
                                                    className="view-details-link25"
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
                    <div className="modal-overlay25">
                        <div className="modal-content25">
                            <div className="modal-header25">
                                <h2 className="modal-title25">{selectedTrip.tripName}</h2>
                                <div className="header-right25">
                                    <span className={`modal-status-badge25 status-${selectedTrip.status}`}>
                                        {selectedTrip.status.charAt(0).toUpperCase() + selectedTrip.status.slice(1)}
                                    </span>
                                    <div className="modal-close-icon25" onClick={() => setShowDetailsModal(false)}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-body25">
                                <div className="modal-section25">
                                    <h3>Trip Details</h3>
                                    <div className="detail-grid25">
                                        <div className="detail-item25">
                                            <span className="detail-label25">Start Date:</span>
                                            <span className="detail-value25">{new Date(selectedTrip.startDate).toLocaleDateString("en-GB")}</span>
                                        </div>
                                        <div className="detail-item25">
                                            <span className="detail-label25">End Date:</span>
                                            <span className="detail-value25">{new Date(selectedTrip.endDate).toLocaleDateString("en-GB")}</span>
                                        </div>
                                        <div className="detail-item25">
                                            <span className="detail-label25">Duration:</span>
                                            <span className="detail-value25">{selectedTrip.duration}</span>
                                        </div>
                                        <div className="detail-item25">
                                            <span className="detail-label25">Trip Type:</span>
                                            <span className="detail-value25">{selectedTrip.tripType}</span>
                                        </div>
                                        <div className="detail-item25">
                                            <span className="detail-label25">Destinations:</span>
                                            <span className="detail-value25">{selectedTrip.destinations}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-section25">
                                    <h3>How Do You Want to Spend Your Time?</h3>
                                    <div className="activities-grid25">
                                        {selectedTrip.adventureActivities?.length > 0 && (
                                            <div className="activity-category25">
                                                <h4>Adventure Activities</h4>
                                                <ul>
                                                    {selectedTrip.adventureActivities.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.culturalExperiences?.length > 0 && (
                                            <div className="activity-category25">
                                                <h4>Cultural Experiences</h4>
                                                <ul>
                                                    {selectedTrip.culturalExperiences.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.relaxation?.length > 0 && (
                                            <div className="activity-category25">
                                                <h4>Relaxation Activities</h4>
                                                <ul>
                                                    {selectedTrip.relaxation.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.foodCulinary?.length > 0 && (
                                            <div className="activity-category25">
                                                <h4>Food & Culinary</h4>
                                                <ul>
                                                    {selectedTrip.foodCulinary.map((activity, index) => (
                                                        <li key={index}>{activity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedTrip.nightlifeEntertainment?.length > 0 && (
                                            <div className="activity-category25">
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
                                        <div className="detail-item25">
                                            <span className="detail-label25">Custom Activities:</span>
                                            <span className="detail-value25">{selectedTrip.customActivities}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-section25">
                                    <h3>Travel Style</h3>
                                    <div className="detail-item25">
                                        <span className="detail-value25">{selectedTrip.travelStyle}</span>
                                    </div>
                                </div>

                                <div className="modal-section25">
                                    <h3>Accommodation Details</h3>
                                    <div className="detail-grid25">
                                        <div className="detail-item25">
                                            <span className="detail-label25">Type:</span>
                                            <span className="detail-value25">{selectedTrip.accommodationType}</span>
                                        </div>
                                        <div className="detail-item25">
                                            <span className="detail-label25">Meals Preferences:</span>
                                            <span className="detail-value25">{selectedTrip.mealsPreferences}</span>
                                        </div>
                                        <div className="detail-item25">
                                            <span className="detail-label25">Dietary Preferences:</span>
                                            <span className="detail-value25">{selectedTrip.dietaryPreferences}</span>
                                        </div>
                                        {selectedTrip.customDietaryPreference && (
                                            <div className="detail-item25">
                                                <span className="detail-label25">Other Dietary Preferences:</span>
                                                <span className="detail-value25">{selectedTrip.customDietaryPreference}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-section25">
                                    <h3>Transportation Preferences</h3>
                                    <div className="detail-item25">
                                        <span className="detail-label25">Type:</span>
                                        <span className="detail-value25">{selectedTrip.transportationType}</span>
                                    </div>
                                </div>

                                {selectedTrip.itinerary && selectedTrip.itinerary.length > 0 && (
                                    <div className="modal-section25">
                                        <h3>Day by Day Itinerary</h3>
                                        <div className="itinerary-grid25">
                                            {selectedTrip.itinerary.map((day, index) => (
                                                <div key={index} className="itinerary-day25">
                                                    <h4>Day {index + 1}</h4>
                                                    <div className="detail-item25">
                                                        <span className="detail-label25">Mode:</span>
                                                        <span className="detail-value25">{day.mode}</span>
                                                    </div>
                                                    <div className="detail-item25">
                                                        <span className="detail-label25">Highlights:</span>
                                                        <span className="detail-value25">{day.highlights}</span>
                                                    </div>
                                                    <div className="detail-item25">
                                                        <span className="detail-label25">Stay:</span>
                                                        <span className="detail-value25">{day.stay}</span>
                                                    </div>
                                                    <div className="detail-item25">
                                                        <span className="detail-label25">Meals:</span>
                                                        <span className="detail-value25">{day.meals}</span>
                                                    </div>
                                                    <div className="detail-item25">
                                                        <span className="detail-label25">Cost Breakdown:</span>
                                                        <ul className="cost-list25">
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

                                <div className="modal-section25">
                                    <h3>Trip Budget</h3>
                                    <div className="budget-info25">
                                        <div className="budget-item25">
                                            <span className="budget-label25">Total Budget:</span>
                                            <span className="budget-value25">{convertPrice(selectedTrip.totalBudget)}</span>
                                        </div>
                                        <div className="budget-item25">
                                            <span className="budget-label25">Transport Cost:</span>
                                            <span className="budget-value25">{convertPrice(selectedTrip.transportCost)}</span>
                                        </div>
                                        <div className="budget-item25">
                                            <span className="budget-label25">Accommodation Cost:</span>
                                            <span className="budget-value25">{convertPrice(selectedTrip.accommodationCost)}</span>
                                        </div>
                                        <div className="budget-item25">
                                            <span className="budget-label25">Meals Cost:</span>
                                            <span className="budget-value25">{convertPrice(selectedTrip.mealsCost)}</span>
                                        </div>
                                        <div className="budget-item25">
                                            <span className="budget-label25">Activities Cost:</span>
                                            <span className="budget-value25">{convertPrice(selectedTrip.activitiesCost)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add decline message section if status is declined */}
                                {selectedTrip.status === "declined" && selectedTrip.declineMessage && (
                                    <div className="modal-section25">
                                        <h3>Decline Reason</h3>
                                        <div className="detail-item25">
                                            <p className="decline-message25">{selectedTrip.declineMessage}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedTrip.status === "pending" && (
                                    <div className="modal-actions25">
                                        <button 
                                            className="modal-decline-btn25"
                                            onClick={() => handleDeclineClick(selectedTrip)}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? "Declining..." : "Decline"}
                                        </button>
                                        <button 
                                            className="modal-approve-btn25"
                                            onClick={() => updateTripStatus(selectedTrip.tripName, "approved")}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? "Approving..." : "Approve"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Decline Message Modal */}
                {showDeclineModal && (
                    <div className="modal-overlay25">
                        <div className="modal-content25">
                            <div className="modal-header25">
                                <h2 className="modal-title25">Decline Trip</h2>
                                <div className="modal-close-icon25" onClick={() => setShowDeclineModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="modal-body25">
                                <textarea
                                    className="decline-message-input25"
                                    placeholder="Please provide a reason for declining this trip (required)..."
                                    value={declineMessage}
                                    onChange={(e) => setDeclineMessage(e.target.value)}
                                    rows={4}
                                    required
                                />
                                <div className="modal-actions25">
                                    <button 
                                        className="cancel-button25"
                                        onClick={() => setShowDeclineModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="reject-button25"
                                        onClick={() => {
                                            if (!declineMessage.trim()) {
                                                toast.error("Please provide a reason for declining the trip.");
                                                return;
                                            }
                                            updateTripStatus(tripToDecline.tripName, "declined", declineMessage);
                                        }}
                                        disabled={!declineMessage.trim()}
                                    >
                                        Decline Trip
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
