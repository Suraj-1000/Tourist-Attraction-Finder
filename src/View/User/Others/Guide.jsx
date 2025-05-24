import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../../Components/User Header/User-Header';
import Footer from '../../../Components/Footer';
import '../../Admin/Management/GuideApproval.css';
import { FaStar, FaTimes, FaSearch } from 'react-icons/fa';

const Guide = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGuides, setFilteredGuides] = useState([]);

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

  useEffect(() => {
    fetchGuides();
  }, []);

  useEffect(() => {
    filterGuides();
  }, [searchQuery, guides]);

  const fetchGuides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/guides/approved', {
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
      
      // No need to filter, as the endpoint already returns only approved guides
      setGuides(processedGuides);
      setFilteredGuides(processedGuides);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to fetch guides');
      setLoading(false);
    }
  };

  const filterGuides = () => {
    let filtered = [...guides];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(guide => 
        guide.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredGuides(filtered);
  };

  const viewGuideDetails = (guide) => {
    setSelectedGuide(guide);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
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
        className="toast-container"
      />
      <div className="main-container25">
        <div className="heading-container25">
          <h1 className="title-heading25">All Guides List</h1>
          
          <div className="search-filter-container25">
            <div className="search-wrapper25">
              <input
                type="text"
                placeholder="Search guides by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input25"
              />
              {searchQuery ? (
                <div className="search-icon-wrapper25" onClick={() => setSearchQuery('')} title="Clear search">
                  <FaTimes className="search-clear-icon25" />
                </div>
              ) : (
                <div className="search-icon-wrapper25">
                  <FaSearch className="search-icon25" />
                </div>
              )}
            </div>
          </div>

          <h2 className="results-heading25">
            {`Guides Profiles (${filteredGuides.length})`}
            {searchQuery && ` - Search results for "${searchQuery}"`}
          </h2>

          <div className="trips-section25">
            <div className="guides-list">
              {filteredGuides.map((guide, index) => (
                <div key={guide._id} className="trip-card25 approved-card">
                  <div className="card-header25">
                    <span className="card-index25">#{index + 1}</span>
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
                    <span className="status-badge25 status-approved">Approved</span>
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
                      <p><strong>Availability:</strong> 
                        <span className={`status-badge64 ${guide.guideProfile.isAvailable ? 'available' : 'unavailable'}`}>
                          {guide.guideProfile.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </p>
                    </div>
                    <div className="card-actions25">
                      <span 
                        className="view-details-link25"
                        onClick={() => viewGuideDetails(guide)}
                      >
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
                  <span className="modal-status-badge25 status-approved">Approved</span>
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
                    <div className="detail-item25">
                      <span className="detail-label25">Status:</span>
                      <div className="availability-status64">
                        <div className={`status-badge64 ${selectedGuide.guideProfile.isAvailable ? 'available' : 'unavailable'}`}>
                          {selectedGuide.guideProfile.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    </div>
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
                      selectedGuide.guideProfile.reviews.map((review, index) => {
                        // Add console log to debug the review object structure
                        console.log('Review object:', review);
                        console.log('TouristId:', review.touristId);
                        
                        return (
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
                        );
                      })
                    ) : (
                      <p className="no-reviews25">No reviews yet. Be the first to review!</p>
                    )}
                  </div>
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

export default Guide; 