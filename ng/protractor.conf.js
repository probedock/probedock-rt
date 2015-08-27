// Load the Probe Dock reporter.
var ProbeDockReporter = require('probedock-grunt-jasmine');

var config = require('./config.js');

exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'test/e2e/**/*.js'
  ],

  capabilities: {
    browserName: 'chrome'
    //'browserName': 'phantomjs',
    //'phantomjs.binary.path': require('phantomjs2').path,
    //'phantomjs.ghostdriver.cli.args': ['--loglevel=DEBUG']
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

    beforeEach(function() {
      this.addMatchers(require('./test/e2e/matchers.js'));
    });
  }
};
