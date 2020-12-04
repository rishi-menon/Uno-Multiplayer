
/////          Public data.. Gets set in Init
let io;
let gameCache;
let gameObj;

/////          Local Data
//Map of room code to player objects
let mapRoomCodeToPlayers = new Map();
let mapSocketIdToRoomCode = new Map();

const nMaxRoomsAllowed = 2;
const nMaxPlayersPerRoom = 8;

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////                              Logging

const fs = require ('fs');

// 0:None
// 1:Critical
// 2:Error
// 3:Warning
// 4:Info
// 5:Trace
const LogCritical = 1;
const LogError    = 2;
const LogWarn     = 3;
const LogInfo     = 4;
const LogTrace    = 5;

const nLogLevel = LogWarn;
const strLogfilePath = "./Log/mainMenu.log"
fs.writeFileSync (strLogfilePath, "");  //This is to delete the previous contents of the log file

const logFile = fs.createWriteStream(strLogfilePath, {flags:'a'});  //flags is for append mode


function Log (level, strMessage) {
    if (level <= nLogLevel) 
    {
        let str = level + ": " + strMessage + "\n";
        logFile.write (str);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

//Public API
module.exports.Init = function(_io, _gameCache, _gameObj) {
    io=_io;
    gameCache = _gameCache;
    gameObj = _gameObj;
}

module.exports.PlayerCanJoinRoomMidway = function (bJoinStatus, strCacheId)
{
    const cache = gameCache.GetCache (strCacheId);
    if (!cache) { 
        Log (LogError, "PlayerCanJoinRoomMidway: Cache obj does not exist");
        io.to(cache.socketId).emit ("m_JoinRoomFail", "Server Error: Cache obj does not exist");
        return;
    } 

    if (!bJoinStatus)
    {
        io.to(cache.socketId).emit ("m_JoinRoomFail", "Host did not accept");
    }
    else
    {
        const strId = gameCache.SetPlayerCache (cache.strRoomCode, cache.name, false);
        io.to(cache.socketId).emit ("m_RedirectToGame", strId);
    }
}

module.exports.OnNewConnection = function (socket) {
    Log (LogTrace, "New Connection in main menu: " + socket.id);

    socket.on ('disconnect', () => {
        Log (LogTrace, "Disconnected: " + socket.id)
        LeaveRoom (socket);
    });

    socket.on ("m_CreateRoom", (strPlayerName) => {
        CreateRoom (socket, strPlayerName);
    });

    socket.on ("m_JoinRoom", (strRoomCode, strPlayerName) => {
        JoinRoom (socket, strRoomCode, strPlayerName);
    });

    socket.on ("m_PlayerLeftRoom", () => {
        LeaveRoom (socket);
    });

    socket.on("m_KickPlayerFromRoom", (nPlayerIndex) => {
        KickPlayerFromRoom (socket, nPlayerIndex);
    });

    socket.on("m_StartGame", () => {
        StartGame (socket);
    });
}



function StartGame (socket) {
    const strRoomCode = mapSocketIdToRoomCode.get(socket.id);
    if (!strRoomCode)
    {
        Log (LogInfo, "sMainMenu.js: StartGame: socket dne in map:  " + socket.id);
        return;
    }
    
    const mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue)
    {
        Log (LogInfo, "sMainMenu.js: StartGame: room code dne in map:  " + strRoomCode);
        return;
    }

    let index = -1;
    for (let i = 0; i < mapValue.count; i++)
    {
        if (mapValue.players[i].socketId === socket.id)
        {
            index = i;
            break;
        }
    }
    if (index === -1) {
        Log (LogWarn, "sMainMenu.js: StartGame: Couldn\'t find index");     
        return;
    }

    ///////

    for (let i = 0; i < mapValue.count; i++)
    {
        const val = mapValue.players[i];
        if (!val) { Log(LogError, "StartGame: Something went wrong"); continue; }

        const bIsHost = (i === 0);
        const strId = gameCache.SetPlayerCache (strRoomCode, val.name, bIsHost);
        io.to(val.socketId).emit ("m_RedirectToGame", strId);
    }
}



/////    Local functions
function KickPlayerFromRoom (socketRoom, nPlayerIndex)
{
    //cannot kick host ie index 0
    if (nPlayerIndex < 1 || nPlayerIndex > (nMaxPlayersPerRoom-1))
    {
        Log (LogWarn, "Invalid index for kick: " + nPlayerIndex);
        return;
    }
    
    let groupName = mapSocketIdToRoomCode.get (socketRoom.id);
    if (!groupName) return;

    let mapValue = mapRoomCodeToPlayers.get (groupName);
    if (!mapValue)  return;

    if (nPlayerIndex >= mapValue.count) return;

    let playerSocketId = mapValue.players[nPlayerIndex].socketId;
    let playerSocket = io.sockets.connected[playerSocketId];
    LeaveRoom (playerSocket, "You have been kicked from the room");
}

function LeaveRoom (socket, strOptionalMsgIndividual) {
    
    let roomCode = mapSocketIdToRoomCode.get(socket.id);
    if (!roomCode)
    {
        Log (LogInfo, "Socket tried to leave but is not registered in the socket map: " + socket.id);
        return;
    }
    
    let mapValue = mapRoomCodeToPlayers.get (roomCode);
    if (!mapValue)
    {
        Log (LogInfo, "Socket tried to leave but is not registered in the RoomCode map: " + roomCode);
        return;
    }

    let index = -1;
    for (let i = 0; i < mapValue.count; i++)
    {
        if (mapValue.players[i].socketId === socket.id)
        {
            index = i;
            break;
        }
    }
    if (index === -1) {
        Log (LogWarn, "Could not find socket in the list of players");     
        return;
    }

    if (index === 0)
    {
        //The host of the game left... Disconnect everyone and leave the room
        socket.to(roomCode).emit ("m_LeaveRoom", "Host disconnected or left the room");
        socket.emit("m_LeaveRoom", "");

        for (let i = 0; i < mapValue.count; i++)
        {
            let playerSocketId = mapValue.players[i].socketId;
            mapSocketIdToRoomCode.delete (playerSocketId);
            
            let playerSocket = io.sockets.connected[playerSocketId];
            if (playerSocket) { playerSocket.leave (roomCode); }
        }
        mapRoomCodeToPlayers.delete (roomCode);
    }
    else
    {
        //Normal player left
        mapSocketIdToRoomCode.delete (socket.id);
        mapValue.count -= 1;
        mapValue.players.splice (index, 1);
        socket.leave (roomCode);

        //A regular player left
        let strMessage = (strOptionalMsgIndividual) ? strOptionalMsgIndividual : "";

        socket.emit ("m_LeaveRoom", strMessage);
        UpdatePlayersInRoom (roomCode);
    }
}

function UpdatePlayersInRoom (strRoomCode)
{
    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue)
    {
        Log (LogWarn, "Room " + strRoomCode + " does not exist in UpdatePlayersInRoom");
        return;
    }

    let updatePlayerData = new Object ();
    updatePlayerData.count = mapValue.count;

    updatePlayerData.playerNames = [];
    for (let i = 0; i < mapValue.count; i++)
    {
        updatePlayerData.playerNames[i] = mapValue.players[i].name;
    }
    
    io.in(strRoomCode).emit("m_UpdatePlayersInRoom", updatePlayerData);
    UpdateHostButtons(strRoomCode);
}

//The start button is only visible to the host and should only be visible when there are atleast two people in the room
function UpdateHostButtons (strRoomCode)
{
    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue)
    {
        Log (LogWarn, "Room " + strRoomCode + " does not exist in UpdateHostButtons");
        return;
    }

    let bShowButtons = (mapValue.count >= 2) ? true : false;
    let socketId = mapValue.players[0].socketId;
    io.to(socketId).emit ("m_UpdateHostButtons", bShowButtons);
}

function CreateRoom (socket, strPlayerName) {
    Log (LogTrace, strPlayerName + " tried to create a room: " + socket.id);

    if (mapRoomCodeToPlayers.size >= nMaxRoomsAllowed)
    {
        socket.emit ("m_CreateRoomFail", "No rooms left");
        return;
    }
    
    if (mapSocketIdToRoomCode.has (socket.id))
    {
        socket.emit ("m_CreateRoomFail", "Leave created room before joining a room");
        return;
    }
    
    let strRoomCode = GenerateRoomCode ();
    if (strRoomCode === "")
    {
        socket.emit ("m_CreateRoomFail", "Could not create a unique room code");
        return;
    }

    mapSocketIdToRoomCode.set (socket.id, strRoomCode);
    //Map properties
    let value = new Object();
    value.players = [];
    //Index 0 will always be the host
    value.players[0] = { name: strPlayerName, socketId: socket.id };
    value.count = 1;    //number of players currently in the group

    mapRoomCodeToPlayers.set (strRoomCode, value);

    socket.join (strRoomCode);
    socket.emit ("m_CreateRoomSucc", strRoomCode);

    UpdatePlayersInRoom (strRoomCode);
}

function JoinRoom (socket, strRoomCode, strPlayerName) {
    Log (LogTrace, "Client is trying to connect to room: " + strRoomCode);
    
    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    let mapGameRunningValue = gameObj.GetGameRoom (strRoomCode);
    
    if (!mapValue && !mapGameRunningValue)
    {
        Log (LogTrace, "Room " + strRoomCode + " does not exist");
        socket.emit ("m_JoinRoomFail", "Room does not exist");
        return;
    }

    if (mapValue && mapValue.count >= nMaxPlayersPerRoom)
    {
        Log (LogTrace, "Room " + strRoomCode + " is full");
        socket.emit ("m_JoinRoomFail", "Room is full");
        return;
    }
    if (mapGameRunningValue && mapGameRunningValue.count >= nMaxPlayersPerRoom)
    {
        Log (LogTrace, "Room " + strRoomCode + " is full");
        socket.emit ("m_JoinRoomFail", "Room is full");
        return;
    }

    if (mapValue)
    {
        //Normal room... Game hasnt started yet
        mapValue.players[mapValue.count] = { name: strPlayerName, socketId: socket.id };
        mapValue.count += 1;
        mapSocketIdToRoomCode.set (socket.id, strRoomCode);
        socket.join (strRoomCode);

        socket.emit ("m_JoinRoomSucc", strRoomCode);

        UpdatePlayersInRoom (strRoomCode);
    }
    else if (mapGameRunningValue)
    {
        //Game has already started... Send a message to the host asking if this player can join the room
        //in seconds... If you change this value, then change the timeout value in the game.js as well.. The timeout for the dialog to disappear on its own
        const nSocketCacheTimeout = 60; 
        const cacheObj = {socketId: socket.id, name: strPlayerName, strRoomCode: strRoomCode };

        const strSocketCacheId = gameCache.SetCache (cacheObj, nSocketCacheTimeout);
        if (!strSocketCacheId)  { 
            Log (LogWarn, "Error: Could not generate socket cacheId"); 
            socket.emit ("m_JoinRoomFail", "Server Error: Could not generate socket cacheId");
            return; 
        }

        if (mapGameRunningValue.game.bRoundStarted === false)
        {
            //Ask the host of the current game if player can join
            gameObj.AskPlayerJoinRunningGame (strRoomCode, strPlayerName, strSocketCacheId);
        }
        else
        {
            socket.emit ("m_JoinRoomFail", "Cannot join room while game is ongoing");
            return;  
        }
    }
}


function GenerateRoomCode () {
    const nMaxTries = 20;
    let roomCode = "";
    const strLetters = "abcdefghijklmnopqrstuvwxyz";
    let bIsTaken = true;

    for (let i = 0; i < nMaxTries && bIsTaken; i++)
    {
        roomCode="";
        for (let j = 0; j < 4; j++)
        {
            let randindex = Math.floor(Math.random() * 26);
            roomCode += strLetters[randindex];
        }
        if (mapRoomCodeToPlayers.has(roomCode)) continue;
        
        //Check if the room code already exists and is running
        if (gameObj.GetGameRoom (roomCode)) continue;

        //Reserved room code. This room code will never be generated. This is for testing purposes
        if (roomCode == "xyzw") continue;

        bIsTaken = false;
    }

    if (bIsTaken)
        return "";
    else
        return roomCode;
}