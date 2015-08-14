module.exports = function(environment) {
  return function(context, src) {
    // process all relative URLs (not starting with /)
    return src.replace(/url\(("|')?([^\/][^'"\)]+)("|')?\)/g, function(match, openingQuote, url, closingQuote) {

      // get the logical path of the asset (remove any query param or hashbang)
      var logicalPath = url.replace(/\?.*/, '').replace(/\#.*/, '');

      // find it in the asset pipeline
      var asset = environment.findAsset(logicalPath);
      if (!asset) {
        throw new Error('Could not find asset ' + JSON.stringify(logicalPath) + '. Are you sure the path is correct? Paths must be relative to the asset load paths defined in "mincer/environment.js".');
      }

      // use its digest path
      var result = url.replace(/^([^\?\#]+)([\?\#]?)/, asset.digestPath + '$2');
      return 'url(' + (openingQuote || '') + '/assets/' + result + (closingQuote || '') + ')';
    });
  };
};
