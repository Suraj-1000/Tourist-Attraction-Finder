import React, { useState } from 'react';
import '../Footer.css';
import './StaticPages.css';
import UserHeader from '../User Header/User-Header';
import Footer from '../Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, 
  faPlane, 
  faMapMarkedAlt, 
  faHeadset,
  faUserPlus,
  faEdit,
  faSearch,
  faCalendarAlt,
  faKey,
  faEnvelope,
  faChevronDown,
  faChevronUp,
  faUser,
  faCreditCard,
  faHeart,
  faShare,
  faGlobe,
  faPhone,
  faRoute
} from '@fortawesome/free-solid-svg-icons';

const FAQ = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState({});

  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const toggleQuestion = (questionId) => {
    setActiveQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const faqSections = [
    {
      id: 'account',
      title: 'Account & Profile',
      icon: faUser,
      questions: [
        {
          id: 'account-1',
          question: 'How do I create an account on Explore Nepal?',
          answer: 'Click on the "Sign Up" button in the top right corner, fill in your details, and follow the verification process to create your account.'
        },
        {
          id: 'account-2',
          question: 'Can I save my favorite destinations?',
          answer: 'Yes, once logged in, you can click the heart icon on any destination to save it to your favorites for easy access later.'
        },
        {
          id: 'account-3',
          question: 'How can I update my profile information?',
          answer: 'Go to your profile page, click on "Edit Profile", and you can update your personal information, preferences, and profile picture.'
        }
      ]
    },
    {
      id: 'features',
      title: 'System Features',
      icon: faGlobe,
      questions: [
        {
          id: 'features-1',
          question: 'How does the interactive map work?',
          answer: 'Our interactive map shows popular destinations, attractions, and routes. You can click on markers to view details and use filters to find specific types of locations.'
        },
        {
          id: 'features-2',
          question: 'How can I share destinations with friends?',
          answer: 'Each destination has a share button that allows you to share via social media or copy a direct link to share with others.'
        },
        {
          id: 'features-3',
          question: 'Can I create a custom itinerary?',
          answer: 'Yes, use our Itinerary Planner to create custom travel plans. You can add destinations, set dates, and organize your entire trip.'
        }
      ]
    },
    {
      id: 'payment',
      title: 'Payments & Transactions',
      icon: faCreditCard,
      questions: [
        {
          id: 'payment-1',
          question: 'What payment methods are accepted?',
          answer: 'We accept local payments through Khalti and Esewa for convenient and secure transactions.'
        },
        {
          id: 'payment-2',
          question: 'Is it safe to make payments through the platform?',
          answer: 'Yes, all payments are processed through secure payment gateways with encryption and security measures in place.'
        },
        {
          id: 'payment-3',
          question: 'How do I view my transaction history?',
          answer: 'Access your profile and navigate to "Transaction History" to view all your past payments and bookings.'
        }
      ]
    },
    {
      id: 'search',
      title: 'Search & Navigation',
      icon: faSearch,
      questions: [
        {
          id: 'search-1',
          question: 'How can I search for specific attractions?',
          answer: 'Use the search bar at the top of the page or navigate to "Search Attraction" to find specific places using filters and keywords.'
        },
        {
          id: 'search-2',
          question: 'Can I filter search results?',
          answer: 'Yes, you can filter results by category, location, rating, and other criteria to find exactly what you\'re looking for.'
        },
        {
          id: 'search-3',
          question: 'How do I view detailed information about a place?',
          answer: 'Click on any attraction to view its detailed page with photos, descriptions, reviews, and all relevant information.'
        }
      ]
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      icon: faHeart,
      questions: [
        {
          id: 'recommendations-1',
          question: 'How are recommendations generated?',
          answer: 'Our system uses your preferences, browsing history, and popular destinations to provide personalized recommendations.'
        },
        {
          id: 'recommendations-2',
          question: 'Can I get recommendations based on my interests?',
          answer: 'Yes, update your interests in your profile to receive more tailored recommendations for destinations and activities.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Technical Support',
      icon: faPhone,
      questions: [
        {
          id: 'support-1',
          question: 'What should I do if I encounter technical issues?',
          answer: 'Contact our support team through the "Help" section or email support@explorenepal.com for immediate assistance.'
        },
        {
          id: 'support-2',
          question: 'Is customer support available 24/7?',
          answer: 'Yes, our customer support team is available 24/7 to assist you with any issues or questions.'
        },
        {
          id: 'support-3',
          question: 'How can I report a problem with the website?',
          answer: 'Use the "Report Issue" button in the footer or contact our support team directly with details about the problem.'
        }
      ]
    }
  ];

  return (
    <div className="page-container">
      <UserHeader />
      <div className="faq-container">
        <div className="faq-content">
          <div className="page-header">
            <FontAwesomeIcon icon={faQuestionCircle} className="header-main-icon" />
            <h1 className="page-title">Frequently Asked Questions</h1>
            <p className="page-subtitle">Find answers to common questions about our services and features</p>
          </div>
          
          <div className="faq-sections">
            {faqSections.map((section) => (
              <div key={section.id} className="faq-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <FontAwesomeIcon icon={section.icon} className="section-icon" />
                  <h2>{section.title}</h2>
                  <FontAwesomeIcon
                    icon={activeSection === section.id ? faChevronUp : faChevronDown}
                    className="section-toggle"
                  />
                </div>
                {activeSection === section.id && (
                  <div className="section-content">
                    {section.questions.map((item) => (
                      <div key={item.id} className="faq-item">
                        <div
                          className="faq-question"
                          onClick={() => toggleQuestion(item.id)}
                        >
                          <FontAwesomeIcon icon={faQuestionCircle} className="question-icon" />
                          <h3>{item.question}</h3>
                          <FontAwesomeIcon
                            icon={activeQuestions[item.id] ? faChevronUp : faChevronDown}
                            className="question-toggle"
                          />
                        </div>
                        {activeQuestions[item.id] && <p>{item.answer}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ; 
