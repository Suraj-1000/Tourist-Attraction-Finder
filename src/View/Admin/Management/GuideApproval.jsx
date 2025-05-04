import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../../Components/Admin Header/Admin-Header';
import Footer from '../../../Components/Footer';
import './GuideApproval.css';
import { FaStar, FaCheck, FaTimes, FaClock, FaSearch, FaTimes as FaTimesCircle } from 'react-icons/fa';

// Helper function to get status icon
const getStatusIcon = (status) => {
  switch(status) {
    case 'approved':
      return <FaCheck />;
    case 'rejected':
      return <FaTimes />;
    default:
      return <FaClock />;
  }
};

const GuideApproval = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [guideToDecline, setGuideToDecline] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");

  // Function to get initials for avatar when no image is available
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Function to render user name for reviews
  // State to store fetched user names
  const [userNames, setUserNames] = useState({});
  
  // Function to render user name for reviews
  const renderUserInfo = (review) => {
    try {
      // Check if the review has a populated touristId object
      if (review.touristId && typeof review.touristId === 'object') {
        // Extract firstName and lastName from touristId object
        const firstName = review.touristId.firstName || '';
        const lastName = review.touristId.lastName || '';
        
        // If both firstName and lastName exist, return formatted name
        if (firstName && lastName) {
          return `${firstName} ${lastName}`;
        } 
        // If only one exists, return what we have
        else if (firstName || lastName) {
          return (firstName || lastName).trim();
        }
        
        // If we have touristId object but no name, check for email
        if (review.touristId.email) {
          return review.touristId.email.split('@')[0]; // Show username part of email
        }
      }
      
      // If touristId is a string, check if we already fetched the name
      if (typeof review.touristId === 'string') {
        const userId = review.touristId;
        
        // If we already have the name cached, use it
        if (userNames[userId]) {
          return userNames[userId];
        }
        
        // Otherwise, use a default display name based on ID for now
        // and fetch the details asynchronously
        setTimeout(() => {
          fetchUserDetails(userId).then(userDetails => {
            if (userDetails) {
              const name = userDetails.firstName && userDetails.lastName 
                ? `${userDetails.firstName} ${userDetails.lastName}`
                : userDetails.firstName || userDetails.lastName || userDetails.email;
                
              if (name) {
                setUserNames(prev => ({
                  ...prev,
                  [userId]: name
                }));
              }
            }
          });
        }, 0);
        
        // Return a formatted version of the user ID
        return `User ${userId.substring(0, 5)}`;
      }
      
      // Check for direct properties on the review object itself
      if (review.firstName && review.lastName) {
        return `${review.firstName} ${review.lastName}`.trim();
      }
      
      if (review.touristName) {
        return review.touristName;
      }
      
      if (review.email) {
        return review.email.split('@')[0]; // Show username part of email
      }
      
      console.log('Review data:', review);
    } catch (err) {
      console.error('Error rendering user info:', err);
    }
    
    return 'Tourist';
  };
  
  // Function to fetch user details by ID (if needed)
  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    try {
      // Use our new user-basic endpoint that doesn't require authentication
      const response = await axios.get(`http://localhost:4000/signups/user-basic/${userId}`);
      
      if (response.status === 200 && response.data.user) {
        console.log('Fetched user details:', response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // If that fails, try with other endpoints
      try {
        const token = localStorage.getItem('token');
        // Try guide-profile endpoint
        const response = await axios.get(`http://localhost:4000/signups/guide-profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 200 && response.data.guide) {
          console.log('Fetched guide details:', response.data.guide);
          return response.data.guide;
        }
      } catch (innerError) {
        console.error('All fetch attempts failed:', innerError);
      }
    }
    return null;
  };

  // Debounced search function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Define filterGuides as a memoized callback to prevent recreation on every render
  const filterGuides = useCallback(() => {
    if (!guides || guides.length === 0) return;
    
    let filtered = [...guides];

    // Filter by search query
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(guide => 
        (guide.firstName && guide.firstName.toLowerCase().includes(query)) ||
        (guide.lastName && guide.lastName.toLowerCase().includes(query)) ||
        (guide.email && guide.email.toLowerCase().includes(query)) ||
        (guide.phone && guide.phone.includes(query)) ||
        (guide.guideProfile && guide.guideProfile.licenseNumber && 
         guide.guideProfile.licenseNumber.toLowerCase().includes(query))
      );
    }

    // Only filter by status if we need to (the API already returns filtered guides by status)
    // This helps when searching across all guides
    filtered = filtered.filter(guide => {
      const status = guide.guideProfile?.verificationStatus || 'pending';
      return status === statusFilter;
    });

    setFilteredGuides(filtered);
  }, [guides, searchQuery, statusFilter]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Update the input value immediately for UI feedback
    setSearchQuery(value);
    // Then debounce the actual filtering
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchGuidesByStatus();
  }, [statusFilter]);

  useEffect(() => {
    if (guides.length > 0) {
      filterGuides();
    }
  }, [searchQuery, guides, statusFilter, filterGuides]);

  const fetchGuidesByStatus = async () => {
    try {
      setLoading(true);
      setGuides([]);
      setFilteredGuides([]);
      
      const token = localStorage.getItem('token');
      
      // Use the appropriate endpoint based on the statusFilter
      const response = await axios.get(`http://localhost:4000/guides/${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Process the guide data to ensure all reviews have properly populated tourist info
      const processedGuides = response.data.map(guide => {
        if (guide.guideProfile && guide.guideProfile.reviews) {
          // Log the first review to check its structure
          if (guide.guideProfile.reviews.length > 0) {
            console.log('First review structure:', guide.guideProfile.reviews[0]);
          }
        }
        return guide;
      });
      
      setGuides(processedGuides);
      setFilteredGuides(processedGuides);
    } catch (error) {
      console.error(`Error fetching ${statusFilter} guides:`, error);
      toast.error(`Failed to fetch ${statusFilter} guides. Please try again.`);
      // Set empty arrays in case of error
      setGuides([]);
      setFilteredGuides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (guideId) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !userData) {
        toast.error('Authentication required');
        setIsUpdating(false);
        return;
      }

      const response = await axios.put(
        `http://localhost:4000/guides/approve/${guideId}`,
        {
          adminId: userData._id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        toast.success('Guide approved successfully');
        // Update local state
        setGuides(prevGuides => 
          prevGuides.map(guide => 
            guide._id === guideId ? 
              { ...guide, guideProfile: { ...guide.guideProfile, verificationStatus: 'approved', isVerified: true } } : 
              guide
          )
        );
        
        // Close the modal and refresh
        setSelectedGuide(null);
        fetchGuidesByStatus();
      }
    } catch (error) {
      console.error('Error approving guide:', error);
      toast.error('Failed to approve guide');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (guideId) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !userData) {
        toast.error('Authentication required');
        setIsUpdating(false);
        return;
      }

      const response = await axios.put(
        `http://localhost:4000/guides/reject/${guideId}`,
        {
          adminId: userData._id,
          rejectionReason: rejectionReason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        toast.success('Guide rejected successfully');
        // Update local state
        setGuides(prevGuides => 
          prevGuides.map(guide => 
            guide._id === guideId ? 
              { ...guide, guideProfile: { ...guide.guideProfile, verificationStatus: 'rejected', isVerified: false, rejectionReason } } : 
              guide
          )
        );
        
        // Reset and close modals
        setRejectionReason("");
        setShowDeclineModal(false);
        setGuideToDecline(null);
        fetchGuidesByStatus();
      }
    } catch (error) {
      console.error('Error rejecting guide:', error);
      toast.error('Failed to reject guide');
    } finally {
      setIsUpdating(false);
    }
  };

  const viewGuideDetails = (guide) => {
    setSelectedGuide(guide);
  };

  const handleDeclineClick = (guide) => {
    setGuideToDecline(guide);
    setShowDeclineModal(true);
  };

  // Get the appropriate message for empty results based on the filter
  const getEmptyResultsMessage = () => {
    switch(statusFilter) {
      case 'approved':
        return "No approved guides found.";
      case 'rejected':
        return "No rejected guides found.";
      default:
        return "No pending guides found for approval.";
    }
  };

  // Function to change the status filter and update displayed guides
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    // This will trigger the useEffect that calls fetchGuidesByStatus
  };

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading25">
          <div className="spinner"></div>
          <p>Loading {statusFilter} guides...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
    <Header />  
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container25"
      />
      <div className="main-container25">
        <div className="heading-container25">
          <h1 className="title-heading25">Guide Approval Management</h1>
          
          <div className="search-filter-container25">
            <div className="search-wrapper25">
              <input
                type="text"
                placeholder="Search by name, email, phone or license..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input25"
              />
              {searchQuery ? (
                <FaTimesCircle className="search-clear-icon25" onClick={clearSearch} />
              ) : (
                <FaSearch className="search-icon25" />
              )}
            </div>

            <div className="status-filter25">
              <span className="filter-label25">Filter Status:</span>
              <div className="filter-options25">
                <button 
                  className={`filter-option25 ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('pending')}
                  data-status="pending"
                >
                  <FaClock style={{ marginRight: '5px' }} /> Pending
                </button>
                <button 
                  className={`filter-option25 ${statusFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('approved')}
                  data-status="approved"
                >
                  <FaCheck style={{ marginRight: '5px' }} /> Approved
                </button>
                <button 
                  className={`filter-option25 ${statusFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('rejected')}
                  data-status="rejected"
                >
                  <FaTimes style={{ marginRight: '5px' }} /> Rejected
                </button>
              </div>
            </div>
          </div>

          <h2 className="results-heading25">
            {`Guide Applications (${filteredGuides.length})`}
            {searchQuery && ` - Search results for "${searchQuery}"`}
            {statusFilter !== 'pending' && ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} guides`}
          </h2>

          <div className="trips-section25">
            <div className="guides-list25">
              {filteredGuides.length > 0 ? filteredGuides.map((guide, index) => (
                <div 
                  key={guide._id} 
                  className={`trip-card25 ${guide.guideProfile.verificationStatus === 'approved' ? 'approved-card' : 
                             guide.guideProfile.verificationStatus === 'rejected' ? 'rejected-card' : 'pending-card'}`}
                >
                  <div className="card-header25">
                    <span className="card-index25">#{index + 1}</span>
                    {guide.guideProfile.verificationStatus === 'approved' && (
                      <div className="header-ratings">
                        {guide.guideProfile.ratings?.average ? (
                          <div className="rating-display">
                            <span className="rating-value">{guide.guideProfile.ratings.average.toFixed(1)}</span>
                            <div className="stars-mini">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} 
                                  className={`star-mini ${star <= Math.round(guide.guideProfile.ratings.average) ? 'filled' : ''}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="reviews-count">({guide.guideProfile.ratings.total || 0})</span>
                          </div>
                        ) : (
                          <span className="no-ratings">No ratings yet</span>
                        )}
                      </div>
                    )}
                    <span 
                      className={`status-badge25 ${
                        guide.guideProfile.verificationStatus === 'approved' ? 'status-approved' : 
                        guide.guideProfile.verificationStatus === 'rejected' ? 'status-rejected' : 'status-pending'
                      }`}
                    >
                      {getStatusIcon(guide.guideProfile.verificationStatus)} 
                      {guide.guideProfile.verificationStatus ? guide.guideProfile.verificationStatus.charAt(0).toUpperCase() + guide.guideProfile.verificationStatus.slice(1) : 'Pending'}
                    </span>
                  </div>
                  <div className="card-content25">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {guide.image ? (
                        <img
                          src={guide.image}
                          alt={`${guide.firstName} ${guide.lastName}`}
                          style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                        />
                      ) : (
                        <div style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: '50%', 
                          backgroundColor: '#e63946', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          color: 'white', 
                          fontWeight: 'bold',
                          border: '2px solid #eee'
                        }}>
                          {getInitials(guide.firstName, guide.lastName)}
                        </div>
                      )}
                      <h4 className="trip-title25">{guide.firstName} {guide.lastName}</h4>
                    </div>
                    <div className="trip-info25">
                      <p><strong>Email:</strong> {guide.email}</p>
                      <p><strong>Phone:</strong> {guide.phone}</p>
                      <p><strong>Languages:</strong> {guide.guideProfile.languages.join(', ')}</p>
                      <p><strong>License:</strong> {guide.guideProfile.licenseNumber}</p>
                      {guide.guideProfile.verificationStatus === 'rejected' && guide.guideProfile.rejectionReason && (
                        <p className="rejection-reason25">
                          <strong>Rejection Reason:</strong> {guide.guideProfile.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="card-actions25">
                      <span 
                        className="view-details-link25"
                        onClick={() => viewGuideDetails(guide)}
                      >
                        View Details
                      </span>
                      {guide.guideProfile.verificationStatus === 'pending' && (
                        <div className="approval-buttons25">
                          <button 
                            className="reject-button25" 
                            onClick={() => handleDeclineClick(guide)}
                            disabled={isUpdating}
                          >
                            <FaTimes style={{ marginRight: '5px' }} />
                            {isUpdating ? "Declining..." : "Decline"}
                          </button>
                          <button 
                            className="approve-button25" 
                            onClick={() => handleApprove(guide._id)}
                            disabled={isUpdating}
                          >
                            <FaCheck style={{ marginRight: '5px' }} />
                            {isUpdating ? "Approving..." : "Approve"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="no-results25">
                  <p>{searchQuery ? `No guides found matching "${searchQuery}".` : getEmptyResultsMessage()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedGuide && (
          <div className="modal-overlay25">
            <div className="modal-content25">
              <div className="modal-header25">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {selectedGuide.image ? (
                    <img
                      src={selectedGuide.image}
                      alt={`${selectedGuide.firstName} ${selectedGuide.lastName}`}
                      style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                    />
                  ) : (
                    <div style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      backgroundColor: '#e63946', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      color: 'white', 
                      fontWeight: 'bold',
                      fontSize: '24px',
                      border: '2px solid #eee'
                    }}>
                      {getInitials(selectedGuide.firstName, selectedGuide.lastName)}
                    </div>
                  )}
                  <h2 className="modal-title25">{selectedGuide.firstName} {selectedGuide.lastName}</h2>
                </div>
                <div className="header-right25">
                  <span 
                    className={`modal-status-badge25 ${
                      selectedGuide.guideProfile.verificationStatus === 'approved' ? 'status-approved' : 
                      selectedGuide.guideProfile.verificationStatus === 'rejected' ? 'status-rejected' : 'status-pending'
                    }`}
                  >
                    {getStatusIcon(selectedGuide.guideProfile.verificationStatus)}
                    {selectedGuide.guideProfile.verificationStatus ? selectedGuide.guideProfile.verificationStatus.charAt(0).toUpperCase() + selectedGuide.guideProfile.verificationStatus.slice(1) : 'Pending'}
                  </span>
                  <div className="modal-close-icon25" onClick={() => setSelectedGuide(null)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="modal-body25">
                <div className="modal-section25">
                  <h3>Personal Information</h3>
                  <div className="detail-grid25">
                    <div className="detail-item25">
                      <span className="detail-label25">Full Name:</span>
                      <span className="detail-value25">{selectedGuide.firstName} {selectedGuide.lastName}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Email:</span>
                      <span className="detail-value25">{selectedGuide.email}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Phone:</span>
                      <span className="detail-value25">{selectedGuide.phone}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Gender:</span>
                      <span className="detail-value25">{selectedGuide.gender || 'Not specified'}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Date of Birth:</span>
                      <span className="detail-value25">{selectedGuide.dateOfBirth ? new Date(selectedGuide.dateOfBirth).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Address:</span>
                      <span className="detail-value25">{selectedGuide.address || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-section25">
                  <h3>Guide Information</h3>
                  <div className="detail-grid25">
                    <div className="detail-item25">
                      <span className="detail-label25">Languages:</span>
                      <span className="detail-value25">{selectedGuide.guideProfile.languages.join(', ') || 'Not specified'}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">License Number:</span>
                      <span className="detail-value25">{selectedGuide.guideProfile.licenseNumber || 'Not specified'}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Regions of Expertise:</span>
                      <span className="detail-value25">{selectedGuide.guideProfile.regionsOfExpertise?.join(', ') || 'Not specified'}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Service Types:</span>
                      <span className="detail-value25">{selectedGuide.guideProfile.serviceTypes?.join(', ') || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-section25">
                  <h3>Pricing</h3>
                  <div className="detail-grid25">
                    <div className="detail-item25">
                      <span className="detail-label25">Per Day:</span>
                      <span className="detail-value25">{selectedGuide.guideProfile.pricing?.perDay ? `USD $${selectedGuide.guideProfile.pricing.perDay}` : 'Not specified'}</span>
                    </div>
                    <div className="detail-item25">
                      <span className="detail-label25">Packages:</span>
                      <span className="detail-value25">
                        {selectedGuide.guideProfile.pricing?.packages?.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {selectedGuide.guideProfile.pricing.packages.map((pkg, idx) => (
                              <li key={idx}>
                                <b>{pkg.name}</b> ({pkg.duration}) - USD ${pkg.price} <br />{pkg.description}
                              </li>
                            ))}
                          </ul>
                        ) : 'No packages'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-section25">
                  <h3>Availability</h3>
                  <div className="detail-grid25">
                    {selectedGuide.guideProfile.availability?.length > 0 ? (
                      selectedGuide.guideProfile.availability.map((avail, idx) => (
                        <div className="detail-item25" key={idx}>
                          <span className="detail-label25">Date:</span>
                          <span className="detail-value25">{avail.date ? new Date(avail.date).toLocaleDateString() : 'N/A'}</span>
                          <span className="detail-label25">Slots:</span>
                          <span className="detail-value25">
                            {avail.slots?.length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {avail.slots.map((slot, sidx) => (
                                  <li key={sidx}>{slot.startTime} - {slot.endTime} {slot.isBooked ? '(Booked)' : ''}</li>
                                ))}
                              </ul>
                            ) : 'No slots'}
                          </span>
                        </div>
                      ))
                    ) : <span className="detail-value25">No availability info</span>}
                  </div>
                </div>
                <div className="modal-section25">
                  <h3>Documents</h3>
                  <div className="guide-documents">
                    <h4>License Document</h4>
                    {selectedGuide.guideProfile.licenseDocument && (selectedGuide.guideProfile.licenseDocument.url || selectedGuide.guideProfile.licenseDocument.preview) ? (
                      <img 
                        src={selectedGuide.guideProfile.licenseDocument.url || selectedGuide.guideProfile.licenseDocument.preview} 
                        alt="License Document"
                        className="document-preview"
                      />
                    ) : (
                      <p>No license document provided</p>
                    )}
                    <h4>Education Certificates</h4>
                    <div className="certificates-grid">
                      {selectedGuide.guideProfile.educationCertificates?.length > 0 ? (
                        selectedGuide.guideProfile.educationCertificates.map((cert, index) => (
                          (cert.url || cert.preview) ? (
                            <img 
                              key={index}
                              src={cert.url || cert.preview}
                              alt={`Certificate ${index + 1}`}
                              className="certificate-preview"
                            />
                          ) : null
                        ))
                      ) : (
                        <p>No education certificates provided</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Reviews Section - Updated with PackageView style */}
                <div className="modal-section25 reviews-section25">
                  <h3 className="section-title25">Reviews & Ratings ({selectedGuide.guideProfile.ratings?.total || 0})</h3>
                  <div className="rating-summary25">
                    <div className="average-rating25">
                      <span className="rating-number25">
                        {selectedGuide.guideProfile.ratings?.average ? 
                          selectedGuide.guideProfile.ratings.average.toFixed(1) : 
                          '0.0'}
                      </span>
                      <div className="stars-container25">
                        {[...Array(5)].map((_, index) => (
                          <FaStar
                            key={index}
                            className={`star ${index < Math.round(selectedGuide.guideProfile.ratings?.average || 0) ? 'filled' : 'empty'}`}
                            style={{
                              color: index < Math.round(selectedGuide.guideProfile.ratings?.average || 0) ? '#ffd700' : '#e0e0e0',
                              marginRight: '2px'
                            }}
                          />
                        ))}
                      </div>
                      <span className="total-reviews25">
                        ({selectedGuide.guideProfile.ratings?.total || 0} reviews)
                      </span>
                    </div>
                  </div>
                  
                  <div className="reviews-list25">
                    {selectedGuide.guideProfile.reviews && selectedGuide.guideProfile.reviews.length > 0 ? (
                      selectedGuide.guideProfile.reviews.map((review, index) => (
                        <div key={index} className="review-card25">
                          <div className="review-card-header25">
                            <div className="reviewer-info25">
                              <h3>{renderUserInfo(review)}</h3>
                              <span className="review-date25">
                                {new Date(review.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="review-rating25">
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
                          <p className="review-text25">{review.comment}</p>
                          {review.reply && (
                            <div className="guide-reply-section">
                              <strong>Guide's Response:</strong>
                              <p>{review.reply}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="no-reviews25">No reviews yet. Be the first to review!</p>
                    )}
                  </div>
                </div>
                
                <div className="modal-actions25">
                  {selectedGuide.guideProfile.verificationStatus === "pending" && (
                    <>
                      <button 
                        className="modal-decline-btn25"
                        onClick={() => handleDeclineClick(selectedGuide)}
                        disabled={isUpdating}
                      >
                        <FaTimes style={{ marginRight: '5px' }} />
                        {isUpdating ? "Declining..." : "Decline"}
                      </button>
                      <button 
                        className="modal-approve-btn25"
                        onClick={() => handleApprove(selectedGuide._id)}
                        disabled={isUpdating}
                      >
                        <FaCheck style={{ marginRight: '5px' }} />
                        {isUpdating ? "Approving..." : "Approve"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeclineModal && (
          <div className="modal-overlay25">
            <div className="modal-content25">
              <div className="modal-header25">
                <h2 className="modal-title25">Decline Guide</h2>
                <div className="modal-close-icon25" onClick={() => setShowDeclineModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="modal-body25">
                <textarea
                  className="decline-message-input25"
                  placeholder="Please provide a reason for declining this guide (required)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                />
                <div className="modal-actions25">
                  <button 
                    className="cancel-button25"
                    onClick={() => setShowDeclineModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="reject-button25"
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        toast.error("Please provide a reason for declining the guide.");
                        return;
                      }
                      handleReject(guideToDecline._id);
                    }}
                    disabled={!rejectionReason.trim()}
                  >
                    <FaTimes style={{ marginRight: '5px' }} />
                    Decline Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default GuideApproval; 