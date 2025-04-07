// Modern Bingo Board JavaScript

// Global variables
let currentMode = 'creation'; // 'creation' or 'play'
let currentSquareIndex = null;
let bingoData = [];
let bingoMode = 'single'; // 'single', 'cross', 'plus', or 'blackout'
const BOARD_SIZE = 5; // 5x5 board
const MIDDLE_SQUARE_INDEX = 12; // Middle square in a 5x5 grid (0-indexed)
const MIDDLE_ROW = 2; // Middle row in a 5x5 grid (0-indexed)
const MIDDLE_COL = 2; // Middle column in a 5x5 grid (0-indexed)

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeBingoBoard();
    setupEventListeners();
    initializeTheme();
    
    // Save board title when user clicks away
    document.getElementById('board-title').addEventListener('blur', function() {
        // Remove any line breaks and extra spaces
        this.textContent = this.textContent.replace(/\n/g, ' ').trim();
        localStorage.setItem('boardTitle', this.textContent);
    });
    
    // Prevent new lines in title
    document.getElementById('board-title').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });
    
    // Load saved board title if exists
    const savedTitle = localStorage.getItem('boardTitle');
    if (savedTitle) {
        document.getElementById('board-title').textContent = savedTitle;
    }
    
    // Update title editability based on mode
    updateTitleEditability();
});

// Initialize theme from localStorage or default to light
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Toggle between light and dark themes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Create the initial bingo board
function initializeBingoBoard() {
    const bingoBoard = document.querySelector('.bingo-board');
    bingoBoard.innerHTML = '';
    
    // Initialize empty bingo data if not already created
    if (bingoData.length === 0) {
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            bingoData.push({
                text: i === MIDDLE_SQUARE_INDEX ? 'FREE' : '',
                image: null,
                isMarked: i === MIDDLE_SQUARE_INDEX // Middle square starts marked
            });
        }
    }
    
    // Create bingo squares
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const square = document.createElement('div');
        square.className = 'bingo-square';
        square.dataset.index = i;
        
        // Add free space class to middle square
        if (i === MIDDLE_SQUARE_INDEX) {
            square.classList.add('free-space');
            if (currentMode === 'play') {
                square.classList.add('marked');
            }
        }
        
        // Add marked class if square is marked in play mode
        if (currentMode === 'play' && bingoData[i].isMarked) {
            square.classList.add('marked');
        }
        
        // Add content if exists
        updateSquareContent(square, i);
        
        // Add controls based on mode
        if (currentMode === 'creation') {
            addCreationControls(square);
        } else {
            addPlayControls(square);
        }
        
        bingoBoard.appendChild(square);
    }
}

// Update a square's content based on bingoData
function updateSquareContent(square, index) {
    square.innerHTML = ''; // Clear existing content
    
    const data = bingoData[index];
    
    // Add image if exists
    if (data.image) {
        const img = document.createElement('img');
        img.src = data.image;
        square.appendChild(img);
    }
    
    // Add text if exists
    if (data.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'text-content';
        textDiv.textContent = data.text;
        square.appendChild(textDiv);
    }
    
    // Add controls based on mode
    if (currentMode === 'creation') {
        addCreationControls(square);
    } else {
        addPlayControls(square);
    }
}

// Add creation mode controls to a square
function addCreationControls(square) {
    // Don't add controls to the middle free space in creation mode
    if (parseInt(square.dataset.index) === MIDDLE_SQUARE_INDEX) {
        return;
    }
    
    // Remove any existing controls
    const existingControls = square.querySelector('.square-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'square-controls';
    
    // Add image button
    const imageBtn = document.createElement('button');
    imageBtn.className = 'control-btn image-btn';
    imageBtn.innerHTML = '<i class="fas fa-image"></i>';
    imageBtn.title = 'Add Image';
    
    // Add text button
    const textBtn = document.createElement('button');
    textBtn.className = 'control-btn text-btn';
    textBtn.innerHTML = '<i class="fas fa-font"></i>';
    textBtn.title = 'Add Text';
    
    // Add event listeners
    imageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleImageUpload(square.dataset.index);
    });
    
    textBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTextModal(square.dataset.index);
    });
    
    // Append buttons to controls
    controls.appendChild(imageBtn);
    controls.appendChild(textBtn);
    
    // Append controls to square
    square.appendChild(controls);
}

// Add play mode controls to a square
function addPlayControls(square) {
    const index = parseInt(square.dataset.index);
    
    // Remove any existing X mark
    const existingMark = square.querySelector('.x-mark');
    if (existingMark) {
        existingMark.remove();
    }
    
    // Create X mark
    const xMark = document.createElement('div');
    xMark.className = 'x-mark';
    xMark.innerHTML = '<i class="fas fa-times"></i>';
    
    // Append X mark to square
    square.appendChild(xMark);
    
    // Remove existing click event listeners by using a named function reference
    square.onclick = null;
    
    // Add click event to toggle marking
    square.onclick = function() {
        if (currentMode === 'play') {
            // Don't allow unmarking the middle free space
            if (index === MIDDLE_SQUARE_INDEX) {
                return;
            }
            
            // Toggle marked state
            this.classList.toggle('marked');
            bingoData[index].isMarked = this.classList.contains('marked');
            
            // Check for win condition
            if (checkForWin()) {
                setTimeout(() => {
                    showWinModal();
                }, 300);
            }
        }
    };
}

// Check if the player has won based on the current bingo mode
function checkForWin() {
    switch (bingoMode) {
        case 'blackout':
            // Check if all squares are marked
            return bingoData.every(square => square.isMarked);
        
        case 'cross':
            // Check if both diagonals are marked
            return checkDiagonal1() && checkDiagonal2();
        
        case 'plus':
            // Check if middle row and middle column are marked
            return checkMiddleRow() && checkMiddleColumn();
        
        case 'single':
        default:
            // Check for a line (row, column, or diagonal)
            return (
                checkRows() || 
                checkColumns() || 
                checkDiagonals()
            );
    }
}

// Check if the middle row is complete
function checkMiddleRow() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        const index = MIDDLE_ROW * BOARD_SIZE + col;
        if (!bingoData[index].isMarked) {
            return false;
        }
    }
    return true;
}

// Check if the middle column is complete
function checkMiddleColumn() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        const index = row * BOARD_SIZE + MIDDLE_COL;
        if (!bingoData[index].isMarked) {
            return false;
        }
    }
    return true;
}

// Check if diagonal from top-left to bottom-right is complete
function checkDiagonal1() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        const index = i * BOARD_SIZE + i;
        if (!bingoData[index].isMarked) {
            return false;
        }
    }
    return true;
}

// Check if diagonal from top-right to bottom-left is complete
function checkDiagonal2() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        const index = i * BOARD_SIZE + (BOARD_SIZE - 1 - i);
        if (!bingoData[index].isMarked) {
            return false;
        }
    }
    return true;
}

// Check rows for a win
function checkRows() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        let rowComplete = true;
        for (let col = 0; col < BOARD_SIZE; col++) {
            const index = row * BOARD_SIZE + col;
            if (!bingoData[index].isMarked) {
                rowComplete = false;
                break;
            }
        }
        if (rowComplete) return true;
    }
    return false;
}

// Check columns for a win
function checkColumns() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        let colComplete = true;
        for (let row = 0; row < BOARD_SIZE; row++) {
            const index = row * BOARD_SIZE + col;
            if (!bingoData[index].isMarked) {
                colComplete = false;
                break;
            }
        }
        if (colComplete) return true;
    }
    return false;
}

// Check diagonals for a win
function checkDiagonals() {
    return checkDiagonal1() || checkDiagonal2();
}

// Handle image upload
function handleImageUpload(index) {
    currentSquareIndex = index;
    
    // Create a file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // Add event listener for file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                // Show image preview modal
                const imagePreview = document.getElementById('image-preview');
                imagePreview.src = event.target.result;
                
                // Show modal
                const modal = document.getElementById('image-preview-modal');
                modal.style.display = 'flex';
                modal.classList.add('show');
            };
            
            reader.readAsDataURL(file); // Convert to base64
        }
        
        // Remove the input from DOM
        document.body.removeChild(fileInput);
    });
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
}

// Open text modal for a square
function openTextModal(index) {
    currentSquareIndex = index;
    
    // Set current text in textarea
    const textArea = document.getElementById('square-text');
    textArea.value = bingoData[index].text || '';
    
    // Show modal
    const modal = document.getElementById('text-modal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Save text from modal to bingo data
function saveText() {
    if (currentSquareIndex !== null) {
        const textArea = document.getElementById('square-text');
        bingoData[currentSquareIndex].text = textArea.value;
        
        // Update square content
        const square = document.querySelector(`.bingo-square[data-index="${currentSquareIndex}"]`);
        updateSquareContent(square, currentSquareIndex);
        
        // Close modal
        closeModals();
    }
}

// Save image from preview to bingo data
function saveImage() {
    if (currentSquareIndex !== null) {
        const imagePreview = document.getElementById('image-preview');
        bingoData[currentSquareIndex].image = imagePreview.src; // Save base64 image
        
        // Update square content
        const square = document.querySelector(`.bingo-square[data-index="${currentSquareIndex}"]`);
        updateSquareContent(square, currentSquareIndex);
        
        // Close modal
        closeModals();
    }
}

// Close all modals
function closeModals() {
    const textModal = document.getElementById('text-modal');
    const imageModal = document.getElementById('image-preview-modal');
    const winModal = document.getElementById('win-modal');
    
    textModal.classList.remove('show');
    imageModal.classList.remove('show');
    winModal.classList.remove('show');
    
    textModal.style.display = 'none';
    imageModal.style.display = 'none';
    winModal.style.display = 'none';
    currentSquareIndex = null;
}

// Show win notification modal
function showWinModal() {
    document.getElementById('win-modal').style.display = 'flex';
}

// Switch between creation and play modes
function switchMode(mode) {
    if (mode === currentMode) return;
    
    currentMode = mode;
    
    // Update mode toggle buttons
    document.getElementById('creation-mode').classList.toggle('active', mode === 'creation');
    document.getElementById('play-mode').classList.toggle('active', mode === 'play');
    
    // Update title editability
    updateTitleEditability();
    
    // Reinitialize board with new mode
    initializeBingoBoard();
}

// Update title editability based on current mode
function updateTitleEditability() {
    const boardTitle = document.getElementById('board-title');
    const titleHint = document.querySelector('.title-container small');
    
    if (currentMode === 'creation') {
        boardTitle.setAttribute('contenteditable', 'true');
        titleHint.style.display = 'inline';
    } else {
        boardTitle.removeAttribute('contenteditable');
        titleHint.style.display = 'none';
    }
}

// Switch between single and blackout bingo modes
function switchBingoMode(mode) {
    if (mode === bingoMode) return;
    
    // Apply animation to the button being activated
    const button = document.getElementById(`${mode}-bingo`);
    button.classList.add('button-activate');
    
    // Remove animation after it completes
    setTimeout(() => {
        button.classList.remove('button-activate');
    }, 500);
    
    bingoMode = mode;
    
    // Update bingo mode toggle buttons
    document.getElementById('single-bingo').classList.toggle('active', mode === 'single');
    document.getElementById('cross-bingo').classList.toggle('active', mode === 'cross');
    document.getElementById('plus-bingo').classList.toggle('active', mode === 'plus');
    document.getElementById('blackout-bingo').classList.toggle('active', mode === 'blackout');
    
    // Highlight relevant squares based on the selected mode
    highlightRelevantSquares();
}

// Highlight squares relevant to the current bingo mode
function highlightRelevantSquares() {
    // First, remove any existing highlights
    document.querySelectorAll('.bingo-square').forEach(square => {
        square.classList.remove('highlight-relevant');
    });
    
    // Only highlight in play mode
    if (currentMode !== 'play') return;
    
    // Add highlight based on the current bingo mode
    switch (bingoMode) {
        case 'cross':
            // Highlight both diagonals
            for (let i = 0; i < BOARD_SIZE; i++) {
                // Top-left to bottom-right diagonal
                const diagonal1Index = i * BOARD_SIZE + i;
                const diagonal1Square = document.querySelector(`.bingo-square[data-index="${diagonal1Index}"]`);
                if (diagonal1Square) diagonal1Square.classList.add('highlight-relevant');
                
                // Top-right to bottom-left diagonal
                const diagonal2Index = i * BOARD_SIZE + (BOARD_SIZE - 1 - i);
                const diagonal2Square = document.querySelector(`.bingo-square[data-index="${diagonal2Index}"]`);
                if (diagonal2Square) diagonal2Square.classList.add('highlight-relevant');
            }
            break;
            
        case 'plus':
            // Highlight middle row and column
            for (let i = 0; i < BOARD_SIZE; i++) {
                // Middle row
                const rowIndex = MIDDLE_ROW * BOARD_SIZE + i;
                const rowSquare = document.querySelector(`.bingo-square[data-index="${rowIndex}"]`);
                if (rowSquare) rowSquare.classList.add('highlight-relevant');
                
                // Middle column
                const colIndex = i * BOARD_SIZE + MIDDLE_COL;
                const colSquare = document.querySelector(`.bingo-square[data-index="${colIndex}"]`);
                if (colSquare) colSquare.classList.add('highlight-relevant');
            }
            break;
    }
}

// Randomize the bingo board
function randomizeBingoBoard() {
    // Create a copy of the data, excluding the middle square
    const dataToShuffle = bingoData.filter((_, index) => index !== MIDDLE_SQUARE_INDEX);
    
    // Fisher-Yates shuffle algorithm
    for (let i = dataToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dataToShuffle[i], dataToShuffle[j]] = [dataToShuffle[j], dataToShuffle[i]];
    }
    
    // Reconstruct the bingoData array with the middle square preserved
    let shuffleIndex = 0;
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        if (i !== MIDDLE_SQUARE_INDEX) {
            bingoData[i] = dataToShuffle[shuffleIndex++];
        }
    }
    
    // Reinitialize board
    initializeBingoBoard();
}

// Reset the bingo board
function resetBingoBoard() {
    // In creation mode, clear all data except the middle square
    if (currentMode === 'creation') {
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            if (i !== MIDDLE_SQUARE_INDEX) {
                bingoData[i] = {
                    text: '',
                    image: null,
                    isMarked: false
                };
            }
        }
    } 
    // In play mode, just remove all marks except the middle square
    else {
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            if (i !== MIDDLE_SQUARE_INDEX) {
                bingoData[i].isMarked = false;
            }
        }
        
        const squares = document.querySelectorAll('.bingo-square:not(.free-space)');
        squares.forEach(square => {
            square.classList.remove('marked');
        });
    }
    
    // Reinitialize board
    initializeBingoBoard();
}

// Export bingo board data to JSON
function exportToJSON() {
    // Include board title in the export
    const boardTitle = document.getElementById('board-title').textContent.trim();
    const exportData = {
        title: boardTitle,
        squares: bingoData
    };
    
    const jsonData = JSON.stringify(exportData);
    
    // Create a download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // Create a sanitized filename from the board title
    let filename = 'bingo-board';
    if (boardTitle) {
        // Sanitize the title for use in a filename
        const sanitizedTitle = boardTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        if (sanitizedTitle) {
            filename += `-${sanitizedTitle}`;
        }
    }
    
    a.download = `${filename}.json`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
}

// Import bingo board data from JSON
function importFromJSON(file) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Check if it's the new format with title
            if (importedData.title && Array.isArray(importedData.squares)) {
                // Update board title
                document.getElementById('board-title').textContent = importedData.title;
                localStorage.setItem('boardTitle', importedData.title);
                
                // Validate imported squares data
                if (importedData.squares.length === BOARD_SIZE * BOARD_SIZE) {
                    bingoData = importedData.squares;
                    
                    // Ensure middle square is always marked in play mode
                    bingoData[MIDDLE_SQUARE_INDEX].isMarked = true;
                    
                    initializeBingoBoard();
                } else {
                    alert('Invalid JSON format or board size mismatch.');
                }
            } 
            // Check if it's the old format (just an array)
            else if (Array.isArray(importedData)) {
                // Validate imported data
                if (importedData.length === BOARD_SIZE * BOARD_SIZE) {
                    bingoData = importedData;
                    
                    // Ensure middle square is always marked in play mode
                    bingoData[MIDDLE_SQUARE_INDEX].isMarked = true;
                    
                    initializeBingoBoard();
                } else {
                    alert('Invalid JSON format or board size mismatch.');
                }
            } else {
                alert('Invalid JSON format.');
            }
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Setup all event listeners
function setupEventListeners() {
    // Mode toggle buttons
    document.getElementById('creation-mode').addEventListener('click', () => {
        switchMode('creation');
    });
    
    document.getElementById('play-mode').addEventListener('click', () => {
        switchMode('play');
    });
    
    // Theme toggle button
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    
    // Randomize button
    document.getElementById('randomize-btn').addEventListener('click', randomizeBingoBoard);
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetBingoBoard);
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportToJSON);
    
    // Import button
    document.getElementById('import-json').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFromJSON(file);
        }
    });
    
    // Bingo mode buttons
    document.getElementById('single-bingo').addEventListener('click', () => {
        switchBingoMode('single');
    });
    
    document.getElementById('cross-bingo').addEventListener('click', () => {
        switchBingoMode('cross');
    });
    
    document.getElementById('plus-bingo').addEventListener('click', () => {
        switchBingoMode('plus');
    });
    
    document.getElementById('blackout-bingo').addEventListener('click', () => {
        switchBingoMode('blackout');
    });
    
    // Text modal
    document.getElementById('save-text').addEventListener('click', saveText);
    
    // Image preview modal
    document.getElementById('confirm-image').addEventListener('click', saveImage);
    
    // Win modal
    document.getElementById('continue-playing').addEventListener('click', closeModals);
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
}
