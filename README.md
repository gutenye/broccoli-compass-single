# broccoli-ruby-compass

It works out-of-box with `ember-cli`

The broccoli-ruby-compass plugin compiles `.scss` and `.sass` files with [compass](https://github.com/Compass/compass).

## Get Started

### Options 1

Fork ember-cli, and change it:

```
# package.json

  dependencies: {
    "broccoli-ruby-compass": "gutenye/broccoli-ruby-compass"
  }

# lib/preprocessors.js

  module.exports.setupRegistry = function(app) {
    ...
    registry.add('css', 'broccoli-ruby-compass', ['scss', 'sass']);

# lib/broccoli/ember-app.js

  EmberApp.prototype.styles = memoize(function() {
    ...
    var processedStyles = preprocessCss(stylesAndVendor, '/app/styles', '/assets', {
      importPath: ['vendor/foundation/scss'],
      bundleExec: true,
      imagesDir: 'public/images',
      generatedImagesDir: 'dist/public'
    });
```

### Option 2

Wait for ember-cli to be more mature, so that we don't need to directly change in on the source.

### API

``` js
var outputTree = compileSass(inputTrees, inputFile, outputFile, options);
```

* **`inputTrees`**: An array of trees that act as the include paths for
  compass. If you have a single tree, pass `[tree]`.

* **`inputFile`**: Relative path of the main `.scss` or `.sass` file to compile. This
  file must exist in one of the `inputTrees`.

* **`outputFile`**: Relative path of the output CSS file.

* **`options`**: A hash of options for compass. Supported options are
  `importPath`, `imagesDir`, `javascriptsDir`, `fontsDir`, `config`, `outputStyle`

## Install

``` bash
gem install compass
npm install --save-dev broccoli-ruby-compass
```


## License

[MIT](https://github.com/gutenye/broccoli-ruby-compass/blob/master/LICENSE.md)
