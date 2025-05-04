import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ViewTrip.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import UserDetailsForm from '../../../View/Payment/UserDetailsForm';

const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light"
};

export default function ViewTripPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [heading, setHeading] = useState("Available Trips");
  const { currency = 'USD', exchangeRates = { USD: 1 } } = useContext(CurrencyContext) || {};
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const convertPrice = (priceString) => {
  if (!priceString) {
      return "N/A"; 
  }

  try {
    // Ensure priceString is actually a string
    const priceStr = String(priceString);
    
    const priceInUSD = parseFloat(priceStr.replace(/[^0-9.]+/g, "")); 

    if (isNaN(priceInUSD)) {
      return "N/A";
    }

    if (!exchangeRates || !exchangeRates[currency]) {
        return `USD ${formatNumberWithCommas(priceInUSD)}`; // Fallback to USD
    }

    const conversionRate = exchangeRates[currency]; 
    const convertedPrice = (priceInUSD * conversionRate).toFixed(2);
    
    return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
  } catch (error) {
    console.error("Error converting price:", error, "Price value:", priceString);
    return "N/A";
  }
};

    const initializePage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        setError("Please log in to view your trips");
        return;
      }

      // First fetch user profile
      const profileResponse = await axios.get(
        "http://localhost:4000/adminUpdateProfile/getProfile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (profileResponse.data) {
        const userData = profileResponse.data;
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        
        // Now fetch trips with the user ID
        await fetchTrips(userData._id);
        await fetchFavorites();
      }
    } catch (error) {
      console.error("Error initializing page:", error);
      setLoading(false);
      setError("Failed to load user profile");
      }
    };

  useEffect(() => {
    initializePage();

    // Add event listener for storage changes
    const handleStorageChange = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        setUser(userData);
        fetchTrips(userData._id);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Add effect to refresh trips list when trips state changes
  useEffect(() => {
    if (trips.length >= 0) {
      setHeading(`Displaying ${trips.length} trips`);
    }
  }, [trips]);

  const fetchTrips = async (userId) => {
    try {
      if (!userId) {
        console.error("No user ID provided to fetchTrips");
        setTrips([]);
        setHeading("Please log in to view your trips");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setTrips([]);
        setHeading("Please log in to view your trips");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:4000/adminTrip/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setTrips(response.data);
        setHeading(`Displaying ${response.data.length} trips`);
      } else {
        setTrips([]);
        setHeading("No trips available");
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      setTrips([]);
      setError("Failed to load trips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:4000/user-favorites', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        const dbFavorites = response.data.data;
        setFavorites(dbFavorites.map(fav => fav.itemDetails));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites', toastConfig);
    }
  };

  const saveToHistory = async (action, item) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        console.log("User not logged in");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No authentication token found");
        return;
      }

      const historyData = {
        userId: user._id,
        action: action,
        itemId: item._id,
        itemName: item.tripName,
        itemType: "trip",
        timestamp: new Date()
      };

      await axios.post(
        "http://localhost:4000/user-history",
        historyData,
        {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error) {
      console.error("Error saving to history:", error);
      // Don't show error toast to user since this is a background operation
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        // Save search to history
        if (user) {
          await axios.post('http://localhost:4000/user-history', {
            action: 'searched',
            itemType: 'trip',
            itemId: Date.now().toString(),
            itemName: searchQuery
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        }
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }

    let filteredResults = [...trips];

    if (searchQuery) {
      filteredResults = filteredResults.filter(pkg =>
        pkg.tripName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setTrips(filteredResults);
    setHeading(
      filteredResults.length > 0
        ? `Search Results for "${searchQuery}"`
        : "No results found."
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
    const sortedData = sortResults(trips);
    setTrips([...sortedData]);  // Update results with sorted data
  }, [sortBy]);  // Dependency only on sortBy


  const handleDelete = async (card) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        toast.error("Please log in to delete a trip");
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const response = await axios.delete(
        `http://localhost:4000/adminTrip/deleteByTripName`,
        {
          params: {
            tripName: card.tripName,
            userId: user._id
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        // Update trips state
        const updatedTrips = trips.filter(trip => trip.tripName !== card.tripName);
        setTrips(updatedTrips);
        
        // Update heading to reflect new count
        setHeading(`Displaying ${updatedTrips.length} trips`);
        
        toast.success("Trip deleted successfully");
        
        // Save to history
        await saveToHistory('delete', card);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete trip");
    }
  };
  
  // Function to copy link to clipboard
const copyToClipboard = async () => {
  navigator.clipboard.writeText(shareLink);
  toast.success("Link copied to clipboard!", toastConfig);
  
  if (user) {
    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'copied link of',
        itemType: 'trip',
        itemId: Date.now().toString(),
        itemName: shareLink
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error saving copy to history:', error);
    }
  }
};

// Function to generate and display shareable link (Admin View)
const handleShare = async (trip) => {
  const generatedLink = `${window.location.origin}/View-Trip-Details/${encodeURIComponent(trip.tripName)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
  
  if (user) {
    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'shared',
        itemType: 'trip',
        itemId: trip._id || Date.now().toString(),
        itemName: trip.tripName
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error saving share to history:', error);
    }
  }
};


  const toggleFavorite = async (trip) => {
    if (!user) {
      toast.error("Please log in to add favorites", toastConfig);
      return;
    }

    try {
      const isAlreadyFavorite = favorites.some((fav) => fav.tripName === trip.tripName);

      if (isAlreadyFavorite) {
        // Find the favorite document that contains this item
        const response = await axios.get('http://localhost:4000/user-favorites', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const favoriteDoc = response.data.data.find(
            (fav) => fav.itemDetails.tripName === trip.tripName
          );

          if (favoriteDoc) {
            await axios.delete(`http://localhost:4000/user-favorites/${favoriteDoc._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            setFavorites(prev => prev.filter((fav) => fav.tripName !== trip.tripName));
            toast.error(`Removed "${trip.tripName}" from favorites`, toastConfig);
            await saveToHistory("removed from favorites", trip.tripName);
          }
        }
      } else {
        const response = await axios.post('http://localhost:4000/user-favorites', {
          itemType: 'trip',
          itemId: trip._id || Date.now().toString(),
          itemName: trip.tripName,
          itemDetails: trip
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setFavorites(prev => [...prev, trip]);
          toast.success(`Added "${trip.tripName}" to favorites`, toastConfig);
          await saveToHistory("added to favorites", trip.tripName);
        }
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites. Please try again.', toastConfig);
    }
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
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        toast.error("Please log in to delete a trip");
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }

      const response = await axios.delete(
        `http://localhost:4000/adminTrip/deleteByTripName`,
        {
          params: {
            tripName: tripToDelete.tripName,
            userId: user._id
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        // Update trips state
        const updatedTrips = trips.filter(trip => trip.tripName !== tripToDelete.tripName);
        setTrips(updatedTrips);
        
        // Update heading to reflect new count
        setHeading(`Displaying ${updatedTrips.length} trips`);
        
        // Close the modal and show success message
        setShowDeleteModal(false);
        toast.success("Trip deleted successfully");
        
        // Save to history
        await saveToHistory('delete', tripToDelete);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete trip");
    }
  };

  // Add this function to handle delete modal close
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTripToDelete(null);
  };

  const handleBookNow = async (trip) => {
    if (!user) {
      toast.error("Please log in to book a trip", toastConfig);
      return;
    }

    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'booked',
        itemType: 'trip',
        itemId: trip._id || Date.now().toString(),
        itemName: trip.tripName
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error saving booking to history:', error);
    }

    // Ensure trip has its _id
    const tripWithId = {
      ...trip,
      _id: trip._id // Make sure _id is included
    };
    
    setSelectedTrip(tripWithId);
    setShowUserForm(true);
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      const paymentDetails = {
        ...formData,
        packageDetails: {
          _id: selectedTrip._id,
          title: selectedTrip.tripName,
          duration: selectedTrip.duration,
          tripType: selectedTrip.tripType,
          price: selectedTrip.totalBudget ? selectedTrip.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
          category: selectedTrip.tripType || 'Short Trip', // Use tripType as category
          groupSize: "Custom",
          difficulty: "Custom",
          startDate: selectedTrip.startDate || null,
          endDate: selectedTrip.endDate || null,
          address: selectedTrip.userAddress || null,
          destinations: selectedTrip.destinations || null
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

  const handleCategoryChange = (e) => {
    setActiveCategory(e.target.value);
    setSearchQuery("");
    const newCategory = e.target.value;
    let filteredResults = [...trips];
    
    if (newCategory) {
      filteredResults = filteredResults.filter(pkg => 
        pkg.tripType && pkg.tripType.toLowerCase() === newCategory.toLowerCase()
      );

      // Save category filter to history
      if (user) {
        axios.post('http://localhost:4000/user-history', {
          action: 'filtered category',
          itemType: 'trip',
          itemId: Date.now().toString(),
          itemName: newCategory
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).catch(error => {
          console.error('Error saving category filter to history:', error);
        });
      }
    }
    
    setTrips(filteredResults);
    setHeading(
      filteredResults.length > 0
        ? newCategory 
          ? `${filteredResults.length} ${newCategory}${filteredResults.length === 1 ? '' : 's'}` 
          : `All Trips (${filteredResults.length})`
        : `No trips found in ${newCategory || "any category"}`
    );
  };

  // Add this helper function after the other helper functions
  const formatDestination = (destination) => {
    if (!destination) return "N/A";
    
    // Split by comma and take only the city and country
    const parts = destination.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      // Take the first part (city) and the last part (country)
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    }
    return destination;
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="icon-search22"></span>
          </div>

          <div className="search-box22">
            <select
              className="search-category22"
              value={activeCategory}
              onChange={handleCategoryChange}
            >
              <option value="all">All Categories</option>
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
            {loading ? (
              <div className="loading-spinner22">Loading trips...</div>
            ) : (
              <>
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
                      <option value="newest">Newest</option>
                      <option value="name_az">Name (A-Z)</option>
                      <option value="name_za">Name (Z-A)</option>
                      <option value="price">Price (Low to High)</option>
                      <option value="price_desc">Price (High to Low)</option>
                    </select>
                  </div>
                </div>

                <h2 className="search-heading22">{heading}</h2>

                {trips.length > 0 ? (
                  trips.map((result, index) => (
                    <div className="result-card22" key={index}>
                      <div className="card-top22">
                        <div className="edit-delete-icons22">
                        <Link to={`/Plan-Trip-Edit/${result._id}`}>
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
                <p className="ranking-string22"><strong>Destinations:</strong> {formatDestination(result.destinations) || "N/A"}</p>
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





                <Link 
                  to={`/View-Trip-Details/${encodeURIComponent(result.tripName)}`}
                  onClick={async () => {
                    if (user) {
                      try {
                        await axios.post('http://localhost:4000/user-history', {
                          action: 'viewed details',
                          itemType: 'trip',
                          itemId: result._id || Date.now().toString(),
                          itemName: result.tripName
                        }, {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                          }
                        });
                      } catch (error) {
                        console.error('Error saving view to history:', error);
                      }
                    }
                  }}
                  className="view-details22"
                >
                  View Details
                </Link>



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
                  <p className="no-results22">No trips found for "{searchQuery}".</p>
                )}
              </>
            )}
          </div>

          {/* User Details Form Modal */}
          {showUserForm && selectedTrip && (
            <UserDetailsForm
              packageDetails={{
                _id: selectedTrip._id,
                title: selectedTrip.tripName,
                duration: selectedTrip.duration,
                tripType: selectedTrip.tripType,
                price: selectedTrip.totalBudget ? selectedTrip.totalBudget.replace(/[^0-9.-]+/g, "") : "0",
                category: selectedTrip.tripType || 'Short Trip',
                groupSize: "Custom",
                difficulty: "Custom",
                startDate: selectedTrip.startDate || null,
                endDate: selectedTrip.endDate || null,
                destinations: selectedTrip.destinations || null
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
          <div className="delete-modal">
            <div className="delete-modal-content">
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to delete "{tripToDelete?.tripName}"?</p>
              <div className="delete-modal-buttons">
                <button className="cancel-button" onClick={handleCloseDeleteModal}>
                  Cancel
                </button>
                <button className="delete-button" onClick={confirmDelete}>
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
