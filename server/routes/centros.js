const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Listar centros de donación (opcionalmente filtrado por zona)
router.get('/', async (req, res) => {
  try {
    const { zona_id } = req.query;
    
    let query = `
      SELECT c.*, z.nombre as zona_nombre 
      FROM centros_donacion c
      LEFT JOIN zonas z ON c.zona_id = z.id
      WHERE c.activo = true
    `;
    const params = [];

    if (zona_id) {
      query += ' AND c.zona_id = ?';
      params.push(zona_id);
    }

    query += ' ORDER BY c.created_at DESC';

    const [centros] = await pool.query(query, params);
    res.json(centros);
  } catch (error) {
    console.error('Error al listar centros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear centro de donación
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      nombre, direccion, zona_id, latitud, longitud, 
      contacto, telefono, descripcion, tipos_ayuda 
    } = req.body;
    const usuario_id = req.user.id;

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'Nombre y dirección son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO centros_donacion 
       (nombre, direccion, zona_id, latitud, longitud, contacto, telefono, descripcion, tipos_ayuda, usuario_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, direccion, zona_id || null, latitud || null, longitud || null, 
        contacto || '', telefono || '', descripcion || '', tipos_ayuda || '', usuario_id
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Centro de donación registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar centro de donación
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, direccion, zona_id, latitud, longitud, 
      contacto, telefono, descripcion, tipos_ayuda 
    } = req.body;

    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Se requiere rol de admin' });
    }

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'Nombre y dirección son requeridos' });
    }

    const [result] = await pool.query(
      `UPDATE centros_donacion SET 
       nombre = ?, direccion = ?, zona_id = ?, latitud = ?, longitud = ?, 
       contacto = ?, telefono = ?, descripcion = ?, tipos_ayuda = ? 
       WHERE id = ?`,
      [
        nombre, direccion, zona_id || null, latitud || null, longitud || null, 
        contacto || '', telefono || '', descripcion || '', tipos_ayuda || '',
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    res.json({ message: 'Centro actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar (soft-delete) centro de donación
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Se requiere rol de admin' });
    }

    const [result] = await pool.query(
      `UPDATE centros_donacion SET activo = false WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    res.json({ message: 'Centro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
