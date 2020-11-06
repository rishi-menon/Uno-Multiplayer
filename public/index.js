// const strDomain = 'http://localhost:3000';
// const strDomain = 'https://rishi.loca.lt';
const strDomain = window.location.toString();

//temp
console.log("Domain: " + strDomain);

const socket = io(strDomain);

socket.on("connect", () => {
        // console.log("connected");
});

window.onload = function () {
        // console.log("Hi there");
};

////////////////////////////////////////////////////////////////////////////////////
///////////////                  Elements
////////////////////////////////////////////////////////////////////////////////////

//To do: convert these to local variables somehow because currently its a mess!
//Dialog
const e_roomDlg = document.querySelector (".roomDialog");
const e_roomDlgCloseBtn = e_roomDlg.querySelector (".roomCloseButton");
const e_roomDlgRoomCode = e_roomDlg.querySelector (".roomCode");
const e_roomDlgStartGameBtn = e_roomDlg.querySelector (".roomStartGameButton");
const e_roomDlgPlayerContainer = e_roomDlg.querySelector (".playersContainer");
const e_roomDlgKickPlayerBtns = document.querySelectorAll(".roomDialogKickPlayerBtn");

const e_createRoomBtn = document.querySelector (".createRoomBtn");
const e_joinRoomBtn   = document.querySelector (".joinRoomBtn");

const e_enterNameDlg = document.querySelector (".enterNameDlg");
const e_enterName_nameField = e_enterNameDlg.querySelector (".enterName_Name");
const e_enterName_codeField = e_enterNameDlg.querySelector (".enterName_Code");
const e_enterName_closeBtn = e_enterNameDlg.querySelector (".enterName_CloseButton");
const e_enterName_submitBtn = e_enterNameDlg.querySelector(".enterName_enterBtn");
const e_enterName_error = e_enterNameDlg.querySelector(".enterName_errorMsg")
const e_enterName_dlgTitle = e_enterNameDlg.querySelector(".enterName_dlgHeaderTitle");

const StateEnterName_Invalid = 0;
const StateEnterName_CreateRoom = 1;
const StateEnterName_JoinRoom = 2;
let nEnterNameDlgState = 0;  

let bCanClickMainMenuBtns = true;

let strPlayerName = "";
let strRoomCode = "";

//////////////////////////////
//////////   Main menu
//Create a room btn
e_createRoomBtn.addEventListener ('click', () => {
        if (!bCanClickMainMenuBtns) return;

        e_enterName_error.style.display = "none"; //disable the error message
    e_enterName_dlgTitle.textContent = "Create A Room"
    //Show the pop up to enter a name
    e_enterNameDlg.style.display = "flex";
    e_enterName_codeField.style.display = "none"; //Dont display the enter code field
    e_enterName_nameField.style.display = "flex";
    e_enterName_submitBtn.style.display = "flex";
    
    nEnterNameDlgState = StateEnterName_CreateRoom;
});

//Join a room btn
e_joinRoomBtn.addEventListener ('click', () => {
    if (!bCanClickMainMenuBtns) return;

    e_enterName_error.style.display = "none"; //disable the error message
    e_enterName_dlgTitle.textContent = "Join A Room"
    e_enterNameDlg.style.display = "flex";
    e_enterName_codeField.style.display = "flex"; //Dont display the enter code field
    e_enterName_nameField.style.display = "flex";
    e_enterName_submitBtn.style.display = "flex";

    nEnterNameDlgState = StateEnterName_JoinRoom;
});

//////////////////////////////
//////////   Enter name
//Close the enter name dialog
e_enterName_closeBtn.addEventListener ('click', () => {
    e_enterNameDlg.style.display = "none";
    nEnterNameDlgState = StateEnterName_Invalid;
});

//Submit name
e_enterName_submitBtn.addEventListener ('click', () => {
    const strName = document.getElementById ('enterName_NameField').value;
    const strCode = document.getElementById ('enterName_CodeField').value;

    if (strName == "") {
        e_enterName_error.textContent = "Error: Name field cannot be empty";
        e_enterName_error.style.display = "flex";
        return;
    }

    if (nEnterNameDlgState === StateEnterName_JoinRoom)  {
        if (strCode == "")
        {
            e_enterName_error.textContent = "Error: Code field cannot be empty";
            e_enterName_error.style.display = "flex";
            return;
        }
        else if (strCode.length !== 4)
        {
            e_enterName_error.textContent = "Error: Room code has to be 4 characters";
            e_enterName_error.style.display = "flex";
            return;
        }
    }

    //Validation is over, we can send the request to the server now
    strPlayerName = strName;  //The room code gets set only if the join/create operation was successful
    if (nEnterNameDlgState === StateEnterName_CreateRoom)
    {
        //Create a room
        socket.emit ("m_CreateRoom", strPlayerName);

    } else if (nEnterNameDlgState === StateEnterName_JoinRoom)
    {
        socket.emit ("m_JoinRoom", strCode, strPlayerName);
    }
});

//////////////////////////////
//////////   Main room connected dialog
//Close the main room dialog
e_roomDlgCloseBtn.addEventListener ('click', () => {
    socket.emit ("m_PlayerLeftRoom");
});

socket.on ("m_LeaveRoom", (strMessage) => {
    e_roomDlg.style.display = "none"
    bCanClickMainMenuBtns = true;
    e_createRoomBtn.style.display = "flex";
    e_joinRoomBtn.style.display = "flex";

    if (strMessage !== "")
    {
        e_enterNameDlg.style.display = "flex";
        e_enterName_nameField.style.display = "none";
        e_enterName_codeField.style.display = "none";
        e_enterName_submitBtn.style.display = "none";

        e_enterName_error.style.display = "flex";
        e_enterName_error.textContent=strMessage;
        e_enterName_dlgTitle.textContent = "Error Message"
    }
});


//Room was created successfully (parameter: string)
socket.on ("m_CreateRoomSucc", (roomCode) => {
    // console.log ("Room created successfully: " + roomCode)
    strRoomCode = roomCode;
    bCanClickMainMenuBtns = false;
    e_createRoomBtn.style.display = "none";
    e_joinRoomBtn.style.display = "none";

    e_roomDlgRoomCode.textContent = roomCode; 
    e_roomDlg.style.display = "flex"
    e_roomDlgStartGameBtn.style.display = "none";

    //kick button
    e_roomDlgKickPlayerBtns.forEach (element => {
        element.style.display = "none";
    });

    //close the enter name dlg
    e_enterNameDlg.style.display = "none";
    nEnterNameDlgState = StateEnterName_Invalid;
});

socket.on ("m_CreateRoomFail", (errorMsg) => {
    e_enterName_error.style.display = "flex";
    e_enterName_error.innerHTML = "Error: " + errorMsg;
});

//Player was able to join the room
socket.on ("m_JoinRoomSucc", (roomCode) => {
    // console.log ("Room joined successfully: " + roomCode)
    strRoomCode = roomCode;
    bCanClickMainMenuBtns = false;
    e_createRoomBtn.style.display = "none";
    e_joinRoomBtn.style.display = "none";
    

    e_roomDlgRoomCode.textContent = roomCode; 
    e_roomDlg.style.display = "flex";
    e_roomDlgStartGameBtn.style.display = "none";

    e_roomDlgKickPlayerBtns.forEach (element => {
        element.style.display = "none";
    });

    //close the enter name dlg
    e_enterNameDlg.style.display = "none";
    nEnterNameDlgState = StateEnterName_Invalid;
});
socket.on ("m_JoinRoomFail", (errorMsg) => {
    e_enterName_error.style.display = "flex";
    e_enterName_error.innerHTML = "Error: " + errorMsg;
});

////////////////////////////////////////////////////////////////////////////////////
////  Update the player names and hide the ones that havent joined

socket.on ("m_UpdatePlayersInRoom", (mapValue) => {
    console.log ( mapValue);
    let index = 0;

    //Show elements
    for (; index < mapValue.count; index++)
    {
        let strClassName = ".player" + index;
        const eParent = e_roomDlgPlayerContainer.querySelector(strClassName);
        if (!eParent) { continue; }
        const eText = eParent.querySelector ("p");
        if (!eText) { continue; }

        eParent.style.display = "flex";
        eText.textContent = mapValue.playerNames[index];
    }

    //Hide the remaining elements
    for (; index < 4; index++)
    {
        let strClassName = ".player" + index;
        const eParent = e_roomDlgPlayerContainer.querySelector(strClassName);
        if (!eParent) { continue; }
        const eText = eParent.querySelector ("p");
        if (!eText) { continue; }

        eParent.style.display = "none";
        eText.textContent = "";
    }
});

////////////////////////////////////////////////////////////////////////////////////
////  Update the player names and hide the ones that havent joined

socket.on ("m_UpdateHostButtons", (bShowButtons) => {
    const strVal = (bShowButtons ? "flex" : "none");
    e_roomDlgStartGameBtn.style.display = strVal;

    //Kick player buttons
    e_roomDlgKickPlayerBtns.forEach (element => {
        element.style.display = strVal;
    });
});


////////////////////////////////////////////////////////////////
////////////           Start game button

e_roomDlgStartGameBtn.addEventListener ("click", () => {
    console.log("Start Game"); 
    // window.location.href = "http://localhost:3000"; 
})


////////////          Kick player

e_roomDlgKickPlayerBtns.forEach (element => {
    element.addEventListener ("click", () => {
        let playerIndex = element.getAttribute ("playerIndex");
        if (playerIndex)
        {
            console.log ("Kicking Player: " + Number(playerIndex));
            socket.emit ("m_KickPlayerFromRoom", Number(playerIndex));
        }

    });
})
