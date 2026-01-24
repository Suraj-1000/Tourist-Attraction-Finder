import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './EventPreferencesModal.css';

const EventPreferencesModal = ({ isOpen, onComplete, onClose, initialPreferences = [] }) => {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  const categories = ['Cultural', 'Festival', 'Sports', 'Music', 'Food', 'Religious', 'None'];

  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:4000/preferences/get-preferences',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setPreferences(response.data.preferences || []);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  const handleCheckboxChange = (category) => {
    if (category === 'None') {
      // If None is selected, clear all other preferences
      setPreferences(['None']);
    } else {
      setPreferences(prev => {
        // If selecting any other category, remove 'None' if it exists
        const withoutNone = prev.filter(p => p !== 'None');
        
        if (prev.includes(category)) {
          // If category is already selected, remove it
          return withoutNone.filter(p => p !== category);
        } else {
          // Add the new category
          return [...withoutNone, category];
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (preferences.length === 0) {
      // If no preferences selected, default to None
      setPreferences(['None']);
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:4000/preferences/update-preferences',
        { preferences },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Preferences saved successfully');
        onComplete(preferences); // Pass the updated preferences back
      } else {
        throw new Error(response.data.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Prevent closing when clicking overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="preferences-modal-overlay" onClick={handleOverlayClick}>
      <div className="preferences-modal-content">
        <div className="preferences-header">
          <h2>Select Your Event Preferences</h2>
          <p>Choose the types of events you're interested in:</p>
        </div>
        
        <div className="preferences-body">
          <div className="preferences-grid">
            {categories.map(category => (
              <label key={category} className={`preference-checkbox ${preferences.includes(category) ? 'selected' : ''}`}>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={preferences.includes(category)}
                    onChange={() => handleCheckboxChange(category)}
                  />
                  <span className="checkbox-label">{category}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="modal-buttons">
            <button 
              className="back-button" 
              onClick={onClose}
              disabled={isLoading}
            >
              Back
            </button>
            <button 
              className="save-preferences-btn" 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreferencesModal; 
