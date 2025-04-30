import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../../../Components/User Header/User-Header';
import Footer from '../../../Components/Footer';
import '../../Admin/Management/GuideApproval.css';
const Guide = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGuides, setFilteredGuides] = useState([]);

  useEffect(() => {
    fetchGuides();
  }, []);

  useEffect(() => {
    filterGuides();
  }, [searchQuery, guides]);

  const fetchGuides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/guides/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only approved guides
      const approvedGuides = response.data.filter(guide => 
        guide.guideProfile && guide.guideProfile.verificationStatus === "approved"
      );
      setGuides(approvedGuides);
      setFilteredGuides(approvedGuides);
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
              <img src="/images/searchicon.png" alt="search" className="search-icon25" />
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