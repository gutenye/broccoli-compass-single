var compileSass = require('./index');
var pickFiles = require('broccoli-static-compiler');

var tree = pickFiles('tests/input', {
  srcDir: '/',
  destDir: '/'
});

tree = compileSass([tree], '/splitbutton.scss', '/assets/output.css', {
  outputStyle: 'expanded'
});

module.exports = tree
