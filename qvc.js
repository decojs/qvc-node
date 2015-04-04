var urlrouter = require('urlrouter');
var validate = require('./src/validate');
var getConstraints = require('./src/getConstraints');
var Promise = require('promise');

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

function flatten(list){
  return list.reduce(function(a,b){
    return a.concat(b);
  },[]);
}

function objectify(list){
  return list.reduce(function(a,b){
    a[b.executableName] = b;
    return a;
  },Object.create(null));
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
  var options = Array.prototype.filter.call(arguments, function(argument){
    return !Array.isArray(argument);
  })[0]||{};
  
  var allExecutables = flatten(Array.prototype.filter.call(arguments, function(argument){
    return Array.isArray(argument);
  }));
  
  var executables = {
    commandList: objectify(allExecutables.filter(function(e){return e.type == 'command';})),
    queryList: objectify(allExecutables.filter(function(e){return e.type == 'query';})),
    executableList: objectify(allExecutables)
  };

  function findExecutable(name, type){
    var handler = executables[type+'List'][name];
    
    if(type != 'executable' && (handler == null || handler.type != type)){
      return Promise.reject();
    }else{
      return Promise.resolve(handler);
    }
  }

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
      var violations = validate(command, handle.constraint);
      if(violations.length){
        return {valid:false, success: false, violations: violations};
      }else{
        return handle(command);
      }
    }, function(){
      throw "not a command";
    }).then(function(){
      return {valid: true, success: true};
    });
  }
  
  function query(name, parameters){
    return findExecutable(name, 'query')
    .then(function(handle){
      var query = JSON.parse(parameters);
      var violations = validate(query, handle.constraint);
      if(violations.length){
        return {valid:false, success: false, violations: violations};
      }else{
        return handle(query);
      }
    }, function(){
      throw "not a query";
    }).then(function(result){
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