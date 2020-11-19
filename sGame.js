/////          Public data.. Gets set in Init
let io;

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////                              Logging

const fs = require ('fs');
const { type } = require('os');

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
const strLogfilePath = "./Log/game.log"
fs.writeFileSync (strLogfilePath, "");  //This is to delete the previous contents of the log file

const logFile = fs.createWriteStream(strLogfilePath, {flags:'a'});  //flags is for append mode


function Log (level, strMessage) {
    if (level <= nLogLevel) 
    {
        let str = level + ": " + strMessage + "\n";
        logFile.write (str);
    }

    //To do: this is temporary to make debugging easier
    if (level <= LogTrace)
    {
        console.log (strMessage);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

let mapRoomCodeToPlayers = new Map();
let mapSocketIdToRoomCode = new Map();

const nMaxPlayersInRoom = 8;

const cardGenerator = require ("./sCardGenerator.js");


//Public API
module.exports.Init = function(_io) {
    io = _io;
}

module.exports.OnNewConnection = function (socket) {
    
    socket.on ('disconnect', () => {
        Log (LogTrace, "Disconnected: " + socket.id)
        LeaveRoom (socket);
    });

    socket.on ("g_InitJoinRoom", (strCode) => {
        InitJoinRoom (socket, strCode);
    });

    socket.on ("g_PlayerLeaveRoom", () => {
        //To do
        LeaveRoom (socket);
    });

    socket.on ("g_StartNextRound", () => {
        StartNextRound (socket);
    });
}

function StartNextRound (socket) {

    const strRoomCode = mapSocketIdToRoomCode.get (socket.id);
    if (!strRoomCode) { Log (LogWarn, "Socket does not exist in map while starting next round"); return; }

    UpdatePlayerNum (strRoomCode, true, true);
    io.in(strRoomCode).emit("g_StartNextRoundSuccess");
}

function LeaveRoom (socket) {
    let strRoomCode = mapSocketIdToRoomCode.get (socket.id);
    if (!strRoomCode) { Log (LogWarn, "socket leave room: does not exist in the socketId map"); return; }

    let mapPlayers = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapPlayers) { Log (LogWarn, "socket leave room: does not exist in the player map"); return; }

    let nClientIndex = -1;
    for (let i = 0; i < mapPlayers.count; i++)
    {
        if (mapPlayers.players[i].socketId == socket.id)
        {
            nClientIndex = i;
        }
    }
    if (nClientIndex == -1) { Log (LogWarn, "socket leave room: Could not find client index"); return; }

    //Remove socket from the socket map
    mapSocketIdToRoomCode.delete (socket.id);

    //Remove socket from the players map
    mapPlayers.count -= 1;
    mapPlayers.players.splice (nClientIndex, 1);
    socket.leave (strRoomCode);

    if (mapPlayers.hostIndex == nClientIndex)
    {
        //The host left... Calculate/set a new host
        mapPlayers.hostIndex = 0; //It could be random but just set it to 0 for simplicity
    }

    if (mapPlayers.count == 0)
    {
        //All players left.. Delete from map
        mapRoomCodeToPlayers.delete (strRoomCode);
    }
    else
    {
        // UpdatePlayerNum (strRoomCode, false);
        UpdateScoreBoard (strRoomCode);
    }
}

function InitJoinRoom (socket, strCode) {
    Log (LogTrace, "InitJoinRoom: " + strCode);

    //To do: Calculate this value from strCode
    let strRoomCode = "ABCD";
    let strPlayerName = "Rishi";
    let bIsHost = true;

    const nPlayerWins = 0;


    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);

    if (!mapValue) {
        //Create the object and insert it into the map
        mapValue = new Object ();
        mapValue.players = [];
        mapValue.count = 0;
        
        mapValue.bRoundStarted = false; //This gets set to true when the actual game starts...
        mapValue.strPlayerOrder = "";

        //This exists when the host joins the room
        // mapValue.hostIndex = false;  
        mapRoomCodeToPlayers.set (strRoomCode, mapValue);
    }
    else
    {
        //The room already exists
        if (mapValue.bRoundStarted)
        {
            //The player cannot join while the round is ongoing... The player should not have reached to game.html while the round is ongoing... Logical error
            Log (LogCritical, "Fatal Error: A player joined a room while it was ongoing... Logical error");
            socket.emit ("g_InitJoinRoomFailure", "Cannot join room. The round has already started");
            return;
        }
    }

     //Success
     socket.join (strRoomCode);
     socket.emit ("g_InitJoinRoomSuccess");

    let nPlayerIndex = mapValue.count;
    if (nPlayerIndex >= nMaxPlayersInRoom) return;

    mapValue.players[nPlayerIndex] = { name: strPlayerName, socketId: socket.id, winCount: nPlayerWins };
    mapValue.players[nPlayerIndex].cards = [];
    mapValue.count += 1;

    //To do: temp code.. remove once you calculate bIsHost from the strCode
    if (mapValue.hasOwnProperty ("hostIndex"))
    {
        bIsHost = false;
    }

    
    if (bIsHost)
    {
        mapValue.hostIndex = nPlayerIndex;
    }

    mapSocketIdToRoomCode.set (socket.id, strRoomCode);
    

    
    socket.join (strRoomCode);

    // UpdatePlayerNum (strRoomCode, false);
    UpdateScoreBoard (strRoomCode);
}

function UpdateScoreBoard(strRoomCode)
{
    let mapValue = mapRoomCodeToPlayers.get(strRoomCode);
    if (!mapValue) return;

    const data = GenerateScoreBoardData (mapValue);
    if (data)
    {
        io.in(strRoomCode).emit("g_UpdateScoreBoard", data, strRoomCode);
        io.in(strRoomCode).emit("g_UpdateScoreBoard_HideBtn");  //Hide the Next Round Btn
        
        if (data.count > 1 && mapValue.hasOwnProperty("hostIndex"))
        {
            //Only host can start the next round
            let playerSocketId = mapValue.players[mapValue.hostIndex].socketId;
            io.to(playerSocketId).emit("g_UpdateScoreBoard_ShowBtn");
        }
    }

}
////////////////////////////////////////////////////////////////////////////////////////
////////////////                  Update Player Num (For when a new player joins or leaves)  

function UpdatePlayerNum (strRoomCode, bRandomizeOrder, bGenerateCards) {
    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue) { Log(LogWarn, "Room code does not exist in the map in UpdatePlayerNum: " + strRoomCode); return; }

    let strPlayerOrder;
    if (bRandomizeOrder === true)
    {
        strPlayerOrder = GeneratePlayerOrder(mapValue.count);
    }
    else if (bRandomizeOrder === false)
    {
        strPlayerOrder = GeneratePlayerOrderNonRandom (mapValue.count, mapValue.strPlayerOrder);
    }
    else { Log(LogWarn, "UpdatePlayerNum: second parameter should be a boolean: " + bRandomizeOrder + "..." + typeof(bRandomizeOrder)); return; }

    if (bGenerateCards === true)
    {
        const nInitialCards = 7;
        for (let i = 0; i < mapValue.count; i++) {
            let curPlayer = mapValue.players[i];
            if (curPlayer) { 
                curPlayer.cards = cardGenerator.GetCards (nInitialCards);
            }
        }
    }

    mapValue.strPlayerOrder = strPlayerOrder;

    for (let i = 0; i < mapValue.count; i++)
    {
        let curPlayer = mapValue.players[i];
        if (!curPlayer) { Log (LogWarn, "Player does not exist in the map"); continue; }

        let strSocketId = curPlayer.socketId;
        let generatedData = GenerateUpdatePlayerData(mapValue, i);
        io.to(strSocketId).emit ("g_UpdatePlayerNum", strPlayerOrder, i, generatedData);
    }
}



function GeneratePlayerOrder (nPlayerCount)
{
    let orders = [];
    for (let i = 0; i < nPlayerCount; i++)
    {
        orders[i] = i;
    }

    let strOrder = "";
    for (let i = 0; i < nPlayerCount; i++) {
        let r = Math.floor(Math.random() * orders.length);
        strOrder += orders[r].toString();
        orders.splice(r, 1);
    }

    return strOrder;
}

//This function preserves the current order... The missing numbers are added at the end
function GeneratePlayerOrderNonRandom (nPlayerCount, strPlayerOrder)
{
    let mapSeen = new Map();
    let strOrder = "";
    for (let i = 0; i < strPlayerOrder.length; i++) {
        let r = Number(strPlayerOrder[i]);
        if (r < nPlayerCount) {
            mapSeen.set (r, true);
            strOrder += strPlayerOrder[i];
        }
    }

    for (let i = 0; i < nPlayerCount; i++)
    {
        if (!mapSeen.has(i))
        {
            strOrder += i.toString();
        }
    }
    return strOrder;
}

//Generates the player data to send to the client... All the players except the receiver client have their cards set to back ( so the client does not receive the value of the cards)
//Return Value:
//      int count
//      players:
//          string name
//          int winCount
//          array(strings) cards:

function GenerateUpdatePlayerData (mapValue, index)
{
    let retValue = new Object();
    retValue.players = [];
    retValue.count = mapValue.count;
    for (let i = 0; i < mapValue.count; i++)
    {
        let curPlayer = mapValue.players[i];
        retValue.players[i] = { name: curPlayer.name, winCount: curPlayer.winCount };
        retValue.players[i].cards = [];
        if (i == index)
        {
            for (let j = 0; j < curPlayer.cards.length; j++)
            {
                retValue.players[i].cards[j] = curPlayer.cards[j];
            }
        }
        else
        {
            for (let j = 0; j < curPlayer.cards.length; j++)
            {
                retValue.players[i].cards[j] = "black-back";
            }
        }
    }
    return retValue;
}

//Generates the player data to send to the client... This is mainly for updating the scoreboard so the cards are not calculated
//Return Value:
//      int count
//      players:
//          string name
//          int winCount

function GenerateScoreBoardData (mapValue) {
    const returnVal = new Object();
    returnVal.count = mapValue.count;
    returnVal.players = [];
    
    for (let i = 0; i < mapValue.count; i++)
    {
        const curPlayer = mapValue.players[i];
        returnVal.players[i] = { name: curPlayer.name, winCount: curPlayer.winCount };
    }
    
    return returnVal;
}