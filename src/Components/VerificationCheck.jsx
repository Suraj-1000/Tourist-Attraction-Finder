import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './VerificationCheck.css';

const VerificationCheck = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
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
          setIsVerified(
            userData.guideProfile?.verificationStatus === 'approved'
          );
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

  if (!isVerified) {
    return (
      <div className="verification-pending">
        <div className="pending-container">
          <div className="pending-icon-wrapper">
            <img 
              src="/images/pending-verification.svg" 
              alt="Verification Pending" 
              className="pending-icon"
              onError={(e) => {e.target.src = 'https://cdn-icons-png.flaticon.com/512/1828/1828833.png'}}
            />
          </div>
          <h2>Account Verification Pending</h2>
          <p>Your account is awaiting for admin approval.</p>
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