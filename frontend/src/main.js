import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// --- AETHER BACKGROUND ---
class AetherField {
  constructor() {
    this.canvas = document.getElementById('aether-canvas');
    if (!this.canvas) return;
    this.init();
  }
  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 1200;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xFFFFFF, 1.2);
    this.scene.add(ambient);

    // Dust Particles
    const dustCount = 4000;
    const dustPos = new Float32Array(dustCount * 3);
    for(let i=0; i<dustCount*3; i++) dustPos[i] = (Math.random()-0.5)*7000;
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1.5, transparent: true, opacity: 0.1 })));

    // Neon Orbs
    const orbCount = 30;
    const orbPos = new Float32Array(orbCount * 3);
    for(let i=0; i<orbCount*3; i++){
        orbPos[i*3] = (Math.random()-0.5)*5000;
        orbPos[i*3+1] = (Math.random()-0.5)*5000;
        orbPos[i*3+2] = (Math.random()-0.5)*2000;
    }
    const orbGeo = new THREE.BufferGeometry();
    orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos, 3));
    this.scene.add(new THREE.Points(orbGeo, new THREE.PointsMaterial({ color: 0x00D4FF, size: 8, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })));

    // Neon Orbs (Orange)
    const orbOrangePos = new Float32Array(20 * 3);
    for(let i=0; i<20*3; i++) orbOrangePos[i] = (Math.random()-0.5)*5000;
    const orbOrangeGeo = new THREE.BufferGeometry();
    orbOrangeGeo.setAttribute('position', new THREE.BufferAttribute(orbOrangePos, 3));
    this.scene.add(new THREE.Points(orbOrangeGeo, new THREE.PointsMaterial({ color: 0xFF8C42, size: 10, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })));

    // Rising Stars
    this.starCount = 5000;
    this.starPos = new Float32Array(this.starCount * 3);
    for(let i=0; i<this.starCount*3; i++) this.starPos[i] = (Math.random()-0.5)*8000;
    this.starGeo = new THREE.BufferGeometry();
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(this.starPos, 3));
    this.stars = new THREE.Points(this.starGeo, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 4.8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
    this.scene.add(this.stars);

    // Hero Decoration Mesh (Top Left)
    this.dodeca = new THREE.Mesh(new THREE.DodecahedronGeometry(200, 0), new THREE.MeshBasicMaterial({ color: 0x00D4FF, wireframe: true, transparent: true, opacity: 0.2 }));
    this.dodeca.position.set(-1500, 800, -200);
    this.scene.add(this.dodeca);

    // Hero Decoration Mesh (Bottom Right - Orange)
    this.dodecaOrange = new THREE.Mesh(new THREE.DodecahedronGeometry(150, 0), new THREE.MeshBasicMaterial({ color: 0xFF8C42, wireframe: true, transparent: true, opacity: 0.2 }));
    this.dodecaOrange.position.set(1500, -800, -200);
    this.scene.add(this.dodecaOrange);

    this.animate();
  }
  animate() {
    requestAnimationFrame(() => this.animate());
    this.dodeca.rotation.y += 0.002;
    this.dodecaOrange.rotation.x += 0.002;
    this.dodecaOrange.rotation.y += 0.001;

    // Rising Stars Animation
    const positions = this.stars.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 1.5; // Upward velocity
        if (positions[i] > 4000) positions[i] = -4000; // Reset to bottom
    }
    this.stars.geometry.attributes.position.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// --- CHAOS FIELD (Step 1 Visual) ---
class ChaosField {
    constructor() {
        this.canvas = document.getElementById('chaos-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.points = [];
        for(let i=0; i<80; i++) {
            this.points.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5
            });
        }
        this.animate();
    }
    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width || 400;
        this.canvas.height = rect.height || 400;
    }
    animate() {
        if (!this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#FF3131";
        this.ctx.strokeStyle = "rgba(255, 49, 49, 0.6)";
        
        this.points.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if(p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if(p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Drawing connections (The Haystack)
        for(let i=0; i<this.points.length; i++){
            for(let j=i+1; j<this.points.length; j++){
                const dx = this.points[i].x - this.points[j].x;
                const dy = this.points[i].y - this.points[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 80) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.points[i].x, this.points[i].y);
                    this.ctx.lineTo(this.points[j].x, this.points[j].y);
                    this.ctx.stroke();
                }
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}

// --- DYNAMIC TREE RENDERER (THE HEART VISUALIZER) ---
class DynamicTreeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.container.offsetWidth / this.container.offsetHeight, 1, 2000);
        this.camera.position.set(0, 0, 150);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.container.appendChild(this.renderer.domElement);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        this.nodes = [];
        this.animate();
    }
    
    clear() {
        while(this.group.children.length > 0) { this.group.remove(this.group.children[0]); }
        this.nodes = [];
    }

    render(graph) {
        this.clear();
        if(!graph || !graph.nodes) return;
        
        const nodeMap = new Map();
        const depthMap = new Map();
        
        // 1. Calculate depths
        const adj = {};
        graph.edges.forEach(e => { if(!adj[e.source]) adj[e.source] = []; adj[e.source].push(e.target); });
        
        const setDepth = (id, d) => {
            depthMap.set(id, d);
            (adj[id] || []).forEach(child => setDepth(child, d + 1));
        };
        if(graph.nodes.length > 0) setDepth(graph.nodes[0].id, 0);

        // 2. Position nodes
        const layerCounts = {};
        graph.nodes.forEach(n => {
            const d = depthMap.get(n.id) || 0;
            if(!layerCounts[d]) layerCounts[d] = 0;
            
            const x = (layerCounts[d] - 2) * 40; // Horizontal spread
            const y = 60 - (d * 50); // Vertical spread
            const z = (Math.random() - 0.5) * 20;
            
            const pos = new THREE.Vector3(x, y, z);
            const size = d === 0 ? 4 : (d === 1 ? 2.5 : 1.5);
            const color = d === 0 ? 0x00D4FF : (d === 1 ? 0xFFFFFF : 0x00D4FF);
            
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(size, 32, 32),
                new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, transparent: true, opacity: 0.9 })
            );
            mesh.position.copy(pos);
            this.group.add(mesh);
            
            // Labels for roots and major branches
            if(d < 2) {
                const label = this.createLabel(n.label);
                label.position.set(x, y + (size * 2), z);
                this.group.add(label);
            }
            
            nodeMap.set(n.id, pos);
            layerCounts[d]++;
        });

        // 3. Draw branches
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00D4FF, transparent: true, opacity: 0.3 });
        graph.edges.forEach(e => {
            const start = nodeMap.get(e.source);
            const end = nodeMap.get(e.target);
            if(start && end) {
                const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
                const line = new THREE.Line(geo, lineMat);
                this.group.add(line);
            }
        });

        // Auto-center camera
        const box = new THREE.Box3().setFromObject(this.group);
        const center = box.getCenter(new THREE.Vector3());
        this.camera.lookAt(center);
        gsap.to(this.group.rotation, { y: Math.PI * 2, duration: 15, repeat: -1, ease: "none" });
    }

    createLabel(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512; canvas.height = 128;
        ctx.font = "bold 40px 'JetBrains Mono'";
        ctx.fillStyle = "#00D4FF";
        ctx.textAlign = "center";
        ctx.fillText(text.substring(0, 20).toUpperCase(), 256, 80);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(15, 4, 1);
        return sprite;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }
}

// --- VISION ENGINE ---
class VisionEngine {
    constructor() {
        // Static diagram - no animation needed
    }
}

// --- TREE DEEP DIVE (THREE.JS) ---
class TreeDeepDive {
    constructor() {
        this.container = document.getElementById('three-tree-container');
        if (!this.container) return;
        this.init();
        this.createTree();
        this.setupScrollHooks();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.camera.position.set(-15, 10, 85);
        this.camera.lookAt(5, 5, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));

        const pointLight = new THREE.PointLight(0x00D4FF, 150);
        pointLight.position.set(10, 30, 10);
        this.scene.add(pointLight);

        this.nodes = [];
        this.branches = [];
        this.group = new THREE.Group();
        this.group.rotation.x = 0.3; // Perspective tilt
        this.group.rotation.y = 0.2;
        this.scene.add(this.group);

        this.animate();
    }

    createTextLabel(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512; canvas.height = 128;
        ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fillRect(0,0,512,128);
        ctx.font = "bold 44px 'JetBrains Mono'";
        ctx.fillStyle = "#00D4FF";
        ctx.textAlign = "center";
        ctx.fillText(text.toUpperCase(), 256, 80);
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0 });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(10, 2.5, 1);
        return sprite;
    }

    createNode(pos, size, type, title = "") {
        const color = 0x00D4FF;
        const geo = new THREE.SphereGeometry(size, 32, 32); 
        const mat = new THREE.MeshStandardMaterial({ 
            color: color, emissive: color, emissiveIntensity: 1.5,
            metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        
        const light = new THREE.PointLight(color, 1, 10);
        light.position.copy(pos);
        light.intensity = 0;
        this.group.add(light);
        
        this.group.add(mesh);
        
        let label = null;
        if(title) {
            label = this.createTextLabel(title);
            label.position.set(pos.x, pos.y + (size * 2), pos.z);
            this.group.add(label);
        }

        this.nodes.push({ mesh, light, label, type, originalColor: color });
        return { mesh, light, label };
    }

    createBranch(start, end) {
        const points = [start, end];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x00D4FF, transparent: true, opacity: 0 });
        const line = new THREE.Line(geo, mat);
        this.group.add(line);
        this.branches.push(line);
        return line;
    }

    createTree() {
        const rootPos = new THREE.Vector3(0, 30, 0);
        const rootObj = this.createNode(rootPos, 2.5, 'ROOT', 'SOURCE_DOC.PDF');
        this.root = rootObj.mesh;
        
        const branchPos = [
            new THREE.Vector3(-18, 15, 8),
            new THREE.Vector3(0, 15, -12),
            new THREE.Vector3(18, 15, 8)
        ];
        const branchTitles = ["STRUCTURAL_DNA", "PAGEINDEX_DISCOVERY", "CONTEXT_LINKS"];
        const bs = branchPos.map((pos, i) => {
            const b = this.createNode(pos, 1.5, 'BRANCH', branchTitles[i]);
            this.createBranch(rootPos, pos);
            return b;
        });

        const leavesB = [
            { pos: new THREE.Vector3(-5, 5, -20), title: 'CHAPTER 01' },
            { pos: new THREE.Vector3(5, 5, -20), title: 'CHAPTER 02' }
        ];
        this.targetLeafPos = leavesB[0].pos;
        leavesB.forEach((leafData, i) => {
           const obj = this.createNode(leafData.pos, 0.8, 'LEAF', leafData.title);
           if(i === 0) this.targetLeafNode = obj.mesh;
           this.createBranch(branchPos[1], leafData.pos);
        });

        const terminalLeaf = new THREE.Vector3(20, 5, 12);
        this.createNode(terminalLeaf, 0.8, 'LEAF', 'SEMANTIC_TRUTH');
        this.createBranch(branchPos[2], terminalLeaf);
    }

    setupScrollHooks() {
        // Trigger animations once when section enters viewport
        const trigger = { trigger: "#section-tree-dive", start: "top 60%", toggleActions: "play none none none" };
        const totalNodes = this.nodes.length;
        const totalBranches = this.branches.length;
        
        // Build timeline for sequential reveal instead of scrub scroll
        const tl = gsap.timeline({ scrollTrigger: trigger });
        
        // Appear one by one - fast building animation
        this.nodes.forEach((n, i) => {
            const delay = i * 0.08;
            tl.to(n.mesh.material, { opacity: 1, duration: 0.3 }, delay)
              .to(n.light, { intensity: 1.5, duration: 0.3 }, delay)
              .from(n.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.4 }, delay);
            if(n.label) tl.to(n.label.material, { opacity: 0.9, duration: 0.4 }, delay + 0.1);
        });

        this.branches.forEach((b, i) => {
            tl.to(b.material, { opacity: 0.3, duration: 0.5 }, i * 0.05);
        });
        
        // Secondary panels reveal
        tl.to(".page-index-panel", { className: "page-index-panel glass-card active", duration: 0.8, ease: "power2.out" }, 0.5);
        tl.to(".floating-result-card", { className: "floating-result-card glass-card visible", duration: 0.6, ease: "back.out(1.7)" }, 1.5);

        // Auto-pulses after build
        tl.add(() => {
            this.pulseNode(this.nodes[0]);
            this.pulseNode(this.nodes[3]);
            this.pulseNode(this.targetLeafNode);
        }, "+=0.5");
    }

    pulseNode(node) {
        gsap.to(node.material.color, { r: 1, g: 0.84, b: 0, duration: 0.3 });
        gsap.to(node.material, { emissiveIntensity: 2, duration: 0.3 });
        gsap.to(node.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.2, yoyo: true, repeat: 1 });
    }

    animate() { 
        requestAnimationFrame(() => this.animate()); 
        this.group.rotation.y += 0.0015; 
        
        // Dynamic pulse for existing nodes
        this.nodes.forEach((n, i) => {
            if(n.mesh.material.opacity > 0.1) {
                const pulse = Math.sin(Date.now() * 0.002 + i) * 0.15 + 1;
                n.mesh.scale.set(pulse, pulse, pulse);
            }
        });
        
        this.renderer.render(this.scene, this.camera); 
    }
    onResize() {
        if (!this.container) return;
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }
}

// --- STATIC TREE RENDERER (ACCORDION) ---
class StaticTreeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
    
    render(graph) {
        if (!this.container || !graph || !graph.nodes) return;
        this.container.innerHTML = "";
        
        const adj = {};
        const isChild = new Set();
        graph.edges.forEach(e => {
            if(!adj[e.source]) adj[e.source] = [];
            adj[e.source].push(e.target);
            isChild.add(e.target);
        });
        
        const nodeMap = new Map();
        graph.nodes.forEach(n => nodeMap.set(n.id, n));
        
        const roots = graph.nodes.filter(n => !isChild.has(n.id));
        
        const buildNodeHTML = (nodeId) => {
            const node = nodeMap.get(nodeId);
            if (!node) return "";
            
            const children = adj[nodeId] || [];
            const hasChildren = children.length > 0;
            
            let html = `<div class="tree-node-item">`;
            
            html += `<div class="tree-node-header" onclick="this.parentElement.classList.toggle('expanded')">`;
            html += `<div class="tree-node-title">`;
            html += `<span class="tree-expander">${hasChildren ? "▶" : "&nbsp;&nbsp;"}</span>`;
            html += `<span>${node.title || node.label}</span>`;
            html += `</div>`;
            
            html += `<div class="tree-node-page">Page ${node.level}</div>`;
            html += `</div>`;
            
            if (node.summary) {
                 html += `<div class="tree-node-summary">${node.summary}</div>`;
            }
            
            if (hasChildren) {
                html += `<div class="tree-node-children">`;
                children.forEach(childId => {
                    html += buildNodeHTML(childId);
                });
                html += `</div>`;
            }
            
            html += `</div>`;
            return html;
        };
        
        let finalHTML = "";
        roots.forEach(r => {
            finalHTML += buildNodeHTML(r.id);
        });
        
        this.container.innerHTML = finalHTML;
    }
}

// --- PAGE ENGINE ---
class PageEngine {
  constructor() {
    this.initHero();
    this.initLab();
    this.initScrollAnimations();
    this.initCursor();
    this.initLoader();
    this.chaos = new ChaosField();
    this.vision = new VisionEngine();
    this.treeDive = new TreeDeepDive();
  }

  initLab() {
    this.selectedFile = null;
    this.docName = "";
    
    // Elements
    this.fileInput = document.getElementById('fileInput');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.searchBtn = document.getElementById('searchBtn');
    this.queryInput = document.getElementById('queryInput');
    this.askBtn = document.getElementById('askBtn');
    this.logsContainer = document.getElementById('agent-logs');
    this.visualOverlay = document.querySelector('.visual-overlay');
    this.dynamicTreeContainer = document.getElementById('dynamic-tree-container');
    this.staticTreeContainer = document.getElementById('static-tree-container');
    this.toggleViewBtn = document.getElementById('toggleViewBtn');
    
    this.dynamicTree = new DynamicTreeRenderer('dynamic-tree-container');
    this.staticTree = new StaticTreeRenderer('static-tree-root');
    
    this.currentViewMode = 'static'; // Default to static per user request
    if (this.toggleViewBtn) {
        this.toggleViewBtn.addEventListener('click', () => {
            if (this.currentViewMode === '3d') {
                this.currentViewMode = 'static';
                this.dynamicTreeContainer.style.display = 'none';
                this.staticTreeContainer.style.display = 'block';
                this.toggleViewBtn.innerHTML = '<span class="btn-icon">🌐</span> 3D View';
            } else {
                this.currentViewMode = '3d';
                this.staticTreeContainer.style.display = 'none';
                this.dynamicTreeContainer.style.display = 'block';
                this.toggleViewBtn.innerHTML = '<span class="btn-icon">📋</span> List View';
            }
        });
    }
    
    if (!this.fileInput || !this.uploadBtn) return;

    // 1. File Selection
    this.uploadBtn.addEventListener('click', () => this.fileInput.click());
    
    this.fileInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            this.selectedFile = e.target.files[0];
            this.logToTerminal(`FILE_SELECTED: ${this.selectedFile.name}`, 'action');
            this.searchBtn.disabled = false;
            this.uploadBtn.innerHTML = `<span class="btn-icon">✓</span> ${this.selectedFile.name.toUpperCase()}`;
        }
    });

    // 2. Generate Structure (Upload)
    this.searchBtn.addEventListener('click', async () => {
        if(!this.selectedFile) return;
        
        this.searchBtn.disabled = true;
        this.searchBtn.innerHTML = `<span class="btn-icon">⚙</span> PROCESSING...`;
        this.logToTerminal(`UPLOADING_TO_CORE: Establishing Stream...`, 'action');
        
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // Keep last incomplete chunk in buffer

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const content = line.replace('data: ', '').trim();

                    if (content.startsWith('LOG:')) {
                        this.logToTerminal(content.replace('LOG:', ''), 'action');
                    } else if (content.startsWith('ERR:')) {
                        this.logToTerminal(content.replace('ERR:', ''), 'warn');
                    } else if (content.startsWith('FINAL:')) {
                        const data = JSON.parse(content.replace('FINAL:', ''));
                        this.docName = data.doc_name;
                        if(this.dynamicTree) this.dynamicTree.render(data.graph);
                        if(this.staticTree) this.staticTree.render(data.graph);
                        if(this.visualOverlay) this.visualOverlay.classList.add('hidden');
                        
                        if(this.toggleViewBtn) {
                            this.toggleViewBtn.style.display = 'block';
                            // Activate default mode
                            if (this.currentViewMode === 'static') {
                                this.dynamicTreeContainer.style.display = 'none';
                                this.staticTreeContainer.style.display = 'block';
                                this.toggleViewBtn.innerHTML = '<span class="btn-icon">🌐</span> 3D View';
                            }
                        }
                        
                        this.queryInput.disabled = false;
                        this.queryInput.placeholder = "Query the document structure...";
                        this.askBtn.disabled = false;
                        this.searchBtn.innerHTML = `<span class="btn-icon">✓</span> PROCESS_COMPLETE`;
                    } else if (content === "DONE:ERROR") {
                        this.searchBtn.disabled = false;
                        this.searchBtn.innerHTML = `<span class="btn-icon">⚡</span> RETRY_GENERATION`;
                    }
                }
            }
        } catch (err) {
            this.logToTerminal(`CONNECTION_ERROR: ${err.message}`, 'warn');
            this.searchBtn.disabled = false;
            this.searchBtn.innerHTML = `<span class="btn-icon">⚡</span> RETRY_GENERATION`;
        }
    });

    // 3. Query Execution
    const executeQuery = async () => {
        const query = this.queryInput.value.trim();
        if(!query || !this.docName) return;
        
        this.queryInput.disabled = true;
        this.askBtn.disabled = true;
        this.logToTerminal(`TRAVERSING_TREE: Searching for "${query}"...`, 'action');
        
        try {
            const response = await fetch('/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query, doc_name: this.docName })
            });
            const data = await response.json();
            
            if(data.status === 'success') {
                let answerText = data.result;
                let usedNodes = "";
                
                if (typeof data.result === 'object' && data.result !== null) {
                    answerText = data.result.answer;
                    if (data.result.node_ids && data.result.node_ids.length > 0) {
                        usedNodes = `[EXTRACTED FROM DATA NODES: ${data.result.node_ids.join(', ')}] <br><br>`;
                    }
                }
                
                // Print the full answer containing exact node IDs and the AI's generated response
                this.logToTerminal(`MATCH_FOUND:<br>${usedNodes}${answerText.replace(/\\n/g, '<br>')}`, 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            this.logToTerminal(`QUERY_ERROR: ${err.message}`, 'warn');
        } finally {
            this.queryInput.disabled = false;
            this.askBtn.disabled = false;
            this.queryInput.value = "";
        }
    };

    this.askBtn.addEventListener('click', executeQuery);
    this.queryInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') executeQuery(); });
  }

  logToTerminal(message, type = 'action') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random()*1000).toString().padStart(3, '0');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${message}</span>`;
    this.logsContainer.appendChild(entry);
    this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
  }

  initHero() {
    const heroTitle = document.getElementById('hero-title');
    if (!heroTitle) return;
    heroTitle.innerHTML = heroTitle.innerText.split('').map(c => `<span>${c===' '?'&nbsp;':c}</span>`).join('');
    gsap.from("#hero-title span", { y: 100, opacity: 0, rotateX: -90, stagger: 0.05, duration: 1.5, ease: "power4.out" });
    gsap.from("#hero-subtext", { opacity: 0, y: 30, delay: 1, duration: 1.2 });
  }

  initScrollAnimations() {
    gsap.utils.toArray('.section-content, .vision-step').forEach(section => {
        gsap.from(section, { scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" }, y: 50, opacity: 0, duration: 1.2, ease: "power2.out" });
    });
    gsap.utils.toArray('.rag-points li').forEach((li, i) => {
        gsap.from(li, { scrollTrigger: { trigger: li, start: "top 90%" }, x: -30, opacity: 0, delay: i * 0.1, duration: 0.8 });
    });
  }

  initCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    window.addEventListener('mousemove', (e) => {
        gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0 });
        gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
    });
    document.querySelectorAll('a, button, .glass-btn, .accent-btn, input').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
    });
  }

  initLoader() {
    window.onload = () => {
        gsap.to("#loader", { opacity: 0, pointerEvents: 'none', duration: 0.8, delay: 0.5, onComplete: () => { const loader = document.getElementById('loader'); if (loader) loader.style.display = 'none'; } });
    };
  }
}

// BOOTSTRAP
const aether = new AetherField();
const page = new PageEngine();
window.onresize = () => { 
  aether.onResize(); 
  if(page.chaos) page.chaos.resize(); 
  if(page.treeDive) page.treeDive.onResize(); 
  if(page.dynamicTree) page.dynamicTree.onResize();
};
console.log("VectorlessRAG | Final Narrative Rebuild.");
