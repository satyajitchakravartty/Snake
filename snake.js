
//board
var blockSize = 25; // in the canvas, make a block having a size of 25 square unit each (not pixel)
var rows = 20; //make 20 blocks of rows (20)
var cols = 20; //make 20 blocks of cols (20)
var board; // id of canvas is board
var context; 
var fps = 10; // frames per second
var loopId;

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
var scoreEl;
var speedEl;
var modalEl;
var finalScoreEl;
var finalHighScoreEl;
var highScoreEl;
var pauseBtn;
var speedSlider;
var isPaused = false;
var isMuted = false;
var audioCtx;
var themeName = "emerald";
var themeColors = null;
var overlayEl;
// Menu & leaderboard
var menuEl;
var menuOverlayEl;
var menuCardEl;
var menuOpenBtn;
var menuCloseBtn;
var menuStartBtn;
var menuClearBtn;
var playerNameInput;
var leaderboardListEl;
var playerName = "";


window.onload = function() {  //the moment the screen is loaded, the following function is run
    board = document.getElementById("board");
    board.height = rows * blockSize;   // to avoid having to manually do 3 * 25 each time we want to refer to a row
    board.width = cols * blockSize;    // to avoid having to manually do 3 * 25 each time we want to refer to a col 
    context = board.getContext("2d");   // used for drawing on the board

    // UI elements
    scoreEl = document.getElementById("score");
    speedEl = document.getElementById("speed");
    modalEl = document.getElementById("modal");
    finalScoreEl = document.getElementById("finalScore");
	finalHighScoreEl = document.getElementById("finalHighScore");
	highScoreEl = document.getElementById("highScore");
	pauseBtn = document.getElementById("btnPause");
	speedSlider = document.getElementById("speedSlider");
	overlayEl = document.getElementById("overlay");
	// Menu elements
	menuEl = document.getElementById("menu");
	menuOverlayEl = document.getElementById("menuOverlay");
	menuCardEl = document.getElementById("menuCard");
	menuOpenBtn = document.getElementById("menuOpen");
	menuCloseBtn = document.getElementById("menuClose");
	menuStartBtn = document.getElementById("menuStart");
	menuClearBtn = document.getElementById("menuClear");
	playerNameInput = document.getElementById("playerName");
	leaderboardListEl = document.getElementById("leaderboardList");

	// Theme & mute controls
	var themeSelect = document.getElementById("themeSelect");
	try {
		var storedTheme = localStorage.getItem("snakeTheme");
		if (storedTheme) themeName = storedTheme;
		var storedMuted = localStorage.getItem("snakeMuted");
		isMuted = storedMuted ? storedMuted === "true" : false;
	} catch (e) {}
	applyTheme(themeName);
	if (themeSelect) {
		if (themeSelect.value !== themeName) themeSelect.value = themeName;
		themeSelect.addEventListener("change", function(e){
			applyTheme(e.target.value);
		});
	}
	var muteToggle = document.getElementById("muteToggle");
	if (muteToggle) {
		muteToggle.setAttribute("aria-pressed", String(isMuted));
		muteToggle.addEventListener("click", function(){
			isMuted = !isMuted;
			muteToggle.setAttribute("aria-pressed", String(isMuted));
			try { localStorage.setItem("snakeMuted", String(isMuted)); } catch (e) {}
		});
	}

	// Load player name and leaderboard
	playerName = getStoredName();
	if (playerNameInput) {
		playerNameInput.value = playerName;
		playerNameInput.addEventListener("change", function(e){
			playerName = String(e.target.value || "").trim();
			storeName(playerName);
		});
	}
	renderLeaderboard();

	placeFood();
    document.addEventListener("keyup", changeDirection); //the moment the key is released, it calls changeDirection function
	document.addEventListener("keydown", function(e){
		if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
			e.preventDefault();
		}
		if (e.code === "Space") {
			e.preventDefault();
			togglePause();
		}
		if (e.code === "Escape") {
			hideModal();
		}
	});
    // Touch controls
    var btnUp = document.getElementById("btnUp");
    var btnDown = document.getElementById("btnDown");
    var btnLeft = document.getElementById("btnLeft");
    var btnRight = document.getElementById("btnRight");
    if (btnUp) btnUp.addEventListener("click", function(){ setDirectionByCode("ArrowUp"); });
    if (btnDown) btnDown.addEventListener("click", function(){ setDirectionByCode("ArrowDown"); });
    if (btnLeft) btnLeft.addEventListener("click", function(){ setDirectionByCode("ArrowLeft"); });
    if (btnRight) btnRight.addEventListener("click", function(){ setDirectionByCode("ArrowRight"); });

    // Restart buttons
    var btnRestart = document.getElementById("btnRestart");
    var modalRestart = document.getElementById("modalRestart");
    var modalClose = document.getElementById("modalClose");
    if (btnRestart) btnRestart.addEventListener("click", resetGame);
    if (modalRestart) modalRestart.addEventListener("click", function(){ hideModal(); resetGame(); });
    if (modalClose) modalClose.addEventListener("click", hideModal);

	// Menu wiring
	if (menuOpenBtn) menuOpenBtn.addEventListener("click", function(){ isPaused = true; togglePauseLabel(); showMenu(); });
	if (menuCloseBtn) menuCloseBtn.addEventListener("click", hideMenu);
	if (menuStartBtn) menuStartBtn.addEventListener("click", function(){ hideMenu(); resetGame(); isPaused = false; togglePauseLabel(); });
	if (menuClearBtn) menuClearBtn.addEventListener("click", function(){ clearLeaderboard(); renderLeaderboard(); });

	if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
	if (speedSlider) {
		speedSlider.addEventListener("input", function(e){
			var val = parseInt(e.target.value, 10) || fps;
			setFps(val);
		});
	}

	// High score load
	updateHighScoreDisplay(getHighScore());

	// Swipe gestures on canvas
	var touchStartX = 0, touchStartY = 0;
	board.addEventListener("touchstart", function(e){
		var t = e.changedTouches[0];
		touchStartX = t.clientX; touchStartY = t.clientY;
	}, { passive: true });
	board.addEventListener("touchend", function(e){
		var t = e.changedTouches[0];
		var dx = t.clientX - touchStartX;
		var dy = t.clientY - touchStartY;
		var absX = Math.abs(dx), absY = Math.abs(dy);
		if (Math.max(absX, absY) < 24) return; // ignore tiny swipes
		if (absX > absY) {
			setDirectionByCode(dx > 0 ? "ArrowRight" : "ArrowLeft");
		} else {
			setDirectionByCode(dy > 0 ? "ArrowDown" : "ArrowUp");
		}
	}, { passive: true });

	if (speedEl) speedEl.textContent = String(fps);
	// If no name set, open menu and pause initially
	if (!playerName) {
		isPaused = true;
		showMenu();
		togglePauseLabel();
	}
	startLoop();
}

function update() {    
    if (gameOver) {
        return; // because once game over, we want to stop updating the canvas
    }
	if (isPaused) {
		// draw paused overlay
		context.save();
		context.fillStyle = "rgba(0,0,0,0.35)";
		context.fillRect(0, 0, board.width, board.height);
		context.fillStyle = "#e5e7eb";
		context.font = "600 18px Inter, system-ui, sans-serif";
		context.textAlign = "center";
		context.fillText("Paused", board.width/2, board.height/2);
		context.restore();
		return;
	}
    // background
    context.fillStyle = "#0a0a0a";
    context.fillRect(0, 0, board.width, board.height);
    drawGrid();

    // Draw food first so it's underneath the snake
    drawFood(foodX, foodY);

    if (snakeX == foodX && snakeY == foodY) { //if the position of snake is exatly on the food
        var ateX = foodX, ateY = foodY;
        snakeBody.push([foodX, foodY]);  //grows the segment of body where the food was by attaching to it
        placeFood(); //calls the placeFood function
        onEat(ateX, ateY);
    }
    for (let i = snakeBody.length - 1; i > 0; i--){
        snakeBody[i] = snakeBody[i-1]; //takes the last segment of the body (last block of tail) , and moves to the second last segment (second last block of tail)
    }
    if(snakeBody.length) { //if there are body parts in the array
        snakeBody[0] = [snakeX, snakeY] // takes body part (the one with position just before the head) and places it on the heads position
    }


    snakeX += velocityX * blockSize;
    snakeY += velocityY * blockSize;
    drawSnakeSegment(snakeX, snakeY, true);

    for (let i = 0; i < snakeBody.length; i++) {
        drawSnakeSegment(snakeBody[i][0], snakeBody[i][1], false); //foodX, foodY co-ordinates ((x,y) co-ordinates from snakeBody.push([foodX, foodY]))
    }
   
    //Game Over Conditions

    if (snakeX < 0 || snakeX >= cols*blockSize || snakeY < 0 || snakeY >= rows*blockSize) { // cond 1 : if snake goes out of bounds
        gameOver = true;
        endGame();
    }
    for (let i = 0; i < snakeBody.length; i++){
        if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
            gameOver = true;
            endGame();
        }
    }

    // Update UI
    if (scoreEl) scoreEl.textContent = String(snakeBody.length);
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


function placeFood() { //places the food in a random place that is not on the snake
	var emptyCells = [];
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			var x = c * blockSize;
			var y = r * blockSize;
			if (x === snakeX && y === snakeY) continue;
			var onBody = false;
			for (var i = 0; i < snakeBody.length; i++) {
				if (snakeBody[i][0] === x && snakeBody[i][1] === y) { onBody = true; break; }
			}
			if (!onBody) emptyCells.push([x, y]);
		}
	}
	if (emptyCells.length === 0) {
		foodX = 0; foodY = 0; // no space left
		return;
	}
	var idx = Math.floor(Math.random() * emptyCells.length);
	foodX = emptyCells[idx][0];
	foodY = emptyCells[idx][1];
}

// Helpers for UI and rendering enhancements
function setDirectionByCode(code) {
    changeDirection({ code: code });
}

function drawGrid() {
    context.save();
    context.strokeStyle = "rgba(255,255,255,0.06)";
    context.lineWidth = 1;
    for (var x = 0; x <= board.width; x += blockSize) {
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, board.height);
        context.stroke();
    }
    for (var y = 0; y <= board.height; y += blockSize) {
        context.beginPath();
        context.moveTo(0, y + 0.5);
        context.lineTo(board.width, y + 0.5);
        context.stroke();
    }
    context.restore();
}

function drawFood(x, y) {
    var cx = x + blockSize / 2;
    var cy = y + blockSize / 2;
    var grad = context.createRadialGradient(cx, cy, 2, cx, cy, blockSize / 2);
    var colors = themeColors || getThemeColors(themeName);
    grad.addColorStop(0, colors.foodInner);
    grad.addColorStop(1, colors.foodOuter);
    context.fillStyle = grad;
    drawRoundedRect(x, y, blockSize, blockSize, 6);
}

function drawSnakeSegment(x, y, isHead) {
    context.save();
    if (isHead) {
        var gx = x + blockSize / 2;
        var gy = y + blockSize / 2;
        var g = context.createRadialGradient(gx, gy, 2, gx, gy, blockSize / 2);
        var colors = themeColors || getThemeColors(themeName);
        g.addColorStop(0, colors.headInner);
        g.addColorStop(1, colors.headOuter);
        context.fillStyle = g;
    } else {
        var colors = themeColors || getThemeColors(themeName);
        context.fillStyle = colors.tail;
    }
    drawRoundedRect(x, y, blockSize, blockSize, 6);
    context.restore();
}

function drawRoundedRect(x, y, w, h, r) {
    context.beginPath();
    var radius = r || 4;
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
}

function endGame() {
	if (finalScoreEl) finalScoreEl.textContent = String(snakeBody.length);
	var hs = updateHighScore(snakeBody.length);
	updateHighScoreDisplay(hs);
	if (finalHighScoreEl) finalHighScoreEl.textContent = String(hs);
	// Auto-save to leaderboard if name exists and score > 0
	if (playerName && snakeBody.length > 0) {
		addLeaderboardEntry({ name: playerName, score: snakeBody.length, ts: Date.now() });
		renderLeaderboard();
	}
	showModal();
	playGameOver();
}

function showModal() {
	if (!modalEl) return;
	modalEl.classList.remove("hidden");
	modalEl.classList.add("flex");
	var overlay = document.getElementById("modalOverlay");
	var card = document.getElementById("modalCard");
	// animate in
	requestAnimationFrame(function(){
		if (overlay) {
			overlay.classList.remove("opacity-0");
			overlay.classList.add("opacity-100");
		}
		if (card) {
			card.classList.remove("opacity-0", "translate-y-2", "scale-95");
			card.classList.add("opacity-100", "translate-y-0", "scale-100");
		}
	});
	var closeBtn = document.getElementById("modalClose");
	if (closeBtn) closeBtn.focus();
}

function hideModal() {
    if (!modalEl) return;
    var overlay = document.getElementById("modalOverlay");
    var card = document.getElementById("modalCard");
    // animate out
    if (overlay) {
        overlay.classList.remove("opacity-100");
        overlay.classList.add("opacity-0");
    }
    if (card) {
        card.classList.remove("opacity-100", "translate-y-0", "scale-100");
        card.classList.add("opacity-0", "translate-y-2", "scale-95");
    }
    // after transition, hide container
    setTimeout(function(){
        modalEl.classList.add("hidden");
        modalEl.classList.remove("flex");
    }, 220);
}

// Menu controls
function showMenu() {
	if (!menuEl) return;
	menuEl.classList.remove("hidden");
	menuEl.classList.add("flex");
	requestAnimationFrame(function(){
		if (menuOverlayEl) {
			menuOverlayEl.classList.remove("opacity-0");
			menuOverlayEl.classList.add("opacity-100");
		}
		if (menuCardEl) {
			menuCardEl.classList.remove("opacity-0", "translate-y-2", "scale-95");
			menuCardEl.classList.add("opacity-100", "translate-y-0", "scale-100");
		}
	});
}

function hideMenu() {
	if (!menuEl) return;
	if (menuOverlayEl) {
		menuOverlayEl.classList.remove("opacity-100");
		menuOverlayEl.classList.add("opacity-0");
	}
	if (menuCardEl) {
		menuCardEl.classList.remove("opacity-100", "translate-y-0", "scale-100");
		menuCardEl.classList.add("opacity-0", "translate-y-2", "scale-95");
	}
	setTimeout(function(){
		menuEl.classList.add("hidden");
		menuEl.classList.remove("flex");
	}, 220);
}

// Leaderboard storage
function getStoredName() {
	try { return localStorage.getItem("snakePlayerName") || ""; } catch (e) { return ""; }
}
function storeName(name) {
	try { localStorage.setItem("snakePlayerName", String(name || "")); } catch (e) {}
}

function getLeaderboard() {
	try {
		var raw = localStorage.getItem("snakeLeaderboard");
		return raw ? JSON.parse(raw) : [];
	} catch (e) { return []; }
}

function setLeaderboard(list) {
	try { localStorage.setItem("snakeLeaderboard", JSON.stringify(list)); } catch (e) {}
}

function addLeaderboardEntry(entry) {
	var list = getLeaderboard();
	list.push(entry);
	// sort desc by score, then asc by ts (earlier wins tie)
	list.sort(function(a,b){ return b.score - a.score || a.ts - b.ts; });
	// cap to top 20
	if (list.length > 20) list = list.slice(0, 20);
	setLeaderboard(list);
}

function clearLeaderboard() {
	setLeaderboard([]);
}

function renderLeaderboard() {
	if (!leaderboardListEl) return;
	var list = getLeaderboard();
	leaderboardListEl.innerHTML = "";
	if (!list.length) {
		var li = document.createElement("li");
		li.className = "text-xs";
		li.textContent = "No scores yet. Play a game to set your record.";
		leaderboardListEl.appendChild(li);
		return;
	}
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var li = document.createElement("li");
		li.className = "flex items-center justify-between py-1";
		var nameSpan = document.createElement("span");
		nameSpan.className = "font-medium text-foreground";
		nameSpan.textContent = (i+1) + ". " + item.name;
		var scoreSpan = document.createElement("span");
		scoreSpan.className = "text-mutedForeground";
		scoreSpan.textContent = String(item.score);
		li.appendChild(nameSpan);
		li.appendChild(scoreSpan);
		leaderboardListEl.appendChild(li);
	}
}
function resetGame() {
    snakeX = blockSize * 5;
    snakeY = blockSize * 5;
    velocityX = 0;
    velocityY = 0;
    snakeBody = [];
    gameOver = false;
    placeFood();
    if (scoreEl) scoreEl.textContent = "0";
}

// Loop and speed helpers
function startLoop() {
	stopLoop();
	loopId = setInterval(update, 1000 / fps);
	if (speedEl) speedEl.textContent = String(fps);
	if (speedSlider && Number(speedSlider.value) !== fps) speedSlider.value = String(fps);
}

function stopLoop() {
	if (loopId) clearInterval(loopId);
	loopId = null;
}

function setFps(newFps) {
	fps = Math.max(1, Math.min(60, newFps));
	startLoop();
}

function togglePause() {
	isPaused = !isPaused;
    togglePauseLabel();
}

function togglePauseLabel() {
	if (pauseBtn) pauseBtn.textContent = isPaused ? "Resume" : "Pause";
}

// High score helpers
function getHighScore() {
	try {
		var val = localStorage.getItem("snakeHighScore");
		return val ? parseInt(val, 10) || 0 : 0;
	} catch (e) { return 0; }
}

function updateHighScore(score) {
	var current = getHighScore();
	if (score > current) {
		current = score;
		try { localStorage.setItem("snakeHighScore", String(current)); } catch (e) {}
	}
	return current;
}

function updateHighScoreDisplay(value) {
	if (highScoreEl) highScoreEl.textContent = String(value);
}

// Theme helpers
function applyTheme(name) {
	themeName = name || "emerald";
	themeColors = getThemeColors(themeName);
	try { localStorage.setItem("snakeTheme", themeName); } catch (e) {}
}

function getThemeColors(name) {
	switch (name) {
		case "indigo":
			return { headInner: "#a5b4fc", headOuter: "#4f46e5", tail: "rgba(79,70,229,0.85)", foodInner: "#c7d2fe", foodOuter: "#3730a3", score: "#6366f1" };
		case "rose":
			return { headInner: "#fda4af", headOuter: "#e11d48", tail: "rgba(225,29,72,0.85)", foodInner: "#fecdd3", foodOuter: "#9f1239", score: "#fb7185" };
		case "amber":
			return { headInner: "#fde68a", headOuter: "#f59e0b", tail: "rgba(245,158,11,0.85)", foodInner: "#fef3c7", foodOuter: "#92400e", score: "#fbbf24" };
		case "emerald":
		default:
			return { headInner: "#5ff7a9", headOuter: "#16a34a", tail: "rgba(34,197,94,0.9)", foodInner: "#bbf7d0", foodOuter: "#166534", score: "#10b981" };
	}
}

// Effects
function onEat(x, y) {
	playEat();
	showScorePop(x, y, "+1");
}

function ensureAudio() {
	if (audioCtx || isMuted) return;
	try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}

function playBeep(freq, duration, type) {
	if (isMuted) return;
	ensureAudio();
	if (!audioCtx) return;
	var osc = audioCtx.createOscillator();
	var gain = audioCtx.createGain();
	osc.type = type || "sine";
	osc.frequency.value = freq;
	gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
	osc.connect(gain);
	gain.connect(audioCtx.destination);
	osc.start();
	osc.stop(audioCtx.currentTime + duration/1000 + 0.02);
}

function playEat() {
	playBeep(520, 90, "triangle");
}

function playGameOver() {
	playBeep(220, 250, "sawtooth");
}

// Visual pop
function showScorePop(x, y, text) {
	if (!overlayEl) return;
	var span = document.createElement("span");
	span.textContent = text || "+1";
	span.style.position = "absolute";
	span.style.left = x + 6 + "px";
	span.style.top = y + 2 + "px";
	span.style.fontWeight = "700";
	span.style.color = (themeColors && themeColors.score) || "#10b981";
	span.style.opacity = "0";
	span.style.transform = "translateY(8px)";
	span.style.transition = "opacity 300ms ease, transform 300ms ease";
	overlayEl.appendChild(span);
	requestAnimationFrame(function(){
		span.style.opacity = "1";
		span.style.transform = "translateY(-8px)";
		setTimeout(function(){
			span.style.opacity = "0";
			span.style.transform = "translateY(-18px)";
			setTimeout(function(){ span.remove(); }, 250);
		}, 350);
	});
}