"use strict"

const socket = io();

let ug_currentCard;

socket.on("connect", () => {
    console.log("connected");
});



// UC_AddCard (uc_players[0], "red-1");


//public
//function gets called when the player clicks on their OWN card
function UG_CardOnClick(eCard) {
    console.log ("Clicked on card");

    UC_RemoveCard (eCard);
}