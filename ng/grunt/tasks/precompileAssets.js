var path = require('path');

// Please see the Grunt documentation for more information regarding task
// creation: http://gruntjs.com/creating-tasks
module.exports = function(grunt) {
  grunt.registerTask('precompileAssets', 'Compile JS and CSS assets with mincer', function() {
    require(path.join(__dirname, '..', '..', 'mincer', 'manifest'));
  });
};
