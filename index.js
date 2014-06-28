var path = require('path')
var mkdirp = require('mkdirp')
var includePathSearcher = require('include-path-searcher')
var Writer = require('broccoli-writer')
var mapSeries = require('promise-map-series')
var dargs = require('dargs')
var spawn = require('win-spawn')
var Promise = require('rsvp').Promise
var fs = require('fs')

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
    imagesDir: options.imagesDir,
    javascriptsDir: options.javascriptDir,
    fontsDir: options.fontsDir,
    config: options.config,
    outputStyle: options.outputStyle,
    importPath: [],
    sassDir: "."
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
      //var tmpDir = includePaths[0]
      //var file = self.inputFile.replace(/^\//, '')
      var tmpDir = path.dirname(sassFile)
      var file = path.basename(self.inputFile)
      //console.log('sassFile', sassFile, self.inputFile, includePaths)
      console.log('cwd', tmpDir)

      var passedArgs = dargs(self.compassOptions, ['bundleExec'])
      var args = [
        'compass',
        'compile',
        file,
      ].concat(passedArgs)

      if(bundleExec) {
        args.unshift('bundle', 'exec')
      }

      return new Promise(function(resolve, reject) {
        console.log('args', args)
        var cmd = args.shift()
        var cp = spawn(cmd, args, {cwd: tmpDir})

        cp.on('error', function(err) {
          console.error('[broccoli-ruby-compass] '+ err)
          reject(err)
        })

        var errors = '',
            hasError = false

        cp.on('data', function(data) {
          // ignore deprecation warnings
          if (/DEPRECATION WARNING/.test(data)) {
            return
          }

          hasError = true
          errors += data.toString('utf-8')
          console.log('1', data, data.toString('utf-8'))
        })

        // BUG: got '\u001b[31m\u001b[0m'
        cp.stderr.on('data', function(data) {
          console.log('2', data, data.toString('utf-8'))
          errors += data.toString('utf-8')
        })
        /*
        */

        cp.on('close', function(code) {
          if (errors.length !== 0) {
            console.error('[broccoli-ruby-compass] ' + errors)
            reject(errors)
          }

          if (code > 0) {
            reject('broccoli-ruby-compass exited with error code ' + code)
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
