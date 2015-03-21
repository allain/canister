var assert = require('chai').assert;
var Promise = require('bluebird');
var Canister = require('../index.js');

describe('canister', function() {
  it('handles empty injection', function(done) {
    new Canister(function(name) {
      assert.fail('should not be called');
    }).run(function(/* NO ARGS HERE*/) {
      assert.equal(arguments.length, 0);
      return 10;
    }, function(err, result) {
      assert(!err);
      assert.equal(result, 10);
      done();
    });
  });

  it('handles simple injection', function(done) {
    new Canister(function(name) {
      if (name === 'a') return 'a';
      if (name === 'b') return 'b';
    }).run(function(a, b) {
      assert.equal(arguments.length, 2);
      return a + b;
    }, function(err, result) {
      assert.equal(result, 'ab');
      done();
    });
  });

  it('handles simple injection with hash', function(done) {
    new Canister({a: 'a', b: 'b'}).run(function(a, b) {
      assert.equal(arguments.length, 2);
      return a + b;
    }, function(err, result) {
      assert.equal(result, 'ab');
      done();
    });
  });

  it('support not providing a callback to run', function(done) {
    new Canister(function() {
      assert.fail('should not be run');
    }).run(function() {
      done();
    });
  });

  it('supports binding contexts', function(done) {
    new Canister(function() {
      assert.fail('should not be run');
    }, {a: 10}).run(function() {
      assert.equal(this.a, 10);
      done();
    });
  });

  it('runs functions with callbacks properly', function(done) {
    new Canister(function(name) {
      if (name === 'a') return 'a';
      if (name === 'b') return 'b';
      if (name === 'cb') return function(err, val) {
        assert(val === 'c');
        done(err);
      };
    }).run(function(a, b, cb) {
      assert.equal(arguments.length, 3);
      cb(null, 'c');
    }, function(err, result) {
      assert(!err);
      assert.equal(result, 'c');
      done();
    });
  });

  it('supports returning a Promise from function', function(done) {
    new Canister(function(name) {
      assert.fail('should not be run');
    }).run(function() {
      return Promise.resolve('test');
    }, function(err, result) {
      assert(!err);
      assert.equal(result, 'test');
      done();
    });
  });

  it('supports an array of resolvers', function(done) {
    new Canister([
      function(name) {
        if (name === 'a') return 'a';
      },
      function(name) {
        if (name === 'b') return 'b';
      }
    ]).run(function(a, b) {
      return a+b;
    }, function(err, result) {
      assert(!err, err);
      assert.equal(result, 'ab');
      done();
    })
  })
});