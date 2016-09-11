var getParamNames = require('@avejidah/get-parameter-names')

module.exports = Canister

function Canister (resolvers, context) {
  if (!(this instanceof Canister)) {
    return new Canister(resolvers, context)
  }

  this.context = context || {}
  this.resolvers = [].concat(resolvers)
}

Canister.prototype = {
  run: run,
  resolve: resolveAll
}

function run(fn, options, cb) {
  var result;

  if (cb === undefined && typeof (options) === 'function') {
    cb = options
    options = {}
  }

  options = options || {}

  if (cb === undefined) {
    // If no callback is given, then the run method will return a promise
    result = new Promise(function(resolve, reject) {
      cb = function(err, val) {
        return err ? reject(err) : resolve(val)
      }
    })
  }

  var unmet = options.unmet || 'throw'

  var paramNames = getParamNames(fn)
  var context = this.context

  var hasCallback = paramNames.indexOf('cb') !== -1

  resolveAll(this.resolvers, paramNames, function (err, resolutions) {
    var unmetDependencies = paramNames.filter(function (name) {
      return resolutions[name] === undefined
    })

    if (unmetDependencies.length > 0) {
      if (unmet === 'throw') 
        return cb(new Error('unmet dependencies: ' + unmetDependencies.join(',')))

      if (unmet === 'skip') 
        return cb()

      if (unmet !== 'ignore') 
        return cb(new Error('invalid value for unmet "' + unmet + '". supported values are "throw", "skip", "ignore". "throw" is the default'))
    }

    try {
      if (hasCallback) {
        resolutions.cb = cb
        fn.apply(context, values(resolutions))
      } else {
        cb(null, fn.apply(context, values(resolutions)))
      }
    } catch (err) {
      cb(err)
    }
  })

  return result
}

function resolveAll(resolvers, paramNames, cb) {
  var resolutions = {}

  paramNames.forEach(function (paramName, index) {
    if (paramName === 'cb') {
      resolutions[paramName] = true // gets replaced before run
    } else {
      resolutions[paramName] = resolve(resolvers, paramName, index)
    }
  })

  return cb ? cb(null, resolutions) : Promise.resolve(resolutions)
}

function resolve (resolvers, name, index) {
  for (var i = 0; i < resolvers.length; i++) {
    var resolver = resolvers[i]

    var resolution
    if (typeof resolver === 'function') {
      resolution = resolver(name, index)
    } else if (typeof resolver === 'object') {
      resolution = resolver[name]
    }

    if (resolution !== null && resolution !== undefined) {
      return resolution
    }
  }
}

function values (obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key]
  })
}
