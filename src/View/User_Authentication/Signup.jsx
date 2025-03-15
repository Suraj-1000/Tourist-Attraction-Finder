import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Signup.css";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, default to homepage if none exists
  const from = location.state?.from || '/Homepage';

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      toast.error("You must agree to the terms and conditions");
      setIsLoading(false);
      return;
    }

    axios.post("http://localhost:4000/signups", { firstName, lastName, email, phone, password, confirmPassword, termsAccepted })
      .then((response) => {
        toast.success("Registration successful. An OTP has been sent to your email.");
        setIsOtpSent(true);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || 'Error during signup. Please try again.');
        setIsLoading(false);
      });
  };

  // Handle OTP verification
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setIsOtpLoading(true);

    axios.post("http://localhost:4000/signups/verify-otp", { email, otp })
      .then((response) => {
        toast.success("OTP verified successfully. Account created!");
        // After successful signup, navigate to the shared link
        navigate(from, { replace: true });
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || 'Invalid OTP or OTP expired');
      })
      .finally(() => {
        setIsOtpLoading(false);
      });
  };

  return (
    <>
      <div className="logo1"></div>
      <div className="main-container1">
        <div className="card1">
          <h1 className="title1">Create an Account</h1>
          <p className="subtitle1">Sign up to explore amazing destinations.</p>

          {!isOtpSent ? (
            <form onSubmit={handleSubmit}>
              <div className="input-row0">
                <div className="input-group0">
                  <label htmlFor="first-name">First Name</label>
                  <input
                    type="text"
                    id="first-name"
                    className="input-field0"
                    name="firstName"
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="input-group0">
                  <label htmlFor="last-name">Last Name</label>
                  <input
                    type="text"
                    id="last-name"
                    className="input-field0"
                    name="lastName"
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              <div className="input-row0">
                <div className="input-group0">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="input-field0"
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>
                <div className="input-group0">
                  <label htmlFor="phone">Phone No.</label>
                  <input
                    type="tel"
                    id="phone"
                    className="input-field0"
                    name="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    required
                  />
                </div>
              </div>

              <div className="input-row0">
                <div className="input-group0">
                  <label htmlFor="password">Password</label>
                  <div className="password-field">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      className="input-field0"
                      name="password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
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
                </div>
                <div className="input-group0">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <div className="password-field">
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      id="confirm-password"
                      className="input-field0"
                      name="confirmPassword"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-icon inside"
                      onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    >
                      {confirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="terms1">
                <input
                  type="checkbox"
                  id="terms"
                  name="termsAccepted"
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="terms" className="agree-terms-conditions1">
                  I agree to the Terms & Conditions
                </label>
              </div>

              <button className="submit-button1" type="submit" disabled={isLoading}>
                {isLoading ? "Signing Up..." : "Sign up"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="input-group01">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  className="input-field01"
                  name="otp"
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="######"
                  required
                />
              </div>

              <button className="submit-button1" type="submit" disabled={isOtpLoading}>
                {isOtpLoading ? "Verifying OTP..." : "Verify OTP"}
              </button>
            </form>
          )}

          <p className="or1">or</p>
          <div className="login-link1">
            <span className="have-account1">Already have an account? </span>
            <Link to="/login" state={{ from }} className="login-here1">Login here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
