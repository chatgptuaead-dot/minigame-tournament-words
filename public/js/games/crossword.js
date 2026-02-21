/* ===== MINI CROSSWORD GAME =====
   5x5 crossword — click a clue, type the answer, score = correct words
*/
class CrosswordGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.socket = config.socket;
    this.matchId = config.matchId;
    this.isPlayer1 = config.isPlayer1;
    this.onComplete = config.onComplete;
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    const gd = config.gameData || {};
    this.puzzle = gd.puzzle || CrosswordGame._fallback();
    this.W = 800; this.H = 500;
    this.running = false;
    this.raf = null;
    this.done = false;
    this.timeLeft = 120;
    this.timerId = null;
    this.animT = 0;
    // State per cell: '' = blank, 'X' = blocked, char = user-entered
    this.userGrid = this.puzzle.grid.map(row => row.map(c => c === '_' ? '' : c === '_' ? '_' : ''));
    // Revealed answers
    this.solvedClues = new Set();
    this.selectedClue = null; // { direction, idx }
    this._onKey = this._onKey.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  static _fallback() {
    return {
      grid: [
        ['C','A','T','_','_'],
        ['_','_','R','_','_'],
        ['_','_','E','A','R'],
        ['_','_','E','_','_'],
        ['_','_','S','_','_'],
      ],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, len: 3, clue: 'Feline (3)', answer: 'CAT' },
          { num: 3, row: 2, col: 2, len: 3, clue: 'Listen with this (3)', answer: 'EAR' },
        ],
        down: [
          { num: 2, row: 0, col: 2, len: 5, clue: 'Plural deciduous (5)', answer: 'TREES' },
        ]
      }
    };
  }

  start() {
    this.running = true;
    window.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('click', this._onClick);
    this._buildMobileControls();
    this.timerId = setInterval(() => {
      if (!this.running) { clearInterval(this.timerId); return; }
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerId);
        this._finish();
      }
    }, 1000);
    this.raf = requestAnimationFrame(() => this.loop());
  }

  cleanup() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.timerId) clearInterval(this.timerId);
    window.removeEventListener('keydown', this._onKey);
    this.canvas.removeEventListener('click', this._onClick);
    const mc = document.getElementById('mobile-controls');
    if (mc) { mc.innerHTML = ''; mc.className = 'mobile-controls'; }
  }

  _buildMobileControls() {
    const mc = document.getElementById('mobile-controls');
    if (!mc) return;
    mc.className = 'mobile-controls active';
    mc.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;pointer-events:all;position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);';
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    mc.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:11px;margin-bottom:4px">Click a clue then type the answer · ENTER to confirm</div>';
    rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = 'display:flex;gap:3px;';
      if (ri === 2) {
        const enter = document.createElement('button');
        enter.textContent = '↵';
        enter.style.cssText = 'padding:5px 8px;background:rgba(0,212,255,0.3);border:1px solid #00d4ff;color:#fff;border-radius:4px;font-size:12px;cursor:pointer;';
        enter.addEventListener('click', () => this._submitClue());
        rowEl.appendChild(enter);
      }
      row.split('').forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch;
        btn.style.cssText = 'width:24px;height:30px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;font-size:11px;font-weight:bold;cursor:pointer;';
        btn.addEventListener('click', () => this._typeClue(ch));
        rowEl.appendChild(btn);
      });
      if (ri === 2) {
        const del = document.createElement('button');
        del.textContent = '⌫';
        del.style.cssText = 'padding:5px 8px;background:rgba(255,100,100,0.3);border:1px solid #ff4444;color:#fff;border-radius:4px;font-size:12px;cursor:pointer;';
        del.addEventListener('click', () => this._deleteClue());
        rowEl.appendChild(del);
      }
      mc.appendChild(rowEl);
    });
    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.placeholder = 'Select a clue then type...';
    this.inputEl.style.cssText = 'display:none;';
    mc.appendChild(this.inputEl);
  }

  _onKey(e) {
    if (this.done) return;
    if (e.key === 'Enter') this._submitClue();
    else if (e.key === 'Backspace') this._deleteClue();
    else if (/^[a-zA-Z]$/.test(e.key) && this.selectedClue) this._typeClue(e.key.toUpperCase());
  }

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.W / rect.width;
    const scaleY = this.H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Check clue list clicks
    const allClues = [
      ...(this.puzzle.clues.across || []).map(c => ({ ...c, dir: 'across' })),
      ...(this.puzzle.clues.down || []).map(c => ({ ...c, dir: 'down' }))
    ];
    allClues.forEach((clue, i) => {
      const ly = this._clueY(i);
      if (mx >= this._clueListX() && mx <= this._clueListX() + 260 && my >= ly - 16 && my <= ly + 4) {
        if (!this.solvedClues.has(this._clueKey(clue))) {
          this.selectedClue = { dir: clue.dir, idx: i, clue, input: '' };
        }
      }
    });
  }

  _clueListX() { return 440; }
  _clueY(i) { return 100 + i * 26; }
  _clueKey(c) { return `${c.dir}-${c.num}`; }

  _typeClue(ch) {
    if (!this.selectedClue) return;
    if (this.selectedClue.input.length < this.selectedClue.clue.len) {
      this.selectedClue.input += ch;
    }
  }

  _deleteClue() {
    if (!this.selectedClue) return;
    this.selectedClue.input = this.selectedClue.input.slice(0, -1);
  }

  _submitClue() {
    if (!this.selectedClue) return;
    const { clue, input } = this.selectedClue;
    if (input.toUpperCase() === clue.answer.toUpperCase()) {
      this.solvedClues.add(this._clueKey(clue));
      // Fill grid
      const dir = this.selectedClue.dir;
      input.toUpperCase().split('').forEach((ch, i) => {
        const r = clue.row + (dir === 'down' ? i : 0);
        const c = clue.col + (dir === 'across' ? i : 0);
        if (this.userGrid[r]) this.userGrid[r][c] = ch;
      });
      this.selectedClue = null;
      const totalClues = (this.puzzle.clues.across || []).length + (this.puzzle.clues.down || []).length;
      this.onScoreUpdate(this.solvedClues.size, totalClues);
      if (this.solvedClues.size >= totalClues) this._finish();
    } else {
      this.selectedClue.input = '';
    }
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    const totalClues = (this.puzzle.clues.across || []).length + (this.puzzle.clues.down || []).length;
    const score = this.solvedClues.size;
    this.onScoreUpdate(score, totalClues);
    if (this.onComplete) this.onComplete(score);
  }

  loop() {
    if (!this.running) return;
    this.animT++;
    this.render();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a1a0e');
    bg.addColorStop(1, '#0e0a1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 56);

    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('MINI CROSSWORD', 16, 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    const totalClues = (this.puzzle.clues.across || []).length + (this.puzzle.clues.down || []).length;
    ctx.fillText(`${this.solvedClues.size}/${totalClues} solved`, W - 16, 26);

    const tc = this.timeLeft <= 20 ? '#ff4444' : '#00ff88';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.fillStyle = tc;
    ctx.fillText(`${this.timeLeft}s`, W / 2, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 52, W, 4);
    ctx.fillStyle = tc;
    ctx.fillRect(0, 52, W * (this.timeLeft / 120), 4);

    // Grid
    const gridSize = 5, cellS = 52, gridX = 30, gridY = 78;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const gx = gridX + c * cellS, gy = gridY + r * cellS;
        const original = this.puzzle.grid[r]?.[c];
        const isBlocked = original === '_';

        if (isBlocked) {
          ctx.fillStyle = '#111';
          ctx.fillRect(gx, gy, cellS - 2, cellS - 2);
          continue;
        }

        const userCh = this.userGrid[r]?.[c] || '';
        const isSolved = userCh !== '';
        ctx.fillStyle = isSolved ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.07)';
        ctx.strokeStyle = isSolved ? '#00ff88' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(gx, gy, cellS - 2, cellS - 2);
        ctx.fill(); ctx.stroke();

        if (userCh) {
          ctx.fillStyle = '#00ff88';
          ctx.font = `bold ${cellS * 0.5}px Orbitron, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(userCh, gx + (cellS - 2) / 2, gy + (cellS - 2) / 2);
          ctx.textBaseline = 'alphabetic';
        }
      }
    }

    // Clue numbers on grid
    const allClues = [
      ...(this.puzzle.clues.across || []).map(c => ({ ...c, dir: 'across' })),
      ...(this.puzzle.clues.down || []).map(c => ({ ...c, dir: 'down' }))
    ];
    const numMap = {};
    allClues.forEach(cl => {
      const key = `${cl.row},${cl.col}`;
      if (!numMap[key]) numMap[key] = cl.num;
    });
    Object.entries(numMap).forEach(([key, num]) => {
      const [r, c] = key.split(',').map(Number);
      const gx = gridX + c * cellS, gy = gridY + r * cellS;
      ctx.font = '9px Exo 2, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(num, gx + 3, gy + 11);
    });

    // Clue list
    const clueListX = this._clueListX();
    ctx.font = 'bold 11px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'left';
    ctx.fillText('ACROSS', clueListX, 84);
    ctx.fillText('DOWN', clueListX + 140, 84);

    let clueIdx = 0;
    const renderClues = (clues, xOff) => {
      (clues || []).forEach(cl => {
        const key = this._clueKey({ dir: xOff > 0 ? 'down' : 'across', num: cl.num });
        const solved = this.solvedClues.has(key);
        const selected = this.selectedClue?.clue?.num === cl.num;
        const ly = this._clueY(clueIdx);
        ctx.font = (selected ? 'bold ' : '') + '11px Exo 2, sans-serif';
        ctx.fillStyle = solved ? '#00ff88' : selected ? '#ffd700' : 'rgba(255,255,255,0.7)';
        ctx.fillText(`${cl.num}. ${cl.clue}${solved ? ' ✓' : ''}`, clueListX + xOff, ly);
        clueIdx++;
      });
    };
    clueIdx = 0;
    renderClues(this.puzzle.clues.across, 0);
    const acrossLen = (this.puzzle.clues.across || []).length;
    clueIdx = acrossLen;
    renderClues(this.puzzle.clues.down, 140);

    // Selected clue input display
    if (this.selectedClue) {
      const { clue, input } = this.selectedClue;
      const inputY = gridY + gridSize * cellS + 20;
      ctx.font = 'bold 13px Exo 2, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'left';
      ctx.fillText(`${clue.num} ${this.selectedClue.dir.toUpperCase()}: ${clue.clue}`, gridX, inputY);
      ctx.font = 'bold 22px Orbitron, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(input + (Math.floor(this.animT / 20) % 2 === 0 ? '|' : ''), gridX, inputY + 26);
    }

    if (this.done) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px Orbitron, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('CROSSWORD COMPLETE!', W / 2, H / 2 - 20);
      ctx.font = '18px Exo 2, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText(`${this.solvedClues.size}/${totalClues} clues solved`, W / 2, H / 2 + 20);
    }
  }
}
