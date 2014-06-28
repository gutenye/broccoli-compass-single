# broccoli-ruby-compass

It works out-of-box with `ember-cli`

The broccoli-ruby-compass plugin compiles `.scss` and `.sass` files with [compass](https://github.com/Compass/compass).

## Get Started

``` js
var compileSass = require('broccoli-ruby-compass');
var appCss = compileSass(sourceTrees, 'myapp/app.scss', 'assets/app.css');
```

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
