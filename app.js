import { createServer } from "http";
import { parse } from "url";
import { WebSocketServer } from "ws";

//list of all web sockets connections
const clients = new Map();

//basic node server
const server = createServer();

//two web sockets
//websocket for the actual game
const wss1 = new WebSocketServer({ noServer: true });
//websocket for setting up the game and sending starting data to both players
const wss2 = new WebSocketServer({ noServer: true });

//list of all of the current user name playing the game
const listOfUsernames = [];

//websocket for the game
wss1.on("connection", function (ws) {

  //unique id for each connection
  const id = uuidv4();

  //the room name for the connection
  const room = ws.channel;

  //data for the current connection
  const metadata = { id };

  //add a client to the list of clients
  clients.set(ws, metadata);

  //this code is run when a user sends a message to the server
  ws.on("message", (messageAsString) => {
    //gets data from the message and parses it
    const message = JSON.parse(messageAsString);
    //gets th metadata from the client
    const metadata = clients.get(ws);

    //this code is run if a message of lost exists
    if (message.lost === true) {
      //loops through all clients and sends the message if players are in the correct room
      [...clients.keys()].forEach((client) => {
        //this is sent to both the player in the room
        //this tells both players that the game is finished
        if (room === client.channel) {
          client.send(JSON.stringify(message));       
          client.close();
        }
      });

      //when the game has finished removes the names from listOfUsernames
      let index1 = listOfUsernames.indexOf(message.username);
      listOfUsernames.splice(index1,1);
      let index2 = listOfUsernames.indexOf(message.otherPlayer);
      listOfUsernames.splice(index2,1);
      return;
    }

    //sends id of the message
    message.sender = metadata.id;
    
    //loops through all connections and if in the correct room sends the data
    [...clients.keys()].forEach((client) => {
      if (room === client.channel) client.send(JSON.stringify(message));
    });
  });
});


wss1.on("close", () => {
  clients.delete(ws);
});


//teamNo is the name for the current room
//this gets incremented every time a new room is created
let teamNo = 0;

//each team has two players, if teamSize = 0 then
//put the ws connection into wsStore and
//wait for another player,
//if another player arrives and teamSize = 1
//then start the game with the stored websocket
//and the current websocket
let teamSize = 0;
let wsStore;

wss2.on("connection", function (ws) {
  ws.on("message", () => {

    //if the user name is in listOfUsernames then send a message
    //of username to the player letting them know
    //the username already exists
    if (listOfUsernames.includes(ws.channel)) {
      ws.send(JSON.stringify({message: "username"}));
      return;
    }
    
    //if doesn't exist push the username into listOfUsernames
    listOfUsernames.push(ws.channel);

    //if player has no apponent put their connection
    //into wsStore and send a message saying
    //waiting so they know to display the waiting message
    //otherwise there are two players and send a message of
    //paired
    if (teamSize === 0) {
      wsStore = ws;
      teamSize = 1;
      ws.send(JSON.stringify({message: "waiting"}));
      return;
    } else {
      const message = {
        message: "paired",
        teamName: teamNo,
      };

      //makes a random number between 0 and 3
      //telling the game where to put the asteroids
      const asteroidPos = Math.floor(Math.random() * 3);

      //reset teamsize and and increment teamNo for the next game
      teamNo++;
      teamSize = 0;

      //sets up the game for both players and sends them a message
      message.otherPlayer = ws.channel;
      message.startPos = [200, 400];
      message.enemyStartPos = [1200, 400];
      message.angle = 0;
      message.enemyAngle = 0;
      message.asteroidPos = asteroidPos;
      wsStore.send(JSON.stringify(message));
      message.otherPlayer = wsStore.channel;
      message.startPos = [1200, 400];
      message.enemyStartPos = [200, 400];
      message.angle = 0;
      message.enemyAngle = 0;
      message.asteroidPos = asteroidPos;
      ws.send(JSON.stringify(message));

      //close the web socket
      wsStore.close();
      ws.close();
      wsStore = null;
    }
  });
});

//this creates a random id
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

//server
server.on("upgrade", function upgrade(request, socket, head) {
  //finds the path name from the url
  const { pathname } = parse(request.url);
  const newPath = pathname.slice(1);
  //finds the query from the url 
  const query = request.url.match(/=\w+/)[0].slice(1);

  //if the path is matched run wws1 websocket
  if (newPath === "matched") {
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      ws.channel = query;
      wss1.emit("connection", ws, request);
    });
  } else {
     //if the path is matched run wws2 websocket
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      ws.channel = query;      
      wss2.emit("connection", ws, request);
    });
  }
});

//this sets up the port and starts the server
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("wss up");
