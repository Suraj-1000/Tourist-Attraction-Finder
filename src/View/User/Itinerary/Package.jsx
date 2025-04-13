import React, { useState, useEffect, useContext  } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Package.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

export default function PackagePage() {
  const { currency, exchangeRates } = useContext(CurrencyContext);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [results, setResults] = useState([]);
  const [heading, setHeading] = useState("Loading packages...");
  const [sortBy, setSortBy] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const saveToHistory = async (action, item) => {
    if (!user) return;

    try {
      await axios.post('http://localhost:4000/user-history', {
        action,
        itemType: 'package',
        itemId: item._id || Date.now().toString(),
        itemName: item
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      // Just log the error but don't show it to the user since it's not critical
      console.error('Error saving to history:', error);
    }
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

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/adminPackage/all");
      console.log("Fetched packages with categories:", response.data.map(pkg => ({ 
        title: pkg.title, 
        category: pkg.category,
        tripType: pkg.tripType 
      }))); // Debug log to see what categories are actually in the data
      setAllResults(response.data);
      setResults(response.data);
      setHeading(`Displaying ${response.data.length} packages:`);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      setResults([]);
      setHeading("No packages available.");
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

  const handleSearch = async () => {
    if (query.trim()) {
      try {
        // Save search to history
        if (user) {
          await axios.post('http://localhost:4000/user-history', {
            action: 'searched',
            itemType: 'package',
            itemId: Date.now().toString(),
            itemName: query
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

    let filteredResults = [...allResults];

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

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    
    let filteredResults = [...allResults];

    if (selectedCategory) {
      filteredResults = filteredResults.filter(pkg => {
        const matchesTripType = pkg.tripType && 
          pkg.tripType.toLowerCase() === selectedCategory.toLowerCase();
        return matchesTripType;
      });

      // Save category filter to history
      if (user) {
        axios.post('http://localhost:4000/user-history', {
          action: 'filtered category',
          itemType: 'package',
          itemId: Date.now().toString(),
          itemName: selectedCategory
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).catch(error => {
          console.error('Error saving category filter to history:', error);
        });
      }
    }

    setResults(filteredResults);
    setHeading(
      filteredResults.length > 0
        ? selectedCategory 
          ? `${filteredResults.length} ${selectedCategory} Packages` 
          : `All Packages (${filteredResults.length})`
        : `No packages found in ${selectedCategory || "any category"}`
    );
  };

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
  
  const handleBookNow = async (packageDetails) => {
    if (!user) {
      toast.error("Please log in to book a package", toastConfig);
      return;
    }

    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'booked',
        itemType: 'package',
        itemId: packageDetails._id || Date.now().toString(),
        itemName: packageDetails.title
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error saving booking to history:', error);
    }

    setSelectedPackage(packageDetails);
    setShowUserForm(true);
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
        const response = await axios.post('http://localhost:4000/api/khalti/initiate', paymentDetails);
        if (response.data.payment_url) {
          window.location.href = response.data.payment_url;
        }
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast.error('Failed to initialize payment. Please try again.', toastConfig);
      setShowUserForm(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!", toastConfig);
    saveToHistory("copied the link of", shareLink);
  };

const handleShare = async (card) => {
  const generatedLink = `${window.location.origin}/Itinerary-Package-View/${encodeURIComponent(card.title)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
  
  if (user) {
    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'shared',
        itemType: 'package',
        itemId: card._id || Date.now().toString(),
        itemName: card.title
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

  const toggleFavorite = async (card) => {
    if (!user) {
      toast.error("Please log in to add favorites", toastConfig);
      return;
    }

    try {
      const isAlreadyFavorite = favorites.some((fav) => fav.title === card.title);

      if (isAlreadyFavorite) {
        // Find the favorite document that contains this item
        const response = await axios.get('http://localhost:4000/user-favorites', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const favoriteDoc = response.data.data.find(
            (fav) => fav.itemDetails.title === card.title
          );

          if (favoriteDoc) {
            await axios.delete(`http://localhost:4000/user-favorites/${favoriteDoc._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            setFavorites(prev => prev.filter((fav) => fav.title !== card.title));
            toast.error(`Removed "${card.title}" from favorites`, toastConfig);
            // Don't await history saving to prevent blocking the UI
            saveToHistory("removed from favorites", card.title).catch(console.error);
          }
        }
      } else {
        const response = await axios.post('http://localhost:4000/user-favorites', {
          itemType: 'package',
          itemId: card._id || Date.now().toString(),
          itemName: card.title,
          itemDetails: card
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setFavorites(prev => [...prev, card]);
          toast.success(`Added "${card.title}" to favorites`, toastConfig);
          // Don't await history saving to prevent blocking the UI
          saveToHistory("added to favorites", card.title).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites. Please try again.', toastConfig);
    }
  };

  const isFavorite = (card) => {
    return favorites.some((fav) => fav.title === card.title);
  };
  
  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={3}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="main-container54">
        <div className="heading54">
          <h1 className="title-heading54">Explore Your Perfect Trip</h1>
          <p className="title-para54">Discover packages or plan trips with seamless booking.</p>
        </div>

        <div className="search-container54">
          <div className="search-box54">
            <input
              className="search-location54"
              type="text"
              placeholder="Enter Package Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="icon-search54"></span>
          </div>

          <div className="search-box54">
            <select
              className="search-category54"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              <option value="Short Trip">Short Trip</option>
              <option value="Long Trip">Long Trip</option>
            </select>
          </div>

          <div className="search-box54">
            <button className="search-button54" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

          <div className="search-results-container54">
            <div className="search-tabs54">
              <span style={{ textDecoration: "underline" }}>Available Package</span>
              <span>Trips</span>
              <span>Activities</span>
              <span>More</span>
              <div className="filter-container54">
                <span className="filter-icon54"></span>
                <select
                  className="filter-dropdown54"
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

            <h2 className="search-heading54">{heading}</h2>

            {loading ? (
              <div className="loading-spinner54">Loading packages...</div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <div className="result-card54" key={index}>
                  <div className="card-top54">
                    <img
                      src={result.imageUrl  || "/images/default.png"}
                      alt={result.title}
                      className="result-image54"
                    />
                    
                  </div>

                  <div className="card-details54">
                    <div className="card-title-rating54">
                      <h3 className="title54">
                        {result.title || "Bandipur Cultural Escape (3 Days, 2 Nights)"} 
                      </h3>
                      <div className="card-actions54">
                      <img
                          src={isFavorite(result) ? "/images/filled_heart.png" : "/images/heart.png"}
                          alt="Favorite"
                          className="action-icon54"
                          onClick={() => toggleFavorite(result)}
                          style={{ cursor: "pointer" }}
                        />
                        <img
                          src="/images/share.png"
                          alt="Share"
                          className="action-icon54"
                          onClick={() => handleShare(result)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    <div className="address-reviews54">
                      <p className="address54">{result.address || "Gandaki Zone, Nepal"}</p>
                      <p className="reviews54">
                        {result.reviews  || "Not Reviewed"} reviews and opinions
                      </p>
                    </div>

                    <p className="ranking-string54">Trip Type: {result.tripType || "Short"}</p>
                    <p className="ranking-string54">Duration: {result.duration || "3 Days, Cultural & Historical Exploration"}</p>
                    <p className="ranking-string54">Category: {result.category || "Cultural & Historical Exploration"}</p>
                    <p className="category-string54">
                        Price: 
                        <span className="budget-value54">
                            {result.price ? convertPrice(result.price) : "Price Not Available"}
                        </span>
                    </p>
                    <p className="category-string54">Group Size: {result.groupSize || "Starting"}</p>
                    <p className="category-string54">Difficulty: {result.difficulty || "Easy"}</p>
                    <p className="category-string54">Highlight: {result.highlight || "Traditional villages, breathtaking views, cultural exploration."}</p>
                    <Link
              to={`/Itinerary-Package-View/${encodeURIComponent(result.title)}`}
              onClick={async () => {
                if (user) {
                  try {
                    await axios.post('http://localhost:4000/user-history', {
                      action: 'viewed details',
                      itemType: 'package',
                      itemId: result._id || Date.now().toString(),
                      itemName: result.title
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
              className="view-details54">
              View Details
            </Link>

                    <button 
                      className="book-now54"
                      onClick={() => handleBookNow({
                        title: result.title,
                        duration: result.duration,
                        tripType: result.tripType,
                        price: result.price ? result.price.replace(/[^0-9.-]+/g, "") : "0",
                        category: result.category,
                        groupSize: result.groupSize,
                        difficulty: result.difficulty
                      })}
                    >
                      Book Now
                    </button>
              
                  </div>
                </div>

              ))
            ) : (
              <p className="no-results54">No attractions found for "{query}".</p>
            )}
          </div>

         {/* Share Modal */}
         {showShareModal && (
          <div className="share-modal54">
            <div className="share-content54">
              <h3>Share Attraction</h3>
              <input type="text" value={shareLink} readOnly className="share-input54" />
              <button onClick={copyToClipboard} className="copy-button54">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button54">Close</button>
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