import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./Event.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserTie, FaTicketAlt, FaSearch, FaClock, FaStar, FaPhone, FaEnvelope } from 'react-icons/fa';
import { CurrencyContext } from "../../../context/CurrencyContext";
import EventBookingForm from '../../Payment/EventBookingForm';

export default function EventPage() {
  const { currency, exchangeRates } = useContext(CurrencyContext);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
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
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [otherEvents, setOtherEvents] = useState([]);
  const [eventRatings, setEventRatings] = useState({});

  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch user preferences first
  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        const response = await axios.get('http://localhost:4000/preferences/get-preferences', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data.success) {
          setUserPreferences(response.data.preferences || []);
          return response.data.preferences;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return [];
    }
  };

  // Modified organizeEventsByPreference function
  const organizeEventsByPreference = (eventsList, preferences) => {
    if (!user || !preferences.length) {
      setRecommendedEvents([]);
      setOtherEvents(eventsList);
      setEvents(eventsList);
      return;
    }

    const recommended = eventsList.filter(event => 
      preferences.includes(event.category)
    );
    
    const others = eventsList.filter(event => 
      !preferences.includes(event.category)
    );

    setRecommendedEvents(recommended);
    setOtherEvents(others);
    setEvents([...recommended, ...others]); // Always keep recommended first in the combined list
  };

  // Add this new function to fetch ratings for events
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

  // Modified fetchEvents function
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const preferences = await fetchUserPreferences();
      
      const response = await axios.get("http://localhost:4000/adminEvents");
      const eventData = response.data;
      setAllEvents(eventData);
      
      // Fetch ratings for all events
      await fetchEventRatings(eventData);
      
      // Always organize with preferences
      organizeEventsByPreference(eventData, preferences);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events", {
        className: 'toast-message57',
      });
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
      toast.error('Failed to load favorites', {
        className: 'toast-message57',
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
        className: 'toast-message57',
      });
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event", {
        className: 'toast-message57',
      });
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  // Modified handleSearch function
  const handleSearch = async () => {
    try {
      if (query && user) {
        await axios.post('http://localhost:4000/user-history', {
          action: 'searched',
          itemType: 'event',
          itemId: Date.now().toString(),
          itemName: query
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      let filteredEvents = [...allEvents];

      // Apply text search if query exists
      if (query) {
        filteredEvents = filteredEvents.filter(event => 
          event.name.toLowerCase().includes(query.toLowerCase()) ||
          event.description.toLowerCase().includes(query.toLowerCase()) ||
          event.location.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Apply category filter if selected
      if (category && category !== "") {
        filteredEvents = filteredEvents.filter(event => event.category === category);
      }

      // Apply sort filter if selected
      if (sortBy && sortBy !== "") {
        filteredEvents = filteredEvents.filter(event => 
          getEventStatus(event.startDate, event.endDate, event.endTime) === sortBy
        );
      }

      // Always organize with current preferences
      organizeEventsByPreference(filteredEvents, userPreferences);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed", {
        className: 'toast-message57',
      });
    }
  };

  // Use effect to fetch events on mount and when user changes
  useEffect(() => {
    fetchEvents();
  }, [user?._id]);

  // Use effect to handle search when filters change
  useEffect(() => {
    if (allEvents.length > 0) {
      handleSearch();
    }
  }, [category, sortBy]);

  const sortEvents = (data) => {
    if (!sortBy || sortBy === "") {
      // If no specific sort is selected, prioritize based on user preferences
      return [...data].sort((a, b) => {
        const aMatches = userPreferences.includes(a.category);
        const bMatches = userPreferences.includes(b.category);
        
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    // If a specific sort is selected, first filter by that status
    const filteredByStatus = data.filter(event => 
      getEventStatus(event.startDate, event.endDate, event.endTime) === sortBy
    );

    // Then sort by preferences within the status
    return filteredByStatus.sort((a, b) => {
      const aMatches = userPreferences.includes(a.category);
      const bMatches = userPreferences.includes(b.category);
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
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
    
    // Check if it's a religious event
    if (event.category === 'Religious') {
      return false;
    }
    
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

  const saveToHistory = async (action, item) => {
    if (!user) return;

    try {
      await axios.post('http://localhost:4000/user-history', {
        action,
        itemType: 'event',
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

  const toggleFavorite = async (event) => {
    if (!user) {
      toast.error("Please log in to add favorites", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message57'
      });
      return;
    }

    try {
      const isAlreadyFavorite = favorites.some((fav) => fav._id === event._id);

      if (isAlreadyFavorite) {
        // Find the favorite document that contains this item
        const response = await axios.get('http://localhost:4000/user-favorites', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const favoriteDoc = response.data.data.find(
            (fav) => fav.itemDetails._id === event._id
          );

          if (favoriteDoc) {
            await axios.delete(`http://localhost:4000/user-favorites/${favoriteDoc._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            setFavorites(prev => prev.filter((fav) => fav._id !== event._id));
            toast.error(`Removed "${event.name}" from favorites`, {
              position: "top-right",
              autoClose: 3000,
              className: 'toast-message57'
            });
            // Don't await history saving to prevent blocking the UI
            saveToHistory("removed from favorites", event.name).catch(console.error);
          }
        }
      } else {
        const response = await axios.post('http://localhost:4000/user-favorites', {
          itemType: 'event',
          itemId: event._id,
          itemName: event.name,
          itemDetails: event
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setFavorites(prev => [...prev, event]);
          toast.success(`Added "${event.name}" to favorites`, {
            position: "top-right",
            autoClose: 3000,
            className: 'toast-message57'
          });
          // Don't await history saving to prevent blocking the UI
          saveToHistory("added to favorites", event.name).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message57'
      });
    }
  };

  const isFavorite = (event) => {
    return favorites.some((fav) => fav._id === event._id);
  };

  const handleShare = async (event) => {
    const generatedLink = `${window.location.origin}/Event-Details/${event._id}`;
    setShareLink(generatedLink);
    setShowShareModal(true);
    
    if (user) {
      try {
        await axios.post('http://localhost:4000/user-history', {
          action: 'shared',
          itemType: 'event',
          itemId: event._id,
          itemName: event.name
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Error saving share to history:', error);
      }
    } else {
      toast.info("Note: Users will need to log in or sign up to view this event.");
    }
  };

  const copyToClipboard = async () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard! Users will need to log in to view the event.");
    setShowShareModal(false);
    
    if (user) {
      await saveToHistory("copied link of", shareLink);
    }
  };

  const handleBooking = async (event) => {
    if (!user) {
      toast.error("Please log in to book tickets", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message57'
      });
      return;
    }

    try {
      await axios.post('http://localhost:4000/user-history', {
        action: 'booked',
        itemType: 'event',
        itemId: event._id,
        itemName: event.name
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error saving booking to history:', error);
    }

    setSelectedEvent(event);
    setShowBookingForm(true);
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
          className: 'toast-message57'
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
          className: 'toast-message57'
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
        className: 'toast-message57'
      });
    }
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);

    if (selectedCategory && user) {
      // Save category filter to history
      axios.post('http://localhost:4000/user-history', {
        action: 'filtered category',
        itemType: 'event',
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
  };

  // Update the renderStarRating function
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

      <div className="main-container57">
        <div className="heading57">
          <h1 className="title-heading57">Explore Events in Nepal</h1>
          <p className="title-para57">Find the best events in Nepal!</p>
        </div>

        <div className="search-container57">
          <div className="search-box57">
            <FaSearch className="search-icon57" />
            <input
              className="search-location57"
              type="text"
              placeholder="Search events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="search-box57">
            <select
              className="search-category57"
              value={category}
              onChange={handleCategoryChange}
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

          <div className="search-box57">
            <button className="search-button57" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        <div className="search-results-container57">
          <div className="results-header57">
            <div className="results-count57">
              Total Events Available: {recommendedEvents.length + otherEvents.length}
            </div>
            <div className="results-sort57">
              <select
                className="filter-dropdown57"
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

          {loading ? (
            <div className="loading-spinner57">Loading events...</div>
          ) : (
            <>
              {recommendedEvents.length > 0 && (
                <div className="recommended-section57">
                  <h2 className="section-heading57">Recommended Events ({recommendedEvents.length})</h2>
                  <div className="event-grid57">
                    {recommendedEvents.map((event, index) => (
                      <div className="result-card57" key={index}>
                        <div className="card-top57">
                          <img
                            src={event.image || "/images/default-event.png"}
                            alt={event.name}
                            className="result-image57"
                          />
                          <span 
                            className="event-status57" 
                            style={{ 
                              backgroundColor: `${getStatusColor(getEventStatus(event.startDate, event.endDate, event.endTime))}` 
                            }}
                          >
                            {getEventStatus(event.startDate, event.endDate, event.endTime)}
                          </span>
                        </div>

                        <div className="card-details57">

                          <div className="card-title-rating57">
                            <h3 className="event-title57" style={{ display: 'flex', alignItems: 'center' }}>
                              {event.name}
                              {renderStarRating(event._id)}
                            </h3>
                            <div className="card-actions57">
                              <img
                                src={isFavorite(event) ? "/images/filled_heart.png" : "/images/heart.png"}
                                alt="Favorite"
                                className="action-icon57"
                                onClick={() => toggleFavorite(event)}
                              />
                              <img
                                src="/images/share.png"
                                alt="Share"
                                className="action-icon57"
                                onClick={() => handleShare(event)}
                              />
            </div>
          </div>

                          <div className="event-info57">
                            <p className="event-category57">
                              <FaUserTie className="info-icon57" />
                              Category: {event.category}
                            </p>
                            <p className="event-date57">Date:
                              <FaCalendarAlt className="info-icon57" />
                              {new Date(event.startDate).toLocaleDateString()}
                            </p>
                            <p className="event-time57">Time:
                              <FaClock className="info-icon57" />
                              {event.startTime}
                            </p>
                            <p className="event-location57">Location:
                              <FaMapMarkerAlt className="info-icon57" />
                              {formatLocation(event.location)}
                            </p>
                          </div>

                          {event.ticketPrice && (
                            <div className="price-details57">Price: {' '}
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
                            <div className="featured-stars57"> Featured Stars:
                              {event.featuredStars.slice(0, 2).map((star, i) => (
                                <span key={i} className="featured-star57">
                                  <FaStar className="info-icon57" />
                                  {star.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="event-tags57">
                            Tags:
                            {event.tags?.slice(0, 3).map((tag, i) => (
                              <span key={i} className="tag57">{tag}</span>
                            ))}
                          </div>
                          <Link 
                            to={`/Event-Details/${event._id}`}
                            onClick={async () => {
                              if (user) {
                                try {
                                  await axios.post('http://localhost:4000/user-history', {
                                    action: 'viewed details',
                                    itemType: 'event',
                                    itemId: event._id,
                                    itemName: event.name
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
                            <button className="view-details57">View Details</button>
                          </Link>

                          <div className="action-buttons57">
                            {isEventBookable(event) ? (
                              <button 
                                className="book-now57"
                                onClick={() => handleBooking(event)}
                              >
                                Book Now
                              </button>
                            ) : (
                              <button 
                                className="book-now57" 
                                disabled={true}
                                style={{ 
                                  backgroundColor: '#6c757d',
                                  cursor: 'not-allowed'
                                }}
                              >
                                {event.category === 'Religious' ? 'Religious Event - No Booking Required' :
                                 getEventStatus(event.startDate, event.endDate, event.endTime) === 'past' 
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
              )}

              {otherEvents.length > 0 && (
                <div className="other-events-section57">
                  <h2 className="section-heading57">Other Events ({otherEvents.length})</h2>
                  <div className="event-grid57">
                    {otherEvents.map((event, index) => (
                <div className="result-card57" key={index}>
                  <div className="card-top57">
                    <img
                      src={event.image || "/images/default-event.png"}
                      alt={event.name}
                      className="result-image57"
                    />
                    <span 
                      className="event-status57" 
                      style={{ 
                        backgroundColor: `${getStatusColor(getEventStatus(event.startDate, event.endDate, event.endTime))}` 
                      }}
                    >
                      {getEventStatus(event.startDate, event.endDate, event.endTime)}
                    </span>
                  </div>

                  <div className="card-details57">

                    <div className="card-title-rating57">
                      <h3 className="event-title57" style={{ display: 'flex', alignItems: 'center' }}>
                        {event.name}
                        {renderStarRating(event._id)}
                      </h3>
                      <div className="card-actions57">
                        <img
                          src={isFavorite(event) ? "/images/filled_heart.png" : "/images/heart.png"}
                          alt="Favorite"
                          className="action-icon57"
                          onClick={() => toggleFavorite(event)}
                        />
                        <img
                          src="/images/share.png"
                          alt="Share"
                          className="action-icon57"
                          onClick={() => handleShare(event)}
                        />
                      </div>
                    </div>

                    <div className="event-info57">
                            <p className="event-category57">
                              <FaUserTie className="info-icon57" />
                              Category: {event.category}
                            </p>
                      <p className="event-date57">Date:
                        <FaCalendarAlt className="info-icon57" />
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                      <p className="event-time57">Time:
                        <FaClock className="info-icon57" />
                        {event.startTime}
                      </p>
                      <p className="event-location57">Location:
                        <FaMapMarkerAlt className="info-icon57" />
                        {formatLocation(event.location)}
                      </p>
                    </div>

                    {event.ticketPrice && (
                      <div className="price-details57">Price: {' '}
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
                      <div className="featured-stars57"> Featured Stars:
                        {event.featuredStars.slice(0, 2).map((star, i) => (
                          <span key={i} className="featured-star57">
                            <FaStar className="info-icon57" />
                            {star.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="event-tags57">
                      Tags:
                      {event.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag57">{tag}</span>
                      ))}
                    </div>
                    <Link 
                      to={`/Event-Details/${event._id}`}
                      onClick={async () => {
                        if (user) {
                          try {
                            await axios.post('http://localhost:4000/user-history', {
                              action: 'viewed details',
                              itemType: 'event',
                              itemId: event._id,
                              itemName: event.name
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
                      <button className="view-details57">View Details</button>
                    </Link>

                    <div className="action-buttons57">
                      {isEventBookable(event) ? (
                        <button 
                          className="book-now57"
                          onClick={() => handleBooking(event)}
                        >
                          Book Now
                        </button>
                      ) : (
                        <button 
                          className="book-now57" 
                          disabled={true}
                          style={{ 
                            backgroundColor: '#6c757d',
                            cursor: 'not-allowed'
                          }}
                        >
                                {event.category === 'Religious' ? 'Religious Event - No Booking Required' :
                                 getEventStatus(event.startDate, event.endDate, event.endTime) === 'past' 
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
              )}
            </>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="modal-overlay57">
            <div className="modal-content57">
              <h3>Share Event</h3>
              <p>Share this link with your friends:</p>
              <input type="text" value={shareLink} readOnly className="share-input57" />
              <div className="modal-buttons57">
                <button onClick={copyToClipboard} className="modal-copy-btn57">
                  Copy Link
                </button>
                <button onClick={() => setShowShareModal(false)} className="modal-cancel-btn57">
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
