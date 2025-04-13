import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./AdminLocation.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Key
const GOMAPS_API_KEY = 'AlzaSy_371N1Zdv2lvQ2QvdnTABfYKRK_uqFjvp';
const DEFAULT_PLACE_PHOTO = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e819e4f8%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e819e4f8%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23E5E5E5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22107%22%20y%3D%22107.4%22%3ENo Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

// LocationCard component
const LocationCard = React.memo(({ place, onClick, onDirectionsClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(DEFAULT_PLACE_PHOTO);

  useEffect(() => {
    const loadPlacePhoto = async () => {
      if (place.photos && place.photos.length > 0 && place.photos[0].photo_reference) {
        try {
          const response = await axios.get(`https://maps.gomaps.pro/maps/api/place/photo`, {
            params: {
              maxwidth: 400,
              photo_reference: place.photos[0].photo_reference,
              key: GOMAPS_API_KEY
            },
            responseType: 'blob'
          });
          
          const url = URL.createObjectURL(response.data);
          setImageUrl(url);
          setImageLoaded(true);
          setImageError(false);
        } catch (error) {
          console.error('Error loading place photo:', error);
          setImageError(true);
          setImageUrl(DEFAULT_PLACE_PHOTO);
        }
      }
    };

    loadPlacePhoto();

    return () => {
      if (imageUrl !== DEFAULT_PLACE_PHOTO) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [place.photos]);

  const handleImageError = () => {
    setImageError(true);
    setImageUrl(DEFAULT_PLACE_PHOTO);
  };

  return (
    <div className="location-card37" onClick={onClick}>
      <div className="image-container37">
        <img 
          src={imageUrl}
          alt={place.name}
          className={`location-image37 ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          loading="lazy"
        />
        {!imageLoaded && !imageError && (
          <div className="image-loading-placeholder37">
            <div className="loading-spinner37"></div>
          </div>
        )}
      </div>
      <div className="location-details37">
        <div className="location-header37">
          <div className="title-rating37">
            <h3>{place.name}</h3>
            <div className="rating-badge37">
              {place.rating ? (
                <>
                  <span className="rating37">{place.rating.toFixed(1)}</span>
                  <span className="star37">⭐</span>
                  <span className="review-count37">
                    ({place.user_ratings_total.toLocaleString()} reviews)
                  </span>
                </>
              ) : (
                <span className="no-rating37">No ratings yet</span>
              )}
            </div>
          </div>
          {place.types && place.types[0] && (
            <div className="property-type37">
              {place.types[0].split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
          )}
        </div>
        
        {place.types && (
          <div className="amenities37">
            {place.types.slice(0, 3).map((type, idx) => (
              <span key={idx} className="amenity-tag37">
                {type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            ))}
          </div>
        )}
        
        {place.vicinity && (
          <p className="description37">{place.vicinity}</p>
        )}
        
        <div className="card-actions37">
          <div className="time-info37">
            <span>📍 {place.vicinity}</span>
          </div>
          <button 
            className="get-directions-btn37"
            onClick={(e) => {
              e.stopPropagation();
              onDirectionsClick();
            }}
          >
            <span>🗺️</span> Get Directions
          </button>
        </div>
      </div>
    </div>
  );
});

export default function AdminLocationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [userMarker, setUserMarker] = useState(null);
  const [nearbyMarkers, setNearbyMarkers] = useState([]);
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    let mapInitTimer;

    const initMap = async () => {
      try {
        // Initialize map centered on Nepal
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 27.7172, lng: 85.3240 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Initialize Directions Service and Renderer
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
        });

        // Setup search box
        const input = searchBoxRef.current;
        if (input) {
          input.addEventListener('input', handleSearchInput);
        }

        // Add listeners for map events
        map.addListener('dragend', () => {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
          searchTimeoutRef.current = setTimeout(() => {
            searchNearbyPlaces();
          }, 500);
        });

        map.addListener('zoom_changed', () => {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
          searchTimeoutRef.current = setTimeout(() => {
            searchNearbyPlaces();
          }, 500);
        });

        setMapLoaded(true);
        // Initial search
        searchNearbyPlaces();

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please try refreshing the page.');
        toast.error('Failed to initialize map');
      }
    };

    const loadGoMapsScript = () => {
      if (scriptLoadedRef.current) return;
      
      const existingScripts = document.querySelectorAll('script[src*="gomaps.pro"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.src = `https://maps.gomaps.pro/maps/api/js?key=${GOMAPS_API_KEY}&libraries=places&v=3.exp`;
      script.async = true;

      script.onload = () => {
        initMap();
      };

      script.onerror = () => {
        setMapError('Failed to load map. Please check your internet connection.');
        toast.error('Failed to load map');
      };

      document.head.appendChild(script);
      scriptLoadedRef.current = true;
    };

    loadGoMapsScript();

    return () => {
      if (mapInitTimer) {
        clearTimeout(mapInitTimer);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      const input = searchBoxRef.current;
      if (input) {
        input.removeEventListener('input', handleSearchInput);
      }
    };
  }, []);

  const handleSearchInput = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (!query) return;

    try {
      const response = await axios.get('https://maps.gomaps.pro/maps/api/geocode/json', {
        params: {
          address: query,
          components: 'country:np',
          key: GOMAPS_API_KEY
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(15);
        searchNearbyPlaces();
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const createMarker = (place, map) => {
    const position = {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    };

    const marker = new window.google.maps.Marker({
      position,
      map,
      title: place.name
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <h3 style="margin: 0 0 5px 0;">${place.name}</h3>
          <div style="margin: 5px 0;">
            ${place.rating ? `⭐ ${place.rating} (${place.user_ratings_total} reviews)` : 'No ratings yet'}
          </div>
          <div>${place.vicinity || ''}</div>
        </div>
      `
    });

    marker.addListener('click', () => {
      markersRef.current.forEach(m => {
        if (m.infoWindow) m.infoWindow.close();
      });
      
      infoWindow.open(map, marker);
      handleCardClick(place);
    });

    marker.infoWindow = infoWindow;
    return marker;
  };

  const searchNearbyPlaces = async () => {
    if (!mapInstanceRef.current) {
      console.error('Map not initialized');
      return;
    }

    setLoading(true);
    const map = mapInstanceRef.current;
    
    try {
      const center = map.getCenter();
      const bounds = map.getBounds();

      if (!center || !bounds) {
        console.warn('Map not ready yet');
        return;
      }

      let searchLocation = {
        lat: center.lat(),
        lng: center.lng()
      };

      if (searchQuery) {
        try {
          const geocodeResponse = await axios.get('https://maps.gomaps.pro/maps/api/geocode/json', {
            params: {
              address: searchQuery,
              components: 'country:np',
              key: GOMAPS_API_KEY
            }
          });

          if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
            const location = geocodeResponse.data.results[0].geometry.location;
            searchLocation = location;
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      const response = await axios.get('https://maps.gomaps.pro/maps/api/place/nearbysearch/json', {
        params: {
          key: GOMAPS_API_KEY,
          location: `${searchLocation.lat},${searchLocation.lng}`,
          radius: 5000,
          type: 'tourist_attraction'
        }
      });

      if (response.data.status === 'OK' && response.data.results) {
        const filteredResults = response.data.results
          .filter(place => place.rating >= 3.5)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setPlaces(filteredResults);
        
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        filteredResults.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            const marker = createMarker(place, map);
            markersRef.current.push(marker);
          }
        });
      } else {
        console.error('Places search failed:', response.data.status);
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error in searchNearbyPlaces:', error);
      toast.error('Failed to fetch nearby places');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (place) => {
    if (!place || !place.geometry || !place.geometry.location) return;
    
    setSelectedLocation(place);
    setShowModal(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(place.geometry.location);
      mapInstanceRef.current.setZoom(15);
    }
  };

  const searchNearbyAttractions = async () => {
    if (!mapInstanceRef.current) return;

    // Clear existing nearby markers
    nearbyMarkers.forEach(marker => marker.setMap(null));
    setNearbyMarkers([]);

    const center = mapInstanceRef.current.getCenter();
    setLoading(true);

    try {
      const response = await axios.get('https://maps.gomaps.pro/maps/api/place/nearbysearch/json', {
        params: {
          key: GOMAPS_API_KEY,
          location: `${center.lat()},${center.lng()}`,
          radius: 5000,
          type: ['tourist_attraction', 'point_of_interest']
        }
      });

      if (response.data.status === 'OK' && response.data.results) {
        const newMarkers = response.data.results.map(place => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: mapInstanceRef.current,
            title: place.name,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
            }
          });

          // Add click listener to marker
          marker.addListener('click', () => handleCardClick(place));

          return marker;
        });

        setNearbyMarkers(newMarkers);
        toast.success(`Found ${newMarkers.length} nearby attractions`);
      }
    } catch (error) {
      console.error('Error searching nearby places:', error);
      toast.error('Failed to find nearby attractions');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Get address for the location
        try {
          const response = await axios.get('https://maps.gomaps.pro/maps/api/geocode/json', {
            params: {
              latlng: `${location.lat},${location.lng}`,
              key: GOMAPS_API_KEY
            }
          });
          if (response.data.results && response.data.results[0]) {
            setOriginAddress(response.data.results[0].formatted_address);
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }

        // Update user location state
        setUserLocation(location);
        
        // Remove existing user marker if any
        if (userMarker) {
          userMarker.setMap(null);
        }

        // Create new user marker with custom pin icon
        const newUserMarker = new window.google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40)
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: 1000 // Ensure it stays on top
        });

        setUserMarker(newUserMarker);

        // Center map on user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(15);
        }

        setLoading(false);
        toast.success('Found your location!');
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Please enable location services in your browser';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Request to get location timed out';
            break;
        }
        toast.error(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const swapLocations = async () => {
    if (!userLocation || !selectedLocation) return;

    // Store the original locations
    const originalOrigin = { ...userLocation };
    const originalDestination = {
      lat: typeof selectedLocation.geometry.location.lat === 'function' 
        ? selectedLocation.geometry.location.lat() 
        : selectedLocation.geometry.location.lat,
      lng: typeof selectedLocation.geometry.location.lng === 'function' 
        ? selectedLocation.geometry.location.lng() 
        : selectedLocation.geometry.location.lng
    };

    // Create a new selected location object with the origin coordinates
    const newSelectedLocation = {
      ...selectedLocation,
      geometry: {
        location: {
          lat: originalOrigin.lat,
          lng: originalOrigin.lng
        }
      }
    };

    // Swap addresses first
    const tempOriginAddress = originAddress;
    setOriginAddress(destinationAddress);
    setDestinationAddress(tempOriginAddress);

    // Update user location to the destination
    setUserLocation(originalDestination);
    
    // Update selected location to the origin
    setSelectedLocation(newSelectedLocation);

    // Clear existing markers and directions
    if (userMarker) {
      userMarker.setMap(null);
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new DirectionsRenderer
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true,
      preserveViewport: false
    });

    try {
      // Get directions with swapped locations
      const request = {
        origin: new window.google.maps.LatLng(originalDestination.lat, originalDestination.lng),
        destination: new window.google.maps.LatLng(originalOrigin.lat, originalOrigin.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      const result = await directionsServiceRef.current.route(request);

      // Add new markers for swapped locations
      const originMarker = new window.google.maps.Marker({
        position: request.origin,
        map: mapInstanceRef.current,
        title: 'Your Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: 1000
      });

      const destinationMarker = new window.google.maps.Marker({
        position: request.destination,
        map: mapInstanceRef.current,
        title: 'Destination',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: 999
      });

      markersRef.current = [originMarker, destinationMarker];

      // Update the directions and route info
      directionsRendererRef.current.setDirections(result);
      setDirections(result);

      // Update route info
      if (result.routes[0] && result.routes[0].legs[0]) {
        setRouteInfo({
          distance: result.routes[0].legs[0].distance.text,
          duration: result.routes[0].legs[0].duration.text
        });
      }

      // Fit bounds to show the entire route
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(request.origin);
      bounds.extend(request.destination);
      mapInstanceRef.current.fitBounds(bounds);

      toast.success('Route updated successfully!');
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route. Please try again.');
      
      // Revert the changes if the route update fails
      setUserLocation(originalOrigin);
      setSelectedLocation({
        ...selectedLocation,
        geometry: {
          location: {
            lat: originalDestination.lat,
            lng: originalDestination.lng
          }
        }
      });
      setOriginAddress(tempOriginAddress);
      setDestinationAddress(destinationAddress);
    }
  };

  const getDirections = async (destination) => {
    // First ensure we have user location
    if (!userLocation) {
      toast.info('Getting your current location...');
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(location);
            
            // Also update the user marker
            if (userMarker) {
              userMarker.setMap(null);
            }
            const newUserMarker = new window.google.maps.Marker({
              position: location,
              map: mapInstanceRef.current,
              title: 'Your Location',
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40)
              }
            });
            setUserMarker(newUserMarker);
            resolve();
          },
          (error) => {
            console.error('Error getting location:', error);
            toast.error('Unable to get your location. Please enable location services.');
            resolve();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    }

    if (!userLocation || !destination) {
      toast.error('Unable to get directions without your location');
      return;
    }

    try {
      // Clear existing directions and markers
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      
      // Create new DirectionsRenderer
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true,
        preserveViewport: false
      });

      const request = {
        origin: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      const result = await directionsServiceRef.current.route(request);
      
      // Clear existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }

      // Add markers for origin and destination
      const originMarker = new window.google.maps.Marker({
        position: request.origin,
        map: mapInstanceRef.current,
        title: 'Your Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: 1000
      });

      const destinationMarker = new window.google.maps.Marker({
        position: request.destination,
        map: mapInstanceRef.current,
        title: selectedLocation.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: 999
      });

      markersRef.current.push(originMarker, destinationMarker);

      directionsRendererRef.current.setDirections(result);
      setDirections(result);

      // Fit bounds to show the entire route
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(request.origin);
      bounds.extend(request.destination);
      mapInstanceRef.current.fitBounds(bounds);

      // Close the modal to show the full map with directions
      setShowModal(false);
      toast.success('Directions loaded successfully!');

      // Get and set the destination address
      try {
        const response = await axios.get('https://maps.gomaps.pro/maps/api/geocode/json', {
          params: {
            latlng: `${destination.lat},${destination.lng}`,
            key: GOMAPS_API_KEY
          }
        });
        if (response.data.results && response.data.results[0]) {
          setDestinationAddress(response.data.results[0].formatted_address);
        }
      } catch (error) {
        console.error('Error getting destination address:', error);
      }

      // Set route info
      if (result.routes[0] && result.routes[0].legs[0]) {
        setRouteInfo({
          distance: result.routes[0].legs[0].distance.text,
          duration: result.routes[0].legs[0].duration.text
        });
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      toast.error('Failed to get directions');
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

      <div className="main-container37">
        <div className="heading37">
          <h1 className="title-heading37">Explore Map Management</h1>
          <p className="title-para37">Manage and Recommend Locations in Nepal</p>
        </div>

        {/* Updated Search Bar with Direction Details */}
        <div className="top-search-bar37">
          <div className="search-info37">
            <h2>Explore Nepal</h2>
            <p>Discover amazing places</p>
          </div>
          <div className="direction-inputs37">
            <div className="input-group37">
              <span className="input-label37">A</span>
              <input
                type="text"
                value={originAddress}
                placeholder="Your Location"
                readOnly
                className="location-input37"
              />
            </div>
            <button 
              className="swap-btn37" 
              onClick={swapLocations}
              disabled={!selectedLocation || !userLocation}
            >
              <span>🔄</span>
            </button>
            <div className="input-group37">
              <span className="input-label37">B</span>
              <input
                type="text"
                value={destinationAddress}
                placeholder="Destination"
                readOnly
                className="location-input37"
              />
            </div>
            {routeInfo && (
              <div className="route-info37">
                <span>🚗 {routeInfo.distance} • ⌚ {routeInfo.duration}</span>
              </div>
            )}
          </div>
          <div className="search-box37">
            <input
              ref={searchBoxRef}
              type="text"
              placeholder="Search for a place"
              className="search-input37"
            />
            <button 
              className="navigate-btn37"
              onClick={getCurrentLocation}
            >
              <span>📍</span> Navigate Me
            </button>
            <button 
              className="nearby-btn37"
              onClick={searchNearbyAttractions}
              disabled={loading}
            >
              <span>🎯</span> Nearby Attractions
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="map-container37">
          {!mapLoaded && <div className="loading-message37">Loading map...</div>}
          {mapError && <div className="error-message37">{mapError}</div>}
          {loading && <div className="loading-overlay37">
            <div className="loading-spinner37"></div>
            <p>Loading...</p>
          </div>}
          <div ref={mapRef} className="map-placeholder37" />
        </div>
      </div>

      {/* Location Details Modal */}
      {showModal && selectedLocation && (
        <div className="modal-overlay37">
          <div className="modal-content37">
            <button 
              className="close-modal37"
              onClick={() => {
                setShowModal(false);
                setSelectedLocation(null);
                if (directionsRendererRef.current) {
                  directionsRendererRef.current.setMap(null);
                }
              }}
            >
              ×
            </button>
            <div className="modal-header37">
              <h2>{selectedLocation.name}</h2>
              {selectedLocation.rating && (
                <div className="modal-rating37">
                  <span>⭐ {selectedLocation.rating}</span>
                  <span>({selectedLocation.user_ratings_total} reviews)</span>
                </div>
              )}
            </div>
            <div className="modal-body37">
              <p>{selectedLocation.vicinity}</p>
              {selectedLocation.photos && selectedLocation.photos.length > 0 && (
                <img 
                  src={`https://maps.gomaps.pro/maps/api/place/photo?maxwidth=400&photo_reference=${selectedLocation.photos[0].photo_reference}&key=${GOMAPS_API_KEY}`}
                  alt={selectedLocation.name}
                  className="modal-image37"
                />
              )}
              <div className="modal-actions37">
                <button 
                  className="get-directions-btn37"
                  onClick={() => {
                    if (selectedLocation.geometry && selectedLocation.geometry.location) {
                      const location = selectedLocation.geometry.location;
                      getDirections({
                        lat: typeof location.lat === 'function' ? location.lat() : location.lat,
                        lng: typeof location.lng === 'function' ? location.lng() : location.lng
                      });
                    }
                  }}
                >
                  <span>🗺️</span> Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}