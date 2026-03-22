export class VectorAnimator {
  constructor(canvasId, statusId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.statusElem = document.getElementById(statusId);
    this.chunks = [];
    this.animationFrameId = null;
    this.init();
    this.bindEvents();
  }

  init() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    this.chunks = [];
    
    for (let i = 0; i < 40; i++) {
        this.chunks.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            active: false,
            numbers: Array.from({length: 4}, () => Math.random().toFixed(2))
        });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.init());
  }

  start() {
    this.draw();
  }

  setStatus(statusText) {
    this.statusElem.innerText = `Status: ${statusText}`;
  }

  resetHighlights() {
    this.chunks.forEach(c => c.active = false);
  }

  highlightRandomChunk() {
    const rnd = Math.floor(Math.random() * this.chunks.length);
    this.chunks[rnd].active = true;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.chunks.forEach(chunk => {
      chunk.x += chunk.vx;
      chunk.y += chunk.vy;
      
      // Boundary collision
      if(chunk.x < 0 || chunk.x > this.canvas.width) chunk.vx *= -1;
      if(chunk.y < 0 || chunk.y > this.canvas.height) chunk.vy *= -1;
      
      // Render text
      this.ctx.fillStyle = chunk.active ? '#ff6e84' : 'rgba(105, 156, 255, 0.4)';
      this.ctx.font = '10px monospace';
      chunk.numbers.forEach((num, idx) => {
        this.ctx.fillText(`[${num}]`, chunk.x, chunk.y + (idx * 12));
      });
      
      // Render active bounding box/glow
      if (chunk.active) {
         this.ctx.beginPath();
         this.ctx.arc(chunk.x + 10, chunk.y + 15, 25, 0, Math.PI * 2);
         this.ctx.strokeStyle = 'rgba(255, 110, 132, 0.5)';
         this.ctx.stroke();
      }
    });

    this.animationFrameId = requestAnimationFrame(() => this.draw());
  }
}
