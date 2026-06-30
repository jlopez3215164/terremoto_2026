import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Building2, Package, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function MisCentros() {
  const [centros, setCentros] = useState([]);
  const [selectedCentro, setSelectedCentro] = useState(null);
  const [donaciones, setDonaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMisCentros();
  }, []);

  const fetchMisCentros = async () => {
    try {
      const data = await fetchWithAuth('/centros/mis-centros');
      setCentros(data);
      if (data.length > 0) {
        handleSelectCentro(data[0]);
      }
    } catch (error) {
      console.error('Error al obtener centros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCentro = async (centro) => {
    setSelectedCentro(centro);
    try {
      const data = await fetchWithAuth(`/donaciones/centro/${centro.id}`);
      setDonaciones(data);
    } catch (error) {
      console.error('Error al obtener donaciones del centro:', error);
    }
  };

  const handleConfirmar = async (id) => {
    try {
      await fetchWithAuth(`/donaciones/${id}/confirmar`, { method: 'PUT' });
      // Recargar donaciones para el centro seleccionado
      if (selectedCentro) {
        handleSelectCentro(selectedCentro);
      }
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

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando panel de gestión...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={32} color="var(--primary)" /> Mis Centros
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>Panel de gestión exclusivo para tus centros de acopio registrados</p>
      </div>

      {centros.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Building2 size={48} style={{ color: '#475569', marginBottom: '1rem', display: 'inline-block' }} />
          <h3>No administras ningún centro actualmente</h3>
          <p style={{ color: 'var(--text-muted)' }}>Ve a la sección de Centros para registrar uno nuevo.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem', alignItems: 'start' }}>
          {/* Sidebar: Lista de Centros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tus Centros</h3>
            {centros.map(c => (
              <div 
                key={c.id}
                onClick={() => handleSelectCentro(c)}
                className="glass-panel"
                style={{ 
                  padding: '1rem', 
                  cursor: 'pointer', 
                  border: selectedCentro?.id === c.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedCentro?.id === c.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{c.nombre}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {c.zona_nombre || 'Sin Zona'}
                </div>
              </div>
            ))}
          </div>

          {/* Main Area: Donaciones del Centro */}
          {selectedCentro && (
            <div className="glass-panel" style={{ padding: '2rem', minHeight: '60vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedCentro.nombre}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {selectedCentro.direccion}
                  </p>
                </div>
                <div className="badge badge-info" style={{ fontSize: '1rem', padding: '8px 16px' }}>
                  {donaciones.length} Donaciones registradas
                </div>
              </div>

              {donaciones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Aún no hay donaciones registradas para este centro.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {donaciones.map(donacion => (
                    <div key={donacion.id} style={{ 
                      background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', 
                      borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center'
                    }}>
                      <div style={{ 
                        width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' 
                      }}>
                        <Package size={28} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: '600', textTransform: 'capitalize' }}>
                            {donacion.cantidad || donacion.tipo_ayuda}
                          </span>
                          {getStatusBadge(donacion.estado)}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', lineHeight: 1.4 }}>
                          {donacion.descripcion}
                        </p>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '1rem' }}>
                          <span><strong>De:</strong> {donacion.donante_nombre}</span>
                          <span><strong>Fecha:</strong> {new Date(donacion.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {donacion.estado !== 'entregada' && (
                        <div>
                          <button 
                            onClick={() => handleConfirmar(donacion.id)}
                            className="btn btn-secondary" 
                            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <CheckCircle size={16} /> Confirmar Recepción
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
