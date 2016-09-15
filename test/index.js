var Canister = require('../index.js')
var Promise = require('any-promise')

var test = require('blue-tape')

test('callsback with error if unmet dependencies', function (t) {
  new Canister(function () {
    // nothing ever resolves
  }).run(function (a) {
    t.fail('a should not have resolved as %j', a)
  }).catch(function (err) {
    // assert.equal(typeof err, 'Error')
    t.equal(err.message, 'unmet dependencies: a')
    t.end()
  })
})

test('supports resolution', function (t) {
  return new Canister({a: true}).resolve(['a', 'b']).then(function (resolutions) {
    t.deepEqual(resolutions, {a: true, b: undefined})
  }, t.fail)
})

test('supports unmet depency mode  params strict:false', function (t) {
  return new Canister({a: 1}).run(function (a, b) {
    t.deepEqual([a, b], [1, undefined])
  }, {unmet: 'ignore'})
})

test('handles empty injection', function (t) {
  new Canister(function () {
    t.fail('should not be called')
  }).run(function ( /* NO ARGS HERE*/) {
    t.equal(arguments.length, 0)
    return 10
  }, function (err, result) {
    t.error(err)
    t.equal(result, 10)
    t.end()
  })
})

test('passes index to resolver', function (t) {
  new Canister(function (name, index) {
    t.equal(typeof index, 'number')

    if (name === 'a') return index
    if (name === 'b') return index
  }).run(function (a, b) {
    t.equal(a, 0)
    t.equal(b, 1)
  }, function (err) {
    t.error(err)
    t.end()
  })
})

test('handles simple injection', function (t) {
  return new Canister(function (name) {
    if (name === 'a') return 'a'
    if (name === 'b') return 'b'
  }).run(function (a, b) {
    t.equal(arguments.length, 2)
    return a + b
  }).then(function (result) {
    t.equal(result, 'ab')
  })
})

test('handles simple injection with hash', function (t) {
  return new Canister({a: 'a', b: 'b'}).run(function (a, b) {
    t.equal(arguments.length, 2)
    return a + b
  }).then(function (result) {
    t.equal(result, 'ab')
  })
})

test('support not providing a callback to run', function (t) {
  return new Canister(function () {
    t.fail('should not be run')
  }).run(function () {})
})

test('supports binding contexts', function (t) {
  return new Canister(function () {
    t.fail('should not be run')
  }, {a: 10}).run(function () {
    t.equal(this.a, 10)
  })
})

test('runs functions with callbacks properly', function (t) {
  return new Canister(function (name) {
    if (name === 'a') return 'a'
    if (name === 'b') return 'b'
  }).run(function (a, b, cb) {
    t.equal(arguments.length, 3)
    cb(null, 'c')
  }).then(function (result) {
    t.equal(result, 'c')
  })
})

test('function callback can be anywhere as long as it is called "cb" ', function (t) {
  return new Canister(function (name) {
    if (name === 'a') return 'a'
    if (name === 'b') return 'b'
  }).run(function (cb, a, b) {
    t.equal(arguments.length, 3)
    cb(null, 'c')
  }).then(function (result) {
    t.equal(result, 'c')
  })
})

test('supports returning a Promise from function', function (t) {
  return new Canister(function () {
    t.fail('should not be run')
  }).run(function () {
    return Promise.resolve('test')
  }).then(function (result) {
    t.equal(result, 'test')
  })
})

test('supports an array of resolvers', function (t) {
  return new Canister([
    function (name) {
      if (name === 'a') return 'a'
    },
    function (name) {
      if (name === 'b') return 'b'
    }
  ]).run(function (a, b) {
    return a + b
  }).then(function (result) {
    t.equal(result, 'ab')
  })
})

test('supports callback API (success)', function (t) {
  new Canister({a: 10}).run(function (a) {
    return a
  }, function (err, result) {
    t.equal(result, 10)
    t.end()
  })
})

test('catches exceptions thrown in function', function (t) {
  return new Canister({}).run(function () {
    throw new Error('Testing Failures')
  }).catch(function (err, result) {
    t.ok(err)
    t.notOk(result)
  })
})

test('supports callback API (failure)', function (t) {
  return new Canister({}).run(function () {
    throw new Error('Testing Failures')
  }, function (err, result) {
    t.ok(err, 'expect err')
    t.equal(typeof result, 'undefined')
    t.end()
  })
})

test('supports not using new on creation', function (t) {
  var can = Canister({})
  t.ok(can instanceof Canister)
  t.end()
})
