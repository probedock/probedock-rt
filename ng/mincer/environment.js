var
  _ = require('underscore'),
  mincer = require('mincer'),
  config = require('../config'),
  path = require('path');

// Configure Mincers logger, by default, all
// messages are going to the middle of nowhere
var logger = require('../server/logger')('mincer', { level: 'WARN' });
_.bindAll(logger, 'debug', 'info', 'warn', 'error');
mincer.logger.use(_.extend(logger, {
  log: function(level, message) {
    logger[level](message);
  }
}));

// Create and export environment
var environment = module.exports = new mincer.Environment(config.root);

// Enable source maps support
// environment.enable('source_maps');
// environment.sourceRoot = '/'; // use to cheat nesting level in dev tools

// Configure environment load paths (where to find assets).

// Assets in the "clients" directory can be referenced with relative paths starting from "clients",
// e.g. if the asset file is at "clients/modules/home/foo.png", use "modules/home/foo.png" as the path.
environment.appendPath(path.join(config.root, 'client'));

// Vendored assets in "vendor/fonts", "vendor/images", etc., can be referenced with relative paths from those directories,
// e.g. if the asset file is at "vendor/fonts/glyphicons.ttf", use "glyphicons.ttf" as the path.
environment.appendPath(path.join(config.root, 'vendor', 'assets'));

// Cache compiled assets.
//
// You want this to be enabled on your dev/staging/production environment.
// In order to enable it, uncomment following line. We keep it disabled in
// order to quick-test new features without bumping up Mincer's version.
environment.cache = new mincer.FileStore(path.join(config.root, 'cache'));

// Define environment essential *_path helper that will be available in the
// processed assets. See `assets/stylesheets/app.css.ejs` for example.
environment.ContextClass.defineAssetPath(function(pathname, options) {

  var asset = this.environment.findAsset(pathname, options);
  if (!asset) {
    throw new Error('File ' + pathname + ' not found');
  }

  return '/assets/' + asset.digestPath;
});

// Helper function that returns the list of non-CSS and non-JS assets.
// Each asset is an object with the following properties:
// * "logicalPath" (path relative to the load path);
// * "digestPath" (asset path including md5 digest).
environment.registerHelper('assetList', require('./helpers/assetList')(environment));

// Helper function that returns the server configuration.
environment.registerHelper('config', require('./helpers/config'));

// Helper function that returns the list of Angular modules in one of
// the client's modules directory. Only modules that have an index.js file
// are identified as such.
environment.registerHelper('listClientModules', require('./helpers/listClientModules'));

environment.enable('autoprefixer');

// Mincer rebuilt assets on any dependency file change. But sometime result
// depends on external variables: enviroment type, helper values and so one.
// In this case, you should change enviroment "version" - place there any
// unique string.
// enviroment.version = md5(JSON.stringify(your_version_object));

// Run application modules through ng-annotate (https://github.com/olov/ng-annotate):
environment.registerPostProcessor("application/javascript", "ng-annotate", require('./processors/ng-annotate'));

// Make sure relative URLs use asset paths with digests:
environment.registerPostProcessor("text/css", "asset-paths", require('./processors/assetify')(environment));

// Enable inline macros to embed compile-time variables into code,
// instead of using EJS and chaining extentions. Then you can write things like
//
//     var url = "$$ JSON.stringify(asset_path('my_file.js')) $$";
//
// You can set guard regexps as second param. Also you can pass multiple values
// via arrays.
mincer.MacroProcessor.configure([ '.js', '.css' ]);

// Prepare production-ready environment
if (process.env.NODE_ENV === 'production') {

  // Enable JS and CSS compression
  environment.jsCompressor  = 'uglify';
  // (!) use csswring, because csso does not supports sourcemaps
  environment.cssCompressor = 'csswring';

  // In production we assume that assets are not changed between requests,
  // so we use cached version of environment. See API docs for details.
  environment = environment.index;
}
