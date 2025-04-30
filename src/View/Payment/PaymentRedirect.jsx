import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';

const PaymentRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const gateway = params.get('gateway') || localStorage.getItem('paymentGateway');
        const storedDetails = JSON.parse(localStorage.getItem('paymentDetails') || '{}');
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const returnPath = localStorage.getItem('returnPath') || '/';

        console.log('Stored Details:', storedDetails); // Debug log
        console.log('Return Path:', returnPath); // Debug log for return path

        // Determine if this is an event booking based on stored details
        const isEvent = storedDetails.startDate && storedDetails.endDate;

        // Set default payment details with proper structure
        let details = {
          transactionId: params.get('transaction_id') || storedDetails.transactionId || 'N/A',
          paymentGateway: gateway || 'N/A',
          packageDetails: {
            title: storedDetails.title || 'N/A',
            duration: isEvent ? 
              `${formatDate(storedDetails.startDate)} - ${formatDate(storedDetails.endDate)}` :
              storedDetails.duration || 'N/A',
            category: storedDetails.category || 'N/A',
            price: storedDetails.totalAmount || storedDetails.price || 0,
            startTime: storedDetails.startTime || 'N/A',
            endTime: storedDetails.endTime || 'N/A',
            location: storedDetails.location || 'N/A'
          },
          userDetails: {
            name: userDetails.name || 'N/A',
            email: userDetails.email || 'N/A',
            phone: userDetails.phone || 'N/A',
            address: userDetails.address || 'N/A'
          },
          returnPath: returnPath
        };

        // Add ticket details if they exist
        if (storedDetails.vipTickets !== undefined || storedDetails.generalTickets !== undefined) {
          details.ticketDetails = {
            vipTickets: {
              quantity: storedDetails.vipTickets || 0,
              pricePerTicket: storedDetails.vipPrice || 0,
              totalPrice: (storedDetails.vipTickets || 0) * (storedDetails.vipPrice || 0)
            },
            generalTickets: {
              quantity: storedDetails.generalTickets || 0,
              pricePerTicket: storedDetails.generalPrice || 0,
              totalPrice: (storedDetails.generalTickets || 0) * (storedDetails.generalPrice || 0)
            },
            totalTickets: (storedDetails.vipTickets || 0) + (storedDetails.generalTickets || 0),
            totalTicketPrice: storedDetails.totalAmount || 0
          };
        }

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
                  transactionId: decodedData.transaction_code
                };
              } else {
                setPaymentStatus('failure');
              }
            } catch (error) {
              console.error('Error decoding eSewa response:', error);
              setPaymentStatus('failure');
            }
          } else if (isSuccessPath) {
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
          } else if (location.pathname.includes('cancelled')) {
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

        // Log the final details for debugging
        console.log('Final Payment Details:', details);
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
        const returnPath = localStorage.getItem('returnPath') || '/';
        const storedDetails = JSON.parse(localStorage.getItem('paymentDetails') || '{}');
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const isEvent = storedDetails.startDate && storedDetails.endDate;

        setPaymentDetails({
          transactionId: 'N/A',
          paymentGateway: 'N/A',
          packageDetails: {
            title: storedDetails?.title || 'N/A',
            duration: isEvent ? 
              `${formatDate(storedDetails.startDate)} - ${formatDate(storedDetails.endDate)}` :
              storedDetails?.duration || 'N/A',
            category: storedDetails?.category || 'N/A',
            price: storedDetails?.totalAmount || storedDetails?.price || 0,
            startTime: storedDetails?.startTime || 'N/A',
            endTime: storedDetails?.endTime || 'N/A',
            location: storedDetails?.location || 'N/A'
          },
          userDetails: {
            name: userDetails?.name || 'N/A',
            email: userDetails?.email || 'N/A',
            phone: userDetails?.phone || 'N/A',
            address: userDetails?.address || 'N/A'
          },
          returnPath: returnPath
        });
      }
    };

    fetchPaymentStatus();
  }, [location]);

  const handleClose = () => {
    setShowModal(false);
    const returnPath = localStorage.getItem('returnPath');
    // Clean up localStorage
    localStorage.removeItem('returnPath');
    // Navigate back to the original page
    navigate(returnPath || '/');
  };

  const handleRetry = () => {
    const returnPath = localStorage.getItem('returnPath');
    // Navigate back to the payment form while preserving the return path
    navigate(returnPath || '/');
  };

  const handleGoHome = () => {
    if (paymentStatus === 'success') {
      // Clear all localStorage data
      localStorage.removeItem('returnPath');
      localStorage.removeItem('paymentGateway');
      localStorage.removeItem('paymentDetails');
      localStorage.removeItem('userDetails');
      // On success, navigate to booking history
      navigate('/Booking-History');
    } else {
      // On failure/cancel, return to the original booking page
      const returnPath = localStorage.getItem('returnPath');
      localStorage.removeItem('returnPath');
      navigate(returnPath || '/');
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