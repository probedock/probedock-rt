var
  _ = require('underscore'),
  mincerEnvironment = require('../environment'),
  path = require('path');

module.exports = function(environment) {
  function rewriteExtension(source, ext) {
    var sourceExt = path.extname(source);
    return sourceExt ? source : source + ext;
  }

  function scriptTag(asset) {
    return '<script type="application/javascript" src="/assets/' + rewriteExtension(asset.digestPath, '.js') + '"></script>';
  }

  function stylesheetLink(asset) {
    return '<link rel="stylesheet" type="text/css" href="/assets/' + rewriteExtension(asset.digestPath, '.css') + '" />';
  }

  function developmentAssets(asset, tagFunc) {
    return _.reduce(asset.dependencies, function(memo, dependency) {
      var dependencyAsset = mincerEnvironment.findAsset(dependency.logicalPath);
      return memo + tagFunc(dependencyAsset);
    }, '');
  }

  function productionAssets(asset, tagFunc) {
    return tagFunc(asset);
  }

  var scriptsFunc = environment == (process.env.NODE_ENV || 'development') ? developmentAssets : productionAssets;

  return {
    js: function(logicalPath) {

      var asset = mincerEnvironment.findAsset(rewriteExtension(logicalPath, '.js'));
      if (!asset) {
        // Alert user if javascript asset is not found.
        return '<script type="application/javascript">alert("Javascript file ' +
               JSON.stringify(logicalPath).replace(/"/g, '\\"') +
               ' not found.")</script>';
      }

      return scriptsFunc(asset, scriptTag);
    },

    css: function(logicalPath) {

      var asset = mincerEnvironment.findAsset(rewriteExtension(logicalPath, '.css'));
      if (!asset) {
        // Alert user if stylesheet asset is not found.
        return '<script type="application/javascript">alert("Stylesheet file ' +
               JSON.stringify(logicalPath).replace(/"/g, '\\"') +
               ' not found.")</script>';
      }

      return scriptsFunc(asset, stylesheetLink);
    },

    assetPath: function(logicalPath) {

      var asset = mincerEnvironment.findAsset(logicalPath);
      if (!asset) {
        console.error("Asset " + JSON.stringify(logicalPath) + " not found.");
      }

      return asset ? "/assets/" + asset.digestPath : null;
    }
  };
};
