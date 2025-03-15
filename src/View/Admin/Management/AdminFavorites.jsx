import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./AdminFavorites.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";

export default function AdminFavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  const toggleFavorite = (card) => {
    let updatedFavorites = favorites.filter(
      (fav) => fav.title !== card.title && fav.name !== card.name
    );

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    
    // Add toast notification
    toast.success(`${card.title || card.name} removed from favorites!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: 'toast-message29',
    });
  };

  // Helper to render stars
  const renderStars = (rating) => {
    return "⭐".repeat(Math.round(rating));
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div className="main-container29">
        <div className="heading29">
          <h1 className="title-heading29">Manage Your Favorites</h1>
          <p className="title-para29">Keep track of your favorite attractions and experiences.</p>
        </div>

        <div className="search-results-container29">
          <div className="search-tabs29">
              <span style={{ textDecoration: "underline" }}>All Favorites</span>
              <span>Trips</span>
              <span>Packages</span>
              <span>Attractions</span>
          </div>

          <h2 className="search-heading29">
            {favorites.length > 0 ? `Your Favorite Items:` : "No favorites added yet."}
          </h2>

          {favorites.length > 0 ? (
            favorites.map((result, index) => {
              const isAttraction = result.name && !result.title; 
              return (
                <div className={isAttraction ? "result-card13" : "result-card29"} key={index}>
                  <div className={isAttraction ? "card-top13" : "card-top29"}>
                    <img
                      src={result.imageUrl || result.image || "/images/default.png"}
                      alt={result.title || result.name || "No Title"}
                      className={isAttraction ? "result-image13" : "result-image29"}
                    />
                  </div>

                  <div className={isAttraction ? "card-details13" : "card-details29"}>
                    <div className={isAttraction ? "card-title-rating13" : "card-title-rating29"}>
                      <h3>
                        {result.title || result.name || "No Title"}{" "}
                        {isAttraction && <span className="rating13">{renderStars(result.rating)}</span>}
                      </h3>
                      <div className={isAttraction ? "card-actions13" : "card-actions29"}>
                        <img
                          src="/images/filled_heart.png"
                          alt="Favorite"
                          className={isAttraction ? "action-icon13" : "action-icon29"}
                          onClick={() => toggleFavorite(result)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>

                    {isAttraction ? (
                      // **Attraction Data**
                      <>
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
                          Category: {result.category || "No Category"}
                        </p>
                        <p className="description13">{result.description || "No Description"}</p>
                        <Link to={`/AdminAttractionView/${encodeURIComponent(result.name)}`}>
                          <button className="view-details13">View Details</button>
                        </Link>
                      </>
                    ) : (
                      // **Package Data**
                      <>
                        <div className="address-reviews29">
                          <p className="address29">{result.address || "Gandaki Zone, Nepal"}</p>
                          <p className="reviews29">
                            {result.reviews  || "Not Reviewed"} reviews and opinions
                          </p>
                        </div>
                        <p className="ranking-string29">{result.tripType || "N/A"}</p>
                        <p className="ranking-string29">Trip Type: {result.tripType || "N/A"}</p>
                        <p className="ranking-string29">Duration: {result.duration || "N/A"}</p>
                        <p className="category-string29">Price: {result.price || "N/A"}</p>
                        <p className="category-string29">Group Size: {result.groupSize || "N/A"}</p>
                        <p className="category-string29">Difficulty: {result.difficulty || "N/A"}</p>
                        <p className="category-string29">Highlight: {result.highlight || "N/A"}</p>

                        <Link to={`/ItineraryPackageView/${encodeURIComponent(result.title)}`} className="view-details29">
                          View Details
                        </Link>
                        <button className="book-now29">Book Now</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-results29">You have no favorite items.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
