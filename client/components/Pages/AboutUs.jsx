import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInfoCircle, 
  faMountain, 
  faUsers, 
  faHandshake, 
  faGlobeAsia,
  faHeart,
  faStar,
  faMapMarkedAlt,
  faCalendarAlt,
  faSearch,
  faHotel,
  faUtensils,
  faPlane,
  faTicketAlt,
  faComments,
  faPhoneAlt,
  faLanguage,
  faMoneyBillWave,
  faSuitcase,
  faCreditCard,
  faShareAlt,
  faBookmark,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import '../Footer.css';
import './StaticPages.css';
import UserHeader from '../User Header/User-Header';
import Footer from '../Footer';

const AboutUs = () => {
  return (
    <div className="page-container">
      <UserHeader />
      <div className="about-us-container">
        <div className="about-us-content">
          <div className="page-header">
            <FontAwesomeIcon icon={faUsers} className="header-main-icon" />
            <h1 className="page-title">About Us</h1>
            <p className="page-subtitle">Discover our story and mission to make your travel experience extraordinary</p>
          </div>

          <div className="about-section">
            <div className="section-header">
              <FontAwesomeIcon icon={faMountain} className="section-icon" />
              <h2>Our Story</h2>
            </div>
            <p>
              Explore Nepal was founded with a passion for showcasing the incredible beauty and rich cultural heritage of Nepal. Our team of experienced travel enthusiasts and local experts work together to create unforgettable experiences for our visitors.
            </p>
          </div>

          <div className="about-section">
            <div className="section-header">
              <FontAwesomeIcon icon={faGlobeAsia} className="section-icon" />
              <h2>Our Mission</h2>
            </div>
            <p>
              We are dedicated to promoting sustainable tourism in Nepal while preserving its natural beauty and cultural traditions. Our mission is to provide authentic experiences that benefit both travelers and local communities.
            </p>
          </div>

          <div className="about-section">
            <div className="section-header">
              <FontAwesomeIcon icon={faUsers} className="section-icon" />
              <h2>Our Team</h2>
            </div>
            <p>
              Our team consists of passionate individuals who are deeply connected to Nepal's culture and landscapes. From expert guides to cultural specialists, we ensure that every aspect of your journey is carefully curated.
            </p>
          </div>

          <div className="services-section">
            <div className="section-header">
              <FontAwesomeIcon icon={faHandshake} className="section-icon" />
              <h2>Our Services</h2>
            </div>
            <div className="services-grid">
              <div className="service-card">
                <FontAwesomeIcon icon={faMountain} className="service-icon" />
                <h3>Adventure Tours</h3>
                <p>Experience the thrill of trekking in the Himalayas and other exciting adventures.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faHeart} className="service-icon" />
                <h3>Cultural Experiences</h3>
                <p>Immerse yourself in Nepal's rich cultural heritage and traditions.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faMapMarkedAlt} className="service-icon" />
                <h3>Interactive Maps</h3>
                <p>Explore Nepal through our detailed interactive maps and location guides.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faCalendarAlt} className="service-icon" />
                <h3>Event Calendar</h3>
                <p>Stay updated with cultural events, festivals, and activities across Nepal.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faSearch} className="service-icon" />
                <h3>Attraction Search</h3>
                <p>Find and explore popular tourist attractions with detailed information.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faCreditCard} className="service-icon" />
                <h3>Local Payment</h3>
                <p>Secure payments through Khalti and Esewa for convenient local transactions.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faPhoneAlt} className="service-icon" />
                <h3>Emergency Services</h3>
                <p>24/7 emergency support, medical assistance, and safety information for travelers.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faLanguage} className="service-icon" />
                <h3>Language & Currency</h3>
                <p>Language translation services and currency exchange information for your convenience.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faShareAlt} className="service-icon" />
                <h3>Share Features</h3>
                <p>Share your favorite destinations and experiences with friends and family.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faBookmark} className="service-icon" />
                <h3>Favorites</h3>
                <p>Save and organize your favorite places and activities for easy access.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faEye} className="service-icon" />
                <h3>Detailed Views</h3>
                <p>Access comprehensive information about destinations, including photos and reviews.</p>
              </div>
              <div className="service-card">
                <FontAwesomeIcon icon={faComments} className="service-icon" />
                <h3>Travel Support</h3>
                <p>24/7 customer support and assistance throughout your journey.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs; 
