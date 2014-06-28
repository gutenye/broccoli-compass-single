var path = require('path')
var mkdirp = require('mkdirp')
var includePathSearcher = require('include-path-searcher')
var Writer = require('broccoli-writer')
var mapSeries = require('promise-map-series')
var dargs = require('dargs')
var spawn = require('win-spawn')
var Promise = require('rsvp').Promise
var fs = require('fs')
var compass = require('./lib/compass')

module.exports = CompassCompiler
CompassCompiler.prototype = Object.create(Writer.prototype)
CompassCompiler.prototype.constructor = CompassCompiler
function CompassCompiler (sourceTrees, inputFile, outputFile, options) {
  if (!(this instanceof CompassCompiler)) return new CompassCompiler(sourceTrees, inputFile, outputFile, options)
  this.sourceTrees = sourceTrees
  this.inputFile = inputFile
  this.outputFile = outputFile
  this.outputDir = path.dirname(outputFile)
  this.importPath = options.importPath || []
  options = options || {}
  this.compassOptions = {
    javascriptsDir: options.javascriptDir,
    fontsDir: options.fontsDir,
    config: options.config,
    outputStyle: options.outputStyle,
    importPath: [],
    sassDir: '.',
    imagesPath: options.imagesDir && path.resolve(options.imagesDir),
    generatedImagesPath: options.generatedImagesDir && path.resolve(options.generatedImagesDir)
  }
}

CompassCompiler.prototype.write = function (readTree, destDir) {
  var self = this
  var bundleExec = this.compassOptions.bundleExec
  cssDir = path.join(destDir, this.outputDir)
  this.compassOptions.cssDir = cssDir
  mkdirp.sync(cssDir)

  return mapSeries(this.sourceTrees, readTree)
    .then(function (includePaths) {
       includePaths.forEach(function(dir) {
        self.importPath.forEach(function(vendor) {
          self.compassOptions.importPath.push(path.join(dir, vendor))
        })
      })
      self.compassOptions.importPath = self.compassOptions.importPath.concat(includePaths)
      var sassFile = includePathSearcher.findFileSync(self.inputFile, includePaths)
      var tmpDir = path.dirname(sassFile)
      var file = path.basename(self.inputFile)

      return new Promise(function(resolve, reject) {
        // create a temporary config file if there are 'raw' options or
        // settings not supported as CLI arguments
        var configContext = compass.buildConfigContext(self.compassOptions);
        // get the array of arguments for the compass command
        var args = compass.buildArgsArray(file, self.compassOptions);
        configContext(function (err, configFile) {
          if (err) {
            console.error(err)
            reject(err)
          }

          if (configFile) {
            args.push('--config', configFile);
          }

          var cp = spawn(args.shift(), args, {cwd: tmpDir})
          cp.stdout.pipe(process.stdout);
          cp.stderr.pipe(process.stderr);
          cp.on('close', function(code) {
            if (code === 127) {
              console.error(
                'You need to have Ruby and Compass installed ' +
                'and in your system PATH for this task to work. ' +
                'More info: https://github.com/gruntjs/grunt-contrib-compass'
              );
              reject(code)
            }

            // `compass compile` exits with 1 and outputs "Nothing to compile"
            // on stderr when it has nothing to compile.
            // https://github.com/chriseppstein/compass/issues/993
            // Don't fail the task in this situation.
            if (code === 1 && !/Nothing to compile|Compass can't find any Sass files to compile/g.test(result.stderr)) {
              console.error('↑');
              reject(code)
            }

            var cssFile = path.join(destDir, self.outputFile)
            var generatedFile = path.join(path.dirname(cssFile), path.basename(self.inputFile, path.extname(self.inputFile))) + '.css'
            fs.renameSync(generatedFile, cssFile)

            resolve(self._tmpDestDir)
          })
          return self._tmpDestDir
        })
      })
    })
}
