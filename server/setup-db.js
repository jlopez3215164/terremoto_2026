const pool = require('./db');

async function setupDatabase() {
  console.log('🔌 Conectando a la base de datos...');

  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');

    // Tabla: usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'voluntario', 'donante') DEFAULT 'donante',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "usuarios" creada');

    // Tabla: zonas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS zonas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        ciudad VARCHAR(100) NOT NULL,
        estado_region VARCHAR(100) NOT NULL,
        descripcion TEXT,
        nivel_afectacion ENUM('leve', 'moderado', 'grave', 'critico') DEFAULT 'moderado',
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "zonas" creada');

    // Tabla: centros_donacion
    await connection.query(`
      CREATE TABLE IF NOT EXISTS centros_donacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        direccion VARCHAR(300) NOT NULL,
        zona_id INT,
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        contacto VARCHAR(100),
        telefono VARCHAR(20),
        descripcion TEXT,
        tipos_ayuda VARCHAR(500),
        activo BOOLEAN DEFAULT true,
        usuario_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "centros_donacion" creada');

    // Tabla: donaciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS donaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        centro_id INT,
        donante_nombre VARCHAR(150) NOT NULL,
        tipo_ayuda ENUM('alimentos', 'ropa', 'medicinas', 'agua', 'materiales', 'dinero', 'otro') DEFAULT 'otro',
        descripcion TEXT,
        cantidad VARCHAR(100),
        estado ENUM('pendiente', 'en_camino', 'entregada') DEFAULT 'pendiente',
        fecha_entrega TIMESTAMP NULL,
        confirmado_por VARCHAR(150),
        notas_entrega TEXT,
        usuario_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (centro_id) REFERENCES centros_donacion(id) ON DELETE SET NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "donaciones" creada');

    // Tabla: desaparecidos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS desaparecidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_completo VARCHAR(200) NOT NULL,
        edad INT,
        genero ENUM('masculino', 'femenino', 'otro') DEFAULT 'otro',
        descripcion_fisica TEXT,
        foto_url VARCHAR(500),
        ultima_ubicacion VARCHAR(300),
        zona_id INT,
        contacto_familiar VARCHAR(150),
        telefono_contacto VARCHAR(20),
        estado ENUM('desaparecido', 'encontrado_vivo', 'encontrado_fallecido') DEFAULT 'desaparecido',
        rescatado BOOLEAN DEFAULT false,
        fecha_desaparicion DATE,
        fecha_encontrado TIMESTAMP NULL,
        notas TEXT,
        usuario_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "desaparecidos" creada');

    connection.release();
    console.log('\n🎉 ¡Todas las tablas fueron creadas exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
