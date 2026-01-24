import React, { useState, useEffect, useContext  } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Package.css";
import { CurrencyContext } from "../../../context/CurrencyContext";
import Header from "../../../components/Admin Header/Admin-Header";
import Footer from "../../../components/Footer/AuthFooter";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserDetailsForm from '../../../pages/Payment/UserDetailsForm';      

export default function PackagePage() {
  const { currency, exchangeRates,  } = useContext(CurrencyContext);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [allResults, setAllResults] = useState([]); // Store all packages initially
  const [results, setResults] = useState([]); // Stores displayed results
  const [heading, setHeading] = useState("Loading packages...");
  const [sortBy, setSortBy] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageRatings, setPackageRatings] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  const saveToHistory = (action, attraction) => {
    if (!user) return;

    const historyEntry = {
      user: `${user.firstName}`,
      action,
      attraction,
      timestamp: new Date().toLocaleString(),
    };

    const existingHistory = JSON.parse(localStorage.getItem("userHistory")) || [];
    existingHistory.unshift(historyEntry);
    localStorage.setItem("userHistory", JSON.stringify(existingHistory));
  };

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
    const initializePage = async () => {
      await fetchPackages();
      if (user) {
        await fetchFavorites();
      }
    };

    initializePage();
  }, [user?._id]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found");
        return;
      }

      const response = await axios.get('http://localhost:4000/user-favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const dbFavorites = response.data.data;
        setFavorites(dbFavorites.map(fav => fav.itemDetails));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to access favorites', {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message17'
        });
        // Optionally redirect to login page or handle expired token
      } else {
        console.error('Error fetching favorites:', error);
        toast.error('Failed to load favorites', {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message17'
        });
      }
    }
  };

  const fetchPackageRatings = async (packages) => {
    try {
      const promises = packages.map(async (pkg) => {
        const response = await axios.get(`http://localhost:4000/reviews/item/${pkg._id}?itemType=package`);
        if (response.data.success) {
          return {
            id: pkg._id,
            stats: response.data.stats
          };
        }
        return null;
      });

      const ratings = await Promise.all(promises);
      const ratingsMap = ratings.reduce((acc, rating) => {
        if (rating) {
          acc[rating.id] = rating.stats;
        }
        return acc;
      }, {});

      setPackageRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching package ratings:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminPackage/all");
      console.log("Fetched packages with categories:", response.data.map(pkg => ({ 
        title: pkg.title, 
        category: pkg.category,
        tripType: pkg.tripType 
      }))); // Debug log to see what categories are actually in the data
      setAllResults(response.data);
      setResults(response.data);
      setHeading(`Displaying ${response.data.length} packages:`);
      
      // Fetch ratings for all packages
      await fetchPackageRatings(response.data);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      setResults([]);
      setHeading("No packages available.");
    }
  };

  // Handle text search
  const handleSearch = () => {
    if (query.trim()) {
      saveToHistory("searched", query);
    }

    let filteredResults = [...allResults];

    // Only filter by search query
    if (query) {
      filteredResults = filteredResults.filter(pkg =>
        pkg.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    setResults(filteredResults);
    setHeading(
      filteredResults.length > 0
        ? `${filteredResults.length} Results for "${query}"`
        : "No results found."
    );
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    console.log("Selected category:", selectedCategory); // Debug log
    setCategory(selectedCategory);
    
    let filteredResults = [...allResults];
    console.log("All results before filtering:", filteredResults.map(pkg => ({ 
      title: pkg.title, 
      tripType: pkg.tripType 
    }))); // Debug log

    // Filter by tripType
    if (selectedCategory) {
      filteredResults = filteredResults.filter(pkg => {
        // Check only tripType field and handle case-insensitive comparison
        const matchesTripType = pkg.tripType && 
          pkg.tripType.toLowerCase() === selectedCategory.toLowerCase();
        
        console.log(`Package "${pkg.title}":`, {
          tripType: pkg.tripType,
          selectedCategory,
          isMatch: matchesTripType
        });
        
        return matchesTripType;
      });
    }

    console.log("Filtered results:", filteredResults.map(pkg => ({ 
      title: pkg.title, 
      tripType: pkg.tripType 
    }))); // Debug log

    setResults(filteredResults);
    setHeading(
      filteredResults.length > 0
        ? selectedCategory 
          ? `${filteredResults.length} ${selectedCategory} Packages` 
          : `All Packages (${filteredResults.length})`
        : `No packages found in ${selectedCategory || "any category"}`
    );
  };

  // Reset filters
  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setResults(allResults);
    setHeading(`Showing all ${allResults.length} packages`);
  };

  
  const sortResults = (data) => {
    let sortedData = [...data];
  
    switch (sortBy) {
      case "name_az":
        sortedData.sort((a, b) => {
          const nameA = a.title?.toLowerCase() || '';
          const nameB = b.title?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
        break;
        
      case "name_za":
        sortedData.sort((a, b) => {
          const nameA = a.title?.toLowerCase() || '';
          const nameB = b.title?.toLowerCase() || '';
          return nameB.localeCompare(nameA);
        });
        break;
  
      case "price":
        sortedData.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.-]+/g, "")) || 0;
          const priceB = parseFloat(b.price?.replace(/[^0-9.-]+/g, "")) || 0;
          return priceA - priceB;
        });
        break;
  
      case "price_desc":
        sortedData.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.-]+/g, "")) || 0;
          const priceB = parseFloat(b.price?.replace(/[^0-9.-]+/g, "")) || 0;
          return priceB - priceA;
        });
        break;
  
      case "popularity":
        sortedData.sort((a, b) => {
          const reviewsA = parseInt(a.reviews) || 0;
          const reviewsB = parseInt(b.reviews) || 0;
          return reviewsB - reviewsA;
        });
        break;
  
      default:
        break;
    }
  
    return sortedData;
  };
  
  

  useEffect(() => {
    const sortedData = sortResults(results);
    setResults(sortedData); 
  }, [sortBy]); 
  
  const handleBookNow = () => {
    toast.info("Booking functionality is disabled in admin view", {
      position: "top-right",
      autoClose: 3000,
      className: 'toast-message17'
    });
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      const paymentDetails = {
        ...formData,
        packageDetails: selectedPackage,
        userId: user._id,
        amount: selectedPackage.price.replace(/[^0-9.-]+/g, ""),
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

  const initiateDelete = (card) => {
    setPackageToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:4000/adminPackage/deleteByTitle?title=${encodeURIComponent(packageToDelete.title)}`);
      const updatedResults = results.filter((result) => result.title !== packageToDelete.title);
      setResults(updatedResults);
      setAllResults(updatedResults);
      toast.success(`Package "${packageToDelete.title}" has been deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message17'
      });
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete the package. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message17'
      });
    } finally {
      setShowDeleteModal(false);
      setPackageToDelete(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
    saveToHistory("copied the link of", shareLink);
  };

const handleShare = (card) => {
  const generatedLink = `${window.location.origin}/ItineraryPackageView/${encodeURIComponent(card.title)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
  saveToHistory("click share", card.title);
};

  
  
   const toggleFavorite = (card) => {
    let updatedFavorites = [...favorites];
    const isAlreadyFavorite = favorites.some((fav) => fav.title === card.title);

    if (isAlreadyFavorite) {
      updatedFavorites = updatedFavorites.filter((fav) => fav.title !== card.title);
      toast.error(`Removed "${card.title}" from favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message17'
      });
      saveToHistory("removed from favorites", card.title);
    } else {
      updatedFavorites.push(card);
      toast.success(`Added "${card.title}" to favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message17'
      });
      saveToHistory("added to favorites", card.title);
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (card) => {
    return favorites.some((fav) => fav.title === card.title);
  };
  
  

  // Add this helper function for address formatting
  const formatAddress = (address) => {
    if (!address) return "Nepal";
    const parts = address.split(',').map(part => part.trim());
    // Keep the first part (location name) and "Nepal"
    return `${parts[0]}, Nepal`;
  };

  // Update the renderStarRating function
  const renderStarRating = (packageId) => {
    const rating = packageRatings[packageId]?.averageRating || 0;
    const reviewCount = packageRatings[packageId]?.totalReviews || 0;
    
    return (
      <div className="star-rating" style={{ display: 'inline-flex', marginLeft: '15px', alignItems: 'center' }}>
        {[...Array(5)].map((_, index) => (
          <span key={index} style={{ 
            color: index < Math.round(rating) ? '#ffd700' : '#ccc', 
            fontSize: '24px',
            lineHeight: '1',
            marginRight: '2px'
          }}>★</span>
        ))}
        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    );
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-container17">
        <div className="heading17">
          <h1 className="title-heading17">Explore Your Perfect Trip</h1>
          <p className="title-para17">Discover packages or plan trips with seamless booking.</p>
          <Link to="/AddItineraryPackage"><button className="add-btn17">Add Package<img src="/images/add.png" alt="arrow" className="arrow-down17" /></button></Link>
        </div>

        <div className="search-container17">
          <div className="search-box17">
            <input
              className="search-location17"
              type="text"
              placeholder="Enter Package Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="icon-search17"></span>
          </div>

          <div className="search-box17">
            <select
              className="search-category17"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              <option value="Short Trip">Short Trip</option>
              <option value="Long Trip">Long Trip</option>
            </select>
          </div>

          <div className="search-box17">
            <button className="search-button17" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

          <div className="search-results-container17">
            <div className="search-tabs17">
              <span style={{ textDecoration: "underline" }}>Available Package</span>
              <span>Trips</span>
              <span>Activities</span>
              <span>More</span>
              <div className="filter-container17">
                <span className="filter-icon17"></span>
                <select
                  className="filter-dropdown17"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Sort By</option>
                  <option value="name_az">Name (A-Z)</option>
                  <option value="name_za">Name (Z-A)</option>
                  <option value="popularity">Popularity</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                </select>

              </div>
            </div>

            <h2 className="search-heading17">{heading}</h2>

            {results.length > 0 ? (
              results.map((result, index) => (
                <div className="result-card17" key={index}>
                  <div className="card-top17">
                    <img
                      src={result.imageUrl  || "/images/default.png"}
                      alt={result.title}
                      className="result-image17"
                    />
                    <div className="edit-delete-icons17">
                    <Link to={`/EditItineraryPackage/${encodeURIComponent(result.title)}`}>
                      <img src="/images/edit.png" alt="Edit" className="icon-image17" />
                    </Link>
                      <img
                        src="/images/dlete.png"
                        alt="Delete"
                        className="icon-image17"
                        onClick={() => initiateDelete(result)}
                      />
                    </div>
                  </div>

                  <div className="card-details17">
                    <div className="card-title-rating17">
                      <h3 className="title17" style={{ display: 'flex', alignItems: 'center' }}>
                        {result.title}
                        {renderStarRating(result._id)}
                      </h3>
                      <div className="card-actions17">
                        <img
                          src={isFavorite(result) ? "/images/filled_heart.png" : "/images/heart.png"}
                          alt="Favorite"
                          className="action-icon17"
                          onClick={() => toggleFavorite(result)}
                          style={{ cursor: "pointer" }}
                        />
                        <img
                          src="/images/share.png"
                          alt="Share"
                          className="action-icon17"
                          onClick={() => handleShare(result)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    <div className="address-reviews17">
                      <p className="address17">{formatAddress(result.address)}</p>
                    </div>

                    <p className="ranking-string17">Trip Type: {result.tripType || "Short"}</p>
                    <p className="ranking-string17">Duration: {result.duration || "3 Days, Cultural & Historical Exploration"}</p>
                    <p className="ranking-string17">Category: {result.category || "Cultural & Historical Exploration"}</p>
                    <p className="category-string17">
                        Price: 
                        <span className="budget-value17">
                            {result.price ? convertPrice(result.price) : "Price Not Available"}
                        </span>
                    </p>
                    <p className="category-string17">Group Size: {result.groupSize || "Starting"}</p>
                    <p className="category-string17">Difficulty: {result.difficulty || "Easy"}</p>
                    <p className="category-string17 highlight-text17">Highlight: {result.highlight || "Traditional villages, breathtaking views, cultural exploration."}</p>
                    <Link
              to={`/ItineraryPackageView/${encodeURIComponent(result.title)}`}
              onClick={() => saveToHistory("viewed details of", result.title)}
              className="view-details17">
              View Details
            </Link>

                    <button 
                      className="book-now17"
                      onClick={handleBookNow}
                    >
                      Book Now
                    </button>
              
                  </div>
                </div>

              ))
            ) : (
              <p className="no-results17">No packages found for "{query}".</p>
            )}
          </div>

         {/* Share Modal */}
         {showShareModal && (
          <div className="share-modal17">
            <div className="share-content17">
              <h3>Share Package</h3>
              <p>Share this link with your friends:</p>
              <input type="text" value={shareLink} readOnly className="share-input17" />
              <button onClick={copyToClipboard} className="copy-button17">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button17">Close</button>
            </div>
          </div>
        )}

        {/* Add Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay17">
            <div className="delete-modal17">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete "{packageToDelete?.title}"?</p>
              <div className="delete-modal-buttons17">
                <button 
                  className="delete-cancel-btn17" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-btn17" 
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {/* User Details Form Modal */}
        {showUserForm && selectedPackage && (
          <UserDetailsForm
            packageDetails={selectedPackage}
            onSubmit={handlePaymentSubmit}
            onCancel={() => {
              setShowUserForm(false);
              setSelectedPackage(null);
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
}
