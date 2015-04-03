module.exports = function query(name, handle, constraints){
  handle.type = "query";
  handle.executableName = name;
  handle.constraints = constraints || {};
  return handle;
}
