# 📱 Keyon Padres - PWA

App Progressive Web App para padres de familia del sistema Keyon Access.

## 🚀 Características

- ✅ **Estado en tiempo real** - Ve si tu hijo está dentro o fuera del plantel
- ✅ **Historial de asistencia** - Registro completo de entradas y salidas
- ✅ **Estadísticas mensuales** - Días asistidos, faltas, retardos
- ✅ **Notificaciones push** - Alertas cuando tu hijo ingresa/sale
- ✅ **Funciona offline** - Accede a datos sin conexión
- ✅ **Instalable** - Instala como app nativa en iOS/Android
- ✅ **Sincronización en tiempo real** - Actualización automática con Firebase

---

## 📋 Requisitos

1. **Firebase Project** con Firestore habilitado
2. **Servidor HTTPS** (requerido para PWA)
3. **Colección `ingresos_cbtis`** en Firestore
4. **Colección `alumnos`** en Firestore

---

## ⚙️ Configuración

### 1. Configurar Firebase

Edita `index.html` y reemplaza la configuración de Firebase (línea ~725):

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 2. Crear iconos

Crea la carpeta `icons/` con los siguientes archivos:
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

Puedes generar estos iconos en: https://www.pwabuilder.com/imageGenerator

### 3. Desplegar en servidor HTTPS

Opciones recomendadas:
- **Firebase Hosting** (integración nativa)
- **Netlify** (gratis, fácil)
- **Vercel** (gratis, rápido)
- **GitHub Pages** (gratis)

#### Ejemplo con Firebase Hosting:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Desplegar
firebase deploy --only hosting
```

---

## 📱 Instalación en dispositivos

### Android
1. Abre la app en Chrome
2. Aparecerá banner "Instalar app"
3. Toca "Instalar"
4. ¡Listo! Aparece en tu pantalla de inicio

### iOS (Safari)
1. Abre la app en Safari
2. Toca el botón compartir (📤)
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma el nombre
5. ¡Listo!

---

## 🔐 Sistema de Autenticación

### Flujo actual (Demo):
- **Usuario:** Número de control del alumno
- **Contraseña:** Cualquier código de 6 dígitos

### Para producción:
Implementar un sistema más robusto:

```javascript
// Opción 1: Código generado por admin
// Almacenar en Firestore: padres/{alumnoId}/codigo

// Opción 2: Firebase Auth con email/password
// Crear cuentas para padres en Firebase Auth

// Opción 3: Código SMS
// Enviar código OTP al WhatsApp del padre
```

---

## 📊 Estructura de Datos

### Colección: `ingresos_cbtis`
```javascript
{
  identificador: "22310123",        // Control del alumno
  nombre: "Juan Pérez García",
  tipoPersona: "Alumno",
  tipoRegistro: "Ingreso" | "Salida",
  fecha: "2025-12-16",
  hora: "07:15:30",
  modo: "facial" | "qr" | "barcode",
  timestamp: "2025-12-16T07:15:30.000Z"
}
```

### Colección: `alumnos`
```javascript
{
  nombre: "Juan",
  apellidos: "Pérez García",
  control: "22310123",
  grado: "3",
  grupo: "A",
  turno: "Matutino"
}
```

---

## 🔔 Notificaciones Push

Para habilitar notificaciones push, necesitas:

1. **Firebase Cloud Messaging (FCM)**
2. **Clave VAPID** para web push

```javascript
// En index.html, agregar después de inicializar Firebase:
const messaging = firebase.messaging();

messaging.getToken({ vapidKey: 'TU_VAPID_KEY' })
  .then((token) => {
    // Guardar token en Firestore
    db.collection('padres_tokens').doc(alumnoId).set({
      token: token,
      fecha: new Date()
    });
  });
```

---

## 🗂️ Estructura de Archivos

```
padres-app/
├── index.html        # App principal
├── manifest.json     # Configuración PWA
├── sw.js             # Service Worker
├── offline.html      # Página sin conexión
├── README.md         # Este archivo
└── icons/            # Iconos de la app
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

---

## 🔧 Personalización

### Cambiar colores

En `index.html`, modifica las variables CSS:

```css
:root {
  --bg-primary: #0f172a;      /* Fondo principal */
  --accent-primary: #06b6d4;   /* Color primario */
  --accent-secondary: #8b5cf6; /* Color secundario */
  --success: #10b981;          /* Verde éxito */
  --danger: #ef4444;           /* Rojo error */
}
```

### Cambiar logo

Reemplaza el emoji en `.splash-logo` y `.login-logo` por una imagen:

```html
<img src="icons/logo.png" alt="Logo" class="splash-logo">
```

---

## 📈 Mejoras Futuras

- [ ] Chat con profesores
- [ ] Ver horarios del alumno
- [ ] Calificaciones en tiempo real
- [ ] Calendario de eventos
- [ ] Justificación de faltas
- [ ] Múltiples hijos por cuenta
- [ ] Modo oscuro/claro
- [ ] Exportar historial PDF

---

## 🆘 Soporte

¿Problemas? Revisa:

1. Consola del navegador (F12)
2. Que Firebase esté configurado correctamente
3. Que el servidor tenga HTTPS
4. Que los iconos existan

---

## 📄 Licencia

© 2025 Keyon Access System
Todos los derechos reservados.
