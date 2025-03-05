import React, { useState } from "react";
import "./AdminAddIVPage.css";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminAddIV() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    setSelectedFile(null);
    setMessage("");
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:4000/adminMedia/upload", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text(); // Read the response as text
      console.log(responseText); // Log the response to check its content

      let data;
      try {
        data = JSON.parse(responseText); // Attempt to parse as JSON
      } catch (error) {
        console.error("Error parsing JSON:", error);
        setMessage("Failed to parse server response");
        setUploading(false);
        return;
      }

      setUploading(false);

      if (response.ok) {
        setMessage("File uploaded successfully!");
        setTimeout(() => {
          navigate("/AdminaddIVSucess");
        }, 1500);
      } else {
        setMessage(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Error uploading file");
      setUploading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="main-container7">
        <div className="heading7">
          <h1 className="title-heading7">Admin Attraction Management!</h1>
          <p className="title-para7">Upload Your Image and Video</p>
        </div>

        {/* Card Container */}
        <div className="upload-card7">
          <div className="upload-heading7">
            {/* Show selected image or video instead of the default image */}
            {selectedFile ? (
              selectedFile.type.startsWith("image") ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Selected"
                  className="upload-image7"
                />
              ) : (
                <video className="upload-image7" controls>
                  <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <img src="/images/addimg.png" className="upload-image7" alt="Upload" />
            )}
          </div>

          <div className="upload-section7">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="file-input8"
            />

            {selectedFile && (
              <div className="file-info7">
                <p>📁 {selectedFile.name} ({selectedFile.type})</p>
              </div>
            )}

            {message && <p className="upload-message">{message}</p>}

            <div className="button-container7">
              <Link to="/AdminSearch">
                <button onClick={handleCancel} className="cancel-btn7" disabled={uploading}>
                  Cancel
                </button>
              </Link>
              <button onClick={handleUpload} className="upload-btn7" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
