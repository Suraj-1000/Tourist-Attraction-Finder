import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="footer10">
      <div className="footer-section-10 animate-fade-in">
        <div className="text-box10">
          <h2 className="footer-title10">Join Our Newsletter</h2>
          <p className="footer-description10">Get the latest travel tips, deals, and cultural insights delivered to your inbox.</p>
        </div>
        <div className="search-box10">
          <input className="email-search-input10" type="email" placeholder="Enter your email" />
          <button className="email-search-button10">Subscribe</button>
        </div>
      </div>

      <div className="footer-section-20">
        <div className="footer-title-10">
          <div className="footer-logo10"></div>
          <span className="description10">
            Explore Nepal is your ultimate companion for discovering the breathtaking beauty
            and rich cultural heritage of the Himalayas.
          </span>
          <div className="footer-icons10">
            <span><FontAwesomeIcon icon={faFacebookF} /></span>
            <span><FontAwesomeIcon icon={faInstagram} /></span>
            <span><FontAwesomeIcon icon={faTwitter} /></span>
            <span><FontAwesomeIcon icon={faYoutube} /></span>
          </div>
        </div>

        <div className="footer-title-20">
          <h3 className="footer-title-2-heading10">Quick Links</h3>
          <nav className="footer-links10">
            <ul>
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
            </ul>
          </nav>
        </div>

        <div className="footer-title-30">
          <h3 className="footer-title-3-heading10">Contact Us</h3>
          <div className="Footer-contact-list10">
            <ul>
              <li>
                <FontAwesomeIcon icon={faPhone} />
                <span className="text10">+977-9817477002</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faEnvelope} />
                <span className="text10">contact@explorenepal.com</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span className="text10">Maitidevi, Kathmandu, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-title-40">
          <h3 className="footer-title-4-heading10">Top Destinations</h3>
          <div className="footer-gallery-list10">
            <div className="gallery-item10" style={{ backgroundImage: "url('/images/annapurna.png')" }}></div>
            <div className="gallery-item10" style={{ backgroundImage: "url('/images/lumbini.png')" }}></div>
            <div className="gallery-item10" style={{ backgroundImage: "url('/images/pokhara.png')" }}></div>
            <div className="gallery-item10" style={{ backgroundImage: "url('/images/chitwan.png')" }}></div>
            <div className="gallery-item10" style={{ backgroundImage: "url('/images/basantapur.png')" }}></div>
            <div className="gallery-item10" style={{ backgroundImage: "url('/images/boudha.png')" }}></div>
          </div>
        </div>
      </div>

      <div className="footer-section-30">
        <span>© {new Date().getFullYear()} Explore Nepal. All rights reserved. Locally crafted in Kathmandu.</span>
      </div>
    </footer>
  );
}
