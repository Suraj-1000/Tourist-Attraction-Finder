import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Map.css";
import axios from "axios";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer";

// API Key
const GOMAPS_API_KEY = 'AlzaSy01vkQC51J5KBnmMf9rwzg-1DH4P7EvQpA';
const DEFAULT_PLACE_PHOTO = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e819e4f8%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e819e4f8%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23E5E5E5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22107%22%20y%3D%22107.4%22%3ENo Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

// LocationCard component for better organization
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

    // Cleanup function to revoke object URL
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
    <div className="location-card35" onClick={onClick}>
      <div className="image-container35">
        <img 
          src={imageUrl}
          alt={place.name}
          className={`location-image35 ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          loading="lazy"
        />
        {!imageLoaded && !imageError && (
          <div className="image-loading-placeholder35">
            <div className="loading-spinner35"></div>
          </div>
        )}
      </div>
      <div className="location-details35">
        <div className="location-header35">
          <div className="title-rating35">
            <h3>{place.name}</h3>
            <div className="rating-badge35">
              {place.rating ? (
                <>
                  <span className="rating35">{place.rating.toFixed(1)}</span>
                  <span className="star35">⭐</span>
                  <span className="review-count35">
                    ({place.user_ratings_total.toLocaleString()} reviews)
                  </span>
                </>
              ) : (
                <span className="no-rating35">No ratings yet</span>
              )}
            </div>
          </div>
          {place.types && place.types[0] && (
            <div className="property-type35">
              {place.types[0].split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
          )}
        </div>
        
        {place.types && (
          <div className="amenities35">
            {place.types.slice(0, 3).map((type, idx) => (
              <span key={idx} className="amenity-tag35">
                {type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            ))}
          </div>
        )}
        
        {place.vicinity && (
          <p className="description35">{place.vicinity}</p>
        )}
        
        <div className="card-actions35">
          <div className="time-info35">
            <span>📍 {place.vicinity}</span>
          </div>
          <button 
            className="get-directions-btn35"
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

export default function AdminMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    let mapInitTimer;

    const initMap = async () => {
      try {
        // Initialize map centered on Nepal using GoMaps
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 27.7172, lng: 85.3240 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Setup search box with GoMaps Autocomplete
        const input = searchBoxRef.current;
        if (input) {
          // Handle input changes for search
          input.addEventListener('input', handleSearchInput);
        }

        // Add listener for map dragend event
        map.addListener('dragend', () => {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
          searchTimeoutRef.current = setTimeout(() => {
            searchNearbyPlaces();
          }, 500);
        });

        // Add listener for zoom_changed event
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
      
      // Remove any existing scripts
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
      // Remove event listener
      const input = searchBoxRef.current;
      if (input) {
        input.removeEventListener('input', handleSearchInput);
      }
    };
  }, []);

  // Handle search input changes
  const handleSearchInput = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (!query) return;

    try {
      // Geocode the search query
      const response = await axios.get('https://maps.gomaps.pro/maps/api/geocode/json', {
        params: {
          address: query,
          components: 'country:np',
          key: GOMAPS_API_KEY
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        // Update map and search
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

  const getPlacePhotoUrl = (place) => {
    if (place.photos && place.photos.length > 0 && place.photos[0].photo_reference) {
      return `https://maps.gomaps.pro/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOMAPS_API_KEY}`;
    }
    return DEFAULT_PLACE_PHOTO;
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

      // First, try to get the place details using the search query
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

      // Use GoMaps Places API for nearby search
      const response = await axios.get('https://maps.gomaps.pro/maps/api/place/nearbysearch/json', {
        params: {
          key: GOMAPS_API_KEY,
          location: `${searchLocation.lat},${searchLocation.lng}`,
          radius: 5000,
          type: 'tourist_attraction',
          keyword: activeFilter !== 'all' ? activeFilter : undefined
        }
      });

      if (response.data.status === 'OK' && response.data.results) {
        const filteredResults = response.data.results
          .filter(place => place.rating >= 3.5)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setPlaces(filteredResults);
        
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add new markers
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
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(place.geometry.location);
      mapInstanceRef.current.setZoom(15);
    }
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "popular", label: "Popular" },
    { id: "cultural", label: "Cultural" },
    { id: "adventure", label: "Adventure" },
    { id: "nature", label: "Nature" }
  ];

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
      <div className="main-container35">
        {/* Top Search Bar with Filters */}
        <div className="top-search-bar35">
          <div className="search-info35">
            <h2>Explore Nepal</h2>
            <p>Discover amazing places</p>
          </div>
          <div className="search-box35">
            <input
              ref={searchBoxRef}
              type="text"
              placeholder="Search for a place"
              className="search-input35"
            />
          </div>
          <div className="filters-row35">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`filter-btn35 ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="map-page-layout35">
          {/* Left side - Map */}
          <div className="map-container35">
            {!mapLoaded && <div className="loading-message">Loading map...</div>}
            {mapError && <div className="error-message">{mapError}</div>}
            <div ref={mapRef} className="map-placeholder35" />
          </div>

          {/* Right side - Cards */}
          <div className="left-sidebar35">
            <div className="cards-container35">
              {loading ? (
                <div className="loading-message">Loading places...</div>
              ) : places.length > 0 ? (
                places.map((place) => (
                  <LocationCard
                    key={place.place_id}
                    place={place}
                    onClick={() => handleCardClick(place)}
                    onDirectionsClick={() => {
                      if (place.geometry && place.geometry.location) {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat},${place.geometry.location.lng}`,
                          '_blank'
                        );
                      }
                    }}
                  />
                ))
              ) : (
                <div className="no-results-message">No places found in this area</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

