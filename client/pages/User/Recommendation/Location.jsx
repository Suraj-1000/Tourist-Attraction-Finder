import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./Location.css";
import Header from "../../../components/User Header/User-Header";
import Footer from "../../../components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';
const GOMAPS_API_KEY = GOOGLE_MAPS_API_KEY;
const DEFAULT_PLACE_PHOTO = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_189e819e4f8%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_189e819e4f8%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23E5E5E5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22107%22%20y%3D%22107.4%22%3ENo Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

// List of must-include tourist locations in Nepal
const FAMOUS_TOURIST_LOCATIONS = [
  'durbar square', 'patan', 'bhaktapur', 'thamel', 'swayambhu', 'boudha', 'pashupatinath',
  'garden of dreams', 'kumari', 'nagarkot', 'pokhara', 'phewa', 'annapurna', 
  'chitwan', 'lumbini', 'mustang', 'everest', 'kathmandu', 'namche', 'sagarmatha',
  'janakpur', 'rara', 'gokyo', 'langtang', 'gosaikunda', 'manang',
  'zoo', 'central zoo', 'central jail', 'national park', 'wildlife', 'conservation',
  'pokhari', 'lake', 'tal', 'pond', 'garden', 'park', 'botanical',
  'skytower', 'view tower', 'observation tower', 'dharahara', 'bhimsen tower',
  'rani pokhari', 'kamal pokhari', 'nag pokhari', 'gokarna', 'siddhapokhari',
  'balaju water garden', 'godavari', 'guhyeshwari', 'bajrayogini',
  'fun park', 'amusement park', 'water park', 'adventure park', 'theme park',
  'recreational area', 'play zone', 'fun valley', 'water kingdom', 'fantasy land'
];

// Define lists for better place detection and filtering
const PARK_TYPES = [
  'park', 'zoo', 'natural_feature', 'lake', 'pond', 'garden', 'aquarium', 
  'city_park', 'campground', 'amusement_park', 'theme_park', 'playground'
];
const HOTEL_TYPES = ['lodging', 'hotel', 'resort', 'guest_house', 'motel'];
const PARK_KEYWORDS = [
  'park', 'garden', 'zoo', 'pokhari', 'lake', 'pond', 'botanical', 'wildlife', 
  'conservation', 'sanctuary', 'water garden', 'fun park', 'amusement park', 
  'theme park', 'water park', 'aqua park', 'children park', 'kids park',
  'recreational', 'playground', 'entertainment', 'family park', 'picnic'
];
const TOWER_KEYWORDS = ['tower', 'skytower', 'view tower', 'observation deck', 'dharahara', 'bhimsen'];
const SPECIFIC_POKHARIS = [
  'rani pokhari',
  'kamal pokhari',
  'nag pokhari',
  'gahana pokhari',
  'gokarna pokhari',
  'siddhapokhari',
  'indra daha',
  'taudaha lake ',
  'nagdaha',
  'gosainkunda'
];
const SPECIFIC_HOTELS = [
  'hilton', 'hilton hotel', 'double tree hilton',
  'marriott', 'marriott kathmandu', 'marriott hotel', 
  'hotel yak & yeti', 'yak and yeti hotel', 'yak & yeti',
  'dwarika', "dwarika's hotel", 'dwarika heritage', 
  'hyatt', 'hyatt regency', 'hyatt kathmandu', 'hyatt hotel',
  'radisson', 'radisson hotel', 'radisson kathmandu',
  'soaltee crowne plaza', 'soaltee hotel', 'crowne plaza',
  'shangri-la', 'shangri la hotel', 'shangri-la village',
  'aloft kathmandu', 'aloft hotel',
  'hotel annapurna', 'annapurna hotel', 
  'the everest hotel', 'everest hotel',
  'malla hotel', 'malla',
  'hotel himalaya', 'himalaya hotel',
  'kathmandu grand hotel', 'grand hotel',
  'the fern residency', 'fern hotel',
  'fairfield by marriott', 'fairfield kathmandu',
  'hotel tibet', 'tibet international',
  'hotel ambassador', 'ambassador hotel',
  'gokarna forest resort', 'gokarna resort',
  'hotel mulberry', 'mulberry hotel',
  'hotel shanker', 'shanker hotel',
  'summit hotel', 
  'royal singi hotel',
  'yellow pagoda hotel',
  'thamel grand hotel',
  'hotel moonlight',
  'oasis kathmandu hotel',
  'hotel shambala',
  'hotel manaslu'
];
const SPECIFIC_PARKS = [
  'central zoo', 'jawalakhel zoo',
  'garden of dreams',
  'godavari botanical garden',
  'taudaha lake',
  'rani pokhari',
  'balaju water garden',
  'national botanical garden',
  'shivapuri national park',
  'langtang national park',
  'chitwan national park',
  'sagarmatha national park',
  'parsa national park',
  'rara national park',
  'bardiya national park',
  'shuklaphanta national park',
  'bansbari fun park',
  'kathmandu fun park',
  'kathmandu fun valley',
  'whoopee land',
  'water fun park',
  'bhrikuti mandap',
  'ratna park',
  'bhaktapur heritage park',
  'narayanhiti palace museum',
  'patan museum garden',
  'tribhuvan park',
  'nag pokhari',
  'kamal pokhari',
  'phewa lake',
  'lakeside park',
  'valley recreation center',
  'bhotekoshi river resort',
  'valley kids park'
];

// List of excluded establishment types that aren't relevant for tourists
const excludedTypes = [
  'school',
  'primary_school',
  'secondary_school',
  'university',
  'kindergarten',
  'elementary_school',
  'middle_school',
  'high_school',
  'college',
  'education',
  'educational_institution',
  'training_institution',
  'cram_school',
  'driving_school',
  'language_school',
  'music_school',
  'school_cafeteria',
  'dormitory',
  'student_housing',
  'gas_station',
  'local_government_office',
  'grocery_store',
  'convenience_store',
  'store',
  'shopping_mall',
  'supermarket',
  'pharmacy',
  'hospital',
  'doctor',
  'bank',
  'atm',
  'post_office',
  'police',
  'fire_station',
  'car_dealer',
  'car_repair',
  'car_wash',
  'dentist',
  'electrician',
  'plumber',
  'insurance_agency',
  'real_estate_agency',
  'accounting',
  'moving_company',
  'lawyer',
  'locksmith',
  'storage'
];

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
              onDirectionsClick(place);
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
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [directionsActive, setDirectionsActive] = useState(false);

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
          center: { lat: 27.7172, lng: 85.3240 }, // Nepal center
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Initialize the PlacesService
        const placesService = new window.google.maps.places.PlacesService(map);

        // Initialize Directions Service and Renderer
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#4285F4',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });
        
        // Setup search box with Google Places Autocomplete
        const input = searchBoxRef.current;
        if (input) {
          const autocomplete = new window.google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: "np" },
            fields: ["geometry", "name", "formatted_address", "place_id"],
          });
          
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
              if (place.geometry && place.geometry.location) {
              // Clear existing markers and search results when searching a new location
              if (nearbyMarkers.length > 0) {
                nearbyMarkers.forEach(marker => marker.setMap(null));
                setNearbyMarkers([]);
              }
              
              // Clear directions if active
              if (directionsActive) {
                setDirectionsActive(false);
                if (directionsRendererRef.current) {
                  directionsRendererRef.current.setMap(null);
                }
                setDirections(null);
                setRouteInfo(null);
              }
              
              // Save the searched location - ensure we get the latitude and longitude correctly
              setSearchedLocation({
                lat: Number(place.geometry.location.lat()),
                lng: Number(place.geometry.location.lng()),
                address: place.formatted_address || place.name
              });
              
              console.log("Searched location set to:", {
                lat: Number(place.geometry.location.lat()),
                lng: Number(place.geometry.location.lng())
              });
              
              map.setCenter(place.geometry.location);
              map.setZoom(16);
              
              // Show message that user can now search nearby
              toast.info('You can now explore nearby attractions!', {
                autoClose: 3000
              });
            }
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
        
        // Clear existing markers and search results
        if (nearbyMarkers.length > 0) {
          nearbyMarkers.forEach(marker => marker.setMap(null));
          setNearbyMarkers([]);
        }
        
        // Clear directions if active
        if (directionsActive) {
          setDirectionsActive(false);
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
          }
          setDirections(null);
          setRouteInfo(null);
        }
        
        // Save the searched location with explicit number conversion
        setSearchedLocation({
          lat: Number(location.lat),
          lng: Number(location.lng),
          address: response.data.results[0].formatted_address || query
        });
        
        console.log("Searched location set to:", {
          lat: Number(location.lat),
          lng: Number(location.lng)
        });
        
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(15);
        
        // Don't automatically search nearby places - let user click the button
        toast.info('You can now search for nearby attractions!', {
          autoClose: 3000
        });
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

    // Check if we have either user location or searched location
    if (!userLocation && !searchedLocation) {
      toast.info('Please use "Navigate Me" to find your location or search for a place first.');
      return;
    }

    // If we're using user location (not searched location), clear the search input
    if (userLocation && !searchedLocation) {
      if (searchBoxRef.current) {
        searchBoxRef.current.value = '';
      }
      setSearchQuery('');
    }

    setLoading(true);
    let isSearchingRef = false;

    try {
      // Use searched location if it's the most recent one used, otherwise use user location
      // This ensures that when a user searches for a new location, we use that instead of user's position
      const searchLocation = searchedLocation || userLocation;
      
      // Tell the user which location we're using
      const locationSource = searchedLocation ? 'the searched location' : 'your location';
      toast.info(`Searching for attractions near ${locationSource}...`, { autoClose: 2000 });

      // Clear existing nearby markers
      nearbyMarkers.forEach(marker => marker.setMap(null));
      setNearbyMarkers([]);

      const map = mapInstanceRef.current;
      const center = new window.google.maps.LatLng(searchLocation.lat, searchLocation.lng);
      
      // Add a visual marker at the search center
      // Create different markers based on whether we're using the user's location or searched location
      const searchMarker = new window.google.maps.Marker({
        position: { lat: searchLocation.lat, lng: searchLocation.lng },
        map: map,
        title: searchedLocation ? 'Search Location' : 'Your Location',
        icon: {
          url: searchedLocation 
            ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
            : 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        animation: window.google.maps.Animation.DROP,
        zIndex: 1000
      });
      
      // Add to nearby markers so it gets cleared with others
      setNearbyMarkers(prev => [...prev, searchMarker]);
      
      // Don't run if already searching
      if (isSearchingRef) {
        return;
      }
      
      // Setup PlacesService
      const placesService = new window.google.maps.places.PlacesService(map);
      let allResults = [];

      // Define search configurations for comprehensive coverage
      const searchConfigs = [
        // Tourist attractions
        { type: 'tourist_attraction', radius: 10000 },
        { type: 'point_of_interest', radius: 8000 },
        
        // Temples and religious sites
        { type: 'hindu_temple', radius: 12000 },
        { type: 'buddhist_temple', radius: 12000 },
        { type: 'place_of_worship', radius: 10000 },
        { keyword: 'temple nepal', radius: 15000 },
        { keyword: 'shrine nepal', radius: 15000 },
        { keyword: 'stupa nepal', radius: 15000 },
        { keyword: 'pashupatinath', radius: 20000 },
        { keyword: 'swayambhunath', radius: 20000 },
        { keyword: 'boudhanath', radius: 20000 },
        
        // Natural attractions
        { type: 'natural_feature', radius: 15000 },
        { keyword: 'garden nepal', radius: 15000 },
        { keyword: 'garden of dreams', radius: 25000 },
        
        // Museums and cultural sites
        { type: 'museum', radius: 15000 },
        { type: 'art_gallery', radius: 15000 },
        { keyword: 'durbar square', radius: 20000 },
        { keyword: 'palace nepal', radius: 20000 },
        { keyword: 'heritage nepal', radius: 15000 },
        
        // Parks and recreation
        { type: 'park', radius: 15000 },
        { type: 'zoo', radius: 15000 },
        { keyword: 'central zoo nepal', radius: 25000 },
        
        // Famous landmarks and structures
        { keyword: 'dharahara', radius: 25000 },
        { keyword: 'view tower nepal', radius: 25000 },
        { keyword: 'bhimsen tower', radius: 25000 },
        
        // Lakes and water features
        { keyword: 'lake nepal', radius: 15000 },
        { keyword: 'pokhari nepal', radius: 15000 },
        { keyword: 'rani pokhari', radius: 25000 },
        
        // Premium accommodations
        { keyword: 'luxury hotel nepal', radius: 10000, minRating: 4.0 },
        { keyword: 'five star hotel kathmandu', radius: 15000 },
        { keyword: 'dwarika hotel', radius: 25000 }
      ];
      
      // Count total searches to track completion
      const totalSearches = searchConfigs.length;
      let searchesCompleted = 0;
      
      // Function to create a marker with info window
      const createMarker = (place, map) => {
        try {
          if (!place.geometry || !place.geometry.location) {
            console.warn('Place has no geometry', place.name);
            return null;
          }
          
          const position = place.geometry.location;
          
          // Check if it's a hotel and if it's a specific named hotel
          const isHotel = place.types && place.types.some(type => HOTEL_TYPES.includes(type));
          const isSpecificHotel = place.name && SPECIFIC_HOTELS.some(
            hotelName => place.name.toLowerCase().includes(hotelName.toLowerCase().split(' ')[0])
          );

          // Create marker with animation for special hotels but use standard marker for all
        const marker = new window.google.maps.Marker({
            position,
            map,
          title: place.name,
            // Only add animation for specific hotels
            animation: isSpecificHotel ? window.google.maps.Animation.DROP : null
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 5px 0;">${place.name}</h3>
                <div style="margin: 5px 0;">
                      ${place.rating ? `⭐ ${place.rating} (${place.user_ratings_total || 0} reviews)` : 'No ratings yet'}
                </div>
                <div>${place.vicinity || ''}</div>
                  ${isHotel ? '<div style="margin-top: 5px; color: #0066cc;"><strong>Hotel</strong></div>' : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
            nearbyMarkers.forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
          });
          
            infoWindow.open(map, marker);
          handleCardClick(place);
        });

        marker.infoWindow = infoWindow;
        return marker;
        } catch (error) {
          console.error('Error creating marker:', error);
          return null;
        }
      };
      
      // Function to process search results
      const processSearchResults = () => {
        // Process and filter results
        const filteredResults = processAllResults(allResults, center);
        setPlaces(filteredResults);
        
        // Add markers for each place
        const newMarkers = [];
        filteredResults.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            const marker = createMarker(place, map);
            if (marker) {
              newMarkers.push(marker);
            }
          }
      });

      setNearbyMarkers(newMarkers);
        
        // Create bounds to fit all markers
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(center);
        newMarkers.forEach(marker => {
          bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds);
        
        setLoading(false);
        isSearchingRef = false;
        
        // Show success message with categories
        const count = filteredResults.length;
        toast.success(`Found ${count} nearby attractions in Nepal`);
      };
      
      // Execute all search configurations
      searchConfigs.forEach(config => {
        const request = {
          location: center,
          radius: config.radius || 5000
        };
        
        if (config.type) request.type = config.type;
        if (config.keyword) request.keyword = config.keyword;
        
        placesService.nearbySearch(request, (results, status) => {
          searchesCompleted++;
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`Found ${results.length} results for ${config.type || config.keyword || 'search'}`);
            
            // Pre-filter results to remove educational institutions
            const filteredResults = results.filter(place => {
              // Check types against excluded types
              if (place.types) {
                for (const excludedType of excludedTypes) {
                  if (place.types.includes(excludedType)) {
                    return false;
                  }
                }
              }
              
              // Check names against educational terms
              if (place.name) {
                const name = place.name.toLowerCase();
                const educationalTerms = ['school', 'college', 'university', 'academy'];
                if (educationalTerms.some(term => name.includes(term))) {
                  return false;
                }
              }
              
              // Apply minimum rating if specified
              if (config.minRating && (!place.rating || place.rating < config.minRating)) {
                return false;
              }
              
              return true;
            });
            
            allResults = [...allResults, ...filteredResults];
          } else if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.warn(`Search failed with status: ${status} for ${config.type || config.keyword || 'search'}`);
          }
          
          // If all searches are done, process the results
          if (searchesCompleted === totalSearches) {
            console.log(`Completed all ${totalSearches} searches with ${allResults.length} total results`);
            processSearchResults();
          }
        });
      });
    } catch (error) {
      console.error('Error in searchNearbyAttractions:', error);
      if (error.code === 1) {
        toast.error('Please enable location services to find nearby attractions');
      } else {
        toast.error('Failed to find nearby attractions. Please try again.');
      }
      setLoading(false);
    }
  };

  // Function to process and filter search results
  const processAllResults = (allResults, center) => {
    console.log("Processing total of", allResults.length, "results");
    
    // Remove duplicates based on place_id
    const uniqueResults = Array.from(
      new Map(allResults.map(place => [place.place_id, place])).values()
    );
    
    console.log("After removing duplicates:", uniqueResults.length, "unique places");
    
    // Helper functions for checking place properties
    const hasSpecialType = (typesList, place) => {
      if (!place.types) return false;
      return typesList.some(type => place.types.includes(type));
    };
    
    const nameContains = (terms, place) => {
      if (!place.name) return false;
      const name = place.name.toLowerCase();
      return terms.some(term => name.includes(term));
    };
    
    const vicinityContains = (terms, place) => {
      if (!place.vicinity) return false;
      const vicinity = place.vicinity.toLowerCase();
      return terms.some(term => vicinity.includes(term));
    };
    
    // Check if a place is an educational institution by name
    const isEducationalByName = (place) => {
      if (!place.name) return false;
      const name = place.name.toLowerCase();
      const educationalTerms = [
        'school', 'college', 'university', 'academy', 'institute', 'campus',
        'kindergarten', 'education', 'educational', 'preschool', 'polytechnic',
        'vidyalaya', 'pathshala', 'shiksha', 'vidya'
      ];
      return educationalTerms.some(term => name.includes(term));
    };
    
    // Filter out unwanted place types
    let filteredResults = uniqueResults.filter(place => {
      // Always include specific hotels
      const name = (place.name || '').toLowerCase();
      const vicinity = (place.vicinity || '').toLowerCase();
      
      if (SPECIFIC_HOTELS.some(hotel => name.includes(hotel.toLowerCase().split(' ')[0]))) {
        console.log("Including specific hotel in results:", place.name);
        return true;
      }
      
      // Special handling for parks and lakes
      if (PARK_KEYWORDS.some(term => name.includes(term) || vicinity.includes(term)) ||
          SPECIFIC_PARKS.some(park => name.includes(park.toLowerCase()) || vicinity.includes(park.toLowerCase()))) {
        return true;
      }
      
      // Special handling for towers/viewpoints
      if (TOWER_KEYWORDS.some(term => name.includes(term) || vicinity.includes(term))) {
        return true;
      }
      
      // Special handling for pokharis (ponds)
      if (SPECIFIC_POKHARIS.some(pond => name.includes(pond.toLowerCase()) || vicinity.includes(pond.toLowerCase()))) {
        return true;
      }
      
      // Keep hotels with good ratings
      if (hasSpecialType(HOTEL_TYPES, place) && place.rating >= 3.8) {
        return true;
      }
      
      // Keep places with higher ratings in general
      if (place.rating >= 4.0) return true;
      
      // Keep famous locations regardless of rating
      const nameAndVicinity = (place.name + ' ' + (place.vicinity || '')).toLowerCase();
      for (const location of FAMOUS_TOURIST_LOCATIONS) {
        if (nameAndVicinity.includes(location)) {
          return true;
        }
      }
      
      // Check if place has any of the excluded types
      if (place.types) {
        for (const excludedType of excludedTypes) {
          if (place.types.includes(excludedType)) {
            return false;
          }
        }
      }
      
      // Exclude places that have educational terms in their names
      if (isEducationalByName(place)) {
        return false;
      }
      
      // Include tourist attractions with decent ratings
      if (place.types && 
          (place.types.includes('tourist_attraction') ||
           place.types.includes('point_of_interest')) && 
          place.rating >= 3.5) {
        return true;
      }
      
      return true;
    });
    
    // Sort results by rating
    filteredResults = filteredResults.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      
      // Check if these are specific hotels or famous places
      const aIsSpecial = SPECIFIC_HOTELS.some(hotel => aName.includes(hotel.toLowerCase().split(' ')[0])) ||
                        FAMOUS_TOURIST_LOCATIONS.some(location => aName.includes(location.toLowerCase()));
      
      const bIsSpecial = SPECIFIC_HOTELS.some(hotel => bName.includes(hotel.toLowerCase().split(' ')[0])) ||
                        FAMOUS_TOURIST_LOCATIONS.some(location => bName.includes(location.toLowerCase()));
      
      // Prioritize special places
      if (aIsSpecial && !bIsSpecial) return -1;
      if (!aIsSpecial && bIsSpecial) return 1;
      
      // Then sort by rating
      return (b.rating || 0) - (a.rating || 0);
    });
    
    // Calculate distances from center
    const calculateDistance = (place) => {
      if (place.geometry && place.geometry.location && center) {
        // Get coordinates
        const placeLocation = place.geometry.location;
        const lat1 = center.lat();
        const lon1 = center.lng();
        const lat2 = typeof placeLocation.lat === 'function' ? placeLocation.lat() : placeLocation.lat;
        const lon2 = typeof placeLocation.lng === 'function' ? placeLocation.lng() : placeLocation.lng;
        
        // Haversine formula
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
          ...place,
          distance
        };
      }
      return place;
    };
    
    // Add distance information
    filteredResults = filteredResults.map(calculateDistance);
    
    console.log(`Final results: ${filteredResults.length} places`);
    
    return filteredResults;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Clear the search input to avoid confusion
    if (searchBoxRef.current) {
      searchBoxRef.current.value = '';
    }
    
    // Clear search query state
    setSearchQuery('');
    
    // If we previously had a searched location, clear it to avoid confusion
    // This ensures nearby attractions will use the user's actual location
    setSearchedLocation(null);

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Explicitly parse coordinates as numbers to ensure accuracy
        const location = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        };
        
        console.log("Detected user location:", location); // For debugging
        
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

    try {
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

      // Store the original addresses before swapping
      const tempOriginAddress = originAddress || "Your Location";
      const tempDestinationAddress = destinationAddress || (selectedLocation.name || "Destination");

      // Swap the addresses with the stored values
      setOriginAddress(tempDestinationAddress);
      setDestinationAddress(tempOriginAddress);

      // Update user location to the destination
      setUserLocation(originalDestination);

    // Create a new selected location object with the origin coordinates
    const newSelectedLocation = {
      ...selectedLocation,
      geometry: {
        location: {
          lat: originalOrigin.lat,
          lng: originalOrigin.lng
        }
        },
        name: selectedLocation.name // Preserve the name
      };
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
        suppressMarkers: true
    });

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
        title: tempDestinationAddress,
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
        title: tempOriginAddress,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: 999
      });

      markersRef.current = [originMarker, destinationMarker];
      setUserMarker(originMarker);

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

      toast.success('Route swapped successfully!');
    } catch (error) {
      console.error('Error swapping locations:', error);
      toast.error('Failed to update route. Please try again.');
    }
  };

  const getDirections = async (destination) => {
    try {
      // Set directions as active immediately to show the UI
      setDirectionsActive(true);
      
    // First ensure we have user location
    if (!userLocation) {
      toast.info('Getting your current location...');
        
        // When getting directions to an attraction, we want to use the user's actual location
        // NOT the searched location, so we'll get the user's location here
        const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
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
              
              // If we can't get user location, fall back to searched location if available
              if (searchedLocation) {
                toast.info('Using searched location as starting point instead');
                setOriginAddress(searchedLocation.address || "Searched Location");
                resolve({
                  coords: {
                    latitude: searchedLocation.lat,
                    longitude: searchedLocation.lng
                  }
                });
              } else {
                reject(error);
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });
        
        // User location is now available
        const userLocationObj = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        };
        
        console.log("Using user location for directions:", userLocationObj); // For debugging
            
        // Update user marker
            if (userMarker) {
              userMarker.setMap(null);
            }
        
            const newUserMarker = new window.google.maps.Marker({
          position: userLocationObj,
              map: mapInstanceRef.current,
              title: 'Your Location',
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40)
          },
          animation: window.google.maps.Animation.DROP,
          zIndex: 1000
            });
        
            setUserMarker(newUserMarker);
        
        // Get address for the location
        try {
          const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              latlng: `${userLocationObj.lat},${userLocationObj.lng}`,
              key: GOOGLE_MAPS_API_KEY
            }
          });
          if (response.data.results && response.data.results[0]) {
            setOriginAddress(response.data.results[0].formatted_address);
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
        
        // Set the user location state
        setUserLocation(userLocationObj);
        
        // Continue with getting directions using the newly set location
        await calculateAndDisplayRoute(userLocationObj, destination);
      } else {
        // User location already exists, proceed with directions
        console.log("Using existing user location:", userLocation); // For debugging
        await calculateAndDisplayRoute(userLocation, destination);
      }
    } catch (error) {
      console.error('Error in getDirections:', error);
      toast.error('Unable to get directions. Please try again.');
    }
  };
  
  // Helper function to calculate and display the route
  const calculateAndDisplayRoute = async (origin, destination) => {
    if (!origin || !destination) {
      toast.error('Both origin and destination are required for directions');
      return;
    }

    try {
      console.log("Calculating route from:", origin, "to:", destination); // For debugging
      
      // Clear existing directions
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true
      });

      // Ensure coordinates are proper numbers
      const originLatLng = new window.google.maps.LatLng(
        Number(origin.lat), 
        Number(origin.lng)
      );
      
      const destLatLng = new window.google.maps.LatLng(
        Number(destination.lat), 
        Number(destination.lng)
      );
      
      // Get the directions
      const request = {
        origin: originLatLng,
        destination: destLatLng,
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      const result = await directionsServiceRef.current.route(request);
      
      // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

      // Add markers for origin and destination
      const originMarker = new window.google.maps.Marker({
        position: originLatLng,
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
        position: destLatLng,
        map: mapInstanceRef.current,
        title: selectedLocation ? selectedLocation.name : 'Destination',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        },
        zIndex: 999
      });

      markersRef.current = [originMarker, destinationMarker];
      directionsRendererRef.current.setDirections(result);
      setDirections(result);

      // Always get and set the destination address
      try {
        // First try to use the selectedLocation name if available
        if (selectedLocation && selectedLocation.name) {
          setDestinationAddress(selectedLocation.name);
        } else {
          // Otherwise get address from coordinates
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            latlng: `${destination.lat},${destination.lng}`,
            key: GOOGLE_MAPS_API_KEY
          }
        });
        if (response.data.results && response.data.results[0]) {
          setDestinationAddress(response.data.results[0].formatted_address);
          }
        }
      } catch (error) {
        console.error('Error getting destination address:', error);
        // Set a fallback address if we can't get the real one
        setDestinationAddress("Destination");
      }

      // Set route info
      if (result.routes[0] && result.routes[0].legs[0]) {
        setRouteInfo({
          distance: result.routes[0].legs[0].distance.text,
          duration: result.routes[0].legs[0].duration.text
        });
      }

      // Close the modal if it's open to show the full map with directions
      setShowModal(false);
      toast.success('Directions loaded successfully!');
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate directions');
    }
  };

  const renderPlaceDetails = () => {
    if (!selectedLocation) return null;

    // Get multiple photos if available
    const photos = selectedLocation.photos || [];
    
    // Format operating hours for better display
    const formatOpeningHours = () => {
      if (!selectedLocation.opening_hours) return null;
      
      const isOpenNow = selectedLocation.opening_hours.isOpen ? 
        selectedLocation.opening_hours.isOpen() : null;

    return (
        <div className="modal-hours-container">
          <div className={`open-status ${isOpenNow ? 'open' : 'closed'}`}>
            {isOpenNow ? 'Open Now' : 'Closed'}
          </div>
          {selectedLocation.opening_hours.weekday_text && (
            <div className="hours-list">
              {selectedLocation.opening_hours.weekday_text.map((text, index) => (
                <div key={index} className="hour-item">
                  {text.split(': ')[0]}: <span>{text.split(': ')[1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    // Function to render star rating with half stars
    const renderStarRating = (rating) => {
      if (!rating) return null;
      
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

      return (
        <div className="star-rating-display">
          {[...Array(fullStars)].map((_, i) => (
            <span key={`full-${i}`} className="star-full">★</span>
          ))}
          {halfStar && <span className="star-half">★</span>}
          {[...Array(emptyStars)].map((_, i) => (
            <span key={`empty-${i}`} className="star-empty">☆</span>
          ))}
          <span className="rating-number">{rating.toFixed(1)}</span>
        </div>
      );
    };

    // Format price level to dollar signs
    const renderPriceLevel = () => {
      if (!selectedLocation.price_level) return null;
      
      const priceLabels = {
        1: 'Inexpensive',
        2: 'Moderate',
        3: 'Expensive',
        4: 'Very Expensive'
      };
      
      return (
        <div className="price-level-display">
          <span className="price-symbols">{'$'.repeat(selectedLocation.price_level)}</span>
          <span className="price-label">• {priceLabels[selectedLocation.price_level]}</span>
        </div>
      );
    };

    return (
      <div className="location-modal">
        <div className="modal-content">
        <button 
            className="close-modal-btn"
          onClick={() => {
            setShowModal(false);
            setSelectedLocation(null);
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setMap(null);
            }
          }}
        >
            <span>×</span>
        </button>
          
          <div className="modal-gallery">
            {photos.length > 0 ? (
              <div className="photo-gallery">
                <img 
                  src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`}
                alt={selectedLocation.name}
                  className="main-photo"
                />
                {photos.length > 1 && (
                  <div className="photo-thumbnails">
                    {photos.slice(1, 4).map((photo, index) => (
                      <img 
                        key={index}
                        src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`}
                        alt={`${selectedLocation.name} ${index + 1}`}
                        className="photo-thumbnail"
                      />
                    ))}
                    {photos.length > 4 && (
                      <div className="more-photos">
                        <span>+{photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-photo">
                <div className="no-photo-content">
                  <span className="no-photo-icon">📷</span>
                  <span>No Photos Available</span>
                </div>
              </div>
            )}
          </div>
        
          <div className="modal-details-container">
            <div className="modal-header">
              <h1 className="location-name">{selectedLocation.name}</h1>
              
              <div className="rating-container">
                {renderStarRating(selectedLocation.rating)}
                
                {selectedLocation.user_ratings_total && (
                  <div className="review-count">
                    {selectedLocation.user_ratings_total.toLocaleString()} reviews
              </div>
            )}

                {renderPriceLevel()}
              </div>
              
              <div className="location-type">
                {selectedLocation.types && selectedLocation.types[0] && (
                  <div className="type-badge">
                    {selectedLocation.types[0].split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
              </div>
            )}
              </div>
            </div>
            
            <div className="location-address">
              <div className="address-icon">📍</div>
              <div className="address-text">{selectedLocation.formatted_address || selectedLocation.vicinity}</div>
              </div>
            
            <div className="modal-actions">
              <button 
                className="action-button get-directions"
                onClick={() => {
                  if (selectedLocation.geometry && selectedLocation.geometry.location) {
                    const location = selectedLocation.geometry.location;
                    
                    // Update destination address immediately 
                    setDestinationAddress(selectedLocation.name || selectedLocation.vicinity || "Destination");
                    
                    getDirections({
                      lat: typeof location.lat === 'function' ? location.lat() : location.lat,
                      lng: typeof location.lng === 'function' ? location.lng() : location.lng
                    });
                  }
                }}
              >
                <span className="action-icon">🗺️</span>
                <span>Get Directions</span>
              </button>
              
              {selectedLocation.website && (
                <a 
                  href={selectedLocation.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button visit-website"
                >
                  <span className="action-icon">🌐</span>
                  <span>Visit Website</span>
                </a>
            )}

            {selectedLocation.formatted_phone_number && (
                <a 
                  href={`tel:${selectedLocation.formatted_phone_number}`}
                  className="action-button call"
                >
                  <span className="action-icon">📞</span>
                  <span>Call</span>
                </a>
              )}

              {selectedLocation.url && (
                <a 
                  href={selectedLocation.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button view-on-google"
                >
                  <span className="action-icon">G</span>
                  <span>View on Google</span>
                </a>
              )}
            </div>
            
            <div className="features-grid">
              {selectedLocation.opening_hours && (
                <div className="feature-item hours">
                  <h3>Hours</h3>
                  {formatOpeningHours()}
              </div>
            )}

              {selectedLocation.editorial_summary && (
                <div className="feature-item description">
                  <h3>About</h3>
                  <p>{selectedLocation.editorial_summary.overview}</p>
                </div>
              )}
              
              {selectedLocation.types && selectedLocation.types.length > 0 && (
                <div className="feature-item categories">
                  <h3>Categories</h3>
                  <div className="categories-container">
                    {selectedLocation.types.slice(0, 5).map((type, index) => (
                      type !== 'establishment' && (
                        <span key={index} className="category-tag">
                          {type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      )
                    ))}
                  </div>
              </div>
            )}

            {selectedLocation.wheelchair_accessible_entrance && (
                <div className="feature-item accessibility">
                  <h3>Accessibility</h3>
                  <div className="accessibility-container">
                    <span className="accessibility-tag">
                      <span className="wheelchair-icon">♿</span> 
                      Wheelchair Accessible
                    </span>
                  </div>
              </div>
            )}
            </div>

            {selectedLocation.reviews && selectedLocation.reviews.length > 0 && (
              <div className="reviews-section">
                <h3>Reviews</h3>
                <div className="reviews-container">
                  {selectedLocation.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <div className="reviewer-name">{review.author_name}</div>
                          <div className="review-date">
                            {new Date(review.time * 1000).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                      </div>
                        </div>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'filled' : 'empty'}>
                              {i < review.rating ? '★' : '☆'}
                      </span>
                          ))}
                        </div>
                      </div>
                      <div className="review-text">{review.text}</div>
                    </div>
                  ))}
                </div>
                {selectedLocation.reviews.length > 3 && (
                  <a 
                    href={selectedLocation.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="more-reviews-link"
                  >
                    See all {selectedLocation.reviews.length} reviews on Google
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add the handleDirectionsClick function
  const handleDirectionsClick = (place) => {
    if (place && place.geometry && place.geometry.location) {
      const location = place.geometry.location;
      
      // Add a toast message to clearly indicate we're using the user's location
      toast.info('Getting directions from your current location...', { autoClose: 2000 });
      
      // Update the destination address immediately to provide immediate feedback to the user
      setDestinationAddress(place.name || place.vicinity || "Destination");
      setSelectedLocation(place);
      
                  getDirections({
                    lat: typeof location.lat === 'function' ? location.lat() : location.lat,
                    lng: typeof location.lng === 'function' ? location.lng() : location.lng
                  });
                }
  };

  // Add a function to clear the search
  const clearSearch = () => {
    if (searchBoxRef.current) {
      searchBoxRef.current.value = '';
    }
    setSearchQuery('');
    setSearchedLocation(null);
    
    // If we have user location, center the map on it
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(15);
      toast.info('Search cleared. Using your current location.');
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

      <div className="main-container59">
        <div className="heading59">
          <h1 className="title-heading59">Explore Map Management</h1>
          <p className="title-para59">Manage and Recommend Locations in Nepal</p>
        </div>

        

        <div className="top-search-bar59">
          <div className="search-info59">
            <h2>Explore Nepal</h2>
            <p>Discover amazing places</p>
          </div>

          {/* Only show direction inputs when directions are active */}
        {directionsActive && (
          <div className="direction-inputs59">
            <div className="input-group59">
              <span className="input-label59">A</span>
              <input
                type="text"
                value={originAddress || "Your Location"}
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
                value={destinationAddress || (selectedLocation ? selectedLocation.name : "Destination")}
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
        )}
          
          <div className="search-box59">
            <div className="search-input-container">
              <input
                ref={searchBoxRef}
                type="text"
                placeholder="Search for a place"
                className="search-input59"
              />
              {searchBoxRef.current && searchBoxRef.current.value && (
                <button 
                  className="clear-search-btn"
                  onClick={clearSearch}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              className="navigate-btn59"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              <span>📍</span> {userLocation ? 'Update Location' : 'Navigate Me'}
            </button>
            <button 
              className="nearby-btn59"
              onClick={searchNearbyAttractions}
              disabled={loading || (!userLocation && !searchedLocation)}
              title={(!userLocation && !searchedLocation) 
                ? "First click 'Navigate Me' or search for a location" 
                : `Find attractions near ${userLocation ? 'your location' : 'the searched location'}`}
            >
              <span>🎯</span> Nearby Attractions
            </button>
          </div>
          {!userLocation && !searchedLocation && (
            <div className="location-hint" style={{ 
              textAlign: 'center', 
              marginTop: '10px', 
              color: '#666', 
              fontSize: '0.9rem',
              fontStyle: 'italic'
            }}>
              First use "Navigate Me" or search for a location, then explore nearby attractions
            </div>
          )}
          {searchedLocation && !userLocation && (
            <div className="location-hint" style={{ 
              textAlign: 'center', 
              marginTop: '10px', 
              color: '#008000', 
              fontSize: '0.9rem'
            }}>
              You can now click "Nearby Attractions" to explore places near your searched location
            </div>
          )}
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
