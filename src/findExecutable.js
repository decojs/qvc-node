var Promise = require('promise');

module.exports = function(allExecutables){
  var executables = {
    commandList: objectify(allExecutables.filter(function(e){return e.type == 'command';})),
    queryList: objectify(allExecutables.filter(function(e){return e.type == 'query';})),
    executableList: objectify(allExecutables)
  };

  return function findExecutable(name, type){
    var handler = executables[type+'List'][name];
    
    if(type != 'executable' && (handler == null || handler.type != type)){
      return Promise.reject();
    }else{
      return Promise.resolve(handler);
    }
  }
};


function objectify(list){
  return list.reduce(function(a,b){
    a[b.executableName] = b;
    return a;
  }, Object.create(null));
}