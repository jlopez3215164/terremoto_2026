import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, MapPin, Heart, Users, LogOut, LogIn, Map, Building2 } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <Activity color="var(--primary)" size={28} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Ayuda<span style={{ color: 'var(--primary)' }}>2026</span> <span style={{ fontSize: '1.4rem' }}>🇻🇪</span>
          </h1>
        </Link>
      </div>
      
      <div className="nav-links">
        <Link to="/centros" className={`nav-link ${isActive('/centros')}`}>
          <MapPin size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Centros
        </Link>
        <Link to="/mapa" className={`nav-link ${isActive('/mapa')}`}>
          <Map size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}}/> Mapa
        </Link>
        <Link to="/donaciones" className={`nav-link ${isActive('/donaciones')}`}>
          <Heart size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Donaciones
        </Link>
        <Link to="/desaparecidos" className={`nav-link ${isActive('/desaparecidos')}`}>
          <Users size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Desaparecidos
        </Link>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-light)' }}>
            <Link to="/mis-centros" className={`btn ${isActive('/mis-centros') ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', fontSize: '0.875rem', background: isActive('/mis-centros') ? '' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Building2 size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Mis Centros
            </Link>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Hola, <strong>{user.nombre}</strong> <span className="badge badge-info">{user.rol}</span>
            </span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px', marginLeft: '1rem' }}>
            <LogIn size={16} /> Entrar
          </Link>
        )}
      </div>
    </nav>
  );
}
