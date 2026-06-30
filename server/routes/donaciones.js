const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Listar donaciones (con filtros)
router.get('/', async (req, res) => {
  try {
    const { zona_id, estado, tipo_ayuda } = req.query;
    
    let query = `
      SELECT d.*, c.nombre as centro_nombre, c.usuario_id as centro_usuario_id, z.nombre as zona_nombre 
      FROM donaciones d
      LEFT JOIN centros_donacion c ON d.centro_id = c.id
      LEFT JOIN zonas z ON c.zona_id = z.id
      WHERE 1=1
    `;
    const params = [];

    if (zona_id) {
      query += ' AND c.zona_id = ?';
      params.push(zona_id);
    }
    if (estado) {
      query += ' AND d.estado = ?';
      params.push(estado);
    }
    if (tipo_ayuda) {
      query += ' AND d.tipo_ayuda = ?';
      params.push(tipo_ayuda);
    }

    query += ' ORDER BY d.created_at DESC';

    const [donaciones] = await pool.query(query, params);
    res.json(donaciones);
  } catch (error) {
    console.error('Error al listar donaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar donaciones para un centro específico (solo para el admin del centro o superadmins)
router.get('/centro/:centroId', authMiddleware, async (req, res) => {
  try {
    const { centroId } = req.params;
    const usuario_id = req.user.id;
    const user_rol = req.user.rol;

    // Verificar propiedad del centro o rol admin
    const [centroCheck] = await pool.query(
      'SELECT id, usuario_id FROM centros_donacion WHERE id = ?',
      [centroId]
    );

    if (centroCheck.length === 0) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    if (centroCheck[0].usuario_id !== usuario_id && user_rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver las donaciones de este centro' });
    }

    const query = `
      SELECT d.*, c.nombre as centro_nombre, z.nombre as zona_nombre 
      FROM donaciones d
      LEFT JOIN centros_donacion c ON d.centro_id = c.id
      LEFT JOIN zonas z ON c.zona_id = z.id
      WHERE d.centro_id = ?
      ORDER BY d.created_at DESC
    `;

    const [donaciones] = await pool.query(query, [centroId]);
    res.json(donaciones);
  } catch (error) {
    console.error('Error al listar donaciones del centro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar nueva donación
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { centro_id, donante_nombre, tipo_ayuda, descripcion, cantidad } = req.body;
    const usuario_id = req.user.id;

    if (!centro_id || !donante_nombre || !tipo_ayuda) {
      return res.status(400).json({ error: 'Centro, nombre del donante y tipo de ayuda son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO donaciones 
       (centro_id, donante_nombre, tipo_ayuda, descripcion, cantidad, usuario_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [centro_id, donante_nombre, tipo_ayuda, descripcion || '', cantidad || '', usuario_id]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Donación registrada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear donación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Confirmar entrega de donación
router.put('/:id/confirmar', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { notas_entrega } = req.body;
    const confirmado_por = req.user.nombre; // El usuario logueado confirma

    const [result] = await pool.query(
      `UPDATE donaciones 
       SET estado = 'entregada', fecha_entrega = CURRENT_TIMESTAMP, confirmado_por = ?, notas_entrega = ? 
       WHERE id = ?`,
      [confirmado_por, notas_entrega || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }

    res.json({ message: 'Entrega de donación confirmada' });
  } catch (error) {
    console.error('Error al confirmar donación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Donar directamente (público, sin autenticación)
router.post('/public', async (req, res) => {
  try {
    const { centro_id, donante_nombre, tipo_ayuda, descripcion, cantidad, telefono_donante, nota, insumos } = req.body;

    if (!centro_id || !donante_nombre) {
      return res.status(400).json({ error: 'Centro y nombre del donante son requeridos' });
    }

    const descFull = [descripcion, nota ? `Nota: ${nota}` : '', telefono_donante ? `Tel: ${telefono_donante}` : '']
      .filter(Boolean).join(' | ');

    if (insumos && Array.isArray(insumos) && insumos.length > 0) {
      // Donación múltiple
      for (const item of insumos) {
        await pool.query(
          `INSERT INTO donaciones (centro_id, donante_nombre, tipo_ayuda, descripcion, cantidad) VALUES (?, ?, ?, ?, ?)`,
          [centro_id, donante_nombre, item.tipo || 'otro', descFull, item.cantidad || '']
        );
      }
      res.status(201).json({ message: 'Donaciones registradas exitosamente. ¡Gracias por tu ayuda!' });
    } else {
      // Donación simple (legacy)
      const [result] = await pool.query(
        `INSERT INTO donaciones (centro_id, donante_nombre, tipo_ayuda, descripcion, cantidad) VALUES (?, ?, ?, ?, ?)`,
        [centro_id, donante_nombre, tipo_ayuda || 'otro', descFull, cantidad || '']
      );
      res.status(201).json({ id: result.insertId, message: 'Donación registrada exitosamente. ¡Gracias por tu ayuda!' });
    }
  } catch (error) {
    console.error('Error al crear donación pública:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar donaciones públicamente (para mostrar donantes)
router.get('/public/centro/:centroId', async (req, res) => {
  try {
    const { centroId } = req.params;
    const [donaciones] = await pool.query(
      `SELECT id, donante_nombre, tipo_ayuda, cantidad, estado, created_at 
       FROM donaciones 
       WHERE centro_id = ?
       ORDER BY created_at DESC`,
      [centroId]
    );
    res.json(donaciones);
  } catch (error) {
    console.error('Error al listar donaciones públicas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

