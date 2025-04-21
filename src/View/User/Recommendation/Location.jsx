import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./Location.css";
import Header from "../../../Components/User Header/User-Header";
import Footer from "../../../Components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';
const GOMAPS_API_KEY = GOOGLE_MAPS_API_KEY;
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
          const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`;
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
    <div className="location-card59" onClick={onClick}>
      <div className="image-container59">
        <img 
          src={imageUrl}
          alt={place.name}
          className={`location-image59 ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          loading="lazy"
        />
        {!imageLoaded && !imageError && (
          <div className="image-loading-placeholder59">
            <div className="loading-spinner59"></div>
          </div>
        )}
      </div>
      <div className="location-details59">
        <div className="location-header59">
          <div className="title-rating59">
            <h3>{place.name}</h3>
            <div className="rating-badge59">
              {place.rating ? (
                <>
                  <span className="rating59">{place.rating.toFixed(1)}</span>
                  <span className="star59">⭐</span>
                  <span className="review-count59">
                    ({place.user_ratings_total.toLocaleString()} reviews)
                  </span>
                </>
              ) : (
                <span className="no-rating59">No ratings yet</span>
              )}
            </div>
          </div>
          {place.types && place.types[0] && (
            <div className="property-type59">
              {place.types[0].split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
          )}
        </div>
        
        {place.types && (
          <div className="amenities59">
            {place.types.slice(0, 3).map((type, idx) => (
              <span key={idx} className="amenity-tag59">
                {type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            ))}
          </div>
        )}
        
        {place.vicinity && (
          <p className="description59">{place.vicinity}</p>
        )}
        
        <div className="card-actions59">
          <div className="time-info59">
            <span>📍 {place.vicinity}</span>
          </div>
          <button 
            className="get-directions-btn59"
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

export default function LocationPage() {
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
    let isMapInitialized = false;

    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        // If the API is already loaded and initialized properly, resolve immediately
        if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlacesService) {
          resolve();
          return;
        }

        // Remove any existing Google Maps scripts
        const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
        existingScripts.forEach(script => script.remove());

        // Create a global callback function
        window.initGoogleMaps = () => {
          // Wait a short moment for all components to initialize
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlacesService) {
              resolve();
            } else {
              reject(new Error("Google Maps API failed to load properly"));
            }
          }, 100);
        };

        // Load the script
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error("Failed to load Google Maps API"));
        document.head.appendChild(script);
      });
    };

    const initMap = async () => {
      if (isMapInitialized) return;

      try {
        await loadGoogleMaps();
        
        if (!mapRef.current || !window.google || !window.google.maps) {
          throw new Error("Map container or Google Maps API not available");
        }

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
          const searchBox = new window.google.maps.places.SearchBox(input);
          map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
          });

          searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;

            const bounds = new window.google.maps.LatLngBounds();
            places.forEach(place => {
              if (place.geometry && place.geometry.location) {
                bounds.extend(place.geometry.location);
              }
            });
            map.fitBounds(bounds);
          });
        }

        isMapInitialized = true;
        setMapLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please try refreshing the page.');
        toast.error('Failed to initialize map');
      }
    };

        initMap();

    return () => {
      // Cleanup
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      nearbyMarkers.forEach(marker => marker.setMap(null));
    };
  }, []);

  const handleSearchInput = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (!query) return;

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: query,
          components: 'country:np',
          key: GOOGLE_MAPS_API_KEY
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
          const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address: searchQuery,
              components: 'country:np',
              key: GOOGLE_MAPS_API_KEY
            },
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
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

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          key: GOOGLE_MAPS_API_KEY,
          location: `${searchLocation.lat},${searchLocation.lng}`,
          radius: 5000,
          type: 'tourist_attraction'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
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

  const handleCardClick = async (place) => {
    if (!place || !place.geometry || !place.geometry.location) return;
    
    try {
      setLoading(true);
      
      // Get detailed place information
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
      const detailedPlace = await new Promise((resolve, reject) => {
        service.getDetails({
          placeId: place.place_id,
          fields: [
            'name',
            'rating',
            'formatted_phone_number',
            'formatted_address',
            'geometry',
            'photos',
            'opening_hours',
            'website',
            'reviews',
            'price_level',
            'user_ratings_total',
            'types',
            'vicinity',
            'url',
            'editorial_summary',
            'wheelchair_accessible_entrance'
          ]
        }, (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(result);
          } else {
            reject(new Error(`Place details failed: ${status}`));
          }
        });
      });

      // Merge the detailed information with the place object
      const enhancedPlace = {
        ...place,
        ...detailedPlace
      };
      
      setSelectedLocation(enhancedPlace);
    setShowModal(true);
      
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(place.geometry.location);
        mapInstanceRef.current.setZoom(17);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      toast.error('Failed to load place details');
      setSelectedLocation(place);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyAttractions = async () => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) {
      toast.error('Map not initialized. Please wait or refresh the page.');
      return;
    }

    setLoading(true);

    try {
      let searchLocation;
      
      // Get user location if we don't have it
      if (!userLocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (error) => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });

        searchLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserLocation(searchLocation);
        
        if (userMarker) {
          userMarker.setMap(null);
        }

        const newUserMarker = new window.google.maps.Marker({
          position: searchLocation,
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40)
          }
        });
        setUserMarker(newUserMarker);
      } else {
        searchLocation = userLocation;
      }

      // Clear existing nearby markers
      nearbyMarkers.forEach(marker => marker.setMap(null));
      setNearbyMarkers([]);

      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
      const allResults = new Map();

      // Define place types to search for
      const placeTypes = [
        'place_of_worship',  // For temples and stupas
        'lodging',           // For hotels
        'tourist_attraction' // For additional religious sites
      ];

      // Search for each place type
      for (const type of placeTypes) {
        try {
          const request = {
            location: new window.google.maps.LatLng(searchLocation.lat, searchLocation.lng),
            radius: 10000, // Increased to 10km to find more religious sites
            type: type
          };

          const results = await new Promise((resolve, reject) => {
            service.nearbySearch(request, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else {
                resolve([]);
              }
            });
          });

          // Process and categorize results
          for (const place of results) {
            if (!allResults.has(place.place_id)) {
              // Determine category based on place type and name
              let category = 'other';
              let minRating = 3.5;
              let minReviews = 50;

              const placeName = place.name.toLowerCase();
              
              // Categorize based on place type and name
              if (type === 'place_of_worship' || 
                  placeName.includes('temple') || 
                  placeName.includes('stupa') || 
                  placeName.includes('monastery') ||
                  placeName.includes('gumba') ||
                  placeName.includes('gomp') ||
                  placeName.includes('vihar') ||
                  placeName.includes('mandir') ||
                  placeName.includes('gurudwara') ||
                  placeName.includes('church') ||
                  placeName.includes('mosque')) {
                category = 'religious_sites';
                minRating = 3.5;
                minReviews = 50;
              } else if (type === 'lodging') {
                if (place.rating >= 4.0 && place.user_ratings_total >= 200) {
                  category = 'luxury_hotels';
                  minRating = 4.0;
                  minReviews = 200;
                } else {
                  continue; // Skip hotels that don't meet luxury standards
                }
              } else if (type === 'tourist_attraction' && 
                        (placeName.includes('temple') || 
                         placeName.includes('stupa') || 
                         placeName.includes('monastery') ||
                         placeName.includes('gumba') ||
                         placeName.includes('gomp') ||
                         placeName.includes('vihar') ||
                         placeName.includes('mandir'))) {
                category = 'religious_sites';
                minRating = 3.5;
                minReviews = 50;
              }

              // Add place if it meets minimum requirements
              if (place.rating >= minRating && place.user_ratings_total >= minReviews) {
                place.category = category;
                place.importance = category === 'luxury_hotels' ? 'medium' : 'high';
                allResults.set(place.place_id, place);
              }
            }
          }
        } catch (error) {
          console.error(`Error searching for ${type}:`, error);
        }
      }

      const uniqueResults = Array.from(allResults.values())
        .sort((a, b) => {
          // First sort by importance
          if (a.importance !== b.importance) {
            return a.importance === 'high' ? -1 : 1;
          }
          // Then by rating
          if (a.rating !== b.rating) {
            return b.rating - a.rating;
          }
          // Finally by number of reviews
          return b.user_ratings_total - a.user_ratings_total;
        });

      if (uniqueResults.length === 0) {
        toast.info('No tourist attractions found nearby.');
        setLoading(false);
        return;
      }

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(searchLocation.lat, searchLocation.lng));

      // Category-specific marker colors
      const categoryColors = {
        religious_sites: 'purple',
        luxury_hotels: 'blue',
        other: 'orange'
      };

      const newMarkers = uniqueResults.map(place => {
        bounds.extend(place.geometry.location);
        
        const marker = new window.google.maps.Marker({
          position: place.geometry.location,
          map: mapInstanceRef.current,
          title: place.name,
          icon: {
            url: `http://maps.google.com/mapfiles/ms/icons/${categoryColors[place.category] || 'red'}-dot.png`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #1a73e8;">${place.name}</h3>
              ${place.rating ? `
                <div style="color: #666; margin-bottom: 8px;">
                  <span style="color: #fbbc04;">⭐ ${place.rating.toFixed(1)}</span>
                  <span style="color: #666;"> (${place.user_ratings_total} reviews)</span>
                </div>
              ` : ''}
              <div style="margin: 8px 0; color: #444; font-weight: 500;">
                ${place.category.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </div>
              ${place.vicinity ? `
                <div style="margin-top: 8px; color: #555;">
                  📍 ${place.vicinity}
                </div>
              ` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          newMarkers.forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
          });
          
          infoWindow.open(mapInstanceRef.current, marker);
          handleCardClick(place);
        });

        marker.infoWindow = infoWindow;
        return marker;
      });

      setNearbyMarkers(newMarkers);
      mapInstanceRef.current.fitBounds(bounds);

      // Count places by category
      const counts = uniqueResults.reduce((acc, place) => {
        acc[place.category] = (acc[place.category] || 0) + 1;
        return acc;
      }, {});

      toast.success(
        `Found ${uniqueResults.length} nearby attractions:\n` +
        `${counts.religious_sites || 0} religious sites (temples, stupas, monasteries), ` +
        `${counts.luxury_hotels || 0} luxury hotels (4+ stars)`
      );
      
      setPlaces(uniqueResults);

    } catch (error) {
      console.error('Error in searchNearbyAttractions:', error);
      if (error.code === 1) {
        toast.error('Please enable location services to find nearby attractions');
      } else {
        toast.error('Failed to find nearby attractions. Please try again.');
      }
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
          const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              latlng: `${location.lat},${location.lng}`,
              key: GOOGLE_MAPS_API_KEY
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
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            latlng: `${destination.lat},${destination.lng}`,
            key: GOOGLE_MAPS_API_KEY
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

  const renderPlaceDetails = () => {
    if (!selectedLocation) return null;

    return (
      <div className="modal-content59">
        <button 
          className="close-modal59"
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
        <div className="modal-header59">
          <h2>{selectedLocation.name}</h2>
          {selectedLocation.rating && (
            <div className="modal-rating59">
              <span>⭐ {selectedLocation.rating.toFixed(1)}</span>
              <span>({selectedLocation.user_ratings_total} reviews)</span>
            </div>
          )}
        </div>
        <div className="modal-body59">
          <div className="modal-image-container59">
            {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
              <img 
                src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedLocation.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`}
                alt={selectedLocation.name}
                className="modal-image59"
              />
            ) : (
              <div className="no-image-placeholder59">No Image Available</div>
            )}
          </div>
          <div className="modal-details59">
            <p className="modal-address59">📍 {selectedLocation.formatted_address || selectedLocation.vicinity}</p>
            
            {selectedLocation.editorial_summary && (
              <div className="modal-description59">
                <p>{selectedLocation.editorial_summary.overview}</p>
              </div>
            )}

            {selectedLocation.types && (
              <div className="modal-types59">
                <h3>Categories:</h3>
                <div className="type-tags59">
                  {selectedLocation.types.map((type, index) => (
                    <span key={index} className="type-tag59">
                      {type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedLocation.opening_hours && (
              <div className="modal-hours59">
                <h3>Opening Hours:</h3>
                <p>{selectedLocation.opening_hours.isOpen() ? 'Open Now' : 'Closed'}</p>
                {selectedLocation.opening_hours.weekday_text && (
                  <ul>
                    {selectedLocation.opening_hours.weekday_text.map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedLocation.formatted_phone_number && (
              <div className="modal-phone59">
                <p>📞 <a href={`tel:${selectedLocation.formatted_phone_number}`}>
                  {selectedLocation.formatted_phone_number}
                </a></p>
              </div>
            )}

            {selectedLocation.website && (
              <div className="modal-website59">
                <a href={selectedLocation.website} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </div>
            )}

            {selectedLocation.url && (
              <div className="modal-maps-link59">
                <a href={selectedLocation.url} target="_blank" rel="noopener noreferrer">
                  View on Google Maps
                </a>
              </div>
            )}

            {selectedLocation.wheelchair_accessible_entrance && (
              <div className="modal-accessibility59">
                <p>♿ Wheelchair Accessible</p>
              </div>
            )}

            {selectedLocation.reviews && selectedLocation.reviews.length > 0 && (
              <div className="modal-reviews59">
                <h3>Recent Reviews:</h3>
                <div className="reviews-container59">
                  {selectedLocation.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="review-item59">
                      <div className="review-header59">
                        <span className="review-author59">{review.author_name}</span>
                        <span className="review-rating59">⭐ {review.rating}</span>
                      </div>
                      <p className="review-text59">{review.text}</p>
                      <span className="review-time59">
                        {new Date(review.time * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions59">
            <button 
              className="get-directions-btn59"
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
    );
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

      <div className="main-container59">
        <div className="heading59">
          <h1 className="title-heading59">Explore Map Management</h1>
          <p className="title-para59">Manage and Recommend Locations in Nepal</p>
        </div>

        {/* Updated Search Bar with Direction Details */}
        <div className="top-search-bar59">
          <div className="search-info59">
            <h2>Explore Nepal</h2>
            <p>Discover amazing places</p>
          </div>
          <div className="direction-inputs59">
            <div className="input-group59">
              <span className="input-label59">A</span>
              <input
                type="text"
                value={originAddress}
                placeholder="Your Location"
                readOnly
                className="location-input59"
              />
            </div>
            <button 
              className="swap-btn59" 
              onClick={swapLocations}
              disabled={!selectedLocation || !userLocation}
            >
              <span>🔄</span>
            </button>
            <div className="input-group59">
              <span className="input-label59">B</span>
              <input
                type="text"
                value={destinationAddress}
                placeholder="Destination"
                readOnly
                className="location-input59"
              />
            </div>
            {routeInfo && (
              <div className="route-info59">
                <span>🚗 {routeInfo.distance} • ⌚ {routeInfo.duration}</span>
              </div>
            )}
          </div>
          <div className="search-box59">
            <input
              ref={searchBoxRef}
              type="text"
              placeholder="Search for a place"
              className="search-input59"
            />
            <button 
              className="navigate-btn59"
              onClick={getCurrentLocation}
            >
              <span>📍</span> Navigate Me
            </button>
            <button 
              className="nearby-btn59"
              onClick={searchNearbyAttractions}
              disabled={loading}
            >
              <span>🎯</span> Nearby Attractions
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="map-container59">
          {!mapLoaded && <div className="loading-message59">Loading map...</div>}
          {mapError && <div className="error-message59">{mapError}</div>}
          {loading && <div className="loading-overlay59">
            <div className="loading-spinner59"></div>
            <p>Loading...</p>
          </div>}
          <div ref={mapRef} className="map-placeholder59" />
        </div>
      </div>

      {/* Enhanced Location Details Modal */}
      {showModal && selectedLocation && (
        <div className="modal-overlay59">
          {renderPlaceDetails()}
        </div>
      )}

      <Footer />
    </>
  );
}