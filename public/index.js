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

const e_createRoomBtn = document.querySelector (".createRoomBtn");
const e_joinRoomBtn   = document.querySelector (".joinRoomBtn");

const e_enterNameDlg = document.querySelector (".enterNameDlg");
const e_enterName_codeField = e_enterNameDlg.querySelector (".enterName_Code");
const e_enterName_closeBtn = e_enterNameDlg.querySelector (".enterName_CloseButton");
const e_enterName_submitBtn = e_enterNameDlg.querySelector(".enterName_enterBtn");
const e_enterName_error = e_enterNameDlg.querySelector(".enterName_errorMsg")

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

  //Show the pop up to enter a name
  e_enterNameDlg.style.display = "flex";
  e_enterName_codeField.style.display = "none"; //Dont display the enter code field
  nEnterNameDlgState = StateEnterName_CreateRoom;
});

//Join a room btn
e_joinRoomBtn.addEventListener ('click', () => {
  if (!bCanClickMainMenuBtns) return;

  e_enterName_error.style.display = "none"; //disable the error message

  e_enterNameDlg.style.display = "flex";
  e_enterName_codeField.style.display = "flex"; //Dont display the enter code field
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

  //To do: check if room code is a 4 character string for validation perhaps ??
  if (nEnterNameDlgState === StateEnterName_JoinRoom && strCode == "")
  {
    e_enterName_error.textContent = "Error: Code field cannot be empty";
    e_enterName_error.style.display = "flex";
    return;
  }

  //Validation is over, we can send the request to the server now
  strPlayerName = strName;  //The room code gets set only if the join/create operation was successful
  if (nEnterNameDlgState === StateEnterName_CreateRoom)
  {
    //Create a room
    socket.emit ("m_CreateRoom");

  } else if (nEnterNameDlgState === StateEnterName_JoinRoom)
  {
    socket.emit ("m_JoinRoom", strCode);
  }
});

//////////////////////////////
//////////   Main room connected dialog
//Close the main room dialog
e_roomDlgCloseBtn.addEventListener ('click', (evt) => {
  e_roomDlg.style.display = "none"
  bCanClickMainMenuBtns = true;
  e_createRoomBtn.style.display = "flex";
  e_joinRoomBtn.style.display = "flex";
});


//Room was created successfully (parameter: string)
socket.on ("m_RoomCreated", (roomCode) => {
  // console.log ("Room created successfully: " + roomCode)
  strRoomCode = roomCode;
  bCanClickMainMenuBtns = false;
  e_createRoomBtn.style.display = "none";
  e_joinRoomBtn.style.display = "none";

  e_roomDlgRoomCode.textContent = roomCode; 
  e_roomDlg.style.display = "flex"

  //close the enter name dlg
  e_enterNameDlg.style.display = "none";
  nEnterNameDlgState = StateEnterName_Invalid;
});

//Player was able to join the room
socket.on ("m_RoomJoined", (roomCode) => {
  // console.log ("Room joined successfully: " + roomCode)
  strRoomCode = roomCode;
  bCanClickMainMenuBtns = false;
  e_createRoomBtn.style.display = "none";
  e_joinRoomBtn.style.display = "none";

  e_roomDlgRoomCode.textContent = roomCode; 
  e_roomDlg.style.display = "flex"

  //close the enter name dlg
  e_enterNameDlg.style.display = "none";
  nEnterNameDlgState = StateEnterName_Invalid;
});