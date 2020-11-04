// const strDomain = 'http://localhost:3000';
// const strDomain = 'https://rishi.loca.lt';
const strDomain = window.location.toString();

console.log("Domain: " + strDomain);

const socket = io(strDomain);

socket.on("connect", () => {
  console.log("connected");
});

window.onload = function () {
  console.log("Hi there");
};

////////////////////////////////////////////////////////////////////////////////////
///////////////                  Canvas
////////////////////////////////////////////////////////////////////////////////////
