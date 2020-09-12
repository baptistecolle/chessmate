var myTurn = true;
var room;
var possibleMoves;
var selection;
var debugBoard;

var start = Date.now();

// Displaying time passed
setInterval(function() {
    var delta = Date.now() - start; 
    document.getElementById("time").innerText = (Math.floor(delta / 1000));     
}, 1000);


var socket = new WebSocket("ws://localhost:3000");

socket.onmessage = function(event){
    
    console.log("[LOG] " + event.data);

    if(event.data.includes("myself:")){
        myself = event.data.replace("myself: ", "");
        document.getElementById("myself").innerHTML = myself;
        document.getElementById("status").style.visibility = "hidden";
        document.getElementById("status").style.display = "none";
        document.getElementById("roomDiv").style.visibility = "visible";
        
    }

    if(event.data.includes("room: ")){
        document.getElementById("gameElement").style.visibility = "visible";
        document.getElementById("roomDiv").style.visibility = "hidden";
        document.getElementById("roomDiv").style.display = "none";
        room = event.data.replace("room: ", "");
    }


     if (event.data === "first"){
            console.log("first received");
            myTurn = true;
            if (myTurn){
                document.getElementById("turn").innerText = "Your turn";
            } else {
                document.getElementById("turn").innerText = "Not your turn";
            }
            document.getElementById("color").innerText = "White";
        } 

    if (event.data.includes("board: ")){

        var board = event.data;
        board = board.replace("board: ", "");

        display(board);

        myTurn = !myTurn;

        if (myTurn){
                document.getElementById("turn").innerText = "Your turn";
        } else {
                document.getElementById("turn").innerText = "Not your turn";
            }

       
    }

    // recevied that after sending move from
    if (event.data.includes("moveTo: ")){

        var temp = event.data.replace("moveTo: ", "");
        
        // reset the possible move if there were already present
        if (possibleMoves != null){
            possibleMoves.forEach(element =>  document.getElementById(element).style.backgroundColor = "");
        }
        
        possibleMoves = null;

        if(temp != ""){
            
            possibleMoves = new Array();

            document.getElementById(selection).style.backgroundColor = "red";
           
           console.log(temp);

            var loop = true;


            while (loop) {
               
                 if (temp.indexOf(',') == -1) {
                     loop = false;
                     proc = temp;
                 } else {
                    var proc = temp.substring(0, temp.indexOf(','))
                    temp = temp.substring(temp.indexOf(',') + 1, temp.length)
                 }

                

             

            // CASTLING SPECIAL CASE
             if(proc === "O-O" || proc === "O-O-O") { 
                console.log("castling possibility: " + proc)
                var temp;
                if (selection === "e1"){
                    if (proc === "O-O") {
                        temp = "g1"   
                    } else if (proc === "O-O-O"){
                        temp = "c1"
                    }
                } else if (selection === "e8") {
                    if (proc === "O-O") {
                        temp = "g8"   
                    } else if (proc === "O-O-O"){
                        temp = "c8"
                    }
                }

                    //document.getElementById(temp).style.backgroundColor ="green";
                    possibleMoves.push(temp)

                    // SPECIAL CASE FOR CASTLING
                    document.getElementById(temp).onclick = function (){
                            if (selection == "e1" || selection == "e8"){
                                socket.send("manual: (room-" + room + ")" + proc);
                            } else {
                                moveFrom(temp);
                            }
                            }

                            




             } 

             // IF I HAVE A PAWN PROMOTION ALWAYS REPLACE WITH A QUEEN
             else if (proc.includes("=")) {
                if (proc.includes("=Q")){
                    var temp = proc;
                    var temp2 = selection

                    // console.log("proc == " + temp)

                    var promotion = proc.replace(/[^a-h1-8]/gm, '');
                    console.log("first: " + promotion);

                    if (promotion.length > 2){
                        promotion = promotion.substring(promotion.length - 2, promotion.length);
                    }

                    // console.log("second: " + promotion);
                    // console.log("proc == " + temp)

                    document.getElementById(promotion).onclick = function(){
                        if (document.getElementById(temp2).innerText == "♙" || document.getElementById(temp2).innerText == "♟") {
                            socket.send("manual: (room-" + room + ")" + temp);
                        } else {
                            moveFrom(promotion);
                        }
                    }

                    //possibleMoves.push(promotion)
                    document.getElementById(promotion).style.backgroundColor = "green";

                }
             } 
             else {

                proc = proc.replace(/[^a-h1-8]/gm, '');

             if (proc.length > 2){
                 proc = proc.substring(proc.length - 2, proc.length);
             }

                console.log("pushed coord: " + proc);
                possibleMoves.push(proc)

            }


             

             
             }

             possibleMoves.forEach(element =>  document.getElementById(element).style.backgroundColor = "green");

           }
           
        } 


    if (event.data === "disconnected"){
        alert('Other player has left, please reloaded the page');
        myTurn = false;

        
    }

    if (event.data === "check"){
        alert('You have been checked')

    }

    if (event.data === "won"){
        if(alert('You won nice! your page will be reloaded')){}
        else window.location.reload();
    }

    if (event.data === "lost"){
        if(alert('You lost better chance next time, your page will be reloaded')){}
        else window.location.reload();
    }

    if (event.data === "draw"){
        if(alert('Draw... what a shame! your page will be reloaded')){}
        else window.location.reload();
    }


}



// useless
socket.onopen = function(){
    //document.getElementById("btn").disabled = !myTurn;
    //document.getElementById("turn").innerText = String(myTurn);
    //socket.send("Hello from the client!");
    //document.getElementById("hello").innerHTML = "Sending a first message to the server ...";
};

function display(text) {

    debugBoard = text;
    
    text = text.replace(/[0-9]|a|c|d|e|f|g|h|\+|-|\|/g, '');
    text = text.replace(/(\r\n|\n|\r|\s*)/gm, "");
    text = text.substring(0, text.length - 1);
    //console.log(text);

    capturedPieces(text);

    var table = '';
    var stringCounter = 0;

    //table += '<table>';

    // a chess board is 8x8 so 9x9 with coordinates
    // loop row
    for(i = 8; i > 0; i--){
        

        table += '<tr>'

        table += '<td>' + i + '</td>';

        //loop column
        for(j = 0; j < 8; j++){

            var caseNumber = (String.fromCharCode(j + 97) + i);

            table += '<td id ="' + caseNumber + '"><a onclick="moveFrom(\'' + caseNumber + '\')">';

            //if (text.charAt(stringCounter) !== '.'){
                var current = text.charAt(stringCounter);

                table += letterUnicode(current);

            stringCounter++;

            table += '</a></td>'
        }
        table += '</tr>'

    }

    table += '<tr><td></td><td>a</td><td>b</td><td>c</td><td>d</td><td>e</td><td>f</td><td>g</td><td>h</td></tr>';

    document.getElementById("chessTable").innerHTML = table;

}

function capturedPieces(text){

    
    var whiteCaptured = "";
    var blackCaptured = "";

    // list pieces with the number of pieces the should have
    var listPieces = ['r2','n2','b2','q1','k1','p8'];
  

    for (i = 0; i < listPieces.length; i++){
        
        
       var piece = listPieces[i].charAt(0);

       var maxOccurence = listPieces[i].charAt(1)


        var numberCaptured = maxOccurence - numberOccurence(piece, text);

        whiteCaptured += letterUnicode(piece).repeat(numberCaptured); 

        piece = piece.toUpperCase();
        numberCaptured = maxOccurence - numberOccurence(piece, text);
        blackCaptured += letterUnicode(piece).repeat(numberCaptured); 

    }
    

    // console.log("whiteCaptured " + whiteCaptured);
    // console.log("blackCaptured " + blackCaptured);

    document.getElementById("capturedWhite").innerText = whiteCaptured;
    document.getElementById("capturedBlack").innerText = blackCaptured;

}

function numberOccurence(letter, text){
    // console.log("-" + text)
    var count = 0;
    for (j = 0; j < text.length; j++){ 
        if (letter === text.charAt(j)){
            // console.log("t" + letter)
            count++;
        }
    }
    return count;
}


function letterUnicode(current){


    switch (current){

        // BLACK
        case 'r':
            return "♜";
            // return "&#9820";
            // break;
        case 'n':
            return "♞";
            // return "&#9822";
            // break;
        case 'b':
            return "♝";
            // return "&#9821";
            // break;
        case 'q':
            return "♛";
            // return "&#9819";
            // break;
        case 'k':
            return "♚";
            // return "&#9818";
            // break;
        case 'p':
            return "♟";
            // return "&#9823";
            // break;

        // WHITE
        case 'R':
            return "♖";
            // return "&#9814";
            // break;
        case 'N':
            return "♘";
            // return "&#9816";
            // break;
        case 'B':
            return "♗";
            // return "&#9815";
            // break;
        case 'Q':
            return "♕";
            // return "&#9813";
            // break;
        case 'K':
            return "♔";
            // return "&#9812";
            // break;
        case 'P':
            return "♙";
            // return "&#9817";
            // break;
        default:
            return "";

    }
}

// standard movement
function sendMove() {

    console.log("Manual move requested");

    var coord = new Object();
    coord.from = document.getElementById("from").value;
    coord.to = document.getElementById("to").value;

    socket.send("move: (room-" + room + ")" + JSON.stringify(coord));
}

// requested the possible move from a square
function moveFrom(coord){

    if (myTurn){

    if (selection != null){
        document.getElementById(selection).style.backgroundColor = "";
    }

    // if i'm clicking on a square that is a possible move i should move
    if(possibleMoves != null){
        console.log("Requested move to " + coord);
        if (possibleMoves.includes(coord)){

            socket.send("move: (room-" + room + ")" + JSON.stringify({from: selection, to: coord}));
            playSound();
        }
    }
    
    selection = coord;

    console.log("Requested move from " + coord);


    // OTherwise i requested where i can move
    socket.send("moveFrom: (room-" + room + ")" + JSON.stringify({square: coord}));
}
}

function playSound(){
      var sound = document.getElementById("audio");
      sound.play();
}

function join() { 

    if (document.getElementById("room").value != myself){
        socket.send("join: " + document.getElementById("room").value + ",myself-" + myself);
    } else {
        alert("you are trying to play against yourself, please chnage room");
    }
    
}

// function resetBoard() {
//     socket.send("reset");
// }

function debugBoard() {
    return debugBoard;
}

