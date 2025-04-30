import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPass.css';
import axios from 'axios';
import { toast } from "react-hot-toast";
import AuthFooter from "../../Components/Footer/AuthFooter";

const SendLinkButton = ({ email }) => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/forgot', { email });  // Updated route here
      toast.success(response.data.message);
      navigate('/passReset'); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <button
      type="button"
      className="submit-button4"
      onClick={handleSubmit}
    >
      Send Reset Link
    </button>
  );
};

export default function ForgotPass() {
  const [email, setEmail] = useState('');

  return (
    <>
      <div className="logo4"></div>
      <div className="main-container4">
        <div className="forgot-password-box4">
          <h2 className="title4">Forgot Password?</h2>
          <p className="sub-title4">Enter your email to reset your password.</p>
          <form className="form4" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="email" className="label4">Email</label>
            <input
              type="email"
              id="email"
              placeholder="user@gmail.com"
              className="input-field4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <SendLinkButton email={email} />
          </form>
          <p className="or4">or</p>
          <p className="alternative4">
            Remember your password? <Link to="/login" className="link4">Login here</Link>
          </p>
        </div>
      </div>
      <AuthFooter />
    </>
  );
}
