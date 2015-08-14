var _ = require('underscore'),
    fs = require('fs'),
    path = require('path');

var clientsRoot = path.join(__dirname, '..', '..', 'clients');

module.exports = function(clientName, baseModule) {

  var clientDir = path.join(clientsRoot, clientName);
  if (!fs.existsSync(clientDir)) {
    throw new Error('No angular client directory found at "' + clientDir + '".');
  }

  var modulesDir = path.join(clientDir, 'modules');
  var moduleNames = _.filter(fs.readdirSync(modulesDir), function(file) {
    return fs.existsSync(path.join(modulesDir, file, 'index.js'));
  });

  return _.map(moduleNames, function(name) {
    return baseModule + '.' + name;
  });
};
