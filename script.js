let img = null;
let canvas;
let topText = '';
let bottomText = '';
let textColor = '#ffffff';
let textSize = 40;
let fontFamily = 'Impact';
let topTextY = 60;
let bottomTextY = 0;
let savedMemes = [];

function setup() {
    let container = document.getElementById('p5-container');
    canvas = createCanvas(500, 500);
    canvas.parent(container);
    
    loadSavedMemes();
    setupEventListeners();
}

function draw() {
    background(240);
    
    if (img) {
        let scale = Math.min(width / img.width, height / img.height);
        let w = img.width * scale;
        let h = img.height * scale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        image(img, x, y, w, h);
        
        drawMemeText(x, y, w, h);
    } else {
        fill(150);
        textAlign(CENTER, CENTER);
        textSize(18);
        text('Escolha um template ou envie uma imagem', width / 2, height / 2);
    }
}

function drawMemeText(imgX, imgY, imgW, imgH) {
    if (!topText && !bottomText) return;
    
    textAlign(CENTER);
    textFont(fontFamily);
    textSize(textSize);
    
    if (topText) {
        let topY = imgY + 40;
        
        stroke(0);
        strokeWeight(4);
        fill(0, 0, 0, 100);
        text(topText.toUpperCase(), width / 2, topY);
        
        fill(textColor);
        stroke(0);
        strokeWeight(3);
        text(topText.toUpperCase(), width / 2, topY);
        
        topTextY = topY;
    }
    
    if (bottomText) {
        let bottomY = imgY + imgH - 30;
        
        stroke(0);
        strokeWeight(4);
        fill(0, 0, 0, 100);
        text(bottomText.toUpperCase(), width / 2, bottomY);
        
        fill(textColor);
        stroke(0);
        strokeWeight(3);
        text(bottomText.toUpperCase(), width / 2, bottomY);
        
        bottomTextY = bottomY;
    }
    
    noStroke();
}

function setupEventListeners() {
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            let url = this.dataset.url;
            loadTemplateImage(url);
        });
    });
    
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            let reader = new FileReader();
            reader.onload = (event) => {
                loadImage(event.target.result, (loadedImg) => {
                    img = loadedImg;
                });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('topText').addEventListener('input', function() {
        topText = this.value;
    });
    
    document.getElementById('bottomText').addEventListener('input', function() {
        bottomText = this.value;
    });
    
    document.getElementById('textColor').addEventListener('input', function() {
        textColor = this.value;
        document.getElementById('colorHex').textContent = this.value.toUpperCase();
    });
    
    document.getElementById('textSize').addEventListener('input', function() {
        textSize = parseInt(this.value);
        document.getElementById('sizeValue').textContent = this.value;
    });
    
    document.getElementById('fontFamily').addEventListener('change', function() {
        fontFamily = this.value;
    });
    
    document.getElementById('downloadBtn').addEventListener('click', function() {
        if (!img) {
            alert('Escolha uma imagem primeiro!');
            return;
        }
        saveCanvas(canvas, 'meme');
    });
    
    document.getElementById('resetBtn').addEventListener('click', function() {
        topText = '';
        bottomText = '';
        textColor = '#ffffff';
        textSize = 40;
        fontFamily = 'Impact';
        img = null;
        
        document.getElementById('topText').value = '';
        document.getElementById('bottomText').value = '';
        document.getElementById('textColor').value = '#ffffff';
        document.getElementById('textSize').value = '40';
        document.getElementById('fontFamily').value = 'Impact';
        document.getElementById('colorHex').textContent = '#FFFFFF';
        document.getElementById('sizeValue').textContent = '40';
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
    });
    
    document.getElementById('saveMemeBtn').addEventListener('click', function() {
        if (!img) {
            alert('Crie um meme antes de salvar!');
            return;
        }
        
        let meme = {
            id: Date.now(),
            title: `${topText || 'Sem título'} / ${bottomText || ''}`,
            imageData: canvas.canvas.toDataURL(),
            savedAt: new Date().toLocaleString()
        };
        
        savedMemes.unshift(meme);
        if (savedMemes.length > 20) savedMemes.pop();
        persistSavedMemes();
        renderSavedMemes();
        alert('✅ Meme salvo com sucesso!');
    });
}

function loadTemplateImage(url) {
    loadImage(url, (loadedImg) => {
        img = loadedImg;
    }, () => {
        alert('Erro ao carregar template. Tente importar uma imagem.');
    });
}

function loadSavedMemes() {
    let stored = localStorage.getItem('memeDB');
    if (stored) {
        try {
            savedMemes = JSON.parse(stored);
            renderSavedMemes();
        } catch (e) {
            console.error('Erro ao carregar memes:', e);
        }
    }
}

function persistSavedMemes() {
    localStorage.setItem('memeDB', JSON.stringify(savedMemes));
}

function renderSavedMemes() {
    let list = document.getElementById('memeList');
    list.innerHTML = '';
    
    if (savedMemes.length === 0) {
        list.innerHTML = '<li style=\"text-align: center; padding: 20px; color: #999;\">Nenhum meme salvo ainda</li>';
        return;
    }
    
    savedMemes.forEach(meme => {
        let li = document.createElement('li');
        
        let img_thumb = document.createElement('img');
        img_thumb.src = meme.imageData;
        
        let info = document.createElement('div');
        info.style.flex = '1';
        info.style.fontSize = '13px';
        info.innerHTML = `<div style=\"font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\">${meme.title}</div><div style=\"color: #999; font-size: 11px;\">${meme.savedAt}</div>`;
        
        let loadBtn = document.createElement('button');
        loadBtn.textContent = 'Carrega';
        loadBtn.onclick = () => {
            loadImage(meme.imageData, (loadedImg) => {
                img = loadedImg;
            });
        };
        
        let deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Deletado';
        deleteBtn.style.background = '#e74c3c';
        deleteBtn.style.marginLeft = '4px';
        deleteBtn.onclick = () => {
            savedMemes = savedMemes.filter(m => m.id !== meme.id);
            persistSavedMemes();
            renderSavedMemes();
        };
        
        li.appendChild(img_thumb);
        li.appendChild(info);
        li.appendChild(loadBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}