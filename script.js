// Game Settings
const gameSettings = {
    gameDuration: 5 * 60, // 5 minutes in seconds
    turnDuration: 30, // 30 seconds per turn
    maxTitans: 4
};

// Game State
let gameData = {
    phase: 'placement', // 'placement' or 'movement'
    activePlayer: 'red', // 'red' or 'blue'
    redTitans: 0,
    blueTitans: 0,
    redPoints: 0,
    bluePoints: 0,
    selectedPiece: null,
    isRunning: false,
    isOver: false,
    isPaused: false,
    openCircuits: ['outer'], // 'outer', 'middle', 'inner'
    ownedEdges: {} // Map of edge IDs to player color
};

// Timers
let gameTimer;
let turnTimer;
let gameTimeLeft = gameSettings.gameDuration;
let turnTimeLeft = gameSettings.turnDuration;

// Board Elements
const boardPieces = [];
const boardConnections = [];

// DOM Elements
const boardElement = document.getElementById('hexagonal-grid');
const statusMessage = document.getElementById('game-status');
const redPointsDisplay = document.getElementById('red-score');
const bluePointsDisplay = document.getElementById('blue-score');
const redTitansDisplay = document.getElementById('red-titans');
const blueTitansDisplay = document.getElementById('blue-titans');
const phaseDisplay = document.getElementById('game-phase');
const playerDisplay = document.getElementById('current-player');
const gameTimerDisplay = document.getElementById('game-timer');
const turnTimerDisplay = document.getElementById('turn-timer');
const startButton = document.getElementById('start-game');
const pauseButton = document.getElementById('pause-game');
const resumeButton = document.getElementById('resume-game');
const resetButton = document.getElementById('reset-game');
const winnerPopup = document.getElementById('winner-modal');
const winnerMessage = document.getElementById('winner-text');
const finalScoreDisplay = document.getElementById('final-score');
const closePopupButton = document.getElementById('close-modal');
const playAgainButton = document.getElementById('play-again');
const themeSwitch = document.getElementById('theme-toggle');
const pauseScreen = document.getElementById('pause-overlay');

// Theme Toggle
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark-theme');
});

// Initialize the game board
function setupGame() {
    createBoard();
    setupControls();
    resetGameState();
}

// Create the hexagonal grid with nodes and edges
function createBoard() {
    const centerX = 250;
    const centerY = 250;
    
    // Create nodes for outer circuit - flat top hexagon
    const outerSize = 200;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + outerSize * Math.cos(angle);
        const y = centerY + outerSize * Math.sin(angle);
        
        boardPieces.push({
            id: `outer-${i}`,
            x,
            y,
            circuit: 'outer',
            occupied: null, // null, 'red', or 'blue'
            neighbors: []
        });
    }
    
    // Create nodes for middle circuit
    const middleSize = 130;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + middleSize * Math.cos(angle);
        const y = centerY + middleSize * Math.sin(angle);
        
        boardPieces.push({
            id: `middle-${i}`,
            x,
            y,
            circuit: 'middle',
            occupied: null,
            neighbors: []
        });
    }
    
    // Create nodes for inner circuit
    const innerSize = 70;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + innerSize * Math.cos(angle);
        const y = centerY + innerSize * Math.sin(angle);
        
        boardPieces.push({
            id: `inner-${i}`,
            x,
            y,
            circuit: 'inner',
            occupied: null,
            neighbors: []
        });
    }
    
    // Create edges between nodes within each circuit
    // Outer circuit edges
    createCircuitEdges('outer', 0, 6, [1, 2, 3, 1, 1, 1]);
    
    // Middle circuit edges
    createCircuitEdges('middle', 6, 6, [6, 4, 1, 6, 5, 4]);
    
    // Inner circuit edges
    createCircuitEdges('inner', 12, 6, [8, 9, 8, 8, 8, 9]);
    
    // Connect outer to middle - only connect alternating nodes
    for (let i = 0; i < 6; i += 2) {
        createConnection(`outer-${i}`, `middle-${i}`, getConnectionWeight('outer', 'middle', i));
    }
    
    // Connect middle to inner - only connect alternating nodes (offset by 1)
    for (let i = 1; i < 6; i += 2) {
        createConnection(`middle-${i}`, `inner-${i}`, getConnectionWeight('middle', 'inner', i));
    }
    
    // Draw the board
    drawBoard();
}

// Create edges for a circuit
function createCircuitEdges(circuit, startIndex, count, weights) {
    for (let i = 0; i < count; i++) {
        const nextIndex = (i + 1) % count;
        createConnection(`${circuit}-${i}`, `${circuit}-${nextIndex}`, weights[i]);
    }
}

// Get weight for connecting edges between circuits
function getConnectionWeight(outerCircuit, innerCircuit, index) {
    const weights = {
        'outer-middle': [2, 2, 1, 1, 1, 5],
        'middle-inner': [5, 4, 9, 5, 8, 8]
    };
    return weights[`${outerCircuit}-${innerCircuit}`][index];
}

// Create a connection between two nodes
function createConnection(nodeId1, nodeId2, weight) {
    const node1 = boardPieces.find(node => node.id === nodeId1);
    const node2 = boardPieces.find(node => node.id === nodeId2);
    
    if (node1 && node2) {
        const edgeId = `${nodeId1}-${nodeId2}`;
        
        boardConnections.push({
            id: edgeId,
            from: nodeId1,
            to: nodeId2,
            value: weight,
            owner: null // null, 'red', or 'blue'
        });
        
        // Add adjacent nodes for movement
        node1.neighbors.push(nodeId2);
        node2.neighbors.push(nodeId1);
    }
}

// Draw the board with nodes and edges
function drawBoard() {
    // Clear the board
    boardElement.innerHTML = '';
    
    // Draw edges
    boardConnections.forEach(edge => {
        const node1 = boardPieces.find(node => node.id === edge.from);
        const node2 = boardPieces.find(node => node.id === edge.to);
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const edgeElement = document.createElement('div');
        edgeElement.className = `edge ${edge.owner ? `controlled-${edge.owner}` : ''}`;
        edgeElement.id = `edge-${edge.id}`;
        edgeElement.style.width = `${length}px`;
        edgeElement.style.left = `${node1.x}px`;
        edgeElement.style.top = `${node1.y}px`;
        edgeElement.style.transform = `rotate(${angle}rad)`;
        
        boardElement.appendChild(edgeElement);
        
        // Add edge weight
        const weightElement = document.createElement('div');
        weightElement.className = 'edge-weight';
        weightElement.textContent = edge.value;
        weightElement.style.left = `${node1.x + dx / 2}px`;
        weightElement.style.top = `${node1.y + dy / 2}px`;
        
        boardElement.appendChild(weightElement);
    });
    
    // Draw nodes
    boardPieces.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.className = `node ${node.occupied ? `${node.occupied}-titan` : ''}`;
        nodeElement.id = `node-${node.id}`;
        nodeElement.dataset.id = node.id;
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;
        
        boardElement.appendChild(nodeElement);
    });
}

// Handle node click
function handleNodeClick(event) {
    if (!gameData.isRunning || gameData.isOver || gameData.isPaused) return;
    
    const nodeId = event.target.dataset.id;
    if (!nodeId) return;
    
    const node = boardPieces.find(node => node.id === nodeId);
    
    if (gameData.phase === 'placement') {
        handlePlacement(node);
    } else if (gameData.phase === 'movement') {
        handleMovement(node);
    }
}

// Handle placement phase
function handlePlacement(node) {
    // Check if the player has already placed all their titans
    if ((gameData.activePlayer === 'red' && gameData.redTitans >= gameSettings.maxTitans) ||
        (gameData.activePlayer === 'blue' && gameData.blueTitans >= gameSettings.maxTitans)) {
        statusMessage.textContent = `You have already placed all your titans. Now move them.`;
        return;
    }
    
    // Check if the node is in an unlocked circuit
    if (!gameData.openCircuits.includes(node.circuit)) {
        statusMessage.textContent = `The ${node.circuit} circuit is not unlocked yet.`;
        return;
    }
    
    // Check if the node is already occupied
    if (node.occupied) {
        statusMessage.textContent = 'This node is already occupied.';
        return;
    }
    
    // Place the titan
    node.occupied = gameData.activePlayer;
    
    // Update the count of placed titans
    if (gameData.activePlayer === 'red') {
        gameData.redTitans++;
        redTitansDisplay.textContent = gameData.redTitans;
    } else {
        gameData.blueTitans++;
        blueTitansDisplay.textContent = gameData.blueTitans;
    }
    
    // Check if we need to unlock the next circuit
    checkCircuitUnlock();
    
    // Check if all titans are placed
    if (gameData.redTitans === gameSettings.maxTitans && 
        gameData.blueTitans === gameSettings.maxTitans) {
        gameData.phase = 'movement';
        phaseDisplay.textContent = 'Phase: Movement';
        statusMessage.textContent = 'All titans placed. Movement phase begins.';
    }
    
    // Update controlled edges
    updateEdgeControl();
    
    // Switch player
    switchActivePlayer();
    
    // Redraw the board
    drawBoard();
}

// Check if we need to unlock the next circuit
function checkCircuitUnlock() {
    // Check if outer circuit is full
    if (gameData.openCircuits.includes('outer') && !gameData.openCircuits.includes('middle')) {
        const outerNodes = boardPieces.filter(node => node.circuit === 'outer');
        const allOccupied = outerNodes.every(node => node.occupied !== null);
        
        if (allOccupied) {
            gameData.openCircuits.push('middle');
            statusMessage.textContent = 'Middle circuit unlocked!';
        }
    }
    
    // Check if middle circuit is full
    if (gameData.openCircuits.includes('middle') && !gameData.openCircuits.includes('inner')) {
        const middleNodes = boardPieces.filter(node => node.circuit === 'middle');
        const allOccupied = middleNodes.every(node => node.occupied !== null);
        
        if (allOccupied) {
            gameData.openCircuits.push('inner');
            statusMessage.textContent = 'Inner circuit unlocked!';
        }
    }
}

// Handle movement phase
function handleMovement(node) {
    // If no node is selected, select a node with the current player's titan
    if (!gameData.selectedPiece) {
        if (node.occupied !== gameData.activePlayer) {
            statusMessage.textContent = `Select one of your titans to move.`;
            return;
        }
        
        gameData.selectedPiece = node;
        document.getElementById(`node-${node.id}`).style.boxShadow = '0 0 0 3px yellow';
        statusMessage.textContent = `Select a destination for your titan.`;
        return;
    }
    
    // If a node is already selected
    if (gameData.selectedPiece) {
        // If clicking the same node, deselect it
        if (gameData.selectedPiece.id === node.id) {
            gameData.selectedPiece = null;
            document.getElementById(`node-${node.id}`).style.boxShadow = '';
            statusMessage.textContent = `Movement canceled.`;
            return;
        }
        
        // Check if the destination node is adjacent
        if (!gameData.selectedPiece.neighbors.includes(node.id)) {
            statusMessage.textContent = `You can only move to adjacent nodes.`;
            return;
        }
        
        // Check if the destination node is empty
        if (node.occupied) {
            statusMessage.textContent = `The destination node is already occupied.`;
            return;
        }
        
        // Move the titan
        const oldNodeId = gameData.selectedPiece.id;
        
        // Update controlled edges before moving
        updateEdgesBeforeMove(oldNodeId);
        
        // Move the titan
        node.occupied = gameData.activePlayer;
        gameData.selectedPiece.occupied = null;
        
        // Reset selection
        document.getElementById(`node-${oldNodeId}`).style.boxShadow = '';
        gameData.selectedPiece = null;
        
        // Update controlled edges after moving
        updateEdgeControl();
        
        // Check for surrounded titans
        checkSurroundedTitans();
        
        // Check if the game is over
        checkGameEnd();
        
        // If game is not over, switch player
        if (!gameData.isOver) {
            switchActivePlayer();
        }
        
        // Redraw the board
        drawBoard();
    }
}

// Update controlled edges before a move
function updateEdgesBeforeMove(nodeId) {
    boardConnections.forEach(edge => {
        if ((edge.from === nodeId || edge.to === nodeId) && edge.owner === gameData.activePlayer) {
            // Remove points for this edge
            if (gameData.activePlayer === 'red') {
                gameData.redPoints -= edge.value;
            } else {
                gameData.bluePoints -= edge.value;
            }
            
            // Update the UI
            redPointsDisplay.textContent = gameData.redPoints;
            bluePointsDisplay.textContent = gameData.bluePoints;
            
            // Reset control
            edge.owner = null;
        }
    });
}

// Update controlled edges
function updateEdgeControl() {
    boardConnections.forEach(edge => {
        const node1 = boardPieces.find(node => node.id === edge.from);
        const node2 = boardPieces.find(node => node.id === edge.to);
        
        // Check if both nodes are occupied by the same player
        if (node1.occupied && node1.occupied === node2.occupied) {
            const player = node1.occupied;
            
            // If the edge wasn't already controlled by this player
            if (edge.owner !== player) {
                // Add points for this edge
                if (player === 'red') {
                    gameData.redPoints += edge.value;
                } else {
                    gameData.bluePoints += edge.value;
                }
                
                // Update the UI
                redPointsDisplay.textContent = gameData.redPoints;
                bluePointsDisplay.textContent = gameData.bluePoints;
                
                // Set control
                edge.owner = player;
            }
        } else if (edge.owner) {
            // If the edge was controlled but no longer is
            edge.owner = null;
        }
    });
}

// Check for surrounded titans
function checkSurroundedTitans() {
    boardPieces.forEach(node => {
        if (!node.occupied) return;
        
        const player = node.occupied;
        const opponent = player === 'red' ? 'blue' : 'red';
        
        // Get all adjacent nodes
        const adjacentNodes = node.neighbors.map(id => boardPieces.find(n => n.id === id));
        
        // Check if all adjacent nodes are occupied by the opponent
        const surrounded = adjacentNodes.length > 0 && adjacentNodes.every(n => n.occupied === opponent);
        
        if (surrounded) {
            // Remove the surrounded titan
            node.occupied = null;
            
            // Update the game status
            statusMessage.textContent = `A ${player} titan was surrounded and removed!`;
            
            // Update titan count
            if (player === 'red') {
                gameData.redTitans--;
                redTitansDisplay.textContent = gameData.redTitans;
            } else {
                gameData.blueTitans--;
                blueTitansDisplay.textContent = gameData.blueTitans;
            }
            
            // Check if a player has lost all titans
            const remainingTitans = boardPieces.filter(n => n.occupied === player).length;
            if (remainingTitans === 0) {
                endGame(`${opponent.charAt(0).toUpperCase() + opponent.slice(1)} player wins! All ${player} titans have been removed.`);
            }
        }
    });
}

// Check if the game is over
function checkGameEnd() {
    // Check if the inner circuit is full
    const innerNodes = boardPieces.filter(node => node.circuit === 'inner');
    const innerFull = innerNodes.every(node => node.occupied !== null);
    
    if (innerFull) {
        const winner = gameData.redPoints > gameData.bluePoints ? 'Red' : 'Blue';
        endGame(`${winner} player wins! Inner circuit is full.`);
        return true;
    }
    
    return false;
}

// Switch player
function switchActivePlayer() {
    gameData.activePlayer = gameData.activePlayer === 'red' ? 'blue' : 'red';
    playerDisplay.textContent = `Current Player: ${gameData.activePlayer.charAt(0).toUpperCase() + gameData.activePlayer.slice(1)}`;
    
    // Reset turn timer
    turnTimeLeft = gameSettings.turnDuration;
    updateTurnTimerDisplay();
}

// Start the game
function startGame() {
    if (gameData.isRunning) return;
    
    gameData.isRunning = true;
    statusMessage.textContent = 'Game started! Red player goes first.';
    
    // Start timers
    startTimers();
    
    // Enable pause button
    pauseButton.disabled = false;
    
    // Disable start button
    startButton.disabled = true;
}

// Pause the game
function pauseGame() {
    if (!gameData.isRunning || gameData.isOver) return;
    
    gameData.isPaused = true;
    
    // Stop timers
    clearInterval(gameTimer);
    clearInterval(turnTimer);
    
    // Show pause overlay
    pauseScreen.style.display = 'flex';
    
    // Update button text
    pauseButton.textContent = 'Resume Game';
}

// Resume the game
function resumeGame() {
    if (!gameData.isRunning || gameData.isOver) return;
    
    gameData.isPaused = false;
    
    // Restart timers
    startTimers();
    
    // Hide pause overlay
    pauseScreen.style.display = 'none';
    
    // Update button text
    pauseButton.textContent = 'Pause Game';
}

// Reset the game
function resetGameState() {
    // Stop timers
    clearInterval(gameTimer);
    clearInterval(turnTimer);
    
    // Reset game state
    gameData = {
        phase: 'placement',
        activePlayer: 'red',
        redTitans: 0,
        blueTitans: 0,
        redPoints: 0,
        bluePoints: 0,
        selectedPiece: null,
        isRunning: false,
        isOver: false,
        isPaused: false,
        openCircuits: ['outer'],
        ownedEdges: {}
    };
    
    // Reset nodes
    boardPieces.forEach(node => {
        node.occupied = null;
    });
    
    // Reset edges
    boardConnections.forEach(edge => {
        edge.owner = null;
    });
    
    // Reset UI
    phaseDisplay.textContent = 'Phase: Placement';
    playerDisplay.textContent = 'Current Player: Red';
    redPointsDisplay.textContent = '0';
    bluePointsDisplay.textContent = '0';
    redTitansDisplay.textContent = '0';
    blueTitansDisplay.textContent = '0';
    statusMessage.textContent = 'Game reset. Press Start Game to begin.';
    
    // Reset timers
    gameTimeLeft = gameSettings.gameDuration;
    turnTimeLeft = gameSettings.turnDuration;
    updateGameTimerDisplay();
    updateTurnTimerDisplay();
    
    // Reset buttons
    startButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.textContent = 'Pause Game';
    
    // Hide pause overlay
    pauseScreen.style.display = 'none';
    
    // Redraw the board
    drawBoard();
}

// Start timers
function startTimers() {
    // Clear any existing timers
    clearInterval(gameTimer);
    clearInterval(turnTimer);
    
    // Game timer
    gameTimer = setInterval(() => {
        gameTimeLeft--;
        updateGameTimerDisplay();
        
        if (gameTimeLeft <= 0) {
            clearInterval(gameTimer);
            const winner = gameData.redPoints > gameData.bluePoints ? 'Red' : 'Blue';
            endGame(`Time's up! ${winner} player wins!`);
        }
    }, 1000);
    
    // Turn timer
    turnTimer = setInterval(() => {
        turnTimeLeft--;
        updateTurnTimerDisplay();
        
        if (turnTimeLeft <= 0) {
            // Auto-switch player when turn time is up
            statusMessage.textContent = `${gameData.activePlayer.charAt(0).toUpperCase() + gameData.activePlayer.slice(1)} player's turn timed out!`;
            
            // If a node was selected, deselect it
            if (gameData.selectedPiece) {
                document.getElementById(`node-${gameData.selectedPiece.id}`).style.boxShadow = '';
                gameData.selectedPiece = null;
            }
            
            switchActivePlayer();
        }
    }, 1000);
}

// Update game timer display
function updateGameTimerDisplay() {
    const minutes = Math.floor(gameTimeLeft / 60);
    const seconds = gameTimeLeft % 60;
    gameTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update turn timer display
function updateTurnTimerDisplay() {
    const seconds = turnTimeLeft % 60;
    turnTimerDisplay.textContent = `00:${seconds.toString().padStart(2, '0')}`;
}

// End the game
function endGame(message) {
    gameData.isOver = true;
    
    // Stop timers
    clearInterval(gameTimer);
    clearInterval(turnTimer);
    
    // Update UI
    statusMessage.textContent = message;
    
    // Disable pause button
    pauseButton.disabled = true;
    
    // Show winner modal
    showWinnerPopup(message);
    
    // Create confetti
    createConfetti();
}

// Show winner modal
function showWinnerPopup(message) {
    winnerMessage.textContent = message;
    finalScoreDisplay.textContent = `Final Score - Red: ${gameData.redPoints}, Blue: ${gameData.bluePoints}`;
    winnerPopup.style.display = 'flex';
}

// Create confetti
function createConfetti() {
    const colors = ['#ff5252', '#4285f4', '#ffeb3b', '#4caf50', '#9c27b0', '#ff9800'];
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.top = '-10px';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.opacity = Math.random() + 0.5;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(confetti);
            
            // Animate confetti
            const animationDuration = Math.random() * 3 + 2;
            confetti.style.animation = `fall ${animationDuration}s linear forwards`;
            
            // Add keyframes for the fall animation
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(${Math.random() * 360}deg);
                    }
                    100% {
                        transform: translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg);
                    }
                }
            `;
            document.head.appendChild(style);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
                style.remove();
            }, animationDuration * 1000);
        }, i * 50);
    }
}

// Setup event listeners
function setupControls() {
    boardElement.addEventListener('click', handleNodeClick);
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', () => {
        if (gameData.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    });
    resumeButton.addEventListener('click', resumeGame);
    resetButton.addEventListener('click', resetGameState);
    closePopupButton.addEventListener('click', () => {
        winnerPopup.style.display = 'none';
    });
    playAgainButton.addEventListener('click', () => {
        winnerPopup.style.display = 'none';
        resetGameState();
    });
}

// Initialize the game when the page loads
window.addEventListener('load', setupGame);