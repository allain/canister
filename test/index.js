var Promise = require('any-promise');
var Canister = require('../index.js');

var test = require('tape');

test('callsback with error if unmet dependencies', function (t) {
  new Canister(function (name) {
    // nothing ever resolves
  }).run(function (a) {
      t.fail('should never be called since a is unmet dependency');
    }, function (err) {
      //assert.equal(typeof err, 'Error');
      t.equal(err.message, 'unmet dependencies: a');
      t.end();
    });
});

test('handles empty injection', function (t) {
  new Canister(function (name) {
    t.fail('should not be called');
  }).run(function (/* NO ARGS HERE*/) {
      t.equal(arguments.length, 0);
      return 10;
    }, function (err, result) {
      t.error(err);
      t.equal(result, 10);
      t.end();
    });
});

test('passes index to resolver', function (t) {
  new Canister(function (name, index) {
    t.equal(typeof index, 'number');
    if (name === 'a') return index;
    if (name === 'b') return index;
  }).run(function (a, b) {
      t.equal(a, 0);
      t.equal(b, 1);
    }, function (err, result) {
      t.error(err);
      t.end();
    });
});

test('handles simple injection', function (t) {
  new Canister(function (name) {
    if (name === 'a') return 'a';
    if (name === 'b') return 'b';
  }).run(function (a, b) {
      t.equal(arguments.length, 2);
      return a + b;
    }, function (err, result) {
      t.equal(result, 'ab');
      t.end();
    });
});

test('handles simple injection with hash', function (t) {
  new Canister({a: 'a', b: 'b'}).run(function (a, b) {
    t.equal(arguments.length, 2);
    return a + b;
  }, function (err, result) {
    t.equal(result, 'ab');
    t.end();
  });
});

test('support not providing a callback to run', function (t) {
  new Canister(function () {
    t.fail('should not be run');
  }).run(function () {
      t.end();
    });
});

test('supports binding contexts', function (t) {
  new Canister(function () {
    t.fail('should not be run');
  }, {a: 10}).run(function () {
      t.equal(this.a, 10);
      t.end();
    });
});

test('runs functions with callbacks properly', function (t) {
  new Canister(function (name) {
    if (name === 'a') return 'a';
    if (name === 'b') return 'b';
    if (name === 'cb') return function (err, val) {
      return val;
    };
  }).run(function (a, b, cb) {
      t.equal(arguments.length, 3);
      cb(null, 'c');
    }, function (err, result) {
      t.error(err);
      t.equal(result, 'c');
      t.end();
    });
});

test('supports returning a Promise from function', function (t) {
  new Canister(function (name) {
    t.fail('should not be run');
  }).run(function () {
      return Promise.resolve('test');
    }, function (err, result) {
      t.error(err);
      t.equal(result, 'test');
      t.end();
    });
});

test('supports an array of resolvers', function (t) {
  new Canister([
    function (name) {
      if (name === 'a') return 'a';
    },
    function (name) {
      if (name === 'b') return 'b';
    }
  ]).run(function (a, b) {
      return a + b;
    }, function (err, result) {
      t.error(err, err);
      t.equal(result, 'ab');
      t.end();;
    })
});

test('supports promise API', function(t) {
  new Canister({a: 10}).run(function(a) {
    return a;
  }).then(function(result) {
    t.equal(result, 10);
    t.end();
  });
});

