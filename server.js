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


xmax = {b:'d',c:'e',d:'f'}

function transform_coordinates(x,y,piece) {
if (abs(i-j)=boardSize-1){ 
	
}
	if (x==boardSize) {
		x=y;
		y=0
		
	}
	if (y==boardSize) {
		y=x;
		x=0
	}
	if (x==-1) {
		x=y
		y=boardSize-1
	}
	if (y==-1) {
		y=x
		x=boardSize-1
	}
	return x,y
}

function direction_transformation(letter) {
	
}


function update_board() {
	var newBoard = 
	for (let i = 0; i < boardSize; i++) {
		for (let j = 0; j < boardSize; j++) {
			if (gameBoard[i][j] != 0) {
				if (gameBoard[i][j].length > 1) {
					
				}
			}
		}
	}
}

// Server-side function to initialize player data
function initializePlayerData(playerId) {
  // Simulating server-side data retrieval
  const playerData = {
	player data
    id: playerId,
    name: "Player " + playerId,
    score: 0,
    level: 1
  };
  
  return playerData;
}

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

  socket.on('cellClicked', (data) => {
	  x=data[0]
	  y=data[1]
	  console.log(`x:${x} y:${y}`)
    if (!gameBoard[x][y] && currentPlayer === playerMapping[socket.id]) {
	  console.log('made it to the if statement')
      gameBoard[x][y] = currentPlayer;
	  io.emit('move', { locationX: x, locationY: y, player: currentPlayer});
      currentPlayer = currentPlayer === 'r' ? 'b' : 'r';
      
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

