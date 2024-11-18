const socket = io();
const chess = new Chess();

const boardElement1 = document.getElementById("board1");
const boardElement2 = document.getElementById("board2");

let selectedPiece = null;
let availableMoves = [];
let currentPlayer = 'w'; // White starts first

// Render the chessboard
const renderBoard = (boardElement, isInteractive) => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear existing board

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

                pieceElement.onclick = () => isInteractive && handlePieceClick(pieceElement, rowIndex, squareIndex);

                squareElement.appendChild(pieceElement);
            }

            if (availableMoves.some(move => move.row === rowIndex && move.col === squareIndex)) {
                squareElement.classList.add("highlight");
            }

            squareElement.onclick = () => isInteractive && handleSquareClick(rowIndex, squareIndex);

            boardElement.appendChild(squareElement);
        });
    });
};

// Handle piece click (for selecting a piece to move)
const handlePieceClick = (pieceElement, row, col) => {
    const square = chess.board()[row][col];

    if (square && square.color === currentPlayer) {
        if (selectedPiece) {
            const prevPieceElement = document.querySelector(`[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`);
            prevPieceElement.classList.remove("selected");
        }

        selectedPiece = { row, col, piece: square };
        pieceElement.classList.add("selected");

        availableMoves = chess.moves({ square: `${String.fromCharCode(97 + col)}${8 - row}`, verbose: true });

        renderBoard(boardElement1, currentPlayer === 'w');
        renderBoard(boardElement2, currentPlayer === 'b');
    }
};

// Handle square click to move the piece
const handleSquareClick = (rowIndex, colIndex) => {
    if (selectedPiece) {
        const moveTo = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;

        if (availableMoves.some(move => move.to === moveTo)) {
            const move = {
                from: `${String.fromCharCode(97 + selectedPiece.col)}${8 - selectedPiece.row}`,
                to: moveTo,
                promotion: 'q', // Promote pawn to Queen
            };

            const moveResult = chess.move(move);
            if (moveResult) {
                socket.emit("move", move);
                currentPlayer = chess.turn();

                selectedPiece = null;
                availableMoves = [];

                renderBoard(boardElement1, currentPlayer === 'w');
                renderBoard(boardElement2, currentPlayer === 'b');
            }
        }
    }
};

// Get Unicode for chess pieces
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: { w: "♙", b: "♟" },
        r: { w: "♖", b: "♜" },
        n: { w: "♘", b: "♞" },
        b: { w: "♗", b: "♝" },
        q: { w: "♕", b: "♛" },
        k: { w: "♔", b: "♚" },
    };
    return unicodePieces[piece.type][piece.color] || "";
};

// Listen for updates from the server
socket.on("move", (move) => {
    chess.move(move);
    renderBoard(boardElement1, currentPlayer === 'w');
    renderBoard(boardElement2, currentPlayer === 'b');
});

socket.on("playerRole", (role) => {
    currentPlayer = role;
    renderBoard(boardElement1, role === 'w');
    renderBoard(boardElement2, role === 'b');
});

socket.on("boardState", () => {
    renderBoard(boardElement1, currentPlayer === 'w');
    renderBoard(boardElement2, currentPlayer === 'b');
});

// Initially render both boards
renderBoard(boardElement1, false);
renderBoard(boardElement2, false);
