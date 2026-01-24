import React from 'react';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, status, paymentDetails, onRetry, onGoHome }) => {
  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="success-icon">
            <FaCheck className="icon success" />
          </div>
        );
      case 'cancelled':
        return (
          <div className="success-icon warning">
            <FaClock className="icon warning" />
          </div>
        );
      default:
        return (
          <div className="success-icon error">
            <FaTimes className="icon error" />
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return (
          <div className="status-message">
            <h1 style={{textAlign: 'center'}}>Payment Successful!</h1>
            <p style={{textAlign: 'center'}}>Thank you for your booking. Your transaction has been completed successfully.</p>

          </div>
        );
      case 'cancelled':
        return (
          <div className="status-message">
            <h1 style={{textAlign: 'center'}}>Payment Cancelled</h1>
            <p style={{textAlign: 'center'}}>Your payment process was cancelled. You can:</p>
            <ul className="action-list">
              <li>Try the payment again</li>
              <li>Choose a different payment method</li>
              <li>Contact support if you need help</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="status-message">
            <h1>Payment Failed</h1>
            <p>We couldn't process your payment. This might be due to:</p>
            <ul className="action-list">
              <li>Insufficient funds in your account</li>
              <li>Invalid payment details provided</li>
              <li>Technical issues with the payment gateway</li>
            </ul>
          </div>
        );
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isEvent = paymentDetails?.packageDetails?.duration?.includes(' - ') && 
                  /[A-Za-z]+ \d{1,2}, \d{4} - [A-Za-z]+ \d{1,2}, \d{4}/.test(paymentDetails?.packageDetails?.duration);

  return (
    <div className="payment-modal">
      <div className={`payment-modal-content ${status}`}>
        {getStatusIcon()}
        {getStatusMessage()}
        
        {paymentDetails && (
          <div className="payment-details">
            <div className="detail-section">
              <h3>Booking Details</h3>
              <div className="detail-row">
                <span>Transaction ID:</span>
                <span>{paymentDetails.transactionId || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Package Name:</span>
                <span>{paymentDetails.packageDetails?.title || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Category:</span>
                <span>{paymentDetails.packageDetails?.category || 'N/A'}</span>
              </div>
              {isEvent ? (
                <>
                  <div className="detail-row">
                    <span>Event Date:</span>
                    <span>{paymentDetails.packageDetails?.duration || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Event Time:</span>
                    <span>{paymentDetails.packageDetails?.startTime || 'N/A'} - {paymentDetails.packageDetails?.endTime || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Location:</span>
                    <span>{paymentDetails.packageDetails?.location || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <div className="detail-row">
                  <span>Duration:</span>
                  <span>{paymentDetails.packageDetails?.duration || 'N/A'}</span>
                </div>
              )}
              <div className="detail-row">
                <span>Total Amount:</span>
                <span>{formatAmount(paymentDetails.packageDetails?.price || 0)}</span>
              </div>
            </div>

            {isEvent && paymentDetails.ticketDetails && (
              <div className="detail-section">
                <h3>Ticket Details</h3>
                {paymentDetails.ticketDetails.vipTickets?.quantity > 0 && (
                  <div className="detail-row">
                    <span>VIP Tickets:</span>
                    <span>
                      {paymentDetails.ticketDetails.vipTickets.quantity} x {formatAmount(paymentDetails.ticketDetails.vipTickets.pricePerTicket)} = {formatAmount(paymentDetails.ticketDetails.vipTickets.totalPrice)}
                    </span>
                  </div>
                )}
                {paymentDetails.ticketDetails.generalTickets?.quantity > 0 && (
                  <div className="detail-row">
                    <span>General Tickets:</span>
                    <span>
                      {paymentDetails.ticketDetails.generalTickets.quantity} x {formatAmount(paymentDetails.ticketDetails.generalTickets.pricePerTicket)} = {formatAmount(paymentDetails.ticketDetails.generalTickets.totalPrice)}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span>Total Tickets:</span>
                  <span>{paymentDetails.ticketDetails.totalTickets}</span>
                </div>
                <div className="detail-row">
                  <span>Total Amount:</span>
                  <span>{formatAmount(paymentDetails.ticketDetails.totalTicketPrice)}</span>
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>Customer Details</h3>
              <div className="detail-row">
                <span>Name:</span>
                <span>{paymentDetails.userDetails?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Email:</span>
                <span>{paymentDetails.userDetails?.email || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Phone:</span>
                <span>{paymentDetails.userDetails?.phone || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Address:</span>
                <span>{paymentDetails.userDetails?.address || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Payment Information</h3>
              <div className="detail-row">
                <span>Payment Method:</span>
                <span style={{ textTransform: 'capitalize' }}>{paymentDetails.paymentGateway || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Payment Status:</span>
                <span style={{ 
                  color: status === 'success' ? '#28a745' : status === 'cancelled' ? '#ffc107' : '#dc3545',
                  fontWeight: 'bold'
                }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <span>Payment Date:</span>
                <span>{new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}</span>
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          {status !== 'success' ? (
            <>
              <button className="button0000" onClick={onRetry}>
                Try Again
              </button>
              <button className="button0000 primary" onClick={onGoHome}>
                Go to Home
              </button>
            </>
          ) : (
            <>
              <button className="button0000" onClick={onClose}>
                Close
              </button>
              <button className="button0000 primary" onClick={onGoHome}>
                View Booking History
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 
