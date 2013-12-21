module.exports = function command(handle, constraints){
  handle.type = "command";
  handle.constraints = constraints || {};
  return handle;
}
