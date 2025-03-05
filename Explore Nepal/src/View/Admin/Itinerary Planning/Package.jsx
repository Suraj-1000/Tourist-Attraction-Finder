import React, { useState, useEffect, useContext  } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Package.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

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
    fetchPackages();
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminPackage/all");
      setAllResults(response.data);
      setResults(response.data);
      setHeading(`Displaying ${response.data.length} packages:`);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      setResults([]);
      setHeading("No packages available.");
    }
  };


  const handleSearch = () => {
    if (!query && !category) {
      setResults(allResults);
      setHeading(`Showing ${allResults.length} packages`);
    } else {
      const filteredResults = allResults.filter((pkg) =>
        (pkg.title.toLowerCase().includes(query.toLowerCase()) || query === "") &&
        (pkg.category === category || category === "")
      );

      setResults(filteredResults);
      setHeading(
        filteredResults.length > 0
          ? `Search Results for "${query || "All"}" in ${category || "All Categories"}`
          : "No results found."
      );
    }
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
  

  const handleDelete = async (card) => {
    if (window.confirm(`Are you sure you want to delete "${card.title}"?`)) {
      try {
        await axios.delete(`http://localhost:4000/adminPackage/deleteByTitle?title=${encodeURIComponent(card.title)}`);
        const updatedResults = results.filter((result) => result.title !== card.title);
        setResults(updatedResults);
        setAllResults(updatedResults);
        alert(`🎉 Package "${card.title}" has been deleted.`);
      } catch (error) {
        console.error("Delete failed:", error);
        alert("❌ Failed to delete the package.");
      }
    }
  };
  
const copyToClipboard = () => {
  navigator.clipboard.writeText(shareLink);
  alert("Link copied to clipboard!");
};

const handleShare = (card) => {
  const generatedLink = `${window.location.origin}/ItineraryPackageView/${encodeURIComponent(card.title)}`;
  setShareLink(generatedLink);
  setShowShareModal(true);
};

  
  
  const toggleFavorite = (card) => {
    let updatedFavorites = [...favorites];

    if (favorites.some((fav) => fav.title === card.title)) {

      updatedFavorites = updatedFavorites.filter((fav) => fav.title !== card.title);
    } else {
    
      updatedFavorites.push(card);
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };


  const isFavorite = (card) => {
    return favorites.some((fav) => fav.title === card.title);
  };

  

  return (
    <>
      <Header />
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
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              <option value="Short">Short Trip</option>
              <option value="Long">Long Trip</option>
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
                        onClick={() => handleDelete(result)}
                      />
                    </div>
                  </div>

                  <div className="card-details17">
                    <div className="card-title-rating17">
                      <h3 className="title17">
                        {result.title || "Bandipur Cultural Escape (3 Days, 2 Nights)"} 
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
                      <p className="address17">{result.address || "Gandaki Zone, Nepal"}</p>
                      <p className="reviews17">
                        {result.reviews  || "Not Reviewed"} reviews and opinions
                      </p>
                    </div>

                    <p className="ranking-string17">Trip Type: {result.tripType || "Short"}</p>
                    <p className="ranking-string17">Duration: {result.duration || "3 Days, Cultural & Historical Exploration"}</p>
                    <p className="ranking-string17">Category: {result.category || "Cultural & Historical Exploration"}</p>
                    <p className="category-string17">Price: <span className="span17" style={{ color: 'green', fontWeight:"bold" }}>{result.price ? convertPrice(result.price) : "Price Not Available"}</span></p>
                    <p className="category-string17">Group Size: {result.groupSize || "Starting"}</p>
                    <p className="category-string17">Difficulty: {result.difficulty || "Easy"}</p>
                    <p className="category-string17">Highlight: {result.highlight || "Traditional villages, breathtaking views, cultural exploration."}</p>
                    <Link to={`/ItineraryPackageView/${encodeURIComponent(result.title)}`} className="view-details17">
                      View Details
                    </Link>


                    
                  <button className="book-now17">Book Now</button>
              
                  </div>
                </div>

              ))
            ) : (
              <p className="no-results17">No attractions found for "{query}".</p>
            )}
          </div>

         {/* Share Modal */}
         {showShareModal && (
          <div className="share-modal17">
            <div className="share-content17">
              <h3>Share Attraction</h3>
              <input type="text" value={shareLink} readOnly className="share-input17" />
              <button onClick={copyToClipboard} className="copy-button17">Copy Link 🔗</button>
              <button onClick={() => setShowShareModal(false)} className="close-button17">Close</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}