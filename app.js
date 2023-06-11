
const socket = io();
const board = document.getElementById('gameBoard');
let myPlayer;

//setting up the server constants
const canvas = document.getElementById('gameBoard');
//console.log(canvas)
const ctx = canvas.getContext('2d');

//initialize board constants (thesse may want to change to match device screen size) 
const tileSize = 50;
const boardSize = 8; 
const boardPixelSize = tileSize * boardSize;
 
canvas.width = boardPixelSize;
canvas.height = boardPixelSize;

// Initialize the game board as a 2D array
const gameBoard = new Array(boardSize).fill(null).map(() => new Array(boardSize).fill(null));
document.addEventListener("DOMContentLoaded", function() {
var placeButton = document.createElement("button");
placeButton.textContent = "Confirm Placement";
	placeButton.addEventListener("click", function() {
		if (place_ship && !arraysEqual(focus_location,[])){
			place_ship = false;
		rotate_piece = false;
		socket.emit('ship_placed',[focus_location[0],focus_location[1],focus_location[2]]);
		}   
}); 
var targetElement = document.getElementById("placeButton");
targetElement.appendChild(placeButton);
var rotateButton = document.createElement("button");
rotateButton.textContent = "rotate piece";
	rotateButton.addEventListener("click", function() {
		if (place_ship && !arraysEqual(focus_location,[])){
			respondToArrows(-1);
		} 
});
var target2Element = document.getElementById("rotateButton");
target2Element.appendChild(rotateButton);})

//utility functions:

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


// Define the Person class
class Person {
  constructor(player, startingX, startingY) {
    this.player = player;
    this.x = startingX;
    this.y = startingY;
    this.items = [];
  }

  // Function to get possible moves based on current location
  getPossibleMoves(gameBoard, gameObjects) {
    const possibleMoves = [];

    // Define movement offsets for each direction
    const directions = [
      { dx: -1, dy: 0 },  // Left
      { dx: 1, dy: 0 },   // Right
      { dx: 0, dy: -1 },  // Up
      { dx: 0, dy: 1 }    // Down
    ];

    for (const direction of directions) {
      const newX = this.x + direction.dx;
      const newY = this.y + direction.dy;

      // Check if the new position is within the game board boundaries
      if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
        // Check if the new position is unoccupied by other game objects
        const isPositionOccupied = gameBoard[newX][newY] != null
        if (!isPositionOccupied) {
          possibleMoves.push({ x: newX, y: newY });
        }
      }
    }

    return possibleMoves;
  }
}
  


const direction_list = [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]
function rotate_fortyfive(direction, orientation) {// orientation = 1 means clockwise, =-1 means counterclock
	//find index in list that your direction sits
	let found_direction = false
	let index = 0
	while (!found_direction) {
		if (arraysEqual(direction_list[index], direction) || index ==7) {
			found_direction = true
		}
		else index+=1
	}
	if (orientation == 1) {
		if (index != 7) {
			return direction_list[index+1]
		}
		else {return [-1,-1]}
	}
	else {
		if (index != 0) {
			return direction_list[index-1]
		}
		else {return [-1,0]}
	} 
}
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
 
function drawSquare(x,y,color){
	ctx.beginPath()
		ctx.fillStyle = color
		ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize)
		ctx.stroke(); 
}  
 
function explosion_animation(coords) {
	//console.log(typeof(direction_list[0][0]))
	//console.log('poopyshoe')
	//console.log(coords[0])
	for (let i = 0; i < direction_list.length; i++){
		drawSquare(coords[0]+direction_list[i][0],coords[1]+direction_list[i][1],'red')
	}
	drawSquare(coords[0],coords[1],"orange")
} 

// Client-side function to update player data in HTML element
function updatePlayerData(playerData) {
  const playerElement = document.getElementById("playerData");
	let playerName = 'noPlayer'
	if (playerData.id == 'r') {
		playerName = 'Red'
	}
	else (
		playerName = 'Blue'
	)
  // Update the HTML element with player data
  playerElement.innerHTML = ` 
    <p>Your color: ${playerName}</p>
    <p>Ships: ${playerData.shipCount}</p>
  `;
}
socket.on("playerData", function(playerData) {
  // Call the updatePlayerData function to update the HTML element
  updatePlayerData(playerData);
});
 
var clock_tilt,counter_tilt;
function render_piece(x,y,direction, color = 'black') {
	if (Math.abs(direction[0]) + Math.abs(direction[1]) == 1) {
		clock_tilt = rotate_fortyfive(rotate_fortyfive(direction,1),1);
		counter_tilt = rotate_fortyfive(rotate_fortyfive(direction,-1),-1);
	} 
	else { 
		clock_tilt = rotate_fortyfive(direction,1);
		counter_tilt = rotate_fortyfive(direction,-1);
	}
	//console.log(clock_tilt)
	ctx.beginPath();
	ctx.strokeStyle = color
	ctx.moveTo((x-.5)*tileSize+(-.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(-.5*direction[1])*tileSize*.5)
	ctx.lineTo((x-.5)*tileSize+(.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(.5*direction[1])*tileSize*.5)
	ctx.moveTo((x-.5)*tileSize+(.5*clock_tilt[0])*tileSize*.5,(y-.5)*tileSize+(.5*clock_tilt[1])*tileSize*.5)
	ctx.lineTo((x-.5)*tileSize+(.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(.5*direction[1])*tileSize*.5)
	ctx.moveTo((x-.5)*tileSize+(.5*counter_tilt[0])*tileSize*.5,(y-.5)*tileSize+(.5*counter_tilt[1])*tileSize*.5)
	ctx.lineTo((x-.5)*tileSize+(.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(.5*direction[1])*tileSize*.5)
	ctx.lineWidth = 2
	ctx.stroke();
}

// Draw the game board
const playerIDtoColorMap = {'r':'red','b':'blue'}
function renderBoard(placeList) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(let y = 0; y < boardSize; y++) { 
		for(let x = 0; x < boardSize; x++) {
			ctx.strokeStyle = 'black';
			ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
		}
	}
	if (placeList != undefined) {
	for (let i = 0; i < placeList.length; i++) {
		let renderColor = playerIDtoColorMap[placeList[i][2]]
		//console.log(placeList[0][0])
		render_piece(placeList[i][0][0]+1,placeList[i][0][1]+1,placeList[i][1],playerIDtoColorMap[placeList[i][2]])
	}} 
}
renderBoard() 

function remove_selection_icon() {
	for (let locale in place_list) {
		fill_over_selection_square(place_list[locale][0],place_list[locale][1])
	}
} 
 
function fill_over_selection_square(x,y) {
			ctx.beginPath(); 
			ctx.fillStyle = "green";
			ctx.fillRect(x*tileSize + tileSize*.1,y*tileSize + tileSize*.1,tileSize*.8,tileSize*.8);
			ctx.stroke();
}
 
// function locate_ships() {
	// pieces_list = []
	// for (let i = 0; i < boardSize; i++) {
		// for (let j = 0; j < boardSize; j++) {
			// if ((gameBoard[i][j].toLowerCase() == gameBoard[i][j]) == (playerData.ID == 'r')) {
				// pieces_list.push([i,j])
			// }
		// }
	// }
// }

// function update_board(moves) {
	// for (move in moves) {
		// gameBoard[move[0]][move[1]] = move[2]
	// }
	
// }

var place_ship = true;
var rotate_piece = false;
var retract_ship = false;
var place_list = []
var focus_location = []
function display_selection_tiles(tiles) {
	console.log(tiles); 
	place_list = tiles
	for (let i = 0; i < tiles.length; i++) { 
		drawSquare(tiles[i][0],tiles[i][1],"green")
	}
}
//display_selection_tiles([[1,1],[2,5]])
//var tiles = [[1,1],[2,5]]
canvas.addEventListener('click', function(event) {
	// Calculate the clicked tile's coordinates
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	const tileX = Math.floor(x / tileSize);
	const tileY = Math.floor(y / tileSize);
	if (place_ship && place_list.some(tile => tile[0] === tileX && tile[1] === tileY)){
		remove_selection_icon()
		render_piece(tileX+1,tileY+1,[1,1])  
		//console.log('here')
		
		rotate_piece = true
		focus_location = [tileX,tileY,[1,1]]
	}
	if (retract_ship) {
		return;  
	}; 
	socket.emit('cellClicked', [tileX, tileY])
	// Update and log the game state
	// gameBoard[tileY][tileX] = 'X';
	// console.log(`Tile clicked: (${tileX}, ${tileY})`);

	//Redraw the clicked tile
	// ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
	// ctx.fillRect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
});

function respondToArrows(rotate_orientation) {
	//console.log('ehleel')
	if (rotate_piece) {
			remove_selection_icon()
			focus_location = [focus_location[0],focus_location[1],rotate_fortyfive(focus_location[2],rotate_orientation)];
			render_piece(focus_location[0]+1,focus_location[1]+1,focus_location[2]);
		}
} 
window.addEventListener('keydown', function(event) {

    if (event.key == "a") { 
		//console.log('aaa')
        respondToArrows(-1);
	}
	if (event.key == "d") {
        respondToArrows(1);
	}
	if (event.key == 'Enter'&& place_ship) {
		place_ship = false;
		rotate_piece = false;
		
		socket.emit('ship_placed',[focus_location[0],focus_location[1],focus_location[2]]);
	}
});

socket.on('explosion',(explosion_coords)=> {
	explosion_animation(explosion_coords);
})

socket.on('renderBoard', (player_moves) => {//this will signal the player client to update the board, display the board events and then show where the player can place their troops. 
	//console.log(player_moves)
	renderBoard(player_moves)
})

socket.on('place_ship', (data)=>{
	console.log(data)
	display_selection_tiles(data)
	place_ship = true
	
})

socket.on('move', (elementData) => {
	//console.log(elementData)
  gameBoard[elementData.locationX][elementData.locationY] = elementData.player
  renderBoard()
});
 
socket.on('error', (message) => {
  alert(message);
});

// gameBoard.addEventListener('click', (e) => {
  // const cell = e.target;
  // if (cell.classList.contains('cell') && !cell.textContent) {
    // const index = parseInt(cell.dataset.index, 10);
    // socket.emit('cellClicked', index);
  // }
// });
