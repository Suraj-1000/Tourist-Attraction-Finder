import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import './Dashboard.css';
import VerificationCheck from '../../../Components/VerificationCheck';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalTrips: 0,
    totalEvents: 0,
    activeBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [items, setItems] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [recentBookings, setRecentBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentBookings();
  }, []);

  useEffect(() => {
    fetchActiveItems();
  }, [activeTab]);

  const isCurrentOrUpcoming = (startDate, endDate) => {
    const currentDate = new Date();
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // A booking is active if today falls between start and end dates OR
    // if start date is in the future (upcoming)
    return (currentDate >= start && currentDate <= end) || start > currentDate;
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await axios.get('http://localhost:4000/payments/all-bookings');
      const activeBookings = response.data.bookings
        .filter(booking => booking.status.toLowerCase() === 'completed')
        .filter(booking => {
          const packageDetails = booking.paymentDetails?.packageDetails;
          if (!packageDetails) return false;

          let startDate, endDate;

          // Get start and end dates directly if they exist
          if (packageDetails.startDate && packageDetails.endDate) {
            startDate = new Date(packageDetails.startDate);
            endDate = new Date(packageDetails.endDate);
            return isCurrentOrUpcoming(startDate, endDate);
          }
          
          // For events that might store dates differently
          if (packageDetails.duration && packageDetails.duration.includes(' to ')) {
            const [start, end] = packageDetails.duration.split(' to ');
            if (start && end) {
              try {
                startDate = new Date(start);
                endDate = new Date(end);
                return isCurrentOrUpcoming(startDate, endDate);
              } catch (e) {
                return false; // Invalid date format
              }
            }
          }
          
          // If only duration is provided (in days)
          if (packageDetails.duration) {
            const days = parseInt(packageDetails.duration);
            if (!isNaN(days)) {
              const bookingDate = new Date(booking.bookingDate);
              startDate = bookingDate;
              endDate = new Date(bookingDate);
              endDate.setDate(endDate.getDate() + days);
              return isCurrentOrUpcoming(startDate, endDate);
            }
          }
          
          return false;
        })
        .sort((a, b) => {
          // Sort by start date rather than booking date
          const aDetails = a.paymentDetails?.packageDetails || {};
          const bDetails = b.paymentDetails?.packageDetails || {};
          
          const aStart = aDetails.startDate ? new Date(aDetails.startDate) : new Date(a.bookingDate);
          const bStart = bDetails.startDate ? new Date(bDetails.startDate) : new Date(b.bookingDate);
          
          return aStart - bStart; // Ascending by start date (earliest first)
        });

      setRecentBookings(activeBookings.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const fetchActiveItems = async () => {
    try {
      setLoading(true);
      let response;
      
      switch(activeTab) {
        case 'packages':
          response = await axios.get('http://localhost:4000/adminPackage/all');
          break;
        case 'trips':
          response = await axios.get('http://localhost:4000/adminTrip/all');
          break;
        case 'events':
          response = await axios.get('http://localhost:4000/adminEvents');
          break;
        default:
          return;
      }

      const filteredItems = response.data.filter(item => {
        // First check if the item is active/upcoming
        const isActive = item.startDate && item.endDate && isCurrentOrUpcoming(item.startDate, item.endDate);
        
        // For trips, also check if the status is approved
        if (activeTab === 'trips') {
          return isActive && item.status === 'approved';
        }
        
        // For packages and events
        if (item.startDate && item.endDate) {
          return isCurrentOrUpcoming(item.startDate, item.endDate);
        }
        if (item.duration) {
          const days = parseInt(item.duration);
          if (!isNaN(days)) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            return isCurrentOrUpcoming(startDate, endDate);
          }
        }
        return false;
      });

      setItems(filteredItems);
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all packages
      const packagesResponse = await axios.get('http://localhost:4000/adminPackage/all');
      const totalPackages = packagesResponse.data.filter(pkg => {
        if (pkg.startDate && pkg.endDate) {
          return isCurrentOrUpcoming(pkg.startDate, pkg.endDate);
        }
        if (pkg.duration) {
          const days = parseInt(pkg.duration);
          if (!isNaN(days)) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            return isCurrentOrUpcoming(startDate, endDate);
          }
        }
        return false;
      }).length;

      // Fetch all trips
      const tripsResponse = await axios.get('http://localhost:4000/adminTrip/all');
      const totalTrips = tripsResponse.data.filter(trip => {
        // Only count approved trips
        if (trip.status !== 'approved') return false;
        
        if (trip.startDate && trip.endDate) {
          return isCurrentOrUpcoming(trip.startDate, trip.endDate);
        }
        if (trip.duration) {
          const days = parseInt(trip.duration);
          if (!isNaN(days)) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            return isCurrentOrUpcoming(startDate, endDate);
          }
        }
        return false;
      }).length;

      // Fetch all events
      const eventsResponse = await axios.get('http://localhost:4000/adminEvents');
      const totalEvents = eventsResponse.data.filter(event => {
        if (event.startDate && event.endDate) {
          return isCurrentOrUpcoming(event.startDate, event.endDate);
        }
        if (event.duration) {
          const days = parseInt(event.duration);
          if (!isNaN(days)) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            return isCurrentOrUpcoming(startDate, endDate);
          }
        }
        return false;
      }).length;

      // Fetch all bookings
      const bookingsResponse = await axios.get('http://localhost:4000/payments/all-bookings');
      
      const activeBookings = bookingsResponse.data.bookings
        .filter(booking => booking.status.toLowerCase() === 'completed')
        .filter(booking => {
          const packageDetails = booking.paymentDetails?.packageDetails;
          if (!packageDetails) return false;

          let startDate, endDate;

          // Get start and end dates directly if they exist
          if (packageDetails.startDate && packageDetails.endDate) {
            startDate = new Date(packageDetails.startDate);
            endDate = new Date(packageDetails.endDate);
            return isCurrentOrUpcoming(startDate, endDate);
          }
          
          // For events that might store dates differently
          if (packageDetails.duration && packageDetails.duration.includes(' to ')) {
            const [start, end] = packageDetails.duration.split(' to ');
            if (start && end) {
              try {
                startDate = new Date(start);
                endDate = new Date(end);
                return isCurrentOrUpcoming(startDate, endDate);
              } catch (e) {
                return false; // Invalid date format
              }
            }
          }
          
          // If only duration is provided (in days)
          if (packageDetails.duration) {
            const days = parseInt(packageDetails.duration);
            if (!isNaN(days)) {
              const bookingDate = new Date(booking.bookingDate);
              startDate = bookingDate;
              endDate = new Date(bookingDate);
              endDate.setDate(endDate.getDate() + days);
              return isCurrentOrUpcoming(startDate, endDate);
            }
          }
          
          return false;
        });

      setStats({
        totalPackages,
        totalTrips,
        totalEvents,
        activeBookings: activeBookings.length
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getItemTitle = (item) => {
    switch(activeTab) {
      case 'packages':
        return item.title;
      case 'trips':
        return item.tripName;
      case 'events':
        return item.name;
      default:
        return 'N/A';
    }
  };

  const getItemDates = (item) => {
    if (item.startDate && item.endDate) {
      return `${formatDate(item.startDate)} to ${formatDate(item.endDate)}`;
    }
    if (item.duration) {
      return `Duration: ${item.duration}`;
    }
    return 'N/A';
  };

  const getItemLink = (item) => {
    switch(activeTab) {
      case 'packages':
        return `/Itinerary-Package-View/${encodeURIComponent(item.title)}`;
      case 'trips':
        return `/View-Trip-Details/${encodeURIComponent(item.tripName)}`;
      case 'events':
        return `/Event-Details/${encodeURIComponent(item.name)}`;
      default:
        return '#';
    }
  };

  const getTableFields = (item) => {
    if (activeTab === 'trips') {
      return {
        name: item.tripName || 'N/A',
        dates: getItemDates(item),
        category: item.tripType || 'N/A',
        price: formatAmount(item.totalBudget),
        location: item.destinations || 'N/A',
      };
    } else if (activeTab === 'events') {
      let price = 'N/A';
      if (item.ticketPrice && (item.ticketPrice.vip || item.ticketPrice.general)) {
        const vip = item.ticketPrice.vip ? `VIP: ${formatAmount(item.ticketPrice.vip)}` : '';
        const general = item.ticketPrice.general ? `General: ${formatAmount(item.ticketPrice.general)}` : '';
        price = [vip, general].filter(Boolean).join(', ');
      }
      return {
        name: item.name || 'N/A',
        dates: getItemDates(item),
        category: item.category || 'N/A',
        price,
        location: item.location || 'N/A',
      };
    } else {
      // Packages
      return {
        name: item.title || 'N/A',
        dates: getItemDates(item),
        category: item.category || 'N/A',
        price: formatAmount(item.price),
        location: item.address || 'N/A',
      };
    }
  };

  const filteredItems = items.filter(item => {
    const query = filterQuery.toLowerCase();
    const title = (getItemTitle(item) || '').toLowerCase();
    const category = (item.category || item.tripType || '').toLowerCase();
    const address = (item.address || item.destinations || item.location || '').toLowerCase();
    return (
      title.includes(query) ||
      category.includes(query) ||
      address.includes(query)
    );
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.startDate || 0);
      const dateB = new Date(b.startDate || 0);
      return dateA - dateB;
    }
    return getItemTitle(a).localeCompare(getItemTitle(b));
  });

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const getModalDetails = (item) => {
    if (!item) return [];
    if (activeTab === 'trips') {
      return [
        { label: 'Trip Name', value: item.tripName },
        { label: 'Dates', value: getItemDates(item) },
        { label: 'Trip Type', value: item.tripType },
        { label: 'Destinations', value: item.destinations },
        { label: 'Total Budget', value: formatAmount(item.totalBudget) },
        { label: 'Accommodation', value: item.accommodationType },
        { label: 'Group Size', value: item.groupSize },
        { label: 'Status', value: item.status },
        { label: 'Activities', value: [item.adventureActivities, item.culturalExperiences, item.relaxation, item.foodCulinary, item.nightlifeEntertainment].filter(Boolean).flat().join(', ') },
        { label: 'Custom Activities', value: item.customActivities },
        { label: 'Travel Style', value: item.travelStyle },
        { label: 'Dietary Preferences', value: item.dietaryPreferences },
        { label: 'Personalized Experiences', value: item.personalizedExperiences },
      ];
    } else if (activeTab === 'events') {
      let price = 'N/A';
      if (item.ticketPrice && (item.ticketPrice.vip || item.ticketPrice.general)) {
        const vip = item.ticketPrice.vip ? `VIP: ${formatAmount(item.ticketPrice.vip)}` : '';
        const general = item.ticketPrice.general ? `General: ${formatAmount(item.ticketPrice.general)}` : '';
        price = [vip, general].filter(Boolean).join(', ');
      }
      return [
        { label: 'Event Name', value: item.name },
        { label: 'Dates', value: getItemDates(item) },
        { label: 'Category', value: item.category },
        { label: 'Location', value: item.location },
        { label: 'Price', value: price },
        { label: 'Description', value: item.description },
        { label: 'Tags', value: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags },
        { label: 'Capacity', value: item.capacity ? `VIP: ${item.capacity.vip}, General: ${item.capacity.general}` : undefined },
        { label: 'Featured Stars', value: Array.isArray(item.featuredStars) ? item.featuredStars.map(s => s.name).join(', ') : undefined },
      ];
    } else {
      // Packages
      return [
        { label: 'Package Name', value: item.title },
        { label: 'Dates', value: getItemDates(item) },
        { label: 'Category', value: item.category },
        { label: 'Location', value: item.address },
        { label: 'Price', value: formatAmount(item.price) },
        { label: 'Duration', value: item.duration },
        { label: 'Group Size', value: item.groupSize },
        { label: 'Difficulty', value: item.difficulty },
        { label: 'Highlight', value: item.highlight },
        { label: 'Description', value: item.description },
      ];
    }
  };

  return (
    <VerificationCheck>
      <div className="dashboard-page">
        <h1>Guide Dashboard</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Active Packages</h3>
            <p>{loading ? '...' : stats.totalPackages}</p>
          </div>
          <div className="stat-card">
            <h3>Active Trips</h3>
            <p>{loading ? '...' : stats.totalTrips}</p>
          </div>
          <div className="stat-card">
            <h3>Active Events</h3>
            <p>{loading ? '...' : stats.totalEvents}</p>
          </div>
          <div className="stat-card">
            <h3>Active Bookings</h3>
            <p>{loading ? '...' : stats.activeBookings}</p>
          </div>
        </div>

        <div className="active-items-section">
          <h2 className="upcoming-tours-heading">Upcoming Tours</h2>
          <div className="active-items-header">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'packages' ? 'active' : ''}`}
                onClick={() => setActiveTab('packages')}
              >
                Packages
              </button>
              <button 
                className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
                onClick={() => setActiveTab('trips')}
              >
                Trips
              </button>
              <button 
                className={`tab ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                Events
              </button>
            </div>
            <div className="filters">
              <input
                type="text"
                placeholder="Search..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="search-input"
              />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p>Loading...</p>
            ) : filteredItems.length > 0 ? (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Dates</th>
                    <th>Category</th>
                    <th>Price (NPR)</th>
                    <th>Location</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const fields = getTableFields(item);
                    return (
                      <tr key={index}>
                        <td>{fields.name}</td>
                        <td>{fields.dates}</td>
                        <td>{fields.category}</td>
                        <td>{fields.price}</td>
                        <td>{fields.location}</td>
                        <td>
                          <button className="icon-view-button" title="View Details" onClick={() => handleViewDetails(item)}>
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No {activeTab} found</p>
            )}
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section">
            <h2>Recent Active Bookings</h2>
            <div className="table-container">
              {recentBookings.length > 0 ? (
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Tours</th>
                      <th>Customer</th>
                      <th>Trip Dates</th>
                      <th>Price (NPR)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking, index) => {
                      const packageDetails = booking.paymentDetails?.packageDetails || {};
                      let tripDates = 'N/A';
                      
                      if (packageDetails.startDate && packageDetails.endDate) {
                        tripDates = `${formatDate(packageDetails.startDate)} - ${formatDate(packageDetails.endDate)}`;
                      } else if (packageDetails.duration && packageDetails.duration.includes(' to ')) {
                        const [start, end] = packageDetails.duration.split(' to ');
                        tripDates = `${start} - ${end}`;
                      } else if (packageDetails.duration) {
                        tripDates = `Duration: ${packageDetails.duration}`;
                      }
                      
                      return (
                        <tr key={index}>
                          <td>{booking.packageName}</td>
                          <td>{booking.paymentDetails?.userDetails?.name || 'N/A'}</td>
                          <td>{tripDates}</td>
                          <td>{formatAmount(booking.amount)}</td>
                          <td>
                            <span className={`status-badge ${booking.status.toLowerCase()}`} style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px', 
                              fontWeight: 'bold',
                              backgroundColor: booking.status.toLowerCase() === 'completed' ? '#e6fff2' : 
                                            booking.status.toLowerCase() === 'cancelled' ? '#ffebeb' : '#fff8eb',
                              color: booking.status.toLowerCase() === 'completed' ? '#008000' : 
                                    booking.status.toLowerCase() === 'cancelled' ? '#ae0808' : '#F25019',
                              border: `1px solid ${booking.status.toLowerCase() === 'completed' ? '#008000' : 
                                                  booking.status.toLowerCase() === 'cancelled' ? '#ae0808' : '#F25019'}`
                            }}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No active bookings</p>
              )}
            </div>
          </div>
        </div>

        {showModal && selectedItem && (
          <div className="modal-overlay-dashboard" onClick={handleCloseModal}>
            <div className="modal-content-dashboard" onClick={e => e.stopPropagation()}>
              <button className="modal-close-dashboard" onClick={handleCloseModal}>&times;</button>
              <h2 style={{marginBottom: '18px'}}>{activeTab === 'trips' ? 'Trip Details' : activeTab === 'events' ? 'Event Details' : 'Package Details'}</h2>
              <div className="modal-details-list">
                {getModalDetails(selectedItem).filter(d => d.value && d.value !== 'N/A' && d.value !== 'undefined').map((detail, idx) => (
                  <div key={idx} className="modal-detail-row">
                    <span className="modal-detail-key">{detail.label}:</span>
                    <span className="modal-detail-value">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </VerificationCheck>
  );
};

export default Dashboard; 