import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaUsers, FaTicketAlt, FaMapMarkerAlt, FaCalendarAlt, FaUserTie, FaInfoCircle, FaPlus, FaTrash } from 'react-icons/fa';
import "./AddEvent.css";
import { toast } from 'react-toastify';
import MapPicker from "../../../Components/MapPicker";

export default function AddEvent({ onEventAdded, onEventEdited, onClose, existingEvent }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFreeEvent, setIsFreeEvent] = useState(existingEvent?.category === 'Religious' || false);
  const [errors, setErrors] = useState({});
  const [validFields, setValidFields] = useState({});
  const [isFormModified, setIsFormModified] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  
  const [newEvent, setNewEvent] = useState({
    name: existingEvent?.name || "",
    description: existingEvent?.description || "",
    category: existingEvent?.category || "",
    startDate: existingEvent?.startDate ? new Date(existingEvent.startDate).toISOString().split('T')[0] : "",
    endDate: existingEvent?.endDate ? new Date(existingEvent.endDate).toISOString().split('T')[0] : "",
    startTime: existingEvent?.startTime || "",
    endTime: existingEvent?.endTime || "",
    location: existingEvent?.location || "",
    locationDetails: existingEvent?.locationDetails || {
      latitude: 27.7172,
      longitude: 85.3240,
      formattedAddress: ""
    },
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
      trackFormChange();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setNewEvent({
        ...newEvent,
        tags: [...newEvent.tags, newTag.trim()]
      });
      setNewTag("");
      trackFormChange();
    }
  };

  const handleRemoveTag = (index) => {
    setNewEvent({
      ...newEvent,
      tags: newEvent.tags.filter((_, i) => i !== index)
    });
    trackFormChange();
  };

  const handleAddStar = () => {
    if (newStar.name && newStar.role) {
      setNewEvent({
        ...newEvent,
        featuredStars: [...newEvent.featuredStars, newStar]
      });
      setNewStar({ name: "", role: "" });
      trackFormChange();
    }
  };

  const handleRemoveStar = (index) => {
    setNewEvent({
      ...newEvent,
      featuredStars: newEvent.featuredStars.filter((_, i) => i !== index)
    });
    trackFormChange();
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setNewEvent({
        ...newEvent,
        highlights: [...newEvent.highlights, newHighlight.trim()]
      });
      setNewHighlight("");
      trackFormChange();
    }
  };

  const handleRemoveHighlight = (index) => {
    setNewEvent({
      ...newEvent,
      highlights: newEvent.highlights.filter((_, i) => i !== index)
    });
    trackFormChange();
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setNewEvent({
        ...newEvent,
        requirements: [...newEvent.requirements, newRequirement.trim()]
      });
      setNewRequirement("");
      trackFormChange();
    }
  };

  const handleRemoveRequirement = (index) => {
    setNewEvent({
      ...newEvent,
      requirements: newEvent.requirements.filter((_, i) => i !== index)
    });
    trackFormChange();
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
      trackFormChange();
    }
  };

  const handleRemoveSchedule = (index) => {
    setNewEvent({
      ...newEvent,
      schedule: newEvent.schedule.filter((_, i) => i !== index)
    });
    trackFormChange();
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value;
    // Only allow digits for phone numbers
    if (!/^\d*$/.test(value) && value !== '') {
      return;
    }
    
    // Limit to 10 digits
    if (value.length <= 10) {
      setNewEvent({
        ...newEvent,
        contactInfo: {
          ...newEvent.contactInfo,
          phone: value
        }
      });
      
      // Check if phone is valid (starts with 97 or 98 and is 10 digits)
      const isValid = /^(97|98)\d{8}$/.test(value);
      setValidFields(prev => ({
        ...prev,
        phone: isValid
      }));

      // Mark form as modified
      trackFormChange();
    }
  };

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setNewEvent({
      ...newEvent,
      contactInfo: {
        ...newEvent.contactInfo,
        email: value
      }
    });
    
    // Validate email format
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setValidFields(prev => ({
      ...prev,
      email: isValid
    }));

    // Mark form as modified
    trackFormChange();
  };

  const handleWebsiteChange = (e) => {
    const { value } = e.target;
    setNewEvent({
      ...newEvent,
      contactInfo: {
        ...newEvent.contactInfo,
        website: value
      }
    });
    
    // Website is optional, so it's valid if empty or matches the pattern
    const isValid = value === '' || /^https?:\/\//.test(value);
    setValidFields(prev => ({
      ...prev,
      website: isValid
    }));

    // Mark form as modified
    trackFormChange();
  };

  const handleNumericInput = (e, field, subField) => {
    const value = e.target.value;
    // Only allow digits (positive numbers only)
    if (!/^\d*$/.test(value) && value !== '') {
      return;
    }
    
    setNewEvent(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value
      }
    }));
    
    // Check if the numeric value is valid (positive number)
    const isValid = /^\d+$/.test(value) && parseInt(value) > 0;
    
    // Set the validation state for the specific field
    const fieldName = field === 'ticketPrice' 
      ? (subField === 'vip' ? 'vipTicketPrice' : 'generalTicketPrice')
      : (subField === 'vip' ? 'vipCapacity' : 'generalCapacity');
    
    setValidFields(prev => ({
      ...prev,
      [fieldName]: isValid
    }));

    // Mark form as modified
    setIsFormModified(true);
  };

  // Function to validate text fields
  const validateTextField = (fieldName, value) => {
    let isValid = false;
    
    // Different validation rules based on field type
    switch(fieldName) {
      case 'name':
      case 'description':
      case 'category':
      case 'organizer':
      case 'location':
        // Basic required field validation
        isValid = value.trim() !== '';
        break;
      case 'startDate':
      case 'endDate':
        // Date validation
        isValid = value !== '';
        break;
      case 'startTime':
      case 'endTime':
        // Time validation
        isValid = value !== '';
        break;
      default:
        isValid = false;
    }
    
    // Update the validation state
    setValidFields(prev => ({
      ...prev,
      [fieldName]: isValid
    }));
    
    return isValid;
  };

  const handleLocationSelect = (location) => {
    setNewEvent({
      ...newEvent,
      location: location.address,
      locationDetails: {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: location.address
      }
    });
    
    // Validate location field
    validateTextField('location', location.address);
    // Mark form as modified
    trackFormChange();
  };

  // Function to validate numeric fields
  const validateNumericField = (field, subField, value) => {
    // Check if it's a valid positive number
    const isValid = /^\d+$/.test(value) && parseInt(value) > 0;
    
    // Set validation state based on field and subfield
    const fieldName = field === 'ticketPrice' 
      ? (subField === 'vip' ? 'vipTicketPrice' : 'generalTicketPrice')
      : (subField === 'vip' ? 'vipCapacity' : 'generalCapacity');
    
    setValidFields(prev => ({
      ...prev,
      [fieldName]: isValid
    }));
    
    return isValid;
  };

  // Function to track form changes
  const trackFormChange = () => {
    if (existingEvent) {
      setIsFormModified(true);
    }
  };

  // Initialize validation on component mount
  useEffect(() => {
    if (existingEvent) {
      // Validate existing fields
      validateTextField('name', existingEvent.name || '');
      validateTextField('description', existingEvent.description || '');
      validateTextField('category', existingEvent.category || '');
      validateTextField('location', existingEvent.location || '');
      validateTextField('organizer', existingEvent.organizer || '');
      validateTextField('phone', existingEvent.contactInfo?.phone || '');
      validateTextField('email', existingEvent.contactInfo?.email || '');
      validateTextField('website', existingEvent.contactInfo?.website || '');
      
      if (existingEvent.ticketPrice?.vip) {
        validateNumericField('ticketPrice', 'vip', existingEvent.ticketPrice.vip.toString());
      }
      if (existingEvent.ticketPrice?.general) {
        validateNumericField('ticketPrice', 'general', existingEvent.ticketPrice.general.toString());
      }
      if (existingEvent.capacity?.vip) {
        validateNumericField('capacity', 'vip', existingEvent.capacity.vip.toString());
      }
      if (existingEvent.capacity?.general) {
        validateNumericField('capacity', 'general', existingEvent.capacity.general.toString());
      }
      validateTextField('startDate', existingEvent.startDate ? new Date(existingEvent.startDate).toISOString().split('T')[0] : '');
      validateTextField('endDate', existingEvent.endDate ? new Date(existingEvent.endDate).toISOString().split('T')[0] : '');
      validateTextField('startTime', existingEvent.startTime || '');
      validateTextField('endTime', existingEvent.endTime || '');

      // Initialize initial form data
      setInitialFormData(JSON.parse(JSON.stringify(existingEvent)));
      setIsFormModified(false);
    }
  }, [existingEvent]);

  // Create a validation function that checks all required fields
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!newEvent.name.trim()) newErrors.name = "Event name is required";
    if (!newEvent.description.trim()) newErrors.description = "Event description is required";
    if (!newEvent.category) newErrors.category = "Category is required";
    if (!newEvent.startDate) newErrors.startDate = "Start date is required";
    if (!newEvent.endDate) newErrors.endDate = "End date is required";
    if (!newEvent.startTime) newErrors.startTime = "Start time is required";
    if (!newEvent.endTime) newErrors.endTime = "End time is required";
    if (!newEvent.location.trim()) newErrors.location = "Location is required";
    if (!newEvent.organizer.trim()) newErrors.organizer = "Organizer is required";
    
    // Date validation
    if (newEvent.startDate && newEvent.endDate) {
      const start = new Date(newEvent.startDate);
      const end = new Date(newEvent.endDate);
      if (end < start) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }
    
    // Past date validation
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (newEvent.startDate) {
      const startDate = new Date(newEvent.startDate);
      if (startDate < currentDate) {
        newErrors.startDate = "Start date cannot be in the past";
      }
      }

      // Only validate ticket prices and capacity for paid events
    if (!isFreeEvent && newEvent.category !== 'Religious') {
      if (!newEvent.ticketPrice.vip.trim()) {
        newErrors.ticketPriceVip = "VIP ticket price is required";
      } else if (parseInt(newEvent.ticketPrice.vip) <= 0) {
        newErrors.ticketPriceVip = "Price must be greater than 0";
      }

      if (!newEvent.ticketPrice.general.trim()) {
        newErrors.ticketPriceGeneral = "General ticket price is required";
      } else if (parseInt(newEvent.ticketPrice.general) <= 0) {
        newErrors.ticketPriceGeneral = "Price must be greater than 0";
      }

      if (!newEvent.capacity.vip.trim()) {
        newErrors.capacityVip = "VIP capacity is required";
      } else if (parseInt(newEvent.capacity.vip) <= 0) {
        newErrors.capacityVip = "Capacity must be greater than 0";
      }

      if (!newEvent.capacity.general.trim()) {
        newErrors.capacityGeneral = "General capacity is required";
      } else if (parseInt(newEvent.capacity.general) <= 0) {
        newErrors.capacityGeneral = "Capacity must be greater than 0";
      }
    }
    
    // Validate featured stars, highlights, requirements, schedule
    if (newEvent.featuredStars.length === 0) newErrors.featuredStars = "At least one featured star is required";
    if (newEvent.highlights.length === 0) newErrors.highlights = "At least one highlight is required";
    if (newEvent.requirements.length === 0) newErrors.requirements = "At least one requirement is required";
    if (newEvent.schedule.length === 0) newErrors.schedule = "At least one schedule item is required";
    
    // Validate contact info
    const phonePattern = /^(97|98)\d{8}$/;
    if (!newEvent.contactInfo.phone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    } else if (!phonePattern.test(newEvent.contactInfo.phone)) {
      newErrors.contactPhone = "Phone must start with 97 or 98 followed by 8 digits (10 digits total)";
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEvent.contactInfo.email.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!emailPattern.test(newEvent.contactInfo.email)) {
      newErrors.contactEmail = "Please enter a valid email address";
    }
    
    // Optional website validation - only if a value is provided
    if (newEvent.contactInfo.website.trim() && !/^https?:\/\/.*/.test(newEvent.contactInfo.website)) {
      newErrors.contactWebsite = "Website URL must start with http:// or https://";
    }
    
    // Validate image
    if (!existingEvent && !newEvent.image) newErrors.image = "Event image is required";
    
    // Validate tags
    if (newEvent.tags.length === 0) newErrors.tags = "At least one tag is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      // If no changes were made to an existing event, show error message
      if (existingEvent && !isFormModified) {
        toast.error("No changes detected. Please make changes before updating.");
          return;
        }

      // Use our validation function
      if (!validateForm()) {
        toast.error("Please fill in all required fields");
        return;
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
        locationDetails: newEvent.locationDetails,
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
              <label>Event Name <span className="required-asterisk36">*</span></label>
              <input
                type="text"
                placeholder="Enter event name"
                value={newEvent.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewEvent({...newEvent, name: value});
                  validateTextField('name', value);
                  trackFormChange();
                }}
                className={errors.name ? "error-input36" : validFields.name ? "valid-input36" : ""}
              />
              {errors.name && <p className="error-message36">{errors.name}</p>}
            </div>
            <div className="form-group36">
              <label>Event Description <span className="required-asterisk36">*</span></label>
              <textarea
                placeholder="Enter event description"
                value={newEvent.description}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewEvent({...newEvent, description: value});
                  validateTextField('description', value);
                }}
                rows="4"
                className={errors.description ? "error-input36" : validFields.description ? "valid-input36" : ""}
              />
              {errors.description && <p className="error-message36">{errors.description}</p>}
            </div>
            <div className="form-group36">
              <label>Category <span className="required-asterisk36">*</span></label>
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
                  validateTextField('category', category);
                }}
                className={errors.category ? "error-input36" : validFields.category ? "valid-input36" : ""}
              >
                <option value="">Select Category</option>
                <option value="Cultural">Cultural</option>
                <option value="Festival">Festival</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
                <option value="Food">Food</option>
                <option value="Religious">Religious</option>
              </select>
              {errors.category && <p className="error-message36">{errors.category}</p>}
            </div>
          </div>

          {/* Date and Time */}
          <div className="form-section36">
            <h3>Date and Time</h3>
            <div className="date-time-group36">
              <div className="date-group36">
                <div className="form-group36">
                  <label>Start Date <span className="required-asterisk36">*</span></label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewEvent({...newEvent, startDate: value});
                      validateTextField('startDate', value);
                      trackFormChange();
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.startDate ? "error-input36" : validFields.startDate ? "valid-input36" : ""}
                  />
                  {errors.startDate && <p className="error-message36">{errors.startDate}</p>}
                </div>
                <div className="form-group36">
                  <label>End Date <span className="required-asterisk36">*</span></label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewEvent({...newEvent, endDate: value});
                      validateTextField('endDate', value);
                      trackFormChange();
                    }}
                    min={newEvent.startDate || new Date().toISOString().split('T')[0]}
                    className={errors.endDate ? "error-input36" : validFields.endDate ? "valid-input36" : ""}
                  />
                  {errors.endDate && <p className="error-message36">{errors.endDate}</p>}
                </div>
              </div>
              <div className="time-group36">
                <div className="form-group36">
                  <label>Start Time <span className="required-asterisk36">*</span></label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewEvent({...newEvent, startTime: value});
                      validateTextField('startTime', value);
                      trackFormChange();
                    }}
                    className={errors.startTime ? "error-input36" : validFields.startTime ? "valid-input36" : ""}
                  />
                  {errors.startTime && <p className="error-message36">{errors.startTime}</p>}
                </div>
                <div className="form-group36">
                  <label>End Time <span className="required-asterisk36">*</span></label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewEvent({...newEvent, endTime: value});
                      validateTextField('endTime', value);
                      trackFormChange();
                    }}
                    className={errors.endTime ? "error-input36" : validFields.endTime ? "valid-input36" : ""}
                  />
                  {errors.endTime && <p className="error-message36">{errors.endTime}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Location and Organizer */}
          <div className="form-section36">
            <h3>Location and Organizer</h3>
            <div className="form-group36">
              <label>Location <span className="required-asterisk36">*</span></label>
              <MapPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={existingEvent?.locationDetails}
              />
              {errors.location && <p className="error-message36">{errors.location}</p>}
            </div>
            <div className="form-group36">
              <label>Organizer <span className="required-asterisk36">*</span></label>
              <input
                type="text"
                placeholder="Enter organizer name"
                value={newEvent.organizer}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewEvent({...newEvent, organizer: value});
                  validateTextField('organizer', value);
                  trackFormChange();
                }}
                className={errors.organizer ? "error-input36" : validFields.organizer ? "valid-input36" : ""}
              />
              {errors.organizer && <p className="error-message36">{errors.organizer}</p>}
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
                  trackFormChange();
                }}
              />
              <label htmlFor="freeEvent">This is a free event</label>
            </div>
          )}

          {/* Ticket Prices - Only show if not free event */}
          {!isFreeEvent && (
            <div className="form-section36">
              <h3>Ticket Prices <span className="required-asterisk36">*</span></h3>
              <div className="price-inputs36">
                <div className="form-group36">
                  <label>VIP Ticket Price (NPR) <span className="required-asterisk36">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter VIP ticket price"
                    value={newEvent.ticketPrice.vip}
                    onChange={(e) => handleNumericInput(e, 'ticketPrice', 'vip')}
                    className={errors.ticketPriceVip ? "error-input36" : validFields.vipTicketPrice ? "valid-input36" : ""}
                  />
                  {errors.ticketPriceVip ? 
                    <p className="error-message36">{errors.ticketPriceVip}</p> : 
                    <p className="helper-text36">Enter a positive number only</p>
                  }
                </div>
                <div className="form-group36">
                  <label>General Ticket Price (NPR) <span className="required-asterisk36">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter general ticket price"
                    value={newEvent.ticketPrice.general}
                    onChange={(e) => handleNumericInput(e, 'ticketPrice', 'general')}
                    className={errors.ticketPriceGeneral ? "error-input36" : validFields.generalTicketPrice ? "valid-input36" : ""}
                  />
                  {errors.ticketPriceGeneral ? 
                    <p className="error-message36">{errors.ticketPriceGeneral}</p> : 
                    <p className="helper-text36">Enter a positive number only</p>
                  }
                </div>
              </div>
            </div>
          )}

          {/* Capacity - Only show if not free event */}
          {!isFreeEvent && (
            <div className="form-section36">
              <h3>Capacity <span className="required-asterisk36">*</span></h3>
              <div className="capacity-inputs36">
                <div className="form-group36">
                  <label>VIP Capacity <span className="required-asterisk36">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter VIP capacity"
                    value={newEvent.capacity.vip}
                    onChange={(e) => handleNumericInput(e, 'capacity', 'vip')}
                    className={errors.capacityVip ? "error-input36" : validFields.vipCapacity ? "valid-input36" : ""}
                  />
                  {errors.capacityVip ? 
                    <p className="error-message36">{errors.capacityVip}</p> : 
                    <p className="helper-text36">Enter a positive number only</p>
                  }
                </div>
                <div className="form-group36">
                  <label>General Capacity <span className="required-asterisk36">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter general capacity"
                    value={newEvent.capacity.general}
                    onChange={(e) => handleNumericInput(e, 'capacity', 'general')}
                    className={errors.capacityGeneral ? "error-input36" : validFields.generalCapacity ? "valid-input36" : ""}
                  />
                  {errors.capacityGeneral ? 
                    <p className="error-message36">{errors.capacityGeneral}</p> : 
                    <p className="helper-text36">Enter a positive number only</p>
                  }
                </div>
              </div>
            </div>
          )}

          {/* Featured Stars */}
          <div className="form-section36">
            <h3>Featured Stars <span className="required-asterisk36">*</span></h3>
            {errors.featuredStars && <p className="error-message36">{errors.featuredStars}</p>}
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
            <h3>Event Highlights <span className="required-asterisk36">*</span></h3>
            {errors.highlights && <p className="error-message36">{errors.highlights}</p>}
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
            <h3>Requirements <span className="required-asterisk36">*</span></h3>
            {errors.requirements && <p className="error-message36">{errors.requirements}</p>}
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
            <h3>Event Schedule <span className="required-asterisk36">*</span></h3>
            {errors.schedule && <p className="error-message36">{errors.schedule}</p>}
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
              <label>Phone Number <span className="required-asterisk36">*</span></label>
              <input
                type="tel"
                placeholder="Enter phone number starting with 97 or 98"
                value={newEvent.contactInfo.phone}
                onChange={handlePhoneInput}
                className={errors.contactPhone ? "error-input36" : validFields.phone ? "valid-input36" : ""}
                maxLength={10}
              />
              {errors.contactPhone ? 
                <p className="error-message36">{errors.contactPhone}</p> : 
                <p className="helper-text36">Phone must start with 97 or 98, total 10 digits</p>
              }
            </div>
            <div className="form-group36">
              <label>Email <span className="required-asterisk36">*</span></label>
              <input
                type="email"
                placeholder="Enter email address"
                value={newEvent.contactInfo.email}
                onChange={handleEmailChange}
                className={errors.contactEmail ? "error-input36" : validFields.email ? "valid-input36" : ""}
              />
              {errors.contactEmail && <p className="error-message36">{errors.contactEmail}</p>}
            </div>
            <div className="form-group36">
              <label>Website</label>
              <input
                type="url"
                placeholder="Enter website URL (starts with http:// or https://)"
                value={newEvent.contactInfo.website}
                onChange={handleWebsiteChange}
                className={errors.contactWebsite ? "error-input36" : validFields.website ? "valid-input36" : ""}
              />
              {errors.contactWebsite && <p className="error-message36">{errors.contactWebsite}</p>}
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section36">
            <h3>Event Image <span className="required-asterisk36">*</span></h3>
            <div className="file-input-container36">
              <div className="form-group36">
                <label>Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className={`file-input36 ${errors.image ? "error-input36" : ""}`}
                  onChange={handleImageChange}
                />
                {errors.image && <p className="error-message36">{errors.image}</p>}
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
              onChange={(e) => {
                setNewEvent({...newEvent, featured: e.target.checked});
                trackFormChange();
              }}
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