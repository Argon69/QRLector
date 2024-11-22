
// Add Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
});

function showInstallPromotion() {
    const installBanner = document.createElement('div');
    installBanner.className = 'fixed bottom-0 left-0 right-0 bg-indigo-600 text-white p-4 flex justify-between items-center';
    installBanner.innerHTML = `
        <p>¿Quieres instalar la aplicación?</p>
        <button id="installButton" class="px-4 py-2 bg-white text-indigo-600 rounded">Instalar</button>
    `;
    document.body.appendChild(installBanner);

    document.getElementById('installButton').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installBanner.remove();
        }
    });
}

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// Initialize QR Scanner
const html5QrcodeScanner = new Html5Qrcode("reader");
let scanning = false;

// Camera Selection
async function populateCameraSelect() {
    try {
        const devices = await Html5Qrcode.getCameras();
        const select = document.getElementById('cameraSelect');
        select.innerHTML = '<option value="">Seleccionar cámara...</option>';
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.text = device.label || `Cámara ${select.options.length}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error accessing cameras:', err);
    }
}

// Initialize camera selection
populateCameraSelect();

document.getElementById('cameraSelect').addEventListener('change', (e) => {
    if (scanning) {
        stopScanning().then(() => {
            if (e.target.value) {
                startScanning(e.target.value);
            }
        });
    }
});

document.getElementById('startButton').addEventListener('click', () => {
    if (!scanning) {
        const cameraId = document.getElementById('cameraSelect').value;
        startScanning(cameraId);
    } else {
        stopScanning();
    }
});

async function startScanning(cameraId = null) {
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
    };
    
    try {
        await html5QrcodeScanner.start(
            cameraId || { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        scanning = true;
        document.getElementById('startButton').textContent = 'Detener';
    } catch (err) {
        console.error('Error starting scanner:', err);
        alert('Error al iniciar la cámara. Por favor, verifica los permisos.');
    }
}

async function stopScanning() {
    try {
        await html5QrcodeScanner.stop();
        scanning = false;
        document.getElementById('startButton').textContent = 'Iniciar Escaneo';
    } catch (err) {
        console.error('Error stopping scanner:', err);
    }
}

function onScanSuccess(decodedText, decodedResult) {
    stopScanning();
    showResult(decodedText);
    saveToHistory(decodedText);
}

function onScanError(error) {
    console.warn(`Code scan error = ${error}`);
}

// Result Modal Functions
function showResult(result) {
    const modal = document.getElementById('resultModal');
    const resultText = document.getElementById('scanResult');
    resultText.textContent = result;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    document.getElementById('resultModal').classList.add('hidden');
    document.getElementById('resultModal').classList.remove('flex');
}

function copyResult() {
    const result = document.getElementById('scanResult').textContent;
    navigator.clipboard.writeText(result);
    alert('Copiado al portapapeles');
}

function shareResult() {
    const result = document.getElementById('scanResult').textContent;
    if (navigator.share) {
        navigator.share({
            title: 'Resultado QR',
            text: result
        });
    }
}

// Update IndexedDB for history storage instead of localStorage
const dbName = 'QRScannerDB';
const dbVersion = 1;

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { keyPath: 'timestamp' });
            }
        };
    });
};

async function clearHistory() {
    try {
        const confirmed = confirm('¿Estás seguro de que quieres borrar todo el historial?');
        if (confirmed) {
            const db = await openDB();
            const transaction = db.transaction(['history'], 'readwrite');
            const store = transaction.objectStore('history');
            await store.clear();
            updateHistoryDisplay();
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Error al borrar el historial');
    }
}

// Add event listener for clear history button
document.getElementById('clearHistoryButton').addEventListener('click', clearHistory);

// Update saveToHistory function to use IndexedDB
async function saveToHistory(result) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        
        const item = {
            result,
            timestamp: new Date().toISOString(),
            favorite: false
        };
        
        await store.add(item);
        updateHistoryDisplay();
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

// Update updateHistoryDisplay function to use IndexedDB
async function updateHistoryDisplay() {
    try {
        const db = await openDB();
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const history = request.result;
            const historyList = document.getElementById('historyList');
            historyList.innerHTML = history.map(item => `
                <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center">
                    <div>
                        <p class="text-gray-800 dark:text-white">${item.result}</p>
                        <small class="text-gray-500">${new Date(item.timestamp).toLocaleString()}</small>
                    </div>
                    <button onclick="toggleFavorite('${item.timestamp}')" class="text-yellow-500">
                        ${item.favorite ? '★' : '☆'}
                    </button>
                </div>
            `).join('');
        };
    } catch (error) {
        console.error('Error updating history display:', error);
    }
}

// File Input for Gallery
document.getElementById('galleryButton').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                html5QrcodeScanner.scanFile(file, true)
                    .then(decodedText => {
                        showResult(decodedText);
                        saveToHistory(decodedText);
                    })
                    .catch(err => {
                        console.error(err);
                        alert('No se pudo leer el código QR de la imagen');
                    });
            }
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Initialize history display
updateHistoryDisplay();