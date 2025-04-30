import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import "./Login.css";
import { toast } from "react-hot-toast";
import AuthFooter from "../../Components/Footer/AuthFooter";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, default to homepage if none exists
  const from = location.state?.from || '/Home';

  const handleLogin = async (e) => {
    e.preventDefault();
    const adminEmail = 'suraj.explore.nepal@gmail.com';
    const userRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 

    if (email !== adminEmail && !userRegex.test(email)) {
      toast.error("Invalid email format. Please enter a valid email address.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/login', { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Check user role for redirection
      const userRole = response.data.user.role;

      if (userRole === 'admin') {
        toast.success('Admin login successful! Redirecting to Admin Dashboard.');
        navigate('/AdminHome');
      } else if (userRole === 'guide') {
        // Check if guide is verified
        toast.success('Guide login successful! Redirecting to Guide Dashboard.');
        navigate('/guide/dashboard');        
        
      } else {
        // For regular users
        if (location.state?.from && location.state.from !== '/Home') {
          toast.success('Login successful! Redirecting to shared content.');
          navigate(location.state.from, { replace: true });
        } else {
          toast.success('Login successful! Redirecting to Home.');
          navigate('/Home');
        }
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
      <AuthFooter />
    </>
  );
}