"use strict"
//All "public" variables need to be prefixed with uc(short for uno-card.js) in this file to avoid naming clashes

//Relative to game.html because thats where the img tag will be inserted into
const uc_strImagesDir = "Game/Images/";
const uc_strImageExtension = ".svg";
let uc_players = [];





UC_CalculatePlayers();



function UC_CalculatePlayers() {
    const nPlayerCount = 8;
    for (let i = 0; i < nPlayerCount; i++)
    {
        let strClassName = ".player" + i;
        uc_players[i] = document.querySelector(strClassName);
        if (!uc_players[i]) { console.log ("Error: Could not find class: " + strClassName); }
    }
};

//Takes in a player object (html obj) and a string for the the card id (<color>-<type> eg: "red-5" or "blue-skip")
function UC_AddCard(playerCtn, strCard) {
    if (!playerCtn || !strCard) { return; }    

    const horCtn = playerCtn.querySelector (".cardCtnHor");
    const verCtn = playerCtn.querySelector (".cardCtnVer");

    if (horCtn)
    {
        console.log ("Added to horizontal");
        const newCard = document.createElement("img");
        newCard.src = uc_strImagesDir + "bottom-" + strCard + uc_strImageExtension;

        horCtn.appendChild(newCard);
        UC_CardAddMetaData(newCard, strCard);
        return;
    }

    if (verCtn)
    {
        console.log ("Added to vertical");
        const newCard = document.createElement("img");
        newCard.src = uc_strImagesDir + "right-" + strCard + uc_strImageExtension;

        verCtn.appendChild(newCard);
        UC_CardAddMetaData(newCard, strCard);
        return;
    }

    //Doesn't have either of those two... The function was called with an invalid playerCtn
    console.log ("Error: Invalid Player container... Card: " + strCard);
    console.log (playerCtn);
}

//Internal function called within this js file... Takes in a card object that was just added by UC_AddCard
function UC_CardAddMetaData (eCard, strCard) {
    const nIndexDash = strCard.indexOf('-');
    if (nIndexDash < 0)   { console.log("Invalid str: " + strCard); return; }
    
    const strColor = strCard.slice(0, nIndexDash);
    const strType = strCard.slice(nIndexDash+1, strCard.length);

    if (!strColor || !strType) { console.log("Invalid str: " + strCard); return; }

    eCard.setAttribute("cardColor", strColor);
    eCard.setAttribute("cardType", strType);

    //To do: Add event listener to the card to make margin 0 on mouse hover (Add that here)
}