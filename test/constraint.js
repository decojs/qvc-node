var getConstraints = require('../src/getConstraints');
var assert = require("assert");


function MustBeSomething() {
  this.constraint = function(){
    return {};
  };
}

function MustBeAnything() {
  this.constraint = function(){
    return {};
  };
}

describe('getConstraints', function(){
  describe('getting constraints of null', function(){
    it('should return an empty array', function(){
      var result = getConstraints(null).parameters;
      assert(Array.isArray(result));
      assert.equal(0, result.length);
    });
  });
  
  describe('getting constraints of an empty object', function(){
    it('should return an empty array', function(){
      var result = getConstraints({}).parameters;
      assert(Array.isArray(result));
      assert.equal(0, result.length);
    });
  });
  
  describe('getting constraints of an object with an object', function(){
    it('should return an array with one object', function(){
      var result = getConstraints({'name': new MustBeSomething}).parameters;
      assert(Array.isArray(result));
      assert.equal(1, result.length);
      assert.equal('name', result[0].name);
      assert(Array.isArray(result[0].constraints));
      assert.equal(1, result[0].constraints.length);
      assert.equal('MustBeSomething', result[0].constraints[0].name);
    });
  });
  
  describe('getting constraints of an object with two objects', function(){
    it('should return an array with one object', function(){
      var result = getConstraints({'name': [new MustBeSomething, new MustBeAnything]}).parameters;
      assert(Array.isArray(result));
      assert.equal(1, result.length);
      assert.equal('name', result[0].name);
      assert(Array.isArray(result[0].constraints));
      assert.equal(2, result[0].constraints.length);
      assert.equal('MustBeSomething', result[0].constraints[0].name);
      assert.equal('MustBeAnything', result[0].constraints[1].name);
    });
  });
});
