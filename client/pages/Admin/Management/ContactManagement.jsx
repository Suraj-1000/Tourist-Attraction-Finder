import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaSearch, FaEye, FaCheck, FaTimes, FaSpinner, 
  FaEnvelope, FaHourglass, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';
import Header from '../../../components/Admin Header/Admin-Header';
import Footer from '../../../components/Footer/AuthFooter';
import './ContactManagement.css';

export default function ContactManagement() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchContacts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:4000/contact/submissions');
      if (response.data && Array.isArray(response.data.data)) {
        // Sort contacts based on status and date
        const sortedContacts = response.data.data.sort((a, b) => {
          // First sort by status priority
          const statusOrder = { 'Pending': 1, 'Resolved': 2 };
          const statusComparison = statusOrder[a.status] - statusOrder[b.status];
          
          if (statusComparison !== 0) return statusComparison;
          
          // Then sort by date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setContacts(sortedContacts);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch contact submissions. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
    setResolutionMessage('');
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedContact) return;

    try {
      setIsLoading(true);
      await axios.patch(`http://localhost:4000/contact/${selectedContact._id}/status`, {
        status: newStatus,
        adminMessage: resolutionMessage || undefined
      });

      // Create notification for user
      const userNotification = {
        type: 'system',
        message: `Your inquiry "${selectedContact.subject}" has been ${newStatus === 'Resolved' ? 'resolved' : 'updated to ' + newStatus}`,
        userEmail: selectedContact.email,
        recipientType: 'user',
        details: {
          subject: selectedContact.subject,
          status: newStatus,
          adminMessage: resolutionMessage || undefined
        }
      };

      // Create notification for admin
      const adminNotification = {
        type: 'system',
        message: `Contact inquiry "${selectedContact.subject}" has been ${newStatus === 'Resolved' ? 'resolved' : 'updated to ' + newStatus}`,
        recipientType: 'admin',
        details: {
          subject: selectedContact.subject,
          status: newStatus,
          adminMessage: resolutionMessage || undefined,
          userEmail: selectedContact.email
        }
      };

      // Save notifications to database
      const [userNotifResponse, adminNotifResponse] = await Promise.all([
        axios.post('http://localhost:4000/notifications', userNotification),
        axios.post('http://localhost:4000/notifications', adminNotification)
      ]);

      if (!userNotifResponse.data || !adminNotifResponse.data) {
        throw new Error("Failed to create notifications");
      }

      // Trigger notification update for the user
      const notificationEvent = new CustomEvent('contactStatusUpdate', {
        detail: {
          userEmail: selectedContact.email,
          status: newStatus
        }
      });
      window.dispatchEvent(notificationEvent);

      toast.success(`Status updated to ${newStatus} successfully`);
      setShowModal(false);
      setResolutionMessage('');
      await fetchContacts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionMessage.trim()) {
      toast.error('Please enter a resolution message');
      return;
    }

    try {
      setIsLoading(true);
      // Update contact status and store admin message
      await axios.patch(`http://localhost:4000/contact/${selectedContact._id}/status`, {
        status: 'Resolved',
        adminMessage: resolutionMessage
      });

      // Create notification for user
      const userNotification = {
        type: 'system',
        message: `Your inquiry "${selectedContact.subject}" has been resolved`,
        userEmail: selectedContact.email,
        recipientType: 'user',
        details: {
          subject: selectedContact.subject,
          status: 'Resolved',
          adminMessage: resolutionMessage
        }
      };

      // Create notification for admin
      const adminNotification = {
        type: 'system',
        message: `Contact inquiry "${selectedContact.subject}" has been resolved`,
        recipientType: 'admin',
        details: {
          subject: selectedContact.subject,
          status: 'Resolved',
          adminMessage: resolutionMessage,
          userEmail: selectedContact.email
        }
      };

      // Save notifications to database
      const [userNotifResponse, adminNotifResponse] = await Promise.all([
        axios.post('http://localhost:4000/notifications', userNotification),
        axios.post('http://localhost:4000/notifications', adminNotification)
      ]);

      if (!userNotifResponse.data || !adminNotifResponse.data) {
        throw new Error("Failed to create notifications");
      }

      // Trigger notification update for the user
      const notificationEvent = new CustomEvent('contactStatusUpdate', {
        detail: {
          userEmail: selectedContact.email,
          status: 'Resolved'
        }
      });
      window.dispatchEvent(notificationEvent);

      toast.success('Issue resolved and notification sent successfully');
      setShowModal(false);
      setResolutionMessage('');
      await fetchContacts();
    } catch (error) {
      console.error('Error resolving contact:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve issue');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalContacts = contacts.length;
  const pendingContacts = contacts.filter(contact => contact.status === 'Pending').length;
  const resolvedContacts = contacts.filter(contact => contact.status === 'Resolved').length;

  if (error) {
    return (
      <>
        <Header />
        <div className="main-container35">
          <div className="content-area35">
            <div className="error-message35">
              <FaExclamationCircle className="error-icon35" />
              <p>{error}</p>
              <button onClick={fetchContacts} className="retry-btn35">
                Try Again
              </button>
            </div>
          </div>
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
      />
      
      <div className="main-container35">
        <div className="content-area35">
          <div className="heading35">
            <h1 className="title-heading35">Contact Management</h1>
          </div>

          {/* Stats Cards */}
          <div className="stats-container35">
            <div className="card35 total-card">
              <FaEnvelope className="icon35" />
              <h3>Total Inquiries</h3>
              <p>{totalContacts}</p>
            </div>
            <div className="card35 pending-card">
              <FaHourglass className="icon35" />
              <h3>Pending</h3>
              <p>{pendingContacts}</p>
            </div>
            <div className="card35 resolved-card">
              <FaCheckCircle className="icon35" />
              <h3>Resolved</h3>
              <p>{resolvedContacts}</p>
            </div>
          </div>

          <div className="search-container35">
            <div className="search-box35">
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
              <FaSearch className="search-icon35" />
            </div>
            
            <div className="filters-container35">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-box35"
                disabled={isLoading}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="contacts-table35">
            {isLoading ? (
              <div className="loading-spinner35">
                <FaSpinner className="spinner35" />
                <p>Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="no-contacts35">
                <FaEnvelope className="no-data-icon35" />
                <p>No contact submissions found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact._id}>
                      <td>{contact.fullName}</td>
                      <td>{contact.email}</td>
                      <td>{contact.subject}</td>
                      <td>
                        <span className={`status-badge35 ${contact.status.toLowerCase()}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="view-details-btn35"
                          onClick={() => handleViewDetails(contact)}
                          disabled={isLoading}
                        >
                          <FaEye style={{ marginRight: '5px' }} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showModal && selectedContact && (
            <div className="modal-overlay35">
              <div className="modal-content35">
                <button className="modal-close35" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
                <div className="modal-header35">
                  <h2>Contact Details</h2>
                </div>
                <div className="contact-details35">
                  <div className="detail-item35">
                    <span className="detail-label35">Name:</span>
                    <span className="detail-value35">{selectedContact.fullName}</span>
                  </div>
                  <div className="detail-item35">
                    <span className="detail-label35">Email:</span>
                    <span className="detail-value35">{selectedContact.email}</span>
                  </div>
                  <div className="detail-item35">
                    <span className="detail-label35">Subject:</span>
                    <span className="detail-value35">{selectedContact.subject}</span>
                  </div>
                  <div className="detail-item35">
                    <span className="detail-label35">Status:</span>
                    <span className={`status-badge35 ${selectedContact.status.toLowerCase()}`}>
                      {selectedContact.status}
                    </span>
                  </div>
                  <div className="detail-item35">
                    <span className="detail-label35">Message:</span>
                    <div className="message-box35">{selectedContact.message}</div>
                  </div>
                  {selectedContact.adminMessage && (
                    <div className="detail-item35">
                      <span className="detail-label35">Admin Response:</span>
                      <div className="message-box35 admin-message35">{selectedContact.adminMessage}</div>
                    </div>
                  )}
                </div>

                {selectedContact.status !== 'Resolved' && (
                  <div className="resolution-section35">
                    <h3>Resolution</h3>
                    <textarea
                      className="resolution-textarea35"
                      placeholder="Enter your response message..."
                      value={resolutionMessage}
                      onChange={(e) => setResolutionMessage(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="modal-buttons35">
                      <button 
                        className="cancel-btn35" 
                        onClick={() => setShowModal(false)}
                        disabled={isLoading}
                      >
                        <FaTimes /> Cancel
                      </button>
                      <button 
                        className="resolve-btn35" 
                        onClick={handleResolve}
                        disabled={isLoading || !resolutionMessage.trim()}
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="spinner35" /> Processing...
                          </>
                        ) : (
                          <>
                            <FaCheck /> Resolve
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
} 
