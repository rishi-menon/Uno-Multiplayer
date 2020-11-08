const express = require('express');
const app = express();
const nPortNumber = 3000;

const server = app.listen(nPortNumber, () => console.log(`Listening at port: ${nPortNumber}`))
const socketio = require('socket.io');
const io = socketio(server)

app.use ('/', express.static('public'))
io.sockets.on('connection', OnNewConnection)


const mainMenuObj = require("./sMainMenu.js");
mainMenuObj.Init(io);


function OnNewConnection(socket) {
    mainMenuObj.OnNewConnection (socket);
}
