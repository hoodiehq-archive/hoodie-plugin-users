var path = require('path');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;


var mountFolder = function (connect, dir) {
  return connect.static(path.resolve(dir));
};


module.exports = function (grunt) {

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    temp: '.tmp',
    dist: 'admin-dashboard'
  };

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    yeoman: yeomanConfig,

    release: {
      options: {
        commitFiles: [
          'package.json',
          'bower.json',
          'CHANGELOG.md',
          'admin-dashboard'
        ]
      }
    },

    // specify an alternate install location for Bower
    bower: {
      dir: 'app/components'
    },

    useminPrepare: {
      html: 'app/index.html',
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },

    usemin: {
      html: ['<%= yeoman.dist %>/index.html'],
      css: ['<%= yeoman.dist %>/styles/**/*.css'],
      options: {
        dirs: ['<%= yeoman.dist %>']
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: 'app/images',
          src: '**/*.{png,jpg,jpeg}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    cssmin: {
      dist: {
        files: {
          '<%= yeoman.dist %>/styles/app.css': [
            '.tmp/styles/**/*.css',
            'app/styles/**/*.css'
          ]
        }
      }
    },

    htmlmin: {
      dist: {
        options: {
          /*removeCommentsFromCDATA: true,
          // https://github.com/yeoman/grunt-usemin/issues/44
          //collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true*/
        },
        files: [{
          expand: true,
          cwd: 'app',
          src: '*.html',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'app',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,txt}',
            '.htaccess'
          ]
        }]
      }
    },

    coffee: {
      dist: {
        files: [{
          // rather than compiling multiple files here you should
          // require them into your main .coffee file
          expand: true,
          cwd: 'app/scripts',
          src: '**/*.coffee',
          dest: '.tmp/scripts',
          ext: '.js'
        }]
      },
      test: {
        files: [{
          expand: true,
          cwd: '.tmp/spec',
          src: '*.coffee',
          dest: 'test/spec'
        }]
      }
    },

    compass: {
      options: {
        sassDir: 'app/styles',
        cssDir: '.tmp/styles',
        imagesDir: 'app/images',
        javascriptsDir: 'app/scripts',
        importPath: 'app/components',
        relativeAssets: true
      },
      dist: {},
      server: {
        options: {
          debugInfo: true
        }
      }
    },

    jshint: {
      files: [
        'Gruntfile.js',
        'app/scripts/**/*.js',
        //'test/**/*.js',
        'hoodie.template.js',
        'index.js',
        'lib/*.js',
        'hooks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    simplemocha: {
      options: {
        ui: 'tdd',
        trace: true
      },
      unit: {
        src: ['test/unit/*.js']
      }
    },

    mocha_browser: {
      all: {options: {urls: ['http://localhost:<%= connect.options.port %>']}}
    },

    shell: {
      removeData: {
        command: 'rm -rf ' + path.resolve(__dirname, 'data')
      },
      removeEmails: {
        command: 'rm -rf ' + path.resolve(__dirname, 'test/browser/emails')
      },
      npmLink: {
        command: 'npm link && npm link <%= pkg.name %>'
      },
      npmUnlink: {
        command: 'npm unlink && npm unlink <%= pkg.name %>'
      },
      installPlugin: {
        command: 'hoodie install <%= pkg.name.replace("hoodie-plugin-", "") %>'
      },
      removePlugin: {
        command: 'hoodie uninstall <%= pkg.name.replace("hoodie-plugin-", "") %>'
      },
      killHoodie: {
        command: 'pkill -f hoodie-plugin-users'
      }
    },

    connect: {
      options: {
        port: 9000,
        // change this to '0.0.0.0' to access the server from outside
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'app')
            ];
          }
        }
      },
      test: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'test')
            ];
          }
        }
      },
      dist: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, '<%= yeoman.dist %>')
            ];
          }
        }
      }
    },

    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      }
    },

    clean: {
      dist: ['.tmp', '<%= yeoman.dist %>/*'],
      server: '.tmp'
    },

    // not used since Uglify task does concat,
    // but still available if needed
    concat: {
      dist: {}
    },

    uglify: {
      dist: {
        files: {
          '<%= yeoman.dist %>/scripts/app.js': [
            '.tmp/scripts/**/*.js'
          ],
        }
      }
    },

    hoodie: {
      start: {
        options: {
          www: 'test/browser',
          callback: function (config) {
            grunt.config.set('connect.options.port', config.stack.www.port);
          }
        }
      }
    },

    fakesmtp: {
      test: {
        options: {
          dir: path.resolve(__dirname, 'test/browser/emails'),
          port: 8888
        }
      }
    },

    env: {
      test: {
        HOODIE_SETUP_PASSWORD: 'testing'
      }
    },

    watch: {
      coffee: {
        files: 'app/scripts/**/*.coffee',
        tasks: ['coffee', 'livereload']
      },
      coffeeTest: {
        files: ['test/spec/**/*.coffee'],
        tasks: ['coffee:test']
      },
      compass: {
        files: [
          'app/styles/**/*.{scss,sass}'
        ],
        tasks: ['compass', 'livereload']
      },
      livereload: {
        files: [
          'app/*.html',
          '{.tmp,app}/styles/**/*.css',
          '{.tmp,app}/scripts/**/*.js',
          'app/images/**/*.{png,jpg,jpeg,webp}'
        ],
        tasks: ['livereload']
      },
      handlebars: {
        files: [
          'app/scripts/templates/**/*.hbs'
        ],
        tasks: ['handlebars', 'livereload']
      },
      jshint: {
        files: ['<%= jshint.files %>'],
        tasks: 'jshint'
      },
      unittest: {
        files: ['index.js', 'lib/*.js'],
        tasks: 'test:unit'
      }
    },

    // Build configuration
    // -------------------

    // the staging directory used during the process
    staging: '.tmp',
    // final build output
    output: '<%= yeoman.dist %>',

    mkdirs: {
      staging: 'app/'
    },

    // Below, all paths are relative to the staging directory, which is a copy
    // of the app/ directory. Any .gitignore, .ignore and .buildignore file
    // that might appear in the app/ tree are used to ignore these values
    // during the copy process.

    // concat css/**/*.css files, inline @import, output a single minified css
    css: {
      'styles/main.css': ['styles/**/*.css']
    },

    // renames JS/CSS to prepend a hash of their contents for easier
    // versioning
    // Hoodie admin-dashboard: referenced invalid image path so images don't get renamed
    // Workaround for: https://github.com/yeoman/yeoman/issues/824
    rev: {
      js: 'scripts/**/*.js',
      css: 'styles/**/*.css',
      img: 'images/**'
    },

    // HTML minification
    html: {
      files: ['index.html']
    },

    // Optimizes JPGs and PNGs (with jpegtran & optipng)
    img: {
      dist: '<config:rev.img>'
    },

    // rjs configuration. You don't necessarily need to specify the typical
    // `path` configuration, the rjs task will parse these values from your
    // main module, using http://requirejs.org/docs/optimization.html#mainConfigFile
    //
    // name / out / mainConfig file should be used. You can let it blank if
    // you're using usemin-handler to parse rjs config from markup (default
    // setup)
    rjs: {
      // no minification, is done by the min task
      optimize: 'none',
      baseUrl: './scripts',
      wrap: true
    },

    handlebars: {
      compile: {
        files: {
          '.tmp/scripts/compiled-templates.js': [
            'app/scripts/templates/**/*.hbs'
          ]
        },
        options: {
          // namespace: 'admin-dashboard.Templates',
          namespace: 'JST',
          processName: function (filename) {
            // funky name processing here
            return filename
              .replace(/^app\/scripts\/templates\//, '')
              .replace(/\.hbs$/, '');
          }
        }
      }
    }

  });

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // custom tasks
  grunt.loadTasks('./tasks');

  grunt.renameTask('regarde', 'watch');

  grunt.registerTask('default', [
    'test',
    'admin-build'
  ]);

  grunt.registerTask('test:unit', ['simplemocha:unit']);
  grunt.registerTask('test:browser', [
    'env:test',
    'shell:removeData',
    'shell:removeEmails',
    'shell:npmLink',
    'shell:installPlugin',
    'fakesmtp:test',
    'hoodie',
    'continueOn',
    'mocha_browser:all',
    'continueOff',
    'hoodie_stop',
    'shell:npmUnlink',
    'shell:removePlugin'
  ]);
  grunt.registerTask('admin-test', [
    'clean:server',
    'coffee',
    'compass',
    'connect:test',
    'mocha'
  ]);
  grunt.registerTask('test', [
    'jshint',
    'test:unit',
    'test:browser'
    //'admin-test' - currently no mocha targets
  ]);

  grunt.registerTask('start', [
    'env:test',
    'shell:npmLink',
    'shell:installPlugin',
    'hoodie'
  ]);
  grunt.registerTask('stop', [
    'hoodie_stop',
    'shell:npmUnlink',
    'shell:removePlugin',
    'shell:killHoodie'
  ]);

  grunt.registerTask('admin-server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['admin-build', 'open', 'connect:dist:keepalive']);
    }
    grunt.task.run([
      'clean:server',
      'coffee:dist',
      'handlebars',
      'compass:server',
      'livereload-start',
      'connect:livereload',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('admin-build', [
    'clean:dist',
    'coffee',
    'handlebars',
    'compass:dist',
    'useminPrepare',
    'imagemin',
    'htmlmin',
    'concat',
    // 'cssmin',
    // 'uglify',
    'copy',
    'usemin'
  ]);

};
