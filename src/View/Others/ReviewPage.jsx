import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faFilter, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import AdminHeader from '../../Components/Admin Header/Admin-Header';
import UserHeader from '../../Components/User Header/User-Header';
import Footer from '../../Components/Footer';
import './ReviewPage.css';

export default function ReviewPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, event, package, trip
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const isAdmin = location.pathname.includes('Admin');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/reviews/all${filter !== 'all' ? `?itemType=${filter}` : ''}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId, itemType) => {
    try {
      // Show confirmation dialog with custom styling
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'confirm-dialog-overlay';
      confirmDialog.innerHTML = `
        <div class="confirm-dialog">
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to delete this review?</p>
          <div class="confirm-dialog-buttons">
            <button class="cancel-btn">Cancel</button>
            <button class="delete-btn">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Handle dialog buttons
      const result = await new Promise((resolve) => {
        const cancelBtn = confirmDialog.querySelector('.cancel-btn');
        const deleteBtn = confirmDialog.querySelector('.delete-btn');

        cancelBtn.addEventListener('click', () => {
          document.body.removeChild(confirmDialog);
          resolve(false);
        });

        deleteBtn.addEventListener('click', () => {
          document.body.removeChild(confirmDialog);
          resolve(true);
        });
      });

      if (!result) return;

      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:4000/reviews/${reviewId}`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        params: {
          itemType: itemType
        }
      });

      if (response.data.success) {
        // Remove the deleted review from the state
        setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
        toast.success('Review deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredReviews = reviews.filter(review => {
    const searchLower = searchQuery.toLowerCase();
    return (
      review.itemName.toLowerCase().includes(searchLower) ||
      review.userName.toLowerCase().includes(searchLower) ||
      review.review.toLowerCase().includes(searchLower)
    );
  });

  const Header = isAdmin ? AdminHeader : UserHeader;

  const getReviewTypeClass = (itemType) => {
    switch(itemType.toLowerCase()) {
      case 'package':
        return 'package-review';
      case 'event':
        return 'event-review';
      default:
        return '';
    }
  };

  return (
    <>
      <Header />
      <div className="review-page-container">
        <div className="review-header">
          <h1>{isAdmin ? 'Review Management' : 'Reviews'}</h1>
          <div className="review-filters">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon1" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <FontAwesomeIcon 
                  icon={faTrash} 
                  className="clear-search-icon" 
                  onClick={() => setSearchQuery('')} 
                  title="Clear search"
                />
              )}
            </div>
            <div className="filter-box">
              <FontAwesomeIcon icon={faFilter} className="filter-icon" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Reviews</option>
                <option value="event">Event Reviews</option>
                <option value="package">Package Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-text">Loading reviews...</div>
        ) : (
          <div className="reviews-grid">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-card-header">
                    <div className="reviewer-info">
                      <h3>{review.userName}</h3>
                      <span className="review-date">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="review-actions">
                      <div className={`review-type ${getReviewTypeClass(review.itemType)}`}>
                        {review.itemType.charAt(0).toUpperCase() + review.itemType.slice(1)}
                      </div>
                      {isAdmin && (
                        <button 
                          className="delete-review-btn"
                          onClick={() => handleDeleteReview(review._id, review.itemType)}
                          title="Delete Review"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="review-item-name">{review.itemName}</div>
                  <div className="review-rating">{renderStars(review.rating)}</div>
                  <p className="review-text">{review.review}</p>
                </div>
              ))
            ) : (
              <div className="no-reviews">
                {searchQuery 
                  ? 'No reviews found matching your search.' 
                  : 'No reviews available.'}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />

      <style>
        {`
          .review-type {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            text-transform: capitalize;
          }

          .package-review {
            background-color: #e3f2fd;
            color: #1976d2;
          }

          .event-review {
            background-color: #f3e5f5;
            color: #7b1fa2;
          }

          .review-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .review-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }

          .reviewer-info h3 {
            margin: 0;
            color: #333;
            font-size: 1.1rem;
          }

          .review-date {
            color: #666;
            font-size: 0.9rem;
          }

          .review-item-name {
            font-weight: 500;
            color: #1976d2;
            margin-bottom: 10px;
          }

          .review-rating {
            margin-bottom: 10px;
          }

          .review-text {
            color: #444;
            line-height: 1.5;
          }
        `}
      </style>
    </>
  );
} 