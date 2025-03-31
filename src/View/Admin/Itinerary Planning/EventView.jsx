const handleBookingSubmit = async (formData) => {
  try {
    // Calculate new capacities
    const newVipCapacity = event.capacity.vip - formData.vipTickets;
    const newGeneralCapacity = event.capacity.general - formData.generalTickets;

    // Validate if we have enough capacity
    if (newVipCapacity < 0 || newGeneralCapacity < 0) {
      toast.error("Not enough tickets available!", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message37'
      });
      return;
    }

    // Update event in database
    const updatedEvent = {
      ...event,
      capacity: {
        vip: newVipCapacity,
        general: newGeneralCapacity
      }
    };

    const response = await axios.put(`http://localhost:4000/adminEvents/${event._id}`, updatedEvent);

    if (response.data) {
      // Update local state
      setEvent(updatedEvent);
      
      toast.success("Tickets booked successfully!", {
        position: "top-right",
        autoClose: 3000,
        className: 'toast-message37'
      });
      
      // Close the booking form
      setShowBookingForm(false);

      // Refresh event details to get latest capacity
      fetchEventDetails();
    } else {
      throw new Error("Failed to update event capacity");
    }
  } catch (error) {
    console.error("Failed to update event capacity:", error);
    toast.error("Failed to update ticket availability", {
      position: "top-right",
      autoClose: 3000,
      className: 'toast-message37'
    });
  }
}; 