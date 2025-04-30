import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../Components/Admin Header/Admin-Header';
import Footer from '../../../Components/Footer/AuthFooter';
import './AdminBookingHistory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faCalendarAlt, faCreditCard, faUser, faEnvelope, faPhone, faMapMarkerAlt, faTrash, faEdit, faExclamationTriangle, faTicketAlt, faHashtag, faListUl, faCrown, faUsers, faClock, faCircleCheck, faMoneyBill } from '@fortawesome/free-solid-svg-icons';

export default function AdminBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [heading, setHeading] = useState("Loading bookings...");
  const [editingBooking, setEditingBooking] = useState(null);
  const ticketRefs = useRef({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBookingId, setDeleteBookingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    filterAndSortBookings();
  }, [query, filterStatus, sortOrder, bookings, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Fetch all bookings with payment details
      const response = await axios.get(`http://localhost:4000/payments/all-bookings`);
      
      if (response.data.success) {
        setBookings(response.data.bookings);
        setHeading(`Displaying ${response.data.bookings.length} bookings:`);
      } else {
        toast.error('Failed to load booking history');
        setBookings([]);
        setHeading("Error loading bookings.");
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load booking history');
      setHeading("Error loading bookings.");
      setLoading(false);
      setBookings([]); // Set empty array on error
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

  // Format date
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
    // Check if this is an event (has startDate and endDate)
    if (packageDetails.startDate && packageDetails.endDate) {
      const startDate = formatDate(packageDetails.startDate);
      const endDate = formatDate(packageDetails.endDate);
      return `${startDate} to ${endDate}`;
    }
    
    // Check if this is a package (has duration string)
    if (packageDetails.duration && typeof packageDetails.duration === 'string') {
      // If it's already in the format "X days", return as is
      if (packageDetails.duration.toLowerCase().includes('day')) {
        return packageDetails.duration;
      }
      // If it's in ISO format, convert to readable date range
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

  // Function to handle delete click
  const handleDeleteClick = (bookingId) => {
    setDeleteBookingId(bookingId);
    setShowDeleteModal(true);
  };

  // Function to handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteBookingId) {
      try {
        const response = await axios.delete(`http://localhost:4000/payments/delete-booking/${deleteBookingId}`);
        if (response.data.success) {
          setBookings(bookings.filter(booking => booking.bookingId !== deleteBookingId));
          toast.success('Booking deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking');
      }
    }
    setShowDeleteModal(false);
    setDeleteBookingId(null);
  };

  // Function to update booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      // First update the booking status
      const response = await axios.put(`http://localhost:4000/payments/update-status/${bookingId}`, {
        status: newStatus
      });
      
      if (response.data.success) {
        // Only create new payment record if status is cancelled and no payment record exists
        if (newStatus.toLowerCase() === 'cancelled') {
          const booking = bookings.find(b => b.bookingId === bookingId);
          if (booking && !booking.paymentDetails?.paymentDate) {
            // Create payment record only for cancelled status with no existing payment
            const paymentData = {
              productId: bookingId,
              amount: booking.amount,
              paymentGateway: booking.paymentDetails?.paymentGateway || 'manual',
              status: 'failed',
              paymentDate: new Date().toISOString()
            };

            // Create payment record
            await axios.post(`http://localhost:4000/payments/create-payment`, paymentData);
          }
        }

        // Update local state
        setBookings(bookings.map(booking => {
          if (booking.bookingId === bookingId) {
            let paymentStatus;
            switch(newStatus.toLowerCase()) {
              case 'completed':
                paymentStatus = 'success';
                break;
              case 'cancelled':
                paymentStatus = 'failed';
                break;
              case 'pending':
                paymentStatus = 'pending';
                break;
              default:
                paymentStatus = 'pending';
            }
            
            return {
              ...booking,
              status: newStatus,
              paymentDetails: {
                ...booking.paymentDetails,
                status: paymentStatus,
                paymentDate: newStatus.toLowerCase() === 'cancelled' && !booking.paymentDetails?.paymentDate ? 
                  new Date().toISOString() : booking.paymentDetails?.paymentDate
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
    // The filterAndSortBookings function will be called automatically through useEffect
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

    return (
      <div key={booking.bookingId} className="result-card38" ref={el => ticketRefs.current[booking.bookingId] = el}>
        <div className="ticket-header38">
          <h3 className="title38">{booking.packageName}</h3>
          {editingBooking === booking.bookingId ? (
            <div className="status-edit38">
              <select
                value={booking.status}
                onChange={(e) => updateBookingStatus(booking.bookingId, e.target.value)}
                className="status-select38"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => setEditingBooking(null)} className="cancel-edit38">
                Cancel
              </button>
            </div>
          ) : (
            <span className={`status-badge38 ${booking.status.toLowerCase()}`}>
              {booking.status}
            </span>
          )}
        </div>

        <div className="card-details38">
          <div className="booking-info38">
            <div className="detail-group38">
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
                <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-margin" />
                {isEvent ? `Location: ${packageDetails.location || 'N/A'}` : `Destinations: ${packageDetails.destinations || 'N/A'}`}
              </span>
            </div>

            <div className="detail-group38">
              <label>Customer Details</label>
              <span>
                <FontAwesomeIcon icon={faUser} className="icon-margin" />
                {userDetails.name || `${booking.userDetails?.firstName || ''} ${booking.userDetails?.lastName || ''}` || 'N/A'}
              </span>
              <span>
                <FontAwesomeIcon icon={faEnvelope} className="icon-margin" />
                {userDetails.email || booking.userDetails?.email || 'N/A'}
              </span>
              <span>
                <FontAwesomeIcon icon={faPhone} className="icon-margin" />
                {userDetails.phone || booking.userDetails?.phone || 'N/A'}
              </span>
              <span>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-margin" />
                {userDetails.address || booking.userDetails?.address || 'N/A'}
              </span>
            </div>

            {isEvent && ticketDetails && (ticketDetails.vipTickets?.quantity > 0 || ticketDetails.generalTickets?.quantity > 0) ? (
              <div className="detail-group38">
                <label>Ticket Details</label>
                {ticketDetails.vipTickets?.quantity > 0 ? (
                  <span>
                    <FontAwesomeIcon icon={faCrown} className="icon-margin" />
                    VIP Tickets: {ticketDetails.vipTickets.quantity} x NPR {ticketDetails.vipTickets.pricePerTicket} = NPR {ticketDetails.vipTickets.totalPrice}
                  </span>
                ) : null}
                {ticketDetails.generalTickets?.quantity > 0 ? (
                  <span>
                    <FontAwesomeIcon icon={faTicketAlt} className="icon-margin" />
                    General Tickets: {ticketDetails.generalTickets.quantity} x NPR {ticketDetails.generalTickets.pricePerTicket} = NPR {ticketDetails.generalTickets.totalPrice}
                  </span>
                ) : null}
                <span>
                  <FontAwesomeIcon icon={faUsers} className="icon-margin" />
                  Total Tickets: {ticketDetails.totalTickets || 0}
                </span>
              </div>
            ) : null}

            <div className="detail-group38">
              <label>Payment Details</label>
              <span>
                <FontAwesomeIcon icon={faMoneyBill} className="icon-margin" />
                Total Amount: {formatAmount(isEvent ? (ticketDetails.totalTicketPrice || booking.amount) : booking.amount)}
              </span>
              <span>
                <FontAwesomeIcon icon={faCreditCard} className="icon-margin" />
                Payment Method: {paymentDetails.paymentGateway || 'N/A'}</span>
              <span className={`payment-status38 ${(paymentDetails.status || 'pending').toLowerCase()}`}>
                <FontAwesomeIcon icon={faCircleCheck} className="icon-margin" />
                Payment Status: {paymentDetails.status || 'Pending'}
              </span>
              {paymentDetails.paymentDate && (
                <span>
                  <FontAwesomeIcon icon={faCalendarAlt} className="icon-margin" />
                  Paid on: {formatDate(paymentDetails.paymentDate)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="ticket-actions38">
          <button 
            onClick={() => setEditingBooking(booking.bookingId)}
            className="action-btn38 edit-btn38"
          >
            <FontAwesomeIcon icon={faEdit} /> Edit Status
          </button>
          <button 
            onClick={() => handleDeleteClick(booking.bookingId)}
            className="action-btn38 delete-btn38"
          >
            <FontAwesomeIcon icon={faTrash} /> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="main-container38">
        <div className="heading38">
          <h1 className="title-heading38">Booking History</h1>
          <p className="title-para38">Track and manage all your package bookings in one place.</p>
          <button className="add-btn38" onClick={exportBookingHistory}>
            Export History <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>

        <div className="search-container38">
          <div className="search-box38">
            <input
              className="search-location38"
              type="text"
              placeholder="Search by package name, booking ID, or customer name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="icon-search38" />
          </div>

          <div className="search-box38">
            <select
              className="search-category38"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="search-box38">
            <select
              className="search-category38"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="booking-nav38">
          <button 
            className={`booking-nav-item38 ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            <span>All Bookings</span>
          </button>
          <button 
            className={`booking-nav-item38 ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => handleTabChange('packages')}
          >
            <span>Packages</span>
          </button>
          <button 
            className={`booking-nav-item38 ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => handleTabChange('trips')}
          >
            <span>Trips</span>
          </button>
          <button 
            className={`booking-nav-item38 ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
          >
            <span>Events</span>
          </button>
        </div>

        <div className="search-results-container38">
          <div className="search-tabs38">
            <span style={{ textDecoration: "underline" }}>Available Bookings</span>
            <div className="filter-container38">
              <span>{filteredBookings.length} bookings found</span>
            </div>
          </div>

          <h2 className="search-heading38">{heading}</h2>

          {loading ? (
            <div className="loading-spinner38">Loading...</div>
          ) : filteredBookings.length > 0 ? (
            <div className="bookings-list38">
              {filteredBookings.map(booking => renderBookingCard(booking))}
            </div>
          ) : (
            <div className="no-results38">
              <p>No booking history found.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay38">
          <div className="delete-modal38">
            <div className="delete-modal-icon38">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this booking? This action cannot be undone.</p>
            <div className="delete-modal-buttons38">
              <button 
                className="delete-modal-button38 cancel38"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-modal-button38 confirm38"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 