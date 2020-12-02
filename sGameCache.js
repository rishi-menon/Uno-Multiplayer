
const mapCache = new Map(); //maps unique ids to player props

const nIdLength = 8;
const nCacheTimeout = 10;   //in seconds



module.exports.SetPlayerCache = function (strRoomCode, strPlayerName, bIsHost) {

    const strId = GetUniqueString (nIdLength);
    InsertWithCode (strId, strRoomCode, strPlayerName, bIsHost, nCacheTimeout);
    return strId;
}


module.exports.GetPlayerCache = function (strId) {
    const value = mapCache.get (strId);
    if (value) return value;
    else       return null;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////
// nTimeout is in seconds
function InsertWithCode (strId, strRoomCode, strPlayerName, bIsHost, nTimeout)
{
    if (!strId) { return; }

    let obj = new Object();
    obj.strRoomCode = strRoomCode;
    obj.strPlayerName = strPlayerName;
    obj.bIsHost = bIsHost;

    mapCache.set (strId, obj);

    if (nTimeout >= 0)
    {
        setTimeout (() => {
            if (mapCache.has (strId))
            {
                mapCache.delete (strId);
            }
        }, nTimeout * 1000);
    }
}

//Default cache members... This is to make testing easier
InsertWithCode ("rishia", "xyzw", "Rishi0", true,  -1);
InsertWithCode ("rishib", "xyzw", "Rishi1", false, -1);
InsertWithCode ("rishic", "xyzw", "Rishi2", false, -1);
InsertWithCode ("rishid", "xyzw", "Rishi3", false, -1);
InsertWithCode ("rishie", "xyzw", "Rishi4", false, -1);
InsertWithCode ("rishif", "xyzw", "Rishi5", false, -1);
InsertWithCode ("rishig", "xyzw", "Rishi6", false, -1);
InsertWithCode ("rishih", "xyzw", "Rishi7", false, -1);

//////////////////////////////////////////////////////////////////////////////////////////////////////
const strLetters = "abcdefghijklmnopqrstuvwxyz";

function GetRandomString (nCount)
{
    let str = "";
    for (let i = 0; i < nCount; i++)
    {
        const r = Math.floor(Math.random() * strLetters.length);
        str += strLetters[r];
    }
    return str;
}

function GetUniqueString (nCount)
{
    const nMaxAttempts = 20;
    for (let i = 0; i < nMaxAttempts; i++)
    {
        const strId = GetRandomString (nCount);
        if (!mapCache.has (strId)) return strId;
    }

    console.log ("sGameCache.js: GetUniqueString: Could not generate random id");
    return "";
}