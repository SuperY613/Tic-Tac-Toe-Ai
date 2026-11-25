(() => {
  'use strict';

  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  const boardElement = document.querySelector('#board');
  const cells = [...document.querySelectorAll('.cell')];
  const statusElement = document.querySelector('#game-status');
  const indicatorElement = document.querySelector('#turn-indicator');
  const difficultySelect = document.querySelector('#difficulty');
  const cpuOptions = document.querySelector('#cpu-options');
  const scores = { X: 0, O: 0, draws: 0 };
  let board = Array(9).fill(null);
  let mode = 'cpu';
  let difficulty = 'medium';
  let humanMark = 'X';
  let currentPlayer = 'X';
  let gameOver = false;
  let cpuTimer = null;

  const otherMark = mark => mark === 'X' ? 'O' : 'X';
  const isCpuTurn = () => mode === 'cpu' && currentPlayer !== humanMark;

  function winningLine(position, mark) {
    return WIN_LINES.find(line => line.includes(position) && line.every(index => board[index] === mark));
  }

  function render() {
    cells.forEach((cell, index) => {
      const mark = board[index];
      cell.textContent = mark || '';
      cell.classList.toggle('mark-x', mark === 'X');
      cell.classList.toggle('mark-o', mark === 'O');
      cell.classList.remove('win-cell');
      cell.disabled = Boolean(mark) || gameOver || isCpuTurn();
      const row = Math.floor(index / 3) + 1;
      const column = index % 3 + 1;
      cell.setAttribute('aria-label', `Row ${row}, column ${column}, ${mark ? mark : 'empty'}`);
    });
    indicatorElement.textContent = currentPlayer;
    indicatorElement.classList.toggle('is-o', currentPlayer === 'O');
    document.querySelector('#score-x').textContent = scores.X;
    document.querySelector('#score-o').textContent = scores.O;
    document.querySelector('#draw-score').textContent = scores.draws;
    document.querySelector('#score-x-label').textContent = mode === 'cpu' ? (humanMark === 'X' ? 'YOU' : 'CPU') : 'PLAYER 1';
    document.querySelector('#score-o-label').textContent = mode === 'cpu' ? (humanMark === 'O' ? 'YOU' : 'CPU') : 'PLAYER 2';
    document.querySelector('#score-x-card').classList.toggle('active-score', !gameOver && currentPlayer === 'X');
    document.querySelector('#score-o-card').classList.toggle('active-score', !gameOver && currentPlayer === 'O');
    if (!gameOver) {
      statusElement.textContent = isCpuTurn() ? 'CPU is thinking…' : `${mode === 'cpu' ? 'Your' : `${currentPlayer === 'X' ? 'Player 1' : 'Player 2'}’s`} turn — make a move!`;
    }
  }

  function endRound(mark, line) {
    gameOver = true;
    if (mark) {
      scores[mark] += 1;
      line.forEach(index => cells[index].classList.add('win-cell'));
      const winner = mode === 'cpu' ? (mark === humanMark ? 'You win!' : 'CPU wins!') : `${mark === 'X' ? 'Player 1' : 'Player 2'} wins!`;
      statusElement.textContent = `${winner} Nice move.`;
    } else {
      scores.draws += 1;
      statusElement.textContent = 'It’s a draw! Great game.';
    }
    render();
    // render updates the turn prompt only while a round is active.
  }

  function play(position) {
    if (gameOver || board[position] || isCpuTurn()) return;
    board[position] = currentPlayer;
    const line = winningLine(position, currentPlayer);
    if (line) {
      endRound(currentPlayer, line);
      return;
    }
    if (board.every(Boolean)) {
      endRound(null, []);
      return;
    }
    currentPlayer = otherMark(currentPlayer);
    render();
    if (isCpuTurn()) scheduleCpuMove();
  }

  function scheduleCpuMove() {
    clearTimeout(cpuTimer);
    render();
    cpuTimer = setTimeout(() => {
      if (gameOver || !isCpuTurn()) return;
      const move = chooseCpuMove();
      if (move !== -1) play(move);
    }, 420);
  }

  function chooseCpuMove() {
    const cpuMark = otherMark(humanMark);
    const empty = board.map((mark, index) => mark ? -1 : index).filter(index => index !== -1);
    if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
    if (difficulty === 'medium') {
      const winningMove = findImmediateMove(cpuMark);
      if (winningMove !== -1) return winningMove;
      const blockingMove = findImmediateMove(humanMark);
      if (blockingMove !== -1) return blockingMove;
      if (board[4] === null) return 4;
      return empty[Math.floor(Math.random() * empty.length)];
    }
    let bestScore = -Infinity;
    let bestMoves = [];
    for (const index of empty) {
      board[index] = cpuMark;
      const score = minimax(board, 0, false, cpuMark, humanMark);
      board[index] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [index];
      } else if (score === bestScore) {
        bestMoves.push(index);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function findImmediateMove(mark) {
    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== null) continue;
      board[index] = mark;
      const wins = WIN_LINES.some(line => line.every(cell => board[cell] === mark));
      board[index] = null;
      if (wins) return index;
    }
    return -1;
  }

  function minimax(state, depth, maximizing, cpuMark, playerMark) {
    if (hasWinner(state, cpuMark)) return 10 - depth;
    if (hasWinner(state, playerMark)) return depth - 10;
    if (state.every(Boolean)) return 0;
    let best = maximizing ? -Infinity : Infinity;
    for (let index = 0; index < state.length; index += 1) {
      if (state[index] !== null) continue;
      state[index] = maximizing ? cpuMark : playerMark;
      const score = minimax(state, depth + 1, !maximizing, cpuMark, playerMark);
      state[index] = null;
      best = maximizing ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function hasWinner(state, mark) {
    return WIN_LINES.some(line => line.every(index => state[index] === mark));
  }

  function resetRound() {
    clearTimeout(cpuTimer);
    board = Array(9).fill(null);
    gameOver = false;
    currentPlayer = 'X';
    render();
    if (isCpuTurn()) scheduleCpuMove();
  }

  document.querySelectorAll('.mode-button').forEach(button => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode;
      document.querySelectorAll('.mode-button').forEach(option => {
        const active = option === button;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', String(active));
      });
      cpuOptions.hidden = mode !== 'cpu';
      document.querySelector('.panel-tip p').textContent = mode === 'cpu' ? 'Can you outsmart the machine?' : 'Pass the screen and play together.';
      resetRound();
    });
  });

  document.querySelectorAll('.mark-button').forEach(button => {
    button.addEventListener('click', () => {
      humanMark = button.dataset.mark;
      document.querySelectorAll('.mark-button').forEach(option => {
        const selected = option === button;
        option.classList.toggle('selected', selected);
        option.setAttribute('aria-pressed', String(selected));
      });
      resetRound();
    });
  });

  difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
    resetRound();
  });
  cells.forEach(cell => cell.addEventListener('click', () => play(Number(cell.dataset.index))));
  document.querySelector('#new-round').addEventListener('click', resetRound);
  document.querySelector('#reset-score').addEventListener('click', () => {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;
    resetRound();
  });

  render();
})();
