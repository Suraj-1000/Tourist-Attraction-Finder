import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Map.css";
import axios from "axios";
import Header from "../../../components/Admin Header/Admin-Header";
import Footer from "../../../components/Footer/AuthFooter";

// API Key
// This is a demo API key that may have restrictions. Replace with your own unrestricted API key
const GOMAPS_API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';
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

// LocationCard component with reviews instead of directions
const LocationCard = React.memo(({ place, onClick, isSelected }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(DEFAULT_PLACE_PHOTO);

  useEffect(() => {
    const loadPlacePhoto = async () => {
      if (place.photos && place.photos.length > 0 && place.photos[0].photo_reference) {
        try {
          // Use direct URL with key for Google Places photos
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOMAPS_API_KEY}`;
          
          // Set image URL directly
          setImageUrl(photoUrl);
          console.log("Loading photo for:", place.name, "Reference:", place.photos[0].photo_reference.substring(0, 10) + "...");
          setImageLoaded(true);
          setImageError(false);
        } catch (error) {
          console.error('Error loading place photo:', error);
          setImageError(true);
          setImageUrl(DEFAULT_PLACE_PHOTO);
          setImageLoaded(true);
        }
      } else {
        // Set default image if no photos available
        console.log("No photos for:", place.name);
        setImageUrl(DEFAULT_PLACE_PHOTO);
        setImageLoaded(true);
      }
    };

    loadPlacePhoto();
  }, [place.place_id]); // Dependency on place_id instead of photos

  const handleImageError = () => {
    console.log("Image error for:", place.name);
    setImageError(true);
    setImageUrl(DEFAULT_PLACE_PHOTO);
    setImageLoaded(true); // Mark as loaded even though it's using default
  };

  // Format place type for display
  const formatPlaceType = (type) => {
    if (!type) return '';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get the primary place type
  const getPrimaryType = (types) => {
    if (!types || types.length === 0) return '';
    
    // Priority order for display
    const priorityTypes = [
      'tourist_attraction', 'natural_feature', 'point_of_interest', 
      'hindu_temple', 'buddhist_temple', 'place_of_worship',
      'museum', 'art_gallery', 'landmark', 'park',
      'lodging', 'hotel', 'resort'
    ];
    
    // Find the first matching priority type
    for (const priorityType of priorityTypes) {
      if (types.includes(priorityType)) {
        return formatPlaceType(priorityType);
      }
    }
    
    // If no priority type found, use the first one
    return formatPlaceType(types[0]);
  };

  // Render star rating with filled and empty stars
  const renderStarRating = (rating) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
      <div className="star-rating">
        {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="star-full">★</span>)}
        {halfStar && <span className="star-half">★</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="star-empty">☆</span>)}
       
      </div>
    );
  };

  return (
    <div 
      id={`place-card-${place.place_id}`}
      className={`location-card35 ${isSelected ? 'selected-card' : ''}`}
      onClick={onClick}
    >
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
        {place.rating && (
          <div className="rating-badge-overlay">
            <span>{place.rating.toFixed(1)}</span>
            <span className="star35">⭐</span>
      </div>
              )}
            </div>
      <div className="location-details35">
        <div className="location-header35">
          <div className="title-rating35">
            <h3 title={place.name}>{place.name}</h3>
            {renderStarRating(place.rating)}
          </div>
          <div className="property-type35">
            {getPrimaryType(place.types)}
            </div>
        </div>
        
        <p className="description35" title={place.vicinity}>{place.vicinity}</p>
        
        <div className="reviews-info">
          {place.user_ratings_total ? (
            <span className="review-count35">
              {place.user_ratings_total.toLocaleString()} reviews
              </span>
          ) : (
            <span className="no-reviews">No reviews yet</span>
          )}
          {place.price_level && (
            <span className="price-level">
              {'$'.repeat(place.price_level)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function MapPage() {
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
  const placesServiceRef = useRef(null);
  const lastSearchRef = useRef({ center: null, filter: null });
  const isSearchingRef = useRef(false);
  const mapBoundsRef = useRef(null);

  // Function to check if a place is within current map bounds
  const isPlaceInMapBounds = (place) => {
    if (!mapBoundsRef.current || !place.geometry || !place.geometry.location) {
      return true; // If we can't determine, include it
    }
    
    return mapBoundsRef.current.contains(place.geometry.location);
  };

  // Function to initialize map
  const initializeMap = () => {
    try {
      // Initialize map centered on Nepal using Google Maps
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 27.7172, lng: 85.3240 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

      // Initialize PlacesService with the map
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);

      // Set initial bounds
      mapBoundsRef.current = map.getBounds();

      // Setup search box with Google Places Autocomplete
        const input = searchBoxRef.current;
        if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: "np" },
          fields: ["geometry", "name", "vicinity"],
        });
        
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(16);
            searchNearbyPlacesWithPlacesService();
          }
        });
        }

        // Add listener for map dragend event
        map.addListener('dragend', () => {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
        // Update bounds
        mapBoundsRef.current = map.getBounds();
        
          searchTimeoutRef.current = setTimeout(() => {
          searchNearbyPlacesWithPlacesService();
        }, 1000); // Increased debounce to 1000ms
        });

        // Add listener for zoom_changed event
        map.addListener('zoom_changed', () => {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
        // Update bounds
        mapBoundsRef.current = map.getBounds();
        
          searchTimeoutRef.current = setTimeout(() => {
          searchNearbyPlacesWithPlacesService();
        }, 1000); // Increased debounce to 1000ms
      });

      // Add listener for bounds_changed
      map.addListener('bounds_changed', () => {
        mapBoundsRef.current = map.getBounds();
        
        // If we have places, filter them based on current bounds
        if (places.length > 0 && !isSearchingRef.current) {
          // Filter existing places to show only those in bounds
          const visiblePlaces = places.filter(place => 
            isPlaceInMapBounds(place)
          );
          
          // Update visible markers
          markersRef.current.forEach(marker => {
            if (marker && marker.getMap()) {
              const isVisible = mapBoundsRef.current.contains(marker.getPosition());
              marker.setVisible(isVisible);
            }
          });
        }
        });

        setMapLoaded(true);
      
      // Wait a moment before searching to ensure the map is fully initialized
      setTimeout(() => {
        searchNearbyPlacesWithPlacesService();
      }, 1500);

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please try refreshing the page.');
    }
  };
  
  // Define global callback before loading script
  useEffect(() => {
    // Set up global initMap function before the script loads
    window.initMap = initializeMap;
    
    return () => {
      // Clean up
      delete window.initMap;
    };
  }, []);

  useEffect(() => {
    let mapInitTimer;

    const loadGoMapsScript = () => {
      if (scriptLoadedRef.current) return;
      
      // Remove any existing scripts
      const existingScripts = document.querySelectorAll('script[src*="googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOMAPS_API_KEY}&libraries=places&v=3&callback=initMap`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("Google Maps script loaded successfully");
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
    };
  }, []);

  // Add CSS to prevent horizontal scrolling
  useEffect(() => {
    // Add inline styles to prevent horizontal scrolling
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    
    // Clean up on unmount
    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  // Function to get appropriate place types based on filter
  const getPlaceTypesByFilter = (filter) => {
    console.log(`Getting place types for filter: ${filter}`);
    
    // Create a mapping of filter types to place types for more comprehensive searches
    const filterToTypes = {
      'popular': ['tourist_attraction', 'landmark', 'point_of_interest', 'museum', 'natural_feature'],
      'cultural': ['museum', 'art_gallery', 'place_of_worship', 'hindu_temple', 'buddhist_temple', 'monument'],
      'adventure': ['campground', 'park', 'hiking_area', 'natural_feature', 'mountain', 'geographic_feature'],
      'nature': ['natural_feature', 'park', 'lake', 'river', 'mountain', 'zoo', 'aquarium', 'forest', 'beach'],
      'temples': ['hindu_temple', 'buddhist_temple', 'church', 'mosque', 'place_of_worship', 'shrine'],
      'heritage': ['landmark', 'monument', 'archaeological_site', 'historic_site', 'point_of_interest', 'castle'],
      'hotels': ['lodging', 'hotel', 'resort', 'guest_house', 'motel', 'hostel', 'inn'],
      'durbar': ['tourist_attraction', 'landmark', 'point_of_interest', 'museum', 'palace', 'monument'],
      'parks': ['park', 'zoo', 'city_park', 'natural_feature', 'lake', 'garden', 'amusement_park', 'theme_park'],
      'all': ['tourist_attraction', 'point_of_interest', 'landmark', 'natural_feature', 'lodging']
    };
    
    // Return the appropriate types for the selected filter or default to 'all'
    return filterToTypes[filter] || filterToTypes['all'];
  };

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

  // Handle search input changes
  const handleSearchInput = async (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (!query) return;

    try {
      // Geocode the search query
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
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

  // Add inline CSS for back button
  const backButtonStyle = {
    backgroundColor: '#008000',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 15px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  };

  // Add more comprehensive types and keywords for better detection
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
  const HOTEL_KEYWORDS = [
    'hotel', 'resort', 'lodge', 'inn', 'suites', 'plaza', 'stay', 'residency',
    'hyatt', 'radisson', 'marriott', 'hilton', 'dwarika', 'yak', 'yeti', 'soaltee',
    'crowne', 'annapurna', 'everest', 'malla', 'shangri-la', 'aloft', 'fairfield',
    'deluxe', 'luxury', 'grand', 'royal', 'regency', 'international', 'palace', 
    'ambassador', 'tibet', 'heritage', 'boutique', 'gokarna', 'mulberry', 'shanker', 
    'summit', 'singi', 'shambala', 'manaslu', 'pagoda', 'thamel', 'moonlight', 'oasis'
  ];

  // Add specific parks in Nepal
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

  // Use direct searches for each filter to ensure results match the filter
  const searchNearbyPlacesWithPlacesService = () => {
    if (!mapInstanceRef.current || !window.google || !placesServiceRef.current) {
      console.error('Map or Google API not initialized');
      return;
    }

    // Don't run if already searching
    if (isSearchingRef.current) {
      return;
    }
    
    const map = mapInstanceRef.current;
    const center = map.getCenter();
    
    if (!center) {
      console.warn('Map not ready yet');
      return;
    }

    // Check if we've already searched this area with this filter
    const centerLat = center.lat().toFixed(4);
    const centerLng = center.lng().toFixed(4);
    const currentSearch = { center: `${centerLat},${centerLng}`, filter: activeFilter };
    
    if (lastSearchRef.current.center === currentSearch.center && 
        lastSearchRef.current.filter === currentSearch.filter) {
      return; // Skip duplicate searches
    }
    
    // Update last search
    lastSearchRef.current = currentSearch;
    
    setLoading(true);
    isSearchingRef.current = true;
    
    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Update bounds
      mapBoundsRef.current = map.getBounds();
      
      // Get the service from the ref
      const placesService = placesServiceRef.current;
      
      // Define search configuration for each filter type
      let searchConfigs = [];
      let allResults = [];
      
      // Add search query if provided by user
      const userQuery = searchQuery ? searchQuery.trim() : '';
      
      // Configure searches based on active filter
      switch(activeFilter) {
        case 'hotels':
          searchConfigs = [
            { type: 'lodging', keyword: userQuery || 'luxury hotel nepal', radius: 10000 },
            { type: 'lodging', keyword: '5 star hotel nepal', radius: 10000 },
            { type: 'lodging', keyword: '4 star hotel nepal', radius: 10000 },
            { type: 'lodging', keyword: '3 star hotel nepal', radius: 10000 },
            { type: 'lodging', keyword: 'best hotel kathmandu', radius: 10000 },
            { type: 'lodging', keyword: 'luxury resort nepal', radius: 10000 },
            // Add specific searches for Hilton
            { keyword: 'hilton kathmandu', radius: 25000 },
            { keyword: 'double tree hilton', radius: 25000 },
            // Add specific searches for Marriott
            { keyword: 'marriott kathmandu', radius: 25000 },
            { keyword: 'kathmandu marriott', radius: 25000 },
            { keyword: 'fairfield marriott', radius: 25000 },
            // Add other major hotels with higher radius for better discovery
            { keyword: 'yak and yeti hotel', radius: 25000 },
            { keyword: 'dwarika hotel', radius: 25000 },
            { keyword: 'hyatt regency kathmandu', radius: 25000 },
            { keyword: 'radisson hotel kathmandu', radius: 25000 },
            { keyword: 'soaltee hotel', radius: 25000 },
            { keyword: 'crowne plaza nepal', radius: 25000 },
            { keyword: 'annapurna hotel', radius: 25000 },
            { keyword: 'shangri-la hotel', radius: 25000 },
            { keyword: 'aloft kathmandu', radius: 25000 },
            { keyword: 'gokarna forest resort', radius: 25000 },
            { keyword: 'hotel mulberry', radius: 25000 },
            { keyword: 'hotel shanker', radius: 25000 },
            { keyword: 'summit hotel', radius: 25000 },
            { keyword: 'hotel tibet', radius: 25000 },
            { keyword: 'royal singi hotel', radius: 25000 },
          ];
          break;
          
        case 'parks':
          searchConfigs = [
            { type: 'park', radius: 15000 },
            { type: 'zoo', radius: 15000 },
            { type: 'amusement_park', radius: 25000 },
            { type: 'city_park', radius: 15000 },
            { type: 'natural_feature', keyword: 'park', radius: 15000 },
            { keyword: 'central zoo nepal', radius: 25000 },
            { keyword: 'botanical garden nepal', radius: 25000 },
            { keyword: 'garden of dreams', radius: 25000 },
            { keyword: 'godavari botanical garden', radius: 25000 },
            { keyword: 'shivapuri national park', radius: 25000 },
            { keyword: 'national park nepal', radius: 25000 },
            { keyword: 'park kathmandu', radius: 15000 },
            { keyword: 'fun park kathmandu', radius: 25000 },
            { keyword: 'amusement park nepal', radius: 25000 },
            { keyword: 'water park nepal', radius: 25000 },
            { keyword: 'theme park nepal', radius: 25000 },
            { keyword: 'children park nepal', radius: 25000 },
            { keyword: 'playground kathmandu', radius: 25000 },
            { keyword: 'water fun', radius: 25000 },
            { keyword: 'whoopee land', radius: 25000 },
            { keyword: 'fun valley', radius: 25000 },
            { keyword: 'lake kathmandu', radius: 15000 },
            { keyword: 'pokhari nepal', radius: 15000 },
            { keyword: 'rani pokhari', radius: 25000 },
            { keyword: 'kamal pokhari', radius: 25000 },
            { keyword: 'nag pokhari', radius: 25000 },
            { keyword: 'balaju water garden', radius: 25000 },
            { keyword: 'taudaha lake', radius: 25000 },
            { keyword: 'bhrikuti mandap', radius: 25000 },
            { keyword: 'ratna park', radius: 25000 },
            { keyword: 'pashupati area', radius: 15000 },
          ];
          break;
          
        case 'nature':
          searchConfigs = [
            { type: 'natural_feature', radius: 15000 },
            { type: 'park', radius: 15000 },
            { type: 'lake', radius: 15000 },
            { type: 'campground', radius: 15000 },
            { keyword: 'lake nepal', radius: 15000 },
            { keyword: 'botanical garden', radius: 15000 },
            { keyword: 'national park nepal', radius: 25000 },
            { keyword: 'conservation area', radius: 25000 },
            { keyword: 'wildlife reserve', radius: 25000 },
            { keyword: 'sanctuary nepal', radius: 25000 },
            { keyword: 'mountain view', radius: 15000 },
            { keyword: 'hill station nepal', radius: 15000 },
            { keyword: 'nagarkot', radius: 15000 },
            { keyword: 'pokhari', radius: 15000 },
            { keyword: 'rani pokhari kathmandu', radius: 25000 },
            { keyword: 'gosainkunda', radius: 25000 },
            { keyword: 'taudaha lake', radius: 25000 },
            { keyword: 'indra daha', radius: 25000 },
            { keyword: 'nagdaha', radius: 25000 },
            { keyword: 'phewa lake', radius: 25000 },
            { keyword: 'nature nepal', radius: 15000 },
            { keyword: 'waterfall nepal', radius: 15000 },
          ];
          break;
          
        case 'popular':
          searchConfigs = [
            { type: 'tourist_attraction', radius: 10000 },
            { type: 'point_of_interest', radius: 8000 },
            { keyword: 'tourist spot kathmandu', radius: 10000 },
            { keyword: 'must visit nepal', radius: 10000 },
            { keyword: 'famous place kathmandu', radius: 10000 },
            { keyword: 'dharahara', radius: 25000 },
            { keyword: 'view tower nepal', radius: 25000 },
            { keyword: 'bhimsen tower', radius: 25000 },
          ];
          break;
          
        case 'durbar':
          searchConfigs = [
            { keyword: 'durbar square', radius: 15000 },
            { keyword: 'patan durbar', radius: 15000 },
            { keyword: 'bhaktapur durbar', radius: 15000 },
            { keyword: 'kathmandu durbar', radius: 15000 },
            { keyword: 'hanuman dhoka', radius: 15000 },
            { keyword: 'basantapur', radius: 15000 },
          ];
          break;
          
        case 'temples':
          searchConfigs = [
            { type: 'hindu_temple', radius: 10000 },
            { type: 'buddhist_temple', radius: 10000 },
            { type: 'place_of_worship', radius: 8000 },
            { keyword: 'temple kathmandu', radius: 10000 },
            { keyword: 'pashupatinath', radius: 15000 },
            { keyword: 'swayambhunath', radius: 15000 },
            { keyword: 'boudhanath', radius: 15000 },
            { keyword: 'mandir', radius: 10000 },
          ];
          break;
          
        case 'cultural':
          searchConfigs = [
            { type: 'museum', radius: 10000 },
            { type: 'art_gallery', radius: 10000 },
            { type: 'place_of_worship', radius: 8000 },
            { keyword: 'cultural heritage', radius: 10000 },
            { keyword: 'museum nepal', radius: 10000 },
          ];
          break;
          
        case 'adventure':
          searchConfigs = [
            { type: 'campground', radius: 15000 },
            { type: 'natural_feature', radius: 15000 },
            { keyword: 'hiking nepal', radius: 15000 },
            { keyword: 'adventure nepal', radius: 15000 },
            { keyword: 'trekking nepal', radius: 15000 },
          ];
          break;
          
        default: // All
          searchConfigs = [
            { type: 'tourist_attraction', radius: 8000 },
            { type: 'point_of_interest', radius: 8000 },
            { keyword: 'tourist place nepal', radius: 8000 },
            { keyword: 'tower nepal', radius: 25000 },
            { keyword: 'dharahara', radius: 25000 },
            { keyword: 'pokhari kathmandu', radius: 25000 },
            { keyword: 'rani pokhari', radius: 25000 },
            { type: 'lodging', keyword: 'luxury hotel nepal', radius: 10000 },
            { keyword: 'hilton kathmandu', radius: 25000 },
            { keyword: 'marriott kathmandu', radius: 25000 },
            { type: 'park', radius: 15000 },
            { keyword: 'fun park', radius: 25000 },
            { keyword: 'zoo nepal', radius: 25000 },
          ];
          // Add user query if provided
          if (userQuery) {
            searchConfigs.push({ keyword: userQuery, radius: 10000 });
          }
      }
      
      // Add user query to all searches if provided
      if (userQuery && activeFilter !== 'all') {
        searchConfigs.push({ keyword: userQuery, radius: 10000 });
      }
      
      // Count total searches to track completion
      const totalSearches = searchConfigs.length;
      let searchesCompleted = 0;
      
      // Function to process results when all searches complete
      const processSearchResults = () => {
        const filteredResults = processAllResults(allResults, center);
        setPlaces(filteredResults);
        
        // Add markers for each place
        filteredResults.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            const marker = createMarker(place, map);
            if (marker) {
              markersRef.current.push(marker);
            }
          }
        });
        
        setLoading(false);
        isSearchingRef.current = false;
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
            const preFilteredResults = results.filter(place => {
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
                const educationalTerms = ['school', 'college', 'university', 'academy', 'institute', 'campus',
                  'kindergarten', 'education', 'educational', 'preschool', 'polytechnic',
                  'vidyalaya', 'pathshala', 'shiksha', 'vidya'];
                if (educationalTerms.some(term => name.includes(term))) {
                  return false;
                }
              }
              
              return true;
            });
            
            // Filter results to match the current filter if no specific type/keyword was given
            if (!config.type && !config.keyword && activeFilter !== 'all') {
              const filterTypes = getPlaceTypesByFilter(activeFilter);
              const filteredResults = preFilteredResults.filter(place => {
                if (!place.types || place.types.length === 0) return false;
                return place.types.some(type => filterTypes.includes(type));
              });
              console.log(`Filtered from ${results.length} to ${filteredResults.length} for ${activeFilter}`);
              allResults = [...allResults, ...filteredResults];
            } else {
              allResults = [...allResults, ...preFilteredResults];
            }
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
      console.error('Error in searchNearbyPlaces:', error);
      setPlaces([]);
      setLoading(false);
      isSearchingRef.current = false;
    }
  };

  // Replace the original search function with the Places API version
  const searchNearbyPlaces = searchNearbyPlacesWithPlacesService;

  // Modified createMarker to handle potential errors
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
      
      // Log when we create a marker for a major hotel
      if (isSpecificHotel) {
        console.log("Creating marker for specific hotel:", place.name);
      }
      
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
      markersRef.current.forEach(m => {
        if (m.infoWindow) m.infoWindow.close();
      });
      
      infoWindow.open(map, marker);
        handleMarkerClick(place);
    });

    marker.infoWindow = infoWindow;
    return marker;
    } catch (error) {
      console.error('Error creating marker:', error);
      return null;
    }
  };

  const getPlacePhotoUrl = (place) => {
    if (place.photos && place.photos.length > 0 && place.photos[0].photo_reference) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOMAPS_API_KEY}`;
    }
    return DEFAULT_PLACE_PHOTO;
  };

  const handleCardClick = (place) => {
    if (!place || !place.geometry || !place.geometry.location) return;
    
    setSelectedLocation(place);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(place.geometry.location);
      mapInstanceRef.current.setZoom(16);
      
      // Find and activate the marker for this place
      const marker = markersRef.current.find(m => 
        m.getTitle() === place.name && 
        m.getPosition().equals(place.geometry.location)
      );
      
      if (marker && marker.infoWindow) {
        // Close any open info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        // Open this marker's info window
        marker.infoWindow.open(mapInstanceRef.current, marker);
      }
    }
  };

  const handleMarkerClick = (place) => {
    if (!place) return;
    
    setSelectedLocation(place);
    
    // Scroll to the card in the results container
    const placeCard = document.getElementById(`place-card-${place.place_id}`);
    if (placeCard) {
      placeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      placeCard.classList.add('highlight-card');
      
      // Remove highlight after a short delay
      setTimeout(() => {
        placeCard.classList.remove('highlight-card');
      }, 2000);
    }
  };

  // Modify the filters to include Parks category
  const filters = [
    { id: "all", label: "All" },
    { id: "popular", label: "Popular" },
    { id: "cultural", label: "Cultural" },
    { id: "temples", label: "Temples" },
    { id: "heritage", label: "Heritage" },
    { id: "durbar", label: "Durbar" },
    { id: "parks", label: "Parks" },
    { id: "adventure", label: "Adventure" },
    { id: "nature", label: "Nature" },
    { id: "hotels", label: "Hotels" }
  ];

  // Calculate distances for places
  const calculateDistances = (places, center) => {
    return places.map(place => {
      if (place.geometry && place.geometry.location && center) {
        // Calculate distance in kilometers
        const placeLocation = place.geometry.location;
        const lat1 = center.lat();
        const lon1 = center.lng();
        const lat2 = placeLocation.lat();
        const lon2 = placeLocation.lng();
        
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
    });
  };

  // Improve processAllResults for better place detection
  const processAllResults = (allResults, center) => {
    console.log("Processing total of", allResults.length, "results");
    
    // Remove duplicates based on place_id
    const uniqueResults = Array.from(
      new Map(allResults.map(place => [place.place_id, place])).values()
    );
    
    console.log("After removing duplicates:", uniqueResults.length, "unique places");
    
    // Get the relevant types for the active filter
    const activeFilterTypes = getPlaceTypesByFilter(activeFilter);
    
    // Log specific hotels found
    uniqueResults.forEach(place => {
      const name = (place.name || '').toLowerCase();
      if (SPECIFIC_HOTELS.some(hotel => name.includes(hotel.toLowerCase()))) {
        console.log("Found in results:", place.name);
      }
    });
    
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
        'vidyalaya', 'pathshala', 'shiksha', 'vidya', 'boarding', 'higher secondary'
      ];
      return educationalTerms.some(term => name.includes(term));
    };
    
    // Check if a place has any types that match the active filter
    const matchesActiveFilterTypes = (place) => {
      if (!place.types || place.types.length === 0) return false;
      return place.types.some(type => activeFilterTypes.includes(type));
    };
    
    // Filter out unwanted place types and apply special handling based on active filter
    let filteredResults = uniqueResults.filter(place => {
      // Always include specific hotels
      const name = (place.name || '').toLowerCase();
      const vicinity = (place.vicinity || '').toLowerCase();
      
      if (SPECIFIC_HOTELS.some(hotel => name.includes(hotel.toLowerCase().split(' ')[0]))) {
        console.log("Including specific hotel in results:", place.name);
        return true;
      }
      
      // Check if it's an educational institution by name
      if (isEducationalByName(place)) {
        console.log("Excluding educational institution:", place.name);
        return false;
      }
      
      // Debug logging
      if (place.types && place.types.includes('lodging') && place.rating >= 3.0) {
        console.log("Found hotel:", place.name, "Rating:", place.rating);
      }
      
      if (PARK_KEYWORDS.some(term => (place.name || '').toLowerCase().includes(term))) {
        console.log("Found park/lake by name:", place.name);
      }
      
      // For hotels filter, include all hotels with rating >= 3.0
      if (activeFilter === 'hotels' && hasSpecialType(HOTEL_TYPES, place) && place.rating >= 3.0) {
        return true;
      }
      
      // For parks filter, include all places that match park criteria
      if (activeFilter === 'parks' && (
        hasSpecialType(PARK_TYPES, place) || 
        nameContains(PARK_KEYWORDS, place) || 
        vicinityContains(PARK_KEYWORDS, place)
      )) {
        return true;
      }

      // For temples filter, prioritize religious places
      if (activeFilter === 'temples' && (
        place.types && (
          place.types.includes('hindu_temple') || 
          place.types.includes('buddhist_temple') || 
          place.types.includes('place_of_worship')
        )
      )) {
        return true;
      }

      // For durbar filter, prioritize historical places and palaces
      if (activeFilter === 'durbar' && (
        name.includes('durbar') || 
        vicinity.includes('durbar') || 
        name.includes('palace') || 
        name.includes('hanuman') || 
        name.includes('basantapur')
      )) {
        return true;
      }
      
      // Give priority to places that match the current filter
      if (matchesActiveFilterTypes(place)) {
        return true;
      }
      
      // Keep places with higher ratings in general
      if (place.rating >= 4.0) return true;
      
      // Keep hotels with ratings 3 stars and above
      if (hasSpecialType(HOTEL_TYPES, place) && place.rating >= 3.0) {
        return true;
      }
      
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
      
      // Hotels anywhere should have good ratings - but lower the threshold to 3.0
      if (hasSpecialType(HOTEL_TYPES, place) && place.rating < 3.0) {
        return false;
      }
      
      // For all filter, be more selective
      if (activeFilter === 'all' && (!place.photos || !place.rating)) {
        return false;
      }
      
      return true;
    });
    
    // Sort results with filter-specific places first, then by rating
    filteredResults = filteredResults.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      
      // Check if these are specific hotels
      const aIsSpecificHotel = SPECIFIC_HOTELS.some(hotel => aName.includes(hotel.toLowerCase().split(' ')[0]));
      const bIsSpecificHotel = SPECIFIC_HOTELS.some(hotel => bName.includes(hotel.toLowerCase().split(' ')[0]));
      
      // Prioritize specific hotels over others
      if (aIsSpecificHotel && !bIsSpecificHotel) return -1;
      if (!aIsSpecificHotel && bIsSpecificHotel) return 1;
      
      // Then check if places match the current filter exactly
      const aMatchesFilterTypes = matchesActiveFilterTypes(a);
      const bMatchesFilterTypes = matchesActiveFilterTypes(b);
      
      if (aMatchesFilterTypes && !bMatchesFilterTypes) return -1;
      if (!aMatchesFilterTypes && bMatchesFilterTypes) return 1;
      
      // Then check if places match the active filter using custom logic
      const aMatchesFilter = matchesActiveFilter(a, activeFilter);
      const bMatchesFilter = matchesActiveFilter(b, activeFilter);
      
      if (aMatchesFilter && !bMatchesFilter) return -1;
      if (!aMatchesFilter && bMatchesFilter) return 1;
      
      // Secondary sort by rating
      return (b.rating || 0) - (a.rating || 0);
    });
    
    // Calculate distances
    filteredResults = calculateDistances(filteredResults, center);
    
    // Filter to only include places in the current map bounds
    if (mapBoundsRef.current) {
      const boundsFiltered = filteredResults.filter(place => 
        isPlaceInMapBounds(place)
      );
      
      console.log("After bounds filtering:", boundsFiltered.length, "places in view");
      filteredResults = boundsFiltered;
    }
    
    // If we have a selected location, put it first
    if (selectedLocation) {
      filteredResults = filteredResults.sort((a, b) => {
        if (a.place_id === selectedLocation.place_id) return -1;
        if (b.place_id === selectedLocation.place_id) return 1;
        return 0;
      });
    }

    console.log(`Final results for '${activeFilter}' filter: ${filteredResults.length} places`);
    
    return filteredResults;
  };

  // Helper function to check if a place matches the active filter
  const matchesActiveFilter = (place, filter) => {
    if (!place) return false;
    
    const name = (place.name || '').toLowerCase();
    const vicinity = (place.vicinity || '').toLowerCase();
    
    // Add special check for specific hotels
    if (SPECIFIC_HOTELS.some(hotel => name.includes(hotel.toLowerCase().split(' ')[0]))) {
      console.log("Found specific hotel by name:", place.name);
      return true;
    }
    
    // Add special check for towers
    if (TOWER_KEYWORDS.some(term => name.includes(term.toLowerCase()) || vicinity.includes(term.toLowerCase()))) {
      console.log("Found tower structure:", place.name);
      return true;
    }
    
    // Add special check for pokharis
    if (SPECIFIC_POKHARIS.some(pond => name.includes(pond.toLowerCase()) || vicinity.includes(pond.toLowerCase()))) {
      console.log("Found specific pokhari:", place.name);
      return true;
    }

    // Add special check for parks and entertainment venues
    if (SPECIFIC_PARKS.some(park => name.includes(park.toLowerCase()) || vicinity.includes(park.toLowerCase()))) {
      console.log("Found specific park:", place.name);
      return true;
    }
    
    // Special check for places with 'park' in the name
    if (name.includes('park') || vicinity.includes('park')) {
      console.log("Found place with park in name:", place.name);
      return true;
    }
    
    switch(filter) {
      case 'hotels':
        return hasSpecialType(HOTEL_TYPES, place) || 
               nameContains(HOTEL_KEYWORDS, place);
      
      case 'parks':
        return hasSpecialType(PARK_TYPES, place) || 
               nameContains(PARK_KEYWORDS, place) || 
               vicinityContains(PARK_KEYWORDS, place) ||
               SPECIFIC_POKHARIS.some(pond => name.includes(pond.toLowerCase()) || vicinity.includes(pond.toLowerCase())) ||
               SPECIFIC_PARKS.some(park => name.includes(park.toLowerCase()) || vicinity.includes(park.toLowerCase()));
      
      case 'durbar':
        return name.includes('durbar') || 
               vicinity.includes('durbar') || 
               name.includes('palace') || 
               name.includes('hanuman') || 
               name.includes('basantapur');
      
      case 'temples':
        return (place.types && (
                place.types.includes('hindu_temple') || 
                place.types.includes('buddhist_temple') || 
                place.types.includes('place_of_worship')
              )) || 
               name.includes('temple') || 
               name.includes('mandir') || 
               name.includes('stupa') || 
               name.includes('nath');
      
      case 'nature':
        return (place.types && (
                place.types.includes('natural_feature') || 
                place.types.includes('park') || 
                place.types.includes('campground'))) || 
               nameContains(['hill', 'mountain', 'lake', 'river', 'forest', 'nature', 'garden'], place);
      
      default:
        return true;
    }
  };

  // Add styling for back button functionality
  const handleBackToResults = () => {
    // Clear the selected location
    setSelectedLocation(null);
    
    // If we have a map instance, reset zoom slightly to show context
    if (mapInstanceRef.current) {
      // Zoom out slightly but not too far
      const currentZoom = mapInstanceRef.current.getZoom();
      if (currentZoom > 14) {
        mapInstanceRef.current.setZoom(14);
      }
    }
    
    // Close any open info windows
    markersRef.current.forEach(marker => {
      if (marker.infoWindow) {
        marker.infoWindow.close();
      }
    });
  };

  // Add API key logging for debugging
  useEffect(() => {
    // Log a censored version of the API key for debugging
    const censoredKey = GOMAPS_API_KEY.substring(0, 6) + '...' + GOMAPS_API_KEY.substring(GOMAPS_API_KEY.length - 4);
    console.log('Using Maps API key (censored):', censoredKey);
    console.log('API key length:', GOMAPS_API_KEY.length);
  }, []);

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
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                searchTimeoutRef.current = setTimeout(() => {
                  searchNearbyPlacesWithPlacesService();
                }, 1000);
              }}
            />
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
            <div className="results-header">
              {selectedLocation ? (
                <div className="selected-location-header">
                  <button 
                    style={backButtonStyle}
                    onClick={handleBackToResults}
                  >
                    <span className="back-arrow">←</span> Back
                  </button>
                  <h3 className="selected-location-title">Selected Location</h3>
                </div>
              ) : (
                <h3>
                  {loading ? 'Searching...' : `${places.length} Places in View`}
                </h3>
              )}
            </div>
            <div className="cards-container35">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner35"></div>
                  <p>Finding the best places...</p>
                </div>
              ) : places.length > 0 ? (
                // If a location is selected, only show that location
                (selectedLocation ? 
                  places.filter(p => p.place_id === selectedLocation.place_id) : 
                  places
                ).map((place) => (
                  <LocationCard
                    key={place.place_id}
                    place={place}
                    isSelected={selectedLocation && selectedLocation.place_id === place.place_id}
                    onClick={() => handleCardClick(place)}
                  />
                ))
              ) : (
                <div className="no-results-message">
                  <p>No places found in this area</p>
                  <p className="no-results-subtitle">Try changing the filter or moving the map</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
