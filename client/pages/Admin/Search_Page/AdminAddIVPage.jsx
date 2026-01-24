import React, { useState, useEffect } from "react";
import "./AdminAddIVPage.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Admin Header/Admin-Header";
import Footer from "../../../components/Footer/AuthFooter";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminAddIV() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState(null); // For existing file (edit)
  const navigate = useNavigate();
  const { id } = useParams(); // Get the file ID from URL parameters

  useEffect(() => {
    if (id) {
      // Fetch existing file details if we are editing
      const fetchFileDetails = async () => {
        try {
          const response = await fetch(`http://localhost:4000/adminImg/files/${id}`);
          const data = await response.json();
          setExistingFile(data);
          setTags(data.tags.join(", ")); // Pre-populate tags
        } catch (error) {
          console.error("Error fetching file details:", error);
        }
      };
      fetchFileDetails();
    }
  }, [id]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setTags("");
    setMessage("");
    if (existingFile) {
      setTags(existingFile.tags.join(", "));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile && !existingFile) {
      toast.error('Please select a file first!', {
        className: 'toast-message7',
      });
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    } else if (existingFile) {
      formData.append("file", existingFile.url);
    }
    formData.append("tags", tags);

    setUploading(true);

    try {
      const url = id ? `http://localhost:4000/adminMedia/update/${id}` : `http://localhost:4000/adminMedia/upload`;
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        toast.error('Failed to parse server response', {
          className: 'toast-message7',
        });
        setUploading(false);
        return;
      }

      if (response.ok) {
        toast.success(id ? 'File updated successfully!' : 'File uploaded successfully!', {
          className: 'toast-message7',
          onClose: () => {
            navigate('/AdminSearch'); // Navigate after toast closes
          }
        });
        // Short delay to allow the toast to be seen
        setTimeout(() => {
          navigate('/AdminSearch');
        }, 1000);
      } else {
        toast.error(`${id ? 'Update' : 'Upload'} failed: ${data.message}`, {
          className: 'toast-message7',
        });
      }
    } catch (error) {
      toast.error(`Error ${id ? 'updating' : 'uploading'} file`, {
        className: 'toast-message7',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Header />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      <div className="main-container7">
        <div className="heading7">
          <h1 className="title-heading7">Admin Attraction Management!</h1>
          <p className="title-para7">{id ? "Edit Your Image/Video" : "Upload Your Image and Video"}</p>
        </div>

        <div className="upload-card7">
          <div className="upload-heading7">
            {selectedFile || existingFile ? (
              selectedFile ? (
                selectedFile.type.startsWith("image") ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Selected" className="upload-image7" />
                ) : (
                  <video className="upload-image7" controls>
                    <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : existingFile ? (
                existingFile.mimetype.startsWith("image") ? (
                  <img src={existingFile.url} alt="Existing" className="upload-image7" />
                ) : (
                  <video className="upload-image7" controls>
                    <source src={existingFile.url} type={existingFile.mimetype} />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : null
            ) : (
              <img src="/images/addimg.png" className="upload-image7" alt="Upload" />
            )}
          </div>

          <div className="upload-section7">
            {/* File input should always be enabled */}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="file-input7"
            />

            <input
              type="text"
              placeholder="Enter tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="tags-input7"
            />

            {message && <p className="upload-message">{message}</p>}

            <div className="button-container7">
              <Link to="/AdminSearch">
                <button onClick={handleCancel} className="cancel-btn7" disabled={uploading}>
                  Cancel
                </button>
              </Link>
              <button onClick={handleSubmit} className="upload-btn7" disabled={uploading}>
                {uploading ? (
                  <span className="loading-text7">
                    {id ? "Updating..." : "Uploading..."}
                  </span>
                ) : (
                  id ? "Update" : "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
