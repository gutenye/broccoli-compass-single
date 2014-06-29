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
      var tmpDir = path.resolve(path.dirname(sassFile))
      var file = path.basename(self.inputFile)

      return new Promise(function(resolve, reject) {
        // create a temporary config file for settings not supported as CLI arguments
        var configContext = compass.buildConfigContext(self.compassOptions)
        var args = compass.buildArgsArray(file, self.compassOptions)
        configFile = configContext(tmpDir)
        if (configFile) {
          args.push('--config', configFile)
        }

        var cp = spawn(args.shift(), args, {cwd: tmpDir})
        cp.stdout.pipe(process.stdout)
        cp.stderr.pipe(process.stderr)
        cp.on('error', function(data) {
          console.error('[broccoli-compass-single] got an error while run compass command.')
          reject(data)
        })
        cp.on('close', function(code) {
          if (code > 0) {
            reject('[broccoli-compass-single] exited with error code ' + code)
          }

          var cssFile = path.join(destDir, self.outputFile)
          var generatedFile = path.join(path.dirname(cssFile), path.basename(self.inputFile, path.extname(self.inputFile))) + '.css'
          fs.renameSync(generatedFile, cssFile)

          resolve(self._tmpDestDir)
        })
        return self._tmpDestDir
      })
    })
}
