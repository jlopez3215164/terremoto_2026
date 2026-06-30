require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Rutas
const authRoutes = require('./routes/auth');
const zonasRoutes = require('./routes/zonas');
const centrosRoutes = require('./routes/centros');
const donacionesRoutes = require('./routes/donaciones');
const desaparecidosRoutes = require('./routes/desaparecidos');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/centros', centrosRoutes);
app.use('/api/donaciones', donacionesRoutes);
app.use('/api/desaparecidos', desaparecidosRoutes);

// Servir el frontend de React (sitio estático en producción)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Ruta catch-all para que React Router maneje las rutas del frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
