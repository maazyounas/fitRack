// pm2/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: process.env.APP_NAME || 'fitrack-backend',
      script: 'dist/server.js',
      instances: 'max',      // cluster mode — use all CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      // Log management
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
