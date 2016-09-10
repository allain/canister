var getParamNames = require('@avejidah/get-parameter-names');
var Promise = require('lie');

function Canister(resolvers, context) {
  if (!(this instanceof Canister)) {
    return new Canister(resolvers, context);
  }

  this.context = context || {};
  this.resolvers = [].concat(resolvers);
}

Canister.prototype.run = function (fn, options, cb) {
  if (cb === undefined && typeof (options) === 'function') {
    cb = options;
    options = {};
  } else {
    options = options || {};
  }

  var unmet = (options.unmet === undefined) ? 'throw' : options.unmet;

  var paramNames = getParamNames(fn);
  var context = this.context;

  var hasCallback = paramNames.indexOf('cb') !== -1;

  var result = this.resolveDependencies(paramNames).then(function (resolutions) {
    var unmetDependencies = paramNames.filter(function (name) {
      return resolutions[name] === undefined;
    });

    if (unmetDependencies.length > 0) {
      if (unmet === 'throw') {
        throw new Error('unmet dependencies: ' + unmetDependencies.join(','));
      } else if (unmet === 'skip') {
        return undefined;
      } else if (unmet !== 'ignore') {
        throw new Error('invalid value for unmet "' + unmet + '". supported values are "throw", "skip", "ignore". "throw" is the default');
      }
    }

    if (hasCallback) {
      return new Promise(function (resolve, reject) {
        resolutions.cb = function (err, genValue) {
          if (err) return reject(err);

          resolve(genValue);
        };

        try {
          fn.apply(context, values(resolutions));
        } catch (e) {
          reject(e);
        }
      });
    } else {
      return fn.apply(context, values(resolutions));
    }

  });

  if (cb) {
    return result.then(function (genValue) {
      cb(null, genValue);
    }, function (err) {
      cb(err);
    });
  } else {
    return result;
  }
};

Canister.prototype.resolveDependencies = function(paramNames) {
  var resolutions = {};

  var resolvers = this.resolvers;

  paramNames.forEach(function (paramName, index) {
    if (paramName === 'cb') {
      resolutions[paramName] = true; // gets replaced before run
    } else {
      resolutions[paramName] = resolveDependency(resolvers, paramName, index);
    }
  });

  return Promise.resolve(resolutions);
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

function values(obj) {
  return Object.keys(obj).map(function(key) {
    return obj[key];
  });
}

module.exports = Canister;
