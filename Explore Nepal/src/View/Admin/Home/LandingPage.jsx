import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faBookmark, faPlaneDeparture } from "@fortawesome/free-solid-svg-icons"; // Import the icons you need
import "./LandingPage.css";

const slides = [
  { type: "image", src: "/images/img1.jpg", alt: "Slide 1" },
  { type: "image", src: "/images/img2.jpg", alt: "Slide 2" },
  { type: "video", src: "/images/ktm.mp4", alt: "Video 1" },
  { type: "image", src: "/images/img3.jpg", alt: "Slide 3" },
  { type: "image", src: "/images/img4.jpg", alt: "Slide 4" },
  { type: "video", src: "/images/hi.mp4", alt: "Video 2" },
  { type: "image", src: "/images/img5.jpg", alt: "Slide 5" },
  { type: "video", src: "/images/him.mp4", alt: "Video 3" },
]; 

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="logoLP"></div>

      <div className="landingLP-container">
        <header className="landingLP-header">
          <h1 className="landingLP-title">Discover Breathtaking Attractions</h1>
          <p className="landingLP-subtitle">Find the best tourist spots with ease</p>
          <Link to="/login">
            <button className="landingLP-button">Explore Now</button>
          </Link>
        </header>

        <section className="landingLP-main-section">
          <div className="landingLP-media">
            <div className="landingLP-slideshow">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`landingLP-slide ${index === currentSlide ? "active" : ""}`}
                >
                  {slide.type === "image" ? (
                    <img src={slide.src} alt={slide.alt} className="landingLP-slide-image" />
                  ) : (
                    <video src={slide.src} autoPlay loop muted className="landingLP-slide-video" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="landingLP-info">
            <h2 className="landingLP-info-title">Why Choose Us?</h2>
            <div className="landingLP-info-cards">
              <div className="landingLP-info-card">
                <FontAwesomeIcon icon={faSync} className="landingLP-info-icon" />
                <h3 className="landingLP-info-card-title">Real-time Updates</h3>
                <p className="landingLP-info-text">Find the best attractions with up-to-date information and user reviews.</p>
              </div>
              <div className="landingLP-info-card">
                <FontAwesomeIcon icon={faBookmark} className="landingLP-info-icon" />
                <h3 className="landingLP-info-card-title">Save Your Favorites</h3>
                <p className="landingLP-info-text">Bookmark your favorite places and create personalized itineraries.</p>
              </div>
              <div className="landingLP-info-card">
                <FontAwesomeIcon icon={faPlaneDeparture} className="landingLP-info-icon" />
                <h3 className="landingLP-info-card-title">Seamless Planning</h3>
                <p className="landingLP-info-text">Experience an effortless travel planning process tailored for you.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
