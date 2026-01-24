import React, { useState, useEffect } from "react";
import "./UserHomepage.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";


export default function Homepage() {

  const [greeting, setGreeting] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting("Good Afternoon");
    } else if (currentHour >= 18 && currentHour < 22) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night");
    }
  }, []);


  const destinations = [
    { name: "Pokhara", className: "pokharapng", imageUrl: "/images/Pokhara.png" },
    { name: "Kathmandu", className: "Kathmanduapng", imageUrl: "/images/ktm.jpg" },
    { name: "Chitwan", className: "Chitwanpng", imageUrl: "/images/Chitwan.png" },
    { name: "Lumbini", className: "Lumbinipng", imageUrl: "/images/Lumbini.png" },
    { name: "Ghandruk", className: "Ghandrukpng", imageUrl: "/images/ghandruk.jpg" },
    { name: "Nagarkot", className: "Nagarkotpng", imageUrl: "/images/nagarkot.jpg" },
    { name: "Bandipur", className: "Bandipurpng", imageUrl: "/images/banipur.jpg" },
    { name: "Rara Lake", className: "Rarapng", imageUrl: "/images/Rara.jpg" },
    { name: "Everest Base Camp", className: "EverestBaseCamppng", imageUrl: "/images/eve.jpg" },
    { name: "Annapurna Base Camp", className: "AnnapurnaBaseCamppng", imageUrl: "/images/annapurna.png" },
    { name: "Ilam", className: "Ilampng", imageUrl: "/images/ilam.jpg" },
    { name: "Janakpur", className: "Janakpurpng", imageUrl: "/images/janakpur.jpg" },
    { name: "Bhaktapur", className: "Bhaktapurpng", imageUrl: "/images/bhaktapur.jpg" },
    { name: "Patan", className: "Patanpng", imageUrl: "/images/patan.jpg" },
    { name: "Mustang", className: "Mustangpng", imageUrl: "/images/mustang.jpg" },
    { name: "Lo Manthang", className: "LoManthangpng", imageUrl: "/images/lomanthang.jpg" },
    { name: "Tilicho Lake", className: "TilichoLakepng", imageUrl: "/images/tilicho.jpg" },
    { name: "Gosaikunda", className: "Gosaikundapng", imageUrl: "/images/gosaikunda.jpg" },
    { name: "Kalinchowk", className: "Kalinchowkpng", imageUrl: "/images/kalinchowk.jpg" },
    { name: "Pathibhara", className: "Pathibharapng", imageUrl: "/images/pathibhara.jpg" },
    { name: "Ranimahal", className: "Tansenpng", imageUrl: "/images/Ranimahal.jpg" },
    { name: "Khaptad National Park", className: "Khaptadpng", imageUrl: "/images/khaptad.jpg" }
  ];
  

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % destinations.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <Header />

    <div className="main-container5">
        {/* Main content */}
        <div className="content5">
          <div className="Headings5">
            <span className="discover-best">Discover the Best</span>
            <br />
            <span className="tourist">Tourist </span>
            <span className="attractions">Attractions in Nepal</span>
          </div>
          
          <div className="greetings">
            <span className="greeting-text">{greeting},</span>
            <span className="user-suraj"> {user ? user.firstName : "Guest"}</span>
            <p className="explore-text">Explore beautiful places of Nepal with Explore Nepal</p>
          </div>
      </div>

      {/* Traveler's Point */}
      <div className="travelerspoint">
        <div className="travelerspng"></div>
        <div className="card-feature">
          <span className="feature-title">Traveler's Point</span><br/>
          <span className="feature-subtitle">We help to find your dream place</span><br></br>
          <span className="feature-description">
            Discover the best travel experiences curated just for you! Whether
            you are looking for an adventure-packed getaway, serene cultural
            retreats, or luxurious stays, Travelers Point has you covered.
            Explore, plan, and create unforgettable memories with ease.
          </span>
          <div className="stats">
          <div className="stat-card">
            <span className="stat-number">100+</span><br/>
            <span className="stat-label">Holiday Packages</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">172</span><br/>
            <span className="stat-label">Hotels</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">68</span><br/>
            <span className="stat-label">Elite Transportation</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">32M+</span><br/>
            <span className="stat-label">Travelers</span>
          </div>
        </div>
        </div>
      </div>

      <div className="section2">
        <h1 className="top-destinations">Top Destinations</h1>
        <p className="top-picks-for-you">Top Picks for You</p>

        <div className="destination-container">
          {destinations.map((dest, index) => {
            let positionClass = "hidden";

            if (index === currentIndex) {
              positionClass = "active"; // Show active destination
            } else if (index === (currentIndex - 1 + destinations.length) % destinations.length) {
              positionClass = "previous"; // Move previous destination out of view
            }

            return (
              <div key={index} className={`destination-card ${positionClass}`}>
                <div className="destination-image-container">
                  <img src={dest.imageUrl} alt={dest.name} className="destination-image" />
                  <span className="destination-name">{dest.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots for Navigation */}
        <div className="dots-container">
          {destinations.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentIndex ? "active-dot" : ""}`}
              onClick={() => setCurrentIndex(index)} // Clicking on a dot changes the slide
            ></span>
          ))}
        </div>
      </div>





      <div className="section3">
        <h1 className="title-recommendations">Recommendations</h1>
        <p className="explore-by-category">Explore by Category</p>

        <div className="categories">
          <div className="category-card">
            <div className="adventurepng"></div>
            <span className="category-name">Adventure</span>
          </div>
          <div className="category-card">
            <div className="naturepng"></div>
            <span className="category-name">Nature</span>
          </div>
          <div className="category-card">
            <div className="culturepng"></div>
            <span className="category-name">Culture</span>
          </div>
          <div className="category-card">
            <div className="foodpng"></div>
            <span className="category-name">Food</span>
          </div>
        </div>
        <p className="adventure-seeker">Whether you're an adventure seeker, a culture lover, or someone looking to relax, we have the perfect places for you!</p>
      </div>

      <div className="section4">
        <h1 className="promotions">Promotions</h1>
        <p className="deals-offers">Deals & Offers</p>
        <div className="offerpng">
          <h1 className="offers-heading">Deals & Offers</h1>
          <p className="offers-description">Save 20% on Guided Annapurna Trek Packages!</p>
          <button className="offers-button">Book Now</button>
        </div>
      </div>

      <div className="section5">
        <h1 className="why-choose-us">Why Choose Us?</h1>
        <p className="why-choose-us-text">
          Explore Nepal like never before with our smart tourist guide. From must-see attractions to hidden gems, we offer real-time recommendations, seamless itineraries, and interactive maps to enhance your travel experience.
        </p>
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon personalizedreco"></div>
            <span className="feature-name">Personalized Recommendations</span>
            <span className="feature-description">Get tailored suggestions based on your preferences.</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon itineraryplan"></div>
            <span className="feature-name">Itinerary Planner</span>
            <span className="feature-description">Plan trips easily with intuitive itinerary tools.</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon real-time-location"></div>
            <span className="feature-name">Real-Time Location Finder</span>
            <span className="feature-description">Find attractions instantly with real-time location tracking.</span>
          </div>
        </div>
      </div> 

      <div className="section6">
        <h1 className="testimonial">Testimonial</h1>
        <p className="what-they-say">What they say about us</p>
        <div className="testimonial-container">
          <div className="user-stories">User Stories</div>
          <div className="card-container">
          <div className="testimonial-card">
            <img className="testimonial-image" src="/images/u2.webp" alt="Sujal Basnet" />
            <span className="user-name">Sujal Basnet</span>
            <span className="user-post">Graphic Designer</span>
            <p className="user-rating">★★★★☆</p>
            <p className="testimonial-text">The itinerary planner saved me so much time. It’s like having a personal travel guide!</p>
          </div>

          <div className="testimonial-card">
            <img className="testimonial-image" src="/images/u3.png" alt="Suraj Thapa" />
            <span className="user-name">Isbin Shrestha</span>
            <span className="user-post">Travel Blogger</span>
            <p className="user-rating">★★★★★</p>
            <p className="testimonial-text">This app has transformed the way I travel. The recommendations are spot on!</p>
          </div>

          <div className="testimonial-card">
            <img className="testimonial-image" src="/images/u1.png" alt="Rajesh Malla" />
            <span className="user-name">Vibek Rana Magar</span>
            <span className="user-post">Business Owner</span>
            <p className="user-rating">★★★★☆</p>
            <p className="testimonial-text">I loved the ease of planning my trips. The interface is user-friendly and efficient!</p>
          </div>
        </div>
        </div>
      </div>

      <Footer />  

    </div>
    </>
  );
}
