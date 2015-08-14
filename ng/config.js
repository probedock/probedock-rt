var
  path = require('path'),
  rootPath = path.normalize(__dirname),
  dotenv = require('dotenv'),
  pkg = require('./package.json'),
  env = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV != 'docker') {
	dotenv.load();
}

var config = {
  development: {
    env: env,
    root: rootPath,
    app: {
      name: pkg.name,
      version: pkg.version,
      silenceAssetLogs: true
    },
    port: process.env.PORT || 1337,
    host: process.env.host || 'localhost'
  },

  test: {
    env: env,
    root: rootPath,
    app: {
      name: pkg.name,
      version: pkg.version,
      silenceAssetLogs: true
    },
    port: process.env.PORT || 1337,
    host: process.env.host || 'localhost'
  },

  production: {
    env: env,
    root: rootPath,
    app: {
      name: pkg.name,
      version: pkg.version,
      silenceAssetLogs: true
    },
    port: process.env.PORT || 1337,
    host: process.env.host || 'localhost'
  }
};

module.exports = config[env];
