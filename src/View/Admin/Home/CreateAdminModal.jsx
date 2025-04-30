import React, { useState, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from 'axios';
import { toast } from 'react-toastify';

const CreateAdminModal = ({ onClose, users, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/signups/create-admin', {
        ...formData,
        createdBy: users.find(user => user.role === 'admin')?._id
      });

      if (response.data) {
        toast.success('New admin created successfully!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create admin');
      toast.error('Failed to create admin');
    }
  }, [formData, users, onSuccess, onClose]);

  return (
    <div className="modal-overlay35">
      <div className="modal-content35 create-admin-modal35">
        <button className="modal-close35" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>Create New Admin</h2>
        <form onSubmit={handleSubmit} className="create-admin-form35">
          <div className="form-row35">
            <div className="form-group35">
              <label>First Name:</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group35">
              <label>Last Name:</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row35">
            <div className="form-group35">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group35">
              <label>Phone:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row35">
            <div className="form-group35">
              <label>Password:</label>
              <div className="password-field">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="form-group35">
              <label>Confirm Password:</label>
              <div className="password-field">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  {confirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message35">
              {error}
            </div>
          )}

          <button type="submit" className="submit-btn35" style={{ backgroundColor: '#008000' }}>Create Admin</button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminModal; 