import React, { useState } from "react";
import axios from "axios";
import { FaStar, FaUsers, FaTicketAlt, FaMapMarkerAlt, FaCalendarAlt, FaUserTie, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';
import "./AddEvent.css";
import { toast } from 'react-toastify';

export default function AddEvent({ onEventAdded, onEventEdited, onClose, existingEvent }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFreeEvent, setIsFreeEvent] = useState(existingEvent?.category === 'Religious' || false);
  const [newEvent, setNewEvent] = useState({
    name: existingEvent?.name || "",
    description: existingEvent?.description || "",
    category: existingEvent?.category || "",
    startDate: existingEvent?.startDate ? new Date(existingEvent.startDate).toISOString().split('T')[0] : "",
    endDate: existingEvent?.endDate ? new Date(existingEvent.endDate).toISOString().split('T')[0] : "",
    startTime: existingEvent?.startTime || "",
    endTime: existingEvent?.endTime || "",
    location: existingEvent?.location || "",
    image: null,
    imageUrl: existingEvent?.image || "",
    ticketPrice: {
      vip: existingEvent?.ticketPrice?.vip?.toString() || "",
      general: existingEvent?.ticketPrice?.general?.toString() || ""
    },
    organizer: existingEvent?.organizer || "",
    tags: existingEvent?.tags || [],
    status: existingEvent?.status || "upcoming",
    featured: existingEvent?.featured || false,
    featuredStars: existingEvent?.featuredStars || [],
    capacity: {
      vip: existingEvent?.capacity?.vip?.toString() || "",
      general: existingEvent?.capacity?.general?.toString() || ""
    },
    highlights: existingEvent?.highlights || [],
    requirements: existingEvent?.requirements || [],
    schedule: existingEvent?.schedule || [],
    contactInfo: {
      phone: existingEvent?.contactInfo?.phone || "",
      email: existingEvent?.contactInfo?.email || "",
      website: existingEvent?.contactInfo?.website || ""
    },
    isFreeEvent: existingEvent?.category === 'Religious' || false,
  });

  const [newStar, setNewStar] = useState({ name: "", role: "" });
  const [newHighlight, setNewHighlight] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newSchedule, setNewSchedule] = useState({ 
    day: "Day 1",
    time: "", 
    activity: "" 
  });
  const [newTag, setNewTag] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewEvent({
        ...newEvent,
        image: file,
        imageUrl: URL.createObjectURL(file)
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setNewEvent({
        ...newEvent,
        tags: [...newEvent.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (index) => {
    setNewEvent({
      ...newEvent,
      tags: newEvent.tags.filter((_, i) => i !== index)
    });
  };

  const handleAddStar = () => {
    if (newStar.name && newStar.role) {
      setNewEvent({
        ...newEvent,
        featuredStars: [...newEvent.featuredStars, newStar]
      });
      setNewStar({ name: "", role: "" });
    }
  };

  const handleRemoveStar = (index) => {
    setNewEvent({
      ...newEvent,
      featuredStars: newEvent.featuredStars.filter((_, i) => i !== index)
    });
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setNewEvent({
        ...newEvent,
        highlights: [...newEvent.highlights, newHighlight.trim()]
      });
      setNewHighlight("");
    }
  };

  const handleRemoveHighlight = (index) => {
    setNewEvent({
      ...newEvent,
      highlights: newEvent.highlights.filter((_, i) => i !== index)
    });
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setNewEvent({
        ...newEvent,
        requirements: [...newEvent.requirements, newRequirement.trim()]
      });
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (index) => {
    setNewEvent({
      ...newEvent,
      requirements: newEvent.requirements.filter((_, i) => i !== index)
    });
  };

  const calculateDays = () => {
    if (!newEvent.startDate || !newEvent.endDate) return 1;
    
    const start = new Date(newEvent.startDate);
    const end = new Date(newEvent.endDate);
    const diffTime = Math.abs(end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getDayOptions = () => {
    const numberOfDays = calculateDays();
    return Array.from({ length: numberOfDays }, (_, i) => `Day ${i + 1}`);
  };

  const handleAddSchedule = () => {
    if (newSchedule.day && newSchedule.time && newSchedule.activity.trim()) {
      setNewEvent({
        ...newEvent,
        schedule: [...newEvent.schedule, {
          day: newSchedule.day,
          time: newSchedule.time,
          activity: newSchedule.activity.trim()
        }]
      });
      setNewSchedule({ 
        day: newSchedule.day,
        time: "", 
        activity: "" 
      });
    }
  };

  const handleRemoveSchedule = (index) => {
    setNewEvent({
      ...newEvent,
      schedule: newEvent.schedule.filter((_, i) => i !== index)
    });
  };

  const handleNumericInput = (e, field, subField) => {
    const value = e.target.value;
    // Allow only numbers and commas
    if (!/^[0-9,]*$/.test(value) && value !== '') {
      return;
    }
    setNewEvent(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!newEvent.name || !newEvent.description || !newEvent.category || 
          !newEvent.startDate || !newEvent.endDate || !newEvent.startTime || 
          !newEvent.endTime || !newEvent.location || !newEvent.organizer) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Only validate ticket prices and capacity for paid events
      if (!isFreeEvent) {
        if (!newEvent.ticketPrice.vip || !newEvent.ticketPrice.general || 
            !newEvent.capacity.vip || !newEvent.capacity.general) {
          toast.error("Please enter ticket prices and capacity");
          return;
        }

        // Parse and validate numbers
        const ticketPriceData = {
          vip: parseFloat(newEvent.ticketPrice.vip.replace(/,/g, '')),
          general: parseFloat(newEvent.ticketPrice.general.replace(/,/g, ''))
        };

        const capacityData = {
          vip: parseInt(newEvent.capacity.vip.replace(/,/g, '')),
          general: parseInt(newEvent.capacity.general.replace(/,/g, ''))
        };

        if (isNaN(ticketPriceData.vip) || isNaN(ticketPriceData.general) || 
            isNaN(capacityData.vip) || isNaN(capacityData.general) ||
            ticketPriceData.vip < 0 || ticketPriceData.general < 0 || 
            capacityData.vip < 0 || capacityData.general < 0) {
          toast.error("Please enter valid numbers for ticket prices and capacity");
          return;
        }
      }

      setIsSubmitting(true);

      // Create the request data
      const requestData = {
        name: newEvent.name,
        description: newEvent.description,
        category: newEvent.category,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        location: newEvent.location,
        organizer: newEvent.organizer,
        featured: newEvent.featured,
        ticketPrice: newEvent.ticketPrice,
        capacity: newEvent.capacity,
        tags: newEvent.tags,
        featuredStars: newEvent.featuredStars,
        highlights: newEvent.highlights,
        requirements: newEvent.requirements,
        schedule: newEvent.schedule.map(item => ({
          day: item.day || "Day 1",
          time: item.time,
          activity: item.activity
        })),
        contactInfo: {
          phone: newEvent.contactInfo.phone || '',
          email: newEvent.contactInfo.email || '',
          website: newEvent.contactInfo.website || ''
        },
        isFreeEvent: isFreeEvent
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(requestData));
      
      if (newEvent.image instanceof File) {
        formData.append('image', newEvent.image);
      }

      let response;
      if (existingEvent) {
        // Update existing event
        response = await axios.put(
          `http://localhost:4000/adminEvents/${existingEvent._id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
        onEventEdited(response.data);
        toast.success("Event updated successfully!");
      } else {
        // Create new event
        response = await axios.post(
          "http://localhost:4000/adminEvents",
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
        onEventAdded(response.data);
        toast.success("Event added successfully!");
      }
      
      onClose();
    } catch (error) {
      console.error(existingEvent ? "Failed to update event:" : "Failed to add event:", error);
      toast.error(error.response?.data?.message || (existingEvent ? "Failed to update event" : "Failed to add event"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay36">
      <div className="modal-content36 event-modal36">
        <h2>{existingEvent ? 'Edit Event' : 'Add New Event'}</h2>
        <div className="event-form36">
          {/* Basic Information */}
          <div className="form-section36">
            <h3>Basic Information</h3>
            <div className="form-group36">
              <label>Event Name</label>
              <input
                type="text"
                placeholder="Enter event name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
              />
            </div>
            <div className="form-group36">
              <label>Event Description</label>
              <textarea
                placeholder="Enter event description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows="4"
              />
            </div>
            <div className="form-group36">
              <label>Category</label>
              <select
                value={newEvent.category}
                onChange={(e) => {
                  const category = e.target.value;
                  setNewEvent({
                    ...newEvent,
                    category: category,
                    // Automatically set isFreeEvent to true for Religious category
                    isFreeEvent: category === 'Religious' ? true : false,
                    // Clear ticket prices if it's a religious event
                    ticketPrice: category === 'Religious' ? { vip: "0", general: "0" } : newEvent.ticketPrice,
                    capacity: category === 'Religious' ? { vip: "0", general: "0" } : newEvent.capacity
                  });
                  setIsFreeEvent(category === 'Religious');
                }}
              >
                <option value="">Select Category</option>
                <option value="Cultural">Cultural</option>
                <option value="Festival">Festival</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
                <option value="Food">Food</option>
                <option value="Religious">Religious</option>
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="form-section36">
            <h3>Date and Time</h3>
            <div className="date-time-group36">
              <div className="date-group36">
                <div className="form-group36">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group36">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="time-group36">
                <div className="form-group36">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                  />
                </div>
                <div className="form-group36">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location and Organizer */}
          <div className="form-section36">
            <h3>Location and Organizer</h3>
            <div className="form-group36">
              <label>Location</label>
              <input
                type="text"
                placeholder="Enter event location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              />
            </div>
            <div className="form-group36">
              <label>Organizer</label>
              <input
                type="text"
                placeholder="Enter organizer name"
                value={newEvent.organizer}
                onChange={(e) => setNewEvent({...newEvent, organizer: e.target.value})}
              />
            </div>
          </div>

          {/* Free Event Toggle (show only for non-religious events) */}
          {newEvent.category && newEvent.category !== 'Religious' && (
            <div className="free-event-toggle36">
              <input
                type="checkbox"
                id="freeEvent"
                checked={isFreeEvent}
                onChange={(e) => {
                  setIsFreeEvent(e.target.checked);
                  if (e.target.checked) {
                    setNewEvent({
                      ...newEvent,
                      isFreeEvent: true,
                      ticketPrice: { vip: "0", general: "0" }
                    });
                  }
                }}
              />
              <label htmlFor="freeEvent">This is a free event</label>
            </div>
          )}

          {/* Ticket Prices - Only show if not free event */}
          {!isFreeEvent && (
            <div className="form-section36">
              <h3>Ticket Prices</h3>
              <div className="price-inputs36">
                <div className="form-group36">
                  <label>VIP Ticket Price (NPR)</label>
                  <input
                    type="text"
                    placeholder="Enter VIP ticket price"
                    value={newEvent.ticketPrice.vip}
                    onChange={(e) => handleNumericInput(e, 'ticketPrice', 'vip')}
                  />
                </div>
                <div className="form-group36">
                  <label>General Ticket Price (NPR)</label>
                  <input
                    type="text"
                    placeholder="Enter general ticket price"
                    value={newEvent.ticketPrice.general}
                    onChange={(e) => handleNumericInput(e, 'ticketPrice', 'general')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Capacity - Only show if not free event */}
          {!isFreeEvent && (
            <div className="form-section36">
              <h3>Capacity</h3>
              <div className="capacity-inputs36">
                <div className="form-group36">
                  <label>VIP Capacity</label>
                  <input
                    type="text"
                    placeholder="Enter VIP capacity"
                    value={newEvent.capacity.vip}
                    onChange={(e) => handleNumericInput(e, 'capacity', 'vip')}
                  />
                </div>
                <div className="form-group36">
                  <label>General Capacity</label>
                  <input
                    type="text"
                    placeholder="Enter general capacity"
                    value={newEvent.capacity.general}
                    onChange={(e) => handleNumericInput(e, 'capacity', 'general')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Featured Stars */}
          <div className="form-section36">
            <h3>Featured Stars</h3>
            <div className="featured-stars-container36">
              <div className="featured-stars-input36">
                <div className="form-group36">
                  <input
                    type="text"
                    placeholder="Star Name"
                    value={newStar.name}
                    onChange={(e) => setNewStar({...newStar, name: e.target.value})}
                  />
                </div>
                <div className="form-group36">
                  <input
                    type="text"
                    placeholder="Role"
                    value={newStar.role}
                    onChange={(e) => setNewStar({...newStar, role: e.target.value})}
                  />
                </div>
                <button onClick={handleAddStar} className="add-button36">
                  <FaPlus /> Add Star
                </button>
              </div>
              <div className="featured-stars-list36">
                {newEvent.featuredStars.map((star, index) => (
                  <div key={index} className="list-item36">
                    <div>
                      <strong>{star.name}</strong> - {star.role}
                    </div>
                    <button className="remove-button36" onClick={() => handleRemoveStar(index)}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="form-section36">
            <h3>Event Highlights</h3>
            <div className="highlights-container36">
              <div className="highlights-input36">
                <div className="form-group36">
                  <input
                    type="text"
                    placeholder="Add highlight"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                  />
                </div>
                <button onClick={handleAddHighlight} className="add-button36">
                  <FaPlus /> Add Highlight
                </button>
              </div>
              <div className="highlights-list36">
                {newEvent.highlights.map((highlight, index) => (
                  <div key={index} className="list-item36">
                    <span>{highlight}</span>
                    <button className="remove-button36" onClick={() => handleRemoveHighlight(index)}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="form-section36">
            <h3>Requirements</h3>
            <div className="requirements-container36">
              <div className="requirements-input36">
                <div className="form-group36">
                  <input
                    type="text"
                    placeholder="Add requirement"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                  />
                </div>
                <button onClick={handleAddRequirement} className="add-button36">
                  <FaPlus /> Add Requirement
                </button>
              </div>
              <div className="requirements-list36">
                {newEvent.requirements.map((requirement, index) => (
                  <div key={index} className="list-item36">
                    <span>{requirement}</span>
                    <button className="remove-button36" onClick={() => handleRemoveRequirement(index)}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="form-section36">
            <h3>Event Schedule</h3>
            <div className="schedule-container36">
              <div className="schedule-input36">
                <div className="form-group36">
                  <select
                    value={newSchedule.day}
                    onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}
                    className="day-select36"
                  >
                    {getDayOptions().map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group36">
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  />
                </div>
                <div className="form-group36">
                  <input
                    type="text"
                    placeholder="Activity description"
                    value={newSchedule.activity}
                    onChange={(e) => setNewSchedule({...newSchedule, activity: e.target.value})}
                  />
                </div>
                <button onClick={handleAddSchedule} className="add-button36">
                  <FaPlus /> Add
                </button>
              </div>
              <div className="schedule-list36">
                {newEvent.schedule
                  .sort((a, b) => {
                    const dayA = parseInt(a.day.split(' ')[1]);
                    const dayB = parseInt(b.day.split(' ')[1]);
                    if (dayA !== dayB) return dayA - dayB;
                    return a.time.localeCompare(b.time);
                  })
                  .map((item, index) => (
                    <div key={index} className="list-item36">
                      <div>
                        <strong>{item.day}</strong> - <strong>{item.time}</strong> - {item.activity}
                      </div>
                      <button className="remove-button36" onClick={() => handleRemoveSchedule(index)}>
                        <FaTrash /> Remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section36">
            <h3>Contact Information</h3>
            <div className="form-group36">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={newEvent.contactInfo.phone}
                onChange={(e) => setNewEvent({
                  ...newEvent,
                  contactInfo: {
                    ...newEvent.contactInfo,
                    phone: e.target.value
                  }
                })}
              />
            </div>
            <div className="form-group36">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={newEvent.contactInfo.email}
                onChange={(e) => setNewEvent({
                  ...newEvent,
                  contactInfo: {
                    ...newEvent.contactInfo,
                    email: e.target.value
                  }
                })}
              />
            </div>
            <div className="form-group36">
              <label>Website</label>
              <input
                type="url"
                placeholder="Enter website URL"
                value={newEvent.contactInfo.website}
                onChange={(e) => setNewEvent({
                  ...newEvent,
                  contactInfo: {
                    ...newEvent.contactInfo,
                    website: e.target.value
                  }
                })}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section36">
            <h3>Event Image</h3>
            <div className="file-input-container36">
              <div className="form-group36">
                <label>Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input36"
                  onChange={handleImageChange}
                />
              </div>
              {newEvent.imageUrl && (
                <div className="image-preview36">
                  <img 
                    src={newEvent.imageUrl} 
                    alt="Preview" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="section36">
            <h3>Tags</h3>
            <div className="tags-input-container36">
              <input
                type="text"
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button onClick={handleAddTag} className="add-button36">
                <FaPlus /> Add Tag
              </button>
            </div>
            <div className="tags-list36">
              {newEvent.tags.map((tag, index) => (
                <div key={index} className="list-item36">
                  <span>{tag}</span>
                  <button className="remove-button36" onClick={() => handleRemoveTag(index)}>
                    <FaTrash /> Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Event Toggle */}
          <div className="featured-event-container36">
            <input
              type="checkbox"
              id="featuredEvent"
              checked={newEvent.featured}
              onChange={(e) => setNewEvent({...newEvent, featured: e.target.checked})}
            />
            <label htmlFor="featuredEvent">Featured Event</label>
          </div>
        </div>

        <div className="modal-buttons36">
          <button 
            className="modal-cnl-btn36" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="modal-submit-btn36" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (existingEvent ? "Updating..." : "Adding...") : (existingEvent ? "Update Event" : "Add Event")}
          </button>
        </div>
      </div>
    </div>
  );
}