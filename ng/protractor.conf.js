// Load the Probe Dock reporter.
var ProbeDockReporter = require('probedock-grunt-jasmine');

var config = require('./config.js');

exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'test/e2e/**/*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://' + config.host + ':' + config.port,

  // The jasmine framework is required.
  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  },

  // Add the Probe Dock reporter to the jasmine environment.
  onPrepare: function() {
    require('./server/app.js');

    jasmine.getEnv().addReporter(new ProbeDockReporter({
      // custom Probe Dock configuration
      config: {
        project: {
          category: 'Protractor'
        }
      }
    }));
  }
};
