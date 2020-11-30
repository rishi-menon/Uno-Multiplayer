const ac_animationCard = document.querySelector(".currentCard");
const ac_animDuration = 0.8;  //in seconds 

function AC_SetCurrentCardAnim (strCard)
{

    //Reset animation
    ac_animationCard.style.animationName = "";
    ac_animationCard.offsetWidth;   //Force refresh dom/ render element so that when we add the animation, it would actually play.... Alternatively we could add the animation after a small delay
    ac_animationCard.style.animationName = "rotateCurrentCard";
    ac_animationCard.style.animationDuration = ac_animDuration.toString() + "s";
    
    setTimeout (() => {
        UC_SetCurrentCard (strCard);
    }, (ac_animDuration * 1000 / 2));
}