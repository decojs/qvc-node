var urlrouter = require('urlrouter');

function tryToCall(func, debug){
  return function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    try{
      func(req, res, next);
    }catch(e){
      endWithException(res, e, debug);
    }
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

function endWithException(res, error, debug){
  res.status(500);
  res.end(JSON.stringify({valid:true, success: false, exception: debug ? jsonError(error) : null}));
}

function endWithInvalid(res, violations){
  res.end(JSON.stringify({valid:false, success: false, violations: violations}));
}

function validate(executable, handler){
  return Object.keys(handler.constraints || {})
  .map(function(key){
    return {
      fieldName: key,
      constraints: Array.isArray(handler.constraints[key]) ? handler.constraints[key] : [handler.constraints[key]],
      value: key.split('.').reduce(function(object, key){
        return object[key];
      }, executable)
    }
  }).map(function(field){
    return {
      fieldName: field.fieldName,
      message: field.constraints.filter(function(constraint){
        return !constraint.isValid(field.value);
      }).map(function(constraint){
        return constraint.message;
      })[0]
    };
  }).filter(function(result){
    return result.message;
  });
}

function getConstraints(constraints){
  return {
    parameters: Object.keys(constraints).map(function(key){
      return {
        name: key,
        constraints: Array.isArray(constraints[key]) ? constraints[key].map(function(constraint){
          return constraint.constraint()
        }) : [constraints[key].constraint()]
      };
    })
  }
}

function qvc(options){
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
      return null;
    }else{
      return handler;
    }
  }

  function constraints(req, res, next){
    var executable = findExecutable(req.params.name, 'executable');
    if(executable == null){
      endWithException(res, "not found", options.debug);
    }else{
      res.end(JSON.stringify(getConstraints(executable.constraints)));
    }
  }
  
  function command(req, res, next){
    var handle = findExecutable(req.params.name, 'command');
    if(handle == null){
      endWithException(res, "not a command", options.debug);
    }else{
      var command = JSON.parse(req.body.parameters);
      var violations = validate(command, handle);
      if(violations.length){
        endWithInvalid(res, violations);
      }else{
        handle(command, function(err, result){
          if(err){
            endWithException(res, err, options.debug);
          }else{
            res.end(JSON.stringify({valid:true, success: true}));
          }
        });
      }
    }
  }
  
  function query(req, res, next){
    var handle = findExecutable(req.params.name, 'query');
    if(handle == null){
      endWithException(res, "not a query", options.debug);
    }else{
      var query = JSON.parse(req.body.parameters);
      var violations = validate(query, handle);
      if(violations.length){
        endWithInvalid(res, violations);
      }else{
        handle(query, function(err, result){
          if(err){
            endWithException(res, err, options.debug);
          }else{
            res.end(JSON.stringify({valid:true, success: true, result: result}));
          }
        });
      }
    }
  }

  return urlrouter(function(app){
    app.post('/command/:name', tryToCall(command, options.debug));
    app.post('/query/:name', tryToCall(query, options.debug));
    app.get('/constraints/:name', tryToCall(constraints, options.debug));
  });
}

qvc.command = require('./command');
qvc.query = require('./query');

module.exports = qvc;