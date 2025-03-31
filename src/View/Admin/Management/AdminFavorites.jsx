import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaStar, FaHashtag } from 'react-icons/fa';
import "./AdminFavorites.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { CurrencyContext } from "../../../config/CurrencyContext";

export default function AdminFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const { currency, exchangeRates } = useContext(CurrencyContext);

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  const toggleFavorite = (item) => {
    let updatedFavorites = favorites.filter(
      (fav) => fav._id !== item._id
    );

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    
    toast.success(`${item.name || item.title} removed from favorites!`, {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return '#28a745';
      case 'ongoing':
        return '#007bff';
      case 'past':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getEventStatus = (startDate, endDate, endTime) => {
    // Return early if any required parameter is missing
    if (!startDate || !endDate || !endTime) {
      return 'unknown';
    }

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const endWithTime = new Date(endDate);
    
    try {
      endWithTime.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));
    } catch (error) {
      console.warn('Invalid endTime format:', endTime);
      return 'unknown';
    }

    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now <= endWithTime) {
      return 'ongoing';
    } else {
      return 'past';
    }
  };

  const isEventBookable = (event) => {
    const now = new Date();
    const end = new Date(event.endDate);
    const endWithTime = new Date(event.endDate);
    endWithTime.setHours(parseInt(event.endTime.split(':')[0]), parseInt(event.endTime.split(':')[1]));
    
    // Check if the event is free (no price, 0 price, or null price)
    const isFreeEvent = !event.ticketPrice || 
                       (!event.ticketPrice.vip && !event.ticketPrice.general) ||
                       ((!event.ticketPrice.vip || parseFloat(event.ticketPrice.vip) === 0) && 
                        (!event.ticketPrice.general || parseFloat(event.ticketPrice.general) === 0));
    
    if (isFreeEvent) {
      return now <= endWithTime;
    }
    
    const hasAvailableTickets = event.capacity.vip > 0 || event.capacity.general > 0;
    return now <= endWithTime && hasAvailableTickets;
  };

  const convertPrice = (priceString) => {
    if (!priceString || isNaN(priceString) || parseFloat(priceString) === 0) {
      return "N/A";
    }

    const priceInNPR = parseFloat(priceString.replace(/[^0-9.]+/g, ""));

    if (!exchangeRates || !exchangeRates[currency]) {
      return "Loading...";
    }

    const conversionRate = exchangeRates[currency];
    const convertedPrice = (priceInNPR * conversionRate).toFixed(2);
    
    return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
  };

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderCard = (item) => {
    // Check if the item is an event
    if (item.startDate && item.endDate && item.endTime) {
      return (
        <div className="result-card296" key={item._id}>
          <div className="card-top296">
            <img
              src={item.image || "/images/default-event.png"}
              alt={item.name}
              className="result-image296"
            />
            <span 
              className="event-status296" 
              style={{ 
                backgroundColor: getStatusColor(getEventStatus(item.startDate, item.endDate, item.endTime))
              }}
            >
              {getEventStatus(item.startDate, item.endDate, item.endTime)}
            </span>
          </div>

          <div className="card-details296">
            <div className="card-title-rating296">
              <h3 className="event-title296">{item.name}</h3>
              <div className="card-actions296">
                <img
                  src="/images/filled_heart.png"
                  alt="Favorite"
                  className="action-icon296"
                  onClick={() => toggleFavorite(item)}
                />
              </div>
            </div>

            <div className="event-info296">
              <p className="event-date296">Date:
                <FaCalendarAlt className="info-icon296" />
                {new Date(item.startDate).toLocaleDateString()}
              </p>
              <p className="event-time296">Time:
                <FaClock className="info-icon296" />
                {item.startTime}
              </p>
              <p className="event-location296">Location:
                <FaMapMarkerAlt className="info-icon296" />
                {item.location}
              </p>
            </div>

            {item.ticketPrice && (
              <div className="price-details296">Price:
                {item.ticketPrice.vip && (
                  <span className="price-tag296">VIP: {convertPrice(item.ticketPrice.vip.toString())}</span>
                )}
                {item.ticketPrice.general && (
                  <span className="price-tag296">General: {convertPrice(item.ticketPrice.general.toString())}</span>
                )}
              </div>
            )}

            {item.featuredStars?.length > 0 && (
              <div className="featured-stars296">
                Featured Stars:
                {item.featuredStars.slice(0, 2).map((star, i) => (
                  <span key={i} className="featured-star296">
                    <FaStar className="info-icon296" />
                    {star.name}
                  </span>
                ))}
              </div>
            )}

            {item.tags?.length > 0 && (
              <div className="event-tags296">
                Tags:
                {item.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="tag296">{tag}</span>
                ))}
              </div>
            )}
            <Link to={`/AdminEventView/${item._id}`}>
                <button className="view-details296">View Details</button>
              </Link>

            <div className="button-container296">
              
              {isEventBookable(item) ? (
                <button className="book-now296">Book Now</button>
              ) : (
                <button 
                  className="book-now296" 
                  disabled={true}
                  style={{ 
                    backgroundColor: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                >
                  {getEventStatus(item.startDate, item.endDate, item.endTime) === 'past' 
                    ? 'Event Ended' 
                    : 'Not Available'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // For attractions
    if (item.name && !item.title) {
      return (
        <div className="result-card13" key={item._id}>
          <div className="card-top13">
            <img
              src={item.imageUrl || item.image || "/images/default.png"}
              alt={item.name}
              className="result-image13"
            />
          </div>

          <div className="card-details13">
            <div className="card-title-rating13">
              <h3>
                {item.name}{" "}
                <span className="rating13">{renderStars(item.rating)}</span>
              </h3>
              <div className="card-actions13">
                <img
                  src="/images/filled_heart.png"
                  alt="Favorite"
                  className="action-icon13"
                  onClick={() => toggleFavorite(item)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>

            <div className="address-reviews13">
              <p className="address13">{item.address || "Address not available"}</p>
              <p className="reviews13">
                {item.numberOfReviews || "No Reviews"} reviews and opinions
              </p>
            </div>
            <p className="ranking-string13">
              Ranking: {item.rankingString || "Not Ranked"}
            </p>
            <p className="category-string13">
              Category: {item.category || "No Category"}
            </p>
            <p className="description13">{item.description || "No Description"}</p>
            <Link to={`/AdminAttractionView/${encodeURIComponent(item.name)}`}>
              <button className="view-details13">View Details</button>
            </Link>
          </div>
        </div>
      );
    }

    // For packages
    return (
      <div className="result-card29" key={item._id}>
        <div className="card-top29">
          <img
            src={item.imageUrl || item.image || "/images/default.png"}
            alt={item.title}
            className="result-image29"
          />
        </div>

        <div className="card-details29">
          <div className="card-title-rating29">
            <h3>{item.title}</h3>
            <div className="card-actions29">
              <img
                src="/images/filled_heart.png"
                alt="Favorite"
                className="action-icon29"
                onClick={() => toggleFavorite(item)}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="address-reviews29">
            <p className="address29">{item.address || "Gandaki Zone, Nepal"}</p>
            <p className="reviews29">
              {item.reviews || "Not Reviewed"} reviews and opinions
            </p>
          </div>
          <p className="ranking-string29">{item.tripType || "N/A"}</p>
          <p className="ranking-string29">Trip Type: {item.tripType || "N/A"}</p>
          <p className="ranking-string29">Duration: {item.duration || "N/A"}</p>
          <p className="category-string29">Price: {item.price || "N/A"}</p>
          <p className="category-string29">Group Size: {item.groupSize || "N/A"}</p>
          <p className="category-string29">Difficulty: {item.difficulty || "N/A"}</p>
          <p className="category-string29">Highlight: {item.highlight || "N/A"}</p>

          <Link to={`/ItineraryPackageView/${encodeURIComponent(item.title)}`} className="view-details29">
            View Details
          </Link>
          <button className="book-now29">Book Now</button>
        </div>
      </div>
    );
  };

  const filteredFavorites = () => {
    switch (activeTab) {
      case 'events':
        return favorites.filter(item => item.startDate && item.endDate && item.endTime);
      case 'attractions':
        return favorites.filter(item => item.name && !item.title && !item.startDate);
      case 'packages':
        return favorites.filter(item => item.title);
      default:
        return favorites;
    }
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
            <span 
              onClick={() => setActiveTab('all')}
              style={{ 
                textDecoration: activeTab === 'all' ? "underline" : "none",
                color: activeTab === 'all' ? "#e63946" : "#6c757d",
                cursor: "pointer",
                padding: "8px 16px",
                transition: "all 0.3s ease"
              }}
            >
              All Favorites
            </span>
            <span 
              onClick={() => setActiveTab('events')}
              style={{ 
                textDecoration: activeTab === 'events' ? "underline" : "none",
                color: activeTab === 'events' ? "#e63946" : "#6c757d",
                cursor: "pointer",
                padding: "8px 16px",
                transition: "all 0.3s ease"
              }}
            >
              Events
            </span>
            <span 
              onClick={() => setActiveTab('attractions')}
              style={{ 
                textDecoration: activeTab === 'attractions' ? "underline" : "none",
                color: activeTab === 'attractions' ? "#e63946" : "#6c757d",
                cursor: "pointer",
                padding: "8px 16px",
                transition: "all 0.3s ease"
              }}
            >
              Attractions
            </span>
            <span 
              onClick={() => setActiveTab('packages')}
              style={{ 
                textDecoration: activeTab === 'packages' ? "underline" : "none",
                color: activeTab === 'packages' ? "#e63946" : "#6c757d",
                cursor: "pointer",
                padding: "8px 16px",
                transition: "all 0.3s ease"
              }}
            >
              Packages
            </span>
          </div>

          <h2 className="search-heading29">
            {favorites.length > 0 ? (
              `Your ${activeTab === 'all' ? 'Favorite' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Items:`
            ) : (
              "No favorites added yet."
            )}
          </h2>

          <div className="favorites-grid29">
            {filteredFavorites().length > 0 ? (
              filteredFavorites().map((item) => renderCard(item))
            ) : (
              <p className="no-results29">
                {activeTab === 'all' 
                  ? "You have no favorite items." 
                  : `You have no favorite ${activeTab}.`}
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
