# be-space-wars

## Backend github repo

https://github.com/Mycroftd/be-space-wars

### Frontend hosted example

[Play](http://spacewarsfront.eu-4.evennode.com/)

### Frontend github repo

https://github.com/radzarom/fe-space-wars/

## Summary
This project aims uses Node.js to create a backend that allows a browser to connect to a game and shares information between two players.  To achieve this we used websockets to send and receive data between the players. It receives and sends data about space ship coordinates, rotations, fired bullets, health. It also sends starting data about player positon and asteroid position.  When a player wins or loses the game the websockets are closed and the users can restart the game.  User names are stored in an array so that players cannot use a name that is already in use by somebody currently playing.

## Cloning
On the main page of this repository click 'code' and copy the URL, then at the command line do:

    git clone <URL>

## Running Locally

To install dependencies run:
    
    npm install

To open the server:

    npm start

To play the game locally you will need to download the front end example change the code within build/scripts/index.js.  At line 6 change the site to:

    const site = ws://localhost:3000