module.exports = function(grunt) {
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-rigger');
  grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-haml');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('server', "Validate the server", ['jshint:server']);
  grunt.registerTask('client', "Clean, validate and build the client", ['clean:client', 'jshint:client', 'rig:client', 'uglify:client', 'compass:client', 'haml:client', 'copy:client']);
  grunt.registerTask('all', "Run the core, test and doc tasks", ['server', 'client']);

  return grunt.registerTask('default', "Run the core tasks", ['server', 'client']);
};
