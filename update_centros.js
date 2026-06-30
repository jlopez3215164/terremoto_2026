const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/pages/Centros.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add DonorsModal Component
const donorsModalCode = `
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
`;

content = content.replace('export default function Centros() {', donorsModalCode + '\nexport default function Centros() {');

// 2. Update DonationModal
// We need to rewrite DonationModal. We can just replace the whole function text.
// Use Regex to find DonationModal function block.
const donationModalRegex = /function DonationModal.*?return createPortal\(/s;
let newDonationModal = `function DonationModal({ centro, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    donante_nombre: '', telefono_donante: '', tipo_ayuda: '', cantidad: '', nota: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [needsData, setNeedsData] = useState([]);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const items = parseNeeds(centro.tipos_ayuda);
    setNeedsData(items);
    if (items.length > 0) {
      setFormData(prev => ({ ...prev, tipo_ayuda: items[0].insumo }));
    } else {
      setFormData(prev => ({ ...prev, tipo_ayuda: 'otro' }));
    }

    fetch(import.meta.env.MODE === 'development' ? 'http://localhost:3001/api/donaciones/public/centro/' + centro.id : '/api/donaciones/public/centro/' + centro.id)
      .then(res => res.json())
      .then(data => setDonations(data))
      .catch(console.error);
  }, [centro]);

  const getRemaining = (insumoName, requestedStr) => {
    const requested = parseInt(requestedStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (!requested) return null; // No numeric limit
    
    const donated = donations
      .filter(d => d.tipo_ayuda === insumoName)
      .reduce((sum, d) => sum + (parseInt(d.cantidad.replace(/[^0-9]/g, ''), 10) || 0), 0);
      
    return Math.max(0, requested - donated);
  };

  const selectedNeed = needsData.find(n => n.insumo === formData.tipo_ayuda);
  const remaining = selectedNeed ? getRemaining(selectedNeed.insumo, selectedNeed.cantidad) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (remaining !== null) {
      const donateAmount = parseInt(formData.cantidad.replace(/[^0-9]/g, ''), 10) || 0;
      if (donateAmount > remaining) {
        alert('La cantidad ingresada (' + donateAmount + ') supera el máximo restante de ' + remaining + '.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(\`\${API_URL}/donaciones/public\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centro_id: centro.id, ...formData })
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

  return createPortal(`;

content = content.replace(donationModalRegex, newDonationModal);

// 3. Update CustomSelect to options inside DonationModal
// Wait, CustomSelect is fine, we just need to pass dynamic options
// Let's replace the options block inside DonationModal's render
const oldSelect = /<CustomSelect\s+value=\{formData\.tipo_ayuda\}\s+onChange=\{e => setFormData\(\{\.\.\.formData, tipo_ayuda: e\.target\.value\}\)\}\s+options=\{\[\s*\{\s*value: 'alimentos',\s*label: '🍎 Alimentos'\s*\}.*?\]\}/s;

const newSelect = `<select 
                        value={formData.tipo_ayuda}
                        onChange={e => setFormData({...formData, tipo_ayuda: e.target.value})}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                      >
                        {needsData.length > 0 ? (
                          <>
                            {needsData.map(n => {
                              const rem = getRemaining(n.insumo, n.cantidad);
                              const remText = rem !== null ? \` (Faltan: \${rem})\` : \` (\${n.cantidad})\`;
                              return <option key={n.insumo} value={n.insumo} disabled={rem === 0}>{n.insumo}{remText}</option>;
                            })}
                            <option value="otro">📦 Otro insumo no listado</option>
                          </>
                        ) : (
                          <>
                            <option value="alimentos">🍎 Alimentos</option>
                            <option value="medicinas">💊 Medicinas</option>
                            <option value="ropa">👕 Ropa</option>
                            <option value="agua">💧 Agua</option>
                            <option value="materiales">🧱 Materiales</option>
                            <option value="otro">📦 Otro</option>
                          </>
                        )}
                      </select>`;

content = content.replace(oldSelect, newSelect);

const oldQuantity = /<input type="text" className="input-field" placeholder="Ej: 10 cajas"\s*style={{ paddingLeft: '36px', width: '100%' }}\s*value=\{formData.cantidad\}\s*onChange=\{e => setFormData\(\{\.\.\.formData, cantidad: e.target.value\}\)\}\s*\/>/;

const newQuantity = `<input type="text" className="input-field" placeholder={remaining !== null ? \`Máximo: \${remaining}\` : "Ej: 10 cajas"}
                      style={{ paddingLeft: '36px', width: '100%' }}
                      value={formData.cantidad}
                      onChange={e => setFormData({...formData, cantidad: e.target.value})}
                    />
                    {remaining !== null && (
                      <small style={{ color: '#fbbf24', fontSize: '0.7rem', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        Máx: {remaining}
                      </small>
                    )}`;

content = content.replace(oldQuantity, newQuantity);


// 4. Update CentroCard to add the Donors button
const onDonateBtn = /<button onClick=\{\(\) => onDonate\(centro\)\} className="btn btn-primary" style=\{\{/;

const newDonateBtn = `<div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-donors', { detail: centro.id }))} style={{
            flex: 1, padding: '10px', fontSize: '0.85rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer'
          }}>
            <User size={14} /> Ver Donantes
          </button>
          <button onClick={() => onDonate(centro)} className="btn btn-primary" style={{
            flex: 2, padding: '10px', fontSize: '0.9rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
            border: 'none', borderRadius: '8px',
            color: 'white', cursor: 'pointer'
          }}>
            <Heart size={16} /> Quiero Donar
          </button>
        </div>`;

content = content.replace(/<button onClick=\{\(\) => onDonate\(centro\)\} className="btn btn-primary" style=\{\{[\s\S]*?<\/button>/, newDonateBtn);


// 5. Add event listener for open-donors in Centros component
const centrosState = /const \[donatingTo, setDonatingTo\] = useState\(null\);/;
const newCentrosState = `const [donatingTo, setDonatingTo] = useState(null);
  const [viewingDonors, setViewingDonors] = useState(null);
  
  useEffect(() => {
    const handleOpenDonors = (e) => {
      const id = e.detail;
      const c = centros.find(x => x.id === id);
      if (c) setViewingDonors(c);
    };
    window.addEventListener('open-donors', handleOpenDonors);
    return () => window.removeEventListener('open-donors', handleOpenDonors);
  }, [centros]);`;
content = content.replace(centrosState, newCentrosState);


// 6. Render DonorsModal
const renderModals = /\{donatingTo && \(/;
const newRenderModals = `{viewingDonors && (
        <DonorsModal centro={viewingDonors} onClose={() => setViewingDonors(null)} />
      )}
      {donatingTo && (`;
content = content.replace(renderModals, newRenderModals);

// 7. Make sure React is used in DonorsModal
content = `import React from 'react';\n` + content;


fs.writeFileSync(file, content);
console.log('Update script executed.');
