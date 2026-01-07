# CLAUDE.md - AI Assistant Guide for Keyon Access System

## Project Overview

**Keyon Access System** is an intelligent school attendance control system built for CBTis No. 001 in Fresnillo, Zacatecas, Mexico. It's a Progressive Web Application (PWA) that combines multiple authentication methods including QR codes, barcodes, and facial recognition for comprehensive attendance tracking.

**Version:** 2.5.3
**Primary Language:** Spanish (all code, comments, and UI)
**License:** MIT

## Quick Reference

```bash
# Serve locally (from project root)
python -m http.server 8080
# or
npx serve .

# Deploy to Firebase
firebase deploy
```

## Architecture

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | HTML5, Tailwind CSS 3.x (CDN), Vanilla JavaScript ES6+ |
| Backend | Firebase (Firestore, Auth, Cloud Functions) |
| Facial Recognition | face-api.js / @vladmandic/face-api (TensorFlow.js) |
| QR/Barcode | Html5-QRCode, QRCode.js, JsBarcode |
| Charts | Chart.js 4.x |
| Push Notifications | OneSignal SDK, Web Push API |
| PWA | Service Workers, Web App Manifest |

### Directory Structure

```
keyon-access-system/
├── public/                     # Main web application
│   ├── index.html              # Main entry point (Keyon v3)
│   ├── firestore.rules         # Firestore security rules
│   ├── manifest.json           # PWA manifest
│   ├── js/                     # JavaScript modules (~26 files)
│   │   ├── core/               # Core functionality (9 modules)
│   │   ├── auth/               # Authentication (2 modules)
│   │   ├── dashboards/         # User panels (2 modules)
│   │   ├── admin/              # Admin functions (4 modules)
│   │   ├── cbtis/              # Campus access control (2 modules)
│   │   ├── comunicacion/       # Messaging (1 module)
│   │   ├── facial/             # Facial recognition (2 modules)
│   │   ├── horarios/           # Schedule management (3 modules)
│   │   └── analytics/          # Analytics (1 module)
│   ├── app-padres/             # Separate PWA for parents
│   └── assets/                 # Static assets (images, audio)
├── README.md                   # Project documentation
├── BITACORA-DESARROLLO*.md     # Development logs
└── CAMBIOS-POST-BITACORA*.md   # Post-log changes
```

### Key JavaScript Modules

| Module | Path | Purpose |
|--------|------|---------|
| `firebase-config.js` | `js/core/` | Firebase initialization, exports `db` |
| `auth-system.js` | `js/auth/` | Multi-method login (QR, barcode, email) |
| `reconocimiento-facial.js` | `js/facial/` | Face-api.js integration (1452 LOC) |
| `admin-panel.js` | `js/admin/` | User CRUD, system configuration |
| `iniciar-clase.js` | `js/horarios/` | Active class management |
| `acceso-cbtis.js` | `js/cbtis/` | Full-screen kiosk mode |
| `main.js` | `js/core/` | App initialization (loads last) |

### Script Loading Order

Scripts must be loaded in a specific order in `index.html`:
1. **Core** - firebase-config.js, dom-elements.js, audios.js, overlays.js
2. **Auth** - auth-system.js, password-system.js
3. **Dashboards** - alumno-dashboard.js, profesor-dashboard.js
4. **Admin** - admin-panel.js, admin-grafica.js, admin-qr-generator.js, prefectura.js
5. **CBTis** - acceso-cbtis.js, registros-cbtis-admin.js
6. **Communication** - comunicacion.js
7. **Facial** - reconocimiento-facial.js, gestion-facial-admin.js
8. **Horarios** - horarios.js, horarios-admin.js, iniciar-clase.js
9. **Analytics** - analisis-predictivo.js
10. **Core QR** - scanner.js, procesar-qr.js, qr-dinamico.js, notificaciones.js
11. **Main** - main.js (always last)

## Code Conventions

### Language

- **All code, comments, variables, and functions are in Spanish**
- Function names use camelCase: `procesarQR()`, `registrarFacialAlumno()`
- Spanish verbs: `mostrar` (show), `cerrar` (close), `registrar` (register), `obtener` (get)

### Naming Patterns

```javascript
// Functions - Spanish verbs
function procesarQR(data) { }
function mostrarNotificacion(mensaje) { }
function registrarAsistencia(alumnoId) { }

// DOM IDs - kebab-case with prefixes
// btn-* for buttons, nav-* for navigation, panel-* for panels
document.getElementById('btn-iniciar-clase');
document.getElementById('nav-alumno');
document.getElementById('panel-admin');

// CSS classes for visibility by role
// .nav-alumno, .nav-profesor, .nav-admin
```

### Configuration Objects

Configuration is typically defined at the top of modules:

```javascript
// Example from reconocimiento-facial.js
const FACIAL_CONFIG = {
    umbralReconocimiento: 0.5,  // Recognition threshold (0.4-0.6)
    fotosRegistro: 3,            // Photos for registration
    tiempoEntreDetecciones: 1500 // ms between detections
};

// Example from qr-dinamico.js
const QR_CONFIG = {
    intervaloRotacion: 30000,  // 30 seconds
    algoritmoHash: 'SHA-256'
};
```

### Error Handling

```javascript
// Standard pattern for async functions
async function someOperation() {
    try {
        const result = await db.collection('usuarios').get();
        // Success handling
    } catch (error) {
        console.error('Error en operación:', error);
        mostrarNotificacion('Error: ' + error.message, 'error');
    }
}
```

### Console Logging

Use emoji prefixes for visual distinction:
- `🔐` - Authentication
- `🎭` - Facial recognition
- `📊` - Statistics/analytics
- `✅` - Success
- `❌` - Error
- `⚠️` - Warning

```javascript
console.log('🔐 Usuario autenticado:', userId);
console.log('🎭 Rostro detectado, confianza:', confidence);
console.error('❌ Error al procesar:', error);
```

### Audio Feedback

```javascript
// Use audios.js functions for user feedback
reproducirBeep('success');  // Success sound
reproducirBeep('warning');  // Warning sound
reproducirBeep('error');    // Error sound
```

### DOM Management

DOM elements are centralized in `dom-elements.js`. Use data attributes for navigation:

```html
<div data-section="alumno-dashboard">...</div>
<button data-action="iniciar-clase">...</button>
```

### Styling

- **Primary**: Tailwind CSS via CDN with custom theme
- **Colors**: Primary cyan (#06b6d4), dark theme background
- **Pattern**: Glassmorphism with backdrop blur
- **Fonts**: Plus Jakarta Sans, Space Grotesk

## Database Schema (Firestore)

### Main Collections

| Collection | Purpose | Access |
|------------|---------|--------|
| `usuarios` | All user tokens/metadata | Read: public, Write: restricted |
| `alumnos` | Student profiles with facial data | Read: public, Write: admin |
| `profesores` | Teacher profiles | Read: public, Write: admin |
| `sesiones` | Active class sessions | Read: public |
| `registros` | Attendance records | Read: public, Create: open |
| `ingresos_cbtis` | Kiosk entry/exit logs | Read: public |
| `horarios` | School schedules | Admin-only CRUD |
| `chats` | Messaging threads | Restricted |
| `reportes` | Disciplinary reports | Restricted |
| `logs_facial` | Immutable facial audit logs | Create only |

### Security Rules

Security rules are in `public/firestore.rules`. Key patterns:
- Role-based access via admin email verification
- Read access is generally public for operational efficiency
- Write operations are restricted by user role
- Immutable audit logs for facial recognition

## User Roles

| Role | Access Level | Key Features |
|------|--------------|--------------|
| **Alumno** (Student) | Basic | Dashboard, QR code, attendance history, achievements |
| **Profesor** (Teacher) | Elevated | Class management, attendance marking, student stats |
| **Admin** | Full | User CRUD, system config, analytics, kiosk mode |
| **Padres** (Parents) | Separate app | Child location/attendance tracking (app-padres/) |

## Key Features & Implementation

### Dynamic QR System
- Located in `js/core/qr-dinamico.js`
- Rotates every 30 seconds using SHA-256 hashing
- Encodes: student name, grade, control number
- Falls back to static QR if dynamic fails

### Facial Recognition
- Located in `js/facial/reconocimiento-facial.js`
- Uses `@vladmandic/face-api` (TensorFlow.js-based)
- 3-photo registration process for accuracy
- Stores mathematical descriptors only (privacy-compliant)
- Configurable threshold: 0.4-0.6 (default 0.5)

### Kiosk Mode
- Located in `js/cbtis/acceso-cbtis.js`
- Full-screen campus entry/exit interface
- Supports facial recognition OR QR scanning
- Logs to `ingresos_cbtis` collection

## Development Workflow

### Adding New Features

1. Identify the appropriate module category
2. Create file in the correct subdirectory under `js/`
3. Add `<script>` tag in `index.html` following the load order
4. Document dependencies in `public/js/README.md`

### Modifying Existing Features

1. Read the target file completely before making changes
2. Understand dependencies (check module imports/globals)
3. Maintain Spanish naming conventions
4. Preserve existing error handling patterns
5. Test with appropriate user role

### Common Tasks

**Add a new admin function:**
```javascript
// In js/admin/admin-panel.js
async function nuevaFuncionAdmin() {
    try {
        // Implementation
        mostrarNotificacion('Operación exitosa', 'success');
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarNotificacion('Error: ' + error.message, 'error');
    }
}
```

**Add Firestore listener:**
```javascript
// Real-time updates pattern
db.collection('coleccion').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') { /* handle */ }
        if (change.type === 'modified') { /* handle */ }
        if (change.type === 'removed') { /* handle */ }
    });
});
```

## Important Considerations

### Security
- Never expose Firebase credentials in client code
- Validate all user inputs before Firestore operations
- Use Firestore security rules as primary access control
- Facial descriptors are mathematical only - never store images

### Performance
- Modules are loaded synchronously; maintain load order
- Use Firestore indexes for compound queries
- Large modules (>1000 LOC) could benefit from code splitting

### Browser Compatibility
- HTTPS required for camera access (facial recognition, QR scanning)
- Audio requires user gesture (iOS Safari compatibility)
- PWA features require service worker support

### Testing
- No automated test suite currently exists
- Test with different user roles (alumno, profesor, admin)
- Test camera/audio permissions in different browsers
- Test offline functionality (PWA service worker)

## Files to Avoid Modifying

- `public/firestore.rules` - Critical security, coordinate changes carefully
- `js/core/firebase-config.js` - Contains project credentials
- `public/manifest.json` - PWA configuration

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `public/js/README.md` | Module structure and dependencies |
| `public/app-padres/README.md` | Parents app documentation |
| `BITACORA-DESARROLLO*.md` | Development session logs |
| `estructura-actualizado*.md` | JS module structure reference |

## Glossary (Spanish Terms)

| Spanish | English | Context |
|---------|---------|---------|
| alumno | student | User role |
| profesor | teacher | User role |
| asistencia | attendance | Core feature |
| horario | schedule | Class timing |
| ingreso | entry | Campus access |
| salida | exit | Campus access |
| rostro | face | Facial recognition |
| reporte | report | Disciplinary |
| citatorio | citation | Disciplinary notice |
| permiso | permit | Student absence permission |
| avisos | announcements | Communication |
| plantel | campus | School location |

---

*Last updated: January 2026*
