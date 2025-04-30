import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../Components/User Header/User-Header';
import Footer from '../../../Components/Footer';
import './Booking-History.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faCalendarAlt, faCreditCard, faUser, faEnvelope, faPhone, faMapMarkerAlt, faTrash, faEdit, faExclamationTriangle, faTicketAlt, faHashtag, faListUl, faCrown, faUsers, faStar, faClock, faLocationDot, faMoneyBill, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import * as ReactDOMClient from 'react-dom/client';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [heading, setHeading] = useState("Loading bookings...");
  const [editingBooking, setEditingBooking] = useState(null);
  const ticketRefs = useRef({});
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const userString = localStorage.getItem('user');
        
        if (!userString) {
          toast.error('Please login to view your bookings');
          setLoading(false);
          setHeading("Please login to view your bookings");
          return;
        }

        let user;
        try {
          user = JSON.parse(userString);
        } catch (error) {
          console.error('Error parsing user data:', error);
          toast.error('Invalid user data. Please login again.');
          setLoading(false);
          setHeading("Please login again");
          return;
        }

        // Handle both id and _id formats
        const userId = user._id || user.id;
        if (!userId) {
          console.error('Invalid user data:', user);
          toast.error('User data is incomplete. Please login again.');
          setLoading(false);
          setHeading("Please login again");
          return;
        }

        console.log('Fetching bookings for user:', { userId, email: user.email });

        // Use user's ID to fetch bookings from the payments route
        const response = await axios.get(`http://localhost:4000/payments/user-bookings/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // No need to filter on frontend since backend is now handling it
          const userBookings = response.data.bookings;
          setBookings(userBookings);
          setHeading(`Your Booking History (${userBookings.length} bookings)`);
        } else {
          console.error('Failed to load bookings:', response.data);
          toast.error('Failed to load booking history');
          setBookings([]);
          setHeading("Error loading bookings.");
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          setHeading("Please login again");
        } else {
          toast.error('Failed to load booking history');
          setHeading("Error loading bookings.");
        }
        setBookings([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    filterAndSortBookings();
  }, [query, filterStatus, sortOrder, bookings, activeTab]);

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


  // Function to download ticket as PDF
  const downloadTicket = async (bookingId) => {
    const booking = filteredBookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    const paymentDetails = booking.paymentDetails || {};
    const userDetails = booking.userDetails || {};
    const packageDetails = paymentDetails.packageDetails || {};
    const ticketDetails = booking.ticketDetails || {};

    // Check if this is an event booking
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
    
    // Calculate the duration in days
    let calculatedDuration;
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
        calculatedDuration = `${totalDays} day${totalDays > 1 ? 's' : ''}`;
      } else {
        calculatedDuration = "1 day"; // Default for events without clear dates
      }
    } else {
      calculatedDuration = packageDetails.duration || 'N/A';
    }

    let container = null;
    let qrRoot = null;

    try {
      // Create separate containers for each page
      const page1Content = document.createElement('div');
      const page2Content = document.createElement('div');
      
      // First page content
      page1Content.innerHTML = `
        <div style="width: 100%; background: white; margin: 40px 40px 30px; padding: 0 20px;">
          <!-- Header with Logo -->
          <div style="text-align: center; margin-bottom: 10px; padding-top: 15px;">
            <img src="/images/pdf.png" alt="Explore Nepal Logo" style="width: 120px; height: 90px; object-fit: contain;" onerror="this.onerror=null; this.src='/images/logo.png';" />
            <p style="color: #666; font-size: 11px; margin: 5px 0; font-style: italic;">
              Your Gateway to Adventure in Nepal - Discover, Experience, and Explore the Beauty of Nepal
            </p>
          </div>

          <!-- Package Title and Status -->
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="color: #4a69bd; font-size: 20px; margin: 0 0 8px 0; font-weight: bold;">
              ${packageDetails.title || booking.packageName}
            </h1>
            <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; background-color: ${
              booking.status.toLowerCase() === 'completed' ? '#28a745' :
              booking.status.toLowerCase() === 'cancelled' ? '#dc3545' : '#ffc107'
            }; color: white; font-weight: bold; font-size: 11px; text-transform: capitalize;">
              ${booking.status}
            </div>
          </div>

          <!-- Main Content Wrapper -->
          <div style="padding: 0 15px;">
            <!-- Booking Details -->
            <div style="margin-bottom: 15px;">
              <h2 style="color: #4a69bd; font-size: 16px; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a69bd;">
                Booking Details
              </h2>
              <div style="background-color: #f8f9fa; padding: 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tr>
                    <td style="padding: 4px 0; width: 40%;"><strong>Booking ID:</strong></td>
                    <td style="padding: 4px 0;">${booking.bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Duration:</strong></td>
                    <td style="padding: 4px 0;">${calculatedDuration}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Category:</strong></td>
                    <td style="padding: 4px 0;">${packageDetails.category || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Start Date:</strong></td>
                    <td style="padding: 4px 0;">${startDate ? formatDate(startDate) : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>End Date:</strong></td>
                    <td style="padding: 4px 0;">${endDate ? formatDate(endDate) : 'N/A'}</td>
                  </tr>
                  ${isEvent ? `
                    <tr>
                      <td style="padding: 4px 0;"><strong>Event Time:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.startTime || 'N/A'} - ${packageDetails.endTime || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Location:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.location || 'N/A'}</td>
                    </tr>
                  ` : `
                    <tr>
                      <td style="padding: 4px 0;"><strong>Destinations:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.destinations || 'N/A'}</td>
                    </tr>
                  `}
                </table>
              </div>
            </div>

            <!-- Customer Details -->
            <div style="margin-bottom: 15px;">
              <h2 style="color: #4a69bd; font-size: 16px; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a69bd;">
                Customer Details
              </h2>
              <div style="background-color: #f8f9fa; padding: 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tr>
                    <td style="padding: 4px 0; width: 40%;"><strong>Full Name:</strong></td>
                    <td style="padding: 4px 0;">${userDetails.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Email:</strong></td>
                    <td style="padding: 4px 0;">${userDetails.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Phone:</strong></td>
                    <td style="padding: 4px 0;">${userDetails.phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Address:</strong></td>
                    <td style="padding: 4px 0;">${userDetails.address || 'N/A'}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            ${isEvent && ticketDetails && (ticketDetails.vipTickets?.quantity > 0 || ticketDetails.generalTickets?.quantity > 0) ? `
              <!-- Event Ticket Details -->
              <div style="margin-bottom: 20px;">
                <h2 style="color: #4a69bd; font-size: 16px; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a69bd;">
                  Ticket Details
                </h2>
                <div style="background-color: #f8f9fa; padding: 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    ${ticketDetails.vipTickets?.quantity > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; width: 40%;"><strong>VIP Tickets:</strong></td>
                        <td style="padding: 4px 0;">${ticketDetails.vipTickets.quantity} x NPR ${ticketDetails.vipTickets.pricePerTicket} = NPR ${ticketDetails.vipTickets.totalPrice}</td>
                      </tr>
                    ` : ''}
                    ${ticketDetails.generalTickets?.quantity > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; width: 40%;"><strong>General Tickets:</strong></td>
                        <td style="padding: 4px 0;">${ticketDetails.generalTickets.quantity} x NPR ${ticketDetails.generalTickets.pricePerTicket} = NPR ${ticketDetails.generalTickets.totalPrice}</td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 4px 0;"><strong>Total Tickets:</strong></td>
                      <td style="padding: 4px 0;">${ticketDetails.totalTickets || 0}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Total Amount:</strong></td>
                      <td style="padding: 4px 0;">NPR ${ticketDetails.totalTicketPrice || 0}</td>
                    </tr>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Second page content
      page2Content.innerHTML = `
        <div style="width: 100%; background: white; margin: 40px 40px 30px; padding: 0 20px;">
          <!-- Payment Details -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #4a69bd; font-size: 16px; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a69bd;">
              Payment Details
            </h2>
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <tr>
                  <td style="padding: 4px 0; width: 40%;"><strong>Total Amount:</strong></td>
                  <td style="padding: 4px 0;">NPR ${booking.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>Payment Gateway:</strong></td>
                  <td style="padding: 4px 0; text-transform: capitalize;">${paymentDetails.paymentGateway || booking.paymentMethod || 'Khalti'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 4px 0;">${paymentDetails.transactionId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>Payment Status:</strong></td>
                  <td style="padding: 4px 0;">
                    <span style="display: inline-block; padding: 2px 6px; border-radius: 10px; background-color: ${
                      paymentDetails.status === 'success' ? '#28a745' :
                      paymentDetails.status === 'failed' ? '#dc3545' : '#28a745'
                    }; color: white; font-weight: bold; font-size: 11px; text-transform: capitalize;">
                      Success
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>Payment Date:</strong></td>
                  <td style="padding: 4px 0;">${paymentDetails.paymentDate ? formatDate(paymentDetails.paymentDate) : 'April 20, 2025'}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; margin: 25px 0;">
            <div id="qr-code" style="display: inline-block; padding: 0; margin-bottom: 10px;">
              <!-- QR code will be rendered here -->
            </div>
            <p style="color: #666; font-size: 11px; font-weight: 500; margin: 0;">Scan QR code to verify ticket</p>
          </div>

          <!-- Signature -->
          <div style="text-align: right; margin: 30px 15px 20px; padding-right: 15px;">
            <img src="/images/sign.png" alt="Authorized Signature" style="height: 50px; margin-bottom: 3px; display: inline-block;" />
            <p style="margin: 2px 0; font-size: 10px; font-weight: bold;">Authorized Signature</p>
          </div>

          <!-- Footer -->
          <div style="margin: 30px 15px 0; text-align: center; color: #666; font-size: 10px; padding: 10px 0; border-top: 1px solid #eee;">
            <p style="margin: 2px 0;">Thank you for choosing Explore Nepal</p>
            <p style="margin: 2px 0;">For any queries, please contact us at: support@explorenepal.com</p>
            <p style="margin: 2px 0;">© ${new Date().getFullYear()} Explore Nepal. All rights reserved.</p>
          </div>
        </div>
      `;

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

      // Add pages to container
      container.appendChild(page1Content);
      container.appendChild(page2Content);

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

      // Create PDF with A4 dimensions
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      // Convert first page to canvas
      const canvas1 = await html2canvas(page1Content, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 595,
        windowWidth: 595,
        height: page1Content.offsetHeight,
        scrollY: -window.pageYOffset,
        imageTimeout: 15000
      });

      // Add first page to PDF
      const imgData1 = canvas1.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData1, 'JPEG', 0, 0, 595, (canvas1.height * 595) / canvas1.width);

      // Add new page
      pdf.addPage();

      // Convert second page to canvas
      const canvas2 = await html2canvas(page2Content, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 595,
        windowWidth: 595,
        height: page2Content.offsetHeight,
        scrollY: -window.pageYOffset,
        imageTimeout: 15000
      });

      // Add second page to PDF
      const imgData2 = canvas2.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData2, 'JPEG', 0, 0, 595, (canvas2.height * 595) / canvas2.width);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // The filterAndSortBookings function will be called automatically through useEffect
  };

  const handleReviewSubmit = async () => {
    try {
      if (!selectedBooking) {
        toast.error('No booking selected');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to submit a review');
        return;
      }

      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        toast.error('User data not found. Please login again.');
        return;
      }

      const userId = userData._id || userData.id;
      if (!userId) {
        toast.error('Invalid user data. Please login again.');
        return;
      }

      if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
        toast.error('Please select a rating between 1 and 5');
        return;
      }

      if (!reviewText.trim()) {
        toast.error('Please write a review');
        return;
      }

      // Create the review data with consistent structure for both packages and events
      const reviewData = {
        itemType: selectedBooking.itemType,
        itemName: selectedBooking.itemName,
        userId: userId,
        rating: reviewRating,
        review: reviewText.trim(),
        bookingId: selectedBooking.bookingId,
        bookingDetails: {
          category: selectedBooking.bookingDetails?.category || '',
          duration: selectedBooking.bookingDetails?.duration || '',
          amount: selectedBooking.bookingDetails?.amount || 0,
          status: selectedBooking.bookingDetails?.status || ''
        }
      };

      console.log('Submitting review data:', reviewData);

      const response = await axios.post('http://localhost:4000/reviews/submit', reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Review submitted successfully');
        
        // Update the local state to reflect the new review
        const updatedBookings = bookings.map(booking => {
          if (booking.bookingId === selectedBooking.bookingId) {
            return {
              ...booking,
              hasReview: true,
              review: {
                rating: reviewRating,
                review: reviewText,
                createdAt: new Date()
              }
            };
          }
          return booking;
        });
        
        setBookings(updatedBookings);
        setFilteredBookings(prevFiltered => 
          prevFiltered.map(booking => {
            if (booking.bookingId === selectedBooking.bookingId) {
              return {
                ...booking,
                hasReview: true,
                review: {
                  rating: reviewRating,
                  review: reviewText,
                  createdAt: new Date()
                }
              };
            }
            return booking;
          })
        );

        // Reset the form and close modal
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewText('');
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to submit review. Please try again.');
    }
  };

  const renderStarRating = (value, isInteractive = false) => {
    return (
      <div className="star-rating-container">
        {[...Array(5)].map((_, index) => (
          <FontAwesomeIcon
            key={index}
            icon={faStar}
            className={`star-icon ${isInteractive ? 'interactive' : ''}`}
            style={{
              color: index < (isInteractive ? hoverRating || rating : value) ? '#ffd700' : '#ccc',
              cursor: isInteractive ? 'pointer' : 'default',
              fontSize: '24px',
              marginRight: '5px'
            }}
            onClick={() => isInteractive && setRating(index + 1)}
            onMouseEnter={() => isInteractive && setHoverRating(index + 1)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  const isPaymentSuccessful = (booking) => {
    const paymentStatus = booking.paymentDetails?.status?.toLowerCase();
    return paymentStatus === 'success';
  };

  const renderBookingCard = (booking) => {
    const paymentDetails = booking.paymentDetails || {};
    const userDetails = booking.userDetails || {};
    const packageDetails = paymentDetails.packageDetails || {};
    const ticketDetails = booking.ticketDetails || {};
    
    // Determine if this is an event based on the presence of time fields
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
      <div key={booking.bookingId} className="result-card63" ref={el => ticketRefs.current[booking.bookingId] = el}>
        <div className="ticket-header63">
          <h3 className="title63">{booking.packageName}</h3>
          <span className={`status-badge63 ${booking.status.toLowerCase()}`}>
            {booking.status}
          </span>
        </div>

        <div className="card-details63">
          <div className="booking-info63">
            <div className="detail-group63">
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

            {isEvent && ticketDetails && (ticketDetails.vipTickets?.quantity > 0 || ticketDetails.generalTickets?.quantity > 0) ? (
              <div className="detail-group63">
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

            <div className="detail-group63">
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

            <div className="detail-group63">
              <label>Payment Details</label>
              <span>
                <FontAwesomeIcon icon={faMoneyBill} className="icon-margin" />
                Amount: {formatAmount(isEvent ? (ticketDetails.totalTicketPrice || booking.amount) : booking.amount)}
              </span>
              <span>
                <FontAwesomeIcon icon={faCreditCard} className="icon-margin" />
                Payment Method: {paymentDetails.paymentGateway || 'N/A'}
              </span>
              <span className={`payment-status63 ${(paymentDetails.status || 'pending').toLowerCase()}`}>
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

        <div className="ticket-actions63">
          <button 
            onClick={() => downloadTicket(booking.bookingId)}
            className={`action-btn63 download-btn63 ${booking.status.toLowerCase() !== 'completed' ? 'disabled' : ''}`}
            disabled={booking.status.toLowerCase() !== 'completed'}
            title={booking.status.toLowerCase() !== 'completed' ? 'Ticket can only be downloaded after booking is completed' : 'Download Ticket'}
          >
            <FontAwesomeIcon icon={faDownload} /> 
            {booking.status.toLowerCase() === 'completed' ? 'Download Ticket' : 'Pending Confirmation'}
          </button>
          {isPaymentSuccessful(booking) && (
            <button 
              onClick={() => {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (!userData) {
                  toast.error('Please login to submit a review');
                  return;
                }

                const userId = userData._id || userData.id;
                if (!userId) {
                  toast.error('Invalid user data. Please login again.');
                  return;
                }

                // Create review data with consistent structure
                const reviewData = {
                  itemType: isEvent ? 'event' : 
                           (packageDetails.category?.toLowerCase()?.includes('trip') ? 'trip' : 'package'),
                  itemName: packageDetails.title || booking.packageName,
                  userId: userId,
                  bookingId: booking.bookingId,
                  bookingDetails: {
                    category: packageDetails.category || booking.category || '',
                    duration: duration || '',
                    amount: booking.amount || 0,
                    status: booking.status || ''
                  }
                };

                setSelectedBooking(reviewData);
                setShowReviewModal(true);
                setReviewRating(0);
                setReviewText('');
              }}
              className="action-btn63 review-btn63"
              title={`Share your experience about this ${isEvent ? 'event' : 
                packageDetails.category?.toLowerCase()?.includes('trip') ? 'trip' : 'package'}`}
            >
              <FontAwesomeIcon icon={faStar} /> Review
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="main-container63">
        <div className="heading63">
          <h1 className="title-heading63">Booking History</h1>
          <p className="title-para63">Track and manage all your package bookings in one place.</p>
          <button className="add-btn63" onClick={exportBookingHistory}>
            Export History <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>

        <div className="search-container63">
          <div className="search-box63">
            <input
              className="search-location63"
              type="text"
              placeholder="Search by package name, booking ID, or customer name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="icon-search63" />
          </div>

          <div className="search-box63">
            <select
              className="search-category63"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="search-box63">
            <select
              className="search-category63"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="booking-nav63">
          <button 
            className={`booking-nav-item63 ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            <span>All Bookings</span>
          </button>
          <button 
            className={`booking-nav-item63 ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => handleTabChange('packages')}
          >
            <span>Packages</span>
          </button>
          <button 
            className={`booking-nav-item63 ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => handleTabChange('trips')}
          >
            <span>Trips</span>
          </button>
          <button 
            className={`booking-nav-item63 ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
          >
            <span>Events</span>
          </button>
        </div>

        <div className="search-results-container63">
          <div className="search-tabs63">
            <span style={{ textDecoration: "underline" }}>Available Bookings</span>
            <div className="filter-container63">
              <span>{filteredBookings.length} bookings found</span>
            </div>
          </div>

          <h2 className="search-heading63">{heading}</h2>

          {loading ? (
            <div className="loading-spinner63">Loading...</div>
          ) : filteredBookings.length > 0 ? (
            <div className="bookings-list63">
              {filteredBookings.map(booking => renderBookingCard(booking))}
            </div>
          ) : (
            <div className="no-results63">
              <p>No booking history found.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="modal-overlay63">
          <div className="modal-content63">
            <h3>Write a Review for {selectedBooking.itemName}</h3>
            <div className="review-form63">
              <div className="rating-section63">
                <label>Your Rating:</label>
                <div className="stars-container63">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn63 ${star <= (hoverRating || reviewRating) ? 'active' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="review-text-section63">
                <label>Your Review:</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={`Share your experience about this ${
                    selectedBooking.itemType === 'event' ? 'event' : 
                    selectedBooking.bookingDetails?.category?.toLowerCase()?.includes('trip') ? 'trip' : 'package'
                  }...`}
                  rows="4"
                />
              </div>
              <div className="modal-buttons63">
                <button 
                  onClick={handleReviewSubmit} 
                  className="submit-btn63"
                  disabled={!reviewRating || !reviewText.trim()}
                >
                  Submit
                </button>
                <button 
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewRating(0);
                    setReviewText('');
                    setSelectedBooking(null);
                  }} 
                  className="cancel-btn63"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 