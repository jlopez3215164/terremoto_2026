const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar si el usuario ya existe
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar usuario
    const userRol = rol && ['admin', 'voluntario', 'donante'].includes(rol) ? rol : 'donante';
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, password_hash, userRol]
    );

    // Generar token
    const token = jwt.sign(
      { id: result.insertId, email, rol: userRol, nombre },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.insertId, nombre, email, rol: userRol }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil actual
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error en get me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
