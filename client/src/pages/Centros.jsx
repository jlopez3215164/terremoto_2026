import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchWithAuth, API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ZonaFilter from '../components/ZonaFilter';
import CustomSelect from '../components/CustomSelect';
import MapPicker from '../components/MapPicker';
import DesaparecidosSlider from '../components/DesaparecidosSlider';
import { 
  MapPin, Phone, User, Package, Heart, ChevronDown, ChevronUp, 
  Search, Send, X, AlertCircle, CheckCircle2, Building2, Clock, Edit, Plus, Trash2, PlusCircle, Image as ImageIcon
} from 'lucide-react';

const BASE_URL = API_URL.replace('/api', '');

// Helper: parse tipos_ayuda from DB (supports legacy CSV and new JSON format)
function parseNeeds(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy: comma-separated string
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(item => ({ insumo: item, cantidad: '' }));
}

// Helper: serialize needs array to JSON string for DB
function serializeNeeds(needs) {
  return JSON.stringify(needs.filter(n => n.insumo.trim()));
}

const CATEGORIAS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'alimentos', label: '🍎 Alimentos' },
  { value: 'medicinas', label: '💊 Medicinas' },
  { value: 'ropa', label: '👕 Ropa' },
  { value: 'agua', label: '💧 Agua' },
  { value: 'materiales', label: '🧱 Materiales' },
  { value: 'otro', label: '📦 Otro' },
];

function NeedsBadge({ tipo }) {
  const badges = {
    hospital_centro_medico: { bg: 'rgba(6,182,212,0.15)', color: '#22d3ee', label: '🏥 Hospital' },
    refugio: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', label: '🏠 Refugio' },
    ong: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: '🤝 ONG' },
    voluntarios: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: '🙋 Voluntarios' },
    lugar_afectado: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: '⚠️ Lugar Afectado' },
    centro_acopio: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: '📦 Centro de Acopio' },
  };
  const b = badges[tipo] || { bg: 'rgba(255,255,255,0.1)', color: '#94a3b8', label: tipo };
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: b.bg, color: b.color, padding: '4px 10px', borderRadius: '6px',
      fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase',
      border: `1px solid ${b.color}33`
    }}>
      {b.label}
    </span>
  );
}

function NeedsList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map((item, i) => {
        const name = typeof item === 'string' ? item : item.insumo;
        const qty = typeof item === 'string' ? '' : item.cantidad;
        return (
          <li key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.85rem', transition: 'background 0.15s',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
              background: qty ? '#f87171' : '#4ade80',
            }} />
            <span style={{ flex: 1, color: '#e2e8f0' }}>{name}</span>
            {qty && (
              <span style={{ 
                fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
              }}>
                {qty}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DonationModal({ centro, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ donante_nombre: '', telefono_donante: '', nota: '' });
  const [selectedInsumos, setSelectedInsumos] = useState({});
  const [otroInsumo, setOtroInsumo] = useState({ checked: false, nombre: '', cantidad: '' });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsData, setNeedsData] = useState([]);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const items = parseNeeds(centro.tipos_ayuda);
    setNeedsData(items);

    fetch(import.meta.env.MODE === 'development' ? 'http://localhost:3001/api/donaciones/public/centro/' + centro.id : '/api/donaciones/public/centro/' + centro.id)
      .then(res => res.json())
      .then(data => setDonations(data))
      .catch(console.error);
  }, [centro]);

  const getRemaining = (insumoName, requestedStr) => {
    const requested = parseInt(requestedStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (!requested) return null;
    const donated = donations
      .filter(d => d.tipo_ayuda === insumoName)
      .reduce((sum, d) => sum + (parseInt(d.cantidad.replace(/[^0-9]/g, ''), 10) || 0), 0);
    return Math.max(0, requested - donated);
  };

  const handleInsumoChange = (insumo, cantidad) => {
    setSelectedInsumos(prev => {
      if (!cantidad) {
        const copy = { ...prev };
        delete copy[insumo];
        return copy;
      }
      return { ...prev, [insumo]: cantidad };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar limites
    for (const need of needsData) {
      const cant = selectedInsumos[need.insumo];
      if (cant) {
        const rem = getRemaining(need.insumo, need.cantidad);
        if (rem !== null && parseInt(cant, 10) > rem) {
          alert(`La cantidad de ${need.insumo} supera el máximo faltante de ${rem}.`);
          return;
        }
      }
    }

    const insumosPayload = [];
    Object.entries(selectedInsumos).forEach(([tipo, cantidad]) => {
      insumosPayload.push({ tipo, cantidad });
    });

    if (otroInsumo.checked && otroInsumo.nombre && otroInsumo.cantidad) {
      insumosPayload.push({ tipo: otroInsumo.nombre, cantidad: otroInsumo.cantidad });
    }

    if (insumosPayload.length === 0) {
      alert('Por favor selecciona al menos un insumo para donar.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/donaciones/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centro_id: centro.id, ...formData, insumos: insumosPayload })
      });
      if (!res.ok) throw new Error('Error al registrar donación');
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .insumo-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; margin-bottom: 8px; transition: all 0.2s; }
          .insumo-card.active { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .insumo-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; }
        `}</style>
        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={56} style={{ color: '#4ade80', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>¡Donación Registrada!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Gracias por tu valioso aporte a <strong>{centro.nombre}</strong></p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={20} style={{ color: '#f87171' }} /> Haz tu donación
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Centro: <strong style={{color:'white'}}>{centro.nombre}</strong></p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Información Personal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} style={{color:'#60a5fa'}}/> Tus datos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Nombre *</label>
                    <input type="text" required className="input-field" placeholder="Ej: María García" value={formData.donante_nombre} onChange={e => setFormData({...formData, donante_nombre: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Teléfono (opcional)</label>
                    <input type="text" className="input-field" placeholder="04XX-XXXXXXX" value={formData.telefono_donante} onChange={e => setFormData({...formData, telefono_donante: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Selección de Insumos */}
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={18} style={{color:'#f59e0b'}}/> ¿Qué deseas donar?
                </h3>
                
                {needsData.length > 0 && (
                  <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {needsData.map(need => {
                      const rem = getRemaining(need.insumo, need.cantidad);
                      const isCompleted = rem === 0;
                      const isSelected = !!selectedInsumos[need.insumo];
                      
                      return (
                        <div key={need.insumo} className={`insumo-card ${isSelected ? 'active' : ''}`} style={{ opacity: isCompleted ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                              type="checkbox" className="insumo-checkbox"
                              disabled={isCompleted}
                              checked={isSelected}
                              onChange={e => handleInsumoChange(need.insumo, e.target.checked ? '1' : '')}
                            />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: '600', color: isCompleted ? '#64748b' : 'white', fontSize: '0.95rem' }}>{need.insumo}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                                Solicitado: {need.cantidad} 
                                {rem !== null && <span style={{ color: isCompleted ? '#22c55e' : '#fbbf24', marginLeft: '6px' }}>{isCompleted ? '(¡Completado!)' : `(Faltan: ${rem})`}</span>}
                              </p>
                            </div>
                            {isSelected && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cant:</label>
                                <input 
                                  type="number" min="1" max={rem !== null ? rem : undefined} className="input-field"
                                  style={{ width: '80px', padding: '6px 10px', textAlign: 'center' }}
                                  value={selectedInsumos[need.insumo] || ''}
                                  onChange={e => handleInsumoChange(need.insumo, e.target.value)}
                                  placeholder="0" autoFocus
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Otro Insumo */}
                <div className={`insumo-card ${otroInsumo.checked ? 'active' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" className="insumo-checkbox"
                      checked={otroInsumo.checked}
                      onChange={e => setOtroInsumo({...otroInsumo, checked: e.target.checked})}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '600', color: 'white', fontSize: '0.95rem' }}>Otro insumo</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Quiero donar algo que no está en la lista</p>
                    </div>
                  </div>
                  {otroInsumo.checked && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginTop: '12px', paddingLeft: '30px' }}>
                      <input 
                        type="text" className="input-field" placeholder="¿Qué vas a donar?"
                        value={otroInsumo.nombre} onChange={e => setOtroInsumo({...otroInsumo, nombre: e.target.value})}
                        style={{ padding: '8px 12px' }} autoFocus required
                      />
                      <input 
                        type="text" className="input-field" placeholder="Cant."
                        value={otroInsumo.cantidad} onChange={e => setOtroInsumo({...otroInsumo, cantidad: e.target.value})}
                        style={{ padding: '8px 12px' }} required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Nota */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Mensaje para el centro (opcional)</label>
                <textarea className="input-field" rows="2" placeholder="Ej: Pasaré a dejarlo hoy por la tarde..."
                  value={formData.nota} onChange={e => setFormData({...formData, nota: e.target.value})}
                  style={{ resize: 'vertical', width: '100%' }}
                />
              </div>

              {/* Alertas del Centro */}
              {(centro.telefono || centro.contacto) && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <AlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600' }}>Importante: Coordina la entrega</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      Al finalizar, comunícate al {centro.telefono || centro.contacto} para avisar que vas en camino.
                    </p>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{
                padding: '14px', fontSize: '1.05rem', fontWeight: '700', gap: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: submitting ? '#475569' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(59, 130, 246, 0.3)',
                borderRadius: '12px'
              }}>
                <Send size={18} />
                {submitting ? 'Enviando...' : 'Confirmar Donación'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function DonorsModal({ centro, onClose }) {
  const [donors, setDonors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(import.meta.env.MODE === 'development' ? 'http://localhost:3001/api/donaciones/public/centro/' + centro.id : '/api/donaciones/public/centro/' + centro.id)
      .then(res => res.json())
      .then(data => {
        setDonors(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [centro.id]);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}><Heart size={18} style={{ color: '#f87171', marginRight: '8px' }}/>Donantes Recientes</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16}/></button>
        </div>
        {loading ? <p>Cargando donantes...</p> : donors.length === 0 ? <p>Aún no hay donantes registrados.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {donors.map(d => (
              <div key={d.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{d.donante_nombre}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>Donó: {d.cantidad} {d.tipo_ayuda}</p>
                <small style={{ color: '#64748b' }}>{new Date(d.created_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>, document.body
  );
}

export default function Centros() {
  const [centros, setCentros] = useState([]);
  const [zonaId, setZonaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [donatingTo, setDonatingTo] = useState(null);
  const [viewingDonors, setViewingDonors] = useState(null);
  
  useEffect(() => {
    const handleOpenDonors = (e) => {
      const id = e.detail;
      const c = centros.find(x => x.id === id);
      if (c) setViewingDonors(c);
    };
    window.addEventListener('open-donors', handleOpenDonors);
    return () => window.removeEventListener('open-donors', handleOpenDonors);
  }, [centros]);
  const [adminCentroModal, setAdminCentroModal] = useState(false);
  const [centroToEdit, setCentroToEdit] = useState(null);
  
  const { user } = useAuth();
  const isAdmin = user && user.rol === 'admin';
  const canManage = user && (user.rol === 'admin' || user.rol === 'afectado');

  const fetchCentros = async () => {
    setLoading(true);
    try {
      const url = zonaId ? `/centros?zona_id=${zonaId}` : '/centros';
      const data = await fetchWithAuth(url);
      setCentros(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentros();
  }, [zonaId]);

  const handleDeleteCentro = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este centro de acopio?')) {
      try {
        await fetchWithAuth(`/centros/${id}`, { method: 'DELETE' });
        fetchCentros();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const filtered = centros.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const needsText = parseNeeds(c.tipos_ayuda).map(n => n.insumo).join(' ').toLowerCase();
    return c.nombre.toLowerCase().includes(term) || 
           c.direccion?.toLowerCase().includes(term) ||
           c.contacto?.toLowerCase().includes(term) ||
           needsText.includes(term);
  });

  // Sort: centers with needs first
  const sorted = [...filtered].sort((a, b) => {
    const aHasNeeds = parseNeeds(a.tipos_ayuda).length > 0;
    const bHasNeeds = parseNeeds(b.tipos_ayuda).length > 0;
    if (aHasNeeds && !bHasNeeds) return -1;
    if (!aHasNeeds && bHasNeeds) return 1;
    return 0;
  });

  return (
    <div>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0.05) 25%, rgba(37,99,235,0.1) 40%, rgba(37,99,235,0.1) 60%, rgba(220,38,38,0.05) 75%, rgba(220,38,38,0.15) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem 0',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Building2 size={28} style={{ color: '#f59e0b' }} />
              <h1 className="title" style={{ fontSize: '2rem', margin: 0 }}>Centros de Ayuda</h1>
            </div>
            <p className="subtitle" style={{ margin: 0, maxWidth: '600px' }}>
              Encuentra centros activos, revisa lo que necesitan y dona directamente. Tu ayuda salva vidas.
            </p>
          </div>
          {canManage && (
            <button onClick={() => { setCentroToEdit(null); setAdminCentroModal(true); }} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Añadir Centro
            </button>
          )}
        </div>
      </div>

      {/* Desaparecidos Ticker */}
      <DesaparecidosSlider />

      {/* Filters bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 0',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem',
          display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text" placeholder="Buscar por nombre, insumos que necesitan o contacto..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-field" style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
          <ZonaFilter value={zonaId} onChange={setZonaId} />
          {(searchTerm || zonaId) && (
            <button onClick={() => { setSearchTerm(''); setZonaId(''); }} style={{
              background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap',
            }}>Limpiar filtros</button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <div style={{
          display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} /> <strong style={{ color: '#e2e8f0' }}>{sorted.length}</strong> centros activos
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} style={{ color: '#f59e0b' }} /> 
            <strong style={{ color: '#e2e8f0' }}>
              {sorted.filter(c => parseNeeds(c.tipos_ayuda).length > 0).length}
            </strong> con necesidades activas
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass-panel" style={{ height: '300px', opacity: 0.5 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '20px', width: '70%', borderRadius: '4px', marginBottom: '12px' }} />
                <div style={{ background: 'rgba(255,255,255,0.04)', height: '14px', width: '90%', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ background: 'rgba(255,255,255,0.04)', height: '14px', width: '60%', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Search size={48} style={{ color: '#475569', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No se encontraron centros</h3>
            <p style={{ color: 'var(--text-muted)' }}>Intenta cambiando los filtros o la búsqueda.</p>
            {(searchTerm || zonaId) && (
              <button onClick={() => { setSearchTerm(''); setZonaId(''); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Ver todos los centros
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
            {sorted.map(centro => (
              <CentroCard 
                key={centro.id} 
                centro={centro} 
                onDonate={setDonatingTo} 
                isAdmin={isAdmin}
                canManage={canManage}
                currentUser={user}
                onEdit={c => { setCentroToEdit(c); setAdminCentroModal(true); }}
                onDelete={handleDeleteCentro}
              />
            ))}
          </div>
        )}
      </div>

      {/* Donation modal */}
      {viewingDonors && (
        <DonorsModal centro={viewingDonors} onClose={() => setViewingDonors(null)} />
      )}
      {donatingTo && (
        <DonationModal 
          centro={donatingTo} 
          onClose={() => setDonatingTo(null)}
          onSuccess={() => {}}
        />
      )}
      
      {/* Admin modal */}
      {adminCentroModal && (
        <AdminCentroModal 
          centro={centroToEdit} 
          onClose={() => { setAdminCentroModal(false); setCentroToEdit(null); }}
          onSuccess={() => { fetchCentros(); }}
        />
      )}
    </div>
  );
}
