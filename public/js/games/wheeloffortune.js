/* ===== WHEEL OF FORTUNE GAME =====
   Guess the phrase one letter at a time. Score = 10 minus wrong guesses.
*/
class WheelOfFortuneGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.socket = config.socket;
    this.matchId = config.matchId;
    this.isPlayer1 = config.isPlayer1;
    this.onComplete = config.onComplete;
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    const gd = config.gameData || {};
    this.phrase = (gd.phrase || 'PIECE OF CAKE').toUpperCase();
    this.hint = gd.hint || '';
    this.W = 800; this.H = 500;
    this.running = false;
    this.raf = null;
    this.guessedLetters = new Set();
    this.wrongGuesses = 0;
    this.maxWrong = 8;
    this.done = false;
    this.won = false;
    this.animT = 0;
    this._onKey = this._onKey.bind(this);
    this._onClick = this._onClick.bind(this);
    // Pre-reveal common letters (vowel E, and spaces already visible)
    this._preReveal();
  }

  _preReveal() {
    // Pre-reveal the hint letter set
    // No pre-reveals — player must guess from scratch
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
    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = 'display:flex;gap:4px;';
      row.split('').forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch;
        btn.id = `wof-${ch}`;
        btn.style.cssText = 'width:28px;height:32px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;font-size:12px;font-weight:bold;cursor:pointer;';
        btn.addEventListener('click', () => this._guess(ch));
        rowEl.appendChild(btn);
      });
      mc.appendChild(rowEl);
    });
  }

  _onKey(e) {
    if (this.done) return;
    if (/^[a-zA-Z]$/.test(e.key)) this._guess(e.key.toUpperCase());
  }

  _onClick(e) { /* handled by DOM keyboard */ }

  _guess(ch) {
    if (this.done || this.guessedLetters.has(ch)) return;
    this.guessedLetters.add(ch);

    const btn = document.getElementById(`wof-${ch}`);
    if (btn) {
      const inPhrase = this.phrase.includes(ch);
      btn.style.background = inPhrase ? 'rgba(0,255,136,0.4)' : 'rgba(255,77,109,0.4)';
      btn.style.borderColor = inPhrase ? '#00ff88' : '#ff4d6d';
      btn.style.color = inPhrase ? '#000' : 'rgba(255,255,255,0.5)';
      btn.disabled = true;
    }

    if (!this.phrase.includes(ch)) {
      this.wrongGuesses++;
    }

    // Check win: all non-space letters guessed
    const uniqueLetters = new Set(this.phrase.replace(/ /g, '').split(''));
    const allGuessed = [...uniqueLetters].every(l => this.guessedLetters.has(l));
    if (allGuessed) {
      this.won = true;
      this.done = true;
      const score = Math.max(0, this.maxWrong - this.wrongGuesses) + 2;
      this.onScoreUpdate(score, this.maxWrong + 2);
      setTimeout(() => { if (this.onComplete) this.onComplete(score); }, 1500);
    } else if (this.wrongGuesses >= this.maxWrong) {
      this.done = true;
      this.onScoreUpdate(0, this.maxWrong + 2);
      setTimeout(() => { if (this.onComplete) this.onComplete(0); }, 1500);
    } else {
      const score = Math.max(0, this.maxWrong - this.wrongGuesses);
      this.onScoreUpdate(score, this.maxWrong + 2);
    }
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
    bg.addColorStop(0, '#1a0a0a');
    bg.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 56);

    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('WHEEL OF FORTUNE', 16, 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText(`Wrong: ${this.wrongGuesses}/${this.maxWrong}`, W - 16, 26);

    // Wrong guess visualizer (gallows-style segments)
    const segColors = ['#ff4d6d', '#ff6b35', '#ffd700'];
    for (let i = 0; i < this.maxWrong; i++) {
      const sx = 16 + i * (W - 32) / this.maxWrong;
      const sw = (W - 32) / this.maxWrong - 4;
      ctx.fillStyle = i < this.wrongGuesses
        ? segColors[Math.floor(i / 3)] || '#ff4d6d'
        : 'rgba(255,255,255,0.1)';
      ctx.fillRect(sx, 46, sw, 6);
    }

    // Hint
    ctx.font = 'italic 13px Exo 2, sans-serif';
    ctx.fillStyle = 'rgba(255,215,0,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`Hint: ${this.hint}`, W / 2, 78);

    // Phrase display
    const words = this.phrase.split(' ');
    const cellW = 36, cellH = 44, cellGap = 6, wordGap = 18;
    let totalRows = 1;
    let rowWidth = 0;
    const maxRowW = W - 80;
    // Calculate rows
    const rows = [[]];
    words.forEach(word => {
      const wordW = word.length * (cellW + cellGap) - cellGap;
      if (rows[rows.length - 1].length > 0 && rowWidth + wordGap + wordW > maxRowW) {
        rows.push([]);
        rowWidth = 0;
      }
      rows[rows.length - 1].push(word);
      rowWidth += (rowWidth > 0 ? wordGap : 0) + wordW;
    });

    const startY = 110;
    rows.forEach((rowWords, ri) => {
      const rowW = rowWords.reduce((acc, w, wi) => acc + w.length * (cellW + cellGap) - cellGap + (wi > 0 ? wordGap : 0), 0);
      let rx = (W - rowW) / 2;
      rowWords.forEach(word => {
        word.split('').forEach(ch => {
          const revealed = this.guessedLetters.has(ch) || this.done;
          ctx.fillStyle = revealed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)';
          ctx.strokeStyle = revealed ? '#00d4ff' : 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.rect(rx, startY + ri * (cellH + 10), cellW, cellH);
          ctx.fill(); ctx.stroke();

          if (revealed) {
            ctx.fillStyle = '#000';
            ctx.font = `bold ${cellW * 0.55}px Orbitron, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ch, rx + cellW / 2, startY + ri * (cellH + 10) + cellH / 2);
            ctx.textBaseline = 'alphabetic';
          }
          rx += cellW + cellGap;
        });
        rx += wordGap;
      });
    });

    if (this.done) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px Orbitron, sans-serif';
      ctx.fillStyle = this.won ? '#ffd700' : '#ff4d6d';
      ctx.fillText(this.won ? 'SOLVED!' : 'GAME OVER', W / 2, H / 2 - 20);
      if (!this.won) {
        ctx.font = '16px Exo 2, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`Answer: ${this.phrase}`, W / 2, H / 2 + 18);
      }
    }
  }
}
