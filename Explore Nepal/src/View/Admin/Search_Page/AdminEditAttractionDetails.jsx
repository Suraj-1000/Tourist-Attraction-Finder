import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminEditAttractionDetails.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminEditAttractionDetailsPage() {
  const { attractionName } = useParams(); 
  const navigate = useNavigate(); 
  const fileInputRef = useRef(null);

  const [attraction, setAttraction] = useState({
    name: "",
    image: "",
    rating: 0,
    address: "",
    numberOfReviews: 0,
    description: "",
    category: "",
    subcategories: [],
    subtype: [],
    phone: "",
    email: "",
    website: "",
    longitude: "",
    latitude: "",
    rankingString: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attractionImage, setAttractionImage] = useState("");

  useEffect(() => {
    if (attractionName) {
      fetchAttractionDetails(attractionName);
    }
  }, [attractionName]);

  const fetchAttractionDetails = async (name) => {
    try {
      console.log(`🔍 Fetching details for: ${name}`);
      const response = await axios.get("http://localhost:4000/adminSearch/attraction", {
        params: { name: name },
      });

      if (response.status === 200) {
        setAttraction(response.data);
        setAttractionImage(response.data.image);
      } else {
        setError("Failed to load attraction details.");
      }
    } catch (error) {
      console.error("❌ Error fetching attraction details:", error);
      setError("Failed to load attraction details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "subcategories" || name === "subtype") {
      setAttraction({ ...attraction, [name]: value.split(",").map(item => item.trim()) }); // Convert string to array
    } else {
      setAttraction({ ...attraction, [name]: value });
    }
  };
  
  

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAttractionImage(imageUrl);
      setAttraction({ ...attraction, image: imageUrl });
    }
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
  
      Object.keys(attraction).forEach((key) => {
        if (key === "photos") return; // 🚨 Skip sending `photos` unless updated
  
        if (Array.isArray(attraction[key])) {
          formData.append(key, JSON.stringify(attraction[key])); // Convert arrays to JSON string
        } else {
          formData.append(key, attraction[key]);
        }
      });
  
      if (fileInputRef.current?.files[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }
  
      const response = await axios.put("http://localhost:4000/adminSearch/updateAttraction", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.status === 200) {
        alert("✅ Attraction updated successfully!");
        navigate(-1);
      } else {
        alert("❌ Failed to update attraction.");
      }
    } catch (error) {
      console.error("❌ Error updating attraction:", error);
      alert(`Update failed: ${error.response?.data?.message || "Unknown error"}`);
    }
  };
  
  
  if (loading) return <div className="loading16">Loading attraction details...</div>;
  if (error) return <div className="error16">{error}</div>;

  return (
    <>
      <Header />
      <div className="main-container15">
        <div className="heading15">
          <h1 className="title-heading15">Edit Attraction Details</h1>
          <p className="title-para15">Modify the information of the existing attraction in your database</p>
        </div>

        <div className="form-card15">
          <h3 className="form-card-heading15">Update the Attraction:</h3>
          <div className="form-container15">
            <div className="left-side15">
              <label className="form-label15">Attraction Name:</label>
              <input type="text" name="name" value={attraction.name} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Location:</label>
              <input type="text" name="address" value={attraction.address} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Description:</label>
              <textarea name="description" value={attraction.description} onChange={handleChange} className="textarea-field15"></textarea>

              <label className="form-label15">Phone:</label>
              <input type="text" name="phone" value={attraction.phone} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Email:</label>
              <input type="email" name="email" value={attraction.email} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Website:</label>
              <input type="text" name="website" value={attraction.website} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Ranking:</label>
              <input type="text" name="rankingString"value={attraction.rankingString} onChange={handleChange} className="input-field15" placeholder="Enter ranking info"/>

            </div>

            <div className="right-side15">
              <label className="form-label15">Upload Image:</label>
              <div className="image-upload-circle15" onClick={() => fileInputRef.current?.click()}>
                {attractionImage ? (
                  <img src={attractionImage} alt="Uploaded" className="uploaded-image15" />
                ) : (
                  <div className="upload-icon15">+</div>
                )}
              </div>
              <input
                type="file"
                name="image"
                className="file-input15"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImageUpload}
                accept="image/*"
              />

              <label className="form-label15">Rating:</label>
              <input type="number" name="rating" value={attraction.rating} onChange={handleChange} className="input-field15" min="0" max="5" />

              <label className="form-label15">Category:</label>
              <input type="text" name="category" value={attraction.category} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Longitude:</label>
              <input type="text" name="longitude" value={attraction.longitude} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Latitude:</label>
              <input type="text" name="latitude" value={attraction.latitude} onChange={handleChange} className="input-field15" />

              <label className="form-label15">Subcategories:</label>
              <input type="text" name="subcategories" value={attraction.subcategories}  onChange={handleChange} className="input-field15" placeholder="Enter subcategories separated by commas" />

              <label className="form-label15">Subtype:</label>
              <input type="text"  name="subtype" value={attraction.subtype}  onChange={handleChange}  className="input-field15"  placeholder="Enter subtypes separated by commas" />

            </div>
          </div>

          <div className="button-container15">
            <button className="cancel-button15" onClick={() => navigate(-1)}>Cancel</button>
            <button className="add-button15" onClick={handleUpdate}>Update</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}