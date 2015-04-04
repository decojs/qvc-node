module.exports = function(list){
  var options = Array.prototype.filter.call(list, function(argument){
    return !Array.isArray(argument);
  })[0]||{};
  
  var allExecutables = flatten(Array.prototype.filter.call(list, function(argument){
    return Array.isArray(argument);
  }));
  
  return {
    options: options,
    allExecutables: allExecutables
  };
};


function flatten(list){
  return list.reduce(function(a,b){
    return a.concat(b);
  },[]);
}
