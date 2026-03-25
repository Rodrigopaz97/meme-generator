let img;
let canvas;
let topText = '';
let bottomText = '';
let textColor = '#ffffff';
let textSize = 30;
let fontFamily = 'Arial';
let topTextX = 0;
let topTextY = 50;
let bottomTextX = 0;
let bottomTextY = 350;
let draggingTop = false;
let draggingBottom = false;
let drawMode = 'none';
let drawings = [];
let isDrawing = false;
let savedMemes = [];

function setup() {
    let canvasParent = document.getElementById('canvas-parent');
    canvas = createCanvas(400, 400);
    canvas.parent(canvasParent);
    textAlign(CENTER, CENTER);
    textFont(fontFamily);
    textSize(textSize);
    fill(textColor);

    updatePositionInputs();
    loadSavedMemes();

    document.getElementById('topTextX').addEventListener('input', applyPositionInputs);
    document.getElementById('topTextY').addEventListener('input', applyPositionInputs);
    document.getElementById('bottomTextX').addEventListener('input', applyPositionInputs);
    document.getElementById('bottomTextY').addEventListener('input', applyPositionInputs);
    document.getElementById('saveDbBtn').addEventListener('click', saveCurrentMemeToLibrary);
}

function draw() {
    background(220);
    if (img) {
        image(img, 0, 0, width, height);
    }

    // Draw drawings
    for (let d of drawings) {
        if (d.type === 'circle') {
            ellipse(d.x, d.y, d.w, d.h);
        } else if (d.type === 'rectangle') {
            rect(d.x, d.y, d.w, d.h);
        } else if (d.type === 'free') {
            for (let i = 1; i < d.points.length; i++) {
                line(d.points[i-1].x, d.points[i-1].y, d.points[i].x, d.points[i].y);
            }
        }
    }

    // Draw text
    fill(textColor);
    textFont(fontFamily);
    textSize(textSize);
    if (topText) {
        text(topText, topTextX + width/2, topTextY);
    }
    if (bottomText) {
        text(bottomText, bottomTextX + width/2, bottomTextY);
    }
}

function updatePositionInputs() {
    document.getElementById('topTextX').value = topTextX;
    document.getElementById('topTextY').value = topTextY;
    document.getElementById('bottomTextX').value = bottomTextX;
    document.getElementById('bottomTextY').value = bottomTextY;
}

function applyPositionInputs() {
    topTextX = Number(document.getElementById('topTextX').value);
    topTextY = Number(document.getElementById('topTextY').value);
    bottomTextX = Number(document.getElementById('bottomTextX').value);
    bottomTextY = Number(document.getElementById('bottomTextY').value);
}

function loadSavedMemes() {
    let raw = localStorage.getItem('memeGeneratorDB');
    if (raw) {
        try {
            savedMemes = JSON.parse(raw);
        } catch (e) {
            console.warn('Could not parse saved memes', e);
            savedMemes = [];
        }
    } else {
        savedMemes = [];
    }
    renderSavedMemes();
}

function persistSavedMemes() {
    localStorage.setItem('memeGeneratorDB', JSON.stringify(savedMemes));
}

function renderSavedMemes() {
    let list = document.getElementById('memeList');
    list.innerHTML = '';
    if (savedMemes.length === 0) {
        let li = document.createElement('li');
        li.innerText = 'No memes saved yet.';
        list.appendChild(li);
        return;
    }
    for (let m of savedMemes) {
        let li = document.createElement('li');
        let imgThumb = document.createElement('img');
        imgThumb.src = m.imageData;
        imgThumb.style.width = '120px';
        imgThumb.style.marginRight = '10px';
        imgThumb.style.verticalAlign = 'middle';

        let button = document.createElement('button');
        button.innerText = 'Load';
        button.onclick = () => {
            loadMemeFromLibrary(m);
        };

        let deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.onclick = () => {
            savedMemes = savedMemes.filter(x => x.id !== m.id);
            persistSavedMemes();
            renderSavedMemes();
        };

        li.appendChild(imgThumb);
        li.appendChild(document.createTextNode(`${m.title || 'Untitled Meme'} | ${new Date(m.savedAt).toLocaleString()}`));
        li.appendChild(button);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    }
}

function loadMemeFromLibrary(m) {
    topText = m.topText;
    bottomText = m.bottomText;
    textColor = m.textColor;
    textSize = m.textSize;
    fontFamily = m.fontFamily;
    topTextX = m.topTextX;
    topTextY = m.topTextY;
    bottomTextX = m.bottomTextX;
    bottomTextY = m.bottomTextY;
    drawings = m.drawings || [];
    loadImage(m.imageData, function(loadedImg) {
        img = loadedImg;
        let aspect = img.width / img.height;
        if (aspect > 1) {
            resizeCanvas(400, 400 / aspect);
        } else {
            resizeCanvas(400 * aspect, 400);
        }
        updatePositionInputs();
    });

    document.getElementById('topText').value = topText;
    document.getElementById('bottomText').value = bottomText;
    document.getElementById('textColor').value = textColor;
    document.getElementById('textSize').value = textSize;
    document.getElementById('sizeValue').textContent = textSize;
    document.getElementById('fontFamily').value = fontFamily;
}

function saveCurrentMemeToLibrary() {
    if (!img) {
        alert('Please upload an image before saving to library.');
        return;
    }
    let imageData = canvas.elt.toDataURL('image/png');
    let meme = {
        id: Date.now(),
        title: `${topText || 'Untitled'} / ${bottomText || ''}`,
        imageData,
        topText,
        bottomText,
        textColor,
        textSize,
        fontFamily,
        topTextX,
        topTextY,
        bottomTextX,
        bottomTextY,
        drawings,
        savedAt: Date.now(),
    };
    savedMemes.unshift(meme);
    if (savedMemes.length > 30) savedMemes.pop();
    persistSavedMemes();
    renderSavedMemes();
    alert('Meme salvo no banco local do navegador!');
}

function mousePressed() {
    if (drawMode === 'none') {
        // Check if clicking on text
        if (topText && mouseX > topTextX + width/2 - textWidth(topText)/2 - 10 && mouseX < topTextX + width/2 + textWidth(topText)/2 + 10 &&
            mouseY > topTextY - textSize/2 - 10 && mouseY < topTextY + textSize/2 + 10) {
            draggingTop = true;
        } else if (bottomText && mouseX > bottomTextX + width/2 - textWidth(bottomText)/2 - 10 && mouseX < bottomTextX + width/2 + textWidth(bottomText)/2 + 10 &&
                   mouseY > bottomTextY - textSize/2 - 10 && mouseY < bottomTextY + textSize/2 + 10) {
            draggingBottom = true;
        }
    } else {
        isDrawing = true;
        if (drawMode === 'circle' || drawMode === 'rectangle') {
            drawings.push({type: drawMode, x: mouseX, y: mouseY, w: 0, h: 0});
        } else if (drawMode === 'free') {
            drawings.push({type: 'free', points: [{x: mouseX, y: mouseY}]});
        }
    }
}

function mouseDragged() {
    if (draggingTop) {
        topTextX += mouseX - pmouseX;
        topTextY += mouseY - pmouseY;
        updatePositionInputs();
    } else if (draggingBottom) {
        bottomTextX += mouseX - pmouseX;
        bottomTextY += mouseY - pmouseY;
        updatePositionInputs();
    } else if (isDrawing) {
        if (drawMode === 'circle' || drawMode === 'rectangle') {
            let d = drawings[drawings.length - 1];
            d.w = mouseX - d.x;
            d.h = mouseY - d.y;
        } else if (drawMode === 'free') {
            let d = drawings[drawings.length - 1];
            d.points.push({x: mouseX, y: mouseY});
        }
    }
}

function mouseReleased() {
    draggingTop = false;
    draggingBottom = false;
    isDrawing = false;
}

// Event listeners
function registerStaticEventListeners() {
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(event) {
                loadImage(event.target.result, function(loadedImg) {
                    img = loadedImg;
                    let aspect = img.width / img.height;
                    if (aspect > 1) {
                        resizeCanvas(400, 400 / aspect);
                    } else {
                        resizeCanvas(400 * aspect, 400);
                    }
                    bottomTextY = height - 50;
                    updatePositionInputs();
                });
            };
            reader.readAsDataURL(file);
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
    });

    document.getElementById('textSize').addEventListener('input', function() {
        textSize = this.value;
        document.getElementById('sizeValue').textContent = textSize;
    });

    document.getElementById('fontFamily').addEventListener('change', function() {
        fontFamily = this.value;
    });

    document.getElementById('saveBtn').addEventListener('click', function() {
        saveCanvas(canvas, 'meme', 'png');
    });

    document.getElementById('saveDbBtn').addEventListener('click', saveCurrentMemeToLibrary);

    document.getElementById('drawMode').addEventListener('change', function() {
        drawMode = this.value;
    });

    document.getElementById('clearDraw').addEventListener('click', function() {
        drawings = [];
    });

    document.getElementById('shareTwitter').addEventListener('click', function() {
        let url = canvas.toDataURL();
        let shareUrl = `https://twitter.com/intent/tweet?text=Check out my meme!&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    });

    document.getElementById('shareReddit').addEventListener('click', function() {
        let url = canvas.toDataURL();
        let shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=My Meme`;
        window.open(shareUrl, '_blank');
    });

    document.getElementById('shareFacebook').addEventListener('click', function() {
        let url = canvas.toDataURL();
        let shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    });
}

registerStaticEventListeners();