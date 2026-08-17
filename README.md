# 🔴 Blue Attacker Web

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-black)](https://flask.palletsprojects.com/)
[![SocketIO](https://img.shields.io/badge/SocketIO-5.6.1-purple)](https://socket.io/)

**Interfaz web para ataques de denegación de servicio (DoS) sobre dispositivos Bluetooth** usando `l2ping` flooding. Construida con Flask, SocketIO y una temática oscura **rojo/negro**.

> ⚠️ **ADVERTENCIA:** Esta herramienta es exclusivamente para **fines educativos y pruebas de seguridad en entornos autorizados**. El uso no autorizado de técnicas de DoS es **ilegal** en la mayoría de los países. El autor no se hace responsable del mal uso de este software.

---

## 🚀 Características

| Característica | Descripción |
|----------------|-------------|
| 📡 **Escaneo en tiempo real** | Detecta dispositivos Bluetooth cercanos usando `bluetoothctl`. |
| 🎯 **Selección con un clic** | Elige el objetivo desde la lista de dispositivos escaneados. |
| ⚙️ **Configuración avanzada** | Ajusta el tamaño de paquete, número de hilos y tiempo de escaneo. |
| 🔥 **Ataque Flooding** | Inunda el dispositivo con paquetes `l2ping -f` para saturar su conexión. |
| 📋 **Logs en tiempo real** | Monitoriza todo lo que ocurre en el servidor mediante WebSockets. |
| 🎨 **Diseño oscuro** | Interfaz elegante con paleta de colores rojo/negro. |
| 🔄 **Actualización automática** | El estado del ataque y los logs se actualizan sin recargar la página. |
| 🖥️ **Multiplataforma** | Funciona en cualquier sistema Linux con Bluetooth y Python. |

---

## 🛠️ Instalación y Uso

### 📦 Requisitos previos

- **Sistema operativo:** Linux (probado en Ubuntu/Debian)
- **Python 3.8+** y `pip`
- **BlueZ** (herramientas Bluetooth de Linux)
- **Permisos de superusuario** (`sudo`) para acceder a Bluetooth

# 3. Instala las dependencias
- **pip install --upgrade pip**
- **pip install -r requirements.txt**

### 📥 Paso a paso

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/blue-attacker-web.git
cd blue-attacker-web

# 2. Crea y activa un entorno virtual
python3 -m venv venv
source venv/bin/activate

# 3. Instala las dependencias
pip install --upgrade pip
pip install flask flask-socketio eventlet

# 4. Ejecuta la aplicación (con sudo para acceder a Bluetooth)
sudo ./venv/bin/python3 app.py
```

### 🌐 Acceso

Abre tu navegador y ve a `http://127.0.0.1:5000`. La interfaz web estará lista para usar.

---

## 🎮 Cómo usar la interfaz

1. **Escanea dispositivos** haciendo clic en el botón **"Escanear"**. Espera unos segundos y verás la lista de dispositivos Bluetooth cercanos.
2. **Selecciona un objetivo** haciendo clic en cualquier dispositivo de la lista. Aparecerá marcado y se guardará como objetivo.
3. **Configura el ataque** (opcional): ajusta el tamaño de paquete, el número de hilos y el tiempo de escaneo en el panel de configuración.
4. **Inicia el ataque** presionando el botón **"Iniciar Ataque"**. Verás los logs en tiempo real y el estado cambiará a "Activo".
5. **Detén el ataque** en cualquier momento con el botón **"Detener Ataque"**.
6. **Observa los logs** en la parte inferior para ver todo lo que ocurre en el servidor.

---

## 📸 Capturas de pantalla

> *Añade aquí una captura de tu interfaz web en funcionamiento.*

```text
[Pendiente de añadir imagen]
```

---

## 🧠 ¿Cómo funciona?

- **Escaneo:** El backend ejecuta `bluetoothctl` en modo interactivo, activa el escaneo, espera unos segundos y luego lista los dispositivos detectados.
- **Ataque:** Lanza múltiples procesos en paralelo de `l2ping -s <tamaño> -f <MAC>`, enviando paquetes de forma continua para saturar el canal Bluetooth del dispositivo objetivo.
- **Comunicación en tiempo real:** Flask-SocketIO envía logs y actualizaciones de estado desde el servidor al cliente sin necesidad de recargar la página.

---

## ⚙️ Configuración avanzada

Puedes modificar los parámetros directamente desde la interfaz o editando las variables globales en `app.py`:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PACKET_SIZE` | Tamaño del paquete `l2ping` en bytes | 600 |
| `NUM_THREADS` | Número de hilos (procesos) de ataque | 300 |
| `SCAN_TIME` | Segundos que dura el escaneo | 5 |

---

## 🐛 Solución de problemas

| Problema | Solución |
|----------|----------|
| **`ModuleNotFoundError: No module named 'flask'`** | Ejecuta con `sudo ./venv/bin/python3 app.py` para usar el Python del entorno virtual. |
| **`bluetoothctl` no encontrado** | Instala BlueZ: `sudo apt install bluez` |
| **`l2ping` no encontrado** | Instala BlueZ: `sudo apt install bluez-utils` |
| **Error de permisos** | Asegúrate de ejecutar con `sudo` o añade tu usuario al grupo `bluetooth`: `sudo usermod -a -G bluetooth $USER` y reinicia sesión. |
| **No se encuentran dispositivos** | Verifica que el dispositivo objetivo esté visible (modo de emparejamiento activo) y aumenta el tiempo de escaneo en la configuración. |
| **El ataque no parece funcionar** | Aumenta el número de hilos (300+). Asegúrate de que el dispositivo no esté en modo "no detectable". |

---

## 📚 Tecnologías utilizadas

- **Backend:** [Flask](https://flask.palletsprojects.com/) + [Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **WebSockets:** [Socket.IO](https://socket.io/)
- **Bluetooth:** `bluez` (bluetoothctl, l2ping)
- **Entorno virtual:** `venv`
- **Servidor ASGI/WSGI:** Eventlet (ligero para WebSockets)

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes ideas para mejorar la interfaz, añadir nuevos tipos de ataques o hacerla más estable, abre un *issue* o un *pull request*.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## ⚠️ Aviso legal importante

**Esta herramienta se proporciona únicamente con fines educativos y de investigación en seguridad.** 

- No uses este software para interferir con comunicaciones ajenas sin consentimiento explícito.
- El uso indebido puede violar leyes locales, nacionales e internacionales.
- El autor no se hace responsable de ningún daño, pérdida de datos o consecuencias legales derivadas del uso de esta herramienta.

**Úsala de manera ética y responsable.**

---

⭐ **Si este proyecto te ha sido útil, no olvides darle una estrella en GitHub.** ¡Gracias!
