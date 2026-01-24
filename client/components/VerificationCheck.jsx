import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './VerificationCheck.css';

const VerificationCheck = ({ children }) => {
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('You are not logged in');
          navigate('/login');
          return;
        }

        const response = await axios.get(
          'http://localhost:4000/adminUpdateProfile/getGuideProfile',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          const userData = response.data;
          setVerificationStatus(userData.guideProfile?.verificationStatus || 'pending');
          
          if (userData.guideProfile?.rejectionReason) {
            setRejectionReason(userData.guideProfile.rejectionReason);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking verification status:', error);
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [navigate]);

  if (loading) {
    return <div className="verification-loading">Loading...</div>;
  }

  if (verificationStatus !== 'approved') {
    return (
      <div className={`verification-pending ${verificationStatus}`}>
        <div className="pending-container">
          <div className="pending-icon-wrapper">
            <img 
              src={
                verificationStatus === 'rejected' 
                  ? "/images/rejected-verification.svg" 
                  : "/images/pending-verification.svg"
              } 
              alt={`Verification ${verificationStatus}`} 
              className="pending-icon"
              onError={(e) => {
                e.target.src = verificationStatus === 'rejected' 
                  ? 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png' 
                  : 'https://cdn-icons-png.flaticon.com/512/1828/1828833.png'
              }}
            />
          </div>
          {verificationStatus === 'rejected' ? (
            <>
              <h2>Account Verification Rejected</h2>
              <p>Your guide account verification was not approved.</p>
              {rejectionReason && (
                <div className="rejection-reason">
                  <h3>Reason for Rejection:</h3>
                  <p>{rejectionReason}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Account Verification Pending</h2>
              <p>Your account is awaiting admin approval.</p>
            </>
          )}
          <button 
            className="guide-back-button"
            onClick={() => navigate('/guide/profile')}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerificationCheck; 
