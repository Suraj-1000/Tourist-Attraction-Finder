import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScriptNext, Marker, Autocomplete } from '@react-google-maps/api';

// Define libraries outside component to prevent unnecessary re-renders
const libraries = ['places'];

// Use the same API key as in AdminLocation.jsx
const GOOGLE_MAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  // Ensure valid coordinates or use defaults
  const getValidCoordinates = (location) => {
    const defaultLocation = {
      lat: 27.7172,
      lng: 85.3240,
      address: 'Kathmandu, Nepal'
    };

    if (!location) return defaultLocation;

    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      return defaultLocation;
    }

    return {
      lat,
      lng,
      address: location.formattedAddress || defaultLocation.address
    };
  };

  const validInitialLocation = getValidCoordinates(initialLocation);

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(validInitialLocation);
  const [searchBox, setSearchBox] = useState(null);
  const autocompleteRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    marginTop: '10px'
  };

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setIsMapLoaded(true);

    // Create initial marker with valid coordinates
    const newMarker = new window.google.maps.Marker({
      position: validInitialLocation,
      map: mapInstance,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new window.google.maps.Size(40, 40),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(20, 20)
      },
      draggable: true
    });

    // Add drag end listener to marker
    newMarker.addListener('dragend', (event) => {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      handleMarkerDrag(location);
    });

    setMarker(newMarker);
  }, [validInitialLocation]);

  const onLoad = useCallback((autocomplete) => {
    setSearchBox(autocomplete);
  }, []);

  // Update marker position when location changes
  useEffect(() => {
    if (marker && map) {
      const validLocation = getValidCoordinates({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        formattedAddress: selectedLocation.address
      });
      
      marker.setPosition(validLocation);
      map.panTo(validLocation);
    }
  }, [selectedLocation, marker, map]);

  // Update marker when initial location changes
  useEffect(() => {
    if (initialLocation && marker) {
      const validLocation = getValidCoordinates(initialLocation);
      setSelectedLocation(validLocation);
      marker.setPosition(validLocation);
      map?.panTo(validLocation);
    }
  }, [initialLocation, marker, map]);

  // Clean up marker on unmount
  useEffect(() => {
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  const onPlaceChanged = useCallback(() => {
    if (searchBox) {
      const place = searchBox.getPlace();
      if (place.geometry) {
        // Use the original search input value instead of formatting the address
        const searchInputValue = autocompleteRef.current.value;
        
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: searchInputValue, // Use the exact search input
          name: place.name || ''
        };

        setSelectedLocation(location);

        onLocationSelect({
          lat: location.lat,
          lng: location.lng,
          address: location.address // This will now be the exact search input
        });

        map?.panTo(location);
        map?.setZoom(16);
      }
    }
  }, [searchBox, map, onLocationSelect]);

  const getDetailedAddress = useCallback((location, callback) => {
    const geocoder = new window.google.maps.Geocoder();
    const latLng = { lat: location.lat, lng: location.lng };

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        // Use the most detailed formatted address
        const address = results[0].formatted_address;
        callback({
          ...location,
          address: address
        });
      } else {
        callback({
          ...location,
          address: 'Location address not found'
        });
      }
    });
  }, []);

  const handleMapClick = useCallback((event) => {
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    getDetailedAddress(location, (locationWithAddress) => {
      setSelectedLocation(locationWithAddress);
      onLocationSelect(locationWithAddress);
    });
  }, [onLocationSelect]);

  const handleMarkerDrag = useCallback((location) => {
    getDetailedAddress(location, (locationWithAddress) => {
      setSelectedLocation(locationWithAddress);
      onLocationSelect(locationWithAddress);
    });
  }, [onLocationSelect]);

  const formatCoordinates = useCallback((value) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(6);
    }
    return '0.000000';
  }, []);

  return (
    <div className="map-picker-container">
      <LoadScriptNext
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        preventGoogleFontsLoading={true}
      >
        <div className="search-box-container">
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: 'np' },
              types: ['establishment', 'geocode'],
              fields: ['name', 'geometry', 'formatted_address', 'address_components', 'place_id']
            }}
          >
            <input
              type="text"
              placeholder="Search location in Nepal..."
              className="location-search-input"
              ref={autocompleteRef}
            />
          </Autocomplete>
        </div>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={selectedLocation}
          zoom={16}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR,
              position: window.google?.maps?.ControlPosition?.TOP_RIGHT
            },
            zoomControlOptions: {
              position: window.google?.maps?.ControlPosition?.RIGHT_CENTER
            }
          }}
        />
        {selectedLocation && (
          <div className="selected-location">
            <p>Selected Location: {selectedLocation.address}</p>
            <p>Latitude: {formatCoordinates(selectedLocation.lat)}</p>
            <p>Longitude: {formatCoordinates(selectedLocation.lng)}</p>
          </div>
        )}
      </LoadScriptNext>
    </div>
  );
};

export default React.memo(MapPicker); 