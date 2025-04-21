import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserDetailsForm.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EventBookingForm = ({ onSubmit, onCancel, eventDetails }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    paymentPartner: '',
    vipTickets: 0,
    generalTickets: 0
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

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
        paymentPartner: prev.paymentPartner, // Preserve any selected payment method
        vipTickets: prev.vipTickets,
        generalTickets: prev.generalTickets
      }));

      // Log the user data for debugging
      console.log('User data loaded from localStorage:', user);
    }
  }, []);

  // Calculate total amount whenever ticket quantities change
  useEffect(() => {
    const vipTotal = formData.vipTickets * eventDetails.ticketPrice.vip;
    const generalTotal = formData.generalTickets * eventDetails.ticketPrice.general;
    setTotalAmount(vipTotal + generalTotal);
  }, [formData.vipTickets, formData.generalTickets, eventDetails.ticketPrice]);

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

  const handleTicketChange = (type, value) => {
    const numValue = parseInt(value) || 0;
    const maxTickets = type === 'vip' ? eventDetails.capacity.vip : eventDetails.capacity.general;
    
    if (numValue > maxTickets) {
      toast.error(`Maximum ${maxTickets} ${type.toUpperCase()} tickets available`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [`${type}Tickets`]: numValue
    }));
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
    if (formData.vipTickets + formData.generalTickets === 0) {
      errors.tickets = 'Please select at least one ticket';
    }
    return errors;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePayment = async (formData, eventDetails) => {
    try {
      // Get user from localStorage
      const userString = localStorage.getItem('user');
      if (!userString) {
        throw new Error('Please login to make a booking');
      }

      const user = JSON.parse(userString);
      const userId = user.id || user._id;
      if (!userId) {
        throw new Error('Invalid user data. Please login again.');
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

      // Format the dates properly
      const formattedStartDate = formatDate(eventDetails.startDate);
      const formattedEndDate = formatDate(eventDetails.endDate);

      // Store event details with time and location
      localStorage.setItem('paymentDetails', JSON.stringify({
        title: eventDetails.name,
        startDate: eventDetails.startDate,
        endDate: eventDetails.endDate,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        location: eventDetails.location,
        category: eventDetails.category,
        vipPrice: eventDetails.ticketPrice.vip,
        generalPrice: eventDetails.ticketPrice.general,
        vipTickets: formData.vipTickets,
        generalTickets: formData.generalTickets,
        totalAmount: totalAmount
      }));

      // Store payment gateway
      localStorage.setItem('paymentGateway', formData.paymentPartner);

      // Generate a unique transaction ID
      const transactionId = Date.now().toString();

      // Prepare package details for payment
      const packageDetails = {
        title: eventDetails.name,
        duration: `${formattedStartDate} to ${formattedEndDate}`,
        category: eventDetails.category,
        price: totalAmount,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        location: eventDetails.location,
        ticketDetails: {
          vipTickets: {
            quantity: formData.vipTickets,
            pricePerTicket: eventDetails.ticketPrice.vip,
            totalPrice: formData.vipTickets * eventDetails.ticketPrice.vip
          },
          generalTickets: {
            quantity: formData.generalTickets,
            pricePerTicket: eventDetails.ticketPrice.general,
            totalPrice: formData.generalTickets * eventDetails.ticketPrice.general
          },
          totalTickets: formData.vipTickets + formData.generalTickets,
          totalTicketPrice: totalAmount
        }
      };

      const paymentRequestData = {
        itemId: transactionId,
        totalPrice: totalAmount,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        userId: userId,
        packageDetails: packageDetails
      };

      if (formData.paymentPartner === 'esewa') {
        // Initialize eSewa payment
        const response = await axios.post('http://localhost:4000/esewa/initialize-esewa', paymentRequestData);

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
        const khaltiRequestData = {
          ...paymentRequestData,
          website_url: window.location.origin
        };

        const response = await axios.post('http://localhost:4000/khalti/initialize-khalti', khaltiRequestData);

        if (response.data.success && response.data.payment?.payment_url) {
          toast.success('Redirecting to Khalti payment...');
          // Redirect to Khalti payment page
          window.location.href = response.data.payment.payment_url;
        } else {
          throw new Error(response.data.message || 'Failed to get Khalti payment URL');
        }
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error(error.message || 'Failed to initialize payment. Please try again.');
      setFormErrors({
        submit: error.message || 'Failed to process payment. Please try again.'
      });
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
      await handlePayment(formData, eventDetails);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setFormErrors({
        submit: error.message || 'Failed to process payment. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-details-form-modal">
      <div className="user-details-modal-content">
        <div className="user-details-modal-header">
          <h2>Book {eventDetails.name}</h2>
          <p>Category: {eventDetails.category}</p>
          <p>Date: {formatDate(eventDetails.startDate)} - {formatDate(eventDetails.endDate)}</p>
          <p>Time: {eventDetails.startTime} - {eventDetails.endTime}</p>
          <p>Location: {eventDetails.location}</p>
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
            <h3>Select Tickets</h3>
            <div className="ticket-selection">
              <div className="ticket-option">
                <label>VIP Tickets (NPR {eventDetails.ticketPrice.vip})</label>
                <div className="ticket-controls">
                  <button 
                    type="button" 
                    onClick={() => handleTicketChange('vip', formData.vipTickets - 1)}
                    disabled={formData.vipTickets <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={formData.vipTickets}
                    onChange={(e) => handleTicketChange('vip', e.target.value)}
                    min="0"
                    max={eventDetails.capacity.vip}
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleTicketChange('vip', formData.vipTickets + 1)}
                    disabled={formData.vipTickets >= eventDetails.capacity.vip}
                  >
                    +
                  </button>
                </div>
                <span className="ticket-availability">
                  {eventDetails.capacity.vip - formData.vipTickets} available
                </span>
              </div>

              <div className="ticket-option">
                <label>General Tickets (NPR {eventDetails.ticketPrice.general})</label>
                <div className="ticket-controls">
                  <button 
                    type="button" 
                    onClick={() => handleTicketChange('general', formData.generalTickets - 1)}
                    disabled={formData.generalTickets <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={formData.generalTickets}
                    onChange={(e) => handleTicketChange('general', e.target.value)}
                    min="0"
                    max={eventDetails.capacity.general}
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleTicketChange('general', formData.generalTickets + 1)}
                    disabled={formData.generalTickets >= eventDetails.capacity.general}
                  >
                    +
                  </button>
                </div>
                <span className="ticket-availability">
                  {eventDetails.capacity.general - formData.generalTickets} available
                </span>
              </div>
            </div>
            {formErrors.tickets && <span className="error-message">{formErrors.tickets}</span>}
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

          <div className="total-amount">
            <h3>Total Amount: NPR {totalAmount}</h3>
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
              {isSubmitting ? (
                <>
                  <span className="loading-spinner">
                    <div className="spinner"></div>
                  </span>
                  Processing Payment...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventBookingForm; 