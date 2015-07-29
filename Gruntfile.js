var request = require('request');

module.exports = function(grunt) {
  var reloadPort = 35728, files;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      banner:
        '/*\n' +
        ' * <%= pkg.name %> - v<%= pkg.version %>\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy-mm-dd") %> Probe Dock\n' +
        ' * <%= pkg.homepage %>\n' +
        ' */\n'
    },

    clean: {
      client: ['public']
    },

    develop: {
      server: {
        file: 'src/server/main.js'
      }
    },

    jshint: {
      server: ['src/server/main.js'],
      client: ['src/client/js/*.js']
    },

    rig: {
      client: {
        files: {
          'public/js/client.js': ['src/client/js/client.js']
        }
      }
    },

    compass: {
      client: {
        options: {
          cssDir: 'public/css',
					sassDir: 'src/client/scss'
        }
      }
    },

	  haml: {
      client: {
        files: {
          'public/index.html': 'src/client/haml/index.haml'
        }
      }
    },

    uglify: {
      options: {
        banner: '<%= meta.banner %>',
        mangle: {
          except: ['Backbone']
        }
      },
      client: {
        files: {
          'public/js/client.min.js': ['public/js/client.js']
        }
      }
    },

    copy: {
      client: {
        files: [
          { dest: 'public/js/', src: ['vendor/js/*.js'], flatten: true, expand: true },
          { dest: 'public/css/', src: ['vendor/css/*.css'], flatten: true, expand: true},
          { dest: 'public/img/', src: ['vendor/img/*'], flatten: true, expand: true},
					{ dest: 'public/font', src: ['vendor/font/*'], flatten: true, expand: true}
        ]
      }
    },

    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      all: {
        files: [
          'src/client/js/**/*.js',
          'src/client/scss/*.sccs',
          'src/client/haml/*.haml'
        ],
        tasks: [ 'client' ]
      }
    }
  });

  grunt.config.requires('watch.all.files');
 	files = grunt.config('watch.all.files');
 	files = grunt.file.expand(files);

 	grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
 		var done = this.async();
 		setTimeout(function () {
 			request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function (err, res) {
 				var reloaded = !err && res.statusCode === 200;
 				if (reloaded)
 					grunt.log.ok('Delayed live reload successful.');
 				else
 					grunt.log.error('Unable to make a delayed live reload.');
 				done(reloaded);
 			});
 		}, 500);
 	});

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-rigger');
  grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-haml');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-develop');

  grunt.registerTask('server', "Validate the server", ['jshint:server']);
  grunt.registerTask('client', "Clean, validate and build the client", ['clean:client', 'jshint:client', 'rig:client', 'uglify:client', 'compass:client', 'haml:client', 'copy:client']);
  grunt.registerTask('all', "Run the core, test and doc tasks", ['server', 'client']);

  grunt.registerTask('dev', 'Dev mode', [ 'all', 'develop', 'watch' ]);

  return grunt.registerTask('default', "Run the core tasks", [ 'server', 'client' ]);
};
