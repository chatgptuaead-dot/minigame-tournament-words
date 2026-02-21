/* ===== WORDLE GAME ===== */
class WordleGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.socket = config.socket;
    this.matchId = config.matchId;
    this.isPlayer1 = config.isPlayer1;
    this.onComplete = config.onComplete;
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    this.word = ((config.gameData && config.gameData.word) || 'CRANE').toUpperCase();
    this.W = 800; this.H = 500;
    this.running = false;
    this.raf = null;
    this.MAX_GUESSES = 6;
    this.guesses = [];       // array of { letters, colors }
    this.current = '';       // current guess being typed
    this.done = false;
    this.won = false;
    this.shake = 0;
    this.usedLetters = {};   // letter -> 'correct'|'present'|'absent'
    this._onKey = this._onKey.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  start() {
    this.running = true;
    window.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('click', this._onClick);
    this._buildKeyboard();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  cleanup() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this._onKey);
    this.canvas.removeEventListener('click', this._onClick);
    const mc = document.getElementById('mobile-controls');
    if (mc) { mc.innerHTML = ''; mc.className = 'mobile-controls'; }
  }

  _buildKeyboard() {
    const mc = document.getElementById('mobile-controls');
    if (!mc) return;
    mc.className = 'mobile-controls active';
    mc.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;pointer-events:all;position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);';
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    mc.innerHTML = '';
    rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = 'display:flex;gap:4px;';
      if (ri === 2) {
        const enter = document.createElement('button');
        enter.textContent = '↵';
        enter.style.cssText = 'padding:8px 10px;background:rgba(0,212,255,0.3);border:1px solid #00d4ff;color:#fff;border-radius:4px;font-size:14px;cursor:pointer;';
        enter.addEventListener('click', () => this._submit());
        rowEl.appendChild(enter);
      }
      row.split('').forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch;
        btn.id = `wk-${ch}`;
        btn.style.cssText = 'width:28px;height:36px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;font-size:13px;font-weight:bold;cursor:pointer;';
        btn.addEventListener('click', () => this._type(ch));
        rowEl.appendChild(btn);
      });
      if (ri === 2) {
        const del = document.createElement('button');
        del.textContent = '⌫';
        del.style.cssText = 'padding:8px 10px;background:rgba(255,100,100,0.3);border:1px solid #ff4444;color:#fff;border-radius:4px;font-size:14px;cursor:pointer;';
        del.addEventListener('click', () => this._delete());
        rowEl.appendChild(del);
      }
      mc.appendChild(rowEl);
    });
  }

  _updateKeyboardColors() {
    Object.entries(this.usedLetters).forEach(([ch, state]) => {
      const btn = document.getElementById(`wk-${ch}`);
      if (!btn) return;
      const colors = { correct: '#00ff88', present: '#ffd700', absent: 'rgba(80,80,80,0.8)' };
      btn.style.background = colors[state] || '';
      btn.style.borderColor = colors[state] || '';
      btn.style.color = state === 'absent' ? 'rgba(255,255,255,0.4)' : '#000';
    });
  }

  _onKey(e) {
    if (this.done) return;
    if (e.key === 'Enter') this._submit();
    else if (e.key === 'Backspace') this._delete();
    else if (/^[a-zA-Z]$/.test(e.key)) this._type(e.key.toUpperCase());
  }

  _onClick(e) { /* keyboard handled via DOM buttons */ }

  _type(ch) {
    if (this.done || this.current.length >= 5) return;
    this.current += ch;
  }

  _delete() {
    if (this.done) return;
    this.current = this.current.slice(0, -1);
  }

  _submit() {
    if (this.done || this.current.length !== 5) {
      if (this.current.length !== 5) this.shake = 20;
      return;
    }
    const guess = this.current.toUpperCase();
    const colors = this._evaluate(guess);
    this.guesses.push({ letters: guess.split(''), colors });

    // Update used letters
    guess.split('').forEach((ch, i) => {
      const c = colors[i];
      const prev = this.usedLetters[ch];
      if (c === 'correct') this.usedLetters[ch] = 'correct';
      else if (c === 'present' && prev !== 'correct') this.usedLetters[ch] = 'present';
      else if (!prev) this.usedLetters[ch] = 'absent';
    });
    this._updateKeyboardColors();

    if (guess === this.word) {
      this.won = true;
      this.done = true;
      const score = Math.max(1, 7 - this.guesses.length);
      this.onScoreUpdate(score, 6);
      setTimeout(() => { if (this.onComplete) this.onComplete(score); }, 1200);
    } else if (this.guesses.length >= this.MAX_GUESSES) {
      this.done = true;
      this.onScoreUpdate(0, 6);
      setTimeout(() => { if (this.onComplete) this.onComplete(0); }, 1200);
    }
    this.current = '';
  }

  _evaluate(guess) {
    const word = this.word.split('');
    const g = guess.split('');
    const colors = Array(5).fill('absent');
    const remaining = [...word];

    // First pass: correct
    g.forEach((ch, i) => {
      if (ch === remaining[i]) { colors[i] = 'correct'; remaining[i] = null; }
    });
    // Second pass: present
    g.forEach((ch, i) => {
      if (colors[i] === 'correct') return;
      const ri = remaining.indexOf(ch);
      if (ri !== -1) { colors[i] = 'present'; remaining[ri] = null; }
    });
    return colors;
  }

  loop() {
    if (!this.running) return;
    if (this.shake > 0) this.shake--;
    this.render();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1117');
    bg.addColorStop(1, '#0a1628');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('WORDLE', W / 2, 34);

    ctx.font = '12px Exo 2, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Guess the 5-letter word in 6 tries', W / 2, 54);

    // Grid
    const cellSize = 52, gap = 8;
    const gridW = 5 * cellSize + 4 * gap;
    const gridH = 6 * cellSize + 5 * gap;
    const gridX = (W - gridW) / 2;
    const gridY = 70;

    const colorMap = { correct: '#00ff88', present: '#ffd700', absent: 'rgba(80,80,80,0.8)' };

    for (let row = 0; row < this.MAX_GUESSES; row++) {
      const guess = this.guesses[row];
      const isCurrentRow = row === this.guesses.length;
      const shakeOff = (isCurrentRow && this.shake > 0) ? Math.sin(this.shake * 0.8) * 4 : 0;

      for (let col = 0; col < 5; col++) {
        const cx = gridX + col * (cellSize + gap);
        const cy = gridY + row * (cellSize + gap) + shakeOff;

        let letter = '';
        let bg2 = 'transparent';
        let border = 'rgba(255,255,255,0.2)';
        let textColor = '#fff';

        if (guess) {
          letter = guess.letters[col];
          bg2 = colorMap[guess.colors[col]] || 'transparent';
          border = bg2;
          textColor = guess.colors[col] === 'absent' ? 'rgba(255,255,255,0.5)' : '#000';
        } else if (isCurrentRow && col < this.current.length) {
          letter = this.current[col];
          border = 'rgba(255,255,255,0.6)';
        }

        ctx.fillStyle = bg2;
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(cx, cy, cellSize, cellSize);
        ctx.fill(); ctx.stroke();

        if (letter) {
          ctx.fillStyle = textColor;
          ctx.font = `bold ${cellSize * 0.5}px Orbitron, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, cx + cellSize / 2, cy + cellSize / 2);
          ctx.textBaseline = 'alphabetic';
        }
      }
    }

    if (this.done) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px Orbitron, sans-serif';
      if (this.won) {
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`GENIUS! — ${Math.max(1, 7 - this.guesses.length)} pts`, W / 2, gridY + gridH + 34);
      } else {
        ctx.fillStyle = '#ff4d6d';
        ctx.fillText(`The word was: ${this.word}`, W / 2, gridY + gridH + 34);
      }
    }
  }
}
