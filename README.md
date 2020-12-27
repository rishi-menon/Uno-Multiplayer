# Uno-Multiplayer  
**About**  
Multiplayer UNO game which can be played with friends during this wonderful quarantine. Upto eight people can play in a room  
Link: https://games-uno.herokuapp.com/  
The server can alternatively be hosted locally using **node** and other players can connect to your local server using **localTunnel** module.  

**Screenshots**  
<img src="Resources/img1.png" width=800>  
<img src="Resources/img2.png" width=800>  
<img src="Resources/img3.png" width=800>  
<img src="Resources/img4.png" width=800>  
<img src="Resources/img5.png" width=800>  
<img src="Resources/img6.png" width=800>  
  
  
**Setting Local Server**  
Clone this repository by running `git clone https://github.com/rishi-menon/Uno-Multiplayer.git` 
  
Download and install node from https://nodejs.org/en/download/  
Open a terminal in the root repo and run `node sMain.js` to start the server  
  
Open another terminal in the root repo and run `./createTunnel.sh 3000 jane` to create a tunnel for other players outside your network to connect to the server. You can specify any custom name instead of 'jane' to request localTunnel to create a url with that name. If it succeeds, you will get a URL which you can send to other players and then you can start playing the game :)  
  
  
**Known Issues**  
1. In a particular room, the players cannot have the same name. If they do, the game will not throw an error but when the actual round begins, the game will stop working  
