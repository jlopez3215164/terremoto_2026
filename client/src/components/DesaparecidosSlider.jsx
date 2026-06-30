import { useState, useEffect } from 'react';
import { fetchWithAuth, API_URL } from '../api/client';
import { AlertTriangle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const BASE_URL = API_URL.replace('/api', '');

export default function DesaparecidosSlider() {
  const [desaparecidos, setDesaparecidos] = useState([]);

  useEffect(() => {
    fetchWithAuth('/desaparecidos?estado=desaparecido')
      .then(data => setDesaparecidos(data))
      .catch(err => console.error(err));
  }, []);

  if (desaparecidos.length === 0) {
    return (
      <div style={{
        width: '100%', background: 'rgba(239, 68, 68, 0.05)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
        borderTop: '1px solid rgba(239, 68, 68, 0.15)',
        padding: '16px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem'
      }}>
        No hay reportes de personas desaparecidas activos en este momento.
      </div>
    );
  }

  // Duplicamos la lista para hacer el efecto infinito (seamless loop)
  const infiniteList = [...desaparecidos, ...desaparecidos];

  return (
    <div style={{
      width: '100%',
      background: 'rgba(239, 68, 68, 0.05)',
      borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
      borderTop: '1px solid rgba(239, 68, 68, 0.15)',
      padding: '16px 0',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '2rem'
    }}>
      <div style={{
        position: 'absolute', left: 0, zIndex: 10, background: 'linear-gradient(to right, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)', width: '60px', height: '100%', pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'absolute', right: 0, zIndex: 10, background: 'linear-gradient(to left, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)', width: '60px', height: '100%', pointerEvents: 'none'
      }}/>
      
      <div style={{
        position: 'absolute', left: '1.5rem', zIndex: 12, display: 'flex', alignItems: 'center', gap: '8px',
        color: '#f87171', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px',
        background: 'rgba(15,23,42,0.9)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <AlertTriangle size={14} className="pulse" />
        Buscamos a:
      </div>
      
      <div className="marquee-container" style={{ display: 'flex', gap: '1.5rem', animation: 'marquee 40s linear infinite', paddingLeft: '180px', width: 'max-content' }}>
        {infiniteList.map((p, idx) => (
          <Link to="/desaparecidos" key={idx} style={{
            display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(30,41,59,0.6)',
            padding: '8px 16px 8px 8px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.05)',
            whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.9)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
          >
            {p.foto_url ? (
              <img src={`${BASE_URL}${p.foto_url}`} alt={p.nombre_completo} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                <User size={18} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{p.nombre_completo}</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>📍 {p.ultima_ubicacion || p.zona_nombre || 'Ubicación desconocida'}</span>
            </div>
          </Link>
        ))}
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.75rem)); } 
        }
        .marquee-container:hover {
          animation-play-state: paused !important;
        }
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
