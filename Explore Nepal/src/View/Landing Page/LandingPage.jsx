import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faBookmark, faPlaneDeparture, faSearch, faMapMarkedAlt, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import "./LandingPage.css";
import Footer from "../../Components/Footer"

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

const featureSlides = [
  {
    icon: faSync,
    title: "Real-time Updates",
    text: "Find the best attractions with up-to-date information and user reviews.",
  },
  {
    icon: faBookmark,
    title: "Save Your Favorites",
    text: "Bookmark your favorite places and create personalized itineraries.",
  },
  {
    icon: faPlaneDeparture,
    title: "Seamless Planning",
    text: "Experience an effortless travel planning process tailored for you.",
  },
  {
    icon: faSearch,
    title: "Search Attractions",
    text: "Easily find the best tourist spots with our advanced search feature.",
  },
  {
    icon: faMapMarkedAlt,
    title: "Explore Map",
    text: "Navigate through destinations with our interactive map feature.",
  },
  {
    icon: faClipboardList,
    title: "Book Your Plans",
    text: "Plan and book your trips effortlessly in one place.",
  },
];


export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % featureSlides.length);
    }, 5000);

    return () => clearInterval(featureInterval);
  }, []);

  return (
    <>
      <div className="logoLP"></div>

      <div className="landingLP-container">
        <div className="landingLP-auth-buttons">
          <Link to="/login">
            <button className="landingLP-auth-button">Login</button>
          </Link>
          <Link to="/signup">
            <button className="landingLP-auth-button signup">Sign Up</button>
          </Link>
        </div>

        <header className="landingLP-header">
          <h1 className="landingLP-title">Discover Breathtaking Attractions</h1>
          <p className="landingLP-subtitle">Find the best tourist spots with ease</p>
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

          {/* Slideshow for additional features */}
          <div className="landingLP-info">
            <h2 className="landingLP-info-title">Why Choose Us?</h2>
            <div className="landingLP-slideshow-container">
              {featureSlides.map((slide, index) => (
                <div key={index} className={`landingLP-slideshow-slide ${index === currentFeature ? "active" : ""}`}>
                  <FontAwesomeIcon icon={slide.icon} className="landingLP-info-icon" />
                  <h3 className="landingLP-info-card-title">{slide.title}</h3>
                  <p className="landingLP-info-text">{slide.text}</p>
                </div>
              ))}
            </div>
            
            <div className="landingLP-nav-dots">
              {featureSlides.map((_, index) => (
                <div
                  key={index}
                  className={`landingLP-nav-dot ${index === currentFeature ? "active" : ""}`}
                  onClick={() => setCurrentFeature(index)}
                ></div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
