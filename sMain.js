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

const gameObj = require("./sGame.js");
gameObj.Init(io);


function OnNewConnection(socket) {

    let strUrl = socket.handshake.headers.referer;
    let nIndex = strUrl.lastIndexOf ("/");
    if (nIndex === -1) { console.log ("Could not find / in url: " + strUrl); return; }
    let strUrlEnd = strUrl.slice (nIndex+1, strUrl.length);

    if (strUrlEnd === "" || strUrlEnd === "index.html")
    {
        mainMenuObj.OnNewConnection (socket);
    }
    else if (strUrlEnd === "game.html")
    {
        gameObj.OnNewConnection (socket);
    }
    else{
        console.log ("Unknown Url: " + strUrlEnd);
    }

}
