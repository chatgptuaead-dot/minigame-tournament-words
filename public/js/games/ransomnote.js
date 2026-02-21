/* ===== RANSOM NOTE GAME =====
   Make as many words as you can from the letters in a given word (60 seconds)
*/
class RansomNoteGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.socket = config.socket;
    this.matchId = config.matchId;
    this.isPlayer1 = config.isPlayer1;
    this.onComplete = config.onComplete;
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    const gd = config.gameData || {};
    this.sourceWord = (gd.sourceWord || 'STRAWBERRY').toUpperCase();
    this.validWords = new Set((gd.validWords || []).map(w => w.toUpperCase()));
    this.W = 800; this.H = 500;
    this.running = false;
    this.raf = null;
    this.timeLeft = 60;
    this.timerId = null;
    this.current = '';
    this.foundWords = [];
    this.message = '';
    this.messageTick = 0;
    this.done = false;
    this.animT = 0;
    this._onKey = this._onKey.bind(this);
  }

  start() {
    this.running = true;
    window.addEventListener('keydown', this._onKey);
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
        const del = document.createElement('button');
        del.textContent = '⌫';
        del.style.cssText = 'padding:6px 9px;background:rgba(255,100,100,0.3);border:1px solid #ff4444;color:#fff;border-radius:4px;font-size:13px;cursor:pointer;';
        del.addEventListener('click', () => this._delete());
        rowEl.appendChild(del);
      }
      mc.appendChild(rowEl);
    });
  }

  _onKey(e) {
    if (this.done) return;
    if (e.key === 'Enter') this._submit();
    else if (e.key === 'Backspace') this._delete();
    else if (/^[a-zA-Z]$/.test(e.key)) this._type(e.key.toUpperCase());
  }

  _type(ch) {
    if (this.done || this.current.length >= this.sourceWord.length) return;
    this.current += ch;
  }

  _delete() {
    if (this.done) return;
    this.current = this.current.slice(0, -1);
  }

  _submit() {
    if (this.done) return;
    const w = this.current.toUpperCase();
    this.current = '';
    if (w.length < 2) {
      this._showMsg('Too short!', '#ff4d6d');
      return;
    }
    if (this.foundWords.includes(w)) {
      this._showMsg('Already found!', '#ffd700');
      return;
    }
    // Check if word can be made from sourceWord letters
    if (!this._canMake(w)) {
      this._showMsg('Not from those letters!', '#ff4d6d');
      return;
    }
    if (!this.validWords.has(w)) {
      this._showMsg('Not a valid word!', '#ff4d6d');
      return;
    }
    this.foundWords.push(w);
    this.onScoreUpdate(this.foundWords.length, 10);
    this._showMsg(`+1 "${w}"!`, '#00ff88');
  }

  _canMake(word) {
    const pool = this.sourceWord.split('');
    for (const ch of word) {
      const i = pool.indexOf(ch);
      if (i === -1) return false;
      pool.splice(i, 1);
    }
    return true;
  }

  _showMsg(text, color) {
    this.message = text;
    this.messageColor = color;
    this.messageTick = 90;
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    const score = this.foundWords.length;
    this.onScoreUpdate(score, 10);
    if (this.onComplete) this.onComplete(score);
  }

  loop() {
    if (!this.running) return;
    this.animT++;
    if (this.messageTick > 0) this.messageTick--;
    this.render();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a0a2e');
    bg.addColorStop(1, '#0a1a0e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 56);

    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('RANSOM NOTE', 16, 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`Words: ${this.foundWords.length}`, W - 16, 26);

    // Timer
    const tc = this.timeLeft <= 10 ? '#ff4444' : '#ffd700';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.fillStyle = tc;
    ctx.fillText(`${this.timeLeft}s`, W / 2, 36);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 52, W, 4);
    ctx.fillStyle = tc;
    ctx.fillRect(0, 52, W * (this.timeLeft / 60), 4);

    // Source word display (ransom note style)
    const letters = this.sourceWord.split('');
    const lW = 44, lH = 52, lGap = 6;
    const totalW = letters.length * lW + (letters.length - 1) * lGap;
    const startX = (W - totalW) / 2;
    const startY = 80;

    ctx.font = 'bold 11px Exo 2, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('MAKE WORDS FROM THESE LETTERS', W / 2, 76);

    letters.forEach((ch, i) => {
      const lx = startX + i * (lW + lGap);
      const ly = startY + 8;
      // Random-ish background colors for "ransom note" effect
      const hue = (i * 47 + 30) % 360;
      ctx.fillStyle = `hsl(${hue}, 60%, 20%)`;
      ctx.strokeStyle = `hsl(${hue}, 80%, 40%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(lx, ly, lW, lH);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = `hsl(${hue}, 80%, 80%)`;
      ctx.font = `bold ${lW * 0.55}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, lx + lW / 2, ly + lH / 2);
      ctx.textBaseline = 'alphabetic';
    });

    // Current input
    const inputY = 170;
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - 160, inputY, 320, 62);
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(this.current + (Math.floor(this.animT / 20) % 2 === 0 ? '|' : ''), W / 2, inputY + 42);

    // Message
    if (this.messageTick > 0) {
      ctx.globalAlpha = Math.min(1, this.messageTick / 20);
      ctx.font = 'bold 16px Exo 2, sans-serif';
      ctx.fillStyle = this.messageColor || '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, W / 2, inputY + 84);
      ctx.globalAlpha = 1;
    }

    // Found words list
    const listX = 20, listY = 230;
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'left';
    ctx.fillText('FOUND WORDS:', listX, listY);

    const cols = 4, colW = (W - 40) / cols;
    this.foundWords.forEach((w, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.font = '13px Exo 2, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(w, listX + col * colW, listY + 20 + row * 20);
    });

    if (this.done) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px Orbitron, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('TIME\'S UP!', W / 2, H / 2 - 20);
      ctx.font = '20px Exo 2, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${this.foundWords.length} words found!`, W / 2, H / 2 + 20);
    }
  }
}
