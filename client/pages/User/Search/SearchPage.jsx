import React, { useEffect, useState } from "react";
import "./SearchPage.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import API from "../../../services/api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SearchPage() {
  const [files, setFiles] = useState([]);
  const [recentSearch, setRecentSearch] = useState(null);


  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await API.get('/adminImg/files');
        setFiles(response.data); // Set the files state
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
    toast.success('Search history cleared successfully!', {
      className: 'toast-message51',
    });
  };

 

  return (
    <>
      <Header />
      <div className="main-container51">
        <div className="heading51">
          <h1 className="title-heading51">Upload Moments, Share Stories!</h1>
          <p className="title-para51">Seamless image & video uploads</p>
        </div>

        {/* Recent Searches */}
        <div className="recent-search-container51">
          <div className="recent-search-box51">
            <h2 className="title-recent51">Your Recent Searches</h2>
            <button className="reset-button-container-51" onClick={handleResetSearches}>
              Reset
              <span className="recent-icon51"></span>
            </button>
          </div>

          <div className="recent-search-card-container51">
            {recentSearch && recentSearch.length > 0 ? (
              recentSearch.map((search, index) => (
                <div className="recent-search-card51" key={index}>
                  <div className="recent-card-icon51 similar-icon"></div>
                  <span className="recent-card-text51">{search}</span>
                </div>
              ))
            ) : (
              <p>No recent searches found</p>
            )}
          </div>
        </div>

       

        <div className="picture-container51">
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
              <div className="row51" key={rowIndex}>
                {rowIndex % 2 === 0 ? (
                  <>
                    {row.map((item, index) =>
                      item.type === "video" ? (
                        <div key={index} className="video-container51">
                          <video className="video51" width="456" height="479" controls>
                            <source src={item.file.url} type={item.file.mimetype} />
                            Your browser does not support the video tag.
                          </video>
                          <div className="overlay51">
                          <p className="tags-video51">Tags: {Array.isArray(item.file.tags) && item.file.tags.length > 0 ? item.file.tags.join(", ") : "No tags available"}</p>
                            

                          </div>
                        </div>
                      ) : null
                    )}
                    <div className="images-container51">
                      {row
                        .filter(item => item.type === "image")
                        .reduce((rows, item, index) => {
                          if (index % 2 === 0) rows.push([]);
                          rows[rows.length - 1].push(item);
                          return rows;
                        }, [])
                        .map((imageRow, imgRowIndex) => (
                          <div className="image-row51" key={imgRowIndex}>
                            {imageRow.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-wrapper51">
                                <img
                                  className="image51"
                                  src={img.file.url}
                                  alt={img.file.filename}
                                  width="338"
                                  height="229"
                                />
                                <div className="overlay51">
                                <p className="tags-image51">Tags: {Array.isArray(img.file.tags) && img.file.tags.length > 0 ? img.file.tags.join(", ") : "No tags available"}</p>
                                 
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="images-container51">
                      {row
                        .filter(item => item.type === "image")
                        .reduce((rows, item, index) => {
                          if (index % 2 === 0) rows.push([]);
                          rows[rows.length - 1].push(item);
                          return rows;
                        }, [])
                        .map((imageRow, imgRowIndex) => (
                          <div className="image-row51" key={imgRowIndex}>
                            {imageRow.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-wrapper51">
                                <img
                                  className="image51"
                                  src={img.file.url}
                                  alt={img.file.filename}
                                  width="338"
                                  height="229"
                                />
                                <div className="overlay51">
                                <p className="tags-image51">Tags: {Array.isArray(img.file.tags) && img.file.tags.length > 0 ? img.file.tags.join(", ") : "No tags available"}</p>
                                  
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                    {row.map((item, index) =>
                      item.type === "video" ? (
                        <div key={index} className="video-container51">
                          <video className="video51" width="456" height="479" controls>
                            <source src={item.file.url} type={item.file.mimetype} />
                            Your browser does not support the video tag.
                          </video>
                          <div className="overlay51">
                          <p className="tags-video51">Tags: {Array.isArray(item.file.tags) && item.file.tags.length > 0 ? item.file.tags.join(", ") : "No tags available"}</p>
                            
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
