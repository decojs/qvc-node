var express = require('express');

function tryToCall(func){
  return function(req, res, next){
    try{
      func(req, res, next);
    }catch(e){
      res.end(JSON.stringify({valid:true, success: false, exception: e.stack}));
    }
  };
}

function flatten(list){
  return Array.prototype.reduce.call(list, function(a,b){
    return a.concat(b);
  },[]);
}

function objectify(list){
  return list.reduce(function(a,b){
    a[b.executableName] = b;
    return a;
  },Object.create(null));
}

function qvc(){
  var router = express.Router();
  
  var allExecutables = flatten(arguments);
  
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
      res.end(JSON.stringify({valid:true, success: false, exception: "not found"}));
    }else{
      res.end(JSON.stringify(executable.constraints));
    }
  }
  function command(req, res, next){
    var handle = findExecutable(req.params.name, 'command');
    if(handle == null){
      res.end(JSON.stringify({valid:true, success: false, exception: "not a command"}));
    }else{
      handle(JSON.parse(req.body.parameters), function(err, result){
        if(err){
          res.end(JSON.stringify({valid:true, success: false}));
        }else{
          res.end(JSON.stringify({valid:true, success: true}));
        }
      });
    }
  }
  function query(req, res, next){
    var handle = findExecutable(req.params.name, 'query');
    if(handle == null){
      res.end(JSON.stringify({valid:true, success: false, exception: "not a query"}));
    }else{
      handle(JSON.parse(req.body.parameters), function(err, result){
        if(err){
          res.end(JSON.stringify({valid:true, success: false, result: err}));
        }else{
          res.end(JSON.stringify({valid:true, success: true, result: result}));
        }
      });
    }
  }

  router.post('/command/:name', tryToCall(command));
  router.post('/query/:name', tryToCall(query));
  router.get('/constraints/:name', tryToCall(constraints));
  
  return router;
}

qvc.command = require('./command');
qvc.query = require('./query');

module.exports = qvc;