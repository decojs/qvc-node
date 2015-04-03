function NotEmpty(message){
  this.message = message;
}

NotEmpty.prototype.constraint = function(){
  return {
    name: "NotEmpty",
    attributes: {
      message: this.message
    }
  };
};

NotEmpty.prototype.isValid = function(value){
  if(value == null) return false;
  if(typeof value == "string" && value.length == 0) return false;
  return true;
};

module.exports = NotEmpty;