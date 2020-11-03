
var http = require('http');

const nPortListen = 80;

var server = http.createServer (function(request, response) {
    console.log ('Got a request: ');
    response.write ('Heyy!');
    response.end();
});

server.listen (nPortListen);
console.log ('Listening on port ' + nPortListen);
