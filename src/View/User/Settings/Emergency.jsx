import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Emergency.css";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function EmergencyPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [relationship, setRelationship] = useState("");
  const [userContacts, setUserContacts] = useState([]);
  const [officialContacts, setOfficialContacts] = useState([]);
  const [editingContactId, setEditingContactId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));


  const fetchOfficialContacts = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminEmergency/View");
      if (response.data.success) {
        setOfficialContacts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching official contacts:", error);
      toast.error('Failed to load official emergency contacts', {
        className: 'toast-message68',
      });
    }
  };

  const fetchUserContacts = async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:4000/user-emergency-contacts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUserContacts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user contacts:", error);
      toast.error('Failed to load personal emergency contacts', {
        className: 'toast-message68',
      });
    }
  };

  useEffect(() => {
    fetchOfficialContacts();
    fetchUserContacts();
  }, []);

  const addOrUpdateContact = async () => {
    if (!user) {
      toast.error("Please log in to manage emergency contacts", {
        className: 'toast-message68',
      });
      return;
    }

    if (name && phone && type && relationship) {
      try {
        const contactData = {
          name,
          phone,
          type,
          relationship
        };

        if (editingContactId) {
          // Update existing contact
          const response = await axios.put(
            `http://localhost:4000/user-emergency-contacts/${editingContactId}`,
            contactData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (response.data.success) {
            setUserContacts(prevContacts =>
              prevContacts.map(contact =>
                contact._id === editingContactId ? response.data.data : contact
              )
            );
            toast.success('Emergency Contact updated successfully!', {
              className: 'toast-message68',
            });
          }
        } else {
          // Add new contact
          const response = await axios.post(
            'http://localhost:4000/user-emergency-contacts',
            contactData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );

          if (response.data.success) {
            setUserContacts(prev => [...prev, response.data.data]);
            toast.success('New Emergency contact added successfully!', {
              className: 'toast-message68',
            });
          }
        }

        // Reset form
        setName("");
        setPhone("");
        setType("");
        setRelationship("");
        setEditingContactId(null);
      } catch (error) {
        console.error("Error adding/updating contact:", error);
        toast.error('An error occurred. Please try again.', {
          className: 'toast-message68',
        });
      }
    } else {
      toast.error('Please fill in all required fields', {
        className: 'toast-message68',
      });
    }
  };

  const handleEdit = (contact) => {
    setName(contact.name);
    setPhone(contact.phone);
    setType(contact.type);
    setRelationship(contact.relationship);
    setEditingContactId(contact._id);
  };

  const handleDelete = async (contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user) return;

    try {
      const response = await axios.delete(
        `http://localhost:4000/user-emergency-contacts/${contactToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setUserContacts(prevContacts => 
          prevContacts.filter(c => c._id !== contactToDelete._id)
        );
        toast.success(`Emergency Contact "${contactToDelete.name}" deleted successfully.`, {
          className: 'toast-message68',
        });
      }
    } catch (error) {
      console.error("Failed to delete the contact:", error);
      toast.error('An error occurred while deleting the contact.', {
        className: 'toast-message68',
      });
    } finally {
      setShowDeleteModal(false);
      setContactToDelete(null);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay68">
          <div className="modal-content68">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete "{contactToDelete?.name}"?</p>
            <div className="modal-buttons68">
              <button 
                className="modal-cancel-btn68" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-delete-btn68" 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-container68">
        <div className="heading68">
          <h1 className="title-heading68">Emergency Events & Resources</h1>
          <p className="title-para68">Quick Access to Key Events & Resources!</p>
        </div>

        <h2 className="h2-68">Official Emergency Contacts</h2>
        <div className="emergency-grid68">
          {officialContacts.map((contact, index) => (
            <div key={index} className="emergency-card68">
              <div className="emergency-icon68">{contact.icon}</div>
              <p className="contact-type68" style={{ 
                color: '#e63946',
                fontWeight: 'bold',
                margin: '5px 0'
              }}>{contact.type}</p>
              <p className="contact-phone68">{contact.phone}</p>
              <button className="quick-dial68" onClick={() => window.location.href = `tel:${contact.phone}`}>
                Quick Dial 📞
              </button>
            </div>
          ))}
        </div>

        {userContacts.length > 0 && (
          <>
            <h2 className="h2-68">Your Personal Emergency Contacts</h2>
            <div className="emergency-grid68">
              {userContacts.map((contact, index) => (
                <div key={index} className="emergency-card68" style={{ position: 'relative' }}>
                  <h3 className="contact-name68">{contact.name}</h3>
                  <p className="contact-phone68">{contact.phone}</p>
                  <p className="contact-type68" style={{ 
                    color: '#e63946',
                    fontWeight: 'bold',
                    margin: '5px 0'
                  }}>{contact.type}</p>
                  <p className="contact-relationship68">{contact.relationship}</p>
                  <button className="quick-dial68" onClick={() => window.location.href = `tel:${contact.phone}`}>Quick Dial 📞</button>

                  <div className="overlay68">
                    <img
                      src="/images/edit.png"
                      alt="Edit"
                      className="edit-icon68"
                      onClick={() => handleEdit(contact)}
                    />
                    <img
                      src="/images/dlete.png"
                      alt="Delete"
                      className="delete-icon68"
                      onClick={() => handleDelete(contact)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="form-heading68">Add/Edit Personal Emergency Contact</h2>
        <div className="form-group68">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Phone" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Type (e.g., Medical, Police, Fire, Other)" 
            value={type} 
            onChange={(e) => setType(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Relationship" 
            value={relationship} 
            onChange={(e) => setRelationship(e.target.value)} 
          />
        </div>
        <div className="form-buttons68">
          <button className="cancel-btn68" onClick={() => { setName(""); setPhone(""); setType(""); setRelationship(""); setEditingContactId(null); }}>Cancel</button>
          <button className="save-btn68" onClick={addOrUpdateContact}>{editingContactId ? "Update" : "Save"}</button>
        </div>

        <div className="additional-resources68">
          <h2 className="resources-heading68">Additional Emergency Resources</h2>
          <p className="resources-para68">Stay informed with emergency updates and safety guidelines.</p>
          <button className="resource-btn68">View Resources</button>
        </div>
      </div>
      <Footer />
    </>
  );
}
