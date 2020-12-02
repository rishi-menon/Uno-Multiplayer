// "use strict"

const socket = io();

const pv_mapUrlVariables = new Map();

// console.log (window.location);
//Generate the map

(function() {
    if (!window.location.search) { console.log ("No url parameters..."); return; }

    //Eg: ?a=1&b=2
    // console.log (window.location.search); 
    const strUrlVar =  window.location.search.substring(1);   //substring removes the '?'
    const arrayStrPairs = strUrlVar.split('&');
    // console.log (arrayStrPairs);

    for (let i = 0; i < arrayStrPairs.length; i++)
    {
        const arrSplit = arrayStrPairs[i].split ('=');
        pv_mapUrlVariables.set (arrSplit[0], arrSplit[1]);
    }

    console.log (pv_mapUrlVariables);
})();

function GetUrlValue (strKey)
{
    const ele = pv_mapUrlVariables.get (strKey);
    if (ele) { return ele; }
    else     { return ""; }
}

