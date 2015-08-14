// Returns a function that can be applied to CSS content to make
// font paths work with the asset pipeline. By default, "../fonts/"
// is removed from the beginning of URLs, and sourcemap comments
// are removed.
module.exports = function(regexp, replacement) {
  regexp = regexp || /url\(("|')\.\.\/fonts\//g;
  replacement = replacement || 'url($1';
  return function(content) {
    return content
      .replace(regexp, replacement)
      .replace(/\/\*\#.*?\*\//, '');
  };
};
