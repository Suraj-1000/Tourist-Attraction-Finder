import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import { CurrencyContext } from "../../../config/CurrencyContext";
import { 
  FaMapMarkerAlt, FaCalendarAlt, FaUserTie, FaTicketAlt, 
  FaArrowLeft, FaStar, FaUsers, FaPhone, FaEnvelope, 
  FaGlobe, FaClock, FaListUl, FaClipboardList, FaCalendarDay,
  FaCheckCircle, FaExclamationCircle, FaHashtag, FaCrown
} from 'react-icons/fa';
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import EventBookingForm from '../../Payment/EventBookingForm';
import "./EventDetails.css";

export default function EventDetails() {
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
      const response = await axios.get(`http://localhost:4000/adminEvents/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error("Failed to fetch event details:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
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
    if (!user) {
      toast.error("Please log in to book tickets", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message58'
      });
      return;
    }
    setShowBookingForm(true);
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
        className: 'toast-message58'
      });
      
      setShowBookingForm(false);
    } catch (error) {
      console.error("Failed to update event capacity:", error);
      toast.error("Failed to update ticket availability", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message58'
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }


  return (
    <>
      <Header />
      <div className="main-container58">
        <div className="event-detail-container58">
          <div className="event-header58">
            <img 
              src={event.image || "/images/default-event.png"} 
              alt={event.name} 
              className="event-detail-image58"
            />
            <h1 className="event-title58">{event.name}</h1>
            <div className="event-meta58">
              <span className="event-category58">{event.category}</span>
            </div>
          </div>

          <div className="status-card58">
            <h3 className="status-title58">Event Status</h3>
            <div className="status-value58" style={{ color: getEventStatus() === 'Ongoing' ? '#007bff' : 'inherit' }}>
              {getEventStatus()}
            </div>
            <p className="status-description58">
              {event.featured ? 'This is a featured event' : 'Regular event'}
            </p>
          </div>

          <h2 className="section-title58">Event Details</h2>
          <div className="event-info-section58">
            <div className="info-card58">
              <FaCalendarAlt className="info-icon58" />
              <div className="info-type58">Date</div>
              <div className="info-value58">
                <div>Start: {formatDate(event.startDate)}</div>
                <div>End: {formatDate(event.endDate)}</div>
              </div>
            </div>

            <div className="info-card58">
              <FaClock className="info-icon58" />
              <div className="info-type58">Time</div>
              <div className="info-value58">
                <div>Start: {event.startTime}</div>
                <div>End: {event.endTime}</div>
              </div>
            </div>

            <div className="info-card58">
              <FaMapMarkerAlt className="info-icon58" />
              <div className="info-type58">Location</div>
              <div className="info-value58">{event.location}</div>
            </div>

            <div className="info-card58">
              <FaUserTie className="info-icon58" />
              <div className="info-type58">Organizer</div>
              <div className="info-value58">{event.organizer}</div>
            </div>

            <div className="info-card58">
              <FaCrown className="info-icon58" />
              <div className="info-type58">VIP Seats</div>
              <div className="info-value58">{event.capacity.vip}</div>
              <div className="info-price58">
                {!event.isFreeEvent && `Price: ${convertPrice(event.ticketPrice.vip.toString())}`}
              </div>
            </div>

            <div className="info-card58">
              <FaUsers className="info-icon58" />
              <div className="info-type58">General Seats</div>
              <div className="info-value58">{event.capacity.general}</div>
              <div className="info-price58">
                {!event.isFreeEvent && `Price: ${convertPrice(event.ticketPrice.general.toString())}`}
              </div>
            </div>
          </div>

  

          <div className="event-description58">
            <h2>Description</h2>
            <p>{event.description}</p>
          </div>

          {event.featuredStars.length > 0 && (
            <div className="featured-stars58">
              <h2 className="section-title58">Featured Stars</h2>
              <div className="stars-grid58">
                {event.featuredStars.map((star, index) => (
                  <div key={index} className="star-card58">
                    <FaStar className="star-icon58" />
                    <div className="star-name58">{star.name}</div>
                    <div className="star-role58">{star.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.highlights.length > 0 && (
            <div className="highlights-section58">
              <h2 className="section-title58">Highlights</h2>
              <ul className="highlights-list58">
                {event.highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {event.requirements.length > 0 && (
            <div className="requirements-section58">
              <h2 className="section-title58">Requirements</h2>
              <ul className="requirements-list58">
                {event.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {event.schedule.length > 0 && (
            <div className="schedule-section58">
              <h2 className="section-title58">Schedule</h2>
              <table className="schedule-table58">
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
                      <td className="schedule-day-cell58">{item.day}</td>
                      <td className="schedule-time-cell58">{item.time}</td>
                      <td className="schedule-activity-cell58">{item.activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="contact-section58">
            <h2 className="section-title58">Contact Information</h2>
            <div className="contact-grid58">
              <div className="contact-card58">
                <div className="contact-icon58">
                  <FaPhone />
                </div>
                <div className="contact-type58">Phone</div>
                <div className="contact-value58">{event.contactInfo.phone}</div>
              </div>
              <div className="contact-card58">
                <div className="contact-icon58">
                  <FaEnvelope />
                </div>
                <div className="contact-type58">Email</div>
                <div className="contact-value58">{event.contactInfo.email}</div>
              </div>
              <div className="contact-card58">
                <div className="contact-icon58">
                  <FaGlobe />
                </div>
                <div className="contact-type58">Website</div>
                <div className="contact-value58">{event.contactInfo.website}</div>
              </div>
            </div>
          </div>

          {event.tags.length > 0 && (
            <div className="tags-section58">
              <h2 className="section-title58">Tags</h2>
              <div className="tags-list58">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag58">
                    <FaHashtag className="tag-icon58" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="action-buttons58">
            <button 
              className="back-button58" 
              onClick={() => navigate('/Event-Based')}
            >
              <FaArrowLeft style={{ fontSize: '20px' }} /> Back to Events
            </button>
            {isEventBookable() ? (
              <button 
                className="book-button58"
                onClick={handleBooking}
              >
                <FaTicketAlt style={{ fontSize: '20px' }} />
                Book Now
              </button>
            ) : (
              <button 
                className="book-button58"
                disabled={true}
              >
                <FaTicketAlt style={{ fontSize: '20px' }} />
                {event.category === 'Religious' ? 'Religious Event - No Booking Required' : 
                 getEventStatus() === 'Past' ? 'Event Ended' : 'Not Available'}
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
    </>
  );
} 