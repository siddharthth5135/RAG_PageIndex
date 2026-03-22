import gsap from 'gsap';

const API_BASE = 'http://localhost:8000';
let currentDocId = null;
let graphData = { nodes: [], edges: [] };

// DOM Selectors
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const queryInput = document.getElementById('queryInput');
const searchBtn = document.getElementById('searchBtn');
const agentLogs = document.getElementById('agent-logs');
const svg = document.getElementById('main-svg');
const statusLabel = document.querySelector('.status-chip .label');
const emptyState = document.getElementById('empty-state');
const resultOverlay = document.getElementById('result-overlay');
const resultContent = document.getElementById('resultContent');
const closeOverlay = document.getElementById('closeOverlay');

// Initial Setup
const init = () => {
    addLog('[SYSTEM]: Neural Nexus v1.0 optimized.', 'system');
    addLog('[SYSTEM]: READY FOR DATA INGESTION.', 'system');
    
    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = handleFileUpload;
    searchBtn.onclick = handleSearch;
    queryInput.onkeydown = (e) => e.key === 'Enter' && handleSearch();
    closeOverlay.onclick = () => resultOverlay.classList.add('hidden');
};

// Log Helper
const addLog = (msg, type = 'default') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span style="opacity:0.4">[${time}]</span> ${msg}`;
    agentLogs.appendChild(entry);
    agentLogs.scrollTop = agentLogs.scrollHeight;
};

// 1. File Upload Handler
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    statusLabel.innerText = 'STATUS: UPLOADING';
    addLog(`[UPLOADER]: Starting transfer of ${file.name}...`, 'system');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'ollama/qwen2.5-coder:7b');

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            currentDocId = data.doc_id;
            graphData = data.graph;
            addLog(`[SYSTEM]: Ingestion Complete. Found ${graphData.nodes.length} structural nodes.`, 'system');
            statusLabel.innerText = 'STATUS: READY';
            renderRadialGraph();
        } else {
            addLog(`[ERROR]: ${data.message}`, 'error');
            statusLabel.innerText = 'STATUS: ERROR';
        }
    } catch (err) {
        addLog(`[CRITICAL]: Failed to connect to backend.`, 'error');
    }
}

// 2. SVG Radial Graph (Futuristic Layout)
function renderRadialGraph() {
    gsap.to(emptyState, { opacity: 0, duration: 0.5 });
    svg.innerHTML = '';
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodesWithPos = graphData.nodes.map((node, i) => {
        // Radial distribution based on level
        const radius = 50 + (node.level * 100);
        const angle = (i / graphData.nodes.length) * Math.PI * 2;
        return {
            ...node,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    });

    // Draw Edges First
    graphData.edges.forEach(edge => {
        const source = nodesWithPos[edge.source];
        const target = nodesWithPos[edge.target];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', source.x); line.setAttribute('y1', source.y);
        line.setAttribute('x2', target.x); line.setAttribute('y2', target.y);
        line.setAttribute('stroke', 'rgba(0, 240, 255, 0.08)');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    });

    // Draw Nodes
    nodesWithPos.forEach((node, i) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute('id', `node-${node.real_id}`);
        g.setAttribute('class', 'node-group');

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 6 - node.level);
        circle.setAttribute('fill', node.level === 0 ? '#8A2BE2' : '#00f0ff');
        circle.setAttribute('filter', 'drop-shadow(0 0 5px #00f0ff)');

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', node.x + 8);
        text.setAttribute('y', node.y + 3);
        text.setAttribute('fill', '#849495');
        text.setAttribute('font-size', '8px');
        text.setAttribute('font-family', 'Space Grotesk');
        text.textContent = node.label.substring(0, 20);

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);

        // Enter Animation
        gsap.from(g, { opacity: 0, scale: 0, duration: 1, delay: i * 0.02, ease: "elastic.out(1, 0.5)" });
        
        // Liquid Floating (Orbital)
        gsap.to(g, {
            x: "+=" + (Math.random() * 20 - 10),
            y: "+=" + (Math.random() * 20 - 10),
            duration: 3 + Math.random() * 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });
}

// 3. Search & Agent Traversal Animation
async function handleSearch() {
    const q = queryInput.value.trim();
    if (!q || !currentDocId) return;

    addLog(`[QUERY]: "${q}"`, 'system');
    statusLabel.innerText = 'STATUS: REASONING';
    
    // UI Scanning Animation
    gsap.to('.scanning-light', { opacity: 1, left: "100%", duration: 1.5, repeat: -1, ease: "power1.inOut" });

    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: q,
                doc_name: currentDocId,
                model: 'ollama/qwen2.5-coder:7b'
            })
        });
        const data = await response.json();

        if (data.status === 'success') {
            await animateTrace(data.result.trace);
            addLog(`[AGENT]: Synthesis complete. Heading to visual overlay.`, 'system');
            showResult(data.result.answer);
        }
    } catch (err) {
        addLog(`[ERROR]: Retrieval failed.`, 'error');
    } finally {
        statusLabel.innerText = 'STATUS: READY';
        gsap.killTweensOf('.scanning-light');
        gsap.set('.scanning-light', { opacity: 0, left: 0 });
    }
}

// 4. Trace Animation Logic
async function animateTrace(trace) {
    for (const step of trace) {
        if (step.action === 'evaluating') {
            addLog(`[BRAIN]: Evaluating cluster focus: ${step.nodes.length} nodes identified.`, 'llm');
            step.node_ids.forEach(id => highlightNode(id, '#8A2BE2', 1500));
            await delay(600);
        } else if (step.action === 'llm_decision') {
            addLog(`[DECISION]: Pruning branches. Kept ${step.chosen_ids.length} relevant paths.`, 'system');
            step.chosen_ids.forEach(id => highlightNode(id, '#00f0ff', 2000, true));
            await delay(800);
        } else if (step.action === 'drill_down') {
            addLog(`[TRAVERSAL]: Indexing sub-section: "${step.title}"`, 'system');
        }
    }
}

function highlightNode(id, color, duration, pulse = false) {
    const el = document.getElementById(`node-${id}`);
    if (!el) return;
    const circle = el.querySelector('circle');
    gsap.to(circle, { fill: color, r: pulse ? 12 : 8, duration: 0.4 });
    if (pulse) {
        gsap.to(circle, { r: 6, duration: 0.8, repeat: 1, yoyo: true });
    }
    // Fade back
    setTimeout(() => {
        gsap.to(circle, { fill: '#00f0ff', r: 5, duration: 1 });
    }, duration);
}

function showResult(answer) {
    resultOverlay.classList.remove('hidden');
    resultContent.innerHTML = '';
    
    // Typewriter effect
    const words = answer.split(' ');
    words.forEach((word, i) => {
        const span = document.createElement('span');
        span.textContent = word + ' ';
        span.style.opacity = 0;
        resultContent.appendChild(span);
        gsap.to(span, { opacity: 1, duration: 0.1, delay: i * 0.05 });
    });
}

const delay = ms => new Promise(reg => setTimeout(reg, ms));

init();
