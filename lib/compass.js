var fs = require('fs');
var tmp = require('tmp');
var dargs = require('dargs');
var path = require('path');

function camelCaseToUnderscore(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

// Extracts the options that cannot be used as CLI parameter but only
// as 'raw' arguments.
// Returns an object: {raw: str, options: []} with the raw string to be
// used to generate a config and the list of used options.
function extractRawOptions(options) {
  var raw = options.raw || '';
  var supportedOptions = [
    'http_path',
    'css_path',
    'http_stylesheets_path',
    'sass_path',
    'images_path',
    'http_images_path',
    'generated_images_dir',
    'generated_images_path',
    'http_generated_images_path',
    'javascripts_path',
    'http_javascripts_path',
    'fonts_path',
    'http_fonts_path',
    'http_fonts_dir',
    'extensions_dir',
    'extension_path',
    'cache_dir'
  ];

  var usedOptions = Object.keys(options).filter(function (option) {
    var underscoredOption = camelCaseToUnderscore(option);
    if (supportedOptions.indexOf(underscoredOption) >= 0) {
      // naively escape double-quotes in the value
      var value = options[option].replace(/"/g, '\\"');
      raw += underscoredOption + ' = "' + value + '"\n';
      delete options[option];

      return true;
    } else if (underscoredOption === 'asset_cache_buster') {
      // Special handling for asset_cache_buster as it doesn't take
      // a string as argument, but either an inline-ruby block (which we don't
      // support) or a `:none` symbol to disable it.
      if (options[option] === false) {
        raw += underscoredOption + ' :none' + '\n';
      }
      delete options[option];
      return true;
    } else if (underscoredOption === 'sprite_load_path') {
      // Special handling for sprite_load_path as it doesn't take
      // a string as argument, but an array or a string.
      // Append the load paths in ruby via <<
      // http://compass-style.org/blog/2012/02/01/compass-0-12-is-released/
      var loadPath = options[option];
      if (loadPath) {
        loadPath = Array.isArray(loadPath) ? loadPath : [loadPath];
        loadPath.forEach(function (path) {
          // naively escape double-quotes in the value
          path = path.replace(/"/g, '\\"');
          raw += underscoredOption + ' << "' + path + '"\n';
        });
      }
      delete options[option];
      return true;
    }
  });

  return {raw: raw, options: usedOptions};
}

// Create a config file on the fly if there are arguments not supported as
// CLI, returns a function that runs within the temprorary context.
module.exports.buildConfigContext = function (options) {
  var rawOptions = extractRawOptions(options);
  if (options.raw && options.config) {
    console.error('The options `raw` and `config` are mutually exclusive');
  }

  if (rawOptions.options.length > 0 && options.config) {
    console.error('The option `config` cannot be combined with ' +
                     'these options: ' + rawOptions.options.join(', ') + '.');
  }

  return function configContext(cb) {
    if (rawOptions.raw) {
      tmp.file(function (err, path, fd) {
        if (err) {
          return cb(err);
        }

        // Dynamically create config.rb as a tmp file for the `raw` content
        fs.writeSync(fd, new Buffer(rawOptions.raw), 0, rawOptions.raw.length);
        cb(null, path);
      });
    } else {
      cb(null, null);
    }
  };
};

// build the array of arguments to build the compass command
module.exports.buildArgsArray = function (inputFile, options) {
  var args = ['compile'];
  if (options.clean) {
    args = ['clean'];
  } else if (options.watch) {
    args = ['watch'];
  }

  var basePath = options.basePath;

  if (process.platform === 'win32') {
    args.unshift('compass.bat');
  } else {
    args.unshift('compass');
  }

  if (options.bundleExec) {
    args.unshift('bundle', 'exec');
  }

  if (options.basePath) {
    args.push(options.basePath);
  }

  args.push(inputFile)

  // add converted options
  ;[].push.apply(args, dargs(options, [
    'raw',
    'clean',
    'bundleExec',
    'basePath',
    'watch'
  ]));

  // Compass doesn't have a long flag for this option:
  // https://github.com/chriseppstein/compass/issues/1055
  if (options.importPath) {
    args = args.map(function (el) {
      return el.replace('--import-path', '-I');
    });
  }

  return args;
};
