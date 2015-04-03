function Pattern(regex, message){
  this.regex = regex;
  this.message = message;
}

Pattern.prototype.constraint = function(){
  return {
    name: "Pattern",
    attributes: {
      message: this.message,
      regexp: this.regex.source,
      flags: this.regex.ignoreCase ? ['CASE_INSENSITIVE'] : []
    }
  };
};

Pattern.prototype.isValid = function(value){

  if(value == null) return false;

  var result = this.regex.exec(value);

  if(result == null) return false;

  return result[0] == value;
};

module.exports = Pattern;