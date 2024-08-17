
//board
var blockSize = 25; // in the canvas, make a block having a size of 25 square unit each (not pixel)
var rows = 20; //make 20 blocks of rows (20)
var cols = 20; //make 20 blocks of cols (20)
var board; // id of canvas is board
var context; 

//snake head
var snakeX = blockSize * 5;
var snakeY = blockSize * 5;

velocityX = 0; //snakes moving speed
velocityY = 0;

var snakeBody = []; //snake body is an array storing a bunch of segments where each segment is an x,y co-ordinate (similar to head but since multiple of them, needs storage in an array)

//food
var foodX;
var foodY;


var gameOver = false;


window.onload = function() {  //the moment the screen is loaded, the following function is run
    board = document.getElementById("board");
    board.height = rows * blockSize;   // to avoid having to manually do 3 * 25 each time we want to refer to a row
    board.width = cols * blockSize;    // to avoid having to manually do 3 * 25 each time we want to refer to a col 
    context = board.getContext("2d");   // used for drawing on the board

    placeFood();
    document.addEventListener("keyup", changeDirection); //the moment the key is released, it calls changeDirection function
    //update();   // updates context by running the update function, but since it runs once on when screen is loaded, we use setInterval func
    setInterval(update, 1000/10); // runs the update function every 1000 ms/100 ms = 100 milliseconds (refreshes the screen every 100ms)
}

function update() {    
    if (gameOver) {
        return; // because once game over, we want to stop updating the canvas
    }
    context.fillStyle ="black";
    context.fillRect(0, 0, board.width, board.height); //filling width and height of 500 (20 * 25)

    context.fillStyle="red"; //Draws food first so its underneath the snake
    context.fillRect(foodX, foodY, blockSize, blockSize);

    if (snakeX == foodX && snakeY == foodY) { //if the position of snake is exatly on the food
        snakeBody.push([foodX, foodY]);  //grows the segment of body where the food was by attaching to it
        placeFood(); //calls the placeFood function
    }
    for (let i = snakeBody.length - 1; i > 0; i--){
        snakeBody[i] = snakeBody[i-1]; //takes the last segment of the body (last block of tail) , and moves to the second last segment (second last block of tail)
    }
    if(snakeBody.length) { //if there are body parts in the array
        snakeBody[0] = [snakeX, snakeY] // takes body part (the one with position just before the head) and places it on the heads position
    }


    context.fillStyle ="lime"; //Draws snake second so its above the food
    snakeX += velocityX * blockSize;
    snakeY += velocityY * blockSize;
    context.fillRect(snakeX, snakeY, blockSize, blockSize);

    for (let i = 0; i < snakeBody.length; i++) {
        context.fillRect(snakeBody[i][0], snakeBody[i][1], blockSize, blockSize); //foodX, foodY co-ordinates ((x,y) co-ordinates from snakeBody.push([foodX, foodY]))
    }
   
    //Game Over Conditions

    if (snakeX < 0 || snakeX > cols*blockSize || snakeY < 0 || snakeY > rows*blockSize) { // cond 1 : if snake goes out of bounds
        gameOver = true;
        alert ("Game Over");
    }
    for (let i = 0; i < snakeBody.length; i++){
        if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            gameOver = true;
            alert("Game Over");
        }
    }
}


function changeDirection(e) { // the moment key is released, this function is triggered and searches for the key pressed to move in that direction
    if (e.code == "ArrowUp" && velocityY != 1){ // velocityY != 1 means at any point if the snake is going down, it cant turn back up (cant head in the opposite direction to the one youre heading townrds currently)
        velocityX = 0;
        velocityY = -1; 
    }
    
    else if (e.code == "ArrowDown" && velocityY != -1){ // velocityY != 1 means at any point if the snake is going up, it cant turn back down
        velocityX = 0;
        velocityY = 1;
    }
    else if (e.code == "ArrowLeft" && velocityX != 1){ // velocityY != 1 means at any point if the snake is going left, it cant turn back right
        velocityX = -1;
        velocityY = 0;
    }
    else if (e.code == "ArrowRight" && velocityX != -1  ){ // velocityY != 1 means at any point if the snake is going right, it cant turn back left
        velocityX = 1;
        velocityY = 0;
    }
}


function placeFood() { //places the food in a random place based on the below description
    foodX = Math.floor(Math.random() * cols) * blockSize; //math.floor is used to round up the decimals, math.random is used to 
    foodY = Math.floor(Math.random() * rows) * blockSize; //generate a random number bw 0 - 0.999 and multiply that by block size
}