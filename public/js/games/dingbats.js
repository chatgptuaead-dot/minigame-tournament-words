/* ===== DINGBATS GAME =====
   Look at the visual/text clue and type the phrase it represents (5 puzzles, 20s each)
*/
class DingbatsGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.socket = config.socket;
    this.matchId = config.matchId;
    this.isPlayer1 = config.isPlayer1;
    this.onComplete = config.onComplete;
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    const gd = config.gameData || {};
    this.puzzles = gd.puzzles || [];
    this.W = 800; this.H = 500;
    this.running = false;
    this.raf = null;
    this.qIndex = 0;
    this.score = 0;
    this.current = '';
    this.answered = false;
    this.correct = false;
    this.timeLeft = 40;
    this.timerId = null;
    this.done = false;
    this.resultTick = 0;
    this.animT = 0;
    this.hintShown = false;
    this._onKey = this._onKey.bind(this);
  }

  start() {
    this.running = true;
    window.addEventListener('keydown', this._onKey);
    this._buildMobileControls();
    this._startPuzzle();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  cleanup() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.timerId) clearInterval(this.timerId);
    window.removeEventListener('keydown', this._onKey);
    const mc = document.getElementById('mobile-controls');
    if (mc) { mc.innerHTML = ''; mc.className = 'mobile-controls'; }
  }

  _buildMobileControls() {
    const mc = document.getElementById('mobile-controls');
    if (!mc) return;
    mc.className = 'mobile-controls active';
    mc.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;pointer-events:all;position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);';
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    mc.innerHTML = '';
    rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = 'display:flex;gap:3px;';
      if (ri === 2) {
        const enter = document.createElement('button');
        enter.textContent = '↵';
        enter.style.cssText = 'padding:6px 9px;background:rgba(0,212,255,0.3);border:1px solid #00d4ff;color:#fff;border-radius:4px;font-size:13px;cursor:pointer;';
        enter.addEventListener('click', () => this._submit());
        rowEl.appendChild(enter);
      }
      row.split('').forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch;
        btn.style.cssText = 'width:26px;height:34px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;font-size:12px;font-weight:bold;cursor:pointer;';
        btn.addEventListener('click', () => this._type(ch));
        rowEl.appendChild(btn);
      });
      if (ri === 2) {
        const space = document.createElement('button');
        space.textContent = 'SPC';
        space.style.cssText = 'padding:6px 9px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;font-size:11px;cursor:pointer;';
        space.addEventListener('click', () => this._type(' '));
        rowEl.appendChild(space);
        const del = document.createElement('button');
        del.textContent = '⌫';
        del.style.cssText = 'padding:6px 9px;background:rgba(255,100,100,0.3);border:1px solid #ff4444;color:#fff;border-radius:4px;font-size:13px;cursor:pointer;';
        del.addEventListener('click', () => this._delete());
        rowEl.appendChild(del);
      }
      mc.appendChild(rowEl);
    });
  }

  _startPuzzle() {
    if (this.qIndex >= this.puzzles.length) {
      this.done = true;
      if (this.onComplete) this.onComplete(this.score);
      return;
    }
    this.answered = false;
    this.correct = false;
    this.current = '';
    this.resultTick = 0;
    this.timeLeft = 40;
    this.hintShown = false;
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (this.answered) return;
      this.timeLeft--;
      if (this.timeLeft === 20) this.hintShown = true;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerId);
        this._handleAnswer(false);
      }
    }, 1000);
  }

  _onKey(e) {
    if (this.done || this.answered) return;
    if (e.key === 'Enter') this._submit();
    else if (e.key === 'Backspace') this._delete();
    else if (e.key === ' ') { e.preventDefault(); this._type(' '); }
    else if (/^[a-zA-Z]$/.test(e.key)) this._type(e.key.toUpperCase());
  }

  _type(ch) {
    if (this.done || this.answered) return;
    this.current += ch;
  }

  _delete() {
    if (this.done || this.answered) return;
    this.current = this.current.slice(0, -1);
  }

  _submit() {
    if (this.done || this.answered) return;
    const p = this.puzzles[this.qIndex];
    const normalized = str => str.toUpperCase().replace(/\s+/g, ' ').trim();
    const isCorrect = normalized(this.current) === normalized(p.answer);
    this._handleAnswer(isCorrect);
  }

  _handleAnswer(isCorrect) {
    if (this.answered) return;
    this.answered = true;
    this.correct = isCorrect;
    if (this.timerId) clearInterval(this.timerId);
    if (isCorrect) this.score++;
    this.onScoreUpdate(this.score, this.puzzles.length);
    this.resultTick = 100;
  }

  loop() {
    if (!this.running) return;
    this.animT++;
    if (this.resultTick > 0) {
      this.resultTick--;
      if (this.resultTick === 0) {
        this.qIndex++;
        this._startPuzzle();
      }
    }
    this.render();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a1a2e');
    bg.addColorStop(1, '#1a0a1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (this.done || this.puzzles.length === 0) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px Orbitron, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('DINGBATS DONE!', W / 2, H / 2 - 20);
      ctx.font = '20px Exo 2, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText(`${this.score} / ${this.puzzles.length} correct`, W / 2, H / 2 + 20);
      return;
    }

    const p = this.puzzles[this.qIndex];
    if (!p) return;

    // Header
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 56);

    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText(`DINGBAT ${this.qIndex + 1} / ${this.puzzles.length}`, 16, 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Score: ${this.score}`, W - 16, 26);

    const tc = this.timeLeft <= 8 ? '#ff4444' : '#00ff88';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.fillStyle = tc;
    ctx.fillText(`${this.timeLeft}s`, W / 2, 36);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 52, W, 4);
    ctx.fillStyle = tc;
    ctx.fillRect(0, 52, W * (this.timeLeft / 40), 4);

    // Puzzle visual area
    const pvX = 80, pvY = 80, pvW = W - 160, pvH = 200;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(pvX, pvY, pvW, pvH);
    ctx.fill(); ctx.stroke();

    // Draw puzzle visual text
    const lines = p.visual.split('\n');
    ctx.font = 'bold 24px Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const lineH = 30;
    const totalTextH = lines.length * lineH;
    const textStartY = pvY + (pvH - totalTextH) / 2 + lineH;
    lines.forEach((line, i) => {
      ctx.fillText(line, pvX + pvW / 2, textStartY + i * lineH);
    });

    // Hint (after 10 seconds)
    if (this.hintShown || this.answered) {
      ctx.font = 'italic 13px Exo 2, sans-serif';
      ctx.fillStyle = 'rgba(255,215,0,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(`Hint: ${p.hint}`, W / 2, pvY + pvH + 18);
    }

    // Input field
    const inputY = pvY + pvH + (this.hintShown ? 44 : 28);
    ctx.strokeStyle = this.answered
      ? (this.correct ? '#00ff88' : '#ff4d6d')
      : 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pvX, inputY, pvW, 62);
    ctx.font = 'bold 24px Exo 2, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const display = this.answered ? '' : this.current + (Math.floor(this.animT / 20) % 2 === 0 ? '|' : '');
    ctx.fillText(display, pvX + pvW / 2, inputY + 40);

    if (this.answered) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.fillStyle = this.correct ? '#00ff88' : '#ff4d6d';
      ctx.fillText(this.correct ? `✓ CORRECT!` : `✗ Answer: ${p.answer}`, W / 2, inputY + 40);
    }
  }
}
