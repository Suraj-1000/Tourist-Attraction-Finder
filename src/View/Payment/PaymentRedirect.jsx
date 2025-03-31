import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';

const PaymentRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const gateway = params.get('gateway') || localStorage.getItem('paymentGateway');
        const storedDetails = JSON.parse(localStorage.getItem('paymentDetails') || '{}');
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const returnPath = localStorage.getItem('returnPath') || '/';

        // Set default payment details from stored data
        let details = {
          transactionId: params.get('transaction_id') || storedDetails.transactionId || 'N/A',
          packageTitle: storedDetails.title || 'Package Booking',
          amount: storedDetails.price || 0,
          duration: storedDetails.duration || 'N/A',
          category: storedDetails.category || 'N/A',
          name: userDetails.name || 'N/A',
          email: userDetails.email || 'N/A',
          phone: userDetails.phone || 'N/A',
          address: userDetails.address || 'N/A',
          returnPath: returnPath
        };

        // Check if we're on a success path
        const isSuccessPath = location.pathname.includes('success');
        
        if (gateway === 'esewa') {
          // For eSewa, check for data parameter which contains the encoded response
          const data = params.get('data');
          if (data) {
            try {
              // The data parameter contains the payment response
              const decodedData = JSON.parse(atob(data));
              if (decodedData.status === 'COMPLETE') {
                setPaymentStatus('success');
                details = {
                  ...details,
                  transactionId: decodedData.transaction_code,
                  amount: parseFloat(decodedData.total_amount) || details.amount
                };
              } else {
                setPaymentStatus('failure');
              }
            } catch (error) {
              console.error('Error decoding eSewa response:', error);
              setPaymentStatus('failure');
            }
          } else if (isSuccessPath) {
            // If we're on success path but no data parameter, still show success
            setPaymentStatus('success');
          } else if (location.pathname.includes('cancelled')) {
            setPaymentStatus('cancelled');
          } else if (location.pathname.includes('failure')) {
            setPaymentStatus('failure');
          }
        } else if (gateway === 'khalti') {
          const status = params.get('status');
          const pidx = params.get('pidx');
          const transaction_id = params.get('transaction_id');
          
          if ((status === 'Completed' && pidx) || transaction_id) {
            setPaymentStatus('success');
            details = {
              ...details,
              transactionId: pidx || transaction_id
            };
          } else if (status === 'Cancelled' || location.pathname.includes('cancelled')) {
            setPaymentStatus('cancelled');
          } else if (location.pathname.includes('failure')) {
            setPaymentStatus('failure');
          }
        } else {
          // Default status based on URL path if gateway is not specified
          if (isSuccessPath) {
            setPaymentStatus('success');
          } else if (location.pathname.includes('cancelled')) {
            setPaymentStatus('cancelled');
          } else if (location.pathname.includes('failure')) {
            setPaymentStatus('failure');
          }
        }

        setPaymentDetails(details);

        // Clear localStorage only after successful payment
        if (paymentStatus === 'success') {
          localStorage.removeItem('paymentGateway');
          localStorage.removeItem('paymentDetails');
          localStorage.removeItem('userDetails');
          // Keep returnPath for navigation after modal closes
        }

      } catch (error) {
        console.error('Error processing payment:', error);
        setPaymentStatus('failure');
        setPaymentDetails({
          ...paymentDetails,
          packageTitle: 'Package Booking',
          amount: 0,
          duration: 'N/A',
          category: 'N/A',
          name: 'N/A',
          email: 'N/A',
          phone: 'N/A',
          address: 'N/A',
          returnPath: '/'
        });
      }
    };

    fetchPaymentStatus();
  }, [location, paymentStatus]);

  const handleClose = () => {
    setShowModal(false);
    // Navigate to the original page where booking was initiated
    navigate(paymentDetails?.returnPath || '/');
  };

  const handleRetry = () => {
    // Preserve the stored data and go back to the payment form
    navigate(paymentDetails?.returnPath || '/');
  };

  const handleGoHome = () => {
    if (paymentStatus === 'success') {
      // Clear remaining localStorage data
      localStorage.removeItem('returnPath');
      // On success, navigate to booking history
      navigate('/AdminBookingHistory');
    } else {
      // On failure/cancel, return to the original booking page
      navigate(paymentDetails?.returnPath || '/');
    }
  };

  // If no payment details are available, show a loading state
  if (!paymentDetails) {
    return <div className="loading">Processing payment...</div>;
  }

  return (
    <PaymentModal
      isOpen={showModal}
      onClose={handleClose}
      status={paymentStatus}
      paymentDetails={paymentDetails}
      onRetry={handleRetry}
      onGoHome={handleGoHome}
    />
  );
};

export default PaymentRedirect; 