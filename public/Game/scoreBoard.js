
const scoreDlg = document.querySelector (".scoreDlg");
const scoreDlg_CloseBtn = scoreDlg.querySelector (".scoreDlg_CloseBtn");
const scoreDlg_NextRound = scoreDlg.querySelector (".score_nextBtn");

//Close Btn
scoreDlg_CloseBtn.addEventListener ("click", () => {
    //You could send this message to disconnect... But simply changing the url and going to the home page will cause the socket to disconnect and hence it will leave the room
    
    socket.emit ("g_PlayerLeaveRoom");
    window.location.pathname = "/index.html";
});

// Next Round Btn
scoreDlg_NextRound.addEventListener ("click", () => {
    if (ug_strPlayerHasWon == "")
    {
        socket.emit ("g_StartNextRound");
    }
    else
    {
        //Quit the room
        socket.emit ("g_DestroyRoom", "Host has left the room");
        window.location.pathname = "/index.html";
    }
});


////////////////////////////////////////
//////////         Error message dlg
////////////////////////////////////////

const errorDlg = document.querySelector (".errorDlg");
const errorDlg_closeBtn = errorDlg.querySelector (".errorDlg_CloseBtn");

errorDlg_closeBtn.addEventListener ("click", () => {
    socket.emit ("g_PlayerLeaveRoom");
    window.location = "/index.html";
});