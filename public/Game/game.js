let ug_strJoinCode = "SecretCode"

const ug_nGenericTimeout = 3500;    //ms
//Timeout booleans
let ug_bInitJoinRoom = false;
let ug_bInitJoinRoomAlreadyFailed = false;

// Once you disconnect you shouldnt reconnect again
let ug_bPlayerDisconnected = false;

let ug_strCurrentCardColor;
let ug_strCurrentCardType;
//If you change the name then you would have to change it in server file as well
const ug_strCurrentCardMeta = {bCardThrown: false};

let ug_bSelfTurn = false;

const nRoundsToWin = 4;
const nMaxPlayers = 8;

function UGi_ResetCurrMeta () {
    ug_strCurrentCardMeta.bCardThrown = false;
}

socket.on("connect", () => {
    if (!ug_bPlayerDisconnected)
    {
        console.log("connected");
        ug_bInitJoinRoom = false;
        socket.emit("g_InitJoinRoom", ug_strJoinCode);
        
        setTimeout (UGi_InitJoinRoomFailed, ug_nGenericTimeout, "Server did not respond in time");

        //Test... Keep the socket open ?
        setInterval (() => {
            socket.emit ("_NonExistantMessage_");
        }, 500);
    }
});

socket.on("disconnect", () => {
    UGi_DisplayError ("You disconnected from the room");
    console.log ("Disconnected");
    ug_bPlayerDisconnected = true;
});

socket.on ("g_InitJoinRoomSuccess", () => {
    ug_bInitJoinRoom = true;

    //Show the scoreBoard
    const scoreBoardDlg = document.querySelector (".scoreDlg");
    if (!scoreBoardDlg) { console.log ("Error..."); return; }
    scoreBoardDlg.style.display = "flex";
});

socket.on ("g_InitJoinRoomFailure", (strMessage) => {
    UGi_InitJoinRoomFailed (strMessage);
});

//Note: This function will definately be called once by the setTimeout... It could potentially be called twice if it receives a message from the server
function UGi_InitJoinRoomFailed (strMessage) {
    if (!ug_bInitJoinRoom && !ug_bInitJoinRoomAlreadyFailed) {
        //The server did not respond back/ The InitJoinRoom failed
        ug_bInitJoinRoomAlreadyFailed = true;
        // console.log ("Server did not respond in time");
        
        UGi_DisplayError (strMessage);

    }
}

///////////////////////////////////////////////////////
///////////              Update players in the room

const ug_LocalClientMapping = [
    [0],
    [0,3],
    [0,1,3],
    [0,1,3,5],
    [0,1,2,3,5],
    [0,1,2,3,5,6],
    [0,1,2,3,4,5,6],
    [0,1,2,3,4,5,6,7],
];

socket.on ("g_UpdatePlayerNum", (strPlayerOrder, nServerIndex, data) => {
    uc_players.forEach(element => {
        element.style.display = "none";
    });
    if (data.count <= 0) { console.log("Error..."); return; }

    let nIndex = strPlayerOrder.indexOf (nServerIndex.toString());
    if (nIndex == -1) { console.log ("Something went wrong"); return; }

    let strStart = strPlayerOrder.slice (0, nIndex);
    let strEnd = strPlayerOrder.slice (nIndex, strPlayerOrder.length);
    
    let strPlayerOrderRearrange = strEnd + strStart;
    
    //-1 because room can never have 0 players.... It will always have atleast 1
    let clientIndex = ug_LocalClientMapping[data.count-1];

    for (let i = 0; i < data.count; i++)
    {
        let nServerIndex = Number(strPlayerOrderRearrange[i]);
        const curEle = uc_players[clientIndex[i]];

        curEle.style.display = "flex";
        UC_SetPlayerDetails (curEle, data.players[nServerIndex]);
    }

    const nEmptyData = {name: "", winCount: 0};
    nEmptyData.cards = [];
    for (let i = data.count; i < nMaxPlayers; i++)
    {
        const curEle = uc_players[clientIndex[i]];
        curEle.style.display = "none";
        UC_SetPlayerDetails (curEle, nEmptyData);
    }
});

socket.on ("g_UpdateScoreBoard", (data, strRoomCode) => {
    UGi_SetScoreBoardDetails (data, strRoomCode);
});

socket.on ("g_UpdateScoreBoard_ShowBtn", () => {
    const scoreBoardNextRoundBtn = document.querySelector (".score_nextBtn");
    if (!scoreBoardNextRoundBtn) { console.log ("Error..."); return; }
    
    scoreBoardNextRoundBtn.style.display = "flex"; 
});

socket.on ("g_UpdateScoreBoard_HideBtn", () => {
    const scoreBoardNextRoundBtn = document.querySelector (".score_nextBtn");
    if (!scoreBoardNextRoundBtn) { console.log ("Error..."); return; }
    
    scoreBoardNextRoundBtn.style.display = "none";
});

socket.on ("g_StartNextRoundSuccess", (strStartingCard) => {
    const scoreDlg = document.querySelector (".scoreDlg");
    if (scoreDlg)
    {
        //Hide the score dialog
        scoreDlg.style.display = "none";
    }

    UG_UpdateCurrentCard (strStartingCard, null);
});

socket.on ("g_StartTurn", (strPlayerTurn) => {
    console.log ("Turnn! : " + strPlayerTurn);
    let ePlayerTurn = null;
    for (let i = 0; i < nMaxPlayers; i++)
    {
        const eName = uc_players[i].querySelector("p");
        if (!eName) { continue; }
        //Reset color of the non current players turn
        eName.style.color = "#efefef";

        if (!ePlayerTurn && eName.textContent == strPlayerTurn) { ePlayerTurn = uc_players[i]; }
    }

    //Set current players turn to red after setting all the other players to white (for loop)
    ePlayerTurn.querySelector ("p").style.color = "#ff0000";

    //To do: Add better visuals for the current players turn
    if (ePlayerTurn === uc_playerSelf)
    {
        console.log ("Its your turn");
        //Its your turn
        ug_bSelfTurn = true;
        const eCurrentCard = document.querySelector (".currentCard");
        // UC_HighlightCard (eCurrentCard, true);
    }
    else
    {
        //Its not your turn
        ug_bSelfTurn = false;
        const eCurrentCard = document.querySelector (".currentCard");
        // UC_HighlightCard (eCurrentCard, false); 
    }
});

socket.on ("g_UpdateSelfCardsCount", (data) => {
    uc_playerSelf.style.display = "flex";   //Probably not even required but safer to keep it
    UC_SetPlayerDetails (uc_playerSelf, data);
});

socket.on ("g_UpdateThrownCard", (strCurrentCard, cardMeta) => {
    console.log ("Updateeee");
    //To do: If a wild card was thrown then show which color the other player selected inside the following function... Also if a wild card was thrown by another player then the selected colour should be highlighted or something to indicate which color
    UG_UpdateCurrentCard (strCurrentCard, cardMeta);
});

socket.on ("g_UpdateOtherPlayerCards", (strPlayerName, cardsData) => {
    console.log ("UpdateOtherPlayer");
    let ePlayer = null;
    for (let i = 0; i < nMaxPlayers; i++)
    {
        const eName = uc_players[i].querySelector("p");
        if (!eName) { continue; }

        if (eName.textContent == strPlayerName) { ePlayer = uc_players[i]; break; }
    }
    if (ePlayer == null) { console.log("Error..."); return; }
    
    UC_SetPlayerCards (ePlayer, cardsData);
});

function UGi_DrawCard (nCardsToDraw)
{
    if (!nCardsToDraw || nCardsToDraw <= 0) { return; }
    socket.emit ("g_DrawCardsSelf", nCardsToDraw);
}

//Draw a card
document.querySelector (".deckCard").addEventListener ("click", () => {
    if (ug_bPlayerDisconnected) { console.log("Player disconnected... Cannot draw card"); return; }
    if (ug_bSelfTurn !== true) { return; }

    UGi_DrawCard (1);

    //To do: Add a feature where player can draw a card and has the option to throw it... In that case, server should emit g_UpdateSelfCardsCount (call a function with the right parameters) so that players card will update... Also dont call end turn immediateley... You also might have to add a end turn button so that the player isnt forced to throw a card if they dont want to 
    UGi_EndTurn();
});

//////////
// data:
//      players :
//          string name
//          int? winCount
//          array cards
//      int count

function UGi_SetScoreBoardDetails (data, strRoomCode) {
    const scoreBoardDlg = document.querySelector (".scoreDlg");
    if (!scoreBoardDlg || !data) { console.log ("Error..."); return; }

    const scoreBoardDlg_RoomCode = scoreBoardDlg.querySelector (".scoreDlg_HeaderRight p");
    scoreBoardDlg_RoomCode.textContent = strRoomCode;
    
    for (let i = 0; i < data.count; i++)
    {
        const curPlayer = data.players[i];
        if (!curPlayer) { console.log ("Error..."); continue; }

        const element = scoreBoardDlg.querySelector (".score_player" + i.toString());
        if (!element) { console.log ("Error..."); continue; }

        element.style.display = "flex";
        const pchildren = element.querySelectorAll ("p");
        //name
        pchildren[0].textContent = curPlayer.name;
        //wins
        pchildren[1].textContent = curPlayer.winCount.toString() + " / " + nRoundsToWin.toString();
    }

    for (let i = data.count; i < nMaxPlayers; i++)
    {
        const element = scoreBoardDlg.querySelector (".score_player" + i.toString());
        if (!element) { console.log ("Error..."); continue; }
        element.style.display = "none";
    }
}
//////////////////////////////////////////////////

//If strMessage is "" then the dialog is hidden
function UGi_DisplayError (strMessage)
{
    const errorDlg = document.querySelector (".errorDlg");
    if (!errorDlg) { console.log ("Error..."); return; }

    if (strMessage == "")
    {
        errorDlg.style.display = "none";
        return;
    }
    
    errorDlg.style.display = "flex";
    const eMessage = errorDlg.querySelector(".errorDlg_msg");
    if (!eMessage) { console.log ("Error..."); return; }

    eMessage.textContent = strMessage;
}

//////////////////////////////////////////////////

function UG_UpdateCurrentCard (strCurrCard, cardMeta) {
    UC_SetCurrentCard (strCurrCard);
    let cardObj = UC_ParseCard (strCurrCard);
    if (cardObj)
    {
        ug_strCurrentCardColor = cardObj.color;
        ug_strCurrentCardType = cardObj.type;
    }
    else
    {
        console.log ("Error...");
    }
}


//public
//function gets called when the player clicks on their OWN card
function UG_CardOnClick(eCard) {
    if (ug_bPlayerDisconnected) { console.log("Player disconnected... Cannot click on card"); return; }
    if (ug_bSelfTurn !== true) { return; }

    const strColor = eCard.getAttribute ("cardColor");
    const strType = eCard.getAttribute ("cardType");
    if (!strColor || !strType) { console.log ("Error..."); return; }

    let bCanThrowCard = UGi_ThrowCardIsValid(strColor, strType, ug_strCurrentCardColor, ug_strCurrentCardType);

    console.log (bCanThrowCard.toString());
    
    if (bCanThrowCard)
    {
        //To do: Add animations to show the card moving ?
        ug_strCurrentCardColor = strColor;
        ug_strCurrentCardType = strType;
        
        UGi_ResetCurrMeta ();
        ug_strCurrentCardMeta.bCardThrown = true;

        UC_SetCurrentCard (strColor + "-" + strType);
        UC_RemoveCard (eCard);
        UGi_EndTurn ();
    }

}

function UGi_ThrowCardIsValid (strCardCol, strCardType, strCurrentCol, strCurrentType)
{
    let bCanThrowCard = false;
    //Same col or same number
    if (strCardCol ===  strCurrentCol ||
        strCardType ===  strCurrentType  ||
        strCardCol === "black") { bCanThrowCard = true; }

    return bCanThrowCard;
}

///////////


function UGi_EndTurn ()
{
    if (ug_bSelfTurn !== true) { console.log ("Error..."); return; }
    ug_bSelfTurn = false;

    //Visual Stuff
    uc_playerSelf.querySelector ("p").style.color = "#efefef";

    const strCard = ug_strCurrentCardColor + "-" + ug_strCurrentCardType;    
    socket.emit ("g_PlayerEndTurn", strCard, ug_strCurrentCardMeta);
}