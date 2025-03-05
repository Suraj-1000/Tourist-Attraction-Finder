import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./AdminEditIVPage.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminEditIV() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await fetch(`http://localhost:4000/adminImg/files/${id}`);
        const data = await response.json();
        setSelectedFile(data);
      } catch (error) {
        console.error("Error fetching file details:", error);
      }
    };

    fetchFileDetails();
  }, [id]);

  // Handle file selection
  const handleFileChange = (event) => {
    setNewFile(event.target.files[0]);
  };

  // Handle form submission
  const handleEdit = async () => {
    if (!newFile) {
      alert("Please select a file to upload.");
      return;
    }
  
    setLoading(true);
    const formData = new FormData();
    formData.append("file", newFile);
  
    try {
      const response = await fetch(`http://localhost:4000/adminMedia/update/${id}`, {
        method: "PUT",
        body: formData,
      });
  
      const textResponse = await response.text(); // Read raw response
      console.log("Server response:", textResponse); // Log response for debugging
  
      try {
        const result = JSON.parse(textResponse); // Try parsing as JSON
        if (response.ok) {
          alert("File updated successfully!");
          navigate("/AdmineditIVSucess");
        } else {
          alert("Error updating file: " + result.message);
        }
      } catch (jsonError) {
        console.error("Response is not valid JSON:", textResponse);
        alert("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error updating file:", error);
      alert("Failed to update file.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <Header />
      <div className="main-container8">
        <div className="heading8">
          <h1 className="title-heading8">Admin Attraction Management!</h1>
          <p className="title-para8">Edit Your Image and Video</p>
        </div>

        <div className="edit-card8">
          <div className="upload-heading8">
            {selectedFile ? (
              selectedFile.mimetype.startsWith("image") ? (
                <img
                  src={newFile ? URL.createObjectURL(newFile) : selectedFile.url}
                  alt="Preview"
                  className="edit-image8"
                />
              ) : (
                <video className="edit-image8" controls>
                  <source src={newFile ? URL.createObjectURL(newFile) : selectedFile.url} type={selectedFile.mimetype} />
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <p>No file selected</p>
            )}
          </div>

          <div className="edit-section8">
            <p>📁 {selectedFile?.filename} ({selectedFile?.mimetype})</p>

            {/* File Upload */}
            <input type="file" onChange={handleFileChange} accept="image/*,video/*" />

            <div className="button-container8">

            <Link to="/AdminSearch">
                <button  className="cancel-btn8">
                  Cancel
                </button>
              </Link>
              <button onClick={handleEdit} className="edit-btn8" disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
