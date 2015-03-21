# canister

A minimalist Dependency Injection container.

[![build status](https://secure.travis-ci.org/allain/canister.png)](http://travis-ci.org/allain/canister)

## Installation

This module is installed via npm:

``` bash
$ npm install canister
```

## Simple Usage Case
``` js
var Canister = require('canister');

var canister = new Canister(function(name) {
  if (name === 'a') return [1,2];
  if (name === '_') return require('lodash');
}};

canister.run(function(a, _) {
  return _.sum(a);
}, function(err, sum) {
  console.log(sum);
});
```
