import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './Bookings.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
   faDownload, faCalendarAlt, faCreditCard, 
  faUser, faEnvelope, faPhone, faMapMarkerAlt, 
  faEdit,  faTicketAlt, 
  faHashtag, faListUl, faCrown, faUsers, faLocationDot, faClock,
  faMoneyBill, faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import VerificationCheck from '../../../../Components/VerificationCheck';


export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [heading, setHeading] = useState("Loading bookings...");
  const [editingBooking, setEditingBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const ticketRefs = useRef({});
  const [currentGuideId, setCurrentGuideId] = useState(null);

  useEffect(() => {
    // Get current guide ID from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      setCurrentGuideId(user.id);
    } else if (user && user._id) {
      setCurrentGuideId(user._id);
    }
    
    fetchBookings();
  }, []);

  useEffect(() => {
    filterAndSortBookings();
  }, [query, filterStatus, sortOrder, bookings, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Fetch all bookings
      const response = await axios.get(`http://localhost:4000/payments/all-bookings`);
      
      if (response.data.success) {
        // Get the current guide's ID if not already set
        let guideId = currentGuideId;
        if (!guideId) {
          if (user && user.id) {
            guideId = user.id;
            setCurrentGuideId(user.id);
          } else if (user && user._id) {
            guideId = user._id;
            setCurrentGuideId(user._id);
          }
        }

        // Filter bookings based on guideId
        let filteredBookings = [];
        
        if (guideId) {
          console.log("Filtering bookings for guide ID:", guideId);

          filteredBookings = response.data.bookings.filter(booking => {
            // Get package details and determine if it's a trip
            const packageDetails = booking.paymentDetails?.packageDetails || {};
            const category = (packageDetails.category || '').toLowerCase();
            const isTrip = category.includes('short trip') || category.includes('long trip');
            
            // Case 1: Booking has no guide assigned (guideId is undefined/null)
            if (!booking.guideId) {
              console.log(`Booking ${booking.bookingId}, ${booking.packageName}: No guide assigned, showing to all guides`);
              return true; // Show to all guides
            }
            
            // Convert both IDs to strings for comparison to avoid type issues
            const bookingGuideId = String(booking.guideId);
            const currentId = String(guideId);
            
            // Debug trip bookings specifically
            if (isTrip) {
              console.log(`TRIP BOOKING: ${booking.packageName}, guideId=${bookingGuideId}, currentGuideId=${currentId}, match=${bookingGuideId === currentId}`);
              
              // Additional debugging for trip guide details
              if (booking.tripGuideDetails) {
                console.log(`Trip guide details found: name=${booking.tripGuideDetails.guideName}, email=${booking.tripGuideDetails.guideEmail}`);
              }
            }
            
            // Case 2: Booking is assigned to this guide
            const isAssigned = bookingGuideId === currentId;
            if (isAssigned) {
              console.log(`Booking ${booking.bookingId}, ${booking.packageName}: Assigned to current guide (${bookingGuideId} === ${currentId})`);
              return true;
            } else {
              console.log(`Booking ${booking.bookingId}, ${booking.packageName}: Not assigned to current guide (${bookingGuideId} !== ${currentId})`);
              return false;
            }
          });
        } else {
          // If no guide ID found, show all bookings (admin view)
          filteredBookings = response.data.bookings;
        }
        
        setBookings(filteredBookings);
        setHeading(`Displaying ${filteredBookings.length} bookings:`);
      } else {
        toast.error('Failed to load booking history');
        setBookings([]);
        setHeading("Error loading bookings.");
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load booking history');
      setHeading("Error loading bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let results = [...bookings];

    // Apply search filter
    if (query) {
      results = results.filter(booking =>
        booking.packageName.toLowerCase().includes(query.toLowerCase()) ||
        booking.bookingId.toLowerCase().includes(query.toLowerCase()) ||
        (booking.paymentDetails?.userDetails?.name || '').toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      results = results.filter(booking =>
        booking.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Apply tab filter
    switch(activeTab) {
      case 'packages':
        results = results.filter(booking => {
          const packageDetails = booking.paymentDetails?.packageDetails || {};
          
          // If it has event times, it's not a package
          if (packageDetails.startTime && packageDetails.endTime) {
            return false;
          }
          
          // If the category contains "trip", it's not a package
          const category = (packageDetails.category || '').toLowerCase();
          if (category.includes('short trip') || category.includes('long trip')) {
            return false;
          }
          
          // Everything else with a category is a package
          return true;
        });
        break;
      case 'trips':
        results = results.filter(booking => {
          const packageDetails = booking.paymentDetails?.packageDetails || {};
          const category = (packageDetails.category || '').toLowerCase();
          
          // It's a trip if the category contains "trip"
          return category.includes('short trip') || category.includes('long trip');
        });
        break;
      case 'events':
        results = results.filter(booking => {
          const packageDetails = booking.paymentDetails?.packageDetails || {};
          
          // It's an event if it has start and end times
          return packageDetails.startTime && packageDetails.endTime;
        });
        break;
      default:
        // 'all' tab - no additional filtering needed
        break;
    }

    // Apply sorting
    results.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.bookingDate) - new Date(a.bookingDate);
      } else {
        return new Date(a.bookingDate) - new Date(b.bookingDate);
      }
    });

    setFilteredBookings(results);
    
    const categoryName = activeTab !== 'all' ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : '';
    setHeading(
      results.length > 0
        ? `${results.length} ${categoryName} Booking${results.length !== 1 ? 's' : ''} Found`
        : `No ${categoryName} Bookings Found`
    );
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (packageDetails) => {
    if (packageDetails.startDate && packageDetails.endDate) {
      const startDate = formatDate(packageDetails.startDate);
      const endDate = formatDate(packageDetails.endDate);
      return `${startDate} to ${endDate}`;
    }
    
    if (packageDetails.duration && typeof packageDetails.duration === 'string') {
      if (packageDetails.duration.toLowerCase().includes('day')) {
        return packageDetails.duration;
      }
      if (packageDetails.duration.includes(' to ')) {
        const [start, end] = packageDetails.duration.split(' to ');
        return `${formatDate(start)} to ${formatDate(end)}`;
      }
    }
    
    return 'N/A';
  };

  // Export booking history
  const exportBookingHistory = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Booking ID,Package Name,Customer Name,Email,Phone,Booking Date,Status,Amount,Payment Status\n" +
      bookings.map(booking => {
        const paymentDetails = booking.paymentDetails || {};
        const userDetails = paymentDetails.userDetails || {};
        return `${booking.bookingId},${booking.packageName},${userDetails.name || 'N/A'},${userDetails.email || 'N/A'},${userDetails.phone || 'N/A'},${formatDate(booking.bookingDate)},${booking.status},${booking.amount},${paymentDetails.status || 'Pending'}`
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "booking_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Booking history exported successfully!");
  };

  // Function to update booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:4000/payments/update-status/${bookingId}`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setBookings(bookings.map(booking => {
          if (booking.bookingId === bookingId) {
            return {
              ...booking,
              status: newStatus,
              paymentDetails: {
                ...booking.paymentDetails,
                status: newStatus.toLowerCase() === 'completed' ? 'success' : 
                       newStatus.toLowerCase() === 'cancelled' ? 'failed' : 'pending'
              }
            };
          }
          return booking;
        }));
        
        setEditingBooking(null);
        toast.success('Status updated successfully');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderBookingCard = (booking) => {
    const paymentDetails = booking.paymentDetails || {};
    const userDetails = paymentDetails.userDetails || {};
    const packageDetails = paymentDetails.packageDetails || {};
    const ticketDetails = booking.ticketDetails || {};
    
    // Determine if this is an event
    const isEvent = packageDetails.startTime && packageDetails.endTime;
    
    // Extract dates from duration if start/end dates are missing
    let startDate = packageDetails.startDate;
    let endDate = packageDetails.endDate;
    
    // If start/end dates are missing but we have a duration string that might contain dates
    if ((!startDate || !endDate) && packageDetails.duration && typeof packageDetails.duration === 'string') {
      // Check for date range format: "Month DD, YYYY to Month DD, YYYY"
      const dateRangeMatch = packageDetails.duration.match(/([A-Za-z]+\s\d{1,2},\s\d{4})\sto\s([A-Za-z]+\s\d{1,2},\s\d{4})/);
      if (dateRangeMatch) {
        if (!startDate) startDate = new Date(dateRangeMatch[1]);
        if (!endDate) endDate = new Date(dateRangeMatch[2]);
      } else if (!startDate && booking.bookingDate) {
        // Use booking date as fallback for start date
        startDate = booking.bookingDate;
        
        // If we have a duration in days format (e.g., "7 days"), calculate end date
        const daysDurationMatch = packageDetails.duration.match(/(\d+)\s*days?/i);
        if (daysDurationMatch && !endDate) {
          const daysToAdd = parseInt(daysDurationMatch[1], 10);
          const calculatedEndDate = new Date(new Date(startDate).getTime());
          calculatedEndDate.setDate(calculatedEndDate.getDate() + daysToAdd - 1);
          endDate = calculatedEndDate;
        }
      }
    }
    
    // Calculate duration for events in days
    let duration;
    if (isEvent) {
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Normalize dates to remove time component
        const startYear = startDateObj.getFullYear();
        const startMonth = startDateObj.getMonth();
        const startDay = startDateObj.getDate();
        
        const endYear = endDateObj.getFullYear();
        const endMonth = endDateObj.getMonth();
        const endDay = endDateObj.getDate();
        
        // Create new Date objects with only the date portion
        const startDateOnly = new Date(startYear, startMonth, startDay);
        const endDateOnly = new Date(endYear, endMonth, endDay);
        
        // Calculate the difference in days
        const diffTime = Math.abs(endDateOnly - startDateOnly);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        // The actual number of days is diff + 1 (inclusive of both start and end dates)
        const totalDays = diffDays + 1;
        duration = `${totalDays} day${totalDays > 1 ? 's' : ''}`;
      } else {
        duration = "1 day"; // Default for events without clear dates
      }
    } else {
      // For packages and trips, use the database value
      duration = packageDetails.duration || 'N/A';
    }

    // Check if booking is specifically assigned to the current guide
    const isAssignedToCurrentGuide = booking.guideId && currentGuideId && 
                                   String(booking.guideId) === String(currentGuideId);

    // Determine if this is a trip based on category
    const isTripBooking = packageDetails.category && 
                        packageDetails.category.toLowerCase().includes('trip');

    return (
      <div key={booking.bookingId} className="booking-card" ref={el => ticketRefs.current[booking.bookingId] = el}>
        <div className="booking-header">
          <h3>{booking.packageName}</h3>
          {editingBooking === booking.bookingId ? (
            <div className="status-edit">
              <select
                value={booking.status}
                onChange={(e) => updateBookingStatus(booking.bookingId, e.target.value)}
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => setEditingBooking(null)} className="cancel-edit">
                Cancel
              </button>
            </div>
          ) : (
            <div className="booking-header-right">
              {isAssignedToCurrentGuide && (
                <span className="guide-assigned-tag">Assigned to You</span>
              )}
              {isTripBooking && (
                <span className="trip-booking-tag">Trip</span>
              )}
              <span className={`status-badge ${booking.status.toLowerCase()}`}>
                {booking.status}
              </span>
            </div>
          )}
        </div>

        <div className="booking-details">
          <div className="detail-group">
            <label>Booking Details</label>
            <span>
              <FontAwesomeIcon icon={faHashtag} className="icon-margin" />
              Booking ID: {booking.bookingId}
            </span>
            <span>
              <FontAwesomeIcon icon={faCalendarAlt} className="icon-margin" />
              Duration: {duration}
            </span>
            <span>
              <FontAwesomeIcon icon={faListUl} className="icon-margin" />
              Category: {packageDetails.category || 'N/A'}
            </span>
            <span>
              <FontAwesomeIcon icon={faCalendarAlt} className="icon-margin" />
              Start Date: {startDate ? formatDate(startDate) : 'N/A'}
            </span>
            <span>
              <FontAwesomeIcon icon={faCalendarAlt} className="icon-margin" />
              End Date: {endDate ? formatDate(endDate) : 'N/A'}
            </span>
            {isEvent ? (
              <span>
                <FontAwesomeIcon icon={faClock} className="icon-margin" />
                Event Time: {packageDetails.startTime || 'N/A'} - {packageDetails.endTime || 'N/A'}
              </span>
            ) : null}
            <span>
              <FontAwesomeIcon icon={faLocationDot} className="icon-margin" />
              {isEvent ? `Location: ${packageDetails.location || 'N/A'}` : `Destinations: ${packageDetails.destinations || 'N/A'}`}
            </span>
          </div>

          <div className="detail-group">
            <label>Customer Details</label>
            <span>
              <FontAwesomeIcon icon={faUser} className="icon-margin" />
              {userDetails.name || 'N/A'}
            </span>
            <span>
              <FontAwesomeIcon icon={faEnvelope} className="icon-margin" />
              {userDetails.email || 'N/A'}
            </span>
            <span>
              <FontAwesomeIcon icon={faPhone} className="icon-margin" />
              {userDetails.phone || 'N/A'}
            </span>
            <span>
              <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-margin" />
              {userDetails.address || 'N/A'}
            </span>
          </div>

          <div className="detail-group">
            <label>Payment Details</label>
            <span>
              <FontAwesomeIcon icon={faMoneyBill} className="icon-margin" />
              Amount: {formatAmount(booking.amount)}
            </span>
            <span>
              <FontAwesomeIcon icon={faCreditCard} className="icon-margin" />
              Payment Method: {paymentDetails.paymentGateway || 'N/A'}
            </span>
            <span className={`payment-status ${(paymentDetails.status || 'pending').toLowerCase()}`}>
              <FontAwesomeIcon icon={faCircleCheck} className="icon-margin" />
              Payment Status: {paymentDetails.status || 'Pending'}
            </span>
          </div>
        </div>

        <div className="booking-actions">
          <button 
            onClick={() => setEditingBooking(booking.bookingId)}
            className="action-btn edit-btn"
          >
            <FontAwesomeIcon icon={faEdit} /> Update Status
          </button>
        </div>
      </div>
    );
  };

  return (
    <VerificationCheck>
      <div className="bookings-page">
        <div className="bookings-header">
          <h1>Booking Management</h1>
          <button className="export-btn" onClick={exportBookingHistory}>
            <FontAwesomeIcon icon={faDownload} /> Export History
          </button>
        </div>

        <div className="search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by package name, booking ID, or customer name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="booking-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Bookings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => handleTabChange('packages')}
          >
            Packages
          </button>
          <button 
            className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => handleTabChange('trips')}
          >
            Trips
          </button>
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
          >
            Events
          </button>
        </div>

        <div className="bookings-container">
          <h2>{heading}</h2>
          
          {loading ? (
            <div className="loading">Loading bookings...</div>
          ) : filteredBookings.length > 0 ? (
            <div className="bookings-list">
              {filteredBookings.map(booking => renderBookingCard(booking))}
            </div>
          ) : (
            <div className="no-bookings">
              <p>No bookings found.</p>
            </div>
          )}
        </div>
      </div>
    </VerificationCheck>
  );
} 