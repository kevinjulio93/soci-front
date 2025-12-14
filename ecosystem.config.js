module.exports = {
  apps: [
    {
      name: 'soci-front',
      script: 'serve',
      args: '-s dist -l 5000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
