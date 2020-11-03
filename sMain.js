const express = require('express');
const app = express();
const nPortNumber = 3000;

const server = app.listen(nPortNumber, () => console.log(`Listening at port: ${nPortNumber}`))
const socketio = require('socket.io');
const io = socketio(server)

app.use ('/', express.static('public'))

io.sockets.on('connection', OnNewConnection)

// io.sockets.on('disconnect', (socket) => {
//     console.log ("Disconnected: " + socket.id);
// })

function OnNewConnection(socket) {
    console.log ("New Connection: " + socket.id);

    socket.on ('disconnect', () => {
        console.log ("Disconnected: " + socket.id)
    })
}
