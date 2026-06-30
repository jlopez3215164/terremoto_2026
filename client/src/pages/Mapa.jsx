import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { fetchWithAuth } from '../api/client';
import { MapPin, Phone, User, Package, Heart, Clock, Building2, ExternalLink, Navigation, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function parseNeeds(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(item => ({ insumo: item, cantidad: '' }));
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom]);
  return null;
}

export default function Mapa() {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    fetchWithAuth('/centros')
      .then(data => {
        setCentros(data.filter(c => c.latitud && c.longitud));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return alert('Tu navegador no soporta geolocalización.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setSortByDistance(true);
        setFlyTarget([coords.lat, coords.lng]);
        setLocating(false);
      },
      err => {
        alert('No pudimos obtener tu ubicación. Verifica los permisos.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const centrosWithDist = centros.map(c => ({
    ...c,
    distance: userPos ? getDistanceKm(userPos.lat, userPos.lng, parseFloat(c.latitud), parseFloat(c.longitud)) : null,
  }));

  const sorted = sortByDistance
    ? [...centrosWithDist].sort((a, b) => (a.distance || 999) - (b.distance || 999))
    : centrosWithDist;

  const defaultCenter = centros.length > 0 
    ? [parseFloat(centros[0].latitud), parseFloat(centros[0].longitud)]
    : [10.48, -66.87];

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={22} style={{ color: '#f59e0b' }} />
          <h1 style={{ fontSize: '1.15rem', margin: 0, color: 'white' }}>Mapa de Centros</h1>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {centros.length} centro{centros.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={locateMe} disabled={locating} style={{
            background: userPos ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
            border: userPos ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(59,130,246,0.3)',
            color: userPos ? '#4ade80' : '#60a5fa',
            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Locate size={15} className={locating ? 'spin' : ''} />
            {locating ? 'Localizando...' : userPos ? '✓ Ubicación activa' : 'Usar mi ubicación'}
          </button>
          {userPos && (
            <button onClick={() => { setSortByDistance(!sortByDistance); }} style={{
              background: sortByDistance ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.1)',
              border: sortByDistance ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: sortByDistance ? '#fbbf24' : '#94a3b8',
              borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Navigation size={14} /> {sortByDistance ? 'Más cercanos primero' : 'Ordenar por cercanía'}
            </button>
          )}
          <a href="/centros" style={{
            color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            Ver lista <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Sidebar + Map */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '320px', flexShrink: 0, overflowY: 'auto',
          background: 'rgba(15,23,42,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '8px',
        }}>
          {sorted.map(centro => {
            const needs = parseNeeds(centro.tipos_ayuda);
            return (
              <button key={centro.id} onClick={() => setFlyTarget([parseFloat(centro.latitud), parseFloat(centro.longitud)])}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '12px', marginBottom: '6px', color: 'white',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.3 }}>{centro.nombre}</h4>
                  {centro.distance != null && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
                      background: centro.distance < 10 ? 'rgba(34,197,94,0.2)' : centro.distance < 50 ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.15)',
                      color: centro.distance < 10 ? '#4ade80' : centro.distance < 50 ? '#fbbf24' : '#f87171',
                    }}>
                      {centro.distance < 1 ? `${(centro.distance * 1000).toFixed(0)}m` : `${centro.distance.toFixed(1)}km`}
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.3 }}>
                  {centro.direccion?.substring(0, 60)}{centro.direccion?.length > 60 ? '...' : ''}
                </p>
                {needs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '6px' }}>
                    {needs.slice(0, 3).map((n, i) => (
                      <span key={i} style={{
                        background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '1px 6px',
                        borderRadius: '3px', fontSize: '0.65rem', fontWeight: '600'
                      }}>{n.insumo}</span>
                    ))}
                    {needs.length > 3 && <span style={{ fontSize: '0.65rem', color: '#64748b' }}>+{needs.length-3}</span>}
                  </div>
                )}
              </button>
            );
          })}
          {centros.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 1rem', fontSize: '0.85rem' }}>
              No hay centros con ubicación registrada.
            </p>
          )}
        </div>

        {/* Map */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Cargando mapa...
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <MapContainer center={userPos ? [userPos.lat, userPos.lng] : defaultCenter} zoom={userPos ? 12 : 7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {flyTarget && <FlyTo center={flyTarget} zoom={14} />}
              
              {/* User location */}
              {userPos && (
                <>
                  <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                    <Popup><strong>Tu ubicación</strong></Popup>
                  </Marker>
                  <Circle center={[userPos.lat, userPos.lng]} radius={500} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />
                </>
              )}

              {/* Centers */}
              {sorted.map(centro => {
                const needs = parseNeeds(centro.tipos_ayuda);
                return (
                  <Marker key={centro.id} position={[parseFloat(centro.latitud), parseFloat(centro.longitud)]}>
                    <Popup maxWidth={320} minWidth={280}>
                      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                            {centro.nombre}
                          </h3>
                          {centro.distance != null && (
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                              {centro.distance < 1 ? `${(centro.distance * 1000).toFixed(0)}m` : `${centro.distance.toFixed(1)}km`}
                            </span>
                          )}
                        </div>
                        
                        <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#3b82f6' }} /> {centro.direccion}
                          </span>
                          {centro.contacto && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={13} style={{ flexShrink: 0, color: '#8b5cf6' }} /> {centro.contacto}
                            </span>
                          )}
                          {centro.telefono && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} style={{ flexShrink: 0, color: '#22c55e' }} /> 
                              <a href={`tel:${centro.telefono}`} style={{ color: '#22c55e' }}>{centro.telefono}</a>
                            </span>
                          )}
                        </div>

                        {needs.length > 0 && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: '#f59e0b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Package size={12} /> Se necesita ({needs.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {needs.slice(0, 6).map((n, i) => (
                                <span key={i} style={{
                                  background: '#fef3c7', color: '#92400e', padding: '2px 8px',
                                  borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600'
                                }}>
                                  {n.insumo}{n.cantidad ? ` (${n.cantidad})` : ''}
                                </span>
                              ))}
                              {needs.length > 6 && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>+{needs.length - 6} más</span>}
                            </div>
                          </div>
                        )}

                        <a href="/centros" style={{
                          display: 'block', textAlign: 'center', background: '#dc2626', color: 'white',
                          padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                          textDecoration: 'none', marginTop: '6px'
                        }}>
                          ❤️ Quiero Donar
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
