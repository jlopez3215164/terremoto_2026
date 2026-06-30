import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Centros from './pages/Centros';
import Donaciones from './pages/Donaciones';
import Desaparecidos from './pages/Desaparecidos';
import Mapa from './pages/Mapa';
import Mapa3D from './pages/Mapa3D';
import MisCentros from './pages/MisCentros';
import AudioPlayer from './components/AudioPlayer';

// Rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <AudioPlayer />
      <div className="animate-fade-in">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/centros" element={<Centros />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/mapa3d" element={<Mapa3D />} />
          <Route path="/donaciones" element={<ProtectedRoute><Donaciones /></ProtectedRoute>} />
          <Route path="/mis-centros" element={<ProtectedRoute><MisCentros /></ProtectedRoute>} />
          <Route path="/desaparecidos" element={<Desaparecidos />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
