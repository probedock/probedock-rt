var ngAnnotate = require('ng-annotate');

module.exports = function(context, src) {
  if (src.match(/angular\.module\(('|")probedock\-rt('|"|\.|\-)/)) {
    // annotate probedock modules
    return ngAnnotate(src || '', { add: true, separator: require('os').EOL }).src;
  } else {
    // don't touch the rest
    return src;
  }
};
