const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname));

const tileSize = 32; 
const boardSize = 8; 
const boardPixelSize = tileSize *  boardSize;
const gameSpeed = 666;

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

function searchForArray(haystack, needle){
  var i, j, current;
  for(i = 0; i < haystack.length; ++i){
    if(needle.length === haystack[i].length){
      current = haystack[i];
      for(j = 0; j < needle.length && needle[j] === current[j]; ++j);
      if(j === needle.length)
        return i;
    }
  }
  return -1;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


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
// function transform_coords(x,y,direction) {//otherwise this will map ships that have 'fallen off the edge of the board' back onto the board and update the direction, returning new coordinates and direction. 
// if (x==-1&&y==boardSize){ 
	// x=0
	// y=boardSize-1
	// direction = [1,-1]
// }
// if (x==boardSize&&y==-1) {
	// x=boardSize-1
	// y=0
	// direction = [-1,1]
// }
// if ((x+y)>boardSize*2-2){ 
	// x=0
	// y=0
	// direction = [-1,-1]
// }
// if (x+y==-2){ 
	// x = 0
	// y=0
	// direction = [1,1]
// }
	// if (x==boardSize) {
		// x=y;
		// y=0
		// direction = rotate_counter(direction)
	// }
	// if (y==boardSize) {
		// y=x;
		// x=0
		// direction = rotate_clock(direction)
		
	// }
	// if (x==-1) {
		// x=y
		// y=boardSize-1
		// direction = rotate_counter(direction)
	// }
	// if (y==-1) {
		// y=x
		// x=boardSize-1
		// direction = rotate_clock(direction)
	// }
	// return [x,y,direction]
// }
function transform_coords(x,y,direction) {//second version of transform coords, for toroidal mapping
if (x==-1){ 
	x=boardSize-1
}
if (x==boardSize) {
	x=0
}
if (y == boardSize){ 
	y=0
}
if (y==-1){ 
	y=boardSize-1
}
	return [x,y,direction]
}

function check_for_collision() {
	let collision_explode = []
	let collision_same = []
	for (let i = 0; i < globalShipList.length; i++) {
		for (let j = i+1; j < globalShipList.length; j++) {
			if (globalShipList[i].x == globalShipList[j].x && globalShipList[j].y == globalShipList[i].y) {
				if (globalShipList[i].player == globalShipList[j].player) {
					collision_same.push([globalShipList[i].x,globalShipList[i].y])
				}
				else {
					collision_explode.push([globalShipList[i].x,globalShipList[i].y])
				}
			}
		}
	}
	return {hetero:collision_explode,homo:collision_same}
}

// function update_board() {
	// for (let i = 0; i < 

// Server-side function to initialize player data
var playerList = []
function initializePlayerData(playerId) {
  // Simulating server-side data retrieval
  const playerData = {
    id: playerId,
    shipCount: 20,
	shipList: [] 
  };
  playerList.push([playerId,playerData])
  
  return playerData;
}

var explosion_signal_index = 0
var explosion_list_holder = []
function signal_explosion_list() {
	console.log(`explosion list:${explosion_list_holder}`)
	setTimeout(() => {
		io.emit('explosion',explosion_list_holder[explosion_signal_index]);
		if (explosion_signal_index > 0){
			explosion_signal_index-=1;
			signal_explosion_list();
			}
	},2*gameSpeed)
}
const direction_list = [[0,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]

function post_update() {
	setTimeout(() => {
				io.emit('renderBoard',convertShips())
				},3*gameSpeed);
			setTimeout(() => {
			for (let key in playerMapping) {
				//console.log(playerMapping[key])
				placementdata = generate_moves(playerMapping[key])
				//console.log(placementdata)
				io.to(key).emit('place_ship', placementdata)
			}
			},3*gameSpeed);
}

function update_ships() {
	for (let ship in globalShipList) {
		globalShipList[ship].move() 
	}
	let hits = check_for_collision()
	let explosion_list_holder = hits.hetero
	let self_collide = hits.homo
	setTimeout(()=>{
	io.emit('renderBoard',convertShips())
	if (!arraysEqual(hits.hetero,[])) {
		explosion_signal_index = hits.hetero.length-1
		
		signal_explosion_list()
		setTimeout(() => {
			let remove_list = []
			for (let hit in explosion_list_holder) {
				for (let dir in direction_list) {
					let new_pos = transform_coords(explosion_list_holder[hit][0]+direction_list[dir][0],explosion_list_holder[hit][1]+direction_list[dir][1],direction_list[dir])
					console.log(new_pos)
					for (let ship in globalShipList) {
						if (globalShipList[ship].x == new_pos[0] && globalShipList[ship].y == new_pos[1]) {
							//globalShipList.splice(ship,1);
							remove_list.push(globalShipList[ship].index)
						}	 
					}
				}  
			}  
			let dex = 0
			//console.log(`removal list = ${remove_list}`)
			while (dex < globalShipList.length) {
				//console.log(globalShipList)
				if (remove_list.includes(globalShipList[dex].index)) {
					globalShipList.splice(dex, 1);
					//console.log('now here')
				} 
				else {dex+=1}
				}
			io.emit('renderBoard', convertShips())
			setTimeout(() => {
				io.emit('renderBoard',convertShips())
				},3*gameSpeed);
			setTimeout(() => {
			for (let key in playerMapping) {
				console.log(playerMapping[key])
				placementdata = generate_moves(playerMapping[key])
				//console.log(placementdata)
				io.to(key).emit('place_ship', placementdata)
			}
			},3*gameSpeed);
		},4*gameSpeed*hits.hetero.length+2*gameSpeed) 
	}
	else {
		post_update()
	}
	
	if (!arraysEqual(hits.homo,[])) {
		console.log('self hit')
		remove_list = []
		for (let hit in self_collide) {
		for (let ship in globalShipList) {
			if (globalShipList[ship].x == self_collide[hit][0] && globalShipList[ship].y == self_collide[hit][1]) {
				remove_list.push(globalShipList[ship].index)
				console.log('added to remove list')
			}	 
		}
		}
		let dex = 0
			//console.log(`removal list = ${remove_list}`)
			while (dex < globalShipList.length) {
				//console.log(globalShipList)
				if (remove_list.includes(globalShipList[dex].index)) {
					for (let spot in playerList) {
						if (playerList[spot][0] == globalShipList[dex].player) {
							playerList[spot][1].shipCount +=1
						}
					}
					globalShipList.splice(dex, 1);
					//console.log('now here')
					
				} 
				else {dex+=1}
				}
			
	}
	
	},3*gameSpeed) 
	
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
		globalShipList.push(this)
		this.direction = direction
		this.x = x
		this.y=y
	}
	move() {
		this.previousX = this.x
		this.previousY = this.y
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


function check_if_location_has_ship(cx,cy) {
	let emptyChecker = true
	for (let j = 0; j < globalShipList.length; j++) {
		if (globalShipList[j].x == cx && globalShipList[j].y == cy) {
			emptyChecker = false
		} 
	}
	return emptyChecker;
}

function generate_moves(player_id) {
	let list = globalShipList
	let moves = []
	//console.log(`ship list ${globalShipList} `)
	for (let i = 0; i < list.length; i++) {
		let ship = list[i]
		//console.log(`checking if at ${ship.previousX},${ship.previousY} there is a ship ${check_if_location_has_ship(ship.previousX,ship.previousY)}`)
		if ((ship.player == player_id) && 
			//[ship.x,ship.y] != [ship.previousX,ship.previousY]&&
			check_if_location_has_ship(ship.previousX,ship.previousY)) {
			moves.push([ship.previousX,ship.previousY])}
	} 
	return moves
}
function convertShips() {
	emitCoords = []
		for (let i = 0; i < globalShipList.length; i++) {
			emitCoords.push([[globalShipList[i].x,globalShipList[i].y],globalShipList[i].direction,globalShipList[i].player])
		}
		return emitCoords
} 
var waiting_for_move = true;
var waiting_for_recover = false;
var gameState = true
var globalShipList = []
var gameStart = false
var placementCount = 0

io.on('connection', (socket) => {
	console.log(socket.id)
  if (playerCount < 2) {
    playerMapping[socket.id] = playerCount === 0 ? 'r' : 'b';
    playerCount++; 
  } else {
    socket.emit('error', 'The game is full. Please try again later.');
    return;
  }//this code assign
  //console.log()   
  const playerData = initializePlayerData(playerMapping[socket.id]);
  socket.emit("playerData", playerData);
  socket.emit('boardState', { board: gameBoard, player: playerMapping[socket.id] });
	 
	if (playerCount == 2 && !gameStart) {
		//console.log('two players connected')
		gameStart = true
		redStart = new Ship(playerMapping[Object.keys(playerMapping)[0]])
		redStart.place(1,1,[1,0])
		//console.log(playerMapping[Object.keys(playerMapping)[1]])
		blueStart = new Ship(playerMapping[Object.keys(playerMapping)[1]])
		blueStart.place(6,6,[-1,0])
		blueStart.move()
		// blue2Start = new Ship(playerMapping[Object.keys(playerMapping)[1]])
		// blue2Start.place(2,6,[1,0])
		// blue2Start.move()
		redStart.move() 
		//console.log(Object.keys(playerMapping))
		for (let key in playerMapping) {
			//console.log(`sending ship data ${convertShips()}`) 
			io.to(key).emit('renderBoard', convertShips())
			}
		setTimeout(() => {
			for (let key in playerMapping) {
				//console.log(playerMapping[key])
				placementdata = generate_moves(playerMapping[key])
				//console.log(globalShipList)
				io.to(key).emit('place_ship', placementdata)
		}
		},3*gameSpeed);
	}
	
	
	socket.on('ship_placed', (data) => {
		if (data != 'no ships') {
		
		//console.log('you did place a ship')
		if (waiting_for_move) {
		x=data[0]   
		y=data[1]   
		direction = data[2] 
		//console.log(`x:${x} y:${y}`)
		let moves_list = generate_moves(socket.id)
		
		if (searchForArray([x,y],moves_list)) {  
		  let temp_ship = new Ship(playerMapping[socket.id])
		  temp_ship.place(x,y,direction)
		  //io.emit('move', { locationX: x, locationY: y, player: currentPlayer});
		  //currentPlayer = currentPlayer === 'r' ? 'b' : 'r';
		  //waiting_for_move = false;
		  placementCount+=1;
		  playerData.shipCount -= 1
		  socket.emit("playerData", playerData);
		  //console.log('hit the movelist check'); 
		}
		}
		else {placementCount+=1
			
		}
		
		if (placementCount >1) {
			//console.log('bothPlaced')
			placementCount = 0
			io.emit('renderBoard', convertShips())
			update_ships()
			socket.emit('playerData', playerData)
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

