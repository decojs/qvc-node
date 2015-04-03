var urlrouter = require('urlrouter');

function tryToCall(func, debug){
  return function(req, res, next){
    try{
      func(req, res, next);
    }catch(e){
      res.end(withException(e, debug));
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

function withException(error, debug){
  return JSON.stringify({valid:true, success: false, exception: debug ? jsonError(error) : null});
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
      res.end(withException("not found", options.debug));
    }else{
      res.end(JSON.stringify(executable.constraints));
    }
  }
  function command(req, res, next){
    var handle = findExecutable(req.params.name, 'command');
    if(handle == null){
      res.end(withException("not a command", options.debug));
    }else{
      handle(JSON.parse(req.body.parameters), function(err, result){
        if(err){
          res.end(withException(err, options.debug));
        }else{
          res.end(JSON.stringify({valid:true, success: true}));
        }
      });
    }
  }
  function query(req, res, next){
    var handle = findExecutable(req.params.name, 'query');
    if(handle == null){
      res.end(withException("not a query", options.debug));
    }else{
      handle(JSON.parse(req.body.parameters), function(err, result){
        if(err){
          res.end(withException(err, options.debug));
        }else{
          res.end(JSON.stringify({valid:true, success: true, result: result}));
        }
      });
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