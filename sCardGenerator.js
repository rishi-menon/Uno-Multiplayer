const cards = [
    "red-0",
    "red-1",
    "red-2",
    "red-3",
    "red-4",
    "red-5",
    "red-6",
    "red-7",
    "red-8",
    "red-9",
    "red-0",
    "red-1",
    "red-2",
    "red-3",
    "red-4",
    "red-5",
    "red-6",
    "red-7",
    "red-8",
    "red-9",
    "red-draw2",
    "red-draw2",
    "red-reverse",
    "red-reverse",
    "red-skip",
    "red-skip",

    "blue-0",
    "blue-1",
    "blue-2",
    "blue-3",
    "blue-4",
    "blue-5",
    "blue-6",
    "blue-7",
    "blue-8",
    "blue-9",
    "blue-0",
    "blue-1",
    "blue-2",
    "blue-3",
    "blue-4",
    "blue-5",
    "blue-6",
    "blue-7",
    "blue-8",
    "blue-9",
    "blue-draw2",
    "blue-draw2",
    "blue-reverse",
    "blue-reverse",
    "blue-skip",
    "blue-skip",

    "green-0",
    "green-1",
    "green-2",
    "green-3",
    "green-4",
    "green-5",
    "green-6",
    "green-7",
    "green-8",
    "green-9",
    "green-0",
    "green-1",
    "green-2",
    "green-3",
    "green-4",
    "green-5",
    "green-6",
    "green-7",
    "green-8",
    "green-9",
    "green-draw2",
    "green-draw2",
    "green-reverse",
    "green-reverse",
    "green-skip",
    "green-skip",

    "yellow-0",
    "yellow-1",
    "yellow-2",
    "yellow-3",
    "yellow-4",
    "yellow-5",
    "yellow-6",
    "yellow-7",
    "yellow-8",
    "yellow-9",
    "yellow-0",
    "yellow-1",
    "yellow-2",
    "yellow-3",
    "yellow-4",
    "yellow-5",
    "yellow-6",
    "yellow-7",
    "yellow-8",
    "yellow-9",
    "yellow-draw2",
    "yellow-draw2",
    "yellow-reverse",
    "yellow-reverse",
    "yellow-skip",
    "yellow-skip",

    "black-draw4",
    "black-draw4",
    "black-draw4",
    "black-draw4",
    "black-wild",
    "black-wild",
    "black-wild",
    "black-wild",

];

module.exports.GetCard = function () 
{
    const r = Math.floor(Math.random() * cards.length);
    
    // const strCardArray = cards.splice(r,1);
    // const strCard = strCardArray[0];
    // cardsSeen.push(strCard);

    // console.log (strCard);
    // console.log ("Length: " + cards.length);
    // console.log ("Length Seen: " + cardsSeen.length);

    // if (cards.length == 0)
    // {
    //     //Copy all the cards again
    //     for (let i = 0; i < cardsSeen.length; i++)
    //     {
    //         cards[i] = cardsSeen[i];
    //     }
    //     cardsSeen = [];
    // }
    return cards[r];
}

module.exports.GetCards = function (nCount)
{
    let cards = [];
    for (let i = 0; i < nCount; i++)
    {
        cards[i] = module.exports.GetCard ();
    }
    return cards;
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

const mapDeckCards = new Map();

module.exports.GetCardDeck = function (strRoomCode)
{
    let deck;
    if (!mapDeckCards.has (strRoomCode))
    {
        //Create a deck
        deck = CreateDeck();
        mapDeckCards.set (strRoomCode, deck);
    }
    else
    {
        deck = mapDeckCards.get (strRoomCode);
    }

    if (deck.length <= 0)
    {
        ResetDeck (deck); 
    }

    const r = Math.floor(Math.random() * deck.length);
    const strCard = deck.splice(r, 1)[0];
    return strCard;
}

module.exports.GetCardsDeck = function (nCount, strRoomCode)
{
    let cards = [];
    for (let i = 0; i < nCount; i++)
    {
        cards[i] = module.exports.GetCardDeck (strRoomCode);
    }
    return cards;
}



function CreateDeck () {
    const newDeck = [];
    ResetDeck (newDeck);
    return newDeck;
}

function ResetDeck (deck) {
    for (let i = 0; i < cards.length; i++)
    {
        deck[i] = cards[i];
    }
}