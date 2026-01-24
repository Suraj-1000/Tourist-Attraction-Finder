import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import './MapDisplay.css';

// Use the same API key as in AdminLocation.jsx
const GOOGLE_MAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';

const MapDisplay = ({ latitude, longitude, formattedAddress, className }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script'
  });

  const mapStyles = {
    height: "100%",
    width: "100%"
  };

  const defaultCenter = {
    lat: parseFloat(latitude) || 27.7172,
    lng: parseFloat(longitude) || 85.3240
  };

  const onLoad = useCallback(map => {
    // Remove the bounds fitting as it can cause unexpected zoom levels
    map.setCenter(defaultCenter);
    map.setZoom(16); // Changed from 16 to 14 for a better view

    // Create a new marker
    const newMarker = new window.google.maps.Marker({
      position: defaultCenter,
      map: map,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new window.google.maps.Size(40, 40),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(20, 20)
      }
    });
    setMarker(newMarker);
    setMap(map);
  }, [defaultCenter]);

  const onUnmount = useCallback(() => {
    if (marker) {
      marker.setMap(null);
    }
    setMarker(null);
    setMap(null);
  }, [marker]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker && map) {
      marker.setPosition(defaultCenter);
      map.panTo(defaultCenter);
      map.setZoom(16); // Maintain consistent zoom level when location changes
    }
  }, [latitude, longitude, marker, map]);

  if (loadError) {
    return (
      <div className={`map-container ${className || ''}`}>
        <div className="error-overlay">
          <p>Error loading map. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`map-container ${className || ''}`}>
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-container ${className || ''}`}>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={16} // Set initial zoom level to 14
        center={defaultCenter}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            },
            {
              featureType: "road",
              elementType: "labels",
              stylers: [{ visibility: "on" }]
            }
          ]
        }}
      />
      {formattedAddress && (
        <div className="location-address">
          <p style={{ textAlign: 'center', margin: '0', width: '100%' }}>{formattedAddress}</p>
        </div>
      )}
    </div>
  );
};

export default MapDisplay; 
