import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserDetailsForm.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function formatDate(dateString) {
  if (!dateString) return '';
  // Handles both string and Date object
  const d = new Date(dateString);
  if (isNaN(d)) return dateString; // fallback if invalid
  return d.toISOString().split('T')[0];
}

const UserDetailsForm = ({ onSubmit, onCancel, packageDetails }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    paymentPartner: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user data from localStorage when component mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      // Set all user details including address
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || user.userAddress || '', // Check both address and userAddress fields
        paymentPartner: prev.paymentPartner // Preserve any selected payment method
      }));

      // Log the user data for debugging
      console.log('User data loaded from localStorage:', user);
    }
  }, []);

  // Add debugging to see what's in packageDetails
  useEffect(() => {
    console.log("packageDetails in modal:", packageDetails);
  }, [packageDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.paymentPartner) errors.paymentPartner = 'Please select a payment method';
    return errors;
  };

  // Helper to get extra fields for display and storage
  const getExtraDetails = () => {
    const extra = {};
    if (packageDetails.startDate) extra.startDate = packageDetails.startDate;
    if (packageDetails.endDate) extra.endDate = packageDetails.endDate;
    if (packageDetails.address) extra.address = packageDetails.address;
    if (packageDetails.destination) extra.destination = packageDetails.destination;
    if (packageDetails.destinations) extra.destinations = packageDetails.destinations;
    
    // Log the extra details for debugging
    console.log("Extra details being added:", extra);
    
    return extra;
  };

  const handlePayment = async (formData, packageDetails) => {
    try {
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?._id || user?.id;
      if (!user || !userId) {
        throw new Error('Please login to make a booking');
      }

      // Store the current path before initiating payment
      localStorage.setItem('returnPath', window.location.pathname);

      // Store user details
      localStorage.setItem('userDetails', JSON.stringify({
        name: formData.firstName + ' ' + formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        userId: userId
      }));

      // Get extra details like startDate, endDate, etc.
      const extraDetails = getExtraDetails();

      // Store package details (add new fields)
      localStorage.setItem('paymentDetails', JSON.stringify({
        title: packageDetails.title,
        price: packageDetails.price,
        duration: packageDetails.duration,
        category: packageDetails.category,
        ...extraDetails
      }));

      // Store payment gateway
      localStorage.setItem('paymentGateway', formData.paymentPartner);

      // Convert price to number and ensure it's valid
      const price = Number(packageDetails.price);
      if (isNaN(price)) {
        throw new Error('Invalid package price');
      }

      // Generate a unique transaction ID
      const transactionId = Date.now().toString();

      // Store payment details in localStorage
      const paymentDetails = {
        ...formData,
        packageDetails,
        amount: price,
        transactionId,
      };
      localStorage.setItem('currentPaymentDetails', JSON.stringify(paymentDetails));

      if (formData.paymentPartner === 'esewa') {
        // Initialize eSewa payment
        const requestData = {
          itemId: transactionId,
          totalPrice: price,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          userId: userId,
          packageDetails: {
            _id: packageDetails._id || null,
            title: packageDetails.title,
            duration: packageDetails.duration,
            category: packageDetails.category,
            price: price,
            startDate: packageDetails.startDate || null,
            endDate: packageDetails.endDate || null,
            address: packageDetails.address || formData.address || null,
            destination: packageDetails.destination || null,
            destinations: packageDetails.destinations || null
          }
        };

        // Log the full request data for debugging
        console.log("Sending eSewa request data:", JSON.stringify(requestData, null, 2));

        const response = await axios.post('http://localhost:4000/esewa/initialize-esewa', requestData);
        
        // Log the response for debugging
        console.log("eSewa response:", response.data);

        if (response.data.success) {
          toast.success('Redirecting to eSewa payment...');
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = response.data.formAction;

          Object.entries(response.data.formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
          });

          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
        } else {
          throw new Error(response.data.message || 'Failed to initialize eSewa payment');
        }
      } else if (formData.paymentPartner === 'khalti') {
        // Initialize Khalti payment
        const requestData = {
          itemId: transactionId,
          totalPrice: price,
          website_url: window.location.origin,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          userId: userId,
          packageDetails: {
            _id: packageDetails._id || null,
            title: packageDetails.title,
            duration: packageDetails.duration,
            category: packageDetails.category,
            price: price,
            startDate: packageDetails.startDate || null,
            endDate: packageDetails.endDate || null,
            address: packageDetails.address || formData.address || null,
            destination: packageDetails.destination || null,
            destinations: packageDetails.destinations || null
          }
        };
        
        // Log the full request data for debugging
        console.log("Sending Khalti request data:", JSON.stringify(requestData, null, 2));

        const response = await axios.post('http://localhost:4000/khalti/initialize-khalti', requestData);
        
        // Log the response for debugging
        console.log("Khalti response:", response.data);

        if (response.data.success && response.data.payment?.payment_url) {
          toast.success('Redirecting to Khalti payment...');
          // Redirect to Khalti payment page
          window.location.href = response.data.payment.payment_url;
        } else {
          throw new Error(response.data.message || 'Failed to get payment URL');
        }
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Handle 503 errors specifically
        if (error.response.status === 503 || error.message.includes('temporarily unavailable')) {
          toast.error('Payment service is temporarily unavailable. Please try again later or use a different payment method.');
          setFormErrors({
            submit: 'Payment service is temporarily unavailable. Please try again later or use a different payment method.',
            paymentPartner: 'Please select a different payment method.'
          });
        } else {
          toast.error(error.response?.data?.message || error.message || 'Failed to initialize payment. Please try again.');
          setFormErrors({
            submit: error.response?.data?.message || error.message || 'Failed to process payment. Please try again.'
          });
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await handlePayment(formData, packageDetails);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setFormErrors({
        submit: error.message || 'Failed to process payment. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Handle fallback booking when payment services are unavailable
  const handleFallbackBooking = () => {
    try {
      const bookingData = {
        packageDetails,
        userDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        },
        paymentPartner: formData.paymentPartner,
        timestamp: new Date().toISOString()
      };
      
      // Save fallback booking to localStorage for later processing
      const fallbackBookings = JSON.parse(localStorage.getItem('fallbackBookings') || '[]');
      fallbackBookings.push(bookingData);
      localStorage.setItem('fallbackBookings', JSON.stringify(fallbackBookings));
      
      toast.success('Your booking has been saved locally. Our team will contact you to complete the payment.');
      setTimeout(() => {
        onCancel(); // Close the form after showing success message
      }, 2000);
    } catch (err) {
      console.error('Error saving fallback booking:', err);
    }
  };

  return (
    <div className="user-details-form-modal">
      <div className="user-details-modal-content">
        <div className="user-details-modal-header">
          <h2>Book {packageDetails.title}</h2>
          <p>Category: {packageDetails.category}</p>
          <p>Duration: {packageDetails.duration}</p>
          {packageDetails.startDate && <p>Start Date: {formatDate(packageDetails.startDate)}</p>}
          {packageDetails.endDate && <p>End Date: {formatDate(packageDetails.endDate)}</p>}
          {packageDetails.address && <p>Address: {packageDetails.address}</p>}         
          {packageDetails.destinations && <p>Destination: {packageDetails.destinations}</p>}
          <p className="price">Price: NPR {packageDetails.price}</p>
          <hr className="divider" />
        </div>

        <form onSubmit={handleSubmit} className="user-details-form">
          <div className="user-details-form-section">
            <h3>Personal Information</h3>
            
            <div className="user-details-form-row">
              <div className="user-details-form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={formErrors.firstName ? 'error' : ''}
                  placeholder="Enter first name"
                  disabled={isSubmitting}
                />
                {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
              </div>

              <div className="user-details-form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={formErrors.lastName ? 'error' : ''}
                  placeholder="Enter last name"
                  disabled={isSubmitting}
                />
                {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}
              </div>
            </div>

            <div className="user-details-form-row">
              <div className="user-details-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={formErrors.email ? 'error' : ''}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>

              <div className="user-details-form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={formErrors.phone ? 'error' : ''}
                  placeholder="10-digit number"
                  disabled={isSubmitting}
                />
                {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
              </div>
            </div>

            <div className="user-details-form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={formErrors.address ? 'error' : ''}
                placeholder="Your complete address"
                disabled={isSubmitting}
              />
              {formErrors.address && <span className="error-message">{formErrors.address}</span>}
            </div>
          </div>

          <div className="user-details-form-section">
            <h3>Select Payment Method</h3>
            <div className="payment-options">
              <div className="payment-option">
                <input
                  type="radio"
                  id="esewa"
                  name="paymentPartner"
                  value="esewa"
                  checked={formData.paymentPartner === 'esewa'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="esewa" className="payment-label">
                  <img src="/images/esewa.png" alt="eSewa" />
                  <span>Pay with eSewa</span>
                </label>
              </div>

              <div className="payment-option">
                <input
                  type="radio"
                  id="khalti"
                  name="paymentPartner"
                  value="khalti"
                  checked={formData.paymentPartner === 'khalti'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="khalti" className="payment-label">
                  <img src="/images/khalti.png" alt="Khalti" />
                  <span>Pay with Khalti</span>
                </label>
              </div>
            </div>
            {formErrors.paymentPartner && (
              <span className="error-message">{formErrors.paymentPartner}</span>
            )}
          </div>

          <div className="user-details-form-buttons">
            <button
              type="button"
              className="button0000"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button0000 primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Payment...' : 'Proceed to Payment'}
            </button>
            
            {/* Show fallback booking button when services are unavailable */}
            {formErrors.submit && formErrors.submit.includes('temporarily unavailable') && (
              <button
                type="button"
                className="button0000 secondary"
                onClick={handleFallbackBooking}
              >
                Save Booking for Later
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDetailsForm;