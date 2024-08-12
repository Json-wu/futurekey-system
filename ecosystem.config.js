module.exports = {
    apps : [{
      name: 'futurekey-system',
      namespace:'myapp',
      script: './src/app.js',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
    }]
  };