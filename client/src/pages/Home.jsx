import { Link } from 'react-router-dom';
import { Heart, MapPin, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <h1 className="title" style={{ fontSize: '3.5rem' }}>Sistema de Ayuda Humanitaria</h1>
        <p className="subtitle" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Plataforma centralizada para coordinar donaciones, ubicar centros de acopio y reportar personas desaparecidas durante la emergencia nacional.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/donaciones" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.125rem' }}>
            Quiero Donar <Heart size={20} />
          </Link>
          <Link to="/desaparecidos" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.125rem' }}>
            Reportar Desaparecido <Users size={20} />
          </Link>
        </div>
      </div>

      <div className="grid" style={{ marginTop: '4rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '1rem' }}>
            <MapPin size={40} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Centros de Acopio</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Encuentra el centro de donación más cercano a ti y verifica qué insumos necesitan.</p>
          <Link to="/centros" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            Ver centros <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-panel" style={{ textAlign: 'center', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '1rem' }}>
            <Heart size={40} color="var(--secondary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Donaciones</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Registra tus donaciones y haz seguimiento hasta que sean entregadas a los afectados.</p>
          <Link to="/donaciones" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            Gestionar donaciones <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-panel" style={{ textAlign: 'center', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '1rem' }}>
            <Users size={40} color="var(--warning)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Desaparecidos</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Base de datos actualizada de personas reportadas como desaparecidas o encontradas.</p>
          <Link to="/desaparecidos" style={{ color: 'var(--warning)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            Buscar personas <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
