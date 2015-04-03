var validate = require('../src/validate');
var assert = require("assert");


var mustBeSomething = {
  isValid: function(value){
    return value == 'something';
  },
  message: 'message'
};
var mustBeAnything = {
  isValid: function(value){
    return value == 'anything';
  },
  message: 'message'
};

describe('validate', function(){
  describe('validating null', function(){
    it('should return an empty array', function(){
      var result = validate(null, []);
      assert(Array.isArray(result));
      assert.equal(0, result.length);
    });
  });
  
  describe('validating empty object', function(){
    it('should return an empty array', function(){
      var result = validate(null, []);
      assert(Array.isArray(result));
      assert.equal(0, result.length);
    });
  });
  
  describe('validating object without constraints', function(){
    it('should return an empty array', function(){
      var result = validate({name:'something'}, []);
      assert(Array.isArray(result));
      assert.equal(0, result.length);
    });
  });
  
  describe('validating object with one valid constraints', function(){
    it('should return an empty array', function(){
      var result = validate({name:'something'}, {name: mustBeSomething});
      assert(Array.isArray(result));
      assert.equal(0, result.length);
    });
  });
  
  describe('validating object with one invalid constraints', function(){
    it('should return an array with the invalid field', function(){
      var result = validate({name:'nothing'}, {name: mustBeSomething});
      assert(Array.isArray(result));
      assert.equal(1, result.length);
      assert.equal('name', result[0].fieldName);
      assert.equal('message', result[0].message);
    });
  });
  
  describe('validating object with two constraints', function(){
    it('should return an array only one field', function(){
      var result = validate({name:'nothing'}, {name: [mustBeSomething, mustBeAnything]});
      assert(Array.isArray(result));
      assert.equal(1, result.length);
      assert.equal('name', result[0].fieldName);
      assert.equal('message', result[0].message);
    });
  });
  
  describe('validating object with a deep field', function(){
    it('should return an array only one field', function(){
      var result = validate({nested: {name:'nothing'}}, {'nested.name': mustBeSomething});
      assert(Array.isArray(result));
      assert.equal(1, result.length);
      assert.equal('nested.name', result[0].fieldName);
      assert.equal('message', result[0].message);
    });
  });
  
  describe('validating object with two invalid fields', function(){
    it('should return an array only two field', function(){
      var result = validate({name:'nothing', key:'nothing'}, {name: mustBeSomething, key: mustBeAnything});
      assert(Array.isArray(result));
      assert.equal(2, result.length);
      assert.equal('name', result[0].fieldName);
      assert.equal('message', result[0].message);
      assert.equal('key', result[1].fieldName);
      assert.equal('message', result[1].message);
    });
  });
});
