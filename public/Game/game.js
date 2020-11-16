"use strict"

const socket = io();

let ug_currentCard;
let ug_bSelfTurn = false;

let ug_strJoinCode = "SecretCode"

const ug_nGenericTimeout = 3500;    //ms

//Timeout booleans
let ug_bInitJoinRoom = false;

socket.on("connect", () => {
    console.log("connected");
    ug_bInitJoinRoom = false;
    socket.emit("g_InitJoinRoom", ug_strJoinCode);
    
    setTimeout (UGi_InitJoinRoomFailed, ug_nGenericTimeout, "Server did not respond in time")
});

//Note: This function will definately be called once by the setTimeout... It could potentially be called twice if it receives a message from the server
function UGi_InitJoinRoomFailed (strMessage) {
    if (!ug_bInitJoinRoom) {
        //The server did not respond back/ The InitJoinRoom failed
        console.log ("Server did not respond in time");
    }
}


let edeck = document.querySelector (".deck");
UC_AddCard (uc_players[0], "red-1");

//public
//function gets called when the player clicks on their OWN card
function UG_CardOnClick(eCard) {
    console.log ("Clicked on card");

    // UC_RemoveCard (eCard);

    edeck.setAttribute("src", "Game/Images/bottom-blue-8.svg")
}