import { useState, useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { fetchWithAuth } from '../api/client';
import { MapPin, Phone, User, Package, Navigation, ExternalLink, Locate, Box, Map } from 'lucide-react';

function parseNeeds(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(item => ({ insumo: item, cantidad: '' }));
}

const ZONAS_COORDS = {
  'Distrito Capital': { lat: 10.48, lng: -66.87, radius: 0.15 },
  'La Guaira': { lat: 10.60, lng: -66.93, radius: 0.2 },
  'Carabobo': { lat: 10.19, lng: -67.97, radius: 0.35 },
  'Aragua': { lat: 10.23, lng: -67.56, radius: 0.35 },
  'Miranda': { lat: 10.25, lng: -66.15, radius: 0.45 },
  'Delta Amacuro': { lat: 8.81, lng: -61.64, radius: 0.7 },
  'Bolívar': { lat: 6.17, lng: -63.53, radius: 0.9 },
  'Yaracuy': { lat: 10.33, lng: -68.74, radius: 0.3 },
  'Monagas': { lat: 9.31, lng: -63.02, radius: 0.45 },
  'Zulia': { lat: 9.84, lng: -72.06, radius: 0.6 },
  'Falcón': { lat: 11.23, lng: -69.86, radius: 0.55 },
};

const getColorByNivel = (nivel) => {
  switch(nivel) {
    case 'critico': return 'rgba(239,68,68,0.35)';
    case 'grave': return 'rgba(249,115,22,0.3)';
    case 'moderado': return 'rgba(234,179,8,0.25)';
    case 'leve': return 'rgba(132,204,22,0.2)';
    default: return 'rgba(59,130,246,0.2)';
  }
};

export default function Mapa3D() {
  const [centros, setCentros] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const globeRef = useRef();

  useEffect(() => {
    Promise.all([
      fetchWithAuth('/centros'),
      fetchWithAuth('/zonas')
    ])
    .then(([centrosData, zonasData]) => {
      setCentros(centrosData.filter(c => c.latitud && c.longitud));
      setZonas(zonasData);
      setLoading(false);
    })
    .catch(err => { console.error(err); setLoading(false); });
  }, []);

  useEffect(() => {
    if (globeRef.current && !loading && centros.length > 0) {
      // Point camera at Venezuela
      setTimeout(() => {
        globeRef.current.pointOfView({ lat: 8.5, lng: -66, altitude: 0.6 }, 2000);
      }, 500);

      // Controls
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.enableDamping = true;
      }
    }
  }, [loading, centros]);

  const handlePointClick = useCallback((point) => {
    setSelected(point);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 0.15 }, 1000);
      const controls = globeRef.current.controls();
      if (controls) controls.autoRotate = false;
    }
  }, []);

  const handleSidebarClick = (centro) => {
    const point = {
      ...centro,
      lat: parseFloat(centro.latitud),
      lng: parseFloat(centro.longitud),
    };
    handlePointClick(point);
  };

  const closePanel = () => {
    setSelected(null);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 8.5, lng: -66, altitude: 0.6 }, 1200);
      const controls = globeRef.current.controls();
      if (controls) controls.autoRotate = true;
    }
  };

  // Rings for disaster zones
  const ringsData = zonas.map(z => {
    const coords = ZONAS_COORDS[z.nombre];
    if (!coords) return null;
    return {
      lat: coords.lat,
      lng: coords.lng,
      maxR: coords.radius * 3,
      propagationSpeed: 1.5,
      repeatPeriod: 1200,
      color: getColorByNivel(z.nivel_afectacion),
      nombre: z.nombre,
      nivel: z.nivel_afectacion,
    };
  }).filter(Boolean);

  // Points for centers
  const pointsData = centros.map(c => ({
    ...c,
    lat: parseFloat(c.latitud),
    lng: parseFloat(c.longitud),
    size: 0.06,
    color: '#3b82f6',
  }));

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, flexWrap: 'wrap', gap: '8px', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box size={22} style={{ color: '#a78bfa' }} />
          <h1 style={{ fontSize: '1.15rem', margin: 0, color: 'white' }}>Mapa 3D — Globo Interactivo</h1>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {centros.length} centro{centros.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/mapa" style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
            textDecoration: 'none'
          }}>
            <Map size={14} /> Vista 2D
          </a>
          <a href="/centros" style={{
            color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            Ver lista <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar */}
        <div style={{
          width: '300px', flexShrink: 0, overflowY: 'auto',
          background: 'rgba(5,10,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '8px', zIndex: 5,
        }}>
          {centros.map(centro => (
            <button key={centro.id} onClick={() => handleSidebarClick(centro)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                background: selected?.id === centro.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: selected?.id === centro.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', padding: '12px', marginBottom: '6px', color: 'white',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (selected?.id !== centro.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (selected?.id !== centro.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.3 }}>{centro.nombre}</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3 }}>
                {centro.direccion?.substring(0, 55)}{centro.direccion?.length > 55 ? '...' : ''}
              </p>
            </button>
          ))}
        </div>

        {/* Globe */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Cargando globo 3D...
          </div>
        ) : (
          <div style={{ flex: 1, position: 'relative' }}>
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              atmosphereColor="#6366f1"
              atmosphereAltitude={0.2}

              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointAltitude={0.01}
              pointRadius="size"
              pointColor={() => '#60a5fa'}
              onPointClick={handlePointClick}
              pointLabel={d => `
                <div style="
                  background:rgba(15,23,42,0.92);
                  backdrop-filter:blur(8px);
                  border:1px solid rgba(255,255,255,0.1);
                  border-radius:10px;
                  padding:10px 14px;
                  color:white;
                  font-family:Inter,system-ui,sans-serif;
                  min-width:180px;
                  box-shadow:0 8px 24px rgba(0,0,0,0.5);
                ">
                  <div style="font-weight:700;font-size:0.85rem;margin-bottom:4px;">${d.nombre}</div>
                  <div style="font-size:0.75rem;color:#94a3b8;">${d.direccion || ''}</div>
                </div>
              `}

              ringsData={ringsData}
              ringLat="lat"
              ringLng="lng"
              ringMaxRadius="maxR"
              ringPropagationSpeed="propagationSpeed"
              ringRepeatPeriod="repeatPeriod"
              ringColor={() => t => `rgba(239,68,68,${Math.sqrt(1-t)})` }

              width={typeof window !== 'undefined' ? window.innerWidth - 300 : 800}
              height={typeof window !== 'undefined' ? window.innerHeight - 120 : 600}
            />

            {/* Detail panel */}
            {selected && (
              <div style={{
                position: 'absolute', top: '16px', right: '16px', width: '340px',
                background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                padding: '20px', color: 'white', zIndex: 10,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{selected.nombre}</h3>
                  <button onClick={closePanel} style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8',
                    borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  {selected.direccion && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <MapPin size={14} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} />
                      <span>{selected.direccion}</span>
                    </div>
                  )}
                  {selected.contacto && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <User size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
                      <span>{selected.contacto}</span>
                    </div>
                  )}
                  {selected.telefono && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Phone size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                      <a href={`tel:${selected.telefono}`} style={{ color: '#4ade80', textDecoration: 'none', fontWeight: '600' }}>
                        {selected.telefono}
                      </a>
                    </div>
                  )}
                </div>

                {(() => {
                  const needs = parseNeeds(selected.tipos_ayuda);
                  if (needs.length === 0) return null;
                  return (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '12px', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={12} /> Se necesita ({needs.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {needs.slice(0, 8).map((n, i) => (
                          <span key={i} style={{
                            background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '3px 8px',
                            borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600'
                          }}>
                            {n.insumo}{n.cantidad ? ` (${n.cantidad})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <a href="/centros" style={{
                  display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700',
                  textDecoration: 'none', marginTop: '14px'
                }}>
                  ❤️ Quiero Donar
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
