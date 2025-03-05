import React, { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom"; 
import "./Signup.css"; 
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";

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

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For loading state

  // Handle form submission with fetch
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false); // Stop loading if validation fails
      return;
    }

    if (!termsAccepted) {
      setError("You must agree to the terms and conditions");
      setIsLoading(false); // Stop loading if validation fails
      return;
    }

    // Post request to the server
    axios.post("http://localhost:4000/signups", { firstName, lastName, email, phone, password, confirmPassword, termsAccepted })
      .then((response) => {
        console.log(response);
        setSuccess("User registered successfully");
        alert("Account created successfully!");
        navigate("/login");
      })
      .catch((error) => {
        setError("Error during signup");
        console.log(error);
      });


    setError(""); // Clear any previous error
  };

  return (
    <>
      <div className="logo1"></div>
      <div className="main-container1">
        <div className="card1">
          <h1 className="title1">Create an Account</h1>
          <p className="subtitle1">Sign up to explore amazing destinations.</p>

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
                onChange={(e) => setTermsAccepted(e.target.checked)} // Set termsAccepted to the checkbox state
              />
              <label htmlFor="terms" className="agree-terms-conditions1">
                I agree to the Terms & Conditions
              </label>
            </div>

            {error && <p className="error-message1">{error}</p>}
            {success && <p className="success-message1">{success}</p>}

            <button className="submit-button1" type="submit" disabled={isLoading}>
              {isLoading ? "Signing Up..." : "Sign up"}
            </button>
          </form>
          <p className="or1">or</p>
          <div className="login-link1">
            <span className="have-account1">Already have an account? </span>
            <Link to="/login" className="login-here1">Login here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
