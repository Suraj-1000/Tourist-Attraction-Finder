import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AttractionViewPage.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";

export default function AttractionViewPage() {
  const { attractionName } = useParams(); // Get the attraction name from the URL
  const [attraction, setAttraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // To navigate programmatically

  useEffect(() => {
    if (attractionName) {
      fetchAttractionDetails(attractionName);
    }
  }, [attractionName]);

  const fetchAttractionDetails = async (name) => {
    try {
      const encodedAttractionName = encodeURIComponent(name);
      console.log(`Fetching details for attraction: ${encodedAttractionName}`);

     const response = await axios.get(`http://localhost:4000/adminSearch/attraction`, {
        params: { name: attractionName } 
      });


      if (response.status === 200) {
        setAttraction(response.data);
      } else {
        setError("Failed to load attraction details.");
      }
    } catch (error) {
      console.error("Error fetching attraction details:", error);
      setError("Failed to load attraction details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading53">Loading attraction details...</div>;
  if (error) return <div className="error53">{error}</div>;
  if (!attraction) return <div className="error53">No attraction found.</div>;

  return (
    <>
      <Header />
      <div className="main-container53">
        <div className="heading53">
          <button className="back-button" onClick={() => navigate(-1)}>&#8592; Back</button>
        </div>

        <div className="image-section53">
          <img src={attraction.image} alt={attraction.name} className="image53" />
        </div>

        <div className="breadcrumb53">
          {attraction.ancestorLocations?.map((location, index) => (
            <span key={index} className="breadcrumb-item">
              {location} {index < attraction.ancestorLocations.length - 1 && " > "}
            </span>
          ))}
        </div>

        <h2 className="main-heading53">{attraction.name || "No Heading Available"}</h2>
        <p className="description53">{attraction.description || "No Description Available"}</p>

        {/* Additional Information in a Table */}
        <div className="info-container53">
          <h3 className="additional-heading53">Attraction Information</h3>
          <table className="info-table53">
            <tbody>
              <tr>
                <td><strong>Category:</strong></td>
                <td>{attraction.category || "No Category Available"}</td>
              </tr>
              <tr>
                <td><strong>Subcategories:</strong></td>
                <td>{attraction.subcategories || "None"}</td>
              </tr>
              <tr>
                <td><strong>Subtype:</strong></td>
                <td>{attraction.subtype || "None"}</td>
              </tr>
              <tr>
                <td><strong>Rating:</strong></td>
                <td>⭐ {attraction.rating} ({attraction.numberOfReviews || "N/A"} reviews)</td>
              </tr>
              <tr>
                <td><strong>Address:</strong></td>
                <td>{attraction.address || "N/A"}</td>
              </tr>
              <tr>
                <td><strong>Phone:</strong></td>
                <td>{attraction.phone || "N/A"}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>{attraction.email || "N/A"}</td>
              </tr>
              <tr>
                <td><strong>Website:</strong></td>
                <td><a href={attraction.website} target="_blank" rel="noopener noreferrer">{attraction.website || "No Website Attached"}</a></td>
              </tr>
              <tr>
                <td><strong>Location:</strong></td>
                <td>Latitude: {attraction.latitude || "N/A"}, Longitude: {attraction.longitude || "N?A"}</td>
              </tr>
              <tr>
                <td><strong>Ranking:</strong></td>
                <td>{attraction.rankingString || "Not Ranked"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Display Top 5 Photos */}
        <h3 className="photos-heading53">Top Activity Photos</h3>
        <div className="photos-section53">
          {attraction.photos && attraction.photos.length > 0 ? (
            attraction.photos.slice(0, 5).map((photo, index) => (
              <div key={index} className="photo-card53">
                <img src={photo} alt={`Activity ${index + 1}`} className="photo-image53" />
              </div>
            ))
          ) : (
            <p>No photos available.</p>
          )}
        </div>
      

        {/* Display 5 Review Cards */}
        <h3 className="reviews-heading53">Top Reviews</h3>
        <div className="reviews-section53">
          {attraction.reviewTags && attraction.reviewTags.length > 0 ? (
            attraction.reviewTags.slice(0, 5).map((tag, index) => (
              <div key={index} className="review-card53">
                <h4 className="review-title53">{tag.text}</h4>
                <p className="review-text53">{tag.reviews} reviews</p>
              </div>
            ))
          ) : (
            <p>No reviews available.</p>
          )}
        </div>



        {/* Plan Your Trip Section */}
        <p className="plan-trip-text53">To plan your trip or go back, click one of the buttons below:</p>
        <div className="button-container53">
          <button className="back-button53" onClick={() => navigate(-1)}>
            &#8592; Back
          </button>
          <Link to="/Plan-Your-Trip">
            <button className="plan-trip-btn53">
              Plan Your Trip <img src="/images/arow.png" alt="arrow" className="arrow-down53" />
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
