const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

const tileSize = 50;
const boardSize = 8;
const boardPixelSize = tileSize *  boardSize;
// Initialize the game board as a 2D array
	const gameBoard = new Array(boardSize).fill(null).map(() => new Array(boardSize).fill(null));


// const wins_list = [[1,4,7],[0,3,6], [2,5,8],[0,1,2],[3,4,5],[6,7,8],[0,4,8],[4,2,6]]
// function check_win() {
	// wins_list.forEach(win => 
		// if ((boardState[win[0]] == boardState[win[1]]) && (boardState[win[1]] == boardState[win[2]]) && boardState[win[1]] !=null) {console.log('b')}
		// )
	// for (let i = 0; i < wins_list.length; i++) {
		// if ((boardState[wins_list[i][0]]==boardState[wins_list[i][1]])&&(boardState[wins_list[i][1]]!=null)&&boardState[wins_list[i][1]]==boardState[wins_list[i][2]]) {//&&boardState[wins_list[i][1]]==boardState[wins_list[i][2]]
			// io.emit('error',currentPlayer)
			// console.log('winner')
		// }
	// }
// }//pick up here later. 
playerMapping = {}
playerCount = 0
currentPlayer = 'r'
const templateNewBaord = new Array(boardSize).fill(null).map(() => new Array(boardSize).fill(null));



function rotate_counter(direction) {//rotate cardinal direction counter clockwise two 'notches', aka 90 degrees,aka compass pieces of 8
	newY = direction[0]*-1
	newX = direction[1]
	return [newX,newY]
}
function rotate_clock(direction) {//ditto clockwise
	newX = direction[1]*-1
	newY = direction[0]
	return [newX,newY]
}
 
//if a ship's new location after the update is within the 8x8 board, then this will return the the parameters unchanged
function transform_coords(x,y,direction) {//otherwise this will map ships that have 'fallen off the edge of the board' back onto the board and update the direction, returning new coordinates and direction. 
if (x==-1&&y==boardSize){ 
	x=0
	y=boardSize-1
	direction = [1,-1]
}
if (x==boardSize&&y==-1) {
	x=boardSize-1
	y=0
	direction = [-1,1]
}
if ((x+y)>boardSize*2-2){ 
	x=0
	y=0
	direction = [-1,-1]
}
if (x+y==-2){ 
	x = 0
	y=0
	direction = [1,1]
}
	if (x==boardSize) {
		x=y;
		y=0
		direction = rotate_counter(direction)
	}
	if (y==boardSize) {
		y=x;
		x=0
		direction = rotate_clock(direction)
		
	}
	if (x==-1) {
		x=y
		y=boardSize-1
		direction = rotate_counter(direction)
	}
	if (y==-1) {
		y=x
		x=boardSize-1
		direction = rotate_clock(direction)
	}
	return [x,y,direction]
}


// function update_board() {
	// for (let i = 0; i < 

// Server-side function to initialize player data
function initializePlayerData(playerId) {
  // Simulating server-side data retrieval
  const playerData = {
    id: playerId,
    name: "Player " + playerId,
    shipCount: 0,
    level: 1,
	shipList: [] 
  };
  
  return playerData;
}



class Ship {
	static ship_index = 0;
	static ship_list = [];
	constructor(player) {
		this.player = player;//use socket id for this
		this.index = Ship.ship_index++;
		Ship.ship_list.push(this)
	}
	place(x,y,direction) {
		this.direction = direction
		this.x = x
		this.y=y
	}
	move() {
		this.previousX = x
		this.previousY = y
		this.x +=this.direction[0]
		this.y +=this.direction[1]
		let temp = transform_coords(this.x,this.y,this.direction)
		this.x = temp[0]
		this.y = temp[1]
		this.direction = temp[2]
	}
	destroy() {
		for (let i = 0; i < ship_list.lenth; i++) {
			if (this.index === ship_list[i].index) {
				ship_list.splice(i,1)
			}
		}
	}
}
function generate_moves(player_id) {
	let list = Ship.ship_list
	let moves = []
	for (let i = 0; i < list; i++) {
		if (list[i].player = player_id && [list[i].x,list[i].y] != [list[i].previousX,list[i].previousY]) {
			moves.push([list[i].previousX,list[i].previousY])
		}
	}
	return moves
}

var waiting_for_move = true;
var waiting_for_recover = false;
var gameState = true
var globalShipList = []
io.on('connection', (socket) => {
  if (playerCount < 2) {
    playerMapping[socket.id] = playerCount === 0 ? 'r' : 'b';
    playerCount++;
  } else {
    socket.emit('error', 'The game is full. Please try again later.');
    return;
  }//this code assign
  const playerData = initializePlayerData(playerMapping[socket.id]);
  socket.emit("playerData", playerData);
  socket.emit('boardState', { board: gameBoard, player: playerMapping[socket.id] });

	socket.on('ship_placed', (data) => {
		if (waiting_for_move) {
		x=data[0]
		y=data[1]
		direction = data[2]
		console.log(`x:${x} y:${y}`)
		let moves_list = generate_moves(socket.id)
		if (moves_list.includes([x,y])) {
		  let temp_ship = new Ship(socket.id)
		  temp_ship.place(x,y,)
		  io.emit('move', { locationX: x, locationY: y, player: currentPlayer});
		  currentPlayer = currentPlayer === 'r' ? 'b' : 'r';
		  waiting_for_move = false;
	  }
	}
	}); 

  

  socket.on('disconnect', () => {
    playerCount--;
    delete playerMapping[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

