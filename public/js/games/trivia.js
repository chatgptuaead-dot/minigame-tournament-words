/* ===== TRIVIA GAME ===== */
class TriviaGame {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.socket = config.socket;
    this.matchId = config.matchId;
    this.isPlayer1 = config.isPlayer1;
    this.onComplete = config.onComplete;
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    this.questions = (config.gameData && config.gameData.questions) || [];
    this.W = 800; this.H = 500;
    this.running = false;
    this.raf = null;
    this.qIndex = 0;
    this.score = 0;
    this.answered = false;
    this.selectedOption = null;
    this.correctOption = null;
    this.resultTimer = 0;
    this.timeLeft = 15;
    this.timerId = null;
    this.done = false;
    this.animT = 0;
    this._onClick = this._onClick.bind(this);
  }

  start() {
    this.running = true;
    this.canvas.addEventListener('click', this._onClick);
    this._buildMobileControls();
    this._startQuestion();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  cleanup() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.timerId) clearInterval(this.timerId);
    this.canvas.removeEventListener('click', this._onClick);
    const mc = document.getElementById('mobile-controls');
    if (mc) { mc.innerHTML = ''; mc.className = 'mobile-controls'; }
  }

  _buildMobileControls() {
    const mc = document.getElementById('mobile-controls');
    if (!mc) return;
    mc.className = 'mobile-controls active';
    mc.style.cssText = 'display:flex;justify-content:center;align-items:center;padding:8px;pointer-events:all;position:absolute;bottom:0;left:0;right:0;';
    mc.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:12px;">Tap an answer on the canvas above</div>';
  }

  _startQuestion() {
    if (this.qIndex >= this.questions.length) {
      this.done = true;
      if (this.onComplete) this.onComplete(this.score);
      return;
    }
    this.answered = false;
    this.selectedOption = null;
    this.correctOption = null;
    this.timeLeft = 15;
    this.resultTimer = 0;
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (this.answered) return;
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerId);
        this._handleAnswer(null);
      }
    }, 1000);
  }

  _handleAnswer(option) {
    if (this.answered) return;
    this.answered = true;
    if (this.timerId) clearInterval(this.timerId);
    const q = this.questions[this.qIndex];
    this.selectedOption = option;
    this.correctOption = q.a;
    if (option === q.a) this.score++;
    this.onScoreUpdate(this.score, this.questions.length);
    this.resultTimer = 90; // frames to show result
  }

  _onClick(e) {
    if (this.answered || this.done) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.W / rect.width;
    const scaleY = this.H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const q = this.questions[this.qIndex];
    if (!q) return;
    const opts = q.options;
    const startY = 260;
    const bH = 52, bW = 360, gap = 14;
    for (let i = 0; i < opts.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = col === 0 ? 40 : this.W / 2 + 10;
      const by = startY + row * (bH + gap);
      if (mx >= bx && mx <= bx + bW && my >= by && my <= by + bH) {
        this._handleAnswer(opts[i]);
        return;
      }
    }
  }

  loop() {
    if (!this.running) return;
    this.animT++;
    this.update();
    this.render();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  update() {
    if (this.answered && this.resultTimer > 0) {
      this.resultTimer--;
      if (this.resultTimer === 0) {
        this.qIndex++;
        this._startQuestion();
      }
    }
  }

  render() {
    const { ctx, W, H, animT } = this;
    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a2e');
    bg.addColorStop(1, '#1a0a3e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (this.done) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px Orbitron, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('TRIVIA COMPLETE!', W / 2, H / 2 - 20);
      ctx.font = '22px Exo 2, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText(`You got ${this.score} / ${this.questions.length} correct`, W / 2, H / 2 + 24);
      return;
    }

    const q = this.questions[this.qIndex];
    if (!q) return;

    // Header bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 56);

    // Question number
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'left';
    ctx.fillText(`Q ${this.qIndex + 1} / ${this.questions.length}`, 16, 24);

    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Score: ${this.score}`, W - 16, 24);

    // Timer
    const timerColor = this.timeLeft <= 5 ? '#ff4444' : '#00ff88';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.fillStyle = timerColor;
    ctx.fillText(`${this.timeLeft}s`, W / 2, 36);

    // Timer bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 52, W, 4);
    ctx.fillStyle = timerColor;
    ctx.fillRect(0, 52, W * (this.timeLeft / 15), 4);

    // Question text (word-wrapped)
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Exo 2, sans-serif';
    ctx.fillStyle = '#fff';
    this._wrapText(ctx, q.q, W / 2, 120, W - 80, 28);

    // Options
    const opts = q.options;
    const startY = 240;
    const bH = 52, bW = 360, gap = 14;
    opts.forEach((opt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = col === 0 ? 40 : W / 2 + 10;
      const by = startY + row * (bH + gap);

      let bg2, border, textColor;
      if (!this.answered) {
        bg2 = 'rgba(255,255,255,0.07)';
        border = 'rgba(255,255,255,0.2)';
        textColor = '#fff';
      } else if (opt === this.correctOption) {
        bg2 = 'rgba(0,255,136,0.2)';
        border = '#00ff88';
        textColor = '#00ff88';
      } else if (opt === this.selectedOption) {
        bg2 = 'rgba(255,77,109,0.2)';
        border = '#ff4d6d';
        textColor = '#ff4d6d';
      } else {
        bg2 = 'rgba(255,255,255,0.03)';
        border = 'rgba(255,255,255,0.1)';
        textColor = 'rgba(255,255,255,0.4)';
      }

      ctx.fillStyle = bg2;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.5;
      this._roundRect(ctx, bx, by, bW, bH, 10);
      ctx.fill(); ctx.stroke();

      const labels = ['A', 'B', 'C', 'D'];
      ctx.fillStyle = border;
      ctx.font = 'bold 13px Orbitron, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[i], bx + 14, by + bH / 2 + 5);

      ctx.fillStyle = textColor;
      ctx.font = '14px Exo 2, sans-serif';
      ctx.textAlign = 'left';
      this._wrapText(ctx, opt, bx + 40, by + bH / 2 - 5, bW - 52, 18);
    });

    if (this.answered) {
      const correct = this.selectedOption === this.correctOption;
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.fillStyle = correct ? '#00ff88' : '#ff4d6d';
      ctx.fillText(correct ? '✓ CORRECT!' : '✗ WRONG', W / 2, H - 28);
    }
  }

  _wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, lineY);
        line = word;
        lineY += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, lineY);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
