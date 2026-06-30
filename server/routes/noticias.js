const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/centros');
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

// Obtener todas las noticias
router.get('/', async (req, res) => {
  try {
    const [noticias] = await pool.query(
      `SELECT n.id, n.titulo, n.resumen, n.imagenes, n.created_at, u.nombre as autor
       FROM noticias n
       JOIN usuarios u ON n.autor_id = u.id
       ORDER BY n.created_at DESC`
    );
    // Parsear imagenes si vienen como string JSON
    const noticiasParsed = noticias.map(n => ({
      ...n,
      imagenes: typeof n.imagenes === 'string' ? JSON.parse(n.imagenes) : (n.imagenes || [])
    }));
    res.json(noticiasParsed);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva noticia (solo admin)
router.post('/', authMiddleware, upload.array('imagenes', 5), async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Solo los administradores pueden publicar noticias.' });
    }

    const { titulo, resumen } = req.body;
    const autor_id = req.user.id;

    if (!titulo || !resumen) {
      return res.status(400).json({ error: 'Título y resumen son requeridos' });
    }

    // Recopilar rutas de imágenes subidas
    const imagenes = req.files ? req.files.map(file => `/uploads/centros/${file.filename}`) : [];
    const imagenesJson = JSON.stringify(imagenes);

    const [result] = await pool.query(
      `INSERT INTO noticias (titulo, resumen, imagenes, autor_id) VALUES (?, ?, ?, ?)`,
      [titulo, resumen, imagenesJson, autor_id]
    );

    res.status(201).json({
      message: 'Noticia publicada exitosamente',
      noticiaId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar noticia (solo admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM noticias WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    res.json({ message: 'Noticia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
