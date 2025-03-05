import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./AdminSearchPage.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";

export default function AdminSearchPage() {
  const [files, setFiles] = useState([]);
  const [recentSearch, setRecentSearch] = useState(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:4000/adminImg/files');
        const data = await response.json();
        setFiles(data); // Set the files state
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();

    // Get the recent searches array from localStorage
    const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearch(searches);
  }, []); // Only run on mount

  const handleResetSearches = () => {
    localStorage.removeItem("recentSearches");
    setRecentSearch([]);
  };

const handleDelete = async (file) => {
  if (!window.confirm("Are you sure you want to delete this file?")) return;

  setLoading(true);
  try {
    const response = await fetch(`http://localhost:4000/adminMedia/deleteByFilename?filename=${file.filename}`, {
      method: "DELETE",
    });

    const result = await response.json();
    if (response.ok) {
      alert("✅ File deleted successfully!");

      // ✅ Remove deleted file from UI
      setFiles((prevFiles) => prevFiles.filter((f) => f._id !== file._id));
    } else {
      alert("❌ Error deleting file: " + result.message);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    alert("❌ Failed to delete file.");
  } finally {
    setLoading(false);
  }
};

  
  

  return (
    <>
      <Header />
      <div className="main-container6">
        <div className="heading6">
          <h1 className="title-heading6">Upload Moments, Share Stories!</h1>
          <p className="title-para6">Seamless image & video uploads</p>
        </div>

        {/* Recent Searches */}
        <div className="recent-search-container6">
          <div className="recent-search-box">
            <h2 className="title-recent6">Your Recent Searches</h2>
            <button className="reset-button-container-6" onClick={handleResetSearches}>
              Reset
              <span className="recent-icon6"></span>
            </button>
          </div>

          <div className="recent-search-card-container6">
            {recentSearch && recentSearch.length > 0 ? (
              recentSearch.map((search, index) => (
                <div className="recent-search-card6" key={index}>
                  <div className="recent-card-icon6 similar-icon"></div>
                  <span className="recent-card-text6">{search}</span>
                </div>
              ))
            ) : (
              <p>No recent searches found</p>
            )}
          </div>
        </div>

        <div className="aed-container-6">
          <Link to="/AdminaddIV" className="aed-icon add-icon">
            <img src="/images/add.png" alt="Add" className="add-icon-img6" />
            <span className="add-media-text6">Add Media</span>
          </Link>
        </div>




        <div className="picture-container6">
          {(() => {
            const imageFiles = files.filter(file => file.mimetype.startsWith("image"));
            const videoFiles = files.filter(file => file.mimetype.startsWith("video"));
            const rows = [];

            let imgIndex = 0;
            let vidIndex = 0;
            let isVideoFirst = true; // Toggle for alternating pattern

            while (imgIndex < imageFiles.length || vidIndex < videoFiles.length) {
              const row = [];

              if (isVideoFirst && vidIndex < videoFiles.length) {
                row.push({ type: "video", file: videoFiles[vidIndex++] });
              }

              for (let i = 0; i < 4 && imgIndex < imageFiles.length; i++) {
                row.push({ type: "image", file: imageFiles[imgIndex++] });
              }

              if (!isVideoFirst && vidIndex < videoFiles.length) {
                row.push({ type: "video", file: videoFiles[vidIndex++] });
              }

              rows.push(row);
              isVideoFirst = !isVideoFirst; // Toggle for next row
            }

            return rows.map((row, rowIndex) => (
              <div className="row6" key={rowIndex}>
                {rowIndex % 2 === 0 ? (
                  <>
                    {row.map((item, index) =>
                      item.type === "video" ? (
                        <div key={index} className="video-container6">
                          <video className="video6" width="456" height="479" controls>
                            <source src={item.file.url} type={item.file.mimetype} />
                            Your browser does not support the video tag.
                          </video>
                          <div className="overlay6">
                            <Link to={`/AdmineditIV/${item.file._id}`}>
                              <img src="/images/edit.png" alt="Edit" className="edit-icon6" />
                            </Link>
                            <img
                              src="/images/dlete.png"
                              alt="Delete"
                              className="delete-icon6"
                              onClick={() => handleDelete(item.file)}
                            />

                          </div>
                        </div>
                      ) : null
                    )}
                    <div className="images-container6">
                      {row
                        .filter(item => item.type === "image")
                        .reduce((rows, item, index) => {
                          if (index % 2 === 0) rows.push([]);
                          rows[rows.length - 1].push(item);
                          return rows;
                        }, [])
                        .map((imageRow, imgRowIndex) => (
                          <div className="image-row6" key={imgRowIndex}>
                            {imageRow.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-wrapper6">
                                <img
                                  className="image6"
                                  src={img.file.url}
                                  alt={img.file.filename}
                                  width="338"
                                  height="229"
                                />
                                <div className="overlay6">
                                  <Link to={`/AdmineditIV/${img.file._id}`}>
                                    <img src="/images/edit.png" alt="Edit" className="edit-icon6" />
                                  </Link>
                                  <img
                                    src="/images/dlete.png"
                                    alt="Delete"
                                    className="delete-icon6"
                                    onClick={() => handleDelete(img.file)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="images-container6">
                      {row
                        .filter(item => item.type === "image")
                        .reduce((rows, item, index) => {
                          if (index % 2 === 0) rows.push([]);
                          rows[rows.length - 1].push(item);
                          return rows;
                        }, [])
                        .map((imageRow, imgRowIndex) => (
                          <div className="image-row6" key={imgRowIndex}>
                            {imageRow.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-wrapper6">
                                <img
                                  className="image6"
                                  src={img.file.url}
                                  alt={img.file.filename}
                                  width="338"
                                  height="229"
                                />
                                <div className="overlay6">
                                  <Link to={`/AdmineditIV/${img.file._id}`}>
                                    <img src="/images/edit.png" alt="Edit" className="edit-icon6" />
                                  </Link>
                                  <img
                                    src="/images/dlete.png"
                                    alt="Delete"
                                    className="delete-icon6"
                                    onClick={() => handleDelete(img.file)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                    {row.map((item, index) =>
                      item.type === "video" ? (
                        <div key={index} className="video-container6">
                          <video className="video6" width="456" height="479" controls>
                            <source src={item.file.url} type={item.file.mimetype} />
                            Your browser does not support the video tag.
                          </video>
                          <div className="overlay6">
                            <Link to={`/AdmineditIV/${item.file._id}`}>
                              <img src="/images/edit.png" alt="Edit" className="edit-icon6" />
                            </Link>
                            <img
                              src="/images/dlete.png"
                              alt="Delete"
                              className="delete-icon6"
                              onClick={() => handleDelete(item.file)}
                            />
                          </div>
                        </div>
                      ) : null
                    )}
                  </>
                )}
              </div>
            ));
          })()}
        </div>


          
      </div>
      <Footer />
    </>
  );
}
