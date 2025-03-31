import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../Components/Admin Header/Admin-Header';
import Footer from '../../../Components/Footer';
import './AdminBookingHistory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faCalendarAlt, faCreditCard, faUser, faEnvelope, faPhone, faMapMarkerAlt, faTrash, faEdit, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import * as ReactDOMClient from 'react-dom/client';

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

  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    filterAndSortBookings();
  }, [query, filterStatus, sortOrder, bookings]);

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

    // Apply sorting
    results.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.bookingDate) - new Date(a.bookingDate);
      } else {
        return new Date(a.bookingDate) - new Date(b.bookingDate);
      }
    });

    setFilteredBookings(results);
    setHeading(
      results.length > 0
        ? `${results.length} Results${query ? ` for "${query}"` : ''}`
        : "No results found."
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

  // Function to generate QR code data
  const generateQRData = (booking) => {
    const qrData = {
      ticketNo: booking.bookingId,
      packageName: booking.packageName,
      customerName: booking.paymentDetails?.userDetails?.name,
      status: booking.status,
      amount: booking.amount,
      paymentStatus: booking.paymentDetails?.status
    };
    return JSON.stringify(qrData);
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

  // Function to download ticket as PDF
  const downloadTicket = async (bookingId) => {
    const booking = filteredBookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    const paymentDetails = booking.paymentDetails || {};
    const userDetails = paymentDetails.userDetails || {};
    const packageDetails = paymentDetails.packageDetails || {};

    let container = null;
    let qrRoot = null;

    try {
      // Create container element
      container = document.createElement('div');
      container.style.cssText = `
        width: 595px;
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        position: fixed;
        left: -9999px;
        top: 0;
      `;
      document.body.appendChild(container);

      // Create ticket content
      const ticketContent = document.createElement('div');
      ticketContent.innerHTML = `
        <div style="width: 100%; background: white;">
          <!-- Header with Logo -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; padding: 15px; border: 2px solid #000; border-radius: 50%; width: 120px; height: 120px;">
              <img src="/images/Logo.png" alt="Explore Nepal Logo" style="width: 90px; height: 90px; object-fit: contain;" onerror="this.onerror=null; this.src='/images/logo.png';" />
            </div>
            <p style="color: #666; font-size: 18px; margin: 15px 0;">
              Your Gateway to Adventure in Nepal - Discover, Experience, and Explore the Beauty of Nepal
            </p>
          </div>

          <!-- Package Title and Status -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4a69bd; font-size: 32px; margin: 0 0 15px 0; font-weight: bold;">
              ${booking.packageName}
            </h1>
            <div style="display: inline-block; padding: 8px 20px; border-radius: 20px; background-color: ${
              booking.status.toLowerCase() === 'completed' ? '#28a745' :
              booking.status.toLowerCase() === 'cancelled' ? '#dc3545' : '#ffc107'
            }; color: white; font-weight: bold; font-size: 20px; text-transform: capitalize;">
              ${booking.status}
            </div>
          </div>

          <!-- Booking Details -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4a69bd; font-size: 24px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #4a69bd;">
              Booking Details
            </h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td style="padding: 10px 0; width: 40%;"><strong>Booking ID:</strong></td>
                  <td style="padding: 10px 0;">${booking.bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Travel Date:</strong></td>
                  <td style="padding: 10px 0;">${formatDate(booking.bookingDate)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Duration:</strong></td>
                  <td style="padding: 10px 0;">${formatDuration(packageDetails)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Category:</strong></td>
                  <td style="padding: 10px 0;">${packageDetails.category || 'N/A'}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Customer Details -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4a69bd; font-size: 24px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #4a69bd;">
              Customer Details
            </h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td style="padding: 10px 0; width: 40%;"><strong>Full Name:</strong></td>
                  <td style="padding: 10px 0;">${userDetails.name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0;">${userDetails.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Phone:</strong></td>
                  <td style="padding: 10px 0;">${userDetails.phone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Address:</strong></td>
                  <td style="padding: 10px 0;">${userDetails.address || 'N/A'}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Package Details -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4a69bd; font-size: 24px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #4a69bd;">
              Package Details
            </h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td style="padding: 10px 0; width: 40%;"><strong>Package Name:</strong></td>
                  <td style="padding: 10px 0;">${booking.packageName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Base Price:</strong></td>
                  <td style="padding: 10px 0;">${formatAmount(packageDetails.price || 0)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Description:</strong></td>
                  <td style="padding: 10px 0;">${packageDetails.description || 'Experience the beauty and adventure of Nepal.'}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Payment Details -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #4a69bd; font-size: 24px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #4a69bd;">
              Payment Details
            </h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td style="padding: 10px 0; width: 40%;"><strong>Total Amount:</strong></td>
                  <td style="padding: 10px 0;">${formatAmount(booking.amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Payment Gateway:</strong></td>
                  <td style="padding: 10px 0; text-transform: capitalize;">${paymentDetails.paymentGateway || booking.paymentMethod || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 10px 0;">${paymentDetails.transactionId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Payment Status:</strong></td>
                  <td style="padding: 10px 0;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 15px; background-color: ${
                      paymentDetails.status === 'success' ? '#28a745' :
                      paymentDetails.status === 'failed' ? '#dc3545' : '#ffc107'
                    }; color: white; font-weight: bold; font-size: 16px; text-transform: capitalize;">
                      ${paymentDetails.status || 'Pending'}
                    </span>
                  </td>
                </tr>
                ${paymentDetails.paymentDate ? `
                  <tr>
                    <td style="padding: 10px 0;"><strong>Payment Date:</strong></td>
                    <td style="padding: 10px 0;">${formatDate(paymentDetails.paymentDate)}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; margin: 50px 0;">
            <div id="qr-code" style="display: inline-block; padding: 0; margin-bottom: 20px;">
              <!-- QR code will be rendered here -->
            </div>
            <p style="color: #666; font-size: 18px; font-weight: 500; margin: 0;">Scan QR code to verify ticket</p>
          </div>

          <!-- Signature -->
          <div style="text-align: right; margin: 30px 0; padding-right: 30px;">
            <img src="/images/sign.png" alt="Authorized Signature" style="height: 80px; margin-bottom: 10px; display: inline-block;" />
            <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">Authorized Signature</p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 16px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 5px 0;">Thank you for choosing Explore Nepal</p>
            <p style="margin: 5px 0;">For any queries, please contact us at: support@explorenepal.com</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Explore Nepal. All rights reserved.</p>
          </div>
        </div>
      `;

      container.appendChild(ticketContent);

      // Add QR code
      const qrContainer = container.querySelector('#qr-code');
      qrRoot = ReactDOMClient.createRoot(qrContainer);

      // Create comprehensive QR code data
      const qrData = {
        booking: {
          id: booking.bookingId,
          packageName: booking.packageName,
          status: booking.status,
          amount: booking.amount,
          duration: packageDetails.duration,
          category: packageDetails.category,
          travelDate: booking.bookingDate,
          createdAt: booking.createdAt || booking.bookingDate,
          updatedAt: booking.updatedAt || booking.bookingDate
        },
        package: {
          name: booking.packageName,
          category: packageDetails.category || 'N/A',
          duration: packageDetails.duration || 'N/A',
          price: formatAmount(packageDetails.price || 0),
          description: packageDetails.description || 'N/A'
        },
        customer: {
          name: userDetails.name || 'N/A',
          email: userDetails.email || 'N/A',
          phone: userDetails.phone || 'N/A',
          address: userDetails.address || 'N/A'
        },
        payment: {
          status: paymentDetails.status || 'pending',
          gateway: paymentDetails.paymentGateway || booking.paymentMethod || 'N/A',
          transactionId: paymentDetails.transactionId || 'N/A',
          paymentDate: paymentDetails.paymentDate ? formatDate(paymentDetails.paymentDate) : 'N/A',
          amount: formatAmount(booking.amount)
        }
      };

      qrRoot.render(
        <QRCodeSVG
          value={JSON.stringify(qrData)}
          size={300}
          level="H"
          includeMargin={true}
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '100%',
            height: 'auto'
          }}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      );

      // Wait for QR code and images to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create PDF
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      // Convert the container to canvas with better settings
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 595,
        windowWidth: 595,
        height: container.offsetHeight,
        scrollY: -window.pageYOffset,
        imageTimeout: 15000,
        onclone: function(clonedDoc) {
          const clonedContainer = clonedDoc.querySelector('div');
          if (clonedContainer) {
            clonedContainer.style.position = 'static';
            clonedContainer.style.left = '0';
          }
        }
      });

      // Add the canvas to PDF with better quality
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pageHeight = 842; // A4 height in points
      const imgHeight = (canvas.height * 595) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, 595, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, 595, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`ticket-${bookingId}.pdf`);
      toast.success('Ticket downloaded successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      if (qrRoot) {
        try {
          qrRoot.unmount();
        } catch (e) {
          console.error('Error unmounting QR code:', e);
        }
      }
      if (container && container.parentNode) {
        try {
          document.body.removeChild(container);
        } catch (e) {
          console.error('Error removing container:', e);
        }
      }
    }
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
              {filteredBookings.map((booking) => {
                const paymentDetails = booking.paymentDetails || {};
                const userDetails = paymentDetails.userDetails || {};
                const packageDetails = paymentDetails.packageDetails || {};

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
                            <option value="all">All Status</option>
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
                          <span>Ticket No: {booking.bookingId}</span>
                          <span>Duration: {formatDuration(packageDetails)}</span>
                          <span>Category: {packageDetails.category || 'N/A'}</span>
                        </div>

                        <div className="detail-group38">
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

                        <div className="detail-group38">
                          <label>Payment Details</label>
                          <span>
                            <FontAwesomeIcon icon={faCreditCard} className="icon-margin" />
                            Total Price: {formatAmount(booking.amount)}
                          </span>
                        
                          <span>Gateway: {paymentDetails.paymentGateway || 'N/A'}</span>
                          <span className={`payment-status38 ${(paymentDetails.status || 'pending').toLowerCase()}`}>
                            Payment Status: {paymentDetails.status || 'Pending'}
                          </span>
                          {paymentDetails.paymentDate && (
                            <span>Paid on: {formatDate(paymentDetails.paymentDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ticket-actions38">
                      <button 
                        onClick={() => downloadTicket(booking.bookingId)}
                        className="action-btn38 download-btn38"
                      >
                        <FontAwesomeIcon icon={faDownload} /> Download Ticket
                      </button>
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
              })}
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