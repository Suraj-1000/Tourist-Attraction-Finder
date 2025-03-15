import React from "react";
import "./Footer.css";
export default function Footer(){
    return (
        <>
        <div className="footer10">
        <div className="footer-section-10">
          <div className="text-box10">
            <h1 className="footer-title10">Get our pro offers</h1>
            <p className="footer-description10">Create a visual identity for your company, and an overall branding that stands out.</p>
          </div>
          <div className="search-box10">
            <input className="email-search-input10" type="text" placeholder="Enter your email" />
            <button className="email-search-button10">Subscribe</button>
          </div>
        </div>

        <div className="footer-section-20">

          <div className="footer-title-10">
            <div className="footer-logo10"></div>
            <span className="description10">Hello, we are Lift Media. Our goal is to translate the positive effects from revolutionizing.</span>
            <div className="footer-icons10">
              <span className="footer-icons-11"></span>
              <span className="footer-icons-12"></span>
              <span className="footer-icons-13"></span>
              <span className="footer-icons-14"></span>
            </div>
          </div>

          <div className="footer-title-20">
            <div className="footer-title-2-heading10">About</div>
            <div className="footer-links10">
              <ul>
                  <li>About Us</li>
                  <li>Our Services</li>
                  <li>Privacy Policy</li>
                  <li>Terms & Conditions</li>
                </ul>
            </div>
          </div>

          <div className="footer-title-30">
            <div className="footer-title-3-heading10">Contact</div>
            <div className="Footer-contact-list10">
              <ul>
                  <li>
                    <div className="icon-phone10"></div>
                    <span className="text10">9817477002</span>
                  </li>
                  <li>
                    <div className="icon-email10"></div>
                    <span className="text10">explorenepal@.com</span> 
                  </li>
                  <li>
                    <div className="icon-location10"></div>
                    <span className="text10">Maitidevi, Kathmandu</span>   
                  </li>
                </ul>
            </div>
          </div>

          <div className="footer-title-40">
            <div className="footer-title-4-heading10">Gallery</div>
            <div className="footer-gallery-list10">
                <div className="gallery-item10 gallery-img-11"></div>
                <div className="gallery-item10 gallery-img-12"></div>
                <div className="gallery-item10 gallery-img-13"></div>
                <div className="gallery-item10 gallery-img-14"></div>
                <div className="gallery-item10 gallery-img-15"></div>
                <div className="gallery-item10 gallery-img-16"></div>
            </div>
          </div>
        </div>
        <div className="footer-section-30">
            <span>© 2024 ExploreNepal. All rights reserved</span>
          </div>
      </div>

        </>
    );
}