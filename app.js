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

// Client-side function to update player data in HTML element
function updatePlayerData(playerData) {
  const playerElement = document.getElementById("playerData");

  // Update the HTML element with player data
  playerElement.innerHTML = `
    <p>ID: ${playerData.id}</p>
    <p>Name: ${playerData.name}</p>
    <p>Score: ${playerData.score}</p>
    <p>Level: ${playerData.level}</p>
  `;
}
socket.on("playerData", function(playerData) {
  // Call the updatePlayerData function to update the HTML element
  updatePlayerData(playerData);
});

// Draw the game board
function renderBoard() {
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

canvas.addEventListener('click', function(event) {
	// Calculate the clicked tile's coordinates
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	const tileX = Math.floor(x / tileSize);
	const tileY = Math.floor(y / tileSize);
	console.log('hello')
	socket.emit('cellClicked', [tileX, tileY])
	// Update and log the game state
	// gameBoard[tileY][tileX] = 'X';
	// console.log(`Tile clicked: (${tileX}, ${tileY})`);

	//Redraw the clicked tile
	// ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
	// ctx.fillRect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
});


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
