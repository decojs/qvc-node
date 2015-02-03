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

module.exports = [
  qvc.query('load', function(query, done){
    console.log("load", query.name);

    loadDataAsync(function(err, result){
      //transform the result somehow
      done(err, result);
    });
  }),
  qvc.command('save', function(command, done){
    console.log("save", command.name);
    
    saveDataAsync(command.name, command.content, function(err, success){
      done(err, success);
    });
  })
];
```

This file contains both a command and a query handler, and can be expanded in the future with
additional commands and queries. A project can consist of several files like this, with multiple
handlers for both commands and queries. 

A single routing file is needed for all this to work. An example is presented here:

```javascript
var qvc = require('qvc');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

app.use('/qvc', qvc(
  require('./handlers'),
  //add other handlers here...
));

app.listen(80);


```
