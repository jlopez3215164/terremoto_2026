const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/desaparecidos');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

// Estadísticas públicas
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(estado = 'desaparecido') as sin_contacto,
        SUM(estado = 'encontrado_vivo') as localizados,
        SUM(estado = 'en_hospital') as en_hospital,
        SUM(estado = 'en_centro') as en_centro,
        SUM(estado = 'encontrado_fallecido') as fallecidos
      FROM desaparecidos
    `);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar desaparecidos (con filtros) - PÚBLICO
router.get('/', async (req, res) => {
  try {
    const { zona_id, estado, rescatado, search, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT d.*, z.nombre as zona_nombre 
      FROM desaparecidos d
      LEFT JOIN zonas z ON d.zona_id = z.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM desaparecidos d
      WHERE 1=1
    `;
    const params = [];

    if (zona_id) {
      query += ' AND d.zona_id = ?';
      countQuery += ' AND d.zona_id = ?';
      params.push(zona_id);
    }
    if (estado) {
      query += ' AND d.estado = ?';
      countQuery += ' AND d.estado = ?';
      params.push(estado);
    }
    if (rescatado !== undefined) {
      const isRescatado = rescatado === 'true' || rescatado === '1' ? 1 : 0;
      query += ' AND d.rescatado = ?';
      countQuery += ' AND d.rescatado = ?';
      params.push(isRescatado);
    }
    if (search) {
      query += ' AND (d.nombre_completo LIKE ? OR d.ultima_ubicacion LIKE ?)';
      countQuery += ' AND (d.nombre_completo LIKE ? OR d.ultima_ubicacion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY d.created_at DESC';
    
    const parsedLimit = parseInt(limit) || 50;
    const parsedPage = parseInt(page) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    
    query += ' LIMIT ? OFFSET ?';

    const [desaparecidos] = await pool.query(query, [...params, parsedLimit, offset]);
    const [countResult] = await pool.query(countQuery, params);
    
    res.json({
      data: desaparecidos,
      total: countResult[0].count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(countResult[0].count / parsedLimit)
    });
  } catch (error) {
    console.error('Error al listar desaparecidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar persona desaparecida (autenticado)
router.post('/', authMiddleware, upload.single('foto'), async (req, res) => {
  try {
    const { 
      nombre_completo, edad, genero, descripcion_fisica, 
      ultima_ubicacion, zona_id, contacto_familiar, telefono_contacto, fecha_desaparicion 
    } = req.body;
    const usuario_id = req.user.id;
    
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/desaparecidos/${req.file.filename}`;
    }

    if (!nombre_completo || !zona_id) {
      return res.status(400).json({ error: 'Nombre y zona son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO desaparecidos 
       (nombre_completo, edad, genero, descripcion_fisica, ultima_ubicacion, zona_id, 
        contacto_familiar, telefono_contacto, fecha_desaparicion, foto_url, usuario_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_completo, edad || null, genero || 'otro', descripcion_fisica || '', 
        ultima_ubicacion || '', zona_id, contacto_familiar || '', telefono_contacto || '', 
        fecha_desaparicion || null, foto_url, usuario_id
      ]
    );

    res.status(201).json({
      id: result.insertId,
      foto_url,
      message: 'Reporte registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar desaparecido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reporte PÚBLICO de desaparecido (sin login)
router.post('/public', upload.single('foto'), async (req, res) => {
  try {
    const { 
      nombre_completo, edad, genero, descripcion_fisica, 
      ultima_ubicacion, zona_id, contacto_familiar, telefono_contacto,
      reportado_por, telefono_reportante
    } = req.body;
    
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/desaparecidos/${req.file.filename}`;
    }

    if (!nombre_completo || !ultima_ubicacion || !reportado_por) {
      return res.status(400).json({ error: 'Nombre, última ubicación y nombre del reportante son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO desaparecidos 
       (nombre_completo, edad, genero, descripcion_fisica, ultima_ubicacion, zona_id, 
        contacto_familiar, telefono_contacto, foto_url, reportado_por, telefono_reportante) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_completo, edad || null, genero || 'otro', descripcion_fisica || '', 
        ultima_ubicacion, zona_id || null, contacto_familiar || '', telefono_contacto || '', 
        foto_url, reportado_por, telefono_reportante || ''
      ]
    );

    res.status(201).json({
      id: result.insertId,
      foto_url,
      message: 'Reporte registrado exitosamente. Gracias por ayudar.'
    });
  } catch (error) {
    console.error('Error al registrar reporte público:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar como encontrado - PÚBLICO (sin login)
router.put('/public/:id/encontrado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, reportado_por, notas } = req.body;

    if (!reportado_por) {
      return res.status(400).json({ error: 'Nombre del reportante es requerido' });
    }

    const validStates = ['encontrado_vivo', 'en_hospital', 'en_centro'];
    const newEstado = validStates.includes(estado) ? estado : 'encontrado_vivo';

    const [result] = await pool.query(
      `UPDATE desaparecidos SET estado = ?, rescatado = 1, fecha_encontrado = CURRENT_TIMESTAMP, notas = CONCAT(COALESCE(notas,''), ?) WHERE id = ? AND estado = 'desaparecido'`,
      [newEstado, `\n[${new Date().toLocaleDateString()}] Reportado por ${reportado_por}: ${notas || 'Sin notas'}`, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado o ya fue marcado' });
    }

    res.json({ message: 'Estado actualizado. ¡Gracias por la información!' });
  } catch (error) {
    console.error('Error al actualizar estado público:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado (autenticado)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, rescatado, notas } = req.body;

    let updateQuery = 'UPDATE desaparecidos SET ';
    const updateParams = [];
    
    if (estado) {
      updateQuery += 'estado = ?, ';
      updateParams.push(estado);
      
      if (estado !== 'desaparecido') {
        updateQuery += 'fecha_encontrado = CURRENT_TIMESTAMP, ';
      }
    }
    
    if (rescatado !== undefined) {
      updateQuery += 'rescatado = ?, ';
      updateParams.push(rescatado);
    }
    
    if (notas) {
      updateQuery += 'notas = ?, ';
      updateParams.push(notas);
    }

    updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
    updateParams.push(id);

    const [result] = await pool.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
