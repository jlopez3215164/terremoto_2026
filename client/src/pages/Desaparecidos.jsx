import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchWithAuth, API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ZonaFilter from '../components/ZonaFilter';
import { 
  AlertTriangle, UserCheck, Shield, MapPin, Calendar, User, Search, 
  Image as ImageIcon, X, Phone, Heart, Building2, Plus, CheckCircle2, Send
} from 'lucide-react';

const BASE_URL = API_URL.replace('/api', '');

/* ─── Stat Card ─── */
function StatCard({ value, label, color, icon: Icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: '14px',
      padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      flex: 1, minWidth: '120px'
    }}>
      {Icon && <Icon size={20} style={{ color, opacity: 0.8 }} />}
      <span style={{ fontSize: '2rem', fontWeight: '800', color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

/* ─── Filter Chip ─── */
function Chip({ active, color, label, dot, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? `${color}50` : 'rgba(255,255,255,0.08)'}`,
      color: active ? color : '#94a3b8',
      padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
      fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
      transition: 'all 0.2s'
    }}>
      {dot && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />}
      {label}
    </button>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ estado, rescatado }) {
  const map = {
    desaparecido: { bg: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'rgba(239,68,68,0.3)', icon: AlertTriangle, text: 'Sin contacto' },
    encontrado_vivo: { bg: 'rgba(34,197,94,0.2)', color: '#4ade80', border: 'rgba(34,197,94,0.3)', icon: UserCheck, text: 'Localizado' },
    en_hospital: { bg: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: 'rgba(56,189,248,0.3)', icon: Building2, text: 'En hospital' },
    en_centro: { bg: 'rgba(168,85,247,0.2)', color: '#c084fc', border: 'rgba(168,85,247,0.3)', icon: Shield, text: 'En centro' },
    encontrado_fallecido: { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)', icon: X, text: 'Fallecido' },
  };
  const s = map[estado] || map.desaparecido;
  const Icon = s.icon;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={13} /> {s.text}
    </span>
  );
}

/* ─── Report Form (Public) ─── */
function ReportModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre_completo: '', edad: '', genero: 'otro', descripcion_fisica: '',
    ultima_ubicacion: '', contacto_familiar: '', telefono_contacto: '',
    reportado_por: '', telefono_reportante: ''
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) form.append(k, v); });
      if (fotoFile) form.append('foto', fotoFile);

      const res = await fetch(`${API_URL}/desaparecidos/public`, { method: 'POST', body: form });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Error'); }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err) {
      alert(err.message);
    } finally { setSubmitting(false); }
  };

  const f = (key) => ({ value: formData[key], onChange: e => setFormData({ ...formData, [key]: e.target.value }) });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={56} style={{ color: '#4ade80', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>¡Reporte Registrado!</h2>
            <p style={{ color: '#94a3b8' }}>Gracias por ayudar a reconectar familias.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} style={{ color: '#f59e0b' }} /> Reportar persona desaparecida
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>¿No logras contactar a alguien? Repórtalo aquí.</p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Photo + Name */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div onClick={() => fileRef.current?.click()} style={{
                  width: '110px', height: '110px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)',
                  border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0
                }}>
                  {fotoPreview ? <img src={fotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <><ImageIcon size={28} style={{ color: '#64748b', marginBottom: '6px' }} /><span style={{ fontSize: '0.7rem', color: '#64748b' }}>Añadir foto</span></>}
                  <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Nombre completo de la persona *</label>
                    <input type="text" required className="input-field" placeholder="Ej: María Pérez García" {...f('nombre_completo')} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Edad</label>
                      <input type="number" className="input-field" placeholder="Ej: 35" {...f('edad')} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Género</label>
                      <select className="input-field" {...f('genero')} style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.75rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} style={{ color: '#f59e0b' }} /> ¿Dónde se le vio por última vez?</h3>
                <input type="text" required className="input-field" placeholder="Ej: Centro Comercial Sambil, Caracas" {...f('ultima_ubicacion')} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Descripción física (ropa, rasgos, etc.)</label>
                <textarea className="input-field" rows="2" placeholder="Ej: Vestía camisa azul, cabello corto, usa lentes..." {...f('descripcion_fisica')} style={{ resize: 'vertical', width: '100%' }} />
              </div>

              {/* Family Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Familiar de contacto</label>
                  <input type="text" className="input-field" placeholder="Nombre del familiar" {...f('contacto_familiar')} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Teléfono del familiar</label>
                  <input type="text" className="input-field" placeholder="04XX-XXXXXXX" {...f('telefono_contacto')} />
                </div>
              </div>

              {/* Reporter info */}
              <div style={{ background: 'rgba(59,130,246,0.06)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.15)' }}>
                <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={15} /> Tus datos (quien reporta)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Tu nombre *</label>
                    <input type="text" required className="input-field" placeholder="Ej: Juan López" {...f('reportado_por')} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Tu teléfono</label>
                    <input type="text" className="input-field" placeholder="04XX-XXXXXXX" {...f('telefono_reportante')} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting} style={{
                padding: '14px', fontSize: '1rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: submitting ? '#475569' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(245,158,11,0.3)',
                borderRadius: '12px', border: 'none', color: 'white', cursor: 'pointer'
              }}>
                <Send size={18} />
                {submitting ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Found Modal ─── */
function FoundModal({ persona, onClose, onSuccess }) {
  const [estado, setEstado] = useState('encontrado_vivo');
  const [reportadoPor, setReportadoPor] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/desaparecidos/public/${persona.id}/encontrado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, reportado_por: reportadoPor, notas })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Error'); }
      onSuccess();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const opts = [
    { value: 'encontrado_vivo', label: '✅ Está a salvo', color: '#4ade80' },
    { value: 'en_hospital', label: '🏥 En un hospital', color: '#38bdf8' },
    { value: 'en_centro', label: '🏠 En un centro de acopio', color: '#c084fc' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={20} style={{ color: '#4ade80' }} /> ¡Lo encontré!
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Reportar que <strong style={{ color: 'white' }}>{persona.nombre_completo}</strong> fue localizado/a.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>¿Dónde está?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {opts.map(o => (
                <button key={o.value} type="button" onClick={() => setEstado(o.value)} style={{
                  background: estado === o.value ? `${o.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${estado === o.value ? `${o.color}50` : 'rgba(255,255,255,0.08)'}`,
                  color: estado === o.value ? o.color : '#94a3b8',
                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '600', textAlign: 'left', transition: 'all 0.2s'
                }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Tu nombre *</label>
            <input type="text" required className="input-field" placeholder="¿Quién reporta?" value={reportadoPor} onChange={e => setReportadoPor(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Detalles (opcional)</label>
            <textarea className="input-field" rows="2" placeholder="Ej: Lo vi en el Hospital Pérez Carreño, sala de emergencias" value={notas} onChange={e => setNotas(e.target.value)} style={{ resize: 'vertical', width: '100%' }} />
          </div>

          <button type="submit" disabled={submitting} style={{
            padding: '12px', fontSize: '1rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: submitting ? '#475569' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '12px', border: 'none', color: 'white', cursor: 'pointer'
          }}>
            <CheckCircle2 size={18} />
            {submitting ? 'Enviando...' : 'Confirmar Localización'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Desaparecidos() {
  const [desaparecidos, setDesaparecidos] = useState([]);
  const [stats, setStats] = useState({ total: 0, sin_contacto: 0, localizados: 0, en_hospital: 0, en_centro: 0, fallecidos: 0 });
  const [zonaId, setZonaId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [foundTarget, setFoundTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Effect to load initial or when filters change (resets to page 1)
  useEffect(() => {
    fetchData(1, true);
  }, [zonaId, filterEstado, searchTerm]);

  const fetchData = async (pageNum = 1, replace = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `${API_URL}/desaparecidos?page=${pageNum}&limit=50`;
      if (zonaId) url += `&zona_id=${zonaId}`;
      if (filterEstado) url += `&estado=${filterEstado}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      
      const res = await fetch(url);
      const resJson = await res.json();
      const newData = Array.isArray(resJson.data) ? resJson.data : [];
      
      setDesaparecidos(prev => replace ? newData : [...prev, ...newData]);
      setTotalPages(resJson.totalPages || 1);
      setPage(pageNum);

      // Fetch stats only on first load/search change
      if (replace) {
        const sRes = await fetch(`${API_URL}/desaparecidos/stats`);
        const sData = await sRes.json();
        setStats(sData);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchData(page + 1, false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
          Emergencia · Sismo del 24 de junio
        </span>
        <h1 className="title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Reconectemos a cada familia.
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0, maxWidth: '700px', lineHeight: 1.6 }}>
          Si no logras comunicarte con alguien, repórtalo. Si reconoces a alguien de los registros, márcalo como localizado para dar tranquilidad a su familia.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <StatCard value={stats.total || 0} label="Total reportes" color="#e2e8f0" icon={User} />
        <StatCard value={stats.sin_contacto || 0} label="Sin contacto" color="#f87171" icon={AlertTriangle} />
        <StatCard value={stats.localizados || 0} label="Localizados" color="#4ade80" icon={UserCheck} />
        <StatCard value={(stats.en_hospital || 0) + (stats.en_centro || 0)} label="En hospital / centro" color="#38bdf8" icon={Building2} />
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowReport(true)} style={{
          padding: '14px 28px', fontSize: '1rem', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
          borderRadius: '12px', border: 'none', color: 'white', cursor: 'pointer'
        }}>
          <Plus size={20} /> Reportar a alguien
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem', alignItems: 'center' }}>
        <Chip active={!filterEstado} color="#e2e8f0" label="Todos" onClick={() => setFilterEstado('')} />
        <Chip active={filterEstado === 'desaparecido'} color="#f87171" label="Sin contacto" dot onClick={() => setFilterEstado('desaparecido')} />
        <Chip active={filterEstado === 'encontrado_vivo'} color="#4ade80" label="Localizados" dot onClick={() => setFilterEstado('encontrado_vivo')} />
        <Chip active={filterEstado === 'en_hospital'} color="#38bdf8" label="En hospital" dot onClick={() => setFilterEstado('en_hospital')} />
        <Chip active={filterEstado === 'en_centro'} color="#c084fc" label="En centro" dot onClick={() => setFilterEstado('en_centro')} />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input type="text" className="input-field" placeholder="Buscar en BD..." value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', width: '220px', fontSize: '0.85rem' }} />
          </div>
          <ZonaFilter value={zonaId} onChange={setZonaId} />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}><AlertTriangle size={32} /></div>
          <p>Buscando en {stats.total || 43000}+ registros...</p>
        </div>
      ) : desaparecidos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <User size={48} style={{ color: '#475569', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'white' }}>No hay resultados</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>No se encontraron personas con los filtros seleccionados.</p>
          <button onClick={() => setShowReport(true)} style={{
            padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
          }}>
            <Plus size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
            Reportar a alguien
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {desaparecidos.map(p => (
              <div key={p.id} style={{
                background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(16px)',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative'
              }}>
                {/* Image */}
                {p.foto_url ? (
                  <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                    <img src={p.foto_url.startsWith('http') ? p.foto_url : `${BASE_URL}${p.foto_url}`} alt={p.nombre_completo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(15,23,42,1) 100%)' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}><StatusBadge estado={p.estado} rescatado={p.rescatado} /></div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                    <User size={40} style={{ color: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}><StatusBadge estado={p.estado} rescatado={p.rescatado} /></div>
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, marginTop: p.foto_url ? '-40px' : 0, zIndex: 2 }}>
                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 10px', color: 'white', fontWeight: '800' }}>{p.nombre_completo}</h3>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {p.edad && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.82rem' }}><Calendar size={13} style={{ color: '#60a5fa' }} /> {p.edad} años</span>}
                    {p.genero && p.genero !== 'otro' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.82rem' }}><User size={13} style={{ color: '#a78bfa' }} /> {p.genero}</span>}
                  </div>

                  {p.ultima_ubicacion && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '10px' }}>
                      <MapPin size={14} style={{ marginTop: '2px', color: '#f59e0b', flexShrink: 0 }} />
                      <span><strong>Últ. vez visto:</strong> {p.ultima_ubicacion} {p.zona_nombre && `(${p.zona_nombre})`}</span>
                    </div>
                  )}

                  {p.descripcion_fisica && (
                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                      {p.descripcion_fisica}
                    </p>
                  )}

                  {/* Contact */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: 'auto' }}>
                    {(p.contacto_familiar || p.telefono_contacto) && (
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>{p.contacto_familiar || 'Familiar no especificado'}</span>
                        {p.telefono_contacto && <a href={`tel:${p.telefono_contacto}`} style={{ color: '#4ade80', textDecoration: 'none', fontWeight: '600' }}>{p.telefono_contacto}</a>}
                      </div>
                    )}
                    {p.reportado_por && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Reportado por: {p.reportado_por}</span>
                    )}
                  </div>

                  {/* Found button */}
                  {p.estado === 'desaparecido' && (
                    <button onClick={(e) => { e.stopPropagation(); setFoundTarget(p); }} style={{
                      marginTop: '12px', padding: '10px', fontSize: '0.88rem', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                      color: '#4ade80', borderRadius: '10px', cursor: 'pointer', width: '100%'
                    }}>
                      <Heart size={16} /> Lo encontré
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button onClick={handleLoadMore} disabled={loadingMore} style={{
                padding: '12px 24px', fontSize: '0.95rem', fontWeight: '700',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', borderRadius: '20px', cursor: 'pointer',
                transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                {loadingMore ? 'Cargando...' : `Cargar más (Mostrando ${desaparecidos.length} de ${stats.total || 43000})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals — rendered via portal to escape CSS stacking contexts */}
      {showReport && createPortal(
        <ReportModal onClose={() => setShowReport(false)} onSuccess={() => fetchData(1, true)} />,
        document.body
      )}
      {foundTarget && createPortal(
        <FoundModal persona={foundTarget} onClose={() => setFoundTarget(null)} onSuccess={() => fetchData(1, true)} />,
        document.body
      )}
    </div>
  );
}
