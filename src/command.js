module.exports = function command(name, handle, constraints){
  handle.type = "command";
  handle.executableName = name;
  handle.constraints = constraints || {};
  return handle;
}
