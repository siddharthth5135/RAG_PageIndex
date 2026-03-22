export class GraphAnimator {
  constructor(canvasId, statusId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.statusElem = document.getElementById(statusId);
    this.nodes = [];
    this.edges = [];
    this.agentToken = null;
    this.animationFrameId = null;
    
    this.init();
    this.bindEvents();
  }

  init(customGraph = null) {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    
    if (customGraph && customGraph.nodes.length > 0) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.nodes = customGraph.nodes.map(n => ({...n, x: w/2, y: 50, active: false}));
      this.edges = customGraph.edges;
      
      // Compute tree layout
      const levels = {};
      this.nodes.forEach(n => {
        if (!levels[n.level]) levels[n.level] = [];
        levels[n.level].push(n);
      });
      
      Object.keys(levels).forEach(level => {
        const nodesAtLevel = levels[level];
        const numNodes = nodesAtLevel.length;
        const ySpace = h / (Object.keys(levels).length + 1);
        const y = ySpace * (parseInt(level) + 1);
        
        nodesAtLevel.forEach((node, i) => {
          const x = (w / (numNodes + 1)) * (i + 1);
          node.x = x;
          node.y = y;
        });
      });
    } else {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.nodes = [
        { id: 0, x: w/2,     y: 50,  label: 'Document', level: 0, active: false },
        { id: 1, x: w/4,     y: 150, label: 'Chapter 1',level: 1, active: false },
        { id: 2, x: 3*w/4,   y: 150, label: 'Chapter 2',level: 1, active: false },
        { id: 3, x: w/8,     y: 250, label: 'Sec 1.1',  level: 2, active: false },
        { id: 4, x: 3*w/8,   y: 250, label: 'Sec 1.2',  level: 2, active: false },
        { id: 5, x: 5*w/8,   y: 250, label: 'Sec 2.1',  level: 2, active: false },
        { id: 6, x: 7*w/8,   y: 250, label: 'Sec 2.2',  level: 2, active: false },
        { id: 7, x: 6*w/8,   y: 350, label: 'Data',     level: 3, active: false }
      ];
      this.edges = [
        {source: 0, target: 1}, {source: 0, target: 2},
        {source: 1, target: 3}, {source: 1, target: 4},
        {source: 2, target: 5}, {source: 2, target: 6},
        {source: 6, target: 7}
      ];
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
    this.nodes.forEach(n => n.active = false);
    this.agentToken = null;
  }

  setTokenPosition(x, y) {
    this.agentToken = { x, y };
  }

  getNode(id) {
    return this.nodes.find(n => n.id === id);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render Edges
    this.edges.forEach(e => {
      const s = this.nodes[e.source];
      const t = this.nodes[e.target];
      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(t.x, t.y);
      this.ctx.strokeStyle = 'rgba(109, 117, 140, 0.4)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
    
    // Render Nodes
    this.nodes.forEach(n => {
      // Glow effect for active nodes
      if (n.active) {
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(155, 255, 206, 0.2)';
        this.ctx.fill();
      }
      
      // Node body
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, 15, 0, Math.PI * 2);
      this.ctx.fillStyle = n.active ? '#9bffce' : '#cc97ff';
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.stroke();
      
      // Node label
      this.ctx.fillStyle = '#dee5ff';
      this.ctx.font = '12px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(n.label, n.x, n.y + 35);
    });
    
    // Render LLM Agent Token
    if (this.agentToken) {
      this.ctx.beginPath();
      this.ctx.arc(this.agentToken.x, this.agentToken.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.shadowColor = '#fff';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // reset
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.draw());
  }
}
