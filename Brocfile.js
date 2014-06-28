var compileSass = require('./index');
var pickFiles = require('broccoli-static-compiler');

tree = compileSass(['.'], '/tests/styles/app.scss', '/assets/output.css', {
  outputStyle: 'expanded',
  imagesDir: 'tests/images',
  generatedImagesDir: 'tests/public'
});

module.exports = tree
