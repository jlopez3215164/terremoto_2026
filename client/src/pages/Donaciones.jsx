import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ZonaFilter from '../components/ZonaFilter';
import { Package, Clock, CheckCircle } from 'lucide-react';

export default function Donaciones() {
  const [donaciones, setDonaciones] = useState([]);
  const [zonaId, setZonaId] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDonaciones();
  }, [zonaId]);

  const fetchDonaciones = async () => {
    setLoading(true);
    try {
      const url = zonaId ? `/donaciones?zona_id=${zonaId}` : '/donaciones';
      const data = await fetchWithAuth(url);
      setDonaciones(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (id) => {
    try {
      await fetchWithAuth(`/donaciones/${id}/confirmar`, { method: 'PUT' });
      fetchDonaciones(); // Recargar
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (estado) => {
    switch(estado) {
      case 'entregada': return <span className="badge badge-success"><CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }}/> Entregada</span>;
      case 'en_camino': return <span className="badge badge-info">En Camino</span>;
      default: return <span className="badge badge-warning"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/> Pendiente</span>;
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Donaciones</h1>
          <p className="subtitle" style={{ margin: 0 }}>Registro y seguimiento de ayuda</p>
        </div>
        <ZonaFilter value={zonaId} onChange={setZonaId} />
      </div>

      {loading ? (
        <div>Cargando donaciones...</div>
      ) : donaciones.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          No hay donaciones registradas con estos filtros.
        </div>
      ) : (
        <div className="grid">
          {donaciones.map(donacion => (
            <div key={donacion.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                  <Package size={12} style={{ display: 'inline', marginRight: '4px' }}/> {donacion.tipo_ayuda}
                </span>
                {getStatusBadge(donacion.estado)}
              </div>
              
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{donacion.cantidad}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>
                {donacion.descripcion}
              </p>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: 'auto', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <p><strong>Donante:</strong> {donacion.donante_nombre}</p>
                <p><strong>Centro:</strong> {donacion.centro_nombre || 'N/A'} {donacion.zona_nombre ? `(${donacion.zona_nombre})` : ''}</p>
                
                {donacion.estado === 'entregada' && donacion.confirmado_por && (
                  <p style={{ color: '#34d399', marginTop: '8px' }}>
                    Confirmado por: {donacion.confirmado_por}
                  </p>
                )}
              </div>

              {user && (user.rol === 'admin' || user.rol === 'voluntario') && donacion.estado !== 'entregada' && (
                <button 
                  onClick={() => handleConfirmar(donacion.id)}
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '1rem', padding: '8px' }}
                >
                  <CheckCircle size={16} /> Confirmar Entrega
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
