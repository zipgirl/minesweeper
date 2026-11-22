(() => {
  "use strict";

  const LEVELS = {
    easy: { size: 15, mines: 22, label: "15 × 15" },
    medium: { size: 20, mines: 50, label: "20 × 20" },
    hard: { size: 25, mines: 94, label: "25 × 25" }
  };
  const $ = (selector) => document.querySelector(selector);
  const boardElement = $("#board");
  const difficultyElement = $("#difficulty");
  const counterElement = $("#mine-count");
  const timerElement = $("#timer");
  const messageElement = $("#game-message");
  const flagModeButton = $("#flag-mode");
  const restartButton = $("#restart");
  const nameElement = $("#player-name");
  const celebrationCanvas = $("#celebration");
  const celebrationContext = celebrationCanvas.getContext("2d");

  let size = 15;
  let mineTotal = 22;
  let cells = [];
  let flags = 0;
  let revealed = 0;
  let startedAt = 0;
  let elapsed = 0;
  let timerInterval = null;
  let gameState = "ready";
  let flagMode = false;
  let animationFrame = 0;
  let particles = [];

  const indexOf = (row, col) => row * size + col;
  const inBounds = (row, col) => row >= 0 && col >= 0 && row < size && col < size;
  const neighbors = (row, col) => {
    const result = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if ((r !== row || c !== col) && inBounds(r, c)) result.push(indexOf(r, c));
      }
    }
    return result;
  };

  function setMessage(text, type = "") {
    messageElement.textContent = text;
    messageElement.className = "game-message" + (type ? " " + type : "");
  }

  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
      String(seconds % 60).padStart(2, "0");
  }

  function updateTimer() {
    const current = gameState === "playing" ? Date.now() - startedAt + elapsed : elapsed;
    timerElement.textContent = formatTime(current);
  }

  function startTimer() {
    if (timerInterval !== null) return;
    startedAt = Date.now();
    timerInterval = window.setInterval(updateTimer, 250);
  }

  function stopTimer() {
    if (timerInterval !== null) {
      elapsed += Date.now() - startedAt;
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateTimer();
  }

  function placeMines(safeIndex) {
    const protectedCells = new Set([safeIndex, ...neighbors(Math.floor(safeIndex / size), safeIndex % size)]);
    const available = cells.map((_, index) => index).filter(index => !protectedCells.has(index));
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    for (let i = 0; i < mineTotal; i++) cells[available[i]].mine = true;
    cells.forEach((cell, index) => {
      if (!cell.mine) {
        const row = Math.floor(index / size);
        const col = index % size;
        cell.value = neighbors(row, col).filter(neighbor => cells[neighbor].mine).length;
      }
    });
  }

  function renderBoard() {
    boardElement.replaceChildren();
    boardElement.style.setProperty("--size", size);
    const fragment = document.createDocumentFragment();
    cells.forEach((cell, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.index = String(index);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", "Fila " + (Math.floor(index / size) + 1) + ", columna " + (index % size + 1) + ", sin descubrir");
      fragment.append(button);
    });
    boardElement.append(fragment);
    updateBoard();
  }

  function updateBoard() {
    cells.forEach((cell, index) => {
      const button = boardElement.children[index];
      if (!button) return;
      button.className = "cell";
      button.textContent = "";
      button.removeAttribute("data-value");
      button.disabled = gameState === "won" || gameState === "lost";
      if (cell.revealed) {
        button.classList.add("revealed");
        if (cell.mine) {
          button.classList.add("mine");
          if (cell.exploded) button.classList.add("exploded");
          button.textContent = "✹";
          button.setAttribute("aria-label", "Mina");
        } else if (cell.value > 0) {
          button.dataset.value = String(cell.value);
          button.textContent = String(cell.value);
          button.setAttribute("aria-label", String(cell.value) + " minas alrededor");
        } else {
          button.setAttribute("aria-label", "Casilla vacía");
        }
      } else if (cell.flagged) {
        button.classList.add("flagged");
        button.textContent = "⚑";
        button.setAttribute("aria-label", "Bandera colocada");
      } else {
        button.setAttribute("aria-label", "Fila " + (Math.floor(index / size) + 1) + ", columna " + (index % size + 1) + ", sin descubrir");
      }
      if (gameState === "lost" && cell.flagged && !cell.mine) {
        button.classList.add("wrong-flag");
        button.textContent = "×";
      }
    });
    counterElement.textContent = String(mineTotal - flags).padStart(3, "0");
  }

  function revealArea(startIndex) {
    const queue = [startIndex];
    const visited = new Set(queue);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor];
      const cell = cells[index];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      revealed++;
      if (cell.value === 0) {
        const row = Math.floor(index / size);
        const col = index % size;
        neighbors(row, col).forEach(next => {
          if (!visited.has(next) && !cells[next].flagged && !cells[next].revealed) {
            visited.add(next);
            queue.push(next);
          }
        });
      }
    }
  }

  function reveal(index) {
    if (gameState === "won" || gameState === "lost" || cells[index].flagged || cells[index].revealed) return;
    if (gameState === "ready") {
      placeMines(index);
      gameState = "playing";
      startTimer();
      setMessage("Bien. Ahora seguí las pistas de los números.");
    }
    const cell = cells[index];
    if (cell.mine) {
      cell.revealed = true;
      cell.exploded = true;
      cells.forEach(item => { if (item.mine) item.revealed = true; });
      gameState = "lost";
      stopTimer();
      const player = nameElement.value.trim();
      setMessage((player ? player + ", " : "") + "esta vez ganó el azar. ¿Una revancha?", "error");
      updateBoard();
      return;
    }
    revealArea(index);
    if (revealed === size * size - mineTotal) {
      gameState = "won";
      stopTimer();
      setMessage("¡Lo lograste" + (nameElement.value.trim() ? ", " + nameElement.value.trim() : "") + "! Tablero despejado. ♡", "success");
      celebrate();
    }
    updateBoard();
  }

  function toggleFlag(index) {
    if (gameState === "won" || gameState === "lost" || cells[index].revealed) return;
    const cell = cells[index];
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    if (gameState === "ready") setMessage("Bandera marcada. La primera casilla descubierta será segura.");
    updateBoard();
  }

  function resetGame() {
    const level = LEVELS[difficultyElement.value] || LEVELS.easy;
    size = level.size;
    mineTotal = level.mines;
    cells = Array.from({ length: size * size }, () => ({ mine: false, value: 0, revealed: false, flagged: false, exploded: false }));
    flags = 0;
    revealed = 0;
    elapsed = 0;
    startedAt = 0;
    gameState = "ready";
    flagMode = false;
    clearInterval(timerInterval);
    timerInterval = null;
    flagModeButton.setAttribute("aria-pressed", "false");
    flagModeButton.innerHTML = '<span aria-hidden="true">⚑</span> Modo bandera <kbd>F</kbd>';
    $("#board-caption").textContent = "TABLERO · " + level.label;
    setMessage("Elegí una casilla para empezar. Tu primera jugada siempre es segura.");
    stopCelebration();
    updateTimer();
    renderBoard();
  }

  function handleBoardAction(event) {
    const button = event.target.closest(".cell");
    if (!button || !boardElement.contains(button)) return;
    const index = Number(button.dataset.index);
    if (event.type === "contextmenu") event.preventDefault();
    if (event.type === "contextmenu" || flagMode) toggleFlag(index);
    else reveal(index);
  }

  function toggleFlagMode() {
    flagMode = !flagMode;
    flagModeButton.setAttribute("aria-pressed", String(flagMode));
    flagModeButton.innerHTML = flagMode
      ? '<span aria-hidden="true">⚑</span> Modo bandera activo <kbd>F</kbd>'
      : '<span aria-hidden="true">⚑</span> Modo bandera <kbd>F</kbd>';
    setMessage(flagMode ? "Modo bandera activo: tocá una casilla para marcarla." : "Modo descubrimiento activo.");
  }

  function stopCelebration() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    particles = [];
    celebrationContext.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
  }

  function celebrate() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    celebrationCanvas.width = Math.floor(window.innerWidth * dpr);
    celebrationCanvas.height = Math.floor(window.innerHeight * dpr);
    celebrationContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ["#d79aae", "#f0d8df", "#9b536e", "#e8c6a9"];
    particles = Array.from({ length: 110 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * window.innerHeight,
      size: 3 + Math.random() * 5,
      speed: 1.5 + Math.random() * 3,
      drift: (Math.random() - .5) * 1.4,
      rotation: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    const draw = () => {
      celebrationContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(particle => {
        particle.y += particle.speed;
        particle.x += particle.drift;
        particle.rotation += .025;
        celebrationContext.save();
        celebrationContext.translate(particle.x, particle.y);
        celebrationContext.rotate(particle.rotation);
        celebrationContext.fillStyle = particle.color;
        celebrationContext.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.6);
        celebrationContext.restore();
      });
      particles = particles.filter(particle => particle.y < window.innerHeight + 20);
      if (particles.length) animationFrame = requestAnimationFrame(draw);
      else stopCelebration();
    };
    animationFrame = requestAnimationFrame(draw);
  }

  boardElement.addEventListener("click", handleBoardAction);
  boardElement.addEventListener("contextmenu", handleBoardAction);
  difficultyElement.addEventListener("change", resetGame);
  restartButton.addEventListener("click", resetGame);
  flagModeButton.addEventListener("click", toggleFlagMode);
  document.addEventListener("keydown", event => {
    if (event.key.toLowerCase() === "f" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      toggleFlagMode();
    }
  });

  resetGame();
})();