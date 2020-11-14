/////          Public data.. Gets set in Init
let io;

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////                              Logging

const fs = require ('fs');

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
    if (level >= LogWarn)
    {
        console.log (strMessage);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

//Public API
module.exports.Init = function(_io) {
    io=_io;
}

module.exports.OnNewConnection = function (socket) {
    
}