import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AdminEmergency.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultEmergencyContacts = [
  { icon: "🚔", type: "Police", phone: "+977 1 100" },
  { icon: "🚒", type: "Fire Department", phone: "+977 1 101" },
  { icon: "🕵️‍♂️", type: "Tourist Police", phone: "+977 01-4247041" },
  { icon: "🏥", type: "Nepal Red Cross", phone: "+977 1 426 5325" },
  { icon: "🚑", type: "Ambulance", phone: "+977 1 102" },
];

export default function AdminEmergencyPage() {
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [icon, setIcon] = useState("");
  const [officialContacts, setOfficialContacts] = useState(defaultEmergencyContacts);
  const [editingContactId, setEditingContactId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isOfficial, setIsOfficial] = useState(true);

  const fetchContacts = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminEmergency/View");
      if (response.data.success) {
        setOfficialContacts(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error(error.response?.data?.message || 'Failed to load emergency contacts', {
        className: 'toast-message31',
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const addOrUpdateContact = async () => {
    if (phone && type) {
      try {
        const contactData = {
          phone,
          type,
          icon: icon || "📞"
        };

        if (editingContactId) {
          // Update existing contact
          const response = await axios.put(
            `http://localhost:4000/adminEmergency/${editingContactId}`,
            contactData
          );
          
          if (response.data.success) {
            setOfficialContacts(prevContacts =>
              prevContacts.map(contact =>
                contact._id === editingContactId ? response.data.updatedEmergency : contact
              )
            );
            toast.success('Emergency Contact updated successfully!', {
              className: 'toast-message31',
            });
          } else {
            throw new Error(response.data.message || 'Failed to update contact');
          }
        } else {
          // Add new contact
          const response = await axios.post(
            "http://localhost:4000/adminEmergency",
            contactData
          );
          
          if (response.data.success) {
            setOfficialContacts(prev => [...prev, response.data.newEmergency]);
            toast.success('New Emergency contact added successfully!', {
              className: 'toast-message31',
            });
          } else {
            throw new Error(response.data.message || 'Failed to add contact');
          }
        }

        // Reset form
        setPhone("");
        setType("");
        setIcon("");
        setEditingContactId(null);
      } catch (error) {
        console.error("Error adding/updating contact:", error);
        toast.error(error.response?.data?.message || 'An error occurred. Please try again.', {
          className: 'toast-message31',
        });
      }
    } else {
      toast.error('Please fill in all required fields', {
        className: 'toast-message31',
      });
    }
  };

  const handleEdit = (contact) => {
    setPhone(contact.phone);
    setType(contact.type);
    setIcon(contact.icon || "");
    setEditingContactId(contact._id);
  };

  const handleDelete = async (contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:4000/adminEmergency/${contactToDelete._id}`);
      setOfficialContacts(prevContacts => 
        prevContacts.filter(c => c._id !== contactToDelete._id)
      );
      toast.success(`Emergency Contact "${contactToDelete.phone}" deleted successfully.`, {
        className: 'toast-message31',
      });
    } catch (error) {
      console.error("Failed to delete the contact:", error);
      toast.error('An error occurred while deleting the contact.', {
        className: 'toast-message31',
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
      
      {showDeleteModal && (
        <div className="modal-overlay31">
          <div className="modal-content31">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this emergency contact?</p>
            <div className="modal-buttons31">
              <button 
                className="modal-cancel-btn31" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-delete-btn31" 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-container31">
        <div className="heading31">
          <h1 className="title-heading31">Emergency Contacts Management</h1>
          <p className="title-para31">Manage Official Emergency Contacts</p>
        </div>

        <h2 className="h2-31">Official Emergency Contacts</h2>
        <div className="emergency-grid31">
          {officialContacts.map((contact, index) => (
            <div key={index} className="emergency-card31" style={{ position: 'relative' }}>
              <div className="emergency-icon31">{contact.icon}</div>
              <p className="contact-phone31">{contact.phone}</p>
              <p className="contact-type31" style={{ 
                color: contact.type === 'Medical' ? '#e74c3c' : 
                       contact.type === 'Police' ? '#3498db' : 
                       contact.type === 'Fire' ? '#f39c12' : 
                       '#2ecc71',
                fontWeight: 'bold',
                margin: '5px 0'
              }}>{contact.type}</p>
              <button className="quick-dial31" onClick={() => window.location.href = `tel:${contact.phone}`}>Quick Dial 📞</button>

              <div className="overlay31">
                <img
                  src="/images/edit.png"
                  alt="Edit"
                  className="edit-icon31"
                  onClick={() => handleEdit(contact)}
                />
                <img
                  src="/images/dlete.png"
                  alt="Delete"
                  className="delete-icon31"
                  onClick={() => handleDelete(contact)}
                />
              </div>
            </div>
          ))}
        </div>

        <h2 className="form-heading31">Add/Edit Official Emergency Contact</h2>
        <div className="form-group31">
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
            placeholder="Icon (emoji)" 
            value={icon} 
            onChange={(e) => setIcon(e.target.value)} 
          />
        </div>
        <div className="form-buttons31">
          <button 
            className="cancel-btn31" 
            onClick={() => { 
              setPhone(""); 
              setType(""); 
              setIcon(""); 
              setEditingContactId(null); 
            }}
          >
            Cancel
          </button>
          <button 
            className="save-btn31" 
            onClick={addOrUpdateContact}
          >
            {editingContactId ? "Update" : "Save"}
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
