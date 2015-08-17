module.exports = function(grunt) {

  var environment = process.env.NODE_ENV || 'development';

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    bump: {
      options: {
        files: [ 'bower.json', 'package.json' ],
        commit: false,
        createTag: false,
        push: false
      }
    },

    clean: {
      cache: [ 'cache/**/*' ],
      public: [ 'public/**/*', '!public/favicon.ico' ],
      test: [ '.tmp/test' ]
    },

    copy: {
      assets: {
        files: [
          // javascripts
          { nonull: true, src: 'bower_components/underscore/underscore.js', dest: 'vendor/assets/javascripts/underscore.js' },
          { nonull: true, src: 'bower_components/jquery/dist/jquery.js', dest: 'vendor/assets/javascripts/jquery.js' },
          { nonull: true, src: 'bower_components/moment/moment.js', dest: 'vendor/assets/javascripts/moment.js' },
          { nonull: true, src: 'bower_components/moment/locale/fr.js', dest: 'vendor/assets/javascripts/moment-fr.js' },
          { nonull: true, src: 'bower_components/socket.io-client/socket.io.js', dest: 'vendor/assets/javascripts/socket-io-client.js' },
          { nonull: true, src: 'bower_components/angular/angular.js', dest: 'vendor/assets/javascripts/angular.js' },
          { nonull: true, src: 'bower_components/angular-bootstrap/ui-bootstrap.js', dest: 'vendor/assets/javascripts/ui-bootstrap.js' },
          { nonull: true, src: 'bower_components/angular-bootstrap/ui-bootstrap-tpls.js', dest: 'vendor/assets/javascripts/ui-bootstrap-tpls.js' },
          { nonull: true, src: 'bower_components/angular-ui-router/release/angular-ui-router.js', dest: 'vendor/assets/javascripts/angular-ui-router.js' },
          { nonull: true, src: 'bower_components/angular-moment/angular-moment.js', dest: 'vendor/assets/javascripts/angular-moment.js' },
          { nonull: true, src: 'bower_components/angular-socket-io/socket.js', dest: 'vendor/assets/javascripts/angular-socket-io.js' },
          { nonull: true, src: 'bower_components/angular-translate/angular-translate.js', dest: 'vendor/assets/javascripts/angular-translate.js' },
          { nonull: true, src: 'bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js', dest: 'vendor/assets/javascripts/angular-translate-loader-static-files.js' },

          //{ nonull: true, src: 'bower_components/gsap/src/uncompressed/TweenMax.js', dest: 'vendor/assets/javascripts/tween-max.js' },
          //{ nonull: true, src: 'bower_components/angular-animate/angular-animate.js', dest: 'vendor/assets/javascripts/angular-animate.js' },
          //{ nonull: true, src: 'bower_components/a0-angular-storage/dist/angular-storage.js', dest: 'vendor/assets/javascripts/angular-storage.js' },
          //{ nonull: true, src: 'bower_components/angular-gsapify-router/angular-gsapify-router.js', dest: 'vendor/assets/javascripts/angular-gsapify-router.js' },
          //{ nonull: true, src: 'bower_components/angular-repeat-n/dist/angular-repeat-n.js', dest: 'vendor/assets/javascripts/angular-ng-repeat-n.js' },

          // stylesheets (if the stylesheet has relative URLs, use "assetsWithRelativeUrls" below)

          // fonts
          { nonull: true, cwd: 'bower_components/bootstrap/dist/fonts/', src: '**', dest: 'vendor/assets/fonts/', flatten: true, expand: true }
          //{ nonull: true, cwd: 'bower_components/mdi/fonts/', src: '**', dest: 'vendor/assets/fonts/', flatten: true, expand: true }
        ]
      },

      // stylesheets with relative URLs (that need to be fixed to work with the asset pipeline)
      assetsWithRelativeUrls: {
        files: [
          { nonull: true, cwd: 'bower_components/bootstrap/dist/css', src: ['bootstrap.css', 'bootstrap-theme.css'], dest: 'vendor/assets/stylesheets', expand: true }
        ],
        options: {
          process: require('./grunt/lib/cssAssetPipelinePreprocessor')()
        }
      }
    },

    //ensureProduction: {},

    jade: {
      precompile: {
        options: {
          data: function() {
            return require('./mincer/helpers/templates')(environment);
          },
          pretty: true
        },
        files: [
          {
            expand: true,
            src: [ '**/*.jade', '!error.jade' ],
            dest: 'public/',
            cwd: 'client',
            ext: '.html'
          }
        ]
      }
    },

    prettify: {
      precompile: {
        options: {
          config: '.prettifyrc'
        },
        files: [{
          expand: true,
          cwd: 'public/',
          ext: '.html',
          src: [ '**/*.html' ],
          dest: 'public/'
        }]
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },

    jshint: {
      all: [ 'Gruntfile.js', 'client/**/*.js', 'grunt/**/*.js', 'mincer/**/*.js', 'server/**/*.js' ]
    },

    precompileAssets: {},

    //precompileYamlFiles: {},

    run: {
      deploy: {
        exec: 'node server/app.js'
      },
      develop: {
        exec: 'nodemon server/app.js'
      }
    }
  });

  grunt.loadTasks('grunt/tasks');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-prettify');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', [ 'jshint' ]);
  grunt.registerTask('deploy', [ 'precompile', 'run:deploy' ]);
  grunt.registerTask('dev', [ 'clean:cache', 'run:develop' ]);
  grunt.registerTask('unit', [ 'clean:test', 'karma:unit' ]);
  grunt.registerTask('precompile', [ 'clean:public', 'clean:cache', 'jade:precompile', 'precompileAssets', 'prettify:precompile' ]);
  grunt.registerTask('vendor', [ 'copy:assets', 'copy:assetsWithRelativeUrls' ]);
};
