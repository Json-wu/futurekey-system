module.exports = {
  apps: [{
    name: 'classroom',
    exec_mode: 'fork',
    namespace: 'myapp',
    script: './src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: "err.log",
    out_file: "out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm Z"
  }]
};