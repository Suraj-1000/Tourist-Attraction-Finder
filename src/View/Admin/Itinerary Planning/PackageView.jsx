import React, { useState, useEffect, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PackageView.css";
import { CurrencyContext } from "../../../config/CurrencyContext";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";

export default function ItineraryPackageViewPage() {
    const { currency, exchangeRates } = useContext(CurrencyContext);
    const { packageName } = useParams(); 
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1); 
    };

    const formatNumberWithCommas = (number) => {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  const convertPrice = (priceString) => {
    if (!priceString || isNaN(priceString)) {
        return "N/A"; 
    }
  
    const priceInUSD = parseFloat(priceString.replace(/[^0-9.]+/g, "")); 
  
    if (!exchangeRates || !exchangeRates[currency]) {
        return "Loading..."; // Exchange rates not yet loaded
    }
  
    const conversionRate = exchangeRates[currency]; 
    const convertedPrice = (priceInUSD * conversionRate).toFixed(2);
    
    return `${currency} ${formatNumberWithCommas(parseFloat(convertedPrice))}`;
  };
  


    useEffect(() => {
      if (packageName) {
        fetchPackageDetails(packageName);
      }
    }, [packageName]);
  
    const fetchPackageDetails = async (title) => {
      try {
        const encodedPackageName = encodeURIComponent(title);
        console.log(`Fetching details for package: ${encodedPackageName}`);
  
       const response = await axios.get(`http://localhost:4000/adminPackage/package`, {
          params: { title: packageName } 
        });
  
  
        if (response.status === 200) {
          setPackageData(response.data);
        } else {
          setError("No Package Found.");
        }
      } catch (error) {
        console.error("Error fetching package details:", error);
        setError("Failed to load package details.");
      } finally {
        setLoading(false);
      }
    };
  
    if (loading) return <div className="loading18">Loading packages details...</div>;
    if (error) return <div className="error18">{error}</div>;
    if (!packageData) return <div className="error18">No packages found.</div>;
  

  return (
    <>
      <Header />
      <div className="main-container18">
        <div className="heading18">
            <Link to="/PlanYourTrip">
                <button className="plan-trip-btn18">
                    Plan Your Trip <img src="/images/arow.png" alt="arrow" className="arrow-down18" />
                </button>
            </Link>
        </div>
        <div className="form18">
            <h2 className="main-heading18">{packageData.title || "No Title Available"}</h2>

            <div className="image-section18">
            <img src={packageData.imageUrl || "https://via.placeholder.com/600"} alt={packageData.title || "No Image Available"} className="image18" />
            </div>

            <p className="highlight18"> {packageData.highlight || "No Highlights Available"}</p>
            <h3 className="additional-heading18">Overview:</h3>
            <p className="description18"> {packageData.overview || "No Overview Available"}</p>

            <h3 className="Quick-info18">Quick Info</h3>
            <ul className="quick-infoDetail18">
                <li>
                    <p className="address18"><strong>Address:</strong> {packageData.address || "No Address Available"}</p>
                </li>
                <li>
                    <p className="reviews18"><strong>Reviews and opinions:</strong> {packageData.reviews || "No Reviews Available"}</p>
                </li>
                <li>
                    <p className="trip-type18"><strong>Trip Type:</strong> {packageData.tripType || "Not Specified"}</p>
                </li>
                <li>
                    <p className="duration18"><strong>Duration:</strong> {packageData.duration || "Not Specified"}</p>
                </li>
                <li>
                    <p className="category18"><strong>Category:</strong> {packageData.category || "Not Specified"}</p>
                </li>
                <li>
                    <p className="price18"><strong>Price:</strong> <span className="span18" style={{ color: 'green', fontWeight:"bold" }}>{packageData.price ? convertPrice(packageData.price) : "Price Not Available"}</span></p>
                </li>
                <li>
                    <p className="group-size18"><strong>Group Size:</strong> {packageData.groupSize || "Not Specified"}</p>
                </li>
                <li>
                    <p className="difficulty18"><strong>Difficulty:</strong> {packageData.difficulty || "Not Specified"}</p>
                </li>
            </ul>

            <h3 className="day-by-day18">Day by Day Itinerary</h3>
            <div className="day-by-day-itinerary18">
            {packageData.itinerary?.length > 0 ? (
                packageData.itinerary.map((day, index) => (
                <div key={index} className="itinerary-card18">
                    <h3>{day.day || `Day ${index + 1}`}: {day.title}</h3>
                    <p><strong>Mode:</strong> {day.mode || "Not Specified"}</p>
                    <p><strong>Highlights:</strong> {day.highlights || "Not Specified"}</p>
                    <p><strong>Stay:</strong> {day.stay || "Not Specified"}</p>
                    <p><strong>Meals Included:</strong> {day.meals || "Not Specified"}</p>
                    <p><strong>Cost Breakdown:</strong></p>
                    <ul>
                        {day.costBreakdown?.split(',').map((cost, i) => (
                            <li key={i}>{cost.trim()}</li>
                        )) || <li>Not Specified</li>}
                    </ul>
                </div>
                ))
            ) : (
                <p className="info-item18">No itinerary available.</p>
                )}
                </div>


                <div className="whats-include18">
                    <h3 className="include18">What's Included:</h3>
                    <ol>
                        {packageData.included ? packageData.included.split(', ').map((item, index) => (
                            <li key={index}>{item}</li>
                        )) : <li>No inclusion details available.</li>}
                    </ol>
                </div>

                <div className="add-info18">
                    <h3 className="info18">Additional Information:</h3>
                    <ol>
                        {packageData.additionalInfo ? packageData.additionalInfo.split(', ').map((item, index) => (
                            <li key={index}>{item}</li>
                        )) : <li>No additional information available.</li>}
                    </ol>
                </div>

                <h3 className="additional-details18">Additional Details</h3>
                <ul className="additional-details-list18">
                    <li><p><strong>Operator:</strong> {packageData.operator || "Not Specified"}</p></li>
                    <li><p><strong>Age Restriction:</strong> {packageData.ageRestriction || "Not Specified"}</p></li>
                    <li><p><strong>Pickup Details:</strong> {packageData.pickupDetails || "Not Specified"}</p></li>
                    <li><p><strong>Accessibility:</strong> {packageData.accessibility || "Not Specified"}</p></li>
                    <li><p><strong>Cancellation Policy:</strong> {packageData.cancellationPolicy || "Not Specified"}</p></li>
                </ul>


            <h3 className="last18">Ready to book your adventure? "Secure your spot for the Annapurna Base Camp Trek!"</h3>
            <div className="button-container18">
                <button className="back-btn18" onClick={handleBack}>
                Back
              </button>
                <button className="book-now-btn18">Book Now</button>
            </div>


        </div>
      </div>
      <Footer />
    </>
  );
}