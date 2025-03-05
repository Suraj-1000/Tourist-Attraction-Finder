import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AdminEmergency.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

const emergencyContacts = [
  { icon: "🚔", type: "Police", phone: "+977 1 100" },
  { icon: "🚒", type: "Fire Department", phone: "+977 1 101" },
  { icon: "🕵️‍♂️", type: "Tourist Police", phone: "+977 01-4247041" },
  { icon: "🏥", type: "Nepal Red Cross", phone: "+977 1 426 5325" },
  { icon: "🚑", type: "Ambulance", phone: "+977 1 102" },
];

export default function AdminEmergencyPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [userContacts, setUserContacts] = useState([]);
  const [editingContactId, setEditingContactId] = useState(null); // New state for tracking editing contact

  const fetchUserContacts = async () => {
    try {
      const response = await axios.get("http://localhost:4000/adminEmergency/View");
      setUserContacts(response.data); // Assuming the response data is an array of contacts
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  useEffect(() => {
    fetchUserContacts();
  }, []);

  const addOrUpdateContact = async () => {
    if (name && phone && type) {
      try {
        if (editingContactId) {
          // Update existing contact
          const response = await axios.put(`http://localhost:4000/adminEmergency/${editingContactId}`, { name, phone, type });
          alert(response.data.message);
          setUserContacts((prevContacts) =>
            prevContacts.map((contact) =>
              contact._id === editingContactId ? response.data.updatedEmergency : contact
            )
          );
        } else {
          // Add new contact
          const response = await axios.post("http://localhost:4000/adminEmergency", { name, phone, type });
          alert(`✅ ${response.data.message}`);
          setUserContacts([...userContacts, response.data.newEmergency]);
        }

        // Reset the form fields
        setName("");
        setPhone("");
        setType("");
        setEditingContactId(null); // Reset editing contact ID
      } catch (error) {
        console.error("Error adding/updating contact:", error);
        alert("❌ An error occurred. Please try again.");
      }
    }
  };

  const handleEdit = (contact) => {
    setName(contact.name);
    setPhone(contact.phone);
    setType(contact.type);
    setEditingContactId(contact._id); // Set the ID of the contact being edited
  };

  const handleDelete = async (contact) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${contact.name}"?`);

    if (confirmDelete) {
      try {
        const response = await axios.delete(`http://localhost:4000/adminEmergency/${contact._id}`);
        setUserContacts((prevContacts) => prevContacts.filter((c) => c._id !== contact._id));
        alert(`✅ Contact "${contact.name}" deleted successfully.`);
      } catch (error) {
        console.error("Failed to delete the contact:", error);
        alert("❌ An error occurred while deleting the contact. Please try again.");
      }
    }
  };

  return (
    <>
      <Header />
      <div className="main-container31">
        <div className="heading31">
          <h1 className="title-heading31">Emergency Events & Resources</h1>
          <p className="title-para31">Quick Access to Key Events & Resources!</p>
        </div>

        <h2 className="h2-31">Official Emergency Contacts</h2>
        <div className="emergency-grid31">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className="emergency-card31">
              <div className="emergency-icon31">{contact.icon}</div>
              <h2>{contact.type}</h2>
              <p>{contact.phone}</p>
              <button className="quick-dial31" onClick={() => window.location.href = `tel:${contact.phone}`}>Quick Dial 📞</button>
            </div>
          ))}
        </div>

        {userContacts.length > 0 && (
          <>
            <h2 className="h2-31">Your Personal Emergency Contacts</h2>
            <div className="emergency-grid31">
              {userContacts.map((contact, index) => (
                <div key={index} className="emergency-card31" style={{ position: 'relative' }}>
                  <div className="emergency-icon31">{contact.icon}</div>
                  <h3>{contact.name}</h3>
                  <h2>{contact.type}</h2>
                  <p>{contact.phone}</p>
                  <button className="quick-dial31" onClick={() => window.location.href = `tel:${contact.phone}`}>Quick Dial 📞</button>

                  {/* Overlay for edit and delete icons */}
                  <div className="overlay31">
                    <img
                      src="/images/edit.png"
                      alt="Edit"
                      className="edit-icon31"
                      onClick={() => handleEdit(contact)} // Call handleEdit on click
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
          </>
        )}

        <h2 className="form-heading31">Add/Edit Personal Emergency Contact</h2>
        <div className="form-group31">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input type="text" placeholder="Type (e.g., Medical, Police, Fire, Other)" value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div className="form-buttons31">
          <button className="cancel-btn31" onClick={() => { setName(""); setPhone(""); setType(""); setEditingContactId(null); }}>Cancel</button>
          <button className="save-btn31" onClick={addOrUpdateContact}>{editingContactId ? "Update" : "Save"}</button>
        </div>

        <div className="additional-resources31">
          <h2 className="resources-heading31">Additional Emergency Resources</h2>
          <p className="resources-para31">Stay informed with emergency updates and safety guidelines.</p>
          <button className="resource-btn31">View Resources</button>
        </div>
      </div>
      <Footer />
    </>
  );
}
