module.exports = {
  apps: [{
    name: 'rec-ledger',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DOMAIN: 'rec-ledger.com'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      DOMAIN: 'rec-ledger.com'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};