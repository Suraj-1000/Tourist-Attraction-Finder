import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import { CurrencyContext } from "../../../config/CurrencyContext";
import { 
  FaMapMarkerAlt, FaCalendarAlt, FaUserTie, FaTicketAlt, 
  FaArrowLeft, FaStar, FaUsers, FaPhone, FaEnvelope, 
  FaGlobe, FaClock, FaListUl, FaClipboardList, FaCalendarDay,
  FaCheckCircle, FaExclamationCircle, FaHashtag, FaCrown
} from 'react-icons/fa';
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import EventBookingForm from '../../../View/Payment/EventBookingForm';
import "./EventView.css";

export default function EventView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency, exchangeRates } = useContext(CurrencyContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/adminEvents/${id}`, {
        params: { 
          populate: 'reviews.userId'
        }
      });

      if (response.status === 200) {
        // Transform the reviews data to match AdminHistory format
        const eventData = response.data;
        if (eventData.reviews) {
          eventData.reviews = eventData.reviews.map(review => ({
            ...review,
            userFullName: review.userId ? `${review.userId.firstName} ${review.userId.lastName}` : null,
            userId: review.userId || null
          }));
        }
        setEvent(eventData);
      } else {
        setError("No Event Found.");
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const renderUserInfo = (review) => {
    // Check for userFullName first
    if (review.userFullName && review.userFullName !== 'undefined undefined') {
      return review.userFullName;
    }

    // Check for userId object with firstName and lastName
    if (review.userId && typeof review.userId === 'object') {
      const firstName = review.userId.firstName || '';
      const lastName = review.userId.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }

    // If we have a string userId with firstName and lastName
    if (typeof review.userId === 'string' && review.firstName && review.lastName) {
      return `${review.firstName} ${review.lastName}`.trim();
    }

    return 'Anonymous';
  };

  const getEventStatus = () => {
    const now = new Date();
    const start = new Date(event.startDate);
    const endWithTime = new Date(event.endDate);
    endWithTime.setHours(parseInt(event.endTime.split(':')[0]), parseInt(event.endTime.split(':')[1]));

    if (now < start) {
      return 'Upcoming';
    } else if (now >= start && now <= endWithTime) {
      return 'Ongoing';
    } else {
      return 'Past';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBooking = () => {
    toast.info("Booking functionality is disabled in admin view", {
      position: "top-right",
      autoClose: 3000,
      className: 'toast-message37'
    });
  };

  const handleBookingSubmit = async (formData) => {
    try {
      // Update event capacity
      const updatedEvent = {
        ...event,
        capacity: {
          vip: event.capacity.vip - formData.vipTickets,
          general: event.capacity.general - formData.generalTickets
        }
      };

      // Update event in database
      await axios.put(`http://localhost:4000/adminEvents/${event._id}`, updatedEvent);
      
      // Update local state
      setEvent(updatedEvent);
      
      toast.success("Tickets booked successfully!", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message37'
      });
      
      setShowBookingForm(false);
    } catch (error) {
      console.error("Failed to update event capacity:", error);
      toast.error("Failed to update ticket availability", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message37'
      });
    }
  };

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  const isEventBookable = () => {
    const now = new Date();
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }


  return (
    <>
      <Header />
      <div className="main-container37">
        <div className="event-detail-container37">
          <div className="event-header37">
            <img 
              src={event.image || "/images/default-event.png"} 
              alt={event.name} 
              className="event-detail-image37"
            />
            <h1 className="event-title37">{event.name}</h1>
            <div className="event-meta37">
              <span className="event-category37">{event.category}</span>
            </div>
          </div>

          <div className="status-card37">
            <h3 className="status-title37">Event Status</h3>
            <div className="status-value37" style={{ color: getEventStatus() === 'Ongoing' ? '#007bff' : 'inherit' }}>
              {getEventStatus()}
            </div>
            <p className="status-description37">
              {event.featured ? 'This is a featured event' : 'Regular event'}
            </p>
          </div>

          <h2 className="section-title37">Event Details</h2>
          <div className="event-info-section37">
            <div className="info-card37">
              <FaCalendarAlt className="info-icon37" />
              <div className="info-type37">Date</div>
              <div className="info-value37">
                <div>Start: {formatDate(event.startDate)}</div>
                <div>End: {formatDate(event.endDate)}</div>
              </div>
            </div>

            <div className="info-card37">
              <FaClock className="info-icon37" />
              <div className="info-type37">Time</div>
              <div className="info-value37">
                <div>Start: {event.startTime}</div>
                <div>End: {event.endTime}</div>
              </div>
            </div>

            <div className="info-card37">
              <FaMapMarkerAlt className="info-icon37" />
              <div className="info-type37">Location</div>
              <div className="info-value37">{event.location}</div>
            </div>

            <div className="info-card37">
              <FaUserTie className="info-icon37" />
              <div className="info-type37">Organizer</div>
              <div className="info-value37">{event.organizer}</div>
            </div>

            <div className="info-card37">
              <FaCrown className="info-icon37" />
              <div className="info-type37">VIP Seats</div>
              <div className="info-value37">{event.capacity.vip}</div>
              <div className="info-price37">
                {!event.isFreeEvent && `Price: ${convertPrice(event.ticketPrice.vip.toString())}`}
              </div>
            </div>

            <div className="info-card37">
              <FaUsers className="info-icon37" />
              <div className="info-type37">General Seats</div>
              <div className="info-value37">{event.capacity.general}</div>
              <div className="info-price37">
                {!event.isFreeEvent && `Price: ${convertPrice(event.ticketPrice.general.toString())}`}
              </div>
            </div>
          </div>

  

          <div className="event-description37">
            <h2>Description</h2>
            <p>{event.description}</p>
          </div>

          {event.featuredStars.length > 0 && (
            <div className="featured-stars37">
              <h2 className="section-title37">Featured Stars</h2>
              <div className="stars-grid37">
                {event.featuredStars.map((star, index) => (
                  <div key={index} className="star-card37">
                    <FaStar className="star-icon37" />
                    <div className="star-name37">{star.name}</div>
                    <div className="star-role37">{star.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.highlights.length > 0 && (
            <div className="highlights-section37">
              <h2 className="section-title37">Highlights</h2>
              <ul className="highlights-list37">
                {event.highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {event.requirements.length > 0 && (
            <div className="requirements-section37">
              <h2 className="section-title37">Requirements</h2>
              <ul className="requirements-list37">
                {event.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {event.schedule.length > 0 && (
            <div className="schedule-section37">
              <h2 className="section-title37">Schedule</h2>
              <table className="schedule-table37">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {event.schedule.map((item, index) => (
                    <tr key={index}>
                      <td className="schedule-day-cell37">{item.day}</td>
                      <td className="schedule-time-cell37">{item.time}</td>
                      <td className="schedule-activity-cell37">{item.activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="contact-section37">
            <h2 className="section-title37">Contact Information</h2>
            <div className="contact-grid37">
              <div className="contact-card37">
                <div className="contact-icon37">
                  <FaPhone />
                </div>
                <div className="contact-type37">Phone</div>
                <div className="contact-value37">{event.contactInfo.phone}</div>
              </div>
              <div className="contact-card37">
                <div className="contact-icon37">
                  <FaEnvelope />
                </div>
                <div className="contact-type37">Email</div>
                <div className="contact-value37">{event.contactInfo.email}</div>
              </div>
              <div className="contact-card37">
                <div className="contact-icon37">
                  <FaGlobe />
                </div>
                <div className="contact-type37">Website</div>
                <div className="contact-value37">{event.contactInfo.website}</div>
              </div>
            </div>
          </div>

          {event.tags.length > 0 && (
            <div className="tags-section37">
              <h2 className="section-title37">Tags</h2>
              <div className="tags-list37">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag37">
                    <FaHashtag className="tag-icon37" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add Reviews Section */}
          <div className="reviews-section37">
            <h2 className="section-title37">Reviews & Ratings</h2>
            <div className="rating-summary37">
              <div className="average-rating37">
                <span className="rating-number37">{event.averageRating?.toFixed(1) || '0.0'}</span>
                <div className="stars-container37">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className={`star ${index < Math.round(event.averageRating || 0) ? 'filled' : 'empty'}`}
                      style={{
                        color: index < Math.round(event.averageRating || 0) ? '#ffd700' : '#e0e0e0',
                        marginRight: '2px'
                      }}
                    />
                  ))}
                </div>
                <span className="total-reviews37">{event.totalReviews || 0} reviews</span>
              </div>
            </div>
            
            <div className="reviews-list37">
              {event.reviews && event.reviews.length > 0 ? (
                event.reviews.map((review, index) => (
                  <div key={index} className="review-card37">
                    <div className="review-card-header37">
                      <div className="reviewer-info37">
                        <h3>{renderUserInfo(review)}</h3>
                        <span className="review-date37">{new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="review-rating37">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`star ${i < review.rating ? 'filled' : 'empty'}`}
                            style={{
                              color: i < review.rating ? '#ffd700' : '#e0e0e0',
                              marginRight: '2px'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-text37">{review.review}</p>
                    {review.bookingDetails && (
                      <div className="review-details37">
                        <span>Booking ID: {review.bookingId || 'N/A'}</span>
                        <span>Category: {review.bookingDetails?.category || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-reviews37">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          <div className="action-buttons37">
            <button 
              className="back-button37" 
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft style={{ fontSize: '20px' }} /> Back to Events
            </button>
            {isEventBookable() ? (
              <button 
                className="book-button37"
                onClick={handleBooking}
              >
                <FaTicketAlt style={{ fontSize: '20px' }} />
                Book Now
              </button>
            ) : (
              <button 
                className="book-button37"
                disabled={true}
              >
                <FaTicketAlt style={{ fontSize: '20px' }} />
                {getEventStatus() === 'Past' ? 'Event Ended' : 'Not Available'}
              </button>
            )}
          </div>
        </div>

        {/* Event Booking Form Modal */}
        {showBookingForm && event && (
          <EventBookingForm
            eventDetails={event}
            onSubmit={handleBookingSubmit}
            onCancel={() => setShowBookingForm(false)}
          />
        )}
      </div>
      <Footer />
      <ToastContainer />
    </>
  );
} 