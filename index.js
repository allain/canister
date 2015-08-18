var getParamNames = require('get-parameter-names');
var Promise = require('any-promise');

module.exports = Canister;

function Canister(resolvers, context) {
  this.context = context || {};
  this.resolvers = [].concat(resolvers);
}

Canister.prototype.run = function (fn, cb) {
  var resolvers = this.resolvers;
  var context = this.context;

  var result = new Promise(function(resolve, reject) {
    var dependencies = [];
    var unmetDependencies = [];
    var synchronous = true;

    var paramNames = getParamNames(fn);

    paramNames.forEach(function (paramName, index) {
      if (paramName === 'cb') {
        synchronous = false;
        dependencies.push(function (err, value) {
          if (err) return reject(err);

          resolve(value);
        });
      } else if (paramName) {
        var depValue = resolveDependency(resolvers, paramName, index);
        if (depValue !== null && depValue !== undefined) {
          dependencies.push(depValue);
        } else {
          unmetDependencies.push(paramName);
        }
      }
    });

    if (unmetDependencies.length > 0)
      return reject(new Error('unmet dependencies: ' + unmetDependencies.join(',')));

    var result = fn.apply(context, dependencies);

    // If result is a promise, then resolve it and call callback
    if (result && result.then) {
      result.then(resolve, reject);
    } else if (synchronous) {
      return resolve(result);
    }
  });

  if (cb) {
    result.then(function (value) {
      cb(null, value);
    }, cb);
  } else {
    return result;
  }
};

function resolveDependency(resolvers, name, index) {
  for (var i = 0; i < resolvers.length; i++) {
    var resolver = resolvers[i];

    var resolution;
    if (typeof resolver === 'function') {
      resolution = resolver(name, index);
    } else if (typeof resolver === 'object') {
      resolution = resolver[name];
    }

    if (resolution !== null && resolution !== undefined) {
      return resolution;
    }
  }
}
