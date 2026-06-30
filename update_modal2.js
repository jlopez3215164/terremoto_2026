const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/pages/Centros.jsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /function DonationModal[\s\S]*?(?=\nfunction AdminCentroModal)/;

const newModal = `function DonationModal({ centro, onClose, onSuccess }) {
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
          alert(\`La cantidad de \${need.insumo} supera el máximo faltante de \${rem}.\`);
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
      const res = await fetch(\`\${API_URL}/donaciones/public\`, {
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
        <style>{\`
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .insumo-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; margin-bottom: 8px; transition: all 0.2s; }
          .insumo-card.active { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .insumo-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; }
        \`}</style>
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
                        <div key={need.insumo} className={\`insumo-card \${isSelected ? 'active' : ''}\`} style={{ opacity: isCompleted ? 0.5 : 1 }}>
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
                                {rem !== null && <span style={{ color: isCompleted ? '#22c55e' : '#fbbf24', marginLeft: '6px' }}>{isCompleted ? '(¡Completado!)' : \`(Faltan: \${rem})\`}</span>}
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
                <div className={\`insumo-card \${otroInsumo.checked ? 'active' : ''}\`}>
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
}`

content = content.replace(regex, newModal);
fs.writeFileSync(file, content);
console.log('Update 2 done.');
