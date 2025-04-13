import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./AdminFavorites.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaStar } from 'react-icons/fa';
import { CurrencyContext } from "../../../config/CurrencyContext";

export default function AdminFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency, exchangeRates } = useContext(CurrencyContext);

  useEffect(() => {
    let isMounted = true;

    const fetchAllFavorites = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("http://localhost:4000/admin/favorites/all");
        if (isMounted) {
          if (response.data.success) {
            const transformedData = response.data.data.map(favorite => ({
              ...favorite,
              userFullName: favorite.userFullName || 'Unknown User',
              userEmail: favorite.userEmail || 'No email provided',
              itemDetails: favorite.itemDetails || {},
              itemType: favorite.itemType || 'unknown'
            }));
            setFavorites(transformedData);
          } else {
            setError(response.data.message || "Failed to load favorites");
            toast.error(response.data.message || "Failed to load favorites");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch favorites:", error);
          setError(error.response?.data?.message || "Failed to load favorites");
          toast.error(error.response?.data?.message || "Failed to load favorites");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (itemToDelete) => {
    try {
      const response = await axios.delete(`http://localhost:4000/admin/favorites/${itemToDelete._id}`);
      if (response.data.success) {
        setFavorites(prevFavorites => prevFavorites.filter(item => item._id !== itemToDelete._id));
        toast.success("Favorite removed successfully");
        setShowDeleteModal(false);
        setItemToDelete(null);
      } else {
        toast.error(response.data.message || "Failed to remove favorite");
      }
    } catch (error) {
      console.error("Failed to delete favorite:", error);
      toast.error(error.response?.data?.message || "Failed to remove favorite");
    }
  };

  const toggleFavorite = (favorite) => {
    let updatedFavorites = [...favorites];
    const isAlreadyFavorite = favorites.some((fav) => fav._id === favorite._id);

    if (isAlreadyFavorite) {
      updatedFavorites = updatedFavorites.filter((fav) => fav._id !== favorite._id);
      toast.error(`Removed "${favorite.itemDetails.name || favorite.itemDetails.title}" from favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message29'
      });
    } else {
      updatedFavorites.push(favorite);
      toast.success(`Added "${favorite.itemDetails.name || favorite.itemDetails.title}" to favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message29'
      });
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (favorite) => {
    return favorites.some((fav) => fav._id === favorite._id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#28a745';
      case 'ongoing': return '#007bff';
      case 'past': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getEventStatus = (startDate, endDate, endTime) => {
    if (!startDate || !endDate || !endTime) return 'unknown';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const endWithTime = new Date(endDate);
      endWithTime.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

    if (now < start) return 'upcoming';
    if (now >= start && now <= endWithTime) return 'ongoing';
      return 'past';
  };

  const convertPrice = (priceString) => {
    if (!priceString || isNaN(priceString)) return "N/A";
    const priceInNPR = parseFloat(priceString.replace(/[^0-9.]+/g, ""));
    if (!exchangeRates || !exchangeRates[currency]) return "Loading...";
    const conversionRate = exchangeRates[currency];
    const convertedPrice = (priceInNPR * conversionRate).toFixed(2);
    return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
  };

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderStars = (rating) => {
    return "⭐".repeat(Math.round(rating));
  };

  const filteredFavorites = () => {
    switch (activeTab) {
      case 'events':
        return favorites.filter(item => item.itemType === 'event');
      case 'attractions':
        return favorites.filter(item => item.itemType === 'attraction');
      case 'packages':
        return favorites.filter(item => item.itemType === 'package');
      default:
        return favorites;
    }
  };

  const renderCard = (favorite) => {
    const item = favorite.itemDetails;
    const userInfo = (
      <div className="user-favorite-info">
        <div className="user-name">{favorite.userFullName}</div>
        <div className="user-email">{favorite.userEmail}</div>
      </div>
    );

    switch (favorite.itemType) {
      case 'event':
        return (
          <div className="result-card-fav" key={favorite._id}>
            <div className="card-top-fav">
              <img
                src={item.image || "/images/default-event.png"}
                alt={item.name}
                className="result-image-fav"
              />
              <span 
                className="event-status-fav" 
                style={{ backgroundColor: getStatusColor(getEventStatus(item.startDate, item.endDate, item.endTime)) }}
              >
                {getEventStatus(item.startDate, item.endDate, item.endTime)}
              </span>
            </div>

            <div className="card-details-fav">
              <div className="card-title-rating-fav">
                <h3 className="title-fav">{item.name}</h3>
              </div>

              <img
                src={isFavorite(favorite) ? "/images/filled_heart.png" : "/images/heart.png"}
                alt="Favorite"
                className="favorite-icon-fav"
                onClick={() => toggleFavorite(favorite)}
              />

              <div className="event-info-fav">
                <p className="event-date-fav">
                  <FaCalendarAlt className="info-icon-fav" /> {new Date(item.startDate).toLocaleDateString()}
                </p>
                <p className="event-time-fav">
                  <FaClock className="info-icon-fav" /> {item.startTime}
                </p>
                <p className="event-location-fav">
                  <FaMapMarkerAlt className="info-icon-fav" /> {item.location}
                </p>
              </div>

              {item.ticketPrice && (
                <div className="price-details-fav">
                  Price: {' '}
                  {item.ticketPrice.vip && <span className="price-tag-fav">VIP: {convertPrice(item.ticketPrice.vip.toString())}</span>}
                  {item.ticketPrice.general && <span className="price-tag-fav">General: {convertPrice(item.ticketPrice.general.toString())}</span>}
                  <br></br>
                  <Link to={`/AdminEventView/${item._id}`} className="view-details222">
                 View Details
               </Link>
                </div>
                
              )}

              <button className="book-now-fav">
                Book Now
              </button>
              <div className="emm"> 
              {userInfo}
              </div>
            </div>
          </div>
        );

      case 'attraction':
        return (
          <div className="result-card-fav" key={favorite._id}>
            <div className="card-top-fav">
              <img
                src={item.image || "/images/default.png"}
                alt={item.name}
                className="result-image-fav"
              />
            </div>

            <div className="card-details-fav">
              <div className="card-title-rating-fav">
                <h3 className="title-fav">
                  {item.name} <span className="rating-fav">{renderStars(item.rating)}</span>
                </h3>
              </div>

              <img
                src={isFavorite(favorite) ? "/images/filled_heart.png" : "/images/heart.png"}
                alt="Favorite"
                className="favorite-icon-fav"
                onClick={() => toggleFavorite(favorite)}
              />

              <div className="address-reviews-fav">
                <p className="address-fav">{item.address || "Address not available"}</p>
                <p className="reviews-fav">{item.numberOfReviews || "No"} reviews and opinions</p>
              </div>

              <p className="ranking-string-fav">Ranking: {item.rankingString || "Not Ranked"}</p>
              <p className="category-string-fav">Category: {item.category || "No Category"}</p>
              <Link to={`/AdminAttractionView/${encodeURIComponent(item.name)}`} className="view-details-fav">
                View Details
              </Link>
              <div className="emm"> 
              {userInfo}
              </div>
            </div>
          </div>
        );

      case 'package':
        return (
          <div className="result-card-fav" key={favorite._id}>
            <div className="card-top-fav">
              <img
                src={item.imageUrl || "/images/default.png"}
                alt={item.title}
                className="result-image-fav"
              />
            </div>

            <div className="card-details-fav">
              <div className="card-title-rating-fav">
                <h3 className="title-fav">{item.title}</h3>
              </div>

              <img
                src={isFavorite(favorite) ? "/images/filled_heart.png" : "/images/heart.png"}
                alt="Favorite"
                className="favorite-icon-fav"
                onClick={() => toggleFavorite(favorite)}
              />

              <div className="address-reviews-fav">
                <p className="address-fav">{item.address || "Gandaki Zone, Nepal"}</p>
                <p className="reviews-fav">{item.reviews || "Not Reviewed"} reviews and opinions</p>
              </div>

              <p className="ranking-string-fav">Trip Type: {item.tripType || "Short"}</p>
              <p className="ranking-string-fav">Duration: {item.duration}</p>
              <p className="category-string-fav">
                Price: <span className="budget-value-fav">{convertPrice(item.price)}</span>
              </p>
              <Link to={`/ItineraryPackageView/${encodeURIComponent(item.title)}`} className="view-details222">
                View Details
              </Link>

              <button className="book-now-fav">
                Book Now
              </button>
              <div className="emm"> 
              {userInfo}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="main-container29">
        <div className="heading29">
          <h1 className="title-heading29">User Favorites Management</h1>
          <p className="title-para29">View and manage all user favorite items</p>
        </div>

        <div className="search-results-container29">
          {isLoading ? (
            <div className="loading-message">Loading favorites...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="search-tabs29">
              <span 
                onClick={() => setActiveTab('all')}
                style={{ 
                  textDecoration: activeTab === 'all' ? "underline" : "none",
                  color: activeTab === 'all' ? "#e63946" : "#6c757d"
                }}
              >
                All Favorites
              </span>
              <span 
                onClick={() => setActiveTab('events')}
                style={{ 
                  textDecoration: activeTab === 'events' ? "underline" : "none",
                  color: activeTab === 'events' ? "#e63946" : "#6c757d"
                }}
              >
                Events
              </span>
              <span 
                onClick={() => setActiveTab('attractions')}
                style={{ 
                  textDecoration: activeTab === 'attractions' ? "underline" : "none",
                  color: activeTab === 'attractions' ? "#e63946" : "#6c757d"
                }}
              >
                Attractions
              </span>
              <span 
                onClick={() => setActiveTab('packages')}
                style={{ 
                  textDecoration: activeTab === 'packages' ? "underline" : "none",
                  color: activeTab === 'packages' ? "#e63946" : "#6c757d"
                }}
              >
                Packages
              </span>
            </div>
          )}

          <div className="favorites-grid29">
            {filteredFavorites().length > 0 ? (
              filteredFavorites().map(favorite => renderCard(favorite))
            ) : (
              <p className="no-results29">
                {activeTab === 'all' 
                  ? "No favorite items found." 
                  : `No favorite ${activeTab} found.`}
              </p>
            )}
          </div>
        </div>

        {showDeleteModal && (
          <div className="modal-overlay-fav">
            <div className="modal-content-fav">
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to remove this item from favorites?</p>
              <div className="modal-buttons-fav">
                <button 
                  className="modal-cancel-btn-fav" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-delete-btn-fav" 
                  onClick={() => handleDelete(itemToDelete)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <ToastContainer />
    </>
  );
}