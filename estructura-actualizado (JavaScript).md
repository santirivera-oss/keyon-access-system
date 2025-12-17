# 📁 Estructura de Módulos JS - Keyon Access System

## 🗂️ Organización de Carpetas

```
js/
├── 📁 core/                    # Funcionalidades base del sistema
│   ├── firebase-config.js      # Configuración de Firebase
│   ├── dom-elements.js         # Referencias a elementos del DOM
│   ├── audios.js               # Sonidos y beeps del sistema
│   ├── overlays.js             # Modals y overlays globales
│   ├── scanner.js              # Scanner de QR/barcode
│   ├── procesar-qr.js          # Procesamiento de códigos QR
│   ├── qr-dinamico.js          # Generación de QR dinámicos
│   ├── notificaciones.js       # Sistema de notificaciones push
│   └── main.js                 # Inicialización principal
│
├── 📁 auth/                    # Autenticación y seguridad
│   ├── auth-system.js          # Sistema de login/logout
│   └── password-system.js      # Gestión de contraseñas
│
├── 📁 dashboards/              # Paneles principales de usuarios
│   ├── alumno-dashboard.js     # Dashboard del alumno
│   └── profesor-dashboard.js   # Dashboard del profesor
│
├── 📁 admin/                   # Funciones administrativas
│   ├── admin-panel.js          # Panel de administración
│   ├── admin-grafica.js        # Gráficas y estadísticas
│   ├── admin-qr-generator.js   # Generador de QR para admin
│   └── prefectura.js           # Módulo de prefectura/disciplina
│
├── 📁 cbtis/                   # Control de acceso CBTis (Kiosco)
│   ├── acceso-cbtis.js         # Kiosco de entrada/salida
│   └── registros-cbtis-admin.js # Admin de registros CBTis
│
├── 📁 comunicacion/            # Sistema de mensajería
│   └── comunicacion.js         # Chat, avisos, mensajes
│
├── 📁 facial/                  # Reconocimiento facial
│   ├── reconocimiento-facial.js # Core del reconocimiento
│   └── gestion-facial-admin.js  # Administración facial
│
├── 📁 horarios/                # Gestión de horarios y clases
│   ├── horarios.js             # Visualización de horarios
│   ├── horarios-admin.js       # Administración de horarios
│   └── iniciar-clase.js        # Clase activa y asistencia
│
└── 📁 analytics/               # Análisis y reportes
    └── analisis-predictivo.js  # IA predictiva de asistencia
```

---

## 📋 Descripción de Módulos

### 🔹 CORE (Núcleo)
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `firebase-config.js` | Inicializa Firebase y exporta `db`, `auth` | Ninguna |
| `dom-elements.js` | Referencias globales a elementos DOM | Ninguna |
| `audios.js` | Funciones `reproducirBeep()` | Ninguna |
| `overlays.js` | `mostrarOverlay()`, `cerrarOverlay()` | DOM |
| `scanner.js` | Integración con html5-qrcode | Core |
| `procesar-qr.js` | Valida y procesa QR escaneados | Firebase |
| `qr-dinamico.js` | Genera QR con tokens temporales | Firebase |
| `notificaciones.js` | OneSignal push notifications | Firebase |
| `main.js` | Inicialización y event listeners | Todos |

### 🔐 AUTH (Autenticación)
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `auth-system.js` | Login Firebase Auth + Custom | Firebase, DOM |
| `password-system.js` | Crear/validar contraseñas | Firebase |

### 📊 DASHBOARDS
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `alumno-dashboard.js` | Vista del alumno: historial, QR | Firebase, Core |
| `profesor-dashboard.js` | Vista profesor: clases, asistencia | Firebase, Core |

### ⚙️ ADMIN
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `admin-panel.js` | CRUD usuarios, configuración | Firebase |
| `admin-grafica.js` | Charts.js gráficas | Firebase |
| `admin-qr-generator.js` | Genera QR masivos | Core |
| `prefectura.js` | Reportes, citatorios | Firebase |

### 🏫 CBTIS
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `acceso-cbtis.js` | Kiosco pantalla completa | Firebase, Facial |
| `registros-cbtis-admin.js` | Ver/analizar registros | Firebase |

### 💬 COMUNICACION
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `comunicacion.js` | Chat, avisos, mensajes | Firebase |

### 🎭 FACIAL
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `reconocimiento-facial.js` | face-api.js integración | Firebase |
| `gestion-facial-admin.js` | Registrar/editar rostros | Firebase, Facial |

### 📅 HORARIOS
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `horarios.js` | Mostrar horarios | Firebase |
| `horarios-admin.js` | CRUD horarios | Firebase |
| `iniciar-clase.js` | Sesión activa, pase lista | Firebase |

### 📈 ANALYTICS
| Archivo | Descripción | Dependencias |
|---------|-------------|--------------|
| `analisis-predictivo.js` | Predicciones IA | Firebase, TensorFlow |

---

## 🔄 Orden de Carga (index.html)

```html
<!-- 1. CORE - Base del sistema -->
<script src="js/core/firebase-config.js"></script>
<script src="js/core/dom-elements.js"></script>
<script src="js/core/audios.js"></script>
<script src="js/core/overlays.js"></script>

<!-- 2. AUTH - Autenticación -->
<script src="js/auth/auth-system.js"></script>
<script src="js/auth/password-system.js"></script>

<!-- 3. DASHBOARDS - Paneles de usuario -->
<script src="js/dashboards/alumno-dashboard.js"></script>
<script src="js/dashboards/profesor-dashboard.js"></script>

<!-- 4. ADMIN - Administración -->
<script src="js/admin/admin-panel.js"></script>
<script src="js/admin/admin-grafica.js"></script>
<script src="js/admin/admin-qr-generator.js"></script>
<script src="js/admin/prefectura.js"></script>

<!-- 5. CBTIS - Control de acceso -->
<script src="js/cbtis/acceso-cbtis.js"></script>
<script src="js/cbtis/registros-cbtis-admin.js"></script>

<!-- 6. COMUNICACION -->
<script src="js/comunicacion/comunicacion.js"></script>

<!-- 7. FACIAL - Reconocimiento -->
<script src="js/facial/reconocimiento-facial.js"></script>
<script src="js/facial/gestion-facial-admin.js"></script>

<!-- 8. HORARIOS -->
<script src="js/horarios/horarios.js"></script>
<script src="js/horarios/horarios-admin.js"></script>
<script src="js/horarios/iniciar-clase.js"></script>

<!-- 9. ANALYTICS -->
<script src="js/analytics/analisis-predictivo.js"></script>

<!-- 10. CORE - QR y Scanner (después de dependencias) -->
<script src="js/core/scanner.js"></script>
<script src="js/core/procesar-qr.js"></script>
<script src="js/core/qr-dinamico.js"></script>
<script src="js/core/notificaciones.js"></script>

<!-- 11. MAIN - Inicialización final -->
<script src="js/core/main.js"></script>
```

---

## 📝 Notas Importantes

1. **Firebase Config** debe cargarse PRIMERO
2. **DOM Elements** antes de cualquier módulo que use referencias
3. **Auth System** antes de dashboards
4. **Main.js** siempre al FINAL

---

## 🆕 Agregar Nuevos Módulos

1. Identifica la categoría del módulo
2. Crea el archivo en la carpeta correspondiente
3. Agrega el `<script>` en el orden correcto
4. Documenta dependencias aquí

---

© 2025 Keyon Access System
