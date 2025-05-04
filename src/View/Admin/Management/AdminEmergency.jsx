import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AdminEmergency.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
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
  
  // Store original values when editing
  const [originalValues, setOriginalValues] = useState({
    phone: "",
    type: "",
    icon: ""
  });
  
  // Form validation states
  const [errors, setErrors] = useState({
    phone: "",
    type: "",
    icon: ""
  });

  // Validation functions
  const validatePhone = (value) => {
    if (!value.trim()) return "Phone number is required";
    if (!/^\+?[\d\s-]+$/.test(value)) return "Phone should contain only numbers, spaces, and + or - symbols";
    // No digit limit restriction for admin emergency contacts
    return "";
  };

  const validateType = (value) => {
    if (!value.trim()) return "Type is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Type should contain only letters and spaces";
    return "";
  };

  const validateIcon = (value) => {
    // Simple validation to check if the input at least contains an emoji
    if (!value.trim()) return "Icon is required";
    return "";
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input, plus signs, hyphens, and spaces
    if (!/^[\d\s\-+]*$/.test(value)) {
      return;
    }
    setPhone(value);
    setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
  };

  const handleKeyPress = (e) => {
    // Only allow numeric input (0-9), plus sign, hyphen, and space
    const keyCode = e.which || e.keyCode;
    const isValidKey = 
      (keyCode >= 48 && keyCode <= 57) || // 0-9
      keyCode === 43 || // + sign
      keyCode === 45 || // - hyphen
      keyCode === 32;   // space
    
    if (!isValidKey) {
      e.preventDefault();
    }
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setType(value);
    setErrors(prev => ({ ...prev, type: validateType(value) }));
  };

  const handleIconChange = (e) => {
    const value = e.target.value;
    setIcon(value);
    setErrors(prev => ({ ...prev, icon: validateIcon(value) }));
  };

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
    // Validate all fields before submission
    const phoneError = validatePhone(phone);
    const typeError = validateType(type);
    const iconError = validateIcon(icon);

    const newErrors = {
      phone: phoneError,
      type: typeError,
      icon: iconError
    };

    setErrors(newErrors);
    
    // If updating, check if any changes were made
    if (editingContactId) {
      const hasChanges = 
        phone !== originalValues.phone || 
        type !== originalValues.type || 
        icon !== originalValues.icon;
      
      if (!hasChanges) {
        toast.error('No changes detected. Please make changes before updating.', {
          className: 'toast-message31',
        });
        return;
      }
    }

    // Check if there are any validation errors
    if (phoneError || typeError || iconError) {
      toast.error('Please fix the validation errors', {
        className: 'toast-message31',
      });
      return;
    }
    
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
      
      // Reset errors
      setErrors({
        phone: "",
        type: "",
        icon: ""
      });
    } catch (error) {
      console.error("Error adding/updating contact:", error);
      toast.error(error.response?.data?.message || 'An error occurred. Please try again.', {
        className: 'toast-message31',
      });
    }
  };

  const handleEdit = (contact) => {
    setPhone(contact.phone);
    setType(contact.type);
    setIcon(contact.icon || "");
    setEditingContactId(contact._id);
    
    // Store original values for comparison
    setOriginalValues({
      phone: contact.phone,
      type: contact.type,
      icon: contact.icon || ""
    });
    
    // Reset errors when editing
    setErrors({
      phone: "",
      type: "",
      icon: ""
    });
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
          <div className="input-group31">
            <label htmlFor="phone" className="required-label31">Phone Number <span className="required-asterisk31">*</span></label>
            <input 
              type="text" 
              id="phone"
              placeholder="Phone Number" 
              value={phone} 
              onChange={handlePhoneChange}
              onKeyPress={handleKeyPress}
              className={phone && (errors.phone ? "input-error31" : "input-valid31")}
              required
            />
            {errors.phone && <div className="error-message31">{errors.phone}</div>}
            {!errors.phone && phone && <div className="helper-text31">Phone number is valid</div>}
          </div>

          <div className="input-group31">
            <label htmlFor="type" className="required-label31">Contact Type <span className="required-asterisk31">*</span></label>
            <input 
              type="text" 
              id="type"
              placeholder="Type (e.g., Medical, Police, Fire, Other)" 
              value={type} 
              onChange={handleTypeChange}
              className={type && (errors.type ? "input-error31" : "input-valid31")}
              required
            />
            {errors.type && <div className="error-message31">{errors.type}</div>}
            {!errors.type && type && <div className="helper-text31">Contact type is valid</div>}
          </div>

          <div className="input-group31">
            <label htmlFor="icon" className="required-label31">Icon (emoji) <span className="required-asterisk31">*</span></label>
            <input 
              type="text" 
              id="icon"
              placeholder="Icon (emoji)" 
              value={icon} 
              onChange={handleIconChange}
              className={icon && (errors.icon ? "input-error31" : "input-valid31")}
              required
            />
            {errors.icon && <div className="error-message31">{errors.icon}</div>}
            {!errors.icon && icon && <div className="helper-text31">Icon is valid</div>}
          </div>
        </div>
        <div className="form-buttons31">
          <button 
            className="cancel-btn31" 
            onClick={() => { 
              setPhone(""); 
              setType(""); 
              setIcon(""); 
              setEditingContactId(null);
              setErrors({
                phone: "",
                type: "",
                icon: ""
              });
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
