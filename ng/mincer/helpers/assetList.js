var _ = require('underscore');

module.exports = function(environment) {
  return function() {

    function assetFilter(file) {
      return file.match(/\.[^\.]+$/) && !file.match(/\.(?:css|js)$/);
    }

    var list = [];
    environment.eachLogicalPath([ assetFilter ], function(file) {
      list.push(file);
    });

    return _.map(list, function(file) {
      return {
        logicalPath: file,
        digestPath: environment.findAsset(file).digestPath
      };
    });
  };
};
