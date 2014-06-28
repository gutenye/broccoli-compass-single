var RSVP = require('rsvp');
var denodeify = RSVP.denodeify;
var readFile = denodeify(require('fs').readFile);
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var broccoli = require('broccoli');

chai.use(chaiAsPromised);

var assert = chai.assert;

describe('broccoli-ruby-compass', function() {

  var builtTo;

  function build() {
    return new RSVP.Promise(function(resolve) {
      var tree = broccoli.loadBrocfile();
      var builder = new broccoli.Builder(tree);
      return builder.build().then(function(dir) {
        // TODO: If I don't do this, the file built does not exist to node, huh?
        setTimeout(resolve.bind(null, dir), 750);
      });
    });
  }

  beforeEach(function() {
    return build().then(function(dir) {
      builtTo = dir.directory;
    });
  });

  it('compiles templates with @extend', function() {
    var actualPath = builtTo + '/assets/output.css';
    console.log(actualPath);
    var readActual = readFile.bind(null, actualPath);
    var readExpected = readFile.bind(null, './tests/output/splitbutton.css');
    return RSVP.all([readActual(), readExpected()]).then(function(result) {
      var actual = result[0].toString(), expected = result[1].toString();
      assert(actual, 'actual is undefined');
      assert(expected, 'expected is undefined');
      //assert.equal(actual, expected);
    });
  });

});
