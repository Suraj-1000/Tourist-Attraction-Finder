import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Calenderview.css';
import VerificationCheck from '../../../../components/VerificationCheck';

const CalenderView = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [datePickerValue, setDatePickerValue] = useState(
        `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    );
    const [currentGuideId, setCurrentGuideId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [filteredBookings, setFilteredBookings] = useState([]);

    useEffect(() => {
        // Get current guide ID from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            setCurrentGuideId(user.id);
        } else if (user && user._id) {
            setCurrentGuideId(user._id);
        }
        
        fetchBookings();
    }, []);

    // Update date picker value when selectedDate changes
    useEffect(() => {
        setDatePickerValue(
            `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
        );
    }, [selectedDate]);

    // Filter bookings when filter option or bookings change
    useEffect(() => {
        applyFilters();
    }, [activeFilter, bookings]);

    const applyFilters = () => {
        let filtered = [...bookings];
        
        // Apply tour type filter
        switch(activeFilter) {
            case 'packages':
                filtered = filtered.filter(booking => {
                    const bookingType = getBookingType(booking);
                    return bookingType === 'package';
                });
                break;
            case 'trips':
                filtered = filtered.filter(booking => {
                    const bookingType = getBookingType(booking);
                    return bookingType === 'trip';
                });
                break;
            case 'events':
                filtered = filtered.filter(booking => {
                    const bookingType = getBookingType(booking);
                    return bookingType === 'event';
                });
                break;
            default:
                // 'all' filter - no additional filtering needed
                break;
        }
        
        setFilteredBookings(filtered);
    };

    const fetchBookings = async () => {
        try {
            const response = await axios.get('http://localhost:4000/payments/all-bookings');
            if (response.data.success) {
                // Get the current guide's ID if not already set
                const user = JSON.parse(localStorage.getItem('user'));
                let guideId = currentGuideId;
                if (!guideId && user) {
                    if (user.id) {
                        guideId = user.id;
                        setCurrentGuideId(user.id);
                    } else if (user._id) {
                        guideId = user._id;
                        setCurrentGuideId(user._id);
                    }
                }
                
                // Filter bookings for the current guide
                let filteredBookings = [];
                
                if (guideId) {
                    console.log("Filtering calendar bookings for guide ID:", guideId);
                    
                    filteredBookings = response.data.bookings.filter(booking => {
                        // Case 1: First filter completed bookings
                        if (booking.status.toLowerCase() !== 'completed') {
                            return false;
                        }
                        
                        // Get package details and determine if it's a trip
                        const packageDetails = booking.paymentDetails?.packageDetails || {};
                        const category = (packageDetails.category || '').toLowerCase();
                        const isTrip = category.includes('short trip') || category.includes('long trip');
                        
                        // Case 2: Booking has no guide assigned (guideId is undefined/null)
                        if (!booking.guideId) {
                            console.log(`Calendar: Booking ${booking.bookingId}, ${booking.packageName}: No guide assigned, showing to all guides`);
                            return true; // Show to all guides
                        }
                        
                        // Convert both IDs to strings for comparison to avoid type issues
                        const bookingGuideId = String(booking.guideId);
                        const currentId = String(guideId);
                        
                        // Debug trip bookings specifically
                        if (isTrip) {
                            console.log(`CALENDAR TRIP BOOKING: ${booking.packageName}, guideId=${bookingGuideId}, currentGuideId=${currentId}, match=${bookingGuideId === currentId}`);
                            
                            // Additional debugging for trip guide details
                            if (booking.tripGuideDetails) {
                                console.log(`Trip guide details found: name=${booking.tripGuideDetails.guideName}, email=${booking.tripGuideDetails.guideEmail}`);
                            }
                        }
                        
                        // Case 3: Booking is assigned to this guide
                        const isAssigned = bookingGuideId === currentId;
                        if (isAssigned) {
                            console.log(`Calendar: Booking ${booking.bookingId}, ${booking.packageName}: Assigned to current guide (${bookingGuideId} === ${currentId})`);
                            return true;
                        } else {
                            console.log(`Calendar: Booking ${booking.bookingId}, ${booking.packageName}: Not assigned to current guide (${bookingGuideId} !== ${currentId})`);
                            return false;
                        }
                    });
                } else {
                    // If no guide ID found, show all completed bookings (admin view)
                    filteredBookings = response.data.bookings.filter(
                        booking => booking.status.toLowerCase() === 'completed'
                    );
                }
                
                setBookings(filteredBookings);
                setFilteredBookings(filteredBookings);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
            setLoading(false);
        }
    };

    const getBookingType = (booking) => {
        const packageDetails = booking.paymentDetails?.packageDetails || {};
        const duration = packageDetails.duration || '';
        const category = (packageDetails.category || '').toLowerCase();

        // Check if it's an event (has date range format)
        if (duration.includes(' to ') && 
            /[A-Za-z]+ \d{1,2}, \d{4} to [A-Za-z]+ \d{1,2}, \d{4}/.test(duration)) {
            return 'event';
        }

        // Check if it's a trip
        if (category.includes('long trip') || 
            category.includes('short trip')) {
            return 'trip';
        }

        // Everything else is a package
        return 'package';
    };

    // Parse dates from booking data
    const getBookingDates = (booking) => {
        const packageDetails = booking.paymentDetails?.packageDetails || {};
        
        // Check for startDate and endDate fields
        if (packageDetails.startDate && packageDetails.endDate) {
            return {
                startDate: new Date(packageDetails.startDate),
                endDate: new Date(packageDetails.endDate)
            };
        }
        
        // Parse from duration field (for events)
        if (packageDetails.duration && packageDetails.duration.includes(' to ')) {
            const dateParts = packageDetails.duration.split(' to ');
            if (/[A-Za-z]+ \d{1,2}, \d{4}/.test(dateParts[0])) {
                return {
                    startDate: new Date(dateParts[0]),
                    endDate: new Date(dateParts[1])
                };
            }
        }
        
        // Fallback to booking date if no proper dates found
        return {
            startDate: new Date(booking.bookingDate),
            endDate: new Date(booking.bookingDate)
        };
    };

    // Check if a date falls within a booking's date range
    const isDateInBookingRange = (date, booking) => {
        const { startDate, endDate } = getBookingDates(booking);
        
        // Reset hours to compare just the dates
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        const bookingStartDate = new Date(startDate);
        bookingStartDate.setHours(0, 0, 0, 0);
        
        const bookingEndDate = new Date(endDate);
        bookingEndDate.setHours(0, 0, 0, 0);
        
        return checkDate >= bookingStartDate && checkDate <= bookingEndDate;
    };

    // Get tour status relative to a specific date
    const getTourStatus = (date, booking) => {
        const { startDate, endDate } = getBookingDates(booking);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        const bookingStartDate = new Date(startDate);
        bookingStartDate.setHours(0, 0, 0, 0);
        
        const bookingEndDate = new Date(endDate);
        bookingEndDate.setHours(0, 0, 0, 0);

        // If the tour is a single day
        if (bookingStartDate.getTime() === bookingEndDate.getTime()) {
            if (checkDate.getTime() === bookingStartDate.getTime()) {
                if (today.getTime() === checkDate.getTime()) {
                    return 'today';
                }
                return 'single-day';
            }
        }
        
        // Check if it's the start date
        if (checkDate.getTime() === bookingStartDate.getTime()) {
            return 'start';
        }
        
        // Check if it's the end date
        if (checkDate.getTime() === bookingEndDate.getTime()) {
            return 'end';
        }
        
        // Check if it's in the middle of the tour
        if (checkDate > bookingStartDate && checkDate < bookingEndDate) {
            return 'in-progress';
        }
        
        // If none of the above, it's not part of this tour
        return null;
    };

    const handleDateClick = (date, bookingsForDate) => {
        setSelectedDate(date);
        if (bookingsForDate.length > 0) {
            // bookingsForDate already contains filtered bookings
            setSelectedBooking(bookingsForDate);
            setShowBookingModal(true);
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const handleDateChange = (e) => {
        setDatePickerValue(e.target.value);
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, 1));
    };

    const renderCalendar = () => {
        const daysInMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
        ).getDate();

        const firstDayOfMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        ).getDay();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
            date.setHours(0, 0, 0, 0);
            
            // Find bookings that include this date in their start-end range
            const bookingsForDay = filteredBookings.filter(booking => isDateInBookingRange(date, booking));

            const hasBookings = bookingsForDay.length > 0;
            const isToday = date.getTime() === today.getTime();

            // Count tours by status for dot indicators
            const statusCounts = {
                start: 0,
                end: 0,
                'in-progress': 0,
                'single-day': 0,
                'today': 0
            };
            
            bookingsForDay.forEach(booking => {
                const status = getTourStatus(date, booking);
                if (status) {
                    statusCounts[status]++;
                }
            });

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${hasBookings ? 'has-bookings' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleDateClick(date, bookingsForDay)}
                    data-count={bookingsForDay.length > 2 ? bookingsForDay.length : ''}
                >
                    <span className="day-number">{day}</span>
                    
                    {/* Status dots at the top of calendar day */}
                    {hasBookings && (
                        <div className="status-dots">
                            {statusCounts.start > 0 && <span className="status-dot start" title="Tour Start"></span>}
                            {statusCounts['in-progress'] > 0 && <span className="status-dot in-progress" title="In Progress"></span>}
                            {statusCounts.end > 0 && <span className="status-dot end" title="Tour End"></span>}            
                            {statusCounts['single-day'] > 0 && <span className="status-dot single-day" title="One-day Tour"></span>}
                            {statusCounts.today > 0 && <span className="status-dot today" title="Today's Tour"></span>}
                        </div>
                    )}
                    
                    {hasBookings && (
                        <div className="booking-list">
                            {/* Show at most 2 bookings directly in the calendar view */}
                            {bookingsForDay.slice(0, Math.min(2, bookingsForDay.length)).map((booking) => {
                                const bookingType = getBookingType(booking);
                                const tourStatus = getTourStatus(date, booking);
                                
                                return (
                                    <div 
                                        key={booking.bookingId} 
                                        className={`booking-item ${bookingType} ${tourStatus ? tourStatus : ''}`}
                                    >
                                        <span className="booking-title" title={booking.packageName}>
                                            {booking.packageName.length > 15 
                                                ? booking.packageName.substring(0, 15) + '...' 
                                                : booking.packageName}
                                        </span>
                                        <div className="booking-indicators">
                                            <span className={`booking-type ${bookingType}`}>
                                                {bookingType}
                                            </span>
                                            {tourStatus === 'start' && <span className="date-indicator start">Start</span>}
                                            {tourStatus === 'end' && <span className="date-indicator end">End</span>}
                                            {tourStatus === 'in-progress' && <span className="date-indicator in-progress">In Progress</span>}
                                            {tourStatus === 'single-day' && <span className="date-indicator single">1-Day</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            {bookingsForDay.length > 2 && (
                                <div className="more-bookings">
                                    View all {bookingsForDay.length} bookings
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const handlePrevMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDuration = (packageDetails) => {
        if (packageDetails.startDate && packageDetails.endDate) {
            return `${formatDate(packageDetails.startDate)} to ${formatDate(packageDetails.endDate)}`;
        }
        
        if (packageDetails.duration) {
            if (packageDetails.duration.includes(' to ')) {
                const [start, end] = packageDetails.duration.split(' to ');
                if (/[A-Za-z]+ \d{1,2}, \d{4}/.test(start)) {
                    return packageDetails.duration;
                }
                return `${formatDate(start)} to ${formatDate(end)}`;
            }
            return packageDetails.duration;
        }
        
        return 'N/A';
    };

    const renderLegend = () => {
        return (
            <div className="calendar-legend">
                <div className="legend-section">
                    <h3 className="legend-title">Tour Status</h3>
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="legend-indicator start"></div>
                            <span>Start</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-indicator end"></div>
                            <span>End</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-indicator in-progress"></div>
                            <span>In Progress</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-indicator single-day"></div>
                            <span>One-day Tour</span>
                        </div>
                    </div>
                </div>
                
                <div className="legend-section">
                    <h3 className="legend-title types">Tour Types</h3>
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="legend-indicator package"></div>
                            <span>Package</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-indicator trip"></div>
                            <span>Trip</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-indicator event"></div>
                            <span>Event</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Function to format month and year
    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    // Function to open month picker
    const openMonthPicker = () => {
        const monthPicker = document.getElementById('month-picker');
        if (monthPicker) {
            try {
                // Modern browsers support this method
                monthPicker.showPicker();
            } catch (e) {
                // Fallback for browsers that don't support showPicker()
                monthPicker.focus();
                // Force a click event as another fallback
                monthPicker.click();
            }
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    if (loading) {
        return (
            <div className="calendar-loading">
                <div className="loading-spinner"></div>
                <p>Loading calendar...</p>
            </div>
        );
    }

    return (
        <VerificationCheck>
            <div className="calendar-container">
                <div className="calendar-header">
                    <h1>Tour Calendar</h1>
                    <div className="calendar-controls">
                        <button className="today-button" onClick={goToToday}>Today</button>
                        <div className="date-navigator">
                            <button className="nav-arrow" onClick={handlePrevMonth}>&lt;</button>
                            <div className="current-month" onClick={openMonthPicker}>
                                {formatMonthYear(selectedDate)}
                                <input 
                                    id="month-picker"
                                    type="month" 
                                    value={datePickerValue}
                                    onChange={handleDateChange}
                                    className="hidden-month-picker"
                                />
                            </div>
                            <button className="nav-arrow" onClick={handleNextMonth}>&gt;</button>
                        </div>
                    </div>
                </div>

                <div className="booking-tabs">
                    <button 
                        className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        All Tours <span className="tour-count">({bookings.length})</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeFilter === 'packages' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('packages')}
                    >
                        Packages <span className="tour-count">({bookings.filter(b => getBookingType(b) === 'package').length})</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeFilter === 'trips' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('trips')}
                    >
                        Trips <span className="tour-count">({bookings.filter(b => getBookingType(b) === 'trip').length})</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeFilter === 'events' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('events')}
                    >
                        Events <span className="tour-count">({bookings.filter(b => getBookingType(b) === 'event').length})</span>
                    </button>
                </div>

                <div className="current-filter-summary">
                    {activeFilter === 'all' ? (
                        <p>Showing all {bookings.length} tours in the calendar</p>
                    ) : (
                        <p>
                            Showing {filteredBookings.length} {activeFilter === 'packages' ? 'package' : activeFilter === 'trips' ? 'trip' : 'event'} 
                            {filteredBookings.length !== 1 ? 's' : ''} out of {bookings.length} total tours
                        </p>
                    )}
                </div>

                {renderLegend()}

                <div className="calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                    ))}
                </div>

                <div className="calendar-grid">
                    {renderCalendar()}
                </div>

                {showBookingModal && selectedBooking && (
                    <div className="booking-modal">
                        <div className="modal-content">
                            <h2>
                                Bookings for {selectedDate.toLocaleDateString('en-US', {
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </h2>
                            <div className="booking-list">
                                {selectedBooking.map((booking, index) => {
                                    const packageDetails = booking.paymentDetails?.packageDetails || {};
                                    const userDetails = booking.paymentDetails?.userDetails || {};
                                    const bookingType = getBookingType(booking);
                                    
                                    // Check if booking is specifically assigned to the current guide
                                    const isAssignedToCurrentGuide = booking.guideId && currentGuideId && 
                                                                 String(booking.guideId) === String(currentGuideId);
                                    
                                    return (
                                        <div key={index} className={`booking-item ${bookingType}`}>
                                            <div className="booking-header-wrapper">
                                                <h3>{booking.packageName}</h3>
                                                {isAssignedToCurrentGuide && (
                                                    <span className="guide-assigned-tag">Assigned to You</span>
                                                )}
                                            </div>
                                            <div className="booking-details">
                                                <div className="booking-info">
                                                    <div className="booking-field">
                                                        <span className="label">Type:</span>
                                                        <span className="value">{bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}</span>
                                                    </div>
                                                    <div className="booking-field">
                                                        <span className="label">Duration:</span>
                                                        <span className="value">{formatDuration(packageDetails)}</span>
                                                    </div>
                                                    <div className="booking-field">
                                                        <span className="label">Status:</span>
                                                        <span className={`value status-${booking.status.toLowerCase()}`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                    <div className="booking-field">
                                                        <span className="label">Amount:</span>
                                                        <span className="value">{formatAmount(booking.amount)}</span>
                                                    </div>
                                                </div>
                                                <div className="customer-info">
                                                    <h4>Customer Details</h4>
                                                    <div className="booking-field">
                                                        <span className="label">Name:</span>
                                                        <span className="value">{userDetails.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="booking-field">
                                                        <span className="label">Email:</span>
                                                        <span className="value">{userDetails.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="booking-field">
                                                        <span className="label">Phone:</span>
                                                        <span className="value">{userDetails.phone || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button className="close-button" onClick={() => setShowBookingModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </VerificationCheck>
    );
};

export default CalenderView;
