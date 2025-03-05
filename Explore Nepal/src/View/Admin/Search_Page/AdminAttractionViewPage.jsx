import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminAttractionViewPage.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminAttractionViewPage() {
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

  if (loading) return <div className="loading16">Loading attraction details...</div>;
  if (error) return <div className="error16">{error}</div>;
  if (!attraction) return <div className="error16">No attraction found.</div>;

  return (
    <>
      <Header />
      <div className="main-container16">
        <div className="heading16">
          <button className="back-button" onClick={() => navigate(-1)}>&#8592; Back</button>
        </div>

        <div className="image-section16">
          <img src={attraction.image} alt={attraction.name} className="image16" />
        </div>

        <div className="breadcrumb16">
          {attraction.ancestorLocations?.map((location, index) => (
            <span key={index} className="breadcrumb-item">
              {location} {index < attraction.ancestorLocations.length - 1 && " > "}
            </span>
          ))}
        </div>

        <h2 className="main-heading16">{attraction.name || "No Heading Available"}</h2>
        <p className="description16">{attraction.description || "No Description Available"}</p>

        {/* Additional Information in a Table */}
        <div className="info-container16">
          <h3 className="additional-heading16">Attraction Information</h3>
          <table className="info-table16">
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
        <h3 className="photos-heading16">Top Activity Photos</h3>
        <div className="photos-section16">
          {attraction.photos && attraction.photos.length > 0 ? (
            attraction.photos.slice(0, 5).map((photo, index) => (
              <div key={index} className="photo-card16">
                <img src={photo} alt={`Activity ${index + 1}`} className="photo-image16" />
              </div>
            ))
          ) : (
            <p>No photos available.</p>
          )}
        </div>
      

        {/* Display 5 Review Cards */}
        <h3 className="reviews-heading16">Top Reviews</h3>
        <div className="reviews-section16">
          {attraction.reviewTags && attraction.reviewTags.length > 0 ? (
            attraction.reviewTags.slice(0, 5).map((tag, index) => (
              <div key={index} className="review-card16">
                <h4 className="review-title16">{tag.text}</h4>
                <p className="review-text16">{tag.reviews} reviews</p>
              </div>
            ))
          ) : (
            <p>No reviews available.</p>
          )}
        </div>



        {/* Plan Your Trip Section */}
        <p className="plan-trip-text16">To plan your own trip, click the button below:</p>
        <Link to="/PlanYourTrip"><button className="plan-trip-btn16">
          Plan Your Trip <img src="/images/arow.png" alt="arrow" className="arrow-down16" />
        </button></Link>
      </div>
      <Footer />
    </>
  );
}