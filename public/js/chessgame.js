const socket = io();
const chess = new Chess();

const boardElement1 = document.getElementById("board1");
const boardElement2 = document.getElementById("board2");

let selectedPiece = null;  // Track the selected piece
let availableMoves = [];   // Track the available moves
let currentPlayer = 'w';   // Player starts with white

// Function to render the chessboard
const renderBoard = (boardElement) => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            // If there's a piece, render it
            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === 'w' ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.dataset.row = rowIndex;
                pieceElement.dataset.col = squareIndex;

                // Click event to select the piece
                pieceElement.onclick = () => handlePieceClick(pieceElement, rowIndex, squareIndex);

                squareElement.appendChild(pieceElement);
            }

            // Highlight available moves
            if (availableMoves.some(move => move.row === rowIndex && move.col === squareIndex)) {
                squareElement.classList.add("highlight");
            }

            // Click event to move a piece to a valid square
            squareElement.onclick = () => handleSquareClick(rowIndex, squareIndex);

            boardElement.appendChild(squareElement);
        });
    });

    if (currentPlayer === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

// Handle piece selection on click
const handlePieceClick = (pieceElement, row, col) => {
    const square = chess.board()[row][col];

    // Select the piece if it belongs to the current player
    if (square && square.color === currentPlayer) {
        // Deselect previous piece
        if (selectedPiece) {
            const prevPieceElement = document.querySelector(`[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`);
            prevPieceElement.classList.remove("selected");
        }

        // Select the clicked piece
        selectedPiece = { row, col, piece: square };
        pieceElement.classList.add("selected");

        // Get the valid moves for the selected piece
        availableMoves = chess.moves({ square: `${String.fromCharCode(97 + col)}${8 - row}`, verbose: true });

        // Render the updated board
        renderBoard(boardElement1);
        renderBoard(boardElement2);
    }
};

// Handle square click to move the selected piece
const handleSquareClick = (rowIndex, colIndex) => {
    if (selectedPiece) {
        const moveTo = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;

        // Check if the move is valid
        if (availableMoves.some(move => move.to === moveTo)) {
            const move = {
                from: `${String.fromCharCode(97 + selectedPiece.col)}${8 - selectedPiece.row}`,
                to: moveTo,
                promotion: 'q',
            };

            const moveResult = chess.move(move);
            if (moveResult) {
                // Emit move to the server (if needed)
                socket.emit("move", move);
                
                // Switch turn to the other player
                currentPlayer = chess.turn();

                // Reset the selection and available moves
                selectedPiece = null;
                availableMoves = [];

                // Re-render the board after the move
                renderBoard(boardElement1);
                renderBoard(boardElement2);
            }
        }
    }
};

// Get Unicode for the chess pieces
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: { w: "♙", b: "♟" },    // Pawn
        r: { w: "♖", b: "♜" },    // Rook
        n: { w: "♘", b: "♞" },    // Knight
        b: { w: "♗", b: "♝" },    // Bishop
        q: { w: "♕", b: "♛" },    // Queen
        k: { w: "♔", b: "♚" },    // King
    };
    return unicodePieces[piece.type][piece.color] || "";
};

// Initially render both boards
renderBoard(boardElement1);
renderBoard(boardElement2);
