import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth, API_URL } from '../api/client';
import { Newspaper, Plus, X, Image as ImageIcon, Trash2, Calendar, User, ChevronLeft, ChevronRight, Clock, Megaphone } from 'lucide-react';

const BASE_URL = API_URL.replace('/api', '');

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user } = useAuth();
  const isAdmin = user && user.rol === 'admin';

  const fetchNoticias = async (pageNum = 1, replace = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetchWithAuth(`/noticias?page=${pageNum}&limit=10`);
      const newData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      
      setNoticias(prev => replace ? newData : [...prev, ...newData]);
      if (res.totalPages) setTotalPages(res.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNoticias(1, true);
  }, []);

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchNoticias(page + 1, false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta noticia?')) return;
    try {
      await fetchWithAuth(`/noticias/${id}`, { method: 'DELETE' });
      fetchNoticias(1, true);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error al eliminar la noticia: ' + error.message);
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD} día${diffD > 1 ? 's' : ''}`;
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ 
        textAlign: 'center', marginBottom: '3rem', paddingTop: '1rem'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(16,185,129,0.25))',
          border: '1px solid rgba(59,130,246,0.3)', marginBottom: '1rem',
        }}>
          <Megaphone size={28} style={{ color: '#60a5fa' }} />
        </div>
        <h2 className="title" style={{ margin: '0 0 0.5rem', fontSize: '2.25rem' }}>
          Noticias y Actualizaciones
        </h2>
        <p className="subtitle" style={{ margin: '0 auto', maxWidth: '520px', lineHeight: 1.6 }}>
          Comunicados oficiales, avances de la ayuda humanitaria y situación en las zonas afectadas.
        </p>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{
            marginTop: '1.5rem', padding: '12px 28px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
            fontWeight: '700', fontSize: '0.95rem',
          }}>
            <Plus size={18} /> Publicar Noticia
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando noticias...</p>
        </div>
      ) : noticias.length === 0 ? (
        /* Empty State */
        <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <Newspaper size={36} style={{ color: '#475569' }} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem', color: '#e2e8f0' }}>
            Aún no hay noticias publicadas
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.5 }}>
            La información oficial y las novedades sobre la emergencia aparecerán aquí en cuanto sean publicadas.
          </p>
        </div>
      ) : (
        /* Timeline */
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: '11px', top: '8px', bottom: '8px',
            width: '2px', background: 'linear-gradient(to bottom, rgba(59,130,246,0.5), rgba(16,185,129,0.3), transparent)',
            borderRadius: '2px',
          }} />

          {noticias.map((noticia, index) => (
            <div key={noticia.id} className="animate-fade-in" style={{
              position: 'relative', marginBottom: '2rem',
              animationDelay: `${index * 0.1}s`,
            }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: '-27px', top: '24px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: index === 0 ? '#3b82f6' : 'rgba(59,130,246,0.4)',
                border: '3px solid var(--bg-dark)',
                boxShadow: index === 0 ? '0 0 12px rgba(59,130,246,0.6)' : 'none',
              }} />

              {/* Card */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Images - Hero Banner if exists */}
                {noticia.imagenes && noticia.imagenes.length > 0 && (
                  <ImageCarousel images={noticia.imagenes} onImageClick={(img) => setLightbox(img)} />
                )}

                {/* Content */}
                <div style={{ padding: '1.5rem 2rem' }}>
                  {/* Meta bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                  }}>
                    {index === 0 && (
                      <span style={{
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))',
                        color: '#f87171', padding: '3px 10px', borderRadius: '6px',
                        fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}>
                        Más reciente
                      </span>
                    )}
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.8rem', color: '#64748b',
                    }}>
                      <Clock size={13} /> {timeAgo(noticia.created_at)}
                    </span>
                    <span style={{ color: '#334155' }}>·</span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.8rem', color: '#64748b',
                    }}>
                      <User size={13} /> {noticia.autor}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.35rem', fontWeight: '700', color: '#f1f5f9',
                    lineHeight: 1.3, marginBottom: '0.75rem',
                  }}>
                    {noticia.titulo}
                  </h3>

                  {/* Body */}
                  <p style={{
                    fontSize: '0.95rem', lineHeight: 1.7, color: '#94a3b8',
                    whiteSpace: 'pre-wrap', margin: 0,
                  }}>
                    {noticia.resumen}
                  </p>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div style={{
                      marginTop: '1.25rem', paddingTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', justifyContent: 'flex-end',
                    }}>
                      <button onClick={() => handleDelete(noticia.id)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.8rem', fontWeight: '600',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '1rem' }}>
              <button onClick={handleLoadMore} disabled={loadingMore} style={{
                padding: '12px 24px', fontSize: '0.95rem', fontWeight: '700',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', borderRadius: '20px', cursor: 'pointer',
                transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                {loadingMore ? 'Cargando...' : 'Cargar noticias anteriores'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out', padding: '2rem',
        }}>
          <img src={lightbox.startsWith('http') ? lightbox : `${BASE_URL}${lightbox}`} alt="Ampliada" style={{
            maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
            borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer',
          }}>
            <X size={20} />
          </button>
        </div>
      )}

      {showModal && (
        <NoticiaModal onClose={() => setShowModal(false)} onSuccess={() => {
          setShowModal(false);
          fetchNoticias();
        }} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* Image Carousel Component */
function ImageCarousel({ images, onImageClick }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    return () => el?.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (images.length === 1) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', maxHeight: '360px', cursor: 'pointer' }}
        onClick={() => onImageClick(images[0])}
      >
        <img src={images[0].startsWith('http') ? images[0] : `${BASE_URL}${images[0]}`} alt="" style={{
          width: '100%', height: '360px', objectFit: 'cover', display: 'block',
          transition: 'transform 0.3s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(transparent, rgba(15,23,42,0.7))',
        }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={scrollRef} style={{
        display: 'flex', overflowX: 'auto', gap: '4px',
        scrollbarWidth: 'none', scrollSnapType: 'x mandatory',
      }}>
        {images.map((img, i) => (
          <img key={i} src={img.startsWith('http') ? img : `${BASE_URL}${img}`} alt={`Imagen ${i+1}`}
            onClick={() => onImageClick(img)}
            style={{
              height: '240px', minWidth: '320px', objectFit: 'cover',
              scrollSnapAlign: 'start', cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          />
        ))}
      </div>
      {/* Scroll indicators */}
      {canScrollLeft && (
        <button onClick={() => scroll(-1)} style={{
          position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)',
        }}>
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll(1)} style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)',
        }}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

/* Modal */
function NoticiaModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ titulo: '', resumen: '' });
  const [imagenes, setImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = (e) => {
    const files = e.target.files;
    setImagenes(files);
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setPreviews(urls);
  };

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
      background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      backdropFilter: 'blur(4px)',
    }}>
      <div className="animate-fade-in" style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        background: 'rgba(22,33,52,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)', padding: '2rem',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px',
          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <Newspaper size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#f1f5f9' }}>
              Redactar Noticia
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Publica un comunicado oficial</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
              Título
            </label>
            <input 
              type="text" className="input-field" required
              value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ej: Nuevo cargamento llega al Centro Sur"
              style={{ borderRadius: '10px', padding: '12px 16px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
              Contenido
            </label>
            <textarea 
              className="input-field" required rows={5}
              value={formData.resumen} onChange={e => setFormData({...formData, resumen: e.target.value})}
              placeholder="Describe el comunicado con los detalles relevantes..."
              style={{ resize: 'vertical', borderRadius: '10px', padding: '12px 16px', lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px'
            }}>
              <ImageIcon size={15} /> Imágenes <span style={{ fontWeight: '400', color: '#475569' }}>(opcional, máx 5)</span>
            </label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px',
              padding: '1.5rem', cursor: 'pointer', textAlign: 'center',
              transition: 'border-color 0.2s, background 0.2s',
              background: previews.length > 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = previews.length > 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
            >
              <input type="file" multiple accept="image/*" onChange={handleFiles} style={{ display: 'none' }} />
              {previews.length === 0 ? (
                <>
                  <ImageIcon size={28} style={{ color: '#475569', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Haz clic o arrastra para subir imágenes</span>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {previews.map((url, i) => (
                    <img key={i} src={url} alt="" style={{
                      width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }} />
                  ))}
                </div>
              )}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn" style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{
              flex: 1, borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            }} disabled={loading}>
              {loading ? 'Publicando...' : '✦ Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
