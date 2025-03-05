import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/login', { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      console.log(response.data.message);
      navigate('/AdminHome');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      alert(errorMessage);
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
            <button type="submit" className="button">Login</button>
          </form>
          <span className="divider">or</span>
          <p className="register">
            Don’t have an account yet? <Link to="/signup" className="link">Register for free</Link>
          </p>
        </div>
      </div>
    </>
  );
}