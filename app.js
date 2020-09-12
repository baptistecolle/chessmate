var express = require("express");
var http = require("http");
var websocket = require("ws");
var indexRouter = require("./routes/index");

var app = express();

var cookieParser = require("cookie-parser");
app.use(cookieParser());

var Chess = require("chess.js").Chess;

app.set('port', 3000);
app.set("view engine", "ejs");
app.get("/play", indexRouter);


// Middleware cookie
app.use(function (req, res, next) {
  var cookie = req.cookies.myCookie;
  if (cookie === undefined) {
    numberVisited = 1;
    res.cookie('myCookie', numberVisited, { maxAge: 900000, httpOnly: true });
  } else {
    numberVisited = parseInt(cookie) + 1
    res.clearCookie('myCookie');
    res.cookie('myCookie', numberVisited, { maxAge: 900000, httpOnly: true });
  }
  next();
});

app.use(express.static(__dirname + "/public"));


app.get("/", (req, res) => {
  res.render("splash.ejs", {
    numberPlayer: (roomArray.length*2 + lobby.length),
    numberRoom: roomArray.length,
    lobbySize: lobby.length,
    numberPlayerPlaying: (roomArray.length*2),
    numberVisited: req.cookies.myCookie
  });
});

var server = http.createServer(app);

const wss = new websocket.Server({ server });

// CONSTRUCTOR PATTERN (DESIGN PATTERN)
  function Room (player1, player2) {
    this.players = new Array();
    this.players.push(lobby[player1]);
    this.players.push(lobby[player2]);
    this.board = new Chess();
  };

  var lobby = new Array();
  var roomArray = new Array();


// When websocket connection is initialized
wss.on("connection", function(ws) {

  setTimeout(function() {
    console.log("[log] New WebSocket client - connection state: "+ ws.readyState);

    // var t = 0;
    // var indexFound = null;

    // do {
    //   if (lobby[t] === null){
    //     indexFound = t;
    //   } else {
    //     t++;
    //   }
    // } while ((t < lobby.length) && (indexFound === null))

    // if (indexFound !== null) {
    //   lobby[indexFound] = ws;
    // } else {
    //   lobby.push(ws);

    //   indexFound = (lobby.length-1);
    // }

    lobby.push(ws);
    indexFound = (lobby.length-1);

    ws.send("myself: " + (indexFound));

}, 100);

  // When clien disconnected while in game
  ws.on("close", function closed(event){

    // I want to alert other player so i search for him
    var indexFound = null;

    for (i = 0; i< roomArray.length; i++){

        for(j = 0; j<roomArray[i].players.length; j++){

          if (roomArray[i].players[j] === ws){

            if (j === 0){
              roomArray[i].players[1].send("disconnected");
              roomArray[i].players[1].close();
              indexFound = i;
              found = true;
            } else {
              roomArray[i].players[0].send("disconnected");
              roomArray[i].players[0].close();
              indexFound = i;
              found = true;
            }
          }
        }

    }

    if(indexFound != null){
      roomArray.splice(indexFound, 1);
    }

    console.log("CLIENT DISCONNECTED");

  })

  // BIG LIST OF ALL WS MESSAGES
  ws.on("message", function incoming(message) {

    console.log("[LOG] " + message.toString());

    if(message.toString().includes("debug")) {
      var temp2 = message.toString();
      temp2 = temp2.replace("debug", '');
      console.log(roomArray[temp2].board.ascii());

    }

    if(message.toString().includes("join: ")) {

      var opponent = message.toString().substring(message.toString().indexOf(' ')+1, message.toString().indexOf(','));
      var myself = message.toString().substring(message.toString().indexOf('-')+1, message.toString().length);

      console.log("[LOG] " + opponent + " is playing with " + myself);

      if (lobby[opponent] != null){

        // FIRST PLAYER IS THE FIRST IN THE GAME OBJECT
        if(Math.round(Math.random()) == 0){
          roomArray.push(new Room(myself, opponent))
          roomArray[roomArray.length -1].players.forEach(element => element.send("board: " + roomArray[roomArray.length -1].board.ascii()))
          ws.send("first");
        } else {
          roomArray.push(new Room(opponent, myself))
          roomArray[roomArray.length -1].players.forEach(element => element.send("board: " + roomArray[roomArray.length -1].board.ascii()))
          lobby[opponent].send("first");
        }

        lobby.splice(myself, 1);
        lobby.splice(opponent, 1);

        // telling number of the room they are playing in
        roomArray[roomArray.length -1].players.forEach(element => element.send("room: " + (roomArray.length -1)));

      } else {
        ws.send("wrong player")
      }

    }

    // Request from a square every possible moves (FROM)
    if(message.toString().includes("moveFrom: ")) {

      var roomNumber = message.toString().substring(message.indexOf('-') + 1, message.indexOf(')'));
      // Give list of all the player possible movements (TO)
      var temp = "moveTo: " + roomArray[roomNumber].board.moves(JSON.parse(message.toString().substring(message.indexOf('{'), message.toString().length)));
      ws.send(temp);


    }

    // SPECIAL METHOD FOR CASTLING AND PAWN PROMOTION
    if (message.toString().includes("manual: ")){

      var roomNumber = message.toString().substring(message.indexOf('-') + 1, message.indexOf(')'));
      roomArray[roomNumber].board.move(message.toString().substring(message.indexOf(')')+1, message.length));
      roomArray[roomNumber].players.forEach(element => element.send("board: " + roomArray[roomNumber].board.ascii()));

      gameStatus(roomNumber);

    }


    // Sending the offical movement to the library (FROM + TO)
    if(message.toString().includes("move: ")) {

      var roomNumber = message.toString().substring(message.indexOf('-') + 1, message.indexOf(')'));
      roomArray[roomNumber].board.move(JSON.parse(message.toString().substring(message.indexOf('{'), message.toString().length)));

      // send new board with updated possition to the players
      roomArray[roomNumber].players.forEach(element => element.send("board: " + roomArray[roomNumber].board.ascii()))

      // check if game won or checkmate ...
      gameStatus(roomNumber);

    }

    });

});


// check if game won or checkmate ...
function gameStatus(roomNumber){
  if (roomArray[roomNumber].board.game_over()) {
    if (roomArray[roomNumber].board.in_checkmate()){
      if (roomArray[roomNumber].board.turn() == 'w'){
        roomArray[roomNumber].players[0].send("lost");
        roomArray[roomNumber].players[1].send("won");
      } else {
        roomArray[roomNumber].players[1].send("lost");
        roomArray[roomNumber].players[0].send("won");
      }
    } else {
        roomArray[roomNumber].players.forEach(element => element.send("draw"))
    }
} else if (roomArray[roomNumber].board.in_check()) {
      if (roomArray[roomNumber].board.turn() == 'w'){
        roomArray[roomNumber].players[0].send("check");
      } else {
        roomArray[roomNumber].players[1].send("check");
      }
  }
}

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
