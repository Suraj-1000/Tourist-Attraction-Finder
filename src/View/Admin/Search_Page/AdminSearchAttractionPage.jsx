import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./AdminSearchAttractionPage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminSearchAttractionPage() {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attractionToDelete, setAttractionToDelete] = useState(null);

  // Add this to track navigation
  const location = useLocation();

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
      "/AdminSearchAttraction",
      "/AdminEditAttractionDetails",
      "/AdminAttractionView"
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
          "/AdminSearchAttraction",
          "/AdminEditAttractionDetails",
          "/AdminAttractionView"
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
        "/AdminSearchAttraction",
        "/AdminEditAttractionDetails",
        "/AdminAttractionView"
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
    if (location.pathname === "/AdminSearchAttraction") {
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

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  const handleSearch = async () => {
    try {
      setIsSearching(false);
  
      // Retrieve existing searches from localStorage or initialize an empty array
      const existingSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  
      // Add the current query to the list if it's not empty and not a duplicate
      if (query && !existingSearches.includes(query)) {
        existingSearches.push(query);
        localStorage.setItem("recentSearches", JSON.stringify(existingSearches));
      }
  
      console.log('Searching with query:', query, 'category:', category); // Debug log
      
      const response = await axios.get("http://localhost:4000/adminSearch", {
        params: { 
          ...(query && { query }),
          ...(category && { category })
        },
      });
      
      console.log('Search response:', response.data); // Debug log
      
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

  // Handle category change
  const handleCategoryChange = async (e) => {
    const selectedCategory = e.target.value;
    console.log('Selected category:', selectedCategory); // Debug log
    setCategory(selectedCategory);
    
    try {
      setIsSearching(false);
      
      // Make API call with the new category
      const response = await axios.get("http://localhost:4000/adminSearch", {
        params: { 
          ...(query && { query }),
          ...(selectedCategory && { category: selectedCategory })
        },
      });
      
      console.log('Search response:', response.data); // Debug log
      
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
      sessionStorage.setItem("breadcrumb", `Home >${query ? ` > ${query}` : ""}${selectedCategory ? ` > ${selectedCategory}` : ""}`);
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


  const handleDelete = (card) => {
    setAttractionToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const encodedName = encodeURIComponent(attractionToDelete.name);
      
      // Show loading state in modal
      const modalContent = document.querySelector('.modal-delete-btn13');
      if (modalContent) {
        modalContent.textContent = 'Deleting...';
        modalContent.disabled = true;
      }

      const response = await axios.delete(`http://localhost:4000/adminSearch/deleteByName?name=${encodedName}`);

      setResults((prevResults) =>
        prevResults.filter((result) => result.name !== attractionToDelete.name)
      );

      toast.success(`Attraction "${attractionToDelete.name}" deleted successfully`, {
        className: 'toast-message13',
      });
    } catch (error) {
      console.error("Failed to delete the attraction:", error);
      toast.error('Failed to delete the attraction. Please try again.', {
        className: 'toast-message13',
      });
    } finally {
      setShowDeleteModal(false);
      setAttractionToDelete(null);
    }
  };

  // Function to copy link to clipboard
const copyToClipboard = () => {
  navigator.clipboard.writeText(shareLink);
  toast.success("Link copied to clipboard!");
};

// Function to generate and display shareable link (Admin View)
const handleShare = (card) => {
  const generatedLink = `${window.location.origin}/AdminAttractionView/${encodeURIComponent(card.name)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
};

  
  

  const toggleFavorite = (card) => {
    let updatedFavorites = [...favorites];

    if (favorites.some((fav) => fav.name === card.name)) {
      // Remove from favorites
      updatedFavorites = updatedFavorites.filter((fav) => fav.name !== card.name);
      toast.error(`${card.name} removed from favorites`, {
        className: 'toast-message13',
      });
    } else {
      // Add to favorites
      updatedFavorites.push(card);
      toast.success(`${card.name} added to favorites`, {
        className: 'toast-message13',
      });
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay13">
          <div className="modal-content13">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete "{attractionToDelete?.name}"?</p>
            <div className="modal-buttons13">
              <button 
                className="modal-cancel-btn13" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-delete-btn13" 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-container13">
        <div className="heading13">
          <h1 className="title-heading13">Discover Your Next Adventure!</h1>
          <p className="title-para13">Find your perfect destination effortlessly</p>
        </div>
        <div className="search-container13">
          <div className="search-box13">
            <input
              className="search-location13"
              type="text"
              placeholder="Enter location or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="icon-search6"></span>
          </div>

          <div className="search-box13">
            <select
              className="search-category13"
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

          <div className="search-box13">
            <button className="search-button13" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        {isSearching && (
          <div className="search-results-container13">
            <div className="search-tabs13">
              <span>All Results</span>
              <span>Trips</span>
              <span>Activities</span>
              <span>Package</span>
              <div className="filter-container13">
                <span className="filter-icon13"></span>
                <select
                  className="filter-dropdown13"
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

            <div className="breadcrumb13">{breadcrumb}</div>
            <h2 className="search-heading13">{heading}</h2>

            {results.length > 0 ? (
              results.map((result, index) => (
                <div className="result-card13" key={index}>
                  <div className="card-top13">
                    <img
                      src={result.image || "/images/default.png"}
                      alt={result.name}
                      className="result-image13"
                    />
                    <div className="edit-delete-icons13">
                    <Link to={`/AdminEditAttractionDetails/${encodeURIComponent(result.name)}`}>
                      <img src="/images/edit.png" alt="Edit" className="icon-image13" />
                    </Link>
                      <img
                        src="/images/dlete.png"
                        alt="Delete"
                        className="icon-image13"
                        onClick={() => handleDelete(result)}
                      />
                    </div>
                  </div>

                  <div className="card-details13">
                    <div className="card-title-rating13">
                      <h3>
                        {result.name || "Name not available"} <span className="rating13">{renderStars(result.rating)}</span>
                      </h3>
                      <div className="card-actions13">
                      <img
                          src={isFavorite(result) ? "/images/filled_heart.png" : "/images/heart.png"}
                          alt="Favorite"
                          className="action-icon13"
                          onClick={() => toggleFavorite(result)}
                          style={{ cursor: "pointer" }}
                        />
                        <img
                          src="/images/share.png"
                          alt="Share"
                          className="action-icon13"
                          onClick={() => handleShare(result)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    <div className="address-reviews13">
                      <p className="address13">{result.address || "Address not available"}</p>
                      <p className="reviews13">
                        {result.numberOfReviews || "No Reviews"} reviews and opinions
                      </p>
                    </div>

                    <p className="ranking-string13">
                      Ranking: {result.rankingString || "Not Ranked"}
                    </p>
                    <p className="category-string13">
                      Category: {result.category || "Not Category"}
                    </p>

                    <p className="description13">{result.description || "No Description"}</p>
                    <Link to={`/AdminAttractionView/${encodeURIComponent(result.name)}`}>
                  <button className="view-details13">View Details</button>
                </Link>


                  </div>
                </div>
              ))
            ) : (
              <p className="no-results13">No attractions found for "{query}".</p>
            )}
          </div>
        )}

         {/* Share Modal */}
         {showShareModal && (
          <div className="share-modal13">
            <div className="share-content13">
              <h3>Share Attraction</h3>
              <input type="text" value={shareLink} readOnly className="share-input13" />
              <button onClick={copyToClipboard} className="copy-button13">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button13">Close</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}