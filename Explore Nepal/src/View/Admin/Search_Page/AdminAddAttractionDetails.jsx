import React, { useState, useRef } from "react";
import axios from "axios";
import "./AdminAddAttractionDetails.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminAddAttractionDetailsPage() {
  const [rating, setRating] = useState(0);
  const [places, setPlaces] = useState([{ name: "", image: null, rating: 0 }]);
  const [attractionImage, setAttractionImage] = useState(null);  // For attraction image
  const [category, setCategory] = useState(""); // For category
  const [description1, setDescription1] = useState(""); // For description1
  const [description2, setDescription2] = useState(""); // For description2
  const [location, setLocation] = useState(""); // For location
  const [attractionName, setAttractionName] = useState(""); // For attraction name
  const fileInputRefs = useRef([]); // Store multiple file input refs

  const handleRatingClick = (index) => {
    setRating(index + 1);
  };

  const handlePlaceRatingClick = (placeIndex, ratingValue) => {
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex].rating = ratingValue + 1;
    setPlaces(updatedPlaces);
  };

  const handlePlaceChange = (index, field, value) => {
    const updatedPlaces = [...places];
    updatedPlaces[index][field] = value;
    setPlaces(updatedPlaces);
  };

  const handleIconClick = (index) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].click();
    }
  };

  const handleImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const updatedPlaces = [...places];
      updatedPlaces[index].image = URL.createObjectURL(file);
      setPlaces(updatedPlaces);
    }
  };

  const handleAttractionImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttractionImage(URL.createObjectURL(file));
    }
  };

  const handleAddPlace = () => {
    if (places.length < 5) {
      setPlaces([...places, { name: "", image: null, rating: 0 }]);
    } else {
      alert("You can only add up to 5 places.");
    }
  };

  const handleRemovePlace = (index) => {
    const updatedPlaces = places.filter((_, i) => i !== index);
    setPlaces(updatedPlaces);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("attractionName", attractionName);
    formData.append("location", location);
    formData.append("attractionImage", attractionImage);
    formData.append("rating", rating);
    formData.append("category", category);
    formData.append("description1", description1);
    formData.append("description2", description2);

    places.forEach((place, index) => {
      formData.append(`placeName${index}`, place.name);
      formData.append(`placeImage${index}`, place.image);
      formData.append(`placeRating${index}`, place.rating);
    });

    try {
      const response = await axios.post("http://localhost:4000/adminAddAttraction", formData, {

        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response.data); // Handle the response from the backend
      alert("Attraction added successfully!");
    } catch (error) {
      console.error("There was an error adding the attraction!", error);
      alert("Error adding attraction.");
    }
  };

  return (
    <>
      <Header />
      <div className="main-container14">
        <div className="heading14">
          <h1 className="title-heading14">Add a New Attraction to Your Database!</h1>
          <p className="title-para14">Provide Attraction Details for New Addition</p>
        </div>

        <div className="form-card14">
          <h3 className="form-card-heading14">Add New Place:</h3>
          <div className="form-container14">
            <div className="left-side14">
              <label className="form-label14">Attraction Name:</label>
              <input
                type="text"
                className="input-field14"
                placeholder="Enter attraction name"
                value={attractionName}
                onChange={(e) => setAttractionName(e.target.value)}
              />

              <label className="form-label14">Location:</label>
              <input
                type="text"
                className="input-field14"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <label className="form-label14">Description 1:</label>
              <textarea
                className="textarea-field14"
                placeholder="Enter a detailed description"
                value={description1}
                onChange={(e) => setDescription1(e.target.value)}
              />

              <label className="form-label14">Places to Visit:</label>
              <div className="places-container14">
                {places.map((place, placeIndex) => (
                  <div className="place-item14" key={placeIndex}>
                    <label className="form-label14">Upload Image for Place {placeIndex + 1}:</label>
                    <div
                      className="image-upload-circle14"
                      onClick={() => handleIconClick(placeIndex)}
                    >
                      {place.image ? (
                        <img src={place.image} alt="Uploaded" className="uploaded-image14" />
                      ) : (
                        <div className="upload-icon14">+</div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[placeIndex] = el)}
                      className="file-input14"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(placeIndex, e)}
                      accept="image/*"
                    />

                    <label className="form-label14">Rating:</label>
                    <div className="rating14">
                      {[...Array(5)].map((_, index) => (
                        <span
                          key={index}
                          onClick={() => handlePlaceRatingClick(placeIndex, index)}
                          style={{
                            fontSize: "20px",
                            cursor: "pointer",
                            color: index < place.rating ? "#FFD700" : "#ccc",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <label className="form-label14">Place Name:</label>
                    <input
                      type="text"
                      className="place-input-field14"
                      value={place.name}
                      onChange={(e) => handlePlaceChange(placeIndex, "name", e.target.value)}
                      placeholder="Enter place name"
                    />

                    {places.length > 1 && (
                      <button
                        className="remove-place-button14"
                        onClick={() => handleRemovePlace(placeIndex)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="add-place-button14" onClick={handleAddPlace}>
                Add Another Place
              </button>

              <label className="form-label-description14">Description 2:</label>
              <textarea
                className="textarea-field-description14"
                placeholder="Enter a detailed description"
                value={description2}
                onChange={(e) => setDescription2(e.target.value)}
              />
            </div>

            <div className="right-side14">
              <label className="form-label14">Upload Image for Attraction:</label>
              <div className="image-upload-circle14" onClick={() => handleIconClick(places.length)}>
                {attractionImage ? (
                  <img src={attractionImage} alt="Uploaded" className="uploaded-image14" />
                ) : (
                  <div className="upload-icon14">+</div>
                )}
              </div>
              <input
                type="file"
                ref={(el) => (fileInputRefs.current[places.length] = el)}
                className="file-input14"
                style={{ display: "none" }}
                onChange={handleAttractionImageUpload}
                accept="image/*"
              />

              <label className="form-label14">Rating:</label>
              <div className="rating14">
                {[...Array(5)].map((_, index) => (
                  <span
                    key={index}
                    onClick={() => handleRatingClick(index)}
                    style={{
                      fontSize: "33px",
                      cursor: "pointer",
                      color: index < rating ? "#FFD700" : "#ccc",
                    }}
                  >
                    ★
                  </span>
                ))}
                <span className="gpa-text14"> {rating.toFixed(1)} / 5.0</span>
              </div>

              <label className="form-label14">Category:</label>
              <select
                className="dropdown14"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Select Category</option>
                <option>Adventure</option>
                <option>Culture</option>
                <option>Food</option>
                <option>Nature</option>
              </select>
            </div>
          </div>

          <div className="button-container14">
            <button className="cancel-button14">Cancel</button>
            <button className="add-button14" onClick={handleSubmit}>
              Add
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
