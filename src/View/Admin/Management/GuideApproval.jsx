import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../../Components/Admin Header/Admin-Header';
import Footer from '../../../Components/Footer/AuthFooter';
import './GuideApproval.css';

const GuideApproval = () => {
  const [pendingGuides, setPendingGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [guideToDecline, setGuideToDecline] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredGuides, setFilteredGuides] = useState([]);

  useEffect(() => {
    fetchPendingGuides();
  }, []);

  useEffect(() => {
    filterGuides();
  }, [searchQuery, statusFilter, pendingGuides]);

  const fetchPendingGuides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/guides/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingGuides(response.data);
      setFilteredGuides(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to fetch guides');
      setLoading(false);
    }
  };

  const filterGuides = () => {
    let filtered = [...pendingGuides];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(guide => 
        guide.guideProfile && guide.guideProfile.verificationStatus === statusFilter
      );
    }

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

  const handleApprove = async (guideId) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/guides/approve/${guideId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state
      setPendingGuides(prevGuides => {
        const updatedGuides = prevGuides.map(guide => {
          if (guide._id === guideId) {
            return {
              ...guide,
              guideProfile: {
                ...guide.guideProfile,
                isVerified: true,
                verificationStatus: 'approved',
                verificationDate: new Date(),
                rejectionReason: null
              }
            };
          }
          return guide;
        });
        return updatedGuides;
      });

      toast.success('Guide approved successfully');
      setSelectedGuide(null);
    } catch (error) {
      console.error('Error approving guide:', error);
      toast.error('Failed to approve guide');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (guideId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/guides/reject/${guideId}`, {
        rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Guide rejected successfully');
      setRejectionReason('');
      setSelectedGuide(null);
      setShowDeclineModal(false);
      setGuideToDecline(null);
      fetchPendingGuides();
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
    setSelectedGuide(null);
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
          <h1 className="title-heading25">Guide Approval Management</h1>
          
          <div className="search-filter-container25">
            <div className="search-wrapper25">
              <input
                type="text"
                placeholder="Search guides by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input25"
              />
              <img src="/images/searchicon.png" alt="search" className="search-icon25" />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter25"
            >
              <option value="all">All Guides</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <h2 className="results-heading25">
            {statusFilter === "all" 
              ? `All Guides (${filteredGuides.length})`
              : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Guides (${filteredGuides.length})`
            }
            {searchQuery && ` - Search results for "${searchQuery}"`}
          </h2>

          {/* Pending Guides Section */}
          {(statusFilter === "all" || statusFilter === "pending") && (
            <div className="trips-section25">
              <h3 className="section-heading25">Pending Guides</h3>
      <div className="guides-list">
                {filteredGuides
                  .filter(guide => guide.guideProfile.verificationStatus === "pending")
                  .map((guide, index) => (
                    <div key={guide._id} className="trip-card25 pending-card">
                      <div className="card-header25">
                        <span className="card-index25">#{index + 1}</span>
                        <span className="status-badge25 status-pending">Pending</span>
                      </div>
                      <div className="card-content25">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img
                            src={guide.image || '/default-avatar.png'}
                  alt={`${guide.firstName} ${guide.lastName}`} 
                            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                          />
                          <h4 className="trip-title25">{guide.firstName} {guide.lastName}</h4>
                </div>
                        <div className="trip-info25">
                          <p><strong>Email:</strong> {guide.email}</p>
                          <p><strong>Phone:</strong> {guide.phone}</p>
                          <p><strong>Languages:</strong> {guide.guideProfile.languages.join(', ')}</p>
                          <p><strong>License:</strong> {guide.guideProfile.licenseNumber}</p>
              </div>
                        <div className="card-actions25">
                          <span 
                            className="view-details-link25"
                  onClick={() => viewGuideDetails(guide)}
                >
                  View Details
                          </span>
                          <div className="approval-buttons25">
                            <button 
                              className="reject-button25" 
                              onClick={() => handleDeclineClick(guide)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? "Declining..." : "Decline"}
                </button>
                <button 
                              className="approve-button25" 
                  onClick={() => handleApprove(guide._id)}
                              disabled={isUpdating}
                >
                              {isUpdating ? "Approving..." : "Approve"}
                </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Approved Guides Section */}
          {(statusFilter === "all" || statusFilter === "approved") && (
            <div className="trips-section25">
              <h3 className="section-heading25">Approved Guides</h3>
              <div className="guides-list">
                {filteredGuides
                  .filter(guide => guide.guideProfile.verificationStatus === "approved")
                  .map((guide, index) => (
                    <div key={guide._id} className="trip-card25 approved-card">
                      <div className="card-header25">
                        <span className="card-index25">#{index + 1}</span>
                        <span className="status-badge25 status-approved">Approved</span>
                      </div>
                      <div className="card-content25">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img
                            src={guide.image || '/default-avatar.png'}
                            alt={`${guide.firstName} ${guide.lastName}`}
                            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                          />
                          <h4 className="trip-title25">{guide.firstName} {guide.lastName}</h4>
                        </div>
                        <div className="trip-info25">
                          <p><strong>Email:</strong> {guide.email}</p>
                          <p><strong>Phone:</strong> {guide.phone}</p>
                          <p><strong>Languages:</strong> {guide.guideProfile.languages.join(', ')}</p>
                          <p><strong>License:</strong> {guide.guideProfile.licenseNumber}</p>
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
          )}

          {/* Rejected Guides Section */}
          {(statusFilter === "all" || statusFilter === "rejected") && (
            <div className="trips-section25">
              <h3 className="section-heading25">Rejected Guides</h3>
              <div className="guides-list">
                {filteredGuides
                  .filter(guide => guide.guideProfile.verificationStatus === "rejected")
                  .map((guide, index) => (
                    <div key={guide._id} className="trip-card25 rejected-card">
                      <div className="card-header25">
                        <span className="card-index25">#{index + 1}</span>
                        <span className="status-badge25 status-rejected">Rejected</span>
                      </div>
                      <div className="card-content25">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img
                            src={guide.image || '/default-avatar.png'}
                            alt={`${guide.firstName} ${guide.lastName}`}
                            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                          />
                          <h4 className="trip-title25">{guide.firstName} {guide.lastName}</h4>
                        </div>
                        <div className="trip-info25">
                          <p><strong>Email:</strong> {guide.email}</p>
                          <p><strong>Phone:</strong> {guide.phone}</p>
                          <p><strong>Languages:</strong> {guide.guideProfile.languages.join(', ')}</p>
                          <p><strong>License:</strong> {guide.guideProfile.licenseNumber}</p>
                          {guide.guideProfile.rejectionReason && (
                            <p><strong>Rejection Reason:</strong> {guide.guideProfile.rejectionReason}</p>
                          )}
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
        )}
      </div>

      {selectedGuide && (
          <div className="modal-overlay25">
            <div className="modal-content25">
              <div className="modal-header25">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <img
                    src={selectedGuide.image || '/default-avatar.png'}
                    alt={`${selectedGuide.firstName} ${selectedGuide.lastName}`}
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                  />
                  <h2 className="modal-title25">{selectedGuide.firstName} {selectedGuide.lastName}</h2>
                </div>
                <div className="header-right25">
                  <span className={`modal-status-badge25 status-${selectedGuide.guideProfile.verificationStatus}`}>
                    {selectedGuide.guideProfile.verificationStatus.charAt(0).toUpperCase() + selectedGuide.guideProfile.verificationStatus.slice(1)}
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
                <div className="modal-actions25">
                  {selectedGuide.guideProfile.verificationStatus === "pending" ? (
                    <>
                      <button 
                        className="modal-decline-btn25"
                        onClick={() => handleDeclineClick(selectedGuide)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Declining..." : "Decline"}
                      </button>
                      <button 
                        className="modal-approve-btn25"
                        onClick={() => handleApprove(selectedGuide._id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Approving..." : "Approve"}
                      </button>
                    </>
                  ) : (
                    <button 
                      className="close-btn"
                      onClick={() => setSelectedGuide(null)}
                    >
                    
                    </button>
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