import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./AdminBookingAD.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminBookingADPage() {
    const { currency, exchangeRates,  } = useContext(CurrencyContext);
    const [trips, setTrips] = useState([]);
    const [error, setError] = useState(null);

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



    // ✅ Fetch all trips (approved, pending, declined)
    useEffect(() => {
        axios.get("http://localhost:4000/adminBookingApprove/trips")
            .then((response) => {
                // ✅ Sort trips: Pending first, then Approved/Declined
                const sortedTrips = response.data.sort((a, b) => {
                    if (a.status === "pending" && b.status !== "pending") return -1;
                    if (a.status !== "pending" && b.status === "pending") return 1;
                    return 0;
                });
                setTrips(sortedTrips);
            })
            .catch((error) => {
                console.error("❌ Error fetching trips:", error);
                setError("Failed to fetch trips. Please try again later.");
            });
    }, []);
    

    // ✅ Update trip status
    const updateTripStatus = async (tripName, status) => {
        if (window.confirm(`Are you sure you want to update the trip "${tripName}" to "${status}"?`)) {
            try {
                const encodedTripName = encodeURIComponent(tripName);
    
                console.log(`🔍 Sending PUT request to update "${tripName}" to "${status}"`);
    
                // Only send the status
                await axios.put(
                    `http://localhost:4000/adminBookingApprove/trips/${encodedTripName}`,
                    { status },  // Only include status in the body
                    { headers: { "Content-Type": "application/json" } }
                );
    
                // Update state in React
                setTrips((prevTrips) =>
                    prevTrips.map((trip) =>
                        trip.tripName === tripName ? { ...trip, status } : trip
                    )
                );
    
                alert(`🎉 Trip "${tripName}" has been updated to "${status}".`);
            } catch (error) {
                console.error("❌ Update failed:", error.response?.data || error);
                alert("❌ Failed to update the trip. Please try again.");
            }
        }
    };
    
    
    
      
    
    

    return (
        <>
            <Header />
            <div className="main-container25">
                <div className="heading-container25">
                    <h1 className="title-heading25">Admin Trip Management Page</h1>
                    <p className="title-para25">Effortlessly Manage and Customize Travel Packages for Every Traveler.</p>

                    {error && <p className="error-message">{error}</p>} {/* ✅ Show error if API fails */}

                    <table className="trip-table25">
                        <thead>
                            <tr className="table-header25">
                                <th>ID</th>
                                <th>Trip Name</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Destination</th>
                                <th>Total Budget</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.length > 0 ? (
                                trips.map((trip, index) => (
                                    <tr key={trip._id} className="table-row25">
                                        <td>{index + 1}</td>
                                        <td>{trip.tripName}</td>
                                        <td>{trip.startDate}</td>
                                        <td>{trip.endDate}</td>
                                        <td>{trip.destinations}</td>
                                        <td><span className="span25" >{trip.totalBudget ? convertPrice(trip.totalBudget) : "Price Not Available"}</span></td>
                                        <td className={`status-${trip.status.toLowerCase()}`}>{trip.status}</td>
                                        <td>
                                            <div className="button-container25">
                                                {trip.status === "pending" && (
                                                    <>
                                                        <button className="reject-button25" 
                                                            onClick={() => updateTripStatus(trip.tripName, "declined")}>
                                                            ❌ Decline
                                                        </button>
                                                        <button className="approve-button25" 
                                                            onClick={() => updateTripStatus(trip.tripName, "approved")}>
                                                            ✅ Approve
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data-message">
                                        No trips found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Footer />
        </>
    );
}
