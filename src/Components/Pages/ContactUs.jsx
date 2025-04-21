import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faPhone,
  faLocationDot,
  faClock,
  faMessage,
  faHeadset
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './StaticPages.css';
import UserHeader from '../User Header/User-Header';
import Footer from '../Footer';
import axios from 'axios';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: 'Select a subject',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    loading: false
  });

  // Cleanup function for toasts
  useEffect(() => {
    return () => {
      toast.dismiss(); // Dismiss all toasts when component unmounts
    };
  }, []);

  const subjectOptions = [
    "Select a subject",
    "Account Issues",
    "Payment Problems",
    "Search Feature Issues",
    "Map Navigation Problems",
    "Recommendation System",
    "Itinerary Planning Help",
    "Attraction Information Issues",
    "Review System Problems",
    "General Inquiry",
    "Other"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Dismiss any existing toasts
    toast.dismiss();
    
    // Validate form
    if (formData.subject === "Select a subject") {
      toast.error("Please select a subject", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    setFormStatus({ loading: true });

    try {
      const response = await axios.post('http://localhost:4000/contact/submit', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim()
      });
      
      // Show success toast
      toast.success("Your message has been sent successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        onClose: () => {
          // Reset form after toast closes
          setFormData({
            fullName: '',
            email: '',
            subject: 'Select a subject',
            message: ''
          });
        }
      });

    } catch (error) {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg, {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
          });
        });
      } else if (error.response?.data?.message) {
        // Show backend error message
        toast.error(error.response.data.message, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
      } else {
        // Show general error toast
        toast.error('An error occurred while submitting your message', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        });
      }
    } finally {
      setFormStatus({ loading: false });
    }
  };

  return (
    <div className="page-container">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        limit={3}
      />
      <UserHeader />
      <div className="contact-us-container">
        <div className="contact-us-content">
          <div className="contact-us-header">
            <FontAwesomeIcon icon={faHeadset} className="contact-main-icon" />
            <h1 className="contact-us-title">Get in Touch</h1>
            <p className="contact-us-subtitle">We're here to help and answer any questions you might have</p>
          </div>

          <div className="contact-grid">
            <div className="contact-form-section">
              <h2><FontAwesomeIcon icon={faMessage} className="section-icon" />Send us a Message</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input 
                    type="text" 
                    id="fullName" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name" 
                    required 
                    className="contact-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address" 
                    required 
                    className="contact-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select 
                    id="subject" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required 
                    className="contact-select"
                  >
                    {subjectOptions.map((option, index) => (
                      <option key={index} value={option} disabled={index === 0}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5" 
                    placeholder="Enter your message" 
                    required 
                    className="contact-textarea"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={formStatus.loading}
                >
                  <FontAwesomeIcon icon={faMessage} className="button-icon" />
                  {formStatus.loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="contact-info-section">
              <h2><FontAwesomeIcon icon={faLocationDot} className="section-icon" />Contact Information</h2>
              <div className="contact-info">
                <div className="info-item">
                  <FontAwesomeIcon icon={faLocationDot} className="info-icon" />
                  <div className="info-content">
                    <h3>Our Location</h3>
                    <p>Maitidevi Chowk, Kathmandu, Nepal</p>
                  </div>
                </div>
                <div className="info-item">
                  <FontAwesomeIcon icon={faPhone} className="info-icon" />
                  <div className="info-content">
                    <h3>Phone Number</h3>
                    <p>+977 9817477002</p>
                  </div>
                </div>
                <div className="info-item">
                  <FontAwesomeIcon icon={faEnvelope} className="info-icon" />
                  <div className="info-content">
                    <h3>Email Address</h3>
                    <p>explorenepal.it@gmail.com</p>
                  </div>
                </div>
                <div className="info-item">
                  <FontAwesomeIcon icon={faClock} className="info-icon" />
                  <div className="info-content">
                    <h3>Working Hours</h3>
                    <p>Sunday - Thursday: 9:00 AM - 6:00 PM</p>
                    <p>Friday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d442.03434858894275!2d85.33533632267759!3d27.706779198711775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb199f75f08da5%3A0x641a4463533be28c!2sMaitidevi%20Chowk%2C%20Kathmandu%2044600!5e0!3m2!1sen!2snp!4v1710910671893!5m2!1sen!2snp"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Maitidevi Chowk Map"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs; 