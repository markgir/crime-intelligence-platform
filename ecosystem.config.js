module.exports = {
  apps: [
    {
      name: 'crime-intelligence-backend',
      script: './backend/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
