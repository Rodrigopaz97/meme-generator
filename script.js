// ========================================
// MEME GENERATOR - Full Featured (imgflip-style)
// ========================================

const TEMPLATES = [
    { name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg" },
    { name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
    { name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
    { name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
    { name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg" },
    { name: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg" },
    { name: "One Does Not Simply", url: "https://i.imgflip.com/1bij.jpg" },
    { name: "Bernie Asking", url: "https://i.imgflip.com/4aqua1.jpg" },
    { name: "Buff Doge vs Cheems", url: "https://i.imgflip.com/43a45p.png" },
    { name: "Is This A Pigeon", url: "https://i.imgflip.com/1o00in.jpg" },
    { name: "Batman Slapping", url: "https://i.imgflip.com/9ehk.jpg" },
    { name: "Waiting Skeleton", url: "https://i.imgflip.com/2fm6x.jpg" },
    { name: "Left Exit 12", url: "https://i.imgflip.com/22bdq6.jpg" },
    { name: "Disaster Girl", url: "https://i.imgflip.com/23ls.jpg" },
    { name: "Ancient Aliens", url: "https://i.imgflip.com/26am.jpg" },
    { name: "Surprised Pikachu", url: "https://i.imgflip.com/2kbn1e.jpg" },
    { name: "Clown Applying Makeup", url: "https://i.imgflip.com/38el31.jpg" },
    { name: "Always Has Been", url: "https://i.imgflip.com/46e43q.png" },
    { name: "Trade Offer", url: "https://i.imgflip.com/54hjww.jpg" },
    { name: "Tuxedo Winnie The Pooh", url: "https://i.imgflip.com/2ybua0.png" },
    { name: "Gru's Plan", url: "https://i.imgflip.com/26jxvz.jpg" },
    { name: "They're The Same Picture", url: "https://i.imgflip.com/2za3u1.jpg" },
    { name: "This Is Fine", url: "https://i.imgflip.com/wxica.jpg" },
    { name: "Panik Kalm Panik", url: "https://i.imgflip.com/3qqcim.png" },
];

// ========================================
// STATE
// ========================================
let state = {
    image: null,
    imageEl: null,
    textBoxes: [],
    selectedTextId: null,
    tool: 'select', // 'select' | 'draw'
    drawColor: '#ff0000',
    drawSize: 3,
    drawPaths: [],       // completed draw strokes
    currentPath: null,   // in-progress stroke
    undoStack: [],
    redoStack: [],
    canvasOffset: { x: 0, y: 0 },
    imageRect: { x: 0, y: 0, w: 0, h: 0 },
    isDragging: false,
    dragTarget: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeTarget: null,
};

let nextTextId = 1;

// ========================================
// DOM REFS
// ========================================
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
const placeholder = document.getElementById('canvasPlaceholder');
const overlays = document.getElementById('textBoxOverlays');

// ========================================
// INIT
// ========================================
function init() {
    renderTemplates();
    setupEventListeners();
    resizeCanvas();
    render();
}

// ========================================
// TEMPLATES
// ========================================
function renderTemplates(filter = '') {
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = '';
    const lowerFilter = filter.toLowerCase();

    TEMPLATES.forEach((t, i) => {
        if (lowerFilter && !t.name.toLowerCase().includes(lowerFilter)) return;
        const div = document.createElement('div');
        div.className = 'template-item';
        div.dataset.index = i;
        div.innerHTML = `<img src="${t.url}" alt="${t.name}" crossorigin="anonymous" loading="lazy"><div class="template-name">${t.name}</div>`;
        div.addEventListener('click', () => selectTemplate(i));
        grid.appendChild(div);
    });
}

function selectTemplate(index) {
    const t = TEMPLATES[index];
    document.querySelectorAll('.template-item').forEach(el => el.classList.remove('active'));
    const item = document.querySelector(`.template-item[data-index="${index}"]`);
    if (item) item.classList.add('active');

    loadImageFromUrl(t.url);
}

// ========================================
// IMAGE LOADING
// ========================================
function loadImageFromUrl(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
        state.imageEl = img;
        state.image = url;
        placeholder.classList.add('hidden');
        resizeCanvas();

        // Add default text boxes if none exist
        if (state.textBoxes.length === 0) {
            addTextBox('TEXTO SUPERIOR', 0.5, 0.08);
            addTextBox('TEXTO INFERIOR', 0.5, 0.92);
        }

        render();
    };

    img.onerror = () => {
        // Try with CORS proxy
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.onload = () => {
            state.imageEl = img2;
            state.image = url;
            placeholder.classList.add('hidden');
            resizeCanvas();
            if (state.textBoxes.length === 0) {
                addTextBox('TEXTO SUPERIOR', 0.5, 0.08);
                addTextBox('TEXTO INFERIOR', 0.5, 0.92);
            }
            render();
        };
        img2.onerror = () => {
            alert('Nao foi possivel carregar a imagem. Tente enviar uma imagem local.');
        };
        img2.src = proxyUrl;
    };

    img.src = url;
}

function loadImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.imageEl = img;
            state.image = e.target.result;
            placeholder.classList.add('hidden');
            resizeCanvas();
            if (state.textBoxes.length === 0) {
                addTextBox('TEXTO SUPERIOR', 0.5, 0.08);
                addTextBox('TEXTO INFERIOR', 0.5, 0.92);
            }
            render();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ========================================
// CANVAS SIZING
// ========================================
function resizeCanvas() {
    const wrapper = canvasWrapper;
    const maxW = wrapper.clientWidth - 20;
    const maxH = wrapper.clientHeight - 20;

    if (!state.imageEl) {
        canvas.width = maxW;
        canvas.height = maxH;
        return;
    }

    const imgW = state.imageEl.naturalWidth;
    const imgH = state.imageEl.naturalHeight;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);

    const w = Math.round(imgW * scale);
    const h = Math.round(imgH * scale);

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    state.imageRect = { x: 0, y: 0, w, h };

    // Update canvas offset for overlay positioning
    updateCanvasOffset();
}

function updateCanvasOffset() {
    const rect = canvas.getBoundingClientRect();
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    state.canvasOffset = {
        x: rect.left - wrapperRect.left,
        y: rect.top - wrapperRect.top
    };
}

// ========================================
// TEXT BOXES
// ========================================
function addTextBox(text = '', relX = 0.5, relY = 0.5) {
    const id = nextTextId++;
    const box = {
        id,
        text: text || '',
        relX,        // 0-1 relative to canvas
        relY,        // 0-1 relative to canvas
        fontSize: 40,
        fontFamily: 'Impact',
        color: '#ffffff',
        strokeColor: '#000000',
        strokeSize: 3,
        align: 'center',
        bold: false,
        italic: false,
        uppercase: true,
        shadow: false,
    };
    state.textBoxes.push(box);
    pushUndo();
    selectTextBox(id);
    render();
    return id;
}

function selectTextBox(id) {
    state.selectedTextId = id;
    updateTextControls();
    render();
}

function deleteTextBox(id) {
    pushUndo();
    state.textBoxes = state.textBoxes.filter(b => b.id !== id);
    if (state.selectedTextId === id) {
        state.selectedTextId = null;
    }
    updateTextControls();
    render();
}

function getSelectedBox() {
    return state.textBoxes.find(b => b.id === state.selectedTextId) || null;
}

// ========================================
// RENDER
// ========================================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Image
    if (state.imageEl) {
        ctx.drawImage(state.imageEl, 0, 0, canvas.width, canvas.height);
    }

    // Draw paths
    state.drawPaths.forEach(path => drawPath(path));
    if (state.currentPath) drawPath(state.currentPath);

    // Text boxes
    state.textBoxes.forEach(box => renderTextBox(box));

    // Update overlays
    renderOverlays();
}

function drawPath(path) {
    if (path.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
}

function renderTextBox(box) {
    const x = box.relX * canvas.width;
    const y = box.relY * canvas.height;

    const displayText = box.uppercase ? box.text.toUpperCase() : box.text;
    if (!displayText) return;

    const fontStyle = (box.italic ? 'italic ' : '') + (box.bold ? 'bold ' : '');
    ctx.font = `${fontStyle}${box.fontSize}px "${box.fontFamily}"`;
    ctx.textAlign = box.align;
    ctx.textBaseline = 'middle';

    // Word wrap
    const maxWidth = canvas.width * 0.9;
    const lines = wrapText(ctx, displayText, maxWidth);
    const lineHeight = box.fontSize * 1.15;
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
        const ly = startY + i * lineHeight;

        // Shadow
        if (box.shadow) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText(line, x + 3, ly + 3);
        }

        // Stroke
        if (box.strokeSize > 0) {
            ctx.strokeStyle = box.strokeColor;
            ctx.lineWidth = box.strokeSize * 2;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(line, x, ly);
        }

        // Fill
        ctx.fillStyle = box.color;
        ctx.fillText(line, x, ly);
    });
}

function wrapText(ctx, text, maxWidth) {
    // Handle newlines
    const paragraphs = text.split('\n');
    const allLines = [];

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let line = '';

        words.forEach(word => {
            const testLine = line ? line + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line) {
                allLines.push(line);
                line = word;
            } else {
                line = testLine;
            }
        });
        allLines.push(line);
    });

    return allLines;
}

// ========================================
// OVERLAYS (drag handles on top of canvas)
// ========================================
function renderOverlays() {
    updateCanvasOffset();
    overlays.innerHTML = '';

    state.textBoxes.forEach(box => {
        const x = box.relX * canvas.width + state.canvasOffset.x;
        const y = box.relY * canvas.height + state.canvasOffset.y;
        const displayText = box.uppercase ? box.text.toUpperCase() : box.text;

        // Measure text width for the overlay
        const fontStyle = (box.italic ? 'italic ' : '') + (box.bold ? 'bold ' : '');
        ctx.font = `${fontStyle}${box.fontSize}px "${box.fontFamily}"`;
        const maxWidth = canvas.width * 0.9;
        const lines = wrapText(ctx, displayText || 'Texto', maxWidth);
        const lineHeight = box.fontSize * 1.15;
        const totalH = Math.max(lines.length * lineHeight, 30);

        let maxLineW = 60;
        lines.forEach(l => {
            const w = ctx.measureText(l).width;
            if (w > maxLineW) maxLineW = w;
        });
        const totalW = Math.max(maxLineW + 20, 60);

        const isSelected = box.id === state.selectedTextId;

        const div = document.createElement('div');
        div.className = 'text-overlay' + (isSelected ? ' selected' : '');
        div.style.left = (x - totalW / 2) + 'px';
        div.style.top = (y - totalH / 2) + 'px';
        div.style.width = totalW + 'px';
        div.style.height = totalH + 'px';
        div.dataset.textId = box.id;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.dataset.textId = box.id;
        div.appendChild(handle);

        overlays.appendChild(div);
    });
}

// ========================================
// TEXT CONTROLS (sidebar)
// ========================================
function updateTextControls() {
    const box = getSelectedBox();
    const activeControls = document.getElementById('activeTextControls');
    const noTextHint = document.getElementById('noTextHint');

    if (!box) {
        activeControls.style.display = 'none';
        noTextHint.style.display = 'block';
        return;
    }

    activeControls.style.display = 'block';
    noTextHint.style.display = 'none';

    document.getElementById('activeText').value = box.text;
    document.getElementById('textColor').value = box.color;
    document.getElementById('strokeColor').value = box.strokeColor;
    document.getElementById('textSizeRange').value = box.fontSize;
    document.getElementById('textSizeVal').textContent = box.fontSize;
    document.getElementById('strokeSize').value = box.strokeSize;
    document.getElementById('strokeSizeVal').textContent = box.strokeSize;
    document.getElementById('fontFamily').value = box.fontFamily;

    // Align buttons
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === box.align);
    });

    // Style buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        const s = btn.dataset.style;
        if (s === 'bold') btn.classList.toggle('active', box.bold);
        if (s === 'italic') btn.classList.toggle('active', box.italic);
        if (s === 'uppercase') btn.classList.toggle('active', box.uppercase);
        if (s === 'shadow') btn.classList.toggle('active', box.shadow);
    });
}

function updateBoxFromControls() {
    const box = getSelectedBox();
    if (!box) return;

    box.text = document.getElementById('activeText').value;
    box.color = document.getElementById('textColor').value;
    box.strokeColor = document.getElementById('strokeColor').value;
    box.fontSize = parseInt(document.getElementById('textSizeRange').value);
    box.strokeSize = parseInt(document.getElementById('strokeSize').value);
    box.fontFamily = document.getElementById('fontFamily').value;

    document.getElementById('textSizeVal').textContent = box.fontSize;
    document.getElementById('strokeSizeVal').textContent = box.strokeSize;

    render();
}

// ========================================
// UNDO / REDO
// ========================================
function pushUndo() {
    state.undoStack.push({
        textBoxes: JSON.parse(JSON.stringify(state.textBoxes)),
        drawPaths: JSON.parse(JSON.stringify(state.drawPaths)),
    });
    if (state.undoStack.length > 50) state.undoStack.shift();
    state.redoStack = [];
}

function undo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push({
        textBoxes: JSON.parse(JSON.stringify(state.textBoxes)),
        drawPaths: JSON.parse(JSON.stringify(state.drawPaths)),
    });
    const prev = state.undoStack.pop();
    state.textBoxes = prev.textBoxes;
    state.drawPaths = prev.drawPaths;
    state.selectedTextId = null;
    updateTextControls();
    render();
}

function redo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push({
        textBoxes: JSON.parse(JSON.stringify(state.textBoxes)),
        drawPaths: JSON.parse(JSON.stringify(state.drawPaths)),
    });
    const next = state.redoStack.pop();
    state.textBoxes = next.textBoxes;
    state.drawPaths = next.drawPaths;
    state.selectedTextId = null;
    updateTextControls();
    render();
}

// ========================================
// DOWNLOAD & COPY
// ========================================
function downloadMeme() {
    if (!state.imageEl) {
        alert('Carregue uma imagem primeiro!');
        return;
    }

    // Render at full resolution
    const fullCanvas = document.createElement('canvas');
    const fullCtx = fullCanvas.getContext('2d');
    const imgW = state.imageEl.naturalWidth;
    const imgH = state.imageEl.naturalHeight;
    fullCanvas.width = imgW;
    fullCanvas.height = imgH;

    // Draw image at full size
    fullCtx.drawImage(state.imageEl, 0, 0, imgW, imgH);

    // Scale factor from display to full
    const scaleX = imgW / canvas.width;
    const scaleY = imgH / canvas.height;

    // Draw paths scaled
    state.drawPaths.forEach(path => {
        if (path.points.length < 2) return;
        fullCtx.beginPath();
        fullCtx.strokeStyle = path.color;
        fullCtx.lineWidth = path.size * scaleX;
        fullCtx.lineCap = 'round';
        fullCtx.lineJoin = 'round';
        fullCtx.moveTo(path.points[0].x * scaleX, path.points[0].y * scaleY);
        for (let i = 1; i < path.points.length; i++) {
            fullCtx.lineTo(path.points[i].x * scaleX, path.points[i].y * scaleY);
        }
        fullCtx.stroke();
    });

    // Draw text boxes at full res
    state.textBoxes.forEach(box => {
        const x = box.relX * imgW;
        const y = box.relY * imgH;
        const fontSize = box.fontSize * scaleX;
        const displayText = box.uppercase ? box.text.toUpperCase() : box.text;
        if (!displayText) return;

        const fontStyle = (box.italic ? 'italic ' : '') + (box.bold ? 'bold ' : '');
        fullCtx.font = `${fontStyle}${fontSize}px "${box.fontFamily}"`;
        fullCtx.textAlign = box.align;
        fullCtx.textBaseline = 'middle';

        const maxWidth = imgW * 0.9;
        const lines = wrapText(fullCtx, displayText, maxWidth);
        const lineHeight = fontSize * 1.15;
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;

        lines.forEach((line, i) => {
            const ly = startY + i * lineHeight;
            if (box.shadow) {
                fullCtx.fillStyle = 'rgba(0,0,0,0.6)';
                fullCtx.fillText(line, x + 3 * scaleX, ly + 3 * scaleY);
            }
            if (box.strokeSize > 0) {
                fullCtx.strokeStyle = box.strokeColor;
                fullCtx.lineWidth = box.strokeSize * 2 * scaleX;
                fullCtx.lineJoin = 'round';
                fullCtx.miterLimit = 2;
                fullCtx.strokeText(line, x, ly);
            }
            fullCtx.fillStyle = box.color;
            fullCtx.fillText(line, x, ly);
        });
    });

    // Download
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = fullCanvas.toDataURL('image/png');
    link.click();
}

async function copyMeme() {
    if (!state.imageEl) {
        alert('Carregue uma imagem primeiro!');
        return;
    }

    try {
        // Use the currently rendered canvas
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                const btn = document.getElementById('copyBtn');
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                setTimeout(() => btn.innerHTML = original, 2000);
            } catch (e) {
                alert('Nao foi possivel copiar. Tente baixar a imagem.');
            }
        }, 'image/png');
    } catch (e) {
        alert('Nao foi possivel copiar. Tente baixar a imagem.');
    }
}

// ========================================
// RESET
// ========================================
function resetAll() {
    state.image = null;
    state.imageEl = null;
    state.textBoxes = [];
    state.selectedTextId = null;
    state.drawPaths = [];
    state.currentPath = null;
    state.undoStack = [];
    state.redoStack = [];
    placeholder.classList.remove('hidden');
    document.querySelectorAll('.template-item').forEach(el => el.classList.remove('active'));
    document.getElementById('imageUpload').value = '';
    document.getElementById('imageUrl').value = '';
    updateTextControls();
    resizeCanvas();
    render();
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Template search
    document.getElementById('templateSearch').addEventListener('input', (e) => {
        renderTemplates(e.target.value);
    });

    // Image upload
    document.getElementById('imageUpload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadImageFromFile(file);
    });

    // URL load
    document.getElementById('loadUrlBtn').addEventListener('click', () => {
        const url = document.getElementById('imageUrl').value.trim();
        if (url) loadImageFromUrl(url);
    });

    document.getElementById('imageUrl').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const url = e.target.value.trim();
            if (url) loadImageFromUrl(url);
        }
    });

    // Tool buttons
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.tool = btn.dataset.tool;
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('drawSizeControl').style.display = state.tool === 'draw' ? 'flex' : 'none';
            canvas.style.cursor = state.tool === 'draw' ? 'crosshair' : 'default';
        });
    });

    // Add text
    document.getElementById('addTextBtn').addEventListener('click', () => {
        addTextBox('', 0.5, 0.5);
    });

    // Undo / Redo
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);

    // Draw controls
    document.getElementById('drawColor').addEventListener('input', (e) => {
        state.drawColor = e.target.value;
    });
    document.getElementById('drawSize').addEventListener('input', (e) => {
        state.drawSize = parseInt(e.target.value);
    });

    // Text controls
    document.getElementById('activeText').addEventListener('input', updateBoxFromControls);
    document.getElementById('textColor').addEventListener('input', updateBoxFromControls);
    document.getElementById('strokeColor').addEventListener('input', updateBoxFromControls);
    document.getElementById('textSizeRange').addEventListener('input', updateBoxFromControls);
    document.getElementById('strokeSize').addEventListener('input', updateBoxFromControls);
    document.getElementById('fontFamily').addEventListener('change', updateBoxFromControls);

    // Align buttons
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const box = getSelectedBox();
            if (!box) return;
            box.align = btn.dataset.align;
            document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render();
        });
    });

    // Style buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const box = getSelectedBox();
            if (!box) return;
            const s = btn.dataset.style;
            box[s] = !box[s];
            btn.classList.toggle('active', box[s]);
            render();
        });
    });

    // Delete text
    document.getElementById('deleteTextBtn').addEventListener('click', () => {
        if (state.selectedTextId) deleteTextBox(state.selectedTextId);
    });

    // Download / Copy
    document.getElementById('downloadBtn').addEventListener('click', downloadMeme);
    document.getElementById('copyBtn').addEventListener('click', copyMeme);

    // Reset
    document.getElementById('resetBtn').addEventListener('click', resetAll);

    // Canvas mouse events for drawing and drag
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('mouseleave', onCanvasMouseUp);

    // Touch support
    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd);

    // Overlay drag events (for text box dragging)
    overlays.addEventListener('mousedown', onOverlayMouseDown);
    overlays.addEventListener('touchstart', onOverlayTouchStart, { passive: false });
    document.addEventListener('mousemove', onOverlayDragMove);
    document.addEventListener('mouseup', onOverlayDragEnd);
    document.addEventListener('touchmove', onOverlayDragMoveTouch, { passive: false });
    document.addEventListener('touchend', onOverlayDragEnd);

    // Click to deselect
    canvasWrapper.addEventListener('mousedown', (e) => {
        if (e.target === canvasWrapper || e.target === canvas) {
            if (state.tool === 'select') {
                state.selectedTextId = null;
                updateTextControls();
                render();
            }
        }
    });

    // Resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        render();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selectedTextId) {
                e.preventDefault();
                deleteTextBox(state.selectedTextId);
            }
        }
    });
}

// ========================================
// CANVAS MOUSE/TOUCH - DRAWING
// ========================================
function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
}

function onCanvasMouseDown(e) {
    if (state.tool !== 'draw') return;
    const pos = getCanvasPos(e);
    pushUndo();
    state.currentPath = {
        color: state.drawColor,
        size: state.drawSize,
        points: [pos],
    };
}

function onCanvasMouseMove(e) {
    if (state.tool !== 'draw' || !state.currentPath) return;
    const pos = getCanvasPos(e);
    state.currentPath.points.push(pos);
    render();
}

function onCanvasMouseUp(e) {
    if (state.currentPath) {
        state.drawPaths.push(state.currentPath);
        state.currentPath = null;
        render();
    }
}

function onCanvasTouchStart(e) {
    if (state.tool !== 'draw') return;
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch);
    pushUndo();
    state.currentPath = {
        color: state.drawColor,
        size: state.drawSize,
        points: [pos],
    };
}

function onCanvasTouchMove(e) {
    if (state.tool !== 'draw' || !state.currentPath) return;
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch);
    state.currentPath.points.push(pos);
    render();
}

function onCanvasTouchEnd(e) {
    if (state.currentPath) {
        state.drawPaths.push(state.currentPath);
        state.currentPath = null;
        render();
    }
}

// ========================================
// OVERLAY DRAG (text box movement)
// ========================================
function onOverlayMouseDown(e) {
    const overlay = e.target.closest('.text-overlay');
    if (!overlay) return;

    const textId = parseInt(overlay.dataset.textId);

    // Check if it's the resize handle
    if (e.target.classList.contains('resize-handle')) {
        state.isResizing = true;
        state.resizeTarget = textId;
        selectTextBox(textId);
        pushUndo();
        e.preventDefault();
        return;
    }

    selectTextBox(textId);
    pushUndo();

    state.isDragging = true;
    state.dragTarget = textId;

    const box = state.textBoxes.find(b => b.id === textId);
    const px = box.relX * canvas.width + state.canvasOffset.x;
    const py = box.relY * canvas.height + state.canvasOffset.y;

    state.dragOffset = {
        x: e.clientX - canvasWrapper.getBoundingClientRect().left - px,
        y: e.clientY - canvasWrapper.getBoundingClientRect().top - py,
    };

    e.preventDefault();
}

function onOverlayTouchStart(e) {
    const overlay = e.target.closest('.text-overlay');
    if (!overlay) return;

    const textId = parseInt(overlay.dataset.textId);
    selectTextBox(textId);
    pushUndo();

    const touch = e.touches[0];
    state.isDragging = true;
    state.dragTarget = textId;

    const box = state.textBoxes.find(b => b.id === textId);
    const px = box.relX * canvas.width + state.canvasOffset.x;
    const py = box.relY * canvas.height + state.canvasOffset.y;

    state.dragOffset = {
        x: touch.clientX - canvasWrapper.getBoundingClientRect().left - px,
        y: touch.clientY - canvasWrapper.getBoundingClientRect().top - py,
    };

    e.preventDefault();
}

function onOverlayDragMove(e) {
    if (state.isResizing) {
        const box = state.textBoxes.find(b => b.id === state.resizeTarget);
        if (!box) return;
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        // Distance from text center to mouse
        const cx = box.relX * canvas.width + state.canvasOffset.x;
        const cy = box.relY * canvas.height + state.canvasOffset.y;
        const mx = e.clientX - wrapperRect.left;
        const my = e.clientY - wrapperRect.top;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);

        // Map distance to font size
        const newSize = Math.round(Math.max(12, Math.min(120, dist * 0.8)));
        box.fontSize = newSize;
        document.getElementById('textSizeRange').value = newSize;
        document.getElementById('textSizeVal').textContent = newSize;
        render();
        return;
    }

    if (!state.isDragging || !state.dragTarget) return;

    const box = state.textBoxes.find(b => b.id === state.dragTarget);
    if (!box) return;

    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const newX = e.clientX - wrapperRect.left - state.dragOffset.x - state.canvasOffset.x;
    const newY = e.clientY - wrapperRect.top - state.dragOffset.y - state.canvasOffset.y;

    box.relX = Math.max(0, Math.min(1, newX / canvas.width));
    box.relY = Math.max(0, Math.min(1, newY / canvas.height));

    render();
}

function onOverlayDragMoveTouch(e) {
    if (!state.isDragging || !state.dragTarget) return;
    e.preventDefault();

    const touch = e.touches[0];
    const box = state.textBoxes.find(b => b.id === state.dragTarget);
    if (!box) return;

    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const newX = touch.clientX - wrapperRect.left - state.dragOffset.x - state.canvasOffset.x;
    const newY = touch.clientY - wrapperRect.top - state.dragOffset.y - state.canvasOffset.y;

    box.relX = Math.max(0, Math.min(1, newX / canvas.width));
    box.relY = Math.max(0, Math.min(1, newY / canvas.height));

    render();
}

function onOverlayDragEnd() {
    state.isDragging = false;
    state.dragTarget = null;
    state.isResizing = false;
    state.resizeTarget = null;
}

// ========================================
// START
// ========================================
document.addEventListener('DOMContentLoaded', init);
