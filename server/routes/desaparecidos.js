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
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

// Listar desaparecidos (con filtros)
router.get('/', async (req, res) => {
  try {
    const { zona_id, estado, rescatado } = req.query;
    
    let query = `
      SELECT d.*, z.nombre as zona_nombre 
      FROM desaparecidos d
      LEFT JOIN zonas z ON d.zona_id = z.id
      WHERE 1=1
    `;
    const params = [];

    if (zona_id) {
      query += ' AND d.zona_id = ?';
      params.push(zona_id);
    }
    if (estado) {
      query += ' AND d.estado = ?';
      params.push(estado);
    }
    if (rescatado !== undefined) {
      // Convertir 'true'/'false' a booleano de BD
      const isRescatado = rescatado === 'true' || rescatado === '1' ? 1 : 0;
      query += ' AND d.rescatado = ?';
      params.push(isRescatado);
    }

    query += ' ORDER BY d.created_at DESC';

    const [desaparecidos] = await pool.query(query, params);
    res.json(desaparecidos);
  } catch (error) {
    console.error('Error al listar desaparecidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar persona desaparecida
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

// Actualizar estado (encontrado, rescatado, etc.)
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

    // Remover la coma final y añadir WHERE
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
