import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ZonaFilter from '../components/ZonaFilter';
import { Package, Clock, CheckCircle, Phone, User, MapPin, MessageSquare, ShieldAlert } from 'lucide-react';

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

  const parseDescription = (desc) => {
    if (!desc) return { main: '', nota: '', tel: '' };
    const parts = desc.split(' | ');
    let main = '', nota = '', tel = '';
    parts.forEach(p => {
      if (p.startsWith('Tel:')) tel = p.replace('Tel:', '').trim();
      else if (p.startsWith('Nota:')) nota = p.replace('Nota:', '').trim();
      else main = p;
    });
    return { main, nota, tel };
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={32} color="var(--primary)" /> Registro de Donaciones
          </h1>
          <p className="subtitle" style={{ margin: 0 }}>Monitoreo global de ayuda y logística en curso</p>
        </div>
        <div style={{ minWidth: '250px' }}>
          <ZonaFilter value={zonaId} onChange={setZonaId} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando donaciones...</div>
      ) : donaciones.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={48} style={{ color: '#475569', marginBottom: '1rem', display: 'inline-block' }} />
          <h3>No hay donaciones registradas</h3>
          <p style={{ color: 'var(--text-muted)' }}>Intenta cambiar los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid">
          {donaciones.map(donacion => {
            const isOwnerOrAdmin = user && (user.rol === 'admin' || user.id === donacion.centro_usuario_id);
            const { main, nota, tel } = parseDescription(donacion.descripcion);

            return (
              <div key={donacion.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    <Package size={12} style={{ display: 'inline', marginRight: '4px' }}/> {donacion.tipo_ayuda}
                  </span>
                  {getStatusBadge(donacion.estado)}
                </div>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'white', textTransform: 'capitalize' }}>
                  {donacion.cantidad || donacion.tipo_ayuda}
                </h3>
                
                {main && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {main}
                  </p>
                )}

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', marginBottom: '1rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    <User size={14} style={{ color: '#a78bfa' }} /> 
                    <span><strong>Donante:</strong> {donacion.donante_nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    <MapPin size={14} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} /> 
                    <span><strong>Destino:</strong> {donacion.centro_nombre || 'N/A'} {donacion.zona_nombre ? `(${donacion.zona_nombre})` : ''}</span>
                  </div>

                  {nota && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#94a3b8', fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                      <MessageSquare size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> 
                      <span style={{ fontStyle: 'italic' }}>"{nota}"</span>
                    </div>
                  )}

                  {/* Private Contact Data */}
                  {tel && (
                    <div style={{ marginTop: '12px', background: isOwnerOrAdmin ? 'rgba(34,197,94,0.1)' : 'rgba(15,23,42,0.5)', border: isOwnerOrAdmin ? '1px solid rgba(34,197,94,0.2)' : '1px dashed rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      {isOwnerOrAdmin ? (
                        <>
                          <Phone size={14} style={{ color: '#4ade80' }} />
                          <a href={`tel:${tel}`} style={{ color: '#4ade80', textDecoration: 'none', fontWeight: '600' }}>{tel}</a>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} style={{ color: '#64748b' }} />
                          <span style={{ color: '#64748b', fontStyle: 'italic' }}>Dato de contacto protegido (Solo visible para el centro)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Registrada: {new Date(donacion.created_at).toLocaleDateString()}</span>
                  {donacion.estado === 'entregada' && donacion.confirmado_por && (
                    <span style={{ color: '#34d399' }}>✓ Por: {donacion.confirmado_por}</span>
                  )}
                </div>

                {isOwnerOrAdmin && donacion.estado !== 'entregada' && (
                  <button 
                    onClick={() => handleConfirmar(donacion.id)}
                    className="btn btn-secondary" 
                    style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                  >
                    <CheckCircle size={16} /> Confirmar Entrega
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
