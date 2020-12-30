const express = require('express');
const app = express();
const nPortNumber = process.env.PORT || 3000;

const server = app.listen(nPortNumber, () => console.log(`Listening at port: ${nPortNumber}`))
const socketio = require('socket.io');
const io = socketio(server);

app.use ('/', express.static('public'))
io.sockets.on('connection', OnNewConnection)

const gameCacheObj = require("./sGameCache.js");

const mainMenuObj = require("./sMainMenu.js");
const gameObj = require("./sGame.js");

mainMenuObj.Init(io, gameCacheObj, gameObj);
gameObj.Init(io, gameCacheObj, mainMenuObj);


function OnNewConnection(socket) {
    const strFullUrl = socket.handshake.headers.referer;
    const strBaseUrl = ParseSubUrl (strFullUrl, socket.handshake.headers.host);

    if (strBaseUrl === "" || strBaseUrl === "index.html")
    {
        mainMenuObj.OnNewConnection (socket);
    }
    else if (strBaseUrl === "game.html")
    {
        gameObj.OnNewConnection (socket);
    }
    else{
        console.log ("Unknown Url: " + strFullUrl);
    }
}


//////////
//Eg:
//strFull: localhost:3000/game.html?a=1
//strDomain: localhost:3000
//Ret value: game.html
function ParseSubUrl (strFullUrl, strDomain)
{
    let nIndex = strFullUrl.indexOf (strDomain);
    if (nIndex == -1) { console.log ("Main: Parse Error 1: " + strFullUrl); return; }
    
    nIndex += strDomain.length + 1; //This should point to index of game.html?a=1
    const strSubUrlWithVar = strFullUrl.slice (nIndex, strFullUrl.length);

    const nIndexVarStart = strSubUrlWithVar.indexOf ("?");
    if (nIndexVarStart === -1)
    {   
        return strSubUrlWithVar;
    }
    else 
    {
        const strBaseUrl = strSubUrlWithVar.slice (0, nIndexVarStart); 
        return strBaseUrl;
    }
}