import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth, API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ZonaFilter from '../components/ZonaFilter';
import CustomSelect from '../components/CustomSelect';
import { AlertTriangle, UserCheck, Shield, MapPin, Calendar, User, Search, Image as ImageIcon, X } from 'lucide-react';

const BASE_URL = API_URL.replace('/api', '');

export default function Desaparecidos() {
  const [desaparecidos, setDesaparecidos] = useState([]);
  const [zonaId, setZonaId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '', edad: '', genero: 'Otro', descripcion_fisica: '',
    ultima_ubicacion: '', zona_id: '', contacto_familiar: '', telefono_contacto: ''
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) form.append(key, formData[key]);
      });
      
      if (fotoFile) {
        form.append('foto', fotoFile);
      }

      await fetchWithAuth('/desaparecidos', {
        method: 'POST',
        body: form // FormData se envía sin JSON.stringify y el API client ajusta los headers
      });
      
      setShowForm(false);
      setFormData({
        nombre_completo: '', edad: '', genero: 'Otro', descripcion_fisica: '', 
        ultima_ubicacion: '', zona_id: '', contacto_familiar: '', telefono_contacto: ''
      });
      setFotoFile(null);
      setFotoPreview(null);
      fetchDesaparecidos();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (estado, rescatado) => {
    if (estado === 'desaparecido') return (
      <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <AlertTriangle size={14} /> Desaparecido
      </span>
    );
    if (estado === 'encontrado_vivo') {
      return (
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={14} /> Encontrado
          </span>
          {rescatado === 1 && (
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> Rescatado
            </span>
          )}
        </div>
      );
    }
    return (
      <span style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
        Fallecido
      </span>
    );
  };

  const filtered = desaparecidos.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.nombre_completo.toLowerCase().includes(term) || 
           p.ultima_ubicacion?.toLowerCase().includes(term) ||
           p.contacto_familiar?.toLowerCase().includes(term);
  });

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCheck size={36} style={{ color: 'var(--primary)' }} />
            Desaparecidos
          </h1>
          <p className="subtitle" style={{ margin: 0, fontSize: '1.1rem', opacity: 0.8 }}>Registro y seguimiento de personas desaparecidas.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Buscar nombre o ubicación..." 
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', width: '250px' }}
            />
          </div>
          <ZonaFilter value={zonaId} onChange={setZonaId} />
          {user && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Registrar Reporte
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.95)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={24} style={{ color: '#f59e0b' }} /> Registrar Desaparecido
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Image Upload Area */}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '120px', height: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                    border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0
                  }}
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <ImageIcon size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Añadir Foto</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                  />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Nombre Completo *</label>
                    <input type="text" required className="input-field" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Edad</label>
                      <input type="number" className="input-field" value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Género</label>
                      <CustomSelect 
                        value={formData.genero}
                        onChange={e => setFormData({...formData, genero: e.target.value})}
                        isSearchable={false}
                        options={[
                          { value: 'masculino', label: 'Masculino' },
                          { value: 'femenino', label: 'Femenino' },
                          { value: 'otro', label: 'Otro' }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Descripción Física</label>
                <textarea className="input-field" rows="2" value={formData.descripcion_fisica} onChange={e => setFormData({...formData, descripcion_fisica: e.target.value})}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ position: 'relative', zIndex: 9 }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Zona *</label>
                  {/* Reuse ZonaFilter for selection */}
                  <CustomSelect 
                    value={formData.zona_id}
                    onChange={e => setFormData({...formData, zona_id: e.target.value})}
                    options={[{value: '1', label: 'Caracas'}, {value: '2', label: 'Miranda'}, {value: '3', label: 'Vargas'}]} // Idealy fetch from context or API
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Última Ubicación Conocida</label>
                  <input type="text" className="input-field" value={formData.ultima_ubicacion} onChange={e => setFormData({...formData, ultima_ubicacion: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Contacto Familiar</label>
                  <input type="text" className="input-field" value={formData.contacto_familiar} onChange={e => setFormData({...formData, contacto_familiar: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '500' }}>Teléfono de Contacto</label>
                  <input type="text" className="input-field" value={formData.telefono_contacto} onChange={e => setFormData({...formData, telefono_contacto: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}><AlertTriangle size={32} /></div>
          <p>Cargando registros...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <User size={48} style={{ color: '#475569', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem' }}>No hay resultados</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>No se encontraron personas con los filtros seleccionados.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filtered.map(persona => (
            <div key={persona.id} style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              {persona.foto_url ? (
                <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                  <img 
                    src={`${BASE_URL}${persona.foto_url}`} 
                    alt={persona.nombre_completo} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(15,23,42,1) 100%)' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {getStatusBadge(persona.estado, persona.rescatado)}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  width: '100%', height: '120px', background: 'rgba(255,255,255,0.02)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative'
                }}>
                  <User size={48} style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {getStatusBadge(persona.estado, persona.rescatado)}
                  </div>
                </div>
              )}
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, marginTop: persona.foto_url ? '-50px' : '0', zIndex: 2 }}>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 12px 0', color: 'white', fontWeight: '800' }}>
                  {persona.nombre_completo}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <Calendar size={14} style={{ color: '#60a5fa' }} /> {persona.edad ? `${persona.edad} años` : 'Edad N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <User size={14} style={{ color: '#a78bfa' }} /> {persona.genero}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1 }}>
                  {persona.ultima_ubicacion && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      <MapPin size={14} style={{ marginTop: '3px', color: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.4 }}><strong>Últ. vez visto:</strong> {persona.ultima_ubicacion} {persona.zona_nombre && `(${persona.zona_nombre})`}</span>
                    </div>
                  )}
                  {persona.descripcion_fisica && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                      {persona.descripcion_fisica}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Contacto de Familia</span>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{persona.contacto_familiar || 'No especificado'}</span>
                    {persona.telefono_contacto && (
                      <a href={`tel:${persona.telefono_contacto}`} style={{ color: '#4ade80', textDecoration: 'none', fontWeight: '600' }}>
                        {persona.telefono_contacto}
                      </a>
                    )}
                  </div>
                </div>

                {user && user.rol !== 'donante' && persona.estado === 'desaparecido' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button 
                      onClick={() => handleMarcarEncontrado(persona.id, false)}
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      Encontrado
                    </button>
                    <button 
                      onClick={() => handleMarcarEncontrado(persona.id, true)}
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}
                    >
                      <Shield size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Rescatado
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
