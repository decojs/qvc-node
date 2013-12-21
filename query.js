module.exports = function query(handle, constraints){
  handle.type = "query";
  handle.constraints = constraints || {};
  return handle;
}
