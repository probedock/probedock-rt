var ProbeDockReporter = require('probedock-grunt-jasmine');

jasmine.getEnv().addReporter(new ProbeDockReporter({
  config: {
    project: {
      category: 'Unit'
    }
  }
}));
