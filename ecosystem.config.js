module.exports = {
  apps: [
    {
      name: 'soci-front',
      script: 'npx',
      args: ['serve', '-s', 'dist', '-p', '5000'],
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
