const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

//global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 400;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
let winningScore = 50;
let chosenDefender = 1;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];

//mouse
const mouse = {
    x:undefined,
    y:undefined,
    width: 0.1,
    height: 0.1,
    clicked: false
}

canvas.addEventListener('mousedown', function(){
    mouse.clicked = true;
});

canvas.addEventListener('mouseup', function(){
    mouse.clicked = false;
});

//get information about the size of the element relative to view port
let canvasPosition = canvas.getBoundingClientRect();
//console.log(canvasPosition);
canvas.addEventListener('mousemove', function(event){
    //the correct mouse coords are offset buy the left and top space on the page
    mouse.x = event.x - canvasPosition.left;
    mouse.y = event.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', function(){
    mouse.x = undefined;
    mouse.y = undefined;
});

//game board
const controlBar = {
    width: canvas.width,
    height: cellSize
}

class Cell{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }

    draw(){
        if(mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

function createGrid(){
    for(let y = cellSize; y < canvas.height; y += cellSize){
        for(let x = 0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x, y));
        }
    }
}
//call function to create the cell grid
createGrid();

function handleGameGrid(){
    for(let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}

//projectiles
class Projectiles{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }

    update(){
        this.x += this.speed;
    }

    draw(){
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleProjectiles(){
    for(let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();

        for(let j = 0; j < enemies.length; j++){
            if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){
                enemies[j].health -=projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        if(projectiles[i] && projectiles[i].x > canvas.width - cellSize){
            projectiles.splice(i, 1);
            i--;
        }
        //console.log('projectiles ' + projectiles.length);
    }
}

//defenders
const defender1 = new Image();
defender1.src = './tower_defense_game/sprites/defender1_flipped.png';
const defender2 = new Image();
defender2.src = './tower_defense_game/sprites/defender2_flipped.png';

class Defender{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        //attribute that will be used to properly animate sprites
        this.shootNow = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        //properties used to cycle through the sprite sheet
        this.frameX = 0;
        this.frameY = 0; //this is always 0, since we have a 1 horizontal line sprite sheet
        this.minFrame = 0;
        this.maxFrame = 15; //look at the spritesheet to determine this number(numbering starts at 0)
        //variables used to crop the sprite sheet properly (to animate enemy)
        this.spriteWidth = 194; //dimensions are from the png file (look at the chosen png dimensions)
        this.spriteHeight = 194;
        //property that will be used to draw correct selected defender
        this.chosenDefender = chosenDefender;
    }

    draw(){
        //ctx.fillStyle = 'blue';
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
        if(this.chosenDefender === 1){
            //s=source, d=destination, sw=source width, dx= coord x destination, dh=destination height 
            //ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            //sy = this.frameY * this.spriteHeight, but since we have only 1 line sprites, it is 0 (line zero)
            //dx, dy, dw, dh are going to be the enemy's properties (this.) x, y, width, height
            ctx.drawImage(defender1, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
        } else if(this.chosenDefender === 2){
            ctx.drawImage(defender2, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
        }
        
    }

    update(){
        // frame % (x-num); modifying x-num value, from 8 at the moment, will make projectiles shoot slower/faster 
        if(frame % 10 == 0){
            if(this.frameX < this.maxFrame){
                this.frameX++;
            }else{
                this.frameX = this.minFrame;
            }

            if(this.frameX === 15){
                this.shootNow = true;
            }
        }

        
            if(this.shooting){
                //enemy on lane, player shoots animation
                //look at the sprite to adjust values if needed
                this.minFrame = 0;
                this.maxFrame = 15;
            } else{
                //enemy not on lane, player doesn't shoots animation, player idle animation
                //look at the sprite to adjust values if needed
                this.minFrame = 18;
                this.maxFrame = 24;
            }

        if(this.shooting && this.shootNow){
            /* create new projectile based on a timer system, not used anymore!
            // we added && this.shootNow in the if condition to create new projectiles, synced with frame animation
            this.timer++;
            if(this.timer % 100 === 0){
                projectiles.push(new Projectiles(this.x + 70, this.y + 50));
            }*/
            projectiles.push(new Projectiles(this.x + 70, this.y + 35));
            this.shootNow = false;
        } 
        //else{
          //  this.timer = 0;
        //}
    }
}

function handleDefenders(){
    for(let i = 0; i < defenders.length; i++){
        defenders[i].draw();
        defenders[i].update();
        //this if condition is verifying that a defender has an enemy on its lane
        if(enemyPositions.indexOf(defenders[i].y) !== -1){
            defenders[i].shooting = true;
        } else{
            defenders[i].shooting = false;
        }
        for(let j = 0; j < enemies.length; j++){
            if(defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
            }
            if(defenders[i] && defenders[i].health <= 0){
                //remove defender, splice is a build in js method
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

//choose defender
const card1 = {
    x: 10,
    y: 10,
    width: 70,
    height: 85
}
const card2 = {
    x: 90,
    y: 10,
    width: 70,
    height: 85
}

function chooseDefender(){
    let card1stroke = 'black';
    let card2stroke = 'black';

    if(collision(mouse, card1) && mouse.clicked){
        chosenDefender = 1;
    } else if(collision(mouse, card2) && mouse.clicked){
        chosenDefender = 2;
    }

    if(chosenDefender === 1){
        card1stroke = 'gold';
        card2stroke = 'black';
    }else if(chosenDefender === 2){
        card1stroke = 'black';
        card2stroke = 'gold';
    }else{
        card1stroke = 'black';
        card2stroke = 'black';
    }
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';

    ctx.fillRect(card1.x, card1.y, card1.width, card1.height); //created filled rectangle
    ctx.strokeStyle = card1stroke;
    ctx.strokeRect(card1.x, card1.y, card1.width, card1.height); //created rectangle border
    ctx.drawImage(defender1, 0, 0, 194, 194, 0, 5, 194/2, 194/2);

    ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
    ctx.strokeStyle = card2stroke;
    ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
    ctx.drawImage(defender2, 0, 0, 194, 194, 80, 5, 194/2, 194/2);
}

//floating messages
const floatingMessages = [];
class floatingMessage{
    constructor(value, x, y, size, color){
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }

    update(){
        this.y -= 0.3;
        this.lifeSpan += 1;
        if(this.opacity > 0.01){
            this.opacity -= 0.01;
        }
    }

    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Orbitron';
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

function handleFloatingMessages(){
    for(let i = 0; i < floatingMessages.length; i++){
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if(floatingMessages[i].lifeSpan >= 50){
            floatingMessages.splice(i, 1);
            i--;
        }
        //if(floatingMessages[i])
            //console.log(floatingMessages[i].lifeSpan);
    }
}

//enemies
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = './tower_defense_game/sprites/enemy1.png';
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = './tower_defense_game/sprites/enemy2.png';
enemyTypes.push(enemy2);

class Enemy{
    constructor(verticalPosition){
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        //properties used to cycle through the sprite sheet
        this.frameX = 0;
        this.frameY = 0; //this is always 0, since we have a 1 horizontal line sprite sheet
        this.minFrame = 0;
        this.maxFrame = 4; //look at the spritesheet to determine this number(numbering starts at 0)
        //variables used to crop the sprite sheet properly (to animate enemy)
        if(this.enemyType === enemyTypes[0]){
            this.spriteWidth = 144; //dimensions are from the png file (look at the chosen png dimensions)
            this.spriteHeight = 144;
        } else if(this.enemyType === enemyTypes[1]){
            this.spriteWidth = 256; //dimensions are from the png file (look at the chosen png dimensions)
            this.spriteHeight = 256;
        }
    }

    update(){
        this.x -= this.movement;
        //every 10 cycles  of animation loops( every 10 frames do...) 
        if(frame % 10 === 0){
            if(this.frameX < this.maxFrame){
                this.frameX++;
            } else{
                this.frameX = this.minFrame;
            }
        }
    }

    draw(){
        //ctx.fillStyle = 'red';
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
        //s=source, d=destination, sw=source width, dx= coord x destination, dh=destination height 
        //ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        //sy = this.frameY * this.spriteHeight, but since we have only 1 line sprites, it is 0 (line zero)
        //dx, dy, dw, dh are going to be the enemy's properties (this.) x, y, width, height
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, 
            this.x, this.y, this.width, this.height);
    }
}

function handleEnemies(){
    for(let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        //check if any enemies has x coord less than 0, meaning they hit the defender
        if(enemies[i].x < 0){
            gameOver = true;
        }
        if(enemies[i].health <= 0){
            let gainedResources = enemies[i].maxHealth/10;
            floatingMessages.push(new floatingMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'red'));
            floatingMessages.push(new floatingMessage('+' + gainedResources, 470, 85, 30, 'gold'));
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
            //console.log(enemyPositions);
        }
    }
    if(frame % enemiesInterval === 0 && score < winningScore){
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        //after the 1st enemy appears, the 2nd will appear after 600 frames, next at 500 frames
        //make them appear faster, till enemiesInterval gets at 100
        if(enemiesInterval > 120){
            //console.log(enemyPositions);
            enemiesInterval -= 50;
        }
    }
}

//resources
const amounts = [20, 30, 40];
class Resource{
    constructor(){
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = Math.floor(Math.random() * 5 + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    }

    draw(){
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Orbitron';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}

function handleResources(){
    if(frame % 500 === 0 && score < winningScore){
        resources.push(new Resource());
    }

    for(let i = 0; i < resources.length; i++){
        resources[i].draw();
        if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
            numberOfResources += resources[i].amount;
            floatingMessages.push(new floatingMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'gold'));
            floatingMessages.push(new floatingMessage('+' + resources[i].amount, 470, 85, 30, 'gold'));
            resources.splice(i, 1);
            i--;
        }
    }
}

//utilities
function handleGameStatus(){
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.fillText("Score: " + score, 200, 40);
    ctx.fillText("Resources: " + numberOfResources, 200, 80);
    if(gameOver){
        ctx.fillStyle ='black';
        ctx.font = '90px Orbitron';
        ctx.fillText("Game Over!", 145, 330);
    }
    if(score >= winningScore && enemies.length === 0){
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText("Level Complete!", 200, 300);
        ctx.font = '30px Orbitron';
        ctx.fillText("Your score is " + score + ' points!', 204, 340);
    }
}

//event listener used to position defender on the board/canvas
canvas.addEventListener('click', function(){
    //the value of the closest horizontal grid position to the left
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    //the value of the closest vertical grid position to the top
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if(gridPositionY < cellSize) return;
    //before placing a new defender, check if the cell grid is free
    for(let i = 0; i < defenders.length; i++){
        if(defenders[i].x === gridPositionX && defenders[i].y === gridPositionY){
            return;
        }
    }
    let defenderCost = 100;
    if(numberOfResources >= defenderCost){
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    } else{
        floatingMessages.push(new floatingMessage(numberOfResources - defenderCost, mouse.x, mouse.y, 25, 'red'));
    }
});

function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, controlBar.width, controlBar.height);
    handleGameGrid();
    handleDefenders();
    handleResources()
    handleProjectiles();
    handleEnemies();
    chooseDefender();
    handleGameStatus();
    handleFloatingMessages();
    
    frame++;
    if(!gameOver){
        requestAnimationFrame(animate);
    }
}

animate();

function collision(first, second){
    if( !(
        first.x > second.x + second.width ||
        first.x + first.width < second.x  ||
        first.y > second.y + second.height||
        first.y + first.height < second.y)
    ){
        return true;
    }
    return false;
}

//adjust mouse coordinates, when window is resized!
window.addEventListener('resize', function(){
    canvasPosition = canvas.getBoundingClientRect();
});