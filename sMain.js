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
    });

    socket.on ("m_CreateRoom", () => {
        console.log ("Client tried to create a room");
        //To do: create a room code. Create a socket io room and add socket to the room
        let strRoomCode = "BABA";
        socket.emit ("m_RoomCreated", strRoomCode);
    });

    socket.on ("m_JoinRoom", (strRoomCode) => {
        console.log ("Client is trying to connect to room: " + strRoomCode);
        //To do: check if room exists and is not full... If so join and add socket to the room (Also then send a brodcast message to the others)
        socket.emit ("m_RoomJoined", strRoomCode);
    });

}
