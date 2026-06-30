import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase, Activity } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '', email: '', password: '', rol: 'donante'
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData.nombre, formData.email, formData.password, formData.rol);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
      
      {/* Background glow effects */}
      <div style={{ position: 'fixed', top: '20%', right: '30%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '30%', width: '300px', height: '300px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ 
        width: '100%', maxWidth: '420px', 
        background: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(16px)', 
        WebkitBackdropFilter: 'blur(16px)', 
        border: '1px solid rgba(255,255,255,0.08)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginBottom: '1rem' }}>
            <Activity size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'white' }}>Crear Cuenta</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.95rem' }}>Únete para ayudar en la emergencia</p>
        </div>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', 
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#94a3b8', marginBottom: '6px' }}>
              <User size={14} /> Nombre Completo
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              required 
              placeholder="Ej: Ana María Silva"
              style={{ padding: '12px 16px', fontSize: '1rem', borderRadius: '12px' }}
            />
          </div>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#94a3b8', marginBottom: '6px' }}>
              <Mail size={14} /> Correo Electrónico
            </label>
            <input 
              type="email" 
              className="input-field" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              placeholder="tu@correo.com"
              style={{ padding: '12px 16px', fontSize: '1rem', borderRadius: '12px' }}
            />
          </div>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#94a3b8', marginBottom: '6px' }}>
              <Lock size={14} /> Contraseña
            </label>
            <input 
              type="password" 
              className="input-field" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
              placeholder="Crea una contraseña segura"
              style={{ padding: '12px 16px', fontSize: '1rem', borderRadius: '12px' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#94a3b8', marginBottom: '6px' }}>
              <Briefcase size={14} /> Tipo de Cuenta
            </label>
            <div style={{ position: 'relative', zIndex: 50 }}>
              <CustomSelect 
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value})}
                isSearchable={false}
                options={[
                  { value: 'donante', label: '👤 Donante (Persona natural)' },
                  { value: 'voluntario', label: '⛑️ Voluntario / Rescatista' },
                  { value: 'admin', label: '🛡️ Administrador' }
                ]}
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ 
            width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', 
            borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            marginTop: '0.5rem'
          }}>
            <UserPlus size={20} /> Crear Cuenta
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#60a5fa', fontWeight: '600', textDecoration: 'none', marginLeft: '4px' }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
