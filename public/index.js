// const strDomain = 'http://localhost:3000';
// const strDomain = 'https://rishi.loca.lt';
const strDomain = window.location.toString();

console.log ("Domain: " + strDomain)

const socket = io(strDomain)

socket.on ('connect', () => {
    console.log ('connected')
})


const canvas = document.getElementById ("mainMenuCanvas");
const ctx = canvas.getContext ("2d");
const width = canvas.width;
const height = canvas.height;

const fps = 40;
const deltaTime = 1.0/fps;

let g_mousePos = { x:0.0, y:0.0}; 

window.onload = function() {
    console.log ('Hi')

    canvas.addEventListener ("mousemove", function(evt) {
        let rect = canvas.getBoundingClientRect();
        let root = document.documentElement;

        g_mousePos.x = evt.clientX - rect.left- root.scrollLeft;
        g_mousePos.x = evt.clientY - rect.top - root.scrollTop;

        console.log (g_mousePos)
    });

    document.addEventListener ("keydown", function(evt) {

    });
}