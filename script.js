let img = null;
let p5Canvas = null;
let topText = '';
let bottomText = '';
let textColor = '#ffffff';
let textSize = 40;
let fontFamily = 'Impact';
let savedMemes = [];

function setup() {
    let container = document.getElementById('canvas-container');
    if (container) {
        p5Canvas = createCanvas(600, 600);
        p5Canvas.parent('canvas-container');
        
        // Delay para garantir DOM pronto
        setTimeout(() => {
            loadSavedMemes();
            setupEventListeners();
        }, 100);
    }
}

function draw() {
    background(240);
    
    if (img) {
        let maxWidth = 580;
        let maxHeight = 580;
        let scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        let w = img.width * scale;
        let h = img.height * scale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;
        
        // Desenhar a imagem
        image(img, x, y, w, h);
        
        // Desenhar o texto sobre a imagem
        drawMemeText(x, y, w, h);
    } else {
        // Mensagem quando nenhuma imagem está carregada
        fill(150);
        textAlign(CENTER, CENTER);
        textSize(16);
        textFont('Arial');
        text('Escolha um template ou envie uma imagem', width / 2, height / 2);
    }
}

function drawMemeText(imgX, imgY, imgW, imgH) {
    textAlign(CENTER);
    textFont(fontFamily);
    textSize(textSize);
    
    if (topText) {
        stroke(0);
        strokeWeight(4);
        fill(textColor);
        text(topText.toUpperCase(), width / 2, imgY + 50);
    }
    
    if (bottomText) {
        stroke(0);
        strokeWeight(4);
        fill(textColor);
        text(bottomText.toUpperCase(), width / 2, imgY + imgH - 30);
    }
}

function setupEventListeners() {
    // Template selection
    const templateItems = document.querySelectorAll('.template-item');
    templateItems.forEach(item => {
        item.addEventListener('click', () => {
            templateItems.forEach(t => t.classList.remove('active'));
            item.classList.add('active');
            const url = item.dataset.url;
            loadTemplateImage(url);
        });
    });

    // Image upload
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                loadImage(event.target.result, (loadedImg) => {
                    img = loadedImg;
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Text inputs
    document.getElementById('topText').addEventListener('input', (e) => {
        topText = e.target.value;
    });

    document.getElementById('bottomText').addEventListener('input', (e) => {
        bottomText = e.target.value;
    });

    // Color input
    document.getElementById('textColor').addEventListener('input', (e) => {
        textColor = e.target.value;
    });

    // Size input
    document.getElementById('textSize').addEventListener('input', (e) => {
        textSize = parseInt(e.target.value);
    });

    // Font input
    document.getElementById('fontFamily').addEventListener('change', (e) => {
        fontFamily = e.target.value;
    });

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (img) {
            saveCanvas(p5Canvas, 'meme');
        } else {
            alert('Por favor, carregue uma imagem primeiro!');
        }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        img = null;
        topText = '';
        bottomText = '';
        textColor = '#ffffff';
        textSize = 40;
        fontFamily = 'Impact';
        
        document.getElementById('imageUpload').value = '';
        document.getElementById('topText').value = '';
        document.getElementById('bottomText').value = '';
        document.getElementById('textColor').value = '#ffffff';
        document.getElementById('textSize').value = '40';
        document.getElementById('fontFamily').value = 'Impact';
        
        // Remove active state from templates
        document.querySelectorAll('.template-item').forEach(t => t.classList.remove('active'));
    });

    // Save meme button
    document.getElementById('saveMemeBtn').addEventListener('click', () => {
        if (img && (topText || bottomText)) {
            const dataUrl = p5Canvas.canvas.toDataURL();
            const meme = {
                id: Date.now(),
                image: dataUrl,
                topText,
                bottomText,
                textColor,
                textSize,
                fontFamily
            };
            
            savedMemes.push(meme);
            if (savedMemes.length > 20) {
                savedMemes = savedMemes.slice(-20);
            }
            
            persistSavedMemes();
            renderSavedMemes();
            alert('Meme salvo com sucesso!');
        } else {
            alert('Carregue uma imagem e adicione algum texto!');
        }
    });
}

function loadTemplateImage(url) {
    // Usar corsproxy.io como fallback para CORS
    const corsUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    
    loadImage(corsUrl, 
        (loadedImg) => {
            img = loadedImg;
            console.log('✓ Template carregado:', url);
        },
        (error) => {
            console.error('Erro ao carregar template:', url, error);
            // Fallback: tentar a URL original
            loadImage(url,
                (loadedImg) => {
                    img = loadedImg;
                    console.log('✓ Imagem carregada (sem proxy)');
                },
                (err2) => {
                    console.error('Falha completa:', err2);
                    alert('⚠️ Não foi possível carregar este template. Envie sua própria imagem.');
                }
            );
        }
    );
}

function loadSavedMemes() {
    const stored = localStorage.getItem('memeDB');
    if (stored) {
        try {
            savedMemes = JSON.parse(stored);
        } catch (e) {
            savedMemes = [];
        }
    }
    renderSavedMemes();
}

function persistSavedMemes() {
    localStorage.setItem('memeDB', JSON.stringify(savedMemes));
}

function renderSavedMemes() {
    const memeList = document.getElementById('memeList');
    memeList.innerHTML = '';
    
    savedMemes.forEach((meme) => {
        const li = document.createElement('li');
        
        const imgEl = document.createElement('img');
        imgEl.src = meme.image;
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '4px';
        
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Carregar';
        loadBtn.addEventListener('click', () => {
            topText = meme.topText;
            bottomText = meme.bottomText;
            textColor = meme.textColor;
            textSize = meme.textSize;
            fontFamily = meme.fontFamily;
            
            document.getElementById('topText').value = topText;
            document.getElementById('bottomText').value = bottomText;
            document.getElementById('textColor').value = textColor;
            document.getElementById('textSize').value = textSize;
            document.getElementById('fontFamily').value = fontFamily;
            
            loadImage(meme.image, (loadedImg) => {
                img = loadedImg;
            });
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Deletar';
        deleteBtn.addEventListener('click', () => {
            savedMemes = savedMemes.filter((m) => m.id !== meme.id);
            persistSavedMemes();
            renderSavedMemes();
        });
        
        li.appendChild(imgEl);
        buttonsDiv.appendChild(loadBtn);
        buttonsDiv.appendChild(deleteBtn);
        li.appendChild(buttonsDiv);
        memeList.appendChild(li);
    });
}