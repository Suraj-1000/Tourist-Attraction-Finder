import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./AdminEvent.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserTie, FaTicketAlt, FaSearch, FaClock, FaStar, FaPhone, FaEnvelope } from 'react-icons/fa';
import AddEvent from "./AddEvent";
import { CurrencyContext } from "../../../config/CurrencyContext";
import EventBookingForm from '../../../View/Payment/EventBookingForm';

export default function AdminEventPage() {
  const { currency, exchangeRates } = useContext(CurrencyContext);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [allEvents, setAllEvents] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventRatings, setEventRatings] = useState({});
  const [eventStats, setEventStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0
  });

  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
    const storedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(storedFavorites);
  }, []);

  const fetchEventRatings = async (events) => {
    try {
      const promises = events.map(async (event) => {
        const response = await axios.get(`http://localhost:4000/reviews/item/${event._id}?itemType=event`);
        if (response.data.success) {
          return {
            id: event._id,
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

      setEventRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching event ratings:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminEvents");
      setEvents(response.data);
      setAllEvents(response.data);
      
      // Calculate event statistics
      const stats = {
        total: response.data.length,
        upcoming: 0,
        ongoing: 0,
        past: 0
      };

      response.data.forEach(event => {
        const status = getEventStatus(event.startDate, event.endDate, event.endTime);
        stats[status]++;
      });

      setEventStats(stats);
      
      // Fetch ratings for all events
      await fetchEventRatings(response.data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events", {
        className: 'toast-message36',
      });
    }
  };

  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:4000/adminEvents/${eventToDelete._id}`);
      setEvents(prev => prev.filter(event => event._id !== eventToDelete._id));
      toast.success(`Event "${eventToDelete.name}" deleted successfully`, {
        className: 'toast-message36',
      });
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event", {
        className: 'toast-message36',
      });
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminEvents/search", {
        params: { 
          query,
          category
        },
      });
      setEvents(response.data);
      setAllEvents(response.data);
      setSortBy("");
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed", {
        className: 'toast-message36',
      });
    }
  };

  const sortEvents = (data) => {
    if (!sortBy || sortBy === "") {
      return allEvents;
    }

    return allEvents.filter(event => 
      getEventStatus(event.startDate, event.endDate, event.endTime) === sortBy
    );
  };

  useEffect(() => {
    const sorted = sortEvents(events);
    setEvents(sorted);
  }, [sortBy, allEvents]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
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
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const endWithTime = new Date(endDate);
    endWithTime.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now <= endWithTime) {
      return 'ongoing';
    } else {
      return 'past';
    }
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
    
    // For free events, only check if the event hasn't ended
    if (isFreeEvent) {
      return now <= endWithTime;
    }
    
    // For paid events, check both time and ticket availability
    const hasAvailableTickets = event.capacity.vip > 0 || event.capacity.general > 0;
    return now <= endWithTime && hasAvailableTickets;
  };

  const handleEdit = (event) => {
    setEventToEdit(event);
    setShowEditModal(true);
  };

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatLocation = (location) => {
    // Split into parts
    const parts = location.split(',').map(part => part.trim());
    
    // Process each part to remove ZIP codes
    const cleanParts = parts.map(part => {
      // Remove any numbers (ZIP codes) from the part
      return part.replace(/\d+/g, '').trim();
    });

    // Take first two parts and remove empty parts
    return cleanParts
      .filter(part => part && !part.includes('Nepal')) // Remove empty parts and 'Nepal'
      .slice(0, 2) // Take only first two parts
      .join(', '); // Join with comma and space
  };

  const saveToHistory = (action, event) => {
    if (!user) return;

    const historyEntry = {
      user: `${user.firstName}`,
      action,
      event,
      timestamp: new Date().toLocaleString(),
    };

    const existingHistory = JSON.parse(localStorage.getItem("userHistory")) || [];
    existingHistory.unshift(historyEntry);
    localStorage.setItem("userHistory", JSON.stringify(existingHistory));
  };

  const toggleFavorite = (event) => {
    let updatedFavorites = [...favorites];
    const isAlreadyFavorite = favorites.some((fav) => fav._id === event._id);

    if (isAlreadyFavorite) {
      updatedFavorites = updatedFavorites.filter((fav) => fav._id !== event._id);
      toast.error(`Removed "${event.name}" from favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message36'
      });
      saveToHistory("removed from favorites", event.name);
    } else {
      updatedFavorites.push(event);
      toast.success(`Added "${event.name}" to favorites`, {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message36'
      });
      saveToHistory("added to favorites", event.name);
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (event) => {
    return favorites.some((fav) => fav._id === event._id);
  };

  const handleShare = (event) => {
    const generatedLink = `${window.location.origin}/AdminEventView/${event._id}`;
    setShareLink(generatedLink);
    setShowShareModal(true);
    
    if (!user) {
      toast.info("Note: Users will need to log in or sign up to view this event.");
    }
    
    saveToHistory("shared", event.name);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard! Users will need to log in to view the event.");
    setShowShareModal(false);
  };

  const handleBooking = (event) => {
    // Removed booking functionality
    toast.info("Booking functionality is disabled in admin view", {
      position: "top-right",
      autoClose: 3000,
      className: 'toast-message36'
    });
  };

  const handleBookingSubmit = async (formData) => {
    try {
      // Calculate new capacities
      const newVipCapacity = selectedEvent.capacity.vip - formData.vipTickets;
      const newGeneralCapacity = selectedEvent.capacity.general - formData.generalTickets;

      // Validate if we have enough capacity
      if (newVipCapacity < 0 || newGeneralCapacity < 0) {
        toast.error("Not enough tickets available!", {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message36'
        });
        return;
      }

      // Update event in database
      const updatedEvent = {
        ...selectedEvent,
        capacity: {
          vip: newVipCapacity,
          general: newGeneralCapacity
        }
      };

      const response = await axios.put(`http://localhost:4000/adminEvents/${selectedEvent._id}`, updatedEvent);

      if (response.data) {
        // Update local state
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === selectedEvent._id ? updatedEvent : event
          )
        );
        
        toast.success("Tickets booked successfully!", {
          position: "top-right",
          autoClose: 3000,
          className: 'toast-message36'
        });
        
        // Close the booking form and reset selected event
        setShowBookingForm(false);
        setSelectedEvent(null);

        // Refresh events list to get latest data
        fetchEvents();
      } else {
        throw new Error("Failed to update event capacity");
      }
    } catch (error) {
      console.error("Failed to update event capacity:", error);
      toast.error("Failed to update ticket availability", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message36'
      });
    }
  };

  const renderStarRating = (eventId) => {
    const rating = eventRatings[eventId]?.averageRating || 0;
    const reviewCount = eventRatings[eventId]?.totalReviews || 0;
    
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />

      <div className="main-container36">
        <div className="heading36">
          <h1 className="title-heading36">Event Management</h1>
          <p className="title-para36">Manage and Recommend Events in Nepal</p>
        </div>

        <div className="search-container36">
          <div className="search-box36">
            <FaSearch className="search-icon36" />
            <input
              className="search-location36"
              type="text"
              placeholder="Search events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="search-box36">
            <select
              className="search-category36"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Cultural">Cultural</option>
              <option value="Festival">Festival</option>
              <option value="Sports">Sports</option>
              <option value="Music">Music</option>
              <option value="Food">Food</option>
              <option value="Religious">Religious</option>
            </select>
          </div>

          <div className="search-box36">
            <button className="search-button36" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div className="add-button-container36">
            <a href="#" className="add-icon36" onClick={() => setShowAddModal(true)}>
              <span>Add Event</span>
            </a>
          </div>
        </div>

        <div className="event-stats-container36">
          <div className="event-stat-card36">
            <h3>Total Events</h3>
            <div className="stat-value36">{eventStats.total}</div>
          </div>
          <div className="event-stat-card36">
            <h3>Upcoming Events</h3>
            <div className="stat-value36" style={{ color: '#28a745' }}>{eventStats.upcoming}</div>
          </div>
          <div className="event-stat-card36">
            <h3>Ongoing Events</h3>
            <div className="stat-value36" style={{ color: '#007bff' }}>{eventStats.ongoing}</div>
          </div>
          <div className="event-stat-card36">
            <h3>Past Events</h3>
            <div className="stat-value36" style={{ color: '#dc3545' }}>{eventStats.past}</div>
          </div>
        </div>

        <div className="search-results-container36">
          <div className="search-tabs36">
            <span>All Events</span>
            <div className="filter-container36">
              <select
                className="filter-dropdown36"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="">All Events</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="ongoing">Ongoing Events</option>
                <option value="past">Past Events</option>
              </select>
            </div>
          </div>

          <div className="events-grid36">
            {events.map((event, index) => (
              <div className="result-card36" key={index}>
                <div className="card-top36">
                  <img
                    src={event.image || "/images/default-event.png"}
                    alt={event.name}
                    className="result-image36"
                  />
                  <span 
                    className="event-status36" 
                    style={{ 
                      backgroundColor: `${getStatusColor(getEventStatus(event.startDate, event.endDate, event.endTime))}` 
                    }}
                  >
                    {getEventStatus(event.startDate, event.endDate, event.endTime)}
                  </span>
                </div>

                <div className="card-details36">
                  <div className="edit-delete-icons36">
                    <img
                      src="/images/edit.png"
                      alt="Edit"
                      className="edit-icon36"
                      onClick={() => handleEdit(event)}
                    />
                    <img
                      src="/images/dlete.png"
                      alt="Delete"
                      className="delete-icon36"
                      onClick={() => handleDelete(event)}
                    />
                  </div>

                  <div className="card-title-rating36">
                    <h3 className="event-title36" style={{ display: 'flex', alignItems: 'center' }}>
                      {event.name}
                      {renderStarRating(event._id)}
                    </h3>
                    <div className="card-actions36">
                      <img
                        src={isFavorite(event) ? "/images/filled_heart.png" : "/images/heart.png"}
                        alt="Favorite"
                        className="action-icon36"
                        onClick={() => toggleFavorite(event)}
                      />
                      <img
                        src="/images/share.png"
                        alt="Share"
                        className="action-icon36"
                        onClick={() => handleShare(event)}
                      />
                    </div>
                  </div>

                  <div className="event-info36">
                    <p className="event-category36">
                      <FaUserTie className="info-icon36" />
                      Category: {event.category}
                    </p>
                    <p className="event-date36">Date:
                      <FaCalendarAlt className="info-icon36" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </p>
                    <p className="event-time36">Time:
                      <FaClock className="info-icon36" />
                      {event.startTime}
                    </p>
                    <p className="event-location36">Location:
                      <FaMapMarkerAlt className="info-icon36" />
                      {formatLocation(event.location)}
                    </p>
                  </div>

                  {event.ticketPrice && (
                    <div className="price-details36">Price: {' '}
                      {(!event.ticketPrice.vip && !event.ticketPrice.general) || 
                       ((!event.ticketPrice.vip || parseFloat(event.ticketPrice.vip) === 0) && 
                        (!event.ticketPrice.general || parseFloat(event.ticketPrice.general) === 0)) ? (
                        <span>N/A</span>
                      ) : (
                        <>
                          {event.ticketPrice.vip && parseFloat(event.ticketPrice.vip) > 0 && (
                            <span>VIP: {convertPrice(event.ticketPrice.vip.toString())}</span>
                          )}
                          {event.ticketPrice.general && parseFloat(event.ticketPrice.general) > 0 && (
                            <span>General: {convertPrice(event.ticketPrice.general.toString())}</span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {event.featuredStars?.length > 0 && (
                    <div className="featured-stars36"> Featured Stars:
                      {event.featuredStars.slice(0, 2).map((star, i) => (
                        <span key={i} className="featured-star36">
                          <FaStar className="info-icon36" />
                          {star.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="event-tags36">
                    Tags:
                    {event.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag36">{tag}</span>
                    ))}
                  </div>
                  <Link to={`/AdminEventView/${event._id}`}>
                    <button className="view-details36">View Details</button>
                  </Link>

                  <div className="action-buttons36">
                    {isEventBookable(event) ? (
                      <button 
                        className="book-now36"
                        onClick={() => handleBooking(event)}
                      >
                        Book Now
                      </button>
                    ) : (
                      <button 
                        className="book-now36" 
                        disabled={true}
                        style={{ 
                          backgroundColor: '#6c757d',
                          cursor: 'not-allowed'
                        }}
                      >
                        {getEventStatus(event.startDate, event.endDate, event.endTime) === 'past' 
                          ? 'Event Ended' 
                          : 'Not Available'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <AddEvent
            onEventAdded={(newEvent) => {
              setEvents(prev => [...prev, newEvent]);
              setShowAddModal(false);
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {showEditModal && (
          <AddEvent
            existingEvent={eventToEdit}
            onEventEdited={(updatedEvent) => {
              setEvents(prev => prev.map(event => 
                event._id === updatedEvent._id ? updatedEvent : event
              ));
              setShowEditModal(false);
            }}
            onClose={() => {
              setShowEditModal(false);
              setEventToEdit(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay36">
            <div className="modal-content36">
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to delete "{eventToDelete?.name}"?</p>
              <div className="modal-buttons36">
                <button 
                  className="modal-cancel-btn36" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-delete-btn36" 
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="modal-overlay36">
            <div className="modal-content36">
              <h3>Share Event</h3>
              <p>Share this link with your friends:</p>
              <input type="text" value={shareLink} readOnly className="share-input36" />
              <div className="modal-buttons36">
                <button onClick={copyToClipboard} className="modal-copy-btn36">
                  Copy Link
                </button>
                <button onClick={() => setShowShareModal(false)} className="modal-cancel-btn36">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Booking Form Modal */}
        {showBookingForm && selectedEvent && (
          <EventBookingForm
            eventDetails={selectedEvent}
            onSubmit={handleBookingSubmit}
            onCancel={() => {
              setShowBookingForm(false);
              setSelectedEvent(null);
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
}