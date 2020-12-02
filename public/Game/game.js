const ug_nGenericTimeout = 3500;    //ms
//Timeout booleans
let ug_bInitJoinRoom = false;
let ug_bInitJoinRoomAlreadyFailed = false;

// Once you disconnect you shouldnt reconnect again
let ug_bPlayerDisconnected = false;

let ug_strCurrentCardColor;
let ug_strCurrentCardType;

//Note: If you change the name then you would have to change it in server file as well
//nForceDraw gets set to 1 when its a draw2 and gets set to 2 when its a draw4... The value will be the number of cards to pick up which allows people to chain draw2 together
//strAdditionalCol gets set to the color chosen when a wild or draw 4 is thrown
const ug_currCardMeta = {bCardThrown: false, nForceDraw: 0, nForceDrawValue: 0, strAdditionalCol: ""};

//0: false, not your turn
//1: it is your turn and you can throw a card
//2: it is your turn but you already threw a black card and you havent chosen a color yet... You cannot throw another card nor draw a card from deck... 
let ug_nSelfTurn = 0;
let ug_strPlayerHasWon = "";

const nRoundsToWin = 4;
const nMaxPlayers = 8;

socket.on("connect", () => {
    if (!ug_bPlayerDisconnected)
    {
        console.log("connected");
        ug_bInitJoinRoom = false;

        const strCode = GetUrlValue("id");
        socket.emit("g_InitJoinRoom", strCode);
        
        setTimeout (UGi_InitJoinRoomFailed, ug_nGenericTimeout, "Server did not respond in time");

        //Test... Keep the socket open ?
        setInterval (() => {
            if (!ug_bPlayerDisconnected)
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

socket.on ("g_DisplayErrorMessage", (strError) => {
    ug_nSelfTurn = 0;   //Not required but just in case
    UGi_DisplayError (strError);
})

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

    let mapSeen = new Map();
    for (let i = 0; i < data.count; i++)
    {
        mapSeen.set (clientIndex[i], true);
        const curEle = uc_players[clientIndex[i]];
        curEle.style.display = "flex";
        
        let nServerIndex = Number(strPlayerOrderRearrange[i]);
        UC_SetPlayerDetails (curEle, data.players[nServerIndex]);
    }

    const nEmptyData = {name: "", winCount: 0};
    nEmptyData.cards = [];
    for (let i = 0; i < nMaxPlayers; i++)
    {
        if (mapSeen.has (i))    continue;

        const curEle = uc_players[i];
        curEle.style.display = "none";
        UC_SetPlayerDetails (curEle, nEmptyData);
    }
});

socket.on ("g_UpdateScoreBoard", (data, strRoomCode) => {
    UGi_SetScoreBoardDetails (data, strRoomCode);
});
socket.on ("g_SetScoreBoardVisibility", (bShow) => {
    UGi_SetScoreBoardVisibility (bShow);
});

socket.on ("g_UpdateScoreBoard_ShowBtn", (strPlayerWonName) => {
    const scoreBoardNextRoundBtn = document.querySelector (".score_nextBtn");
    if (!scoreBoardNextRoundBtn) { console.log ("Error..."); return; }
    
    scoreBoardNextRoundBtn.style.display = "flex"; 
    ug_strPlayerHasWon = strPlayerWonName;
    if (strPlayerWonName == "")
    {
        scoreBoardNextRoundBtn.querySelector("p").textContent = "Next Round"; 
    }
    else
    {
        scoreBoardNextRoundBtn.querySelector("p").textContent = "Main Menu"; 
    }
});

socket.on ("g_UpdateScoreBoard_HideBtn", () => {
    const scoreBoardNextRoundBtn = document.querySelector (".score_nextBtn");
    if (!scoreBoardNextRoundBtn) { console.log ("Error..."); return; }
    
    scoreBoardNextRoundBtn.style.display = "none";
});

socket.on ("g_StartNextRoundSuccess", (strStartingCard) => {
    UGi_SetScoreBoardVisibility (false);
    UG_UpdateCurrentCard (strStartingCard, null);
});

function UGi_SetScoreBoardVisibility (bShow)
{
    const scoreBoardDlg = document.querySelector (".scoreDlg");
    if (!scoreBoardDlg) { console.log ("Error..."); return; }
    console.log ("SetVisibility ScoreBoard: " + bShow);
    scoreBoardDlg.style.display = (bShow ? "flex" : "none");
}
function UGi_GetPlayerFromName (strPlayerName)
{
    for (let i = 0; i < nMaxPlayers; i++)
    {
        const ele = uc_players[i].querySelector("p");
        if (ele.textContent == strPlayerName) {
             return uc_players[i];
        }
    }
    return null;
}
let ug_prevTurnPlayer = null;

socket.on ("g_StartTurn", (strPlayerTurn, metaData) => {
    
    //Reset the previous players color back to 0 as it isnt their turn anymore
    if (ug_prevTurnPlayer)
    {
        ug_prevTurnPlayer.querySelector("p").style.backgroundColor = "transparent";
    }
    
    let ePlayerTurn = UGi_GetPlayerFromName (strPlayerTurn);
    //Set background color for the current player
    ePlayerTurn.querySelector ("p").style.backgroundColor = "#00aa00";
    ug_prevTurnPlayer = ePlayerTurn;

    if (metaData)
    {
        ug_currCardMeta.nForceDraw = metaData.nForceDraw;
        ug_currCardMeta.nForceDrawValue = metaData.nForceDrawValue;
        ug_currCardMeta.strAdditionalCol = metaData.strAdditionalCol;
    }
    else
    {
        //Reset this back to 0 ??
        ug_currCardMeta.nForceDraw = 0;
        ug_currCardMeta.nForceDrawValue = 0;
        ug_currCardMeta.strAdditionalCol = "";
    }

    UGi_WildShowColorChosen (ug_currCardMeta.strAdditionalCol); //Hide/show the chosen color

    //To do: Add better visuals for the current players turn
    const yourTurnTextEle = document.querySelector (".player0 h1");
    if (ePlayerTurn === uc_playerSelf)
    {
        //Its your turn
        ug_nSelfTurn = 1;
        yourTurnTextEle.style.display = "flex";
        // const eCurrentCard = document.querySelector (".currentCard");
    }
    else
    {
        //Its not your turn
        ug_nSelfTurn = 0;
        yourTurnTextEle.style.display = "none";
        // const eCurrentCard = document.querySelector (".currentCard");
    }
    // UC_HighlightCard (eCurrentCard, false); 
    
});

socket.on ("g_UpdateSelfCardsCount", (data) => {
    uc_playerSelf.style.display = "flex";   //Probably not even required but safer to keep it
    UC_SetPlayerDetails (uc_playerSelf, data);
});

socket.on ("g_UpdateThrownCard", (strCurrentCard, cardMeta) => {
    console.log ("Update thrown card");
    if (cardMeta.bCardThrown === true)
    {
        UG_UpdateCurrentCard (strCurrentCard, cardMeta);
    }
    else
    {
        AC_StartDeckAnim ()
    }
});

socket.on ("g_UpdateOtherPlayerCards", (strPlayerName, cardsData) => {
    console.log ("UpdateOtherPlayer");
    let ePlayer = UGi_GetPlayerFromName (strPlayerName);
    if (ePlayer == null) { console.log("Error..."); return; }
    UC_SetPlayerCards (ePlayer, cardsData);
});

socket.on ("g_SetPlayDirection", (bClockwise) => {
    UC_SetDirection (bClockwise);
});

function UGi_DrawCard (nCardsToDraw)
{
    if (!nCardsToDraw || nCardsToDraw <= 0) { return; }
    socket.emit ("g_DrawCardsSelf", nCardsToDraw);
}

//Draw a card
document.querySelector (".deckCard").addEventListener ("click", () => {
    if (ug_bPlayerDisconnected) { console.log("Player disconnected... Cannot draw card"); return; }
    if (ug_nSelfTurn !== 1) { return; }

    if (ug_currCardMeta.nForceDraw != 0)
    {
        if (ug_currCardMeta.nForceDrawValue == 0) { console.log ("Error..."); ug_currCardMeta.nForceDrawValue = 1; }
        UGi_DrawCard (ug_currCardMeta.nForceDrawValue);
    }
    else
    {
        UGi_DrawCard (1);
    }
    AC_StartDeckAnim ();
    //To do: Add a feature where player can draw a card and has the option to throw it... In that case, server should emit g_UpdateSelfCardsCount (call a function with the right parameters) so that players card will update... Also dont call end turn immediateley... You also might have to add a end turn button so that the player isnt forced to throw a card if they dont want to 
    ug_currCardMeta.bCardThrown = false;
    ug_currCardMeta.nForceDraw = 0;
    ug_currCardMeta.nForceDrawValue = 0;
    
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


//////////////////////////////////////////////////////////////////////////////////////////v
//////////

document.querySelectorAll (".wildChooseColor .block").forEach ((block) => {
    block.addEventListener ("click", () => {
        ug_currCardMeta.strAdditionalCol = block.getAttribute ("blockCol");
        console.log (ug_currCardMeta.strAdditionalCol);
        UGi_WildShowColorPicker (false);    //Hide the color picker
        UGi_EndTurn();
    });
});

//Wild/Draw4 Color Picker
function UGi_WildShowColorPicker (bShow) {
    const ele = document.querySelector (".wildChooseColor");
    if (!ele) { console.log ("Error..."); return; }
    const strVal = (bShow === true ? "flex" : "none");
    ele.style.display = strVal;
}

//Wild/Draw4 show color chosen
function UGi_WildShowColorChosen (strCol)
{
    const ele = document.querySelector (".wildColorChoosen");
    if (!ele) { console.log ("Error..."); return; }

    if (strCol === "")
    {
        ele.style.display = "none";
        return;
    }
    else
    {
        ele.style.display = "flex";
        if (strCol == "red")
        {
            ele.style.background = "#EF5555"
        }
        else if (strCol == "blue")
        {
            ele.style.background = "#0066FF"
        }
        else if (strCol == "green")
        {
            ele.style.background = "#00CC5E"
        }
        else if (strCol == "yellow")
        {
            ele.style.background = "#FFF50F"
        }
        else
        {
            console.log ("Error...");
            return;
        }
    }
}

////////////////////////////////////////////////////////////

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
    AC_SetCurrentCardAnim (strCurrCard);
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
    if (ug_nSelfTurn !== 1) { return; }

    const strColor = eCard.getAttribute ("cardColor");
    const strType = eCard.getAttribute ("cardType");
    if (!strColor || !strType) { console.log ("Error..."); return; }

    let bCanThrowCard = UGi_ThrowCardIsValid(strColor, strType, ug_strCurrentCardColor, ug_strCurrentCardType);

    console.log (bCanThrowCard.toString());
    
    if (bCanThrowCard)
    {
        let bEndTurn = true;

        ug_strCurrentCardColor = strColor;
        ug_strCurrentCardType = strType;
        
        //Set meta data
        ug_currCardMeta.bCardThrown = true;
        if (strType === "draw2")
        {
            ug_currCardMeta.nForceDraw = 1;
            ug_currCardMeta.nForceDrawValue += 2;
        }
        else if (strType === "draw4")
        {
            ug_currCardMeta.nForceDraw = 2;
            ug_currCardMeta.nForceDrawValue += 4;
        }
        else
        {
            ug_currCardMeta.nForceDraw = 0;
            ug_currCardMeta.nForceDrawValue = 0;
        }

        if (strColor === "black")
        {
            bEndTurn = false;
            //Bring up the color picker
            UGi_WildShowColorPicker (true);
            ug_nSelfTurn = 2;   //If player throws a black card, they can no longer throw other cards, because they have to choose a color... Their turn isnt yet over tho so set it to 2 instead of 0
        }
        else
        {
            //Player threw a non color change card... When the server send the StartNextTurn signal, the clients will all end up hiding the current color
            ug_currCardMeta.strAdditionalCol = "";  
        }

        UGi_WildShowColorChosen ("");   //Remove the wild color if its being shown currently
        //This will get set by the animation
        AC_SetCurrentCardAnim (strColor + "-" + strType);    
        UC_RemoveCard (eCard);

        if (bEndTurn)
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

    //To Do: Add an additional check for wild cards
    if (ug_currCardMeta.strAdditionalCol !== "" && ug_currCardMeta.strAdditionalCol === strCardCol)
    {
        bCanThrowCard = true;
    }

    //Check for force draw2(1) and draw4(2)
    if (ug_currCardMeta.nForceDraw == 1)
    {
        //You can only throw a draw2 in this case
        bCanThrowCard = (strCardType == "draw2");
    }
    else if (ug_currCardMeta.nForceDraw == 2)
    {
        //You can only throw a draw4 in this case
        bCanThrowCard = (strCardType == "draw4");
    }

    return bCanThrowCard;
}

///////////


function UGi_EndTurn ()
{
    if (ug_nSelfTurn === 0) { console.log ("Error..."); return; }
    ug_nSelfTurn = 0;

    //Visual Stuff
    uc_playerSelf.querySelector ("p").style.color = "#efefef";

    const strCard = ug_strCurrentCardColor + "-" + ug_strCurrentCardType;    
    socket.emit ("g_PlayerEndTurn", strCard, ug_currCardMeta);
}