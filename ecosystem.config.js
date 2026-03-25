module.exports = {
  apps: [
    {
      name: 'crime-intelligence-backend',
      script: './server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
