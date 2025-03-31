import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import "./Login.css";
import { toast } from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, default to homepage if none exists
  const from = location.state?.from || '/Homepage';

  const handleLogin = async (e) => {
    e.preventDefault();
    const userRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 

    if (!userRegex.test(email)) {
      toast.error("Invalid email format. Please enter a valid email address.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/login', { email, password });
      
      // Add address field to user data if it doesn't exist
      const userData = {
        ...response.data.user,
        address: response.data.user.address || 'Maitidevi Kathmandu' // Default address if not provided
      };
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Check user role and navigate accordingly
      if (response.data.user.role === 'admin') {
        toast.success('Admin login successful! Redirecting to Admin Dashboard.');
        navigate('/AdminHome');
      } else {
        toast.success('Login successful! Redirecting to shared content.');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="logo4"></div>
      <div className="main-container">
        <div className="card">
          <h1 className="title">Welcome Back!</h1>
          <p className="subtitle">Login to Continue your Journey</p>
          {error && <p className="error-message">{error}</p>}
          <form className="form" onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="username@gmail.com"
              className="input input-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <div className="password-field password-full">
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className="input input-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-icon inside"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <Link to="/forgot" className="link">Forgot Password</Link>
            <button type="submit" className="button00">Login</button>
          </form>
          <span className="divider">or</span>
          <p className="register">
            Don't have an account yet? <Link to="/signup" className="link">Register for free</Link>
          </p>
        </div>
      </div>
    </>
  );
}