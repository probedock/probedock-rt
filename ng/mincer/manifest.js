var
  _ = require('underscore'),
  mincer = require('mincer'),
  path = require('path');

var environment = require('./environment');

// Create the asset manifest.
var root = path.resolve(path.join(__dirname, '..'));
var manifest = new mincer.Manifest(environment, path.join(root, 'public', 'assets'));

// Define the list of assets to compile.
// For javascripts and stylesheets, only the main asset bundles are included.
// Bundles then require the rest of the javascripts and stylesheets in the correct order.
var assetsToCompile = [ 'app.js', 'vendor.js', 'app.css' ];

// For other files such as images and fonts, compile any file found with the following extensions.
_.each([
  // images
  'jpg',
  'png',
  // fonts
  'eot',
  'svg',
  'ttf',
  'woff',
  'woff2'
], function(ext) {
  assetsToCompile.push('*.' + ext);
  assetsToCompile.push('**/*.' + ext);
});

try {
  // Compile the assets.
  var assetsData = manifest.compile(assetsToCompile, {
    compress: true
  });

  console.info('Assets were successfully compiled.\n' +
               'Manifest data (a proper JSON) was written to:\n' +
               manifest.path);
} catch (err) {
  console.error('Failed compile assets: ' + (err.message || err.toString()));
}
