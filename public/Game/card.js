"use strict"
//All "public" variables need to be prefixed with uc(short for uno-card.js) in this file to avoid naming clashes

//Relative to game.html because thats where the img tag will be inserted into
const uc_strImagesDir = "Game/Images/";
const uc_strImageExtension = ".svg";
let uc_players = [];
let uc_playerSelf;




UC_CalculatePlayers();



function UC_CalculatePlayers() {
    const nPlayerCount = 8;
    for (let i = 0; i < nPlayerCount; i++)
    {
        let strClassName = ".player" + i;
        uc_players[i] = document.querySelector(strClassName);
        if (!uc_players[i]) { console.log ("Error: Could not find class: " + strClassName); }
    }
    uc_playerSelf = uc_players[0];
};

//Takes in a player object (html obj) and a string for the the card id (<color>-<type> eg: "red-5" or "blue-skip")
// public
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
        UCi_CardAddMetaData(newCard, strCard);
        return;
    }

    if (verCtn)
    {
        console.log ("Added to vertical");
        const newCard = document.createElement("img");
        newCard.src = uc_strImagesDir + "right-" + strCard + uc_strImageExtension;

        verCtn.appendChild(newCard);
        UCi_CardAddMetaData(newCard, strCard);
        return;
    }

    //Doesn't have either of those two... The function was called with an invalid playerCtn
    console.log ("Error: Invalid Player container... Card: " + strCard);
    console.log (playerCtn);
}

//Internal function called within this js file... Takes in a card object that was just added by UC_AddCard
function UCi_CardAddMetaData (eCard, strCard) {
    const nIndexDash = strCard.indexOf('-');
    if (nIndexDash < 0)   { console.log("Invalid str: " + strCard); return; }
    
    const strColor = strCard.slice(0, nIndexDash);
    const strType = strCard.slice(nIndexDash+1, strCard.length);

    if (!strColor || !strType) { console.log("Invalid str: " + strCard); return; }

    eCard.setAttribute("cardColor", strColor);
    eCard.setAttribute("cardType", strType);

    //Check if player clicked on their own card
    const ePlayerCtn = eCard.parentNode.parentNode;
    
    const bIsSelfCard = (ePlayerCtn === uc_playerSelf);
    if (bIsSelfCard)
    {
        eCard.addEventListener ("click", () => {
            UG_CardOnClick(eCard);
        });
    }
}


// public
//Takes in a card element and removes it
function UC_RemoveCard (eCard) {
    if (!eCard) { console.log ("Invalid parameter..."); return; }
    console.log (eCard);
    eCard.parentNode.removeChild(eCard);
}

//public
//Takes in a card element and adds/removes a higlight effect
function UC_HighlightCard (eCard, bHighlight) {
    if (!eCard) { console.log ("Invalid parameter..."); return; }

    const strHighlightColor = "FFE793";
    if (bHighlight === true)
    {
        eCard.style.boxShadow = "0px 0px 25px 6px #" + strHighlightColor;
    }
    else if (bHighlight === false)
    {
        eCard.style.boxShadow = "none";
    }
    else
    {
        console.log ("Invalid parameter...");  
    }
}  

//public
// Takes in a boolean for the direction
function UC_SetDirection (bIsClockwise)
{
    const ele = document.querySelector (".direction");
    if (!ele) { console.log ("Something went wrong"); return; }

    if (bIsClockwise === true)
    {
        ele.classList.remove ("anticlockwise");
        ele.classList.add ("clockwise")
    }
    else if (bIsClockwise === false)
    {
        ele.classList.remove ("clockwise")
        ele.classList.add ("anticlockwise");
    }
    else
    {
        console.log ("Something went wrong"); 
        return;
    }
}