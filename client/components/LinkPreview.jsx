import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './LinkPreview.css';

const LinkPreview = () => {
  const location = useLocation();
  const path = location.pathname;

  const getContentInfo = () => {
    if (path.includes('AdminAttractionView')) {
      return {
        type: 'Attraction',
        title: 'Discover Amazing Attractions'
      };
    } else if (path.includes('ItineraryPackageView')) {
      return {
        type: 'Package',
        title: 'Explore Travel Packages'
      };
    } else if (path.includes('ViewTripDetails')) {
      return {
        type: 'Trip',
        title: 'View Trip Details'
      };
    } else if (path.includes('AdminEventView')) {
      return {
        type: 'Event',
        title: 'Explore Exciting Events'
      };
    }
    return { type: 'Content', title: 'Explore Content' };
  };

  const contentInfo = getContentInfo();

  return (
    <div className="linkPreview-container-classname34">
      <div className="linkPreview-card-classname34">
        <div className="linkPreview-logo-classname34"></div>
        <h1 className="linkPreview-welcome-title-classname34">Welcome to Explore Nepal!</h1>
        <h2 className="linkPreview-content-title-classname34">{contentInfo.title}</h2>
        
        <div className="linkPreview-info-section-classname34">
          <p className="linkPreview-info-text-classname34">
            Someone has shared an exciting {contentInfo.type.toLowerCase()} with you.
            To view this content:
          </p>
          
          <div className="linkPreview-steps-container-classname34">
            <div className="linkPreview-step-classname34">
              <span className="linkPreview-step-number-classname34">1</span>
              <p>Create an account or log in to your existing account</p>
            </div>
            <div className="linkPreview-step-classname34">
              <span className="linkPreview-step-number-classname34">2</span>
              <p>You'll be automatically redirected to the shared content</p>
            </div>
            <div className="linkPreview-step-classname34">
              <span className="linkPreview-step-number-classname34">3</span>
              <p>Explore and enjoy the amazing content!</p>
            </div>
          </div>
        </div>

        <div className="linkPreview-action-buttons-classname34">
          <Link 
            to="/login" 
            state={{ from: path }}
            className="linkPreview-login-button-classname34"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            state={{ from: path }}
            className="linkPreview-signup-button-classname34"
          >
            Sign Up
          </Link>
        </div>

        <div className="linkPreview-footer-text-classname34">
          <p>Join our community to discover more amazing destinations and travel experiences!</p>
        </div>
      </div>
    </div>
  );
};

export default LinkPreview; 
