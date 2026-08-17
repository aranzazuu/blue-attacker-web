document.addEventListener('DOMContentLoaded', function() {
    const scanBtn = document.getElementById('scanBtn');
    const deviceList = document.getElementById('deviceList');
    const targetDisplay = document.getElementById('targetDisplay');
    const clearTargetBtn = document.getElementById('clearTargetBtn');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const attackStatusText = document.getElementById('attackStatusText');
    const statusBadge = document.getElementById('statusBadge');
    const logContainer = document.getElementById('logContainer');
    const packetSizeInput = document.getElementById('packetSize');
    const threadsInput = document.getElementById('threads');
    const scanTimeInput = document.getElementById('scanTime');
    const configBtn = document.getElementById('configBtn');

    const socket = io();
    socket.on('log', function(data) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        if (data.msg.includes('[ERROR]')) entry.classList.add('error');
        else if (data.msg.includes('[WARNING]')) entry.classList.add('warning');
        else if (data.msg.includes('[INFO]')) entry.classList.add('info');
        else entry.classList.add('system');
        entry.textContent = data.msg;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    });

    socket.on('attack_status', function(data) {
        updateAttackStatus(data.running);
    });

    let devices = [];
    let selectedMac = null;

    function updateAttackStatus(running) {
        if (running) {
            attackStatusText.textContent = '🔴 EN EJECUCIÓN';
            statusBadge.textContent = '🔴 Activo';
            statusBadge.classList.add('active');
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            attackStatusText.textContent = '⏹️ Inactivo';
            statusBadge.textContent = '⏹️ Detenido';
            statusBadge.classList.remove('active');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }
    updateAttackStatus(false);

    scanBtn.addEventListener('click', function() {
        scanBtn.disabled = true;
        scanBtn.textContent = '⏳ Escaneando...';
        deviceList.innerHTML = '<p class="placeholder">Escaneando, espera...</p>';
        fetch('/scan', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                devices = data.devices || [];
                renderDeviceList(devices);
                scanBtn.textContent = '🔍 Escanear';
                scanBtn.disabled = false;
            })
            .catch(err => {
                console.error(err);
                deviceList.innerHTML = '<p class="placeholder">❌ Error al escanear</p>';
                scanBtn.textContent = '🔍 Escanear';
                scanBtn.disabled = false;
            });
    });

    function renderDeviceList(devices) {
        if (!devices || devices.length === 0) {
            deviceList.innerHTML = '<p class="placeholder">No se encontraron dispositivos.</p>';
            return;
        }
        let html = '';
        devices.forEach(([mac, name]) => {
            const selected = (mac === selectedMac) ? 'selected' : '';
            html += `<div class="device-item ${selected}" data-mac="${mac}"><span class="device-name">${name}</span><span class="device-mac">${mac}</span></div>`;
        });
        deviceList.innerHTML = html;
        document.querySelectorAll('.device-item').forEach(item => {
            item.addEventListener('click', function() {
                selectTarget(this.dataset.mac);
            });
        });
    }

    function selectTarget(mac) {
        selectedMac = mac;
        document.querySelectorAll('.device-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.mac === mac);
        });
        fetch('/set_target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: mac })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                targetDisplay.textContent = mac;
                clearTargetBtn.style.display = 'inline-block';
            }
        })
        .catch(err => console.error(err));
    }

    clearTargetBtn.addEventListener('click', function() {
        selectedMac = null;
        targetDisplay.textContent = 'Ninguno';
        clearTargetBtn.style.display = 'none';
        document.querySelectorAll('.device-item').forEach(el => {
            el.classList.remove('selected');
        });
        fetch('/set_target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: null })
        });
    });

    configBtn.addEventListener('click', function() {
        const packetSize = parseInt(packetSizeInput.value);
        const threads = parseInt(threadsInput.value);
        const scanTime = parseInt(scanTimeInput.value);
        if (isNaN(packetSize) || isNaN(threads) || isNaN(scanTime)) {
            alert('Todos los valores deben ser números válidos.');
            return;
        }
        fetch('/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packet_size: packetSize, threads: threads, scan_time: scanTime })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') alert('Configuración guardada.');
        })
        .catch(err => console.error(err));
    });

    startBtn.addEventListener('click', function() {
        if (!selectedMac) {
            alert('Primero selecciona un dispositivo.');
            return;
        }
        startBtn.disabled = true;
        startBtn.textContent = '⏳ Iniciando...';
        fetch('/start_attack', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'ok') alert('Error: ' + (data.msg || ''));
                startBtn.disabled = false;
                startBtn.textContent = '▶️ Iniciar Ataque';
            })
            .catch(err => {
                console.error(err);
                startBtn.disabled = false;
                startBtn.textContent = '▶️ Iniciar Ataque';
            });
    });

    stopBtn.addEventListener('click', function() {
        stopBtn.disabled = true;
        stopBtn.textContent = '⏳ Deteniendo...';
        fetch('/stop_attack', { method: 'POST' })
            .then(() => {
                stopBtn.disabled = false;
                stopBtn.textContent = '⏹️ Detener Ataque';
            })
            .catch(err => {
                console.error(err);
                stopBtn.disabled = false;
                stopBtn.textContent = '⏹️ Detener Ataque';
            });
    });

    fetch('/status')
        .then(response => response.json())
        .then(data => {
            if (data.target) {
                targetDisplay.textContent = data.target;
                selectedMac = data.target;
                clearTargetBtn.style.display = 'inline-block';
            }
            packetSizeInput.value = data.packet_size || 600;
            threadsInput.value = data.threads || 300;
            scanTimeInput.value = data.scan_time || 5;
            updateAttackStatus(data.running);
        })
        .catch(err => console.error(err));
});
