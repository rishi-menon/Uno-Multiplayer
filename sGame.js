/////          Public data.. Gets set in Init
let io;

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////                              Logging

const fs = require ('fs');
const { type } = require('os');
const { createDeflate } = require('zlib');

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
const nInitialCards = 7;
const nMaxRounds = 4;

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
        LeaveRoom (socket);
    });

    socket.on ("g_StartNextRound", () => {
        StartNextRound (socket);
    });

    socket.on ("g_DrawCardsSelf" , (nCardsCount) => {
        AddCardsToPlayer (socket.id, nCardsCount, true);
    });

    socket.on ("g_PlayerEndTurn", (strCurrentCard, cardMeta) => {
        PlayerEndedTurn (socket, strCurrentCard, cardMeta);
    });

    socket.on ("g_DestroyRoom", (strErrorMessage) => {
        DestroyRoom (socket, strErrorMessage);
    });
}


function DestroyRoom (socket, strErrorMessage)
{
    const {roomCode: strRoomCode, mapValue: mapValue, index: nServerIndex} = GetGenericValuesFromSocket (socket.id, "DestroyRoom");
    if (nServerIndex == -1) { Log(LogWarn, "Could not destroy room"); return; }

    //display error message
    socket.to (strRoomCode).emit ("g_DisplayErrorMessage", strErrorMessage);
    io.in (strRoomCode).emit ("g_SetScoreBoardVisibility", false);
    LeaveRoom (socket);
}

///////////////////////////////////////////////////////////////////////////
////////////////////
///////////////////////////////////////////////////////////////////////////


//Helper function which is probably going to be used only once
function h_CalculateNextPlayerTurn (mapValue, strCardColor, strCardType, bCardThrown)
{
    //calculate index of current player in the order
    const nStringIndexCur = mapValue.game.strPlayerOrder.indexOf (mapValue.game.nTurnIndex);
    if (nStringIndexCur == -1) { Log (LogError, "PlayerEndedTurn: Couldnt find nStringIndexCur"); return; }

    //Calculate who the next player is
    let nStringIndexNew = nStringIndexCur;
    nStringIndexNew += (mapValue.game.bClockwise) ? 1 : -1;

    if (bCardThrown === true && strCardType == "skip")
    {
        nStringIndexNew += (mapValue.game.bClockwise) ? 1 : -1;
    }

    //Check if it went out of bounds
    while (nStringIndexNew < 0) {
        nStringIndexNew += mapValue.count;
    }
    //Could use a modulo operation here instead but this will also work
    while (nStringIndexNew >= mapValue.count) {
        nStringIndexNew -= mapValue.count;
    }

    return Number(mapValue.game.strPlayerOrder[nStringIndexNew]);
}

function h_RemoveCardFromPlayer (player, strCard)
{
    const cards = player.cards;
    for (let i = 0; i < cards.length; i++)
    {
        if (cards[i] == strCard)
        {
            cards.splice (i, 1);
            return true;
        }
    }
    return false;
}

function h_PlayerWonRound (strRoomCode, mapValue, nServerIndex)
{
    const playerData = mapValue.players[nServerIndex];
    playerData.winCount += 1;
    mapValue.game.bRoundStarted = false;

    io.in (strRoomCode).emit ("g_SetScoreBoardVisibility", true);
    // const hostSocketId = mapValue.players[mapValue.hostIndex].socketId;
    
    UpdateScoreBoard (strRoomCode);
}

function PlayerEndedTurn (socket, strCurrentCard, cardMeta)
{   
    const {roomCode: strRoomCode, mapValue: mapValue, index: nServerIndex} = GetGenericValuesFromSocket (socket.id, "PlayerEndedTurn");
    if (nServerIndex == -1) { return; }

    //validate the cardMeta
    if (!cardMeta.hasOwnProperty ("bCardThrown")) { Log (LogCritical, "Invalid meta data received from client"); return; }

    //validate strCurrentCard
    const nIndex = strCurrentCard.indexOf ("-");
    if (nIndex == -1) { Log(LogWarn, "PlayerEndedTurn: Invalide strCurrentCard: " + strCurrentCard); return; }

    const strCardCol  = strCurrentCard.slice (0, nIndex);
    const strCardType = strCurrentCard.slice (nIndex+1, strCurrentCard.length);
    
    if (!strCardCol || !strCardType) { Log(LogWarn, "PlayerEndedTurn: Invalid strCurrentCard2: " + strCurrentCard); return; }

    //Programming error occured
    if (mapValue.count != mapValue.game.strPlayerOrder.length) {Log(LogWarn, "PlayerEndedTurn: Invalid player count or strPlayerOrder: " + mapValue.count + ".." + mapValue.game.strPlayerOrder); return;}

    //Safety checks over... ?

    //To do: temp.. delete 
    if (strCardCol != strCardCol.toLowerCase() || strCardType != strCardType.toLowerCase())
    {
        //Programming error
        console.log ("This is very very bad!!..... It should be lower case: " + strCardCol + "-" + strCardType);
        return;
    }

    socket.to(strRoomCode).emit("g_UpdateThrownCard", strCurrentCard, cardMeta);
    
    //Update the current card for the other players
    if (cardMeta.bCardThrown === true)
    {
        //reverse the direction before calculating who the next player is (Reverse only if that card was thrown)
        if (strCardType == "reverse")
        {
            mapValue.game.bClockwise = !mapValue.game.bClockwise;
            io.in (strRoomCode).emit ("g_SetPlayDirection", mapValue.game.bClockwise);
        }

        //The current player either picked up a card or discarded a card... If they picked up a card then the cards array is already up to date (because they need to request the server to draw a card)
        //If they threw a card then we need to update the cards array
        h_RemoveCardFromPlayer (mapValue.players[nServerIndex], strCurrentCard);
    }

    //Update all the other players now that the current player has picked a card/thrown a card.. Must be done after h_RemoveCardFromPlayer()
    const playerData = mapValue.players[nServerIndex];
    {
        const cardsArray = playerData.cards;
        let cardsData = [];
        for (let i = 0; i < cardsArray.length; i++)
        {
            cardsData.push("black-back");
        }
        // console.log ("Updating other players");
        socket.to (strRoomCode).emit ("g_UpdateOtherPlayerCards", playerData.name, cardsData);
    }

    //Check if the current player who threw a card won the round ?
    {
        if (playerData.cards.length === 0)
        {
            console.log ("Player won: " + playerData.name);
            h_PlayerWonRound (strRoomCode, mapValue, nServerIndex);
        }
    }
        
    
    const nNextPlayerIndex = h_CalculateNextPlayerTurn (mapValue, strCardCol, strCardType, cardMeta.bCardThrown);
    mapValue.game.nTurnIndex = nNextPlayerIndex;    //mapValue.game.nTurnIndex is kinda redundant at the moment as we could use nClientIndex to figure out whos turn it currently is...

    //Start the next players turn
    io.in (strRoomCode).emit ("g_StartTurn", mapValue.players[nNextPlayerIndex].name, cardMeta);
} 


///////////////////////////////////////////////////////////////////////////
////////////////////
///////////////////////////////////////////////////////////////////////////





function AddCardsToPlayer(socketId, nCardsCount, bUpdatePlayer)
{
    const {roomCode: strRoomCode, mapValue: mapValue, index: nServerIndex} = GetGenericValuesFromSocket (socketId, "AddCardsToPlayer");
    if (nServerIndex == -1) { return; }

    let newCards = cardGenerator.GetCards (nCardsCount);
    const player = mapValue.players[nServerIndex];
    for (let i = 0; i < nCardsCount; i++)
    {
        player.cards.push (newCards[i]);
    }

    if (bUpdatePlayer)
    {
        data = new Object();
        data.name = player.name;
        data.winCount = player.winCount;
        data.cards = player.cards;
        io.to(socketId).emit ("g_UpdateSelfCardsCount", data);
    }
}

function StartNextRound (socket) {

    const strRoomCode = mapSocketIdToRoomCode.get (socket.id);
    if (!strRoomCode) { Log (LogWarn, "Socket does not exist in map while starting next round"); return; }
    
    const mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue) { Log (LogWarn, "room does not exist in player map while starting next round"); return; }
    
    if (mapValue.game.bRoundStarted === true) { Log (LogWarn, "Cannot start round... Round is already started"); return; }

    //Generate starting card
    let strStartingCard;
    {
        let bIsValid = false;
        for (let nAttempts = 0; nAttempts < 25 && !bIsValid; nAttempts++)
        {
            strStartingCard = cardGenerator.GetCard();
            const nIndex = strStartingCard.indexOf ("-");
            if (nIndex == -1) { continue; }

            const strColor = strStartingCard.slice(0, nIndex);
            const strType = strStartingCard.slice(nIndex+1, strStartingCard.length);

            if (strColor == "black") { continue; }
            if (strType == "draw2" || strType == "reverse" || strType == "skip") { continue; }

            bIsValid = true;
        }
        if (!bIsValid) { Log (LogWarn, "Cannot start round... Could not calculate starting card"); return; }
    }
    mapValue.game.bRoundStarted = true;
    UpdatePlayerNum (strRoomCode, nInitialCards, true); //Updates the strPlayerOrder and generates cards

    io.in(strRoomCode).emit("g_StartNextRoundSuccess", strStartingCard);
    
    mapValue.game.nTurnIndex = Number(mapValue.game.strPlayerOrder[0]);   //The person who starts the game
    Log (LogTrace, "Player will start: " + mapValue.game.nTurnIndex);
    const turnPlayer = mapValue.players[mapValue.game.nTurnIndex];

    io.in (strRoomCode).emit ("g_StartTurn", turnPlayer.name);
}

function LeaveRoom (socket) {
    Log (LogTrace, "Leaving:" + socket.id);

    const {roomCode: strRoomCode, mapValue: mapPlayers, index: nServerIndex} = GetGenericValuesFromSocket (socket.id, "LeaveRoom");
    if (nServerIndex == -1) { return; }

    //Remove socket from the socket map
    mapSocketIdToRoomCode.delete (socket.id);

    //Remove socket from the players map
    mapPlayers.count -= 1;
    mapPlayers.players.splice (nServerIndex, 1);
    socket.leave (strRoomCode);

    if (mapPlayers.hostIndex == nServerIndex)
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
        mapPlayers.game.strPlayerOrder =  RemovePlayerFromOrder (mapPlayers.game.strPlayerOrder, nServerIndex);
        UpdatePlayerNum (strRoomCode, -1, false);  //Player couldve left while the game is ongoing... Preserve cards and preserve order
        UpdateScoreBoard (strRoomCode);     //Player couldve left while the scoreboard is displayed
    }
}

function InitJoinRoom (socket, strCode) {
    Log (LogTrace, "InitJoinRoom: " + strCode);

    //To do: Calculate this value from strCode
    let strRoomCode = "ABCD";
    let strPlayerName = "";
    let bIsHost = true;

    const nPlayerWins = 0;


    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);


    //To do: temp code
    if (!mapValue)
    {
        strPlayerName = "Rishi0"
    }
    else
    {
        strPlayerName = "Rishi" + mapValue.count;
    }



    if (!mapValue) {
        //Create the object and insert it into the map
        mapValue = new Object ();
        mapValue.players = [];
        mapValue.count = 0;
        
        //Game properties
        mapValue.game = new Object ();

        mapValue.game.bRoundStarted = false; //This gets set to true when the actual game starts...
        mapValue.game.strPlayerOrder = "";
        mapValue.game.nTurnIndex = 0;
        mapValue.game.bClockwise = true;

        //This exists when the host joins the room
        // mapValue.hostIndex = false;  
        mapRoomCodeToPlayers.set (strRoomCode, mapValue);
    }
    else
    {
        //The room already exists
        if (mapValue.game.bRoundStarted)
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

    //Player can join only when the scoreboard is shown, so it isnt necessary to update the players (only the scoreboard)
    // UpdatePlayerNum (strRoomCode, -1, true);
    UpdateScoreBoard (strRoomCode);
}

function UpdateScoreBoard(strRoomCode)
{
    let mapValue = mapRoomCodeToPlayers.get(strRoomCode);
    if (!mapValue) return;

    //Check if any player won
    let nPlayerWonIndex = -1;
    let nPlayerWonName = "";
    for (let i = 0; i < mapValue.count; i++)
    {
        if (mapValue.players[i].winCount >= nMaxRounds)
        {
            nPlayerWonIndex = i;
            nPlayerWonName = mapValue.players[i].name;
            break;
        }
    }

    const data = GenerateScoreBoardData (mapValue);
    if (data)
    {
        io.in(strRoomCode).emit("g_UpdateScoreBoard", data, strRoomCode);
        io.in(strRoomCode).emit("g_UpdateScoreBoard_HideBtn");  //Hide the Next Round Btn
        
        if (data.count > 0 && mapValue.hasOwnProperty("hostIndex"))
        {
            //Only host can start the next round
            let playerSocketId = mapValue.players[mapValue.hostIndex].socketId;
            io.to(playerSocketId).emit("g_UpdateScoreBoard_ShowBtn", nPlayerWonName);
        }
    }

}
////////////////////////////////////////////////////////////////////////////////////////
////////////////                  Update Player Num (For when a new player joins or leaves)  

//If nGenerateCards == -1, Cards are preserved and unmodified
//If nGenerateCards == 0, Cards are delete
//If nGenerateCards > 0,  the number of cards passed are generated for each player


function UpdatePlayerNum (strRoomCode, nGenerateCards, bRandomizeOrder) {
    let mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue) { Log(LogWarn, "Room code does not exist in the map in UpdatePlayerNum: " + strRoomCode); return; }

    if (bRandomizeOrder === true)
    {
        mapValue.game.strPlayerOrder = GeneratePlayerOrder(mapValue.count);
    }
    else if (bRandomizeOrder === false)
    {
        //Dont randomize order
        // strPlayerOrder = GeneratePlayerOrderNonRandom (mapValue.count, mapValue.game.strPlayerOrder);
    }
    else { Log(LogWarn, "UpdatePlayerNum: second parameter should be a boolean: " + bRandomizeOrder + "..." + typeof(bRandomizeOrder)); return; }
    
    //Generate cards if need be
    if (nGenerateCards >= 0)
    {
        for (let i = 0; i < mapValue.count; i++) {
            let curPlayer = mapValue.players[i];
            if (curPlayer) { 
                curPlayer.cards = cardGenerator.GetCards (nGenerateCards);
            }
        }
    }

    for (let i = 0; i < mapValue.count; i++)
    {
        let curPlayer = mapValue.players[i];
        if (!curPlayer) { Log (LogWarn, "Player does not exist in the map"); continue; }

        let strSocketId = curPlayer.socketId;
        let generatedData = GenerateUpdatePlayerData(mapValue, i);
        io.to(strSocketId).emit ("g_UpdatePlayerNum", mapValue.game.strPlayerOrder, i, generatedData);
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
// function GeneratePlayerOrderNonRandom (nPlayerCount, strPlayerOrder)
// {
//     let mapSeen = new Map();
//     let strOrder = "";
//     for (let i = 0; i < strPlayerOrder.length; i++) {
//         let r = Number(strPlayerOrder[i]);
//         if (r < nPlayerCount) {
//             mapSeen.set (r, true);
//             strOrder += strPlayerOrder[i];
//         }
//     }

//     for (let i = 0; i < nPlayerCount; i++)
//     {
//         if (!mapSeen.has(i))
//         {
//             strOrder += i.toString();
//         }
//     }
//     return strOrder;
// }

//Recalculates the strPlayerOrder in the event that a player leaves midgame... This preserves the order of the 
function RemovePlayerFromOrder (strPlayerOrder, leftIndex)
{
    let strOrder = "";
    for (let i = 0; i < strPlayerOrder.length; i++)
    {
        let r = Number(strPlayerOrder[i]);
        if (r < leftIndex)
        {
            strOrder += r.toString();
        }
        else if (r > leftIndex)
        {
            strOrder += (r-1).toString();
        }
        //If it is equal then that player left and does not need to be in the order anymore... The people higher than him will be shifted to the left in the players array and their server index will decrease by 1.
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







function GetGenericValuesFromSocket (socketId, strFunctionName)
{
    const strRoomCode = mapSocketIdToRoomCode.get (socketId);
    if (!strRoomCode) { 
        Log (LogWarn, "Socketid dne func:" + strFunctionName);
        return { roomCode: undefined, mapValue: undefined, index: -1 }; 
    }

    const mapValue = mapRoomCodeToPlayers.get (strRoomCode);
    if (!mapValue) { 
        Log (LogWarn, "MapValue dne func:" + strFunctionName); 
        return { roomCode: strRoomCode, mapValue: undefined, index: -1 }; 
    }
    
    let nServerIndex = -1;
    for (let i = 0; i < mapValue.count; i++)
    {
        if (socketId === mapValue.players[i].socketId)
        {
            nServerIndex = i;
            break;
        }
    }
    if (nServerIndex == -1) { 
        Log (LogWarn, "ServerId dne func: " + strFunctionName); 
    }
    return { roomCode: strRoomCode, mapValue: mapValue, index: nServerIndex };  
} 