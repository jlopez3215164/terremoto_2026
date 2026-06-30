import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';
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
    <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Crear Cuenta</h2>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre Completo</label>
            <input 
              type="text" className="input-field" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" className="input-field" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" className="input-field" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Tipo de Cuenta</label>
            <div style={{ position: 'relative', zIndex: 50 }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 100 }} />
              <div style={{ paddingLeft: '32px' }}>
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
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <UserPlus size={18} /> Registrarse
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
