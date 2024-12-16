//pole
let tileSize = 32;
let rows = 16;
let columns = 16;

let board;
let boardWidth = tileSize * columns; // 32 * 16
let boardHeight = tileSize * rows; // 32 * 16
let context;

//raketa
let shipWidth = tileSize*2;
let shipHeight = tileSize;
let shipX = tileSize * columns/2 - tileSize;
let shipY = tileSize * rows - tileSize*2;

let ship = {
    x : shipX,
    y : shipY,
    width : shipWidth,
    height : shipHeight
}

let shipImg;
let shipVelocityX = tileSize; //rychlost lodi

//mimozemšťani
let alienArray = [];
let alienWidth = tileSize*2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0; //počet mimozemšťanů
let alienVelocityX = 1; //rychlost pohybu mimozemšťanů

//střely
let bulletArray = [];
let bulletVelocityY = -10; //rychlost pohybu kulek

let score = 0;
let gameOver = false;

// Funkce pro získání highscore z Local Storage
function loadHighScores() {
    const storedHighScores = localStorage.getItem('highScores');
    if (storedHighScores) {
        return JSON.parse(storedHighScores);
    }
    return [];
}

// Funkce pro uložení nové highscore do Local Storage
function saveHighScore(name, score) {
    let highScores = loadHighScores();
    highScores.push({ name, score });
    // Seřadit podle skóre (od nejvyššího)
    highScores.sort((a, b) => b.score - a.score);
    // Udržet pouze 5 nejlepších skóre
    highScores = highScores.slice(0, 5);
    // Uložit do Local Storage
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Funkce pro zobrazení seznamu nejlepších skóre v alertu
function showHighScores() {
    let highScores = loadHighScores();
    let highScoreText = "Top 5 High Scores:\n";
    highScores.forEach((score, index) => {
        highScoreText += `${index + 1}. ${score.name} - ${score.score}\n`;
    });
    alert(highScoreText);
}

window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    //load images
    shipImg = new Image();
    shipImg.src = "./ship.png";
    shipImg.onload = function() {
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }

    alienImg = new Image();
    alienImg.src = "./alien.png";
    createAliens();

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", shoot);
}

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    //loď
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    //mimozemšťan
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            //když se mimozemšťan dotkne hranice pole
            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                alienVelocityX *= -1;
                alien.x += alienVelocityX*2;

                //pohyb všech mimozemšťanů v řadě
                for (let j = 0; j < alienArray.length; j++) {
                    alienArray[j].y += alienHeight;
                }
            }
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                gameOver = true;
            }
        }
    }

    //střely
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle="white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        //kolie střel a mimozemšťanů
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
                score += 100;
            }
        }
    }

    //vyčištění střel
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift(); //odstraní první eleent z pole
    }

    //další level
    if (alienCount == 0) {
        //zvýší počet mimozemšťanů v poli o 1
        score += alienColumns * alienRows * 100; //bonusový bod :)
        alienColumns = Math.min(alienColumns + 1, columns/2 -2); //limitováno na 16/2 -2 = 6
        alienRows = Math.min(alienRows + 1, rows-4);  //limitováno na 16-4 = 12
        if (alienVelocityX > 0) {
            alienVelocityX += 0.2; //zrychlení hybnosti mimozemšťanů vpravo
        }
        else {
            alienVelocityX -= 0.2; //zrychlení hybnosti mimozemšťanů vlevo
        }
        alienArray = [];
        bulletArray = [];
        createAliens();
    }

    //score
    context.fillStyle="white";
    context.font="16px courier";
    context.fillText(score, 5, 20);
}

// Funkce pro ukončení hry
function endGame() {
    // Vyzvání hráče k zadání jména a uložení skóre
    let playerName = prompt("KONEC HRY! Zadejte vaše jméno:");

    if (playerName) {
        // Uložení skóre do localStorage
        saveHighScore(playerName, score);
        // Zobrazení highscore
        showHighScores();
    }

    // Zeptat se hráče, jestli chce hrát znovu
    let playAgain = confirm("Chcete hrát znovu?");
    if (playAgain) {
        restartGame(); // Restartujeme hru
    } else {
        gameOver = true; // Konec hry
    }
}

function restartGame() {
    // Obnovit herní stav
    score = 0;
    gameOver = false;
    alienCount = 0;
    alienArray = [];
    bulletArray = [];
    ship.x = shipX; // Původní pozice lodi
    createAliens();
    requestAnimationFrame(update);
}

function moveShip(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "ArrowLeft" && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX; //pohyb lodi vlevo
    }
    else if (e.code == "ArrowRight" && ship.x + shipVelocityX + ship.width <= board.width) {
        ship.x += shipVelocityX; //pohyb lodi vpravo
    }
}

function createAliens() {
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                img : alienImg,
                x : alienX + c*alienWidth,
                y : alienY + r*alienHeight,
                width : alienWidth,
                height : alienHeight,
                alive : true
            }
            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "Space") {
        //střelba
        let bullet = {
            x : ship.x + shipWidth*15/32,
            y : ship.y,
            width : tileSize/8,
            height : tileSize/2,
            used : false
        }
        bulletArray.push(bullet);
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   
           a.x + a.width > b.x &&   
           a.y < b.y + b.height &&  
           a.y + a.height > b.y;    
}
