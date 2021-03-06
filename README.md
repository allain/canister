# canister

A minimalist Dependency Injection container.

[![build status](https://secure.travis-ci.org/allain/canister.png)](http://travis-ci.org/allain/canister)

## Installation

This module is installed via npm:

```sh
npm install canister
```

##  Example Usage

```JavaScript
var Canister = require('canister');

// Simple canister
var canister = new Canister(function(name) {
  if (name === 'a') return [1,2];
  if (name === '_') return require('lodash');
}};

// Run synchronous function
canister.run(function(a, _) {
  return _.sum(a);
}, function(err, sum) {
  console.log(sum);
});

// Run Asynchronous function
canister.run(function(a, cb) {
  cb(null, a);
}, function(err, val) {
  console.log(val);
});

// Canister with multiple resolvers with multiple types (hash, and resolver function)
var canister2 = new Canister([{a: 10}, function(name) {
  if (name === 'b') return 'B';
}]);

canister2.run(function(a, b) {
  console.log(a, b);
});
```


