import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./AttractionPage.css";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export default function AttractionPage() {
  const [query, setQuery] = useState(sessionStorage.getItem("searchQuery") || "");
  const [category, setCategory] = useState(sessionStorage.getItem("searchCategory") || "");
  const [results, setResults] = useState(JSON.parse(sessionStorage.getItem("searchResults")) || []);
  const [breadcrumb, setBreadcrumb] = useState(sessionStorage.getItem("breadcrumb") || "");
  const [heading, setHeading] = useState(sessionStorage.getItem("heading") || "");
  
  const [isSearching, setIsSearching] = useState(results.length > 0);
  const [sortBy, setSortBy] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Add this to track navigation
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  // Add this function to clear all search-related data
  const clearSearchData = () => {
    // Clear session storage
    sessionStorage.removeItem("searchQuery");
    sessionStorage.removeItem("searchCategory");
    sessionStorage.removeItem("searchResults");
    sessionStorage.removeItem("breadcrumb");
    sessionStorage.removeItem("heading");
    
    // Clear state
    setQuery("");
    setCategory("");
    setResults([]);
    setBreadcrumb("");
    setHeading("");
    setIsSearching(false);
  };

  // Handle navigation changes
  useEffect(() => {
    const allowedPaths = [
      "/Search-Attraction",
      "/Attraction-View"
    ];

    // Create cleanup function
    return () => {
      const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));
      if (!isAllowedPath) {
        clearSearchData();
      }
    };
  }, [location.pathname]);

  // Handle clicks on navigation links
  useEffect(() => {
    const handleClick = (event) => {
      const clickedElement = event.target;
      
      // Check if the clicked element is a link or inside a link
      const link = clickedElement.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        const allowedPaths = [
          "/Search-Attraction",
          "/Attraction-View"
        ];

        const isAllowedPath = allowedPaths.some(path => href?.startsWith(path));
        if (!isAllowedPath && href) {
          clearSearchData();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Handle page refresh and close
  useEffect(() => {
    const handleBeforeUnload = () => {
      const allowedPaths = [
        "/Search-Attraction",
        "/Attraction-View"
      ];
      
      const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));
      if (!isAllowedPath) {
        clearSearchData();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [location.pathname]);

  // Only restore data when on search page
  useEffect(() => {
    if (location.pathname === "/Search-Attraction") {
      const storedResults = JSON.parse(sessionStorage.getItem("searchResults"));
      if (storedResults) {
        setResults(storedResults);
        setQuery(sessionStorage.getItem("searchQuery") || "");
        setCategory(sessionStorage.getItem("searchCategory") || "");
        setBreadcrumb(sessionStorage.getItem("breadcrumb") || "");
        setHeading(sessionStorage.getItem("heading") || "");
        setIsSearching(true);
      }
    }
  }, [location.pathname]);

  // Update fetchFavorites to remove localStorage
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

  // Update toggleFavorite to remove localStorage
  const toggleFavorite = async (card) => {
    if (!user) {
      toast.error("Please log in to add favorites", toastConfig);
      return;
    }

    try {
      const isAlreadyFavorite = favorites.some((fav) => fav.name === card.name);

      if (isAlreadyFavorite) {
        // Find the favorite document that contains this item
        const response = await axios.get('http://localhost:4000/user-favorites', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const favoriteDoc = response.data.data.find(
            (fav) => fav.itemDetails.name === card.name
          );

          if (favoriteDoc) {
            await axios.delete(`http://localhost:4000/user-favorites/${favoriteDoc._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            setFavorites(prev => prev.filter((fav) => fav.name !== card.name));
            toast.error(`Removed "${card.name}" from favorites`, toastConfig);
            // Don't await history saving to prevent blocking the UI
            saveToHistory("removed from favorites", card.name).catch(console.error);
          }
        }
      } else {
        const response = await axios.post('http://localhost:4000/user-favorites', {
          itemType: 'attraction',
          itemId: card._id || Date.now().toString(),
          itemName: card.name,
          itemDetails: card
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setFavorites(prev => [...prev, card]);
          toast.success(`Added "${card.name}" to favorites`, toastConfig);
          // Don't await history saving to prevent blocking the UI
          saveToHistory("added to favorites", card.name).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites. Please try again.', toastConfig);
    }
  };

  // Update useEffect to prevent infinite fetching
  useEffect(() => {
    const initializePage = async () => {
      const storedQuery = sessionStorage.getItem("searchQuery");
      const storedCategory = sessionStorage.getItem("searchCategory");
      const storedResults = JSON.parse(sessionStorage.getItem("searchResults"));
      
      if (storedQuery) setQuery(storedQuery);
      if (storedCategory) setCategory(storedCategory);
      if (storedResults) {
        setResults(storedResults);
        setIsSearching(true);
      }

      if (user) {
        await fetchFavorites();
      }
    };

    initializePage();
  }, [user?._id]); // Only re-run if user ID changes

  // Update saveToHistory function to use API
  const saveToHistory = async (action, item) => {
    if (!user) return;

    try {
      await axios.post('http://localhost:4000/user-history', {
        action,
        itemType: 'attraction',
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

  // Update handleSearch function
  const handleSearch = async () => {
    try {
      setIsSearching(false);

      if (query && user) {
        // Save search to history
        await axios.post('http://localhost:4000/user-history', {
          action: 'searched',
          itemType: 'attraction',
          itemId: Date.now().toString(),
          itemName: query
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      const response = await axios.get("http://localhost:4000/adminSearch", {
        params: { 
          ...(query && { query }),
          ...(category && { category })
        },
      });
      
      const data = response.data;

      if (data.length === 0) {
        setHeading(
          category
            ? `No results found in category "${category}"${query ? ` matching "${query}"` : ''}`
            : query
            ? `No results found matching "${query}"`
            : "No results found"
        );
      } else {
        setHeading(
          `Search Results${query ? ` for "${query}"` : ""}${category ? ` in ${category}` : ""}`
        );
      }

      setResults(data);
      setIsSearching(true);
      setBreadcrumb(`Home${query ? ` > ${query}` : ""}${category ? ` > ${category}` : ""}`);

      // Store search state in session storage
      sessionStorage.setItem("searchQuery", query);
      sessionStorage.setItem("searchCategory", category);
      sessionStorage.setItem("searchResults", JSON.stringify(data));
      sessionStorage.setItem("breadcrumb", `Home${query ? ` > ${query}` : ""}${category ? ` > ${category}` : ""}`);
      sessionStorage.setItem("heading", heading);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setHeading(
        category
          ? `Error searching in category "${category}"${query ? ` for "${query}"` : ''}`
          : query
          ? `Error searching for "${query}"`
          : "Search error"
      );
      setIsSearching(true);
    }
  };

  // Update handleCategoryChange function
  const handleCategoryChange = async (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    
    try {
      setIsSearching(false);

      if (selectedCategory && user) {
        // Save category filter to history
        await axios.post('http://localhost:4000/user-history', {
          action: 'filtered category',
          itemType: 'attraction',
          itemId: Date.now().toString(),
          itemName: selectedCategory
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      const response = await axios.get("http://localhost:4000/adminSearch", {
        params: { 
          ...(query && { query }),
          ...(selectedCategory && { category: selectedCategory })
        },
      });
      
      const data = response.data;
      
      if (data.length === 0) {
        setHeading(
          selectedCategory
            ? `No results found in category "${selectedCategory}"${query ? ` matching "${query}"` : ''}`
            : query
            ? `No results found matching "${query}"`
            : "No results found"
        );
      } else {
        setHeading(
          `Search Results${query ? ` for "${query}"` : ""}${selectedCategory ? ` in ${selectedCategory}` : ""}`
        );
      }
      
      setResults(data);
      setIsSearching(true);
      setBreadcrumb(`Home${query ? ` > ${query}` : ""}${selectedCategory ? ` > ${selectedCategory}` : ""}`);
      
      // Store search state in session storage
      sessionStorage.setItem("searchQuery", query);
      sessionStorage.setItem("searchCategory", selectedCategory);
      sessionStorage.setItem("searchResults", JSON.stringify(data));
      sessionStorage.setItem("breadcrumb", `Home${query ? ` > ${query}` : ""}${selectedCategory ? ` > ${selectedCategory}` : ""}`);
      sessionStorage.setItem("heading", heading);
    } catch (error) {
      console.error("Category search failed:", error);
      setResults([]);
      setHeading(
        selectedCategory
          ? `Error searching in category "${selectedCategory}"${query ? ` for "${query}"` : ''}`
          : query
          ? `Error searching for "${query}"`
          : "Search error"
      );
      setIsSearching(true);
    }
  };

  // Helper function to sort results based on the selected criteria
  const sortResults = (data) => {
    let sortedData = [...data]; // Make a shallow copy to avoid modifying the original array

    switch (sortBy) {
      case "name_az":
        sortedData = sortedData.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case "name_za":
        sortedData = sortedData.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameB.localeCompare(nameA);
        });
        break;
      case "rating":
        sortedData = sortedData.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
        break;
      case "popularity":
        sortedData = sortedData.sort((a, b) => {
          const reviewsA = a.numberOfReviews || 0;
          const reviewsB = b.numberOfReviews || 0;
          return reviewsB - reviewsA;
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

  // Helper to render stars
 const renderStars = (rating) => {
  const validRating = Math.max(0, Math.min(5, Math.round(rating))); // Ensure it's between 0-5
  return "⭐".repeat(validRating);
};


  // Function to copy link to clipboard
const copyToClipboard = async () => {
  navigator.clipboard.writeText(shareLink);
  toast.success("Link copied to clipboard!", toastConfig);
  
  if (user) {
    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'copied link of',
        itemType: 'attraction',
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

// Function to generate and display shareable link (User View)
const handleShare = async (card) => {
  const generatedLink = `${window.location.origin}/Attraction-View/${encodeURIComponent(card.name)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
  
  if (user) {
    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'shared',
        itemType: 'attraction',
        itemId: card._id || Date.now().toString(),
        itemName: card.name
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

  
  

  // Function to check if an attraction is favorited
  const isFavorite = (card) => {
    return favorites.some((fav) => fav.name === card.name);
  };

  

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />


      <div className="main-container52">
        <div className="heading52">
          <h1 className="title-heading52">Discover Your Next Adventure!</h1>
          <p className="title-para52">Find your perfect destination effortlessly</p>
        </div>
        <div className="search-container52">
          <div className="search-box52">
            <input
              className="search-location52"
              type="text"
              placeholder="Enter location or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="icon-search6"></span>
          </div>

          <div className="search-box52">
            <select
              className="search-category52"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              <option value="Adventure">Adventure</option>
              <option value="Culture">Culture</option>
              <option value="Nature">Nature</option>
              <option value="Attraction">Attraction</option>
            </select>
          </div>

          <div className="search-box52">
            <button className="search-button52" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        {isSearching && (
          <div className="search-results-container52">
            <div className="search-tabs52">
              <span>All Results</span>
              <span>Trips</span>
              <span>Activities</span>
              <span>Package</span>
              <div className="filter-container52">
                <span className="filter-icon52"></span>
                <select
                  className="filter-dropdown52"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)} 
                >
                  <option value="">Sort By</option>
                  <option value="name_az">Name (A-Z)</option>
                  <option value="name_za">Name (Z-A)</option>
                  <option value="rating">Rating</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>

            <div className="breadcrumb52">{breadcrumb}</div>
            <h2 className="search-heading52">{heading}</h2>

            {results.length > 0 ? (
              results.map((result, index) => (
                <div className="result-card52" key={index}>
                  <div className="card-top52">
                    <img
                      src={result.image || "/images/default.png"}
                      alt={result.name}
                      className="result-image52"
                    />
                    
                  </div>

                  <div className="card-details52">
                    <div className="card-title-rating52">
                      <h3>
                        {result.name || "Name not available"} <span className="rating52">{renderStars(result.rating)}</span>
                      </h3>
                      <div className="card-actions52">
                      <img
                          src={isFavorite(result) ? "/images/filled_heart.png" : "/images/heart.png"}
                          alt="Favorite"
                          className="action-icon52"
                          onClick={() => toggleFavorite(result)}
                          style={{ cursor: "pointer" }}
                        />
                        <img
                          src="/images/share.png"
                          alt="Share"
                          className="action-icon52"
                          onClick={() => handleShare(result)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    <div className="address-reviews52">
                      <p className="address52">{result.address || "Address not available"}</p>
                      <p className="reviews52">
                        {result.numberOfReviews || "No Reviews"} reviews and opinions
                      </p>
                    </div>

                    <p className="ranking-string52">
                      Ranking: {result.rankingString || "Not Ranked"}
                    </p>
                    <p className="category-string52">
                      Category: {result.category || "Not Category"}
                    </p>

                    <p className="description52">{result.description || "No Description"}</p>
                    <Link 
                      to={`/Attraction-View/${encodeURIComponent(result.name)}`}
                      onClick={async () => {
                        if (user) {
                          try {
                            await axios.post('http://localhost:4000/user-history', {
                              action: 'viewed details',
                              itemType: 'attraction',
                              itemId: result._id || Date.now().toString(),
                              itemName: result.name
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
                    >
                      <button className="view-details52">View Details</button>
                    </Link>


                  </div>
                </div>
              ))
            ) : (
              <p className="no-results52">No attractions found for "{query}".</p>
            )}
          </div>
        )}

         {/* Share Modal */}
         {showShareModal && (
          <div className="share-modal52">
            <div className="share-content52">
              <h3>Share Attraction</h3>
              <input type="text" value={shareLink} readOnly className="share-input52" />
              <button onClick={copyToClipboard} className="copy-button52">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button52">Close</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}