module.exports = function (executable, constraints){
  return Object.keys(constraints || {})
  .map(function(key){
    return {
      fieldName: key,
      constraints: Array.isArray(constraints[key]) ? constraints[key] : [constraints[key]],
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