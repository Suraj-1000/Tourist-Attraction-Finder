import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGavel,
  faShield,
  faUserLock,
  faFileContract,
  faHandshake,
  faMoneyBill,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import './StaticPages.css';
import UserHeader from '../User Header/User-Header';
import Footer from '../Footer';

const TermsAndConditions = () => {
  return (
    <div className="page-container">
      <UserHeader />
      <div className="terms-container">
        <div className="terms-content">
          <div className="page-header">
            <FontAwesomeIcon icon={faGavel} className="header-main-icon" />
            <h1 className="page-title">Terms and Conditions</h1>
            <p className="page-subtitle">Please read our terms and conditions carefully before using our services</p>
          </div>

          <div className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faFileContract} className="section-icon" />
              General Terms
            </h2>
            <p>
              By accessing and using Explore Nepal, you agree to be bound by these terms and conditions.
              If you disagree with any part of these terms, you may not access our services.
            </p>
          </div>

          <div className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faUserLock} className="section-icon" />
              User Accounts
            </h2>
            <p>
              When you create an account with us, you must provide accurate and complete information.
              You are responsible for maintaining the security of your account and password.
            </p>
            <ul>
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for all activities under your account</li>
              <li>You must notify us immediately of any security breach</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faShield} className="section-icon" />
              Privacy & Data Protection
            </h2>
            <p>
              We take your privacy seriously and handle your data in accordance with our privacy policy.
              Your personal information will be protected and only used for the purposes specified in our policy.
            </p>
            <ul>
              <li>We collect and process data in accordance with applicable laws</li>
              <li>Your data is encrypted and stored securely</li>
              <li>We do not share your personal information with third parties without consent</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faMoneyBill} className="section-icon" />
              Payment Terms
            </h2>
            <p>
              All payments are processed securely through our authorized payment partners.
              We accept payments through Khalti and Esewa for your convenience.
            </p>
            <ul>
              <li>All transactions are processed in Nepalese Rupees (NPR)</li>
              <li>Payment information is encrypted and secured</li>
              <li>Refunds are processed according to our refund policy</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>
              <FontAwesomeIcon icon={faHandshake} className="section-icon" />
              User Conduct
            </h2>
            <p>
              Users are expected to behave responsibly and respectfully while using our platform.
              Any violation of these terms may result in account suspension or termination.
            </p>
            <ul>
              <li>Respect other users and their privacy</li>
              <li>Do not post inappropriate or harmful content</li>
              <li>Follow local laws and regulations</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsAndConditions; 
