var environment = require('./mincer/environment');

var files = [];

function assetFilter(file) {
  return file.match(/\.(?:js)$/);
}

environment.eachLogicalPath([ assetFilter ], function(file) {
  files.push(environment.findAsset(file).relativePath);
});

files.push('client/modules/**/*.spec.js');

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: files,

    preprocessors: {
      'public/**/*.html': 'html2js'
    },

    ngHtml2JsPreprocessor: {
      stripPrefix: 'client/'
    },

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
//
//
//module.exports = function(config) {
//  config.set
//    reporters: [ 'progress', 'coverage' ]
//
//    ngHtml2JsPreprocessor:
//      stripPrefix: 'app/views/'
//      stripSufix: '.slim'
//      prependPrefix: '/'
//
//    coverageReporter:
//      type : 'html',
//      dir : 'coverage/karma/'
//
//    basePath: '../../'
//
//    files: files
//
//    autoWatch: true
//
//    frameworks: [ 'jasmine' ]
//
//#    browsers: [ 'Firefox', 'Chrome' ]
//    browsers: [ 'Chrome' ]
//#    browsers: [ 'Firefox' ]
//
//    plugins: [
//      'karma-ng-html2js-preprocessor',
//      'karma-chrome-launcher',
//      'karma-firefox-launcher',
//      'karma-coverage',
//      'karma-jasmine'
//    ]
