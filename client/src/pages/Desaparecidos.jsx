import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ZonaFilter from '../components/ZonaFilter';
import CustomSelect from '../components/CustomSelect';
import { AlertTriangle, UserCheck, Shield } from 'lucide-react';

export default function Desaparecidos() {
  const [desaparecidos, setDesaparecidos] = useState([]);
  const [zonaId, setZonaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '', edad: '', genero: 'Otro', descripcion_fisica: '',
    ultima_ubicacion: '', zona_id: '', contacto_familiar: '', telefono_contacto: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchDesaparecidos();
  }, [zonaId]);

  const fetchDesaparecidos = async () => {
    setLoading(true);
    try {
      const url = zonaId ? `/desaparecidos?zona_id=${zonaId}` : '/desaparecidos';
      const data = await fetchWithAuth(url);
      setDesaparecidos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarEncontrado = async (id, rescatado) => {
    try {
      await fetchWithAuth(`/desaparecidos/${id}`, { 
        method: 'PUT',
        body: JSON.stringify({ estado: 'encontrado_vivo', rescatado: rescatado ? 1 : 0 })
      });
      fetchDesaparecidos(); // Recargar
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/desaparecidos', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowForm(false);
      setFormData({nombre_completo: '', edad: '', genero: 'Otro', descripcion_fisica: '', ultima_ubicacion: '', zona_id: '', contacto_familiar: '', telefono_contacto: ''});
      fetchDesaparecidos();
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (estado, rescatado) => {
    if (estado === 'desaparecido') return <span className="badge badge-danger"><AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }}/> Desaparecido</span>;
    if (estado === 'encontrado_vivo') {
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          <span className="badge badge-success"><UserCheck size={12} style={{ display: 'inline', marginRight: '4px' }}/> Encontrado (Vivo)</span>
          {rescatado === 1 && <span className="badge badge-info"><Shield size={12}/> Rescatado</span>}
        </div>
      );
    }
    return <span className="badge" style={{ background: '#374151' }}>Fallecido</span>;
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Personas Desaparecidas</h1>
          <p className="subtitle" style={{ margin: 0 }}>Base de datos y estatus de rescate</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <ZonaFilter value={zonaId} onChange={setZonaId} />
          {user && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ height: '42px' }}>
              Registrar Reporte
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>Registrar Desaparecido</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input type="text" required className="input" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label>Edad</label>
                    <input type="number" className="input" value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <label>Género</label>
                    <CustomSelect 
                      value={formData.genero}
                      onChange={e => setFormData({...formData, genero: e.target.value})}
                      isSearchable={false}
                      options={[
                        { value: 'Masculino', label: 'Masculino' },
                        { value: 'Femenino', label: 'Femenino' },
                        { value: 'Otro', label: 'Otro' }
                      ]}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Descripción Física</label>
                <textarea className="input" rows="2" value={formData.descripcion_fisica} onChange={e => setFormData({...formData, descripcion_fisica: e.target.value})}></textarea>
              </div>

              <div className="form-group">
                <label>Última Ubicación Conocida</label>
                <input type="text" className="input" value={formData.ultima_ubicacion} onChange={e => setFormData({...formData, ultima_ubicacion: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Contacto Familiar</label>
                  <input type="text" className="input" value={formData.contacto_familiar} onChange={e => setFormData({...formData, contacto_familiar: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input type="text" className="input" value={formData.telefono_contacto} onChange={e => setFormData({...formData, telefono_contacto: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div>Cargando...</div>
      ) : desaparecidos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          No hay reportes en esta zona.
        </div>
      ) : (
        <div className="grid">
          {desaparecidos.map(persona => (
            <div key={persona.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderLeft: persona.estado === 'desaparecido' ? '4px solid var(--danger)' : '4px solid var(--secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{persona.nombre_completo}</h3>
                {getStatusBadge(persona.estado, persona.rescatado)}
              </div>
              
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1 }}>
                <p><strong>Edad:</strong> {persona.edad || 'Desconocida'} | <strong>Género:</strong> {persona.genero}</p>
                <p style={{ marginTop: '8px' }}><strong>Última ubicación:</strong> {persona.ultima_ubicacion || 'No especificada'}</p>
                {persona.zona_nombre && <p><strong>Zona:</strong> {persona.zona_nombre}</p>}
                
                {persona.descripcion_fisica && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <strong>Descripción física:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>{persona.descripcion_fisica}</p>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '12px' }}>
                  <p><strong>Familiar / Contacto:</strong> {persona.contacto_familiar || 'N/A'} {persona.telefono_contacto && `(${persona.telefono_contacto})`}</p>
                </div>
              </div>

              {user && user.rol !== 'donante' && persona.estado === 'desaparecido' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => handleMarcarEncontrado(persona.id, false)}
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.875rem' }}
                  >
                    Marcar Encontrado
                  </button>
                  <button 
                    onClick={() => handleMarcarEncontrado(persona.id, true)}
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.875rem', background: '#0284c7' }}
                  >
                    <Shield size={14} /> Rescatado
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
