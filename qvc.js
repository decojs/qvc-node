var urlrouter = require('urlrouter');
var validate = require('./src/validate');
var getConstraints = require('./src/getConstraints');
var parseArguments = require('./src/parseArguments');
var executableLookup = require('./src/findExecutable');

function tryToCall(func, debug){
  return function(req, res, next){
    func(req.params.name, req.body.parameters)
    .then(function(result){
      return JSON.stringify(result);
    }, function(error){
      res.status(500);
      return JSON.stringify({valid:true, success: false, exception: debug ? jsonError(error) : null});
    }).then(function(response){
      res.setHeader('Content-Type', 'application/json');
      res.end(response);
    })
  };
}

function jsonError(error){
  if(error instanceof Error){
    Object.defineProperty(error, 'toJSON', {
      value: function () {
        var alt = {};

        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);

        return alt;
      },
      configurable: true,
    });
  }
  
  return error;
}

function qvc(){
  var args = parseArguments(arguments);
  
  var options = args.options;
  var findExecutable = executableLookup(args.allExecutables);

  function constraints(name){
    return findExecutable(name, 'executable')
    .then(function(executable){
      return getConstraints(executable.constraints);
    }, function(){
      throw "not found";
    });
  }
  
  function command(name, parameters){
    return findExecutable(name, 'command')
    .then(function(handle){
      var command = JSON.parse(parameters);
      var violations = validate(command, handle.constraints);
      if(violations.length){
        return {valid:false, success: false, violations: violations};
      }else{
        return handle(command);
      }
    }, function(){
      throw "not a command";
    }).then(function(result){
      if(result && typeof result === 'object' && 'valid' in result && 'success' in result){
        return result;
      }
      return {valid: true, success: true};
    });
  }
  
  function query(name, parameters){
    return findExecutable(name, 'query')
    .then(function(handle){
      var query = JSON.parse(parameters);
      var violations = validate(query, handle.constraints);
      if(violations.length){
        return {valid:false, success: false, violations: violations};
      }else{
        return handle(query);
      }
    }, function(){
      throw "not a query";
    }).then(function(result){
      if(result && typeof result === 'object' && 'valid' in result && 'success' in result){
        return result;
      }
      return {valid: true, success: true, result: result};
    });
  }

  return urlrouter(function(app){
    app.post('/command/:name', tryToCall(command, options.debug));
    app.post('/query/:name', tryToCall(query, options.debug));
    app.get('/constraints/:name', tryToCall(constraints, options.debug));
  });
}

qvc.command = require('./src/command');
qvc.query = require('./src/query');

module.exports = qvc;