module.exports = function getConstraints(constraints){
  return {
    parameters: Object.keys(constraints || {}).map(function(key){
      return {
        name: key,
        constraints: (Array.isArray(constraints[key]) ? constraints[key] : [constraints[key]]).map(function(constraint){
          return {
            name: constraint.constructor.name,
            attributes: constraint.constraint()
          };
        })
      };
    })
  }
}