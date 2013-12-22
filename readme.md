# QVC
## for node.js

This is an implementation of the [QVC](https://github.com/decojs/qvc) protocol for node. 
It supports commands and queries, and simple constraints, but not validation (yet). 

### Installation

Install it from npm using `npm install qvc`. This will install all needed dependencies

### About QVC

QVC is an alternative to REST which adds validation and error handling to ajax requests. 
It is a protocol on top of the HTTP layer using JSON to encode data in both directions.
QVC is short for Query Validation Command, describing the three parts of the protocol.
A request to the server can either be a query, where the server should return a result,
or a command, where the server should do some action. In both cases the client can send
parameters to the server in the form of a JSON object. This JSON object is validated on
the server, and the result of the validation is sent to the client in a standardized format.
The protocol also provides a way to send validation constraints to the client, for client-side
validation of parameters. 

### Usage

There are two parts to using QVC; creating a command/query handler and routing to it. 
The command/query handler is a function which takes a command/query as its first parameter,
and calls the second parameter with the result (standard node.js callback style). For example:

```javascript
var qvc = require('qvc');

module.exports = {
  load: qvc.query(function(query, done){
    console.log("load", query.name);

    var content = //load data from somewhere...

    done(null, {name:query.name, content:content});
  }),
  save: qvc.command(function(command, done){
    console.log("save", command.name);

    //actually save it

    done(null, true);
  })
};
```

This file contains both a command and a query handler, and can be expanded in the future with
additional commands and queries. A project can consist of several files like this, with multiple
handlers for both commands and queries. 

A single routing config file is needed for this to all work. An example is presented here:

```javascript
var setupQVC = require('qvc').setup;
var handlers = require('./handlers');
var connect = require('connect');
var router = require('urlrouter');

var qvc = setupQVC({
  commands:{
    'save': handlers.save
  },
  queries:{
    'load': handlers.load,
  }
});

connect.use(router(function(app){
  app.post('qvc/command/:name', qvc.command);
  app.post('qvc/query/:name', qvc.query);
  app.get('qvc/constraints/:name', qvc.constraints);
}));

connect.listen(80);


```
