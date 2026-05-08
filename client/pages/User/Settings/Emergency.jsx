import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Emergency.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import API from "../../../services/api";
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

  // Store original values when editing
  const [originalValues, setOriginalValues] = useState({
    name: "",
    phone: "",
    type: "",
    relationship: ""
  });

  // Form validation states
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    type: "",
    relationship: ""
  });

  // Validation functions
  const validateName = (value) => {
    if (!value.trim()) return "Full name is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Name should contain only letters and spaces";
    return "";
  };

  const validatePhone = (value) => {
    if (!value.trim()) return "Phone number is required";
    if (!/^(97|98)\d{8}$/.test(value)) return "Phone must start with 97 or 98 followed by 8 digits";
    return "";
  };

  const validateType = (value) => {
    if (!value.trim()) return "Type is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Type should contain only letters and spaces";
    return "";
  };

  const validateRelationship = (value) => {
    if (!value.trim()) return "Relationship is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Relationship should contain only letters and spaces";
    return "";
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setErrors(prev => ({ ...prev, name: validateName(value) }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    // Limit to 10 digits
    if (value.length > 10) {
      return;
    }
    
    setPhone(value);
    setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
  };

  const handleKeyPress = (e) => {
    // Only allow numeric input (0-9)
    const keyCode = e.which || e.keyCode;
    if (keyCode < 48 || keyCode > 57) {
      e.preventDefault();
    }
    
    // If phone number doesn't start with 97 or 98
    const currentValue = e.target.value;
    if (currentValue.length === 0 && (e.key !== '9')) {
      e.preventDefault();
    } else if (currentValue.length === 1 && currentValue === '9' && (e.key !== '7' && e.key !== '8')) {
      e.preventDefault();
    }
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setType(value);
    setErrors(prev => ({ ...prev, type: validateType(value) }));
  };

  const handleRelationshipChange = (e) => {
    const value = e.target.value;
    setRelationship(value);
    setErrors(prev => ({ ...prev, relationship: validateRelationship(value) }));
  };

  const fetchOfficialContacts = async () => {
    try {
      const response = await API.get("/adminEmergency/View");
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
      const response = await API.get('/user-emergency-contacts');

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

    // Validate all fields before submission
    const nameError = validateName(name);
    const phoneError = validatePhone(phone);
    const typeError = validateType(type);
    const relationshipError = validateRelationship(relationship);

    const newErrors = {
      name: nameError,
      phone: phoneError,
      type: typeError,
      relationship: relationshipError
    };

    // If updating, check if any changes were made
    if (editingContactId) {
      const hasChanges = 
        name !== originalValues.name || 
        phone !== originalValues.phone || 
        type !== originalValues.type || 
        relationship !== originalValues.relationship;
      
      if (!hasChanges) {
        toast.error('No changes detected. Please make changes before updating.', {
          className: 'toast-message68',
        });
        return;
      }
    }

    setErrors(newErrors);

    // Check if there are any validation errors
    if (nameError || phoneError || typeError || relationshipError) {
      toast.error('Please fix the validation errors', {
        className: 'toast-message68',
      });
      return;
    }

      try {
        const contactData = {
          name,
          phone,
          type,
          relationship
        };

        if (editingContactId) {
          // Update existing contact
          const response = await API.put(
            `/user-emergency-contacts/${editingContactId}`,
            contactData
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
          const response = await API.post(
            '/user-emergency-contacts',
            contactData
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
      
      // Reset errors
      setErrors({
        name: "",
        phone: "",
        type: "",
        relationship: ""
      });
      } catch (error) {
        console.error("Error adding/updating contact:", error);
        toast.error('An error occurred. Please try again.', {
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
    
    // Store original values for comparison
    setOriginalValues({
      name: contact.name,
      phone: contact.phone,
      type: contact.type,
      relationship: contact.relationship
    });
    
    // Reset errors when editing
    setErrors({
      name: "",
      phone: "",
      type: "",
      relationship: ""
    });
  };

  const handleDelete = async (contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user) return;

    try {
      const response = await API.delete(`/user-emergency-contacts/${contactToDelete._id}`);

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
          <div className="input-group68">
            <label htmlFor="name" className="required-label68">Full Name <span className="required-asterisk68">*</span></label>
          <input 
            type="text" 
              id="name"
            placeholder="Full Name" 
            value={name} 
              onChange={handleNameChange}
              className={name && (errors.name ? "input-error68" : "input-valid68")}
              required
          />
            {errors.name && <div className="error-message68">{errors.name}</div>}
            {!errors.name && name && <div className="helper-text68">Name is valid</div>}
          </div>

          <div className="input-group68">
            <label htmlFor="phone" className="required-label68">Phone Number <span className="required-asterisk68">*</span></label>
          <input 
            type="text" 
              id="phone"
              placeholder="Must start with 97 or 98" 
            value={phone} 
              onChange={handlePhoneChange}
              onKeyPress={handleKeyPress}
              className={phone && (errors.phone ? "input-error68" : "input-valid68")}
              maxLength={10}
              required
            />
            {errors.phone && <div className="error-message68">{errors.phone}</div>}
            {!errors.phone && phone && <div className="helper-text68">Phone number is valid</div>}
          </div>

          <div className="input-group68">
            <label htmlFor="type" className="required-label68">Contact Type <span className="required-asterisk68">*</span></label>
          <input 
            type="text" 
              id="type"
              placeholder="Type (e.g., Medical, Police, Family)" 
            value={type} 
              onChange={handleTypeChange}
              className={type && (errors.type ? "input-error68" : "input-valid68")}
              required
            />
            {errors.type && <div className="error-message68">{errors.type}</div>}
            {!errors.type && type && <div className="helper-text68">Contact type is valid</div>}
          </div>

          <div className="input-group68">
            <label htmlFor="relationship" className="required-label68">Relationship <span className="required-asterisk68">*</span></label>
          <input 
            type="text" 
              id="relationship"
            placeholder="Relationship" 
            value={relationship} 
              onChange={handleRelationshipChange}
              className={relationship && (errors.relationship ? "input-error68" : "input-valid68")}
              required
          />
            {errors.relationship && <div className="error-message68">{errors.relationship}</div>}
            {!errors.relationship && relationship && <div className="helper-text68">Relationship is valid</div>}
          </div>
        </div>
        <div className="form-buttons68">
          <button 
            className="cancel-btn68" 
            onClick={() => { 
              setName(""); 
              setPhone(""); 
              setType(""); 
              setRelationship(""); 
              setEditingContactId(null);
              setErrors({
                name: "",
                phone: "",
                type: "",
                relationship: ""
              });
            }}
          >
            Cancel
          </button>
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
