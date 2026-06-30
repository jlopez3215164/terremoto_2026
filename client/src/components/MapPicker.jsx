import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Search, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon (Leaflet bug with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapPicker({ lat, lng, onLocationSelect }) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const markerRef = useRef(null);

  // Default: Caracas
  const defaultCenter = [10.48, -66.87];
  const center = lat && lng ? [parseFloat(lat), parseFloat(lng)] : defaultCenter;
  const zoom = lat && lng ? 15 : 8;

  // Debounced search for predictions
  useEffect(() => {
    if (!search.trim() || search.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ve&q=${encodeURIComponent(search)}&limit=5`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
      setSearching(false);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSelectSuggestion = (suggestion) => {
    const resultLat = parseFloat(suggestion.lat);
    const resultLng = parseFloat(suggestion.lon);
    
    setSearch(suggestion.display_name);
    setSuggestions([]);
    setFlyTarget([resultLat, resultLng]);
    onLocationSelect(resultLat, resultLng);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        onLocationSelect(pos.lat, pos.lng);
      }
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', width: '100%', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 10 }} />
          <input 
            type="text" 
            placeholder="Buscar ciudad, zona o calle en Venezuela..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', overflow: 'hidden', zIndex: 1000,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              {suggestions.map((sugg, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectSuggestion(sugg)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'flex-start', gap: '8px', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <MapPin size={14} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.3 }}>{sugg.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
          Ir
        </button>
      </form>
      
      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '220px', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={onLocationSelect} />
          {flyTarget && <FlyTo center={flyTarget} zoom={15} />}
          {lat && lng && (
            <Marker 
              position={[parseFloat(lat), parseFloat(lng)]} 
              draggable={true}
              eventHandlers={eventHandlers}
              ref={markerRef}
            />
          )}
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
        * Puedes buscar un lugar, hacer clic en el mapa, o <strong>arrastrar el pin</strong> para ajustar la ubicación.
      </p>
    </div>
  );
}
