import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ViewTrip.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import UserDetailsForm from '../../../View/Payment/UserDetailsForm';

export default function ViewTripPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [allResults, setAllResults] = useState([]); 
  const [results, setResults] = useState([]); 
  const [heading, setHeading] = useState("Loading trips...");
  const [sortBy, setSortBy] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const { currency = 'USD', exchangeRates = { USD: 1 } } = useContext(CurrencyContext) || {};
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const convertPrice = (priceString) => {
  if (!priceString || isNaN(priceString)) {
      return "N/A"; 
  }

  try {
    const priceInUSD = parseFloat(priceString.replace(/[^0-9.]+/g, "")); 

    if (!exchangeRates || !exchangeRates[currency]) {
        return `USD ${formatNumberWithCommas(priceInUSD)}`; // Fallback to USD
    }

    const conversionRate = exchangeRates[currency]; 
    const convertedPrice = (priceInUSD * conversionRate).toFixed(2);
    
    return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
  } catch (error) {
    console.error("Error converting price:", error);
    return "N/A";
  }
};

  useEffect(() => {
    fetchTrips();
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminTrip/all");
      setAllResults(response.data);
      setResults(response.data);
      setHeading(`Displaying ${response.data.length} trips:`);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      setResults([]);
      setHeading("No trips available.");
    }
  };


  const handleSearch = () => {
    console.log("Searching with:", { query, category }); 
    
    let filteredResults = [...allResults];

    if (query) {
      filteredResults = filteredResults.filter(pkg =>
        pkg.tripName.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (category) {
      filteredResults = filteredResults.filter(pkg => {
        const matchesTripType = pkg.tripType && 
          pkg.tripType.toLowerCase() === category.toLowerCase();
        return matchesTripType;
      });
    }

    setResults(filteredResults);
    setHeading(
      filteredResults.length > 0
        ? category 
          ? `${filteredResults.length} ${category}${filteredResults.length === 1 ? '' : 's'}` 
          : query 
            ? `Search Results for "${query}"`
            : `All Trips (${filteredResults.length})`
        : "No trips found."
    );
  };
  

  
  // Helper function to sort results based on the selected criteria
  const sortResults = (data) => {
    let sortedData = [...data]; 

    switch (sortBy) {
      case "name_az":
        sortedData = sortedData.sort((a, b) => {
          const nameA = a.tripName?.toLowerCase() || '';
          const nameB = b.tripName?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case "name_za":
        sortedData = sortedData.sort((a, b) => {
          const nameA = a.tripName?.toLowerCase() || '';
          const nameB = b.tripName?.toLowerCase() || '';
          return nameB.localeCompare(nameA);
        });
        break;
        case "price":
          sortedData.sort((a, b) => {
            const priceA = parseFloat(a.totalBudget?.replace(/[^0-9.-]+/g, "")) || 0;
            const priceB = parseFloat(b.totalBudget?.replace(/[^0-9.-]+/g, "")) || 0;
            return priceA - priceB;
          });
          break;
    
        case "price_desc":
          sortedData.sort((a, b) => {
            const priceA = parseFloat(a.totalBudget?.replace(/[^0-9.-]+/g, "")) || 0;
            const priceB = parseFloat(b.totalBudget?.replace(/[^0-9.-]+/g, "")) || 0;
            return priceB - priceA;
          });
          break;
      default:
        break;
    }

    return sortedData; // Return the sorted data
  };

  // Automatically sort the results when sortBy changes
  useEffect(() => {
    const sortedData = sortResults(results);
    setResults([...sortedData]);  // Update results with sorted data
  }, [sortBy]);  // Dependency only on sortBy


  const handleDelete = async (card) => {
    if (window.confirm(`Are you sure you want to delete "${card.tripName}"?`)) {
      try {
        await axios.delete(`http://localhost:4000/adminTrip/deleteByTripName?tripName=${encodeURIComponent(card.tripName)}`);
        const updatedResults = results.filter((result) => result.tripName !== card.tripName);
        setResults(updatedResults);
        setAllResults(updatedResults);
        alert(`🎉 Trip "${card.tripName}" has been deleted.`);
      } catch (error) {
        console.error("Delete failed:", error);
        alert("❌ Failed to delete the trip.");
      }
    }
  };
  
  // Function to copy link to clipboard
const copyToClipboard = () => {
  navigator.clipboard.writeText(shareLink);
  toast.success("Link copied to clipboard!");
};

// Function to generate and display shareable link (Admin View)
const handleShare = (card) => {
  const generatedLink = `${window.location.origin}/ViewTripDetails/${encodeURIComponent(card.tripName)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
};


  const toggleFavorite = (card) => {
    let updatedFavorites = [...favorites];
    const isAlreadyFavorite = favorites.some((fav) => fav.tripName === card.tripName);

    if (isAlreadyFavorite) {
      updatedFavorites = updatedFavorites.filter((fav) => fav.tripName !== card.tripName);
      toast.error(`Removed "${card.tripName}" from favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message22'
      });
    } else {
      updatedFavorites.push(card);
      toast.success(`Added "${card.tripName}" to favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message22'
      });
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  // Function to check if an attraction is favorited
  const isFavorite = (card) => {
    return favorites.some((fav) => fav.tripName === card.tripName);
  };

  // Update delete handling
  const initiateDelete = (card) => {
    setTripToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:4000/adminTrip/deleteByTripName?tripName=${encodeURIComponent(tripToDelete.tripName)}`);
      const updatedResults = results.filter((result) => result.tripName !== tripToDelete.tripName);
      setResults(updatedResults);
      setAllResults(updatedResults);
      toast.success(`Trip "${tripToDelete.tripName}" has been deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message22'
      });
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete the trip. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message22'
      });
    } finally {
      setShowDeleteModal(false);
      setTripToDelete(null);
    }
  };

  const handleBookNow = (trip) => {
    if (!user) {
      toast.error("Please log in to book a trip", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message22'
      });
      return;
    }
    setSelectedTrip(trip);
    setShowUserForm(true);
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      const paymentDetails = {
        ...formData,
        packageDetails: {
          title: selectedTrip.tripName,
          duration: selectedTrip.duration,
          tripType: selectedTrip.tripType,
          price: selectedTrip.totalBudget ? selectedTrip.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
          category: selectedTrip.tripType,
          groupSize: "Custom",
          difficulty: "Custom"
        },
        userId: user._id,
        amount: selectedTrip.totalBudget ? selectedTrip.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
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

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-container22">
        <div className="heading22">
          <h1 className="title-heading22">Explore Your Planned Itineraries</h1>
          <p className="title-para22">Secure Your Spot on the Adventure of a Lifetime.</p>
        </div>

        <div className="search-container22">
          <div className="search-box22">
            <input
              className="search-location22"
              type="text"
              placeholder="Enter trip Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="icon-search22"></span>
          </div>

          <div className="search-box22">
            <select
              className="search-category22"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setQuery("");
                const newCategory = e.target.value;
                let filteredResults = [...allResults];
                
                if (newCategory) {
                  filteredResults = filteredResults.filter(pkg => 
                    pkg.tripType && pkg.tripType.toLowerCase() === newCategory.toLowerCase()
                  );
                }
                
                setResults(filteredResults);
                setHeading(
                  filteredResults.length > 0
                    ? newCategory 
                      ? `${filteredResults.length} ${newCategory}${filteredResults.length === 1 ? '' : 's'}` 
                      : `All Trips (${filteredResults.length})`
                    : `No trips found in ${newCategory || "any category"}`
                );
              }}
            >
              <option value="">All Categories</option>
              <option value="Short Trip">Short Trip</option>
              <option value="Long Trip">Long Trip</option>
            </select>
          </div>

          <div className="search-box22">
            <button className="search-button22" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

          <div className="search-results-container22">
            <div className="search-tabs22">
              <span style={{ textDecoration: "underline" }}>Available Trips</span>
              <span>Package</span>
              <span>Activities</span>
              <span>More</span>
              <div className="filter-container22">
                <span className="filter-icon22"></span>
                <select
                  className="filter-dropdown22"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)} 
                >
                  <option value="">Sort By</option>
                  <option value="name_az">Name (A-Z)</option>
                  <option value="name_za">Name (Z-A)</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                </select>
              </div>
            </div>

            <h2 className="search-heading22">{heading}</h2>

            {results.length > 0 ? (
              results.map((result, index) => (
                <div className="result-card22" key={index}>
                  <div className="card-top22">
                    <div className="edit-delete-icons22">
                    <Link to={`/PlanTripEdit/${encodeURIComponent(result.tripName)}`}>
                      <img src="/images/edit.png" alt="Edit" className="icon-image22" />
                    </Link>
                      <img
                        src="/images/dlete.png"
                        alt="Delete"
                        className="icon-image22"
                        onClick={() => initiateDelete(result)}
                      />
                    </div>
                  </div>

          <div className="card-details22">
            <div className="card-title22">
              <h3>Trip Name: {result.tripName || "N/A"} </h3>
                <div className="card-actions22">
                  <img
                    src={isFavorite(result) ? "/images/filled_heart.png" : "/images/heart.png"}
                    alt="Favorite"
                    className="action-icon22"
                    onClick={() => toggleFavorite(result)}
                    style={{ cursor: "pointer" }}
                  />
                  <img
                    src="/images/share.png"
                    alt="Share"
                    className="action-icon22"
                    onClick={() => handleShare(result)}
                    style={{ cursor: "pointer" }}
                  />
                </div>
            </div>

            <p className="ranking-string22"><strong>Trip Duration:</strong> {result.duration  || "N/A"}</p>
            <p className="ranking-string22"><strong>Trip Type:</strong> {result.tripType || "N/A"}</p>
            <p className="ranking-string22"><strong>Destinations:</strong> {result.destinations || "N/A"}</p>
            <p className="ranking-string22">
              <strong>Activity Highlights: </strong>
              {[
                result.adventureActivities?.[0],
                result.culturalExperiences?.[0],
                result.relaxation?.[0],
                result.foodCulinary?.[0],
                result.nightlifeEntertainment?.[0]
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </p>

            <p className="ranking-string22"><strong>Accommodation Preferences:</strong> {result.accommodationType || "N/A"}</p>
            <p className="ranking-string22">
                <strong>Total Budget:</strong> 
                <span className="budget-value22">
                    {result.totalBudget ? convertPrice(result.totalBudget) : "Price Not Available"}
                </span>
            </p>

            <p className="ranking-string22">
            <strong>Status:</strong>
            {result.status?.toLowerCase() === "pending" ? (
              <span> ⏳ Pending</span>
            ) : result.status?.toLowerCase() === "approved" ? (
              <span> ✅ Approved</span>
            ) : result.status?.toLowerCase() === "declined" ? (
              <span> ❌ Declined</span>
            ) : (
              <span> ❌ Unknown</span>
            )}
          </p>





            <Link to={`/ViewTripDetails/${encodeURIComponent(result.tripName)}`} className="view-details22">View Details</Link>



            <div className="card-buttons22">
            {result.status?.toLowerCase() === "approved" ? (
              <button className="book-now22" onClick={() => handleBookNow(result)}>Book Now</button>
            ) : result.status?.toLowerCase() === "pending" ? (
              <p className="important-message22">⏳ Your booking request is under approval. Please check back later.</p>
            ) : result.status?.toLowerCase() === "declined" ? (
              <p className="important-message22">❌ Your booking request has been declined.</p>
             ) : (
              <p className="important-message22">❌ Booking not available.</p>
            )}
          </div>

          </div>

                </div>

              ))
            ) : (
              <p className="no-results22">No trips found for "{query}".</p>
            )}
          </div>

          {/* User Details Form Modal */}
          {showUserForm && selectedTrip && (
            <UserDetailsForm
              packageDetails={{
                title: selectedTrip.tripName,
                duration: selectedTrip.duration,
                tripType: selectedTrip.tripType,
                price: selectedTrip.totalBudget ? selectedTrip.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
                category: selectedTrip.tripType,
                groupSize: "Custom",
                difficulty: "Custom"
              }}
              onSubmit={handlePaymentSubmit}
              onCancel={() => {
                setShowUserForm(false);
                setSelectedTrip(null);
              }}
            />
          )}

         {/* Share Modal */}
         {showShareModal && (
          <div className="share-modal22">
            <div className="share-content22">
              <h3>Share Attraction</h3>
              <input type="text" value={shareLink} readOnly className="share-input22" />
              <button onClick={copyToClipboard} className="copy-button22">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button22">Close</button>
            </div>
          </div>
        )}

        {/* Add Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay22">
            <div className="delete-modal22">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete "{tripToDelete?.tripName}"?</p>
              <div className="delete-modal-buttons22">
                
                <button 
                  className="delete-cancel-btn22" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-btn22" 
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
