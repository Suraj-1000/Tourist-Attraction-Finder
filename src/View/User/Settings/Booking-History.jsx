import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../Components/User Header/User-Header';
import Footer from '../../../Components/Footer';
import './Booking-History.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faCalendarAlt, faCreditCard, faUser, faEnvelope, faPhone, faMapMarkerAlt, faTrash, faEdit, faExclamationTriangle, faTicketAlt, faHashtag, faListUl, faCrown, faUsers } from '@fortawesome/free-solid-svg-icons';
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
          const duration = formatDuration(packageDetails);
          const category = (booking.category || '').toLowerCase();
          const packageCategory = (packageDetails.category || '').toLowerCase();
          
          // If it's an event (has date range format) or a trip, exclude it
          if (duration.includes(' to ') && 
              /[A-Za-z]+ \d{1,2}, \d{4} to [A-Za-z]+ \d{1,2}, \d{4}/.test(duration)) {
            return false;
          }
          
          // Check if it's a trip in either category
          if (category.includes('long trip') || 
              category.includes('short trip') ||
              packageCategory.includes('long trip') ||
              packageCategory.includes('short trip')) {
            return false;
          }
          
          // Everything else is a package
          return true;
        });
        break;
      case 'trips':
        results = results.filter(booking => {
          const category = (booking.category || '').toLowerCase();
          const packageDetails = booking.paymentDetails?.packageDetails || {};
          const packageCategory = (packageDetails.category || '').toLowerCase();
          
          // Check both booking category and package category for trip types
          return category.includes('long trip') || 
                 category.includes('short trip') ||
                 packageCategory.includes('long trip') ||
                 packageCategory.includes('short trip');
        });
        break;
      case 'events':
        results = results.filter(booking => {
          const packageDetails = booking.paymentDetails?.packageDetails || {};
          const duration = formatDuration(packageDetails);
          // Check if duration is in the format "Month DD, YYYY to Month DD, YYYY"
          return duration.includes(' to ') && 
                 /[A-Za-z]+ \d{1,2}, \d{4} to [A-Za-z]+ \d{1,2}, \d{4}/.test(duration);
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
    
    // Update heading with category-specific count
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

    // Check if booking status is not completed
    if (booking.status.toLowerCase() !== 'completed') {
        toast.error('Ticket can only be downloaded after booking is completed');
        return;
    }

    const paymentDetails = booking.paymentDetails || {};
    const userDetails = booking.userDetails || {};
    const packageDetails = paymentDetails.packageDetails || {};
    const ticketDetails = booking.ticketDetails || {};

    // Check if this is an event booking
    const isEvent = packageDetails.duration?.includes(' to ') && 
                   /[A-Za-z]+ \d{1,2}, \d{4} to [A-Za-z]+ \d{1,2}, \d{4}/.test(packageDetails.duration);

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
          <div style="text-align: center; margin-bottom: 20px; padding-top: 20px;">
            <div style="display: inline-block; padding: 8px; border: 2px solid #000; border-radius: 50%; width: 80px; height: 80px; background: white;">
              <img src="/images/Logo.png" alt="Explore Nepal Logo" style="width: 64px; height: 64px; object-fit: contain;" onerror="this.onerror=null; this.src='/images/logo.png';" />
            </div>
            <p style="color: #666; font-size: 11px; margin: 8px 0;">
              Your Gateway to Adventure in Nepal - Discover, Experience, and Explore the Beauty of Nepal
            </p>
          </div>

          <!-- Package Title and Status -->
          <div style="text-align: center; margin-bottom: 20px;">
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
                  ${isEvent ? `
                    <tr>
                      <td style="padding: 4px 0;"><strong>Event Date:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.duration}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Event Time:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.startTime || 'N/A'} - ${packageDetails.endTime || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Location:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.location || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0;"><strong>Category:</strong></td>
                      <td style="padding: 4px 0;">${packageDetails.category || 'N/A'}</td>
                    </tr>
                  ` : `
                  <tr>
                    <td style="padding: 4px 0;"><strong>Travel Date:</strong></td>
                    <td style="padding: 4px 0;">${formatDate(booking.bookingDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Duration:</strong></td>
                    <td style="padding: 4px 0;">${packageDetails.duration || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Category:</strong></td>
                    <td style="padding: 4px 0;">${packageDetails.category || 'N/A'}</td>
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

            ${isEvent ? `
              <!-- Event Ticket Details -->
              <div style="margin-bottom: 15px;">
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
            ` : `
            <!-- Package Details -->
            <div style="margin-bottom: 15px;">
              <h2 style="color: #4a69bd; font-size: 16px; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a69bd;">
                Package Details
              </h2>
              <div style="background-color: #f8f9fa; padding: 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tr>
                    <td style="padding: 4px 0; width: 40%;"><strong>Package Name:</strong></td>
                    <td style="padding: 4px 0;">${booking.packageName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Base Price:</strong></td>
                    <td style="padding: 4px 0;">${formatAmount(packageDetails.price || 0)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Description:</strong></td>
                    <td style="padding: 4px 0;">${packageDetails.description || 'Experience the beauty and adventure of Nepal.'}</td>
                  </tr>
                </table>
              </div>
            </div>
            `}
          </div>
        </div>
      `;

      // Second page content
      page2Content.innerHTML = `
        <div style="width: 100%; background: white; margin: 40px 40px 30px; padding: 0 20px;">
          <!-- Payment Details -->
          <div style="margin-top: 20px;">
            <div style="padding: 0 15px;">
              <h2 style="color: #4a69bd; font-size: 16px; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #4a69bd;">
                Payment Details
              </h2>
              <div style="background-color: #f8f9fa; padding: 10px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tr>
                    <td style="padding: 4px 0; width: 40%;"><strong>Total Amount:</strong></td>
                    <td style="padding: 4px 0;">${formatAmount(booking.amount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;"><strong>Payment Gateway:</strong></td>
                    <td style="padding: 4px 0; text-transform: capitalize;">${paymentDetails.paymentGateway || booking.paymentMethod || 'N/A'}</td>
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
                        paymentDetails.status === 'failed' ? '#dc3545' : '#ffc107'
                      }; color: white; font-weight: bold; font-size: 11px; text-transform: capitalize;">
                        ${paymentDetails.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                  ${paymentDetails.paymentDate ? `
                    <tr>
                      <td style="padding: 4px 0;"><strong>Payment Date:</strong></td>
                      <td style="padding: 4px 0;">${formatDate(paymentDetails.paymentDate)}</td>
                    </tr>
                  ` : ''}
                </table>
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; margin: 40px 0;">
            <div id="qr-code" style="display: inline-block; padding: 0; margin-bottom: 10px;">
              <!-- QR code will be rendered here -->
            </div>
            <p style="color: #666; font-size: 11px; font-weight: 500; margin: 0;">Scan QR code to verify ticket</p>
          </div>

          <!-- Signature -->
          <div style="text-align: right; margin: 40px 15px 30px; padding-right: 15px;">
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

  const renderBookingCard = (booking) => {
    const paymentDetails = booking.paymentDetails || {};
    const userDetails = booking.userDetails || {};
    const packageDetails = paymentDetails.packageDetails || {};
    const ticketDetails = booking.ticketDetails || {};
    const duration = formatDuration(packageDetails);
    const isEvent = duration.includes(' to ') && 
                    /[A-Za-z]+ \d{1,2}, \d{4} to [A-Za-z]+ \d{1,2}, \d{4}/.test(duration);

    if (isEvent) {
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
                  Ticket No: {booking.bookingId}
                </span>
                <span>
                  <FontAwesomeIcon icon={faCalendarAlt} className="icon-margin" />
                  Duration: {duration}
                </span>
                <span>
                  <FontAwesomeIcon icon={faListUl} className="icon-margin" />
                  Category: {packageDetails.category || 'N/A'}
                </span>
          </div>

              <div className="detail-group63">
                <label>Event Details</label>
                <span>
                  <FontAwesomeIcon icon={faCrown} className="icon-margin" />
                  VIP Tickets: {ticketDetails.vipTickets?.quantity || 0} x NPR {ticketDetails.vipTickets?.pricePerTicket || 0} = NPR {ticketDetails.vipTickets?.totalPrice || 0}
                </span>
                <span>
                  <FontAwesomeIcon icon={faTicketAlt} className="icon-margin" />
                  General Tickets: {ticketDetails.generalTickets?.quantity || 0} x NPR {ticketDetails.generalTickets?.pricePerTicket || 0} = NPR {ticketDetails.generalTickets?.totalPrice || 0}
                </span>
                <span>
                  <FontAwesomeIcon icon={faUsers} className="icon-margin" />
                  Total Tickets: {ticketDetails.totalTickets || 0}
                </span>
        </div>

              <div className="detail-group63">
                <label>Customer Details</label>
                <span>
                  <FontAwesomeIcon icon={faUser} className="icon-margin" />
                  {userDetails.name || `${booking.userDetails.firstName} ${booking.userDetails.lastName}` || 'N/A'}
                </span>
                <span>
                  <FontAwesomeIcon icon={faEnvelope} className="icon-margin" />
                  {userDetails.email || booking.userDetails.email || 'N/A'}
                </span>
                <span>
                  <FontAwesomeIcon icon={faPhone} className="icon-margin" />
                  {userDetails.phone || booking.userDetails.phone || 'N/A'}
                </span>
                <span>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-margin" />
                  {userDetails.address || booking.userDetails.address || 'N/A'}
                </span>
              </div>

              <div className="detail-group63">
                <label>Ticket Details</label>
                
                <span>
                  <FontAwesomeIcon icon={faCreditCard} className="icon-margin" />
                  Total Amount: NPR {ticketDetails.totalTicketPrice || booking.totalPrice || 0}
                </span>
                <span className={`payment-status63 ${(paymentDetails.status || 'pending').toLowerCase()}`}>
                  Payment Status: {paymentDetails.status || booking.status || 'Pending'}
                </span>
                <span>Gateway: {paymentDetails.paymentGateway || 'N/A'}</span>
              {paymentDetails.paymentDate && (
                <span>Paid on: {formatDate(paymentDetails.paymentDate)}</span>
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
        </div>
      </div>
      );
    }

    // Return regular booking card for non-events
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
                          <span>Ticket No: {booking.bookingId}</span>
              <span>Duration: {duration}</span>
                          <span>Category: {packageDetails.category || 'N/A'}</span>
                        </div>

                        <div className="detail-group63">
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

                        <div className="detail-group63">
                          <label>Payment Details</label>
                          <span>
                            <FontAwesomeIcon icon={faCreditCard} className="icon-margin" />
                            Total Price: {formatAmount(booking.amount)}
                          </span>
                          <span>Gateway: {paymentDetails.paymentGateway || 'N/A'}</span>
                          <span className={`payment-status63 ${(paymentDetails.status || 'pending').toLowerCase()}`}>
                            Payment Status: {paymentDetails.status || 'Pending'}
                          </span>
                          {paymentDetails.paymentDate && (
                            <span>Paid on: {formatDate(paymentDetails.paymentDate)}</span>
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

    </>
  );
} 