const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Listar todas las zonas
router.get('/', async (req, res) => {
  try {
    const [zonas] = await pool.query('SELECT * FROM zonas WHERE activo = true ORDER BY nombre ASC');
    res.json(zonas);
  } catch (error) {
    console.error('Error al listar zonas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una zona por ID
router.get('/:id', async (req, res) => {
  try {
    const [zonas] = await pool.query('SELECT * FROM zonas WHERE id = ?', [req.params.id]);
    if (zonas.length === 0) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }
    res.json(zonas[0]);
  } catch (error) {
    console.error('Error al obtener zona:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva zona (requiere auth, idealmente admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, ciudad, estado_region, descripcion, nivel_afectacion } = req.body;

    if (!nombre || !ciudad || !estado_region) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO zonas (nombre, ciudad, estado_region, descripcion, nivel_afectacion) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, ciudad, estado_region, descripcion || '', nivel_afectacion || 'moderado']
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Zona creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear zona:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
