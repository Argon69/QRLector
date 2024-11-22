// Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', 'pwabuilder-sw.js', {
                scope: '/'
            });
            console.log('ServiceWorker registrado exitosamente con alcance:', registration.scope);

            // Detectar si hay una actualización disponible
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('ServiceWorker: Nueva versión encontrada.');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('ServiceWorker: Nuevo contenido disponible.');
                        // Notificar al usuario sobre la nueva versión
                        showUpdateNotification();
                    }
                });
            });
        } catch (error) {
            console.error('ServiceWorker: Error al registrar:', error);
        }
    });
}

// Función para mostrar notificaciones al usuario sobre actualizaciones
function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.textContent = 'Nueva versión disponible. Actualiza para ver los cambios.';
    updateBanner.style.position = 'fixed';
    updateBanner.style.bottom = '0';
    updateBanner.style.width = '100%';
    updateBanner.style.backgroundColor = '#4F46E5';
    updateBanner.style.color = '#FFFFFF';
    updateBanner.style.padding = '10px';
    updateBanner.style.textAlign = 'center';
    updateBanner.style.cursor = 'pointer';
    updateBanner.style.zIndex = '1000';

    updateBanner.addEventListener('click', () => {
        updateBanner.remove();
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            window.location.reload();
        }
    });

    document.body.appendChild(updateBanner);
}


// Install Prompt Handler
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
});

// Handle Install Success
window.addEventListener('appinstalled', (evt) => {
    console.log('Application installed successfully');
    // Hide the promotion if it's still showing
    const existingBanner = document.querySelector('.install-banner');
    if (existingBanner) {
        existingBanner.remove();
    }
});

function showInstallPromotion() {
    // Check if banner already exists
    if (document.querySelector('.install-banner')) {
        return;
    }

    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner fixed bottom-0 left-0 right-0 bg-indigo-600 text-white p-4 flex justify-between items-center z-50 fade-enter';
    installBanner.innerHTML = `
        <p class="text-sm md:text-base">¿Quieres instalar la aplicación para un acceso más rápido?</p>
        <div class="flex gap-2">
            <button id="installDeclineButton" class="px-3 py-1 md:px-4 md:py-2 bg-indigo-500 text-white rounded text-sm">
                Ahora no
            </button>
            <button id="installButton" class="px-3 py-1 md:px-4 md:py-2 bg-white text-indigo-600 rounded text-sm hover:bg-indigo-50 transition-colors">
                Instalar
            </button>
        </div>
    `;
    document.body.appendChild(installBanner);

    // Add fade-in effect
    requestAnimationFrame(() => {
        installBanner.classList.add('fade-enter-active');
    });

    // Install button handler
    document.getElementById('installButton').addEventListener('click', async () => {
        if (deferredPrompt) {
            try {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for user choice
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install prompt: ${outcome}`);
                
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User declined the install prompt');
                }
            } catch (err) {
                console.error('Error during installation:', err);
            } finally {
                deferredPrompt = null;
                installBanner.remove();
            }
        }
    });

    // Decline button handler
    document.getElementById('installDeclineButton').addEventListener('click', () => {
        installBanner.remove();
    });
}

function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 flex justify-between items-center';
    updateBanner.innerHTML = `
        <p>Nueva versión disponible!</p>
        <button onclick="window.location.reload()" class="px-4 py-2 bg-white text-green-600 rounded">
            Actualizar
        </button>
    `;
    document.body.appendChild(updateBanner);
}

    function showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 flex justify-between items-center';
        updateBanner.innerHTML = `
            <p>Nueva versión disponible!</p>
            <button onclick="window.location.reload()" class="px-4 py-2 bg-white text-green-600 rounded">
                Actualizar
            </button>
        `;
        document.body.appendChild(updateBanner);
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
