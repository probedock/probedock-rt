var
  path = require('path'),
  rootPath = path.normalize(__dirname),
  dotenv = require('dotenv'),
  pkg = require('./package.json'),
  env = process.env.NODE_ENV || 'development';

dotenv.load();

var config = {
  development: {
    root: rootPath,
    app: {
      name: pkg.name,
      version: pkg.version,
      silenceAssetLogs: true
    },
    port: process.env.PROBEDOCK_RT_PORT || 1337,
    host: process.env.PROBEDOCK_RT_HOST || 'localhost'
  },

  test: {
    root: rootPath,
    app: {
      name: pkg.name,
      version: pkg.version,
      silenceAssetLogs: true
    },
    port: process.env.PROBEDOCK_RT_PORT || 1338,
    host: process.env.PROBEDOCK_RT_HOST || 'localhost'
  },

  production: {
    root: rootPath,
    app: {
      name: pkg.name,
      version: pkg.version,
      silenceAssetLogs: true
    },
    port: process.env.PROBEDOCK_RT_PORT || 1337,
    host: process.env.PROBEDOCK_RT_HOST || 'localhost'
  }
};

module.exports = config[env];
