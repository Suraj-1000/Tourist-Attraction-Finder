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
            <h1>Payment Successful!</h1>
            <p>Thank you for your booking. Your transaction has been completed successfully.</p>
          </div>
        );
      case 'cancelled':
        return (
          <div className="status-message">
            <h1>Payment Cancelled</h1>
            <p>Your payment process was cancelled. You can:</p>
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

  return (
    <div className="payment-modal">
      <div className={`payment-modal-content ${status}`}>
        {getStatusIcon()}
        {getStatusMessage()}
        
        {paymentDetails && (
          <div className="payment-details">
            <div className="detail-row">
              <span>Transaction ID:</span>
              <span>{paymentDetails.transactionId}</span>
            </div>
            <div className="detail-row">
              <span>Package:</span>
              <span>{paymentDetails.packageTitle}</span>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>{formatAmount(paymentDetails.amount)}</span>
            </div>
            <div className="detail-row">
              <span>Duration:</span>
              <span>{paymentDetails.duration}</span>
            </div>
            <div className="detail-row">
              <span>Category:</span>
              <span>{paymentDetails.category}</span>
            </div>
            <div className="detail-row">
              <span>Name:</span>
              <span>{paymentDetails.name}</span>
            </div>
            <div className="detail-row">
              <span>Email:</span>
              <span>{paymentDetails.email}</span>
            </div>
            <div className="detail-row">
              <span>Phone:</span>
              <span>{paymentDetails.phone}</span>
            </div>
            <div className="detail-row">
              <span>Address:</span>
              <span>{paymentDetails.address}</span>
            </div>
            <div className="detail-row">
              <span>Date:</span>
              <span>{new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
              })}</span>
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