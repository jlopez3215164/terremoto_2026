import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth, API_URL } from '../api/client';
import { Newspaper, Plus, X, Image as ImageIcon, Trash2, Calendar } from 'lucide-react';

const BASE_URL = API_URL.replace('/api', '');

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const { user } = useAuth();
  const isAdmin = user && user.rol === 'admin';

  const fetchNoticias = async () => {
    try {
      const data = await fetchWithAuth('/noticias');
      setNoticias(data);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta noticia?')) return;
    try {
      await fetchWithAuth(`/noticias/${id}`, { method: 'DELETE' });
      fetchNoticias();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error al eliminar la noticia: ' + error.message);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h2 className="title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Newspaper size={32} /> Noticias y Actualizaciones
          </h2>
          <p className="subtitle" style={{ margin: '8px 0 0', maxWidth: '600px' }}>
            Mantente informado sobre el progreso de las ayudas, comunicados oficiales y situación en las zonas afectadas.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} /> Publicar Noticia
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando noticias...</div>
      ) : noticias.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Newspaper size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Aún no hay noticias publicadas</h3>
          <p style={{ color: 'var(--text-muted)' }}>La información oficial aparecerá aquí pronto.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {noticias.map(noticia => (
            <div key={noticia.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'white' }}>
                    {noticia.titulo}
                  </h3>
                  {isAdmin && (
                    <button onClick={() => handleDelete(noticia.id)} style={{
                      background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px'
                    }} title="Eliminar noticia">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {new Date(noticia.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>Publicado por <strong>{noticia.autor}</strong></span>
                </div>

                <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {noticia.resumen}
                </p>
              </div>

              {noticia.imagenes && noticia.imagenes.length > 0 && (
                <div style={{ 
                  display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0 2rem 1.5rem',
                  scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                }}>
                  {noticia.imagenes.map((img, i) => (
                    <img key={i} src={`${BASE_URL}${img}`} alt={`Imagen ${i+1}`} style={{
                      height: '250px', width: 'auto', borderRadius: '12px', objectFit: 'cover',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NoticiaModal onClose={() => setShowModal(false)} onSuccess={() => {
          setShowModal(false);
          fetchNoticias();
        }} />
      )}
    </div>
  );
}

function NoticiaModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ titulo: '', resumen: '' });
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('resumen', formData.resumen);
      
      for (let i = 0; i < imagenes.length; i++) {
        data.append('imagenes', imagenes[i]);
      }

      await fetchWithAuth('/noticias', {
        method: 'POST',
        body: data,
      });

      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer'
        }}>
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={24} /> Redactar Noticia
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label>Título de la Noticia</label>
            <input 
              type="text" className="input-field" required
              value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ej: Nuevo cargamento llega al Centro Sur"
            />
          </div>

          <div className="form-group">
            <label>Contenido / Resumen</label>
            <textarea 
              className="input-field" required rows={6}
              value={formData.resumen} onChange={e => setFormData({...formData, resumen: e.target.value})}
              placeholder="Detalla la información..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={16} /> Adjuntar Imágenes (Opcional, máx 5)
            </label>
            <input 
              type="file" multiple accept="image/*"
              className="input-field"
              onChange={e => setImagenes(e.target.files)}
              style={{ padding: '8px' }}
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Puedes seleccionar varias imágenes al mismo tiempo.
            </small>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar Noticia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
