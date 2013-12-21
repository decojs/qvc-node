var getRawBody = require('raw-body')
var querystringParse = require('querystring').parse;
var extend = require('util')._extend;

function parseNameAndBody(func){
  return function(req, res, next){
    var name = req.params.name;
    getRawBody(req, function(err, result){
      if(err){
        res.statusCode = 500;
        return next(err);
      }

      var body = querystringParse(result.toString('utf8'));
      body.parameters = body.parameters || "{}";

      req.qvc = {
        name: name,
        parameters: JSON.parse(body.parameters)
      };

      func(req, res, next);
    });    
  }
}

function tryToCall(func){
  return function(req, res, next){
    try{
      func(req, res, next);
    }catch(e){
      res.end(JSON.stringify({valid:true, success: false, exception: e.stack}));
    }
  };
}



function setup(options){

  var executables = {
    commandList: options.commands,
    queryList: options.queries,
    executableList: extend(options.commands, options.queries)
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
    var executable = findExecutable(req.qvc.name, 'executable');
    if(executable == null){
      res.end(JSON.stringify({valid:true, success: false, exception: "not found"}));
    }else{
      res.end(JSON.stringify(executable.constraints));
    }
  }
  function command(req, res, next){
    var handle = findExecutable(req.qvc.name, 'command');
    if(handle == null){
      res.end(JSON.stringify({valid:true, success: false, exception: "not a command"}));
    }else{
      handle(req.qvc.parameters);
      res.end(JSON.stringify({valid:true, success: true}));
    }
  }
  function query(req, res, next){
    var handle = findExecutable(req.qvc.name, 'query');
    if(handle == null){
      res.end(JSON.stringify({valid:true, success: false, exception: "not a query"}));
    }else{
      handle(req.qvc.parameters, function(err, result){
        if(err){
          res.end(JSON.stringify({valid:true, success: false, result: err}));
        }else{
          res.end(JSON.stringify({valid:true, success: true, result: result}));
        }
      });
    }
  }

  return {
    constraints: parseNameAndBody(tryToCall(constraints)),
    command: parseNameAndBody(tryToCall(command)),
    query: parseNameAndBody(tryToCall(query)),
  };
}


module.exports = {
  setup: setup,
  command: require('./command'),
  query: require('./query')
}