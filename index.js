var getParamNames = require('get-parameter-names');

module.exports = Canister;

function Canister(resolvers, context) {
  if (!context) {
    context = {};
  }

  if (!Array.isArray(resolvers)) {
    resolvers = [resolvers];
  }

  this.run = function(fn, cb) {
    cb = cb || function() {};

    var dependencies = [];
    var unmetDependencies = [];
    var synchronous = true;

    var paramNames = getParamNames(fn);

    paramNames.forEach(function(paramName) {
      if (paramName === 'cb') {
        synchronous = false;
        dependencies.push(cb);
      } else if (paramName) {
        var depValue = resolve(resolvers, paramName);
        if (depValue !== null && depValue !== undefined) {
          dependencies.push(depValue);
        } else {
          unmetDependencies.push(paramName);
        }
      }
    });

    if (unmetDependencies.length > 0)
      return cb(new Error('unmet dependencies: ' + unmetDependencies.join(',')));

    var result = fn.apply(context, dependencies);

    // If result is a promise, then resolve it and call callback
    if (result && result.then) {
      result.then(function(value) {
        return cb(null, value);
      }, cb);
    } else if (synchronous) {
      return cb(null, result);
    }
  };

  function resolve(resolvers, name) {
    for (var i = 0; i < resolvers.length; i++) {
      var resolver = resolvers[i];

      var resolution;
      if (typeof resolver === 'function') {
        resolution = resolver(name);
      } else if (typeof resolver === 'object') {
        resolution = resolver[name];
      }

      if (resolution !== null && resolution !== undefined) {
        return resolution;
      }
    }
  }
}