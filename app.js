const socket = io();
const board = document.getElementById('gameBoard');
let myPlayer;

//setting up the server constants
const canvas = document.getElementById('gameBoard');
console.log(canvas)
const ctx = canvas.getContext('2d');

//initialize board constants (thesse may want to change to match device screen size) 
const tileSize = 50;
const boardSize = 8;
const boardPixelSize = tileSize * boardSize;

canvas.width = boardPixelSize;
canvas.height = boardPixelSize;

// Initialize the game board as a 2D array
const gameBoard = new Array(boardSize).fill(null).map(() => new Array(boardSize).fill(null));

//utility functions:
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

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
	found_direction = false
	index = 0
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


// Client-side function to update player data in HTML element
function updatePlayerData(playerData) {
  const playerElement = document.getElementById("playerData");

  // Update the HTML element with player data
  playerElement.innerHTML = `
    <p>ID: ${playerData.id}</p>
    <p>Name: ${playerData.name}</p>
    <p>Ships: ${playerData.shipCount}</p>
    <p>Level: ${playerData.level}</p>
  `;
}
socket.on("playerData", function(playerData) {
  // Call the updatePlayerData function to update the HTML element
  updatePlayerData(playerData);
});


function render_piece(x,y,direction) {
	if (Math.abs(direction[0]) + Math.abs(direction[1]) == 1) {
		clock_tilt = rotate_fortyfive(rotate_fortyfive(direction,1),1);
		counter_tilt = rotate_fortyfive(rotate_fortyfive(direction,-1),-1);
	}
	else {
		clock_tilt = rotate_fortyfive(direction,1);
		counter_tilt = rotate_fortyfive(direction,-1);
	}
	ctx.beginPath();
	ctx.moveTo((x-.5)*tileSize+(-.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(-.5*direction[1])*tileSize*.5)
	ctx.lineTo((x-.5)*tileSize+(.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(.5*direction[1])*tileSize*.5)
	ctx.moveTo((x-.5)*tileSize+(.5*clock_tilt[0])*tileSize*.5,(y-.5)*tileSize+(.5*clock_tilt[1])*tileSize*.5)
	ctx.lineTo((x-.5)*tileSize+(.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(.5*direction[1])*tileSize*.5)
	ctx.moveTo((x-.5)*tileSize+(.5*counter_tilt[0])*tileSize*.5,(y-.5)*tileSize+(.5*counter_tilt[1])*tileSize*.5)
	ctx.lineTo((x-.5)*tileSize+(.5*direction[0])*tileSize*.5,(y-.5)*tileSize+(.5*direction[1])*tileSize*.5)
	ctx.srokeStyle = 'black'
	ctx.lineWidth = 2
	ctx.stroke();
}

// Draw the game board
function renderBoard(redList,blueList,placeList) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(let y = 0; y < boardSize; y++) { 
		for(let x = 0; x < boardSize; x++) {
			if (gameBoard[x][y] == 'r') {
				ctx.font = "20px serif"
				ctx.fillText('r',(x+.4)*tileSize,(y+.6)*tileSize)
				console.log("drawing board")
			}
			if (gameBoard[x][y] == 'b') {
				ctx.font = "20px serif"
				ctx.fillText('b',(x+.4)*tileSize,(y+.6)*tileSize)
				console.log("drawing board")
			}
			
			ctx.strokeStyle = 'black';
			ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
		}
	}
}
renderBoard()

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

var place_ship = false;
var rotate_piece = false;
var place_list = []
var focus_location = []
function display_selection_tiles(tiles) {
	place_list = tiles
	for (let i = 0; i < tiles.length; i++) {
		ctx.beginPath()
		ctx.fillStyle = "green"
		ctx.fillRect(tiles[i][0]*tileSize,tiles[i][1]*tileSize,tileSize,tileSize)
		ctx.stroke();
	}
}
display_selection_tiles([[1,1]])
canvas.addEventListener('click', function(event) {
	// Calculate the clicked tile's coordinates
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	const tileX = Math.floor(x / tileSize);
	const tileY = Math.floor(y / tileSize);
	if (place_ship && tiles.includes([x,y])){
		render_piece(x,y,[1,1])
		rotate_piece = true
		focus_location = [x,y,[1,1]]
	}
	socket.emit('cellClicked', [tileX, tileY])
	// Update and log the game state
	// gameBoard[tileY][tileX] = 'X';
	// console.log(`Tile clicked: (${tileX}, ${tileY})`);

	//Redraw the clicked tile
	// ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
	// ctx.fillRect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
});
canvas.addEventListener('keydown', function(event) {
    switch (event.key) {
    case "ArrowLeft":
        if (rotate_piece) {
			ctx.beginPath[]
		}
    case "ArrowRight":
        // Right pressed
        break;
}
});



socket.on('placeShip', (player_moves) => {//this will signal the player client to update the board, display the board events and then show where the player can place their troops. 
	place_ship = true
	display_selection_tiles(player_moves)
})



socket.on('move', (elementData) => {
	console.log(elementData)
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
