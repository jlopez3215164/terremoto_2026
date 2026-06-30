module.exports = {
  apps: [
    {
      name: 'terremoto-2026-api',
      script: './index.js',
      instances: 'max', // Utiliza todos los núcleos de la CPU
      exec_mode: 'cluster',
      autorestart: true,
      watch: false, // En producción no queremos reiniciar por cada cambio de archivo
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
