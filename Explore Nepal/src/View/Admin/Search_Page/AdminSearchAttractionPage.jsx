import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./AdminSearchAttractionPage.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminSearchAttractionPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(results.length > 0);
  const [breadcrumb, setBreadcrumb] = useState("");
  const [heading, setHeading] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);


  const handleSearch = async () => {
    try {
      setIsSearching(false);
  
      // Retrieve existing searches from localStorage or initialize an empty array
      const existingSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  
      // Add the current query to the list if it’s not empty and not a duplicate
      if (query && !existingSearches.includes(query)) {
        existingSearches.push(query);
        localStorage.setItem("recentSearches", JSON.stringify(existingSearches)); // Update localStorage
      }
  
      const response = await axios.get("http://localhost:4000/adminSearch", {
        params: { query, category },
      });
  
      const data = response.data;
  
      if (data.length === 0) {
        setHeading(`No results found for category "${category}"`);
      } else {
        setHeading(
          `Search Results for "${query || "All"}" in ${category || "All Categories"}`
        );
      }
  
      setResults(data);
      setIsSearching(true);
      setBreadcrumb(`Home > ${query || "All Categories"}`);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setHeading(`No results found for category "${category}"`);
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
    return "⭐".repeat(Math.round(rating));
  };

  const handleDelete = async (card) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the attraction "${card.name}"?`
    );
  
    if (confirmDelete) {
      try {
        console.log(`Sending DELETE request for: ${card.name}`);
  
        const encodedName = encodeURIComponent(card.name); // Encode special characters
        const response = await axios.delete(`http://localhost:4000/adminSearch/deleteByName?name=${encodedName}`);
  
        console.log("Delete Response:", response.data);
  
        // Update the UI by removing the deleted attraction
        setResults((prevResults) =>
          prevResults.filter((result) => result.name !== card.name)
        );
  
        // Enhanced alert message
        alert(
          `🎉 Success! The attraction "${card.name}" has been successfully deleted.\n\nCategory: ${card.category || "Not specified"}\nReviews: ${
            card.numberOfReviews || "No reviews"
          }\n\nRefresh the page to see updated results.`
        );
      } catch (error) {
        console.error("Failed to delete the attraction:", error);
        alert(
          "❌ An error occurred while trying to delete the attraction. Please try again."
        );
      }
    }
  };
  
  // Function to copy link to clipboard
const copyToClipboard = () => {
  navigator.clipboard.writeText(shareLink);
  alert("Link copied to clipboard!");
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
      // Remove from favorites if already present
      updatedFavorites = updatedFavorites.filter((fav) => fav.name !== card.name);
    } else {
      // Add to favorites if not present
      updatedFavorites.push(card);
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
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              <option value="adventure">Adventure</option>
              <option value="culture">Culture</option>
              <option value="nature">Nature</option>
              <option value="attraction">Attraction</option>
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
                  onChange={(e) => setSortBy(e.target.value)} // Update sortBy on dropdown change
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
          <div className="share-modal">
            <div className="share-content">
              <h3>Share Attraction</h3>
              <input type="text" value={shareLink} readOnly className="share-input" />
              <button onClick={copyToClipboard} className="copy-button">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button">Close</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}