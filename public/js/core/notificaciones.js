// ========================================
// 🔔 SISTEMA DE NOTIFICACIONES PUSH
// Keyon Access v2.0
// Integrado con OneSignal
// ========================================

const NOTIFICACIONES_CONFIG = {
  appId: '1892f847-f803-46a9-8fb8-e06ee0399fbb',
  usarOneSignal: true
};

// Estado global
let swRegistration = null;
let pushSubscription = null;
let notificacionesHabilitadas = false;
let oneSignalIniciado = false;

// ========================
// 🔧 INICIALIZACIÓN
// ========================

/**
 * Inicializa el sistema de notificaciones con OneSignal
 */
async function inicializarNotificaciones() {
  console.log('🔔 Inicializando sistema de notificaciones con OneSignal...');
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  
  console.log('📱 Dispositivo iOS:', isIOS);
  console.log('📱 Modo standalone (PWA):', isStandalone);
  
  // Esperar a que OneSignal esté listo
  if (typeof OneSignal !== 'undefined' || window.OneSignalDeferred) {
    try {
      await new Promise(resolve => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal) {
          oneSignalIniciado = true;
          
          // Verificar si ya tiene permiso
          const permission = await OneSignal.Notifications.permission;
          console.log('📋 Permiso OneSignal:', permission);
          
          if (permission) {
            notificacionesHabilitadas = true;
            
            // Obtener el ID del usuario en OneSignal para asociarlo
            const playerId = await OneSignal.User.PushSubscription.id;
            console.log('🆔 OneSignal Player ID:', playerId);
            
            // Guardar el Player ID en Firebase para este usuario
            if (playerId && window.usuarioActual) {
              const usuarioId = window.usuarioActual.control || window.usuarioActual.telefono;
              if (usuarioId) {
                await guardarPlayerIdEnFirebase(usuarioId, playerId);
              }
            }
          }
          
          resolve();
        });
      });
    } catch (error) {
      console.warn('⚠️ Error inicializando OneSignal:', error);
    }
  }
  
  // Actualizar UI
  actualizarUINotificaciones();
  
  return { 
    supported: true, 
    permission: notificacionesHabilitadas,
    enabled: notificacionesHabilitadas,
    isIOS: isIOS,
    isStandalone: isStandalone,
    oneSignal: oneSignalIniciado
  };
}

/**
 * Guarda el Player ID de OneSignal en Firebase
 */
async function guardarPlayerIdEnFirebase(usuarioId, playerId) {
  if (!usuarioId || !playerId) return;
  
  try {
    await db.collection('usuarios').doc(String(usuarioId)).update({
      oneSignalPlayerId: playerId,
      notificacionesActivas: true,
      ultimaActualizacionPush: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Player ID guardado en Firebase');
  } catch (error) {
    // Si el documento no existe, crearlo
    try {
      await db.collection('usuarios').doc(String(usuarioId)).set({
        oneSignalPlayerId: playerId,
        notificacionesActivas: true,
        ultimaActualizacionPush: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('✅ Player ID guardado en Firebase (merge)');
    } catch (e) {
      console.error('Error guardando Player ID:', e);
    }
  }
}

/**
 * Solicita permiso para notificaciones con OneSignal
 */
async function solicitarPermisoNotificaciones() {
  console.log('🔔 Solicitando permiso de notificaciones...');
  
  try {
    // Usar OneSignal para solicitar permiso
    await new Promise((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          // Solicitar permiso
          await OneSignal.Notifications.requestPermission();
          
          const permission = await OneSignal.Notifications.permission;
          console.log('📋 Resultado del permiso:', permission);
          
          if (permission) {
            notificacionesHabilitadas = true;
            
            // Obtener y guardar Player ID
            const playerId = await OneSignal.User.PushSubscription.id;
            console.log('🆔 OneSignal Player ID:', playerId);
            
            if (playerId && window.usuarioActual) {
              const usuarioId = window.usuarioActual.control || window.usuarioActual.telefono;
              if (usuarioId) {
                await guardarPlayerIdEnFirebase(usuarioId, playerId);
              }
            }
            
            mostrarNotificacion('✅ ¡Notificaciones activadas!', 'success');
            resolve(true);
          } else {
            mostrarNotificacion('❌ Permiso denegado', 'error');
            resolve(false);
          }
        } catch (error) {
          console.error('Error en OneSignal:', error);
          reject(error);
        }
      });
    });
    
    actualizarUINotificaciones();
    return notificacionesHabilitadas;
    
  } catch (error) {
    console.error('Error solicitando permiso:', error);
    mostrarNotificacion('❌ Error: ' + error.message, 'error');
    return false;
  }
}

/**
 * Suscribe al usuario a push notifications
 */
async function suscribirPush() {
  if (!swRegistration) {
    console.warn('⚠️ Service Worker no registrado');
    return null;
  }
  
  try {
    // Verificar si ya está suscrito
    pushSubscription = await swRegistration.pushManager.getSubscription();
    
    if (pushSubscription) {
      console.log('✅ Ya suscrito a push');
      await guardarSuscripcionEnFirebase(pushSubscription);
      return pushSubscription;
    }
    
    // Crear nueva suscripción
    // Nota: En producción necesitas un servidor VAPID
    // Por ahora usamos notificaciones locales
    console.log('📝 Creando suscripción local (sin servidor push)');
    
    return null;
    
  } catch (error) {
    console.error('Error suscribiendo a push:', error);
    return null;
  }
}

/**
 * Obtiene la suscripción actual
 */
async function obtenerSuscripcion() {
  if (!swRegistration) return null;
  
  try {
    pushSubscription = await swRegistration.pushManager.getSubscription();
    return pushSubscription;
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    return null;
  }
}

/**
 * Cancela la suscripción a notificaciones
 */
async function desuscribirNotificaciones() {
  try {
    if (pushSubscription) {
      await pushSubscription.unsubscribe();
      pushSubscription = null;
    }
    
    notificacionesHabilitadas = false;
    guardarPreferenciaNotificaciones(false);
    actualizarUINotificaciones();
    
    // Eliminar de Firebase
    await eliminarSuscripcionDeFirebase();
    
    mostrarNotificacion('🔕 Notificaciones desactivadas', 'info');
    return true;
  } catch (error) {
    console.error('Error desuscribiendo:', error);
    return false;
  }
}

// ========================
// 📤 ENVÍO DE NOTIFICACIONES
// ========================

/**
 * Envía una notificación local (sin servidor)
 */
function enviarNotificacionLocal(opciones) {
  console.log('🔔 Intentando enviar notificación:', opciones);
  
  // Verificar permiso
  if (Notification.permission !== 'granted') {
    console.warn('⚠️ Sin permiso para notificaciones. Estado:', Notification.permission);
    mostrarNotificacion('⚠️ Activa las notificaciones primero', 'warning');
    return false;
  }
  
  const config = {
    body: opciones.body || '',
    icon: opciones.icon || './img/icon-192.png',
    badge: opciones.badge || './img/badge-72.png',
    tag: opciones.tag || 'keyon-' + Date.now(),
    vibrate: opciones.vibrate || [200, 100, 200],
    data: opciones.data || {},
    requireInteraction: opciones.requireInteraction || false,
    silent: opciones.silent || false
  };
  
  try {
    // Usar Service Worker si está disponible
    if (swRegistration && swRegistration.showNotification) {
      swRegistration.showNotification(opciones.title || 'Keyon Access', config);
      console.log('📤 Notificación enviada via SW:', opciones.title);
    } else {
      // Fallback a Notification API directa
      const notif = new Notification(opciones.title || 'Keyon Access', config);
      
      notif.onclick = function() {
        window.focus();
        notif.close();
      };
      
      notif.onerror = function(e) {
        console.error('❌ Error en notificación:', e);
      };
      
      console.log('📤 Notificación enviada directamente:', opciones.title);
    }
    
    // Mostrar también notificación visual en la app
    mostrarNotificacion(`🔔 ${opciones.title}`, 'info');
    
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    mostrarNotificacion('❌ Error al enviar notificación: ' + error.message, 'error');
    return false;
  }
}

/**
 * Envía notificación a un usuario específico usando OneSignal
 */
async function enviarNotificacionAUsuario(usuarioId, notificacion) {
  // Validar que usuarioId sea un string válido
  if (!usuarioId || typeof usuarioId !== 'string') {
    console.warn('⚠️ usuarioId inválido:', usuarioId);
    return false;
  }
  
  const id = String(usuarioId).trim();
  
  if (!id || id === 'undefined' || id === 'null') {
    console.warn('⚠️ usuarioId vacío o inválido:', usuarioId);
    return false;
  }
  
  try {
    // 1. Guardar notificación en Firebase (para historial y notificaciones in-app)
    const notificacionData = {
      titulo: notificacion.title || 'Notificación',
      cuerpo: notificacion.body || '',
      tipo: notificacion.tipo || 'general',
      datos: notificacion.data || {},
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      leida: false,
      enviador: window.usuarioActual?.nombre || 'Sistema',
      enviadorId: String(window.usuarioActual?.control || window.usuarioActual?.telefono || 'sistema')
    };
    
    await db.collection('usuarios').doc(id).collection('notificaciones').add(notificacionData);
    
    // 2. Obtener el Player ID de OneSignal del usuario
    const userDoc = await db.collection('usuarios').doc(id).get();
    const userData = userDoc.data();
    
    if (userData && userData.oneSignalPlayerId) {
      // 3. Enviar push real via OneSignal (guardamos en cola para Cloud Function)
      await db.collection('notificaciones_push').add({
        playerId: userData.oneSignalPlayerId,
        titulo: notificacion.title,
        mensaje: notificacion.body,
        datos: notificacion.data || {},
        destinatarioId: id,
        enviado: false,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Notificación push en cola para:', id);
    } else {
      console.log('⚠️ Usuario sin Player ID de OneSignal:', id);
    }
    
    console.log('✅ Notificación guardada para usuario:', id);
    return true;
    
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return false;
  }
}

/**
 * Envía notificación a múltiples usuarios
 */
async function enviarNotificacionMasiva(usuarioIds, notificacion) {
  const resultados = await Promise.all(
    usuarioIds.map(id => enviarNotificacionAUsuario(id, notificacion))
  );
  
  const exitosos = resultados.filter(r => r).length;
  console.log(`📤 Notificaciones enviadas: ${exitosos}/${usuarioIds.length}`);
  
  return exitosos;
}

/**
 * Envía notificación a todos los alumnos de un grupo
 */
async function notificarGrupo(grado, grupo, notificacion) {
  try {
    const snapshot = await db.collection('usuarios')
      .where('tipo', '==', 'Alumno')
      .where('grado', '==', `${grado}°${grupo}`)
      .get();
    
    const usuarioIds = snapshot.docs.map(doc => doc.id);
    
    if (usuarioIds.length === 0) {
      console.log('⚠️ No hay alumnos en el grupo', grado, grupo);
      return 0;
    }
    
    return await enviarNotificacionMasiva(usuarioIds, notificacion);
    
  } catch (error) {
    console.error('Error notificando grupo:', error);
    return 0;
  }
}

// ========================
// 📥 RECEPCIÓN DE NOTIFICACIONES
// ========================

/**
 * Escucha notificaciones nuevas del usuario actual
 */
function escucharNotificaciones() {
  const usuarioId = window.usuarioActual?.control || window.usuarioActual?.telefono;
  
  if (!usuarioId) {
    console.warn('⚠️ No hay usuario logueado para escuchar notificaciones');
    return null;
  }
  
  console.log('👂 Escuchando notificaciones para:', usuarioId);
  
  // Listener en tiempo real
  const unsubscribe = db.collection('usuarios').doc(usuarioId)
    .collection('notificaciones')
    .where('leida', '==', false)
    .orderBy('fechaCreacion', 'desc')
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notif = change.doc.data();
          console.log('🔔 Nueva notificación:', notif);
          
          // Mostrar notificación local
          enviarNotificacionLocal({
            title: notif.titulo,
            body: notif.cuerpo,
            tag: change.doc.id,
            data: {
              notifId: change.doc.id,
              tipo: notif.tipo,
              ...notif.datos
            }
          });
          
          // Actualizar badge
          actualizarBadgeNotificaciones();
        }
      });
    }, (error) => {
      console.error('Error escuchando notificaciones:', error);
    });
  
  return unsubscribe;
}

/**
 * Obtiene notificaciones no leídas
 */
async function obtenerNotificacionesNoLeidas() {
  const usuarioId = window.usuarioActual?.control || window.usuarioActual?.telefono;
  if (!usuarioId) return [];
  
  try {
    const snapshot = await db.collection('usuarios').doc(usuarioId)
      .collection('notificaciones')
      .where('leida', '==', false)
      .orderBy('fechaCreacion', 'desc')
      .limit(20)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Marca una notificación como leída
 */
async function marcarNotificacionLeida(notifId) {
  const usuarioId = window.usuarioActual?.control || window.usuarioActual?.telefono;
  if (!usuarioId) return false;
  
  try {
    await db.collection('usuarios').doc(usuarioId)
      .collection('notificaciones').doc(notifId)
      .update({ leida: true, fechaLectura: firebase.firestore.FieldValue.serverTimestamp() });
    
    actualizarBadgeNotificaciones();
    return true;
  } catch (error) {
    console.error('Error marcando notificación:', error);
    return false;
  }
}

/**
 * Marca todas las notificaciones como leídas
 */
async function marcarTodasLeidas() {
  const usuarioId = window.usuarioActual?.control || window.usuarioActual?.telefono;
  if (!usuarioId) return false;
  
  try {
    const snapshot = await db.collection('usuarios').doc(usuarioId)
      .collection('notificaciones')
      .where('leida', '==', false)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        leida: true, 
        fechaLectura: firebase.firestore.FieldValue.serverTimestamp() 
      });
    });
    
    await batch.commit();
    actualizarBadgeNotificaciones();
    return true;
    
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    return false;
  }
}

// ========================
// 🎨 UI DE NOTIFICACIONES
// ========================

/**
 * Actualiza la UI según el estado de notificaciones
 */
function actualizarUINotificaciones() {
  const btnActivar = document.getElementById('btn-activar-notificaciones');
  const btnDesactivar = document.getElementById('btn-desactivar-notificaciones');
  const estadoEl = document.getElementById('estado-notificaciones');
  
  // Verificar si Notification API existe
  if (!('Notification' in window)) {
    // iOS sin PWA instalada o navegador no compatible
    if (estadoEl) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        estadoEl.innerHTML = '<span class="text-yellow-400">📱 Instala la app primero</span>';
      } else {
        estadoEl.innerHTML = '<span class="text-red-400">🚫 No soportado</span>';
      }
    }
    if (btnActivar) {
      btnActivar.style.display = 'none';
    }
    if (btnDesactivar) {
      btnDesactivar.style.display = 'none';
    }
    return;
  }
  
  const permiso = Notification.permission;
  const activas = notificacionesHabilitadas && permiso === 'granted';
  
  if (btnActivar) {
    btnActivar.style.display = activas ? 'none' : 'flex';
  }
  
  if (btnDesactivar) {
    btnDesactivar.style.display = activas ? 'flex' : 'none';
  }
  
  if (estadoEl) {
    if (permiso === 'denied') {
      estadoEl.innerHTML = '<span class="text-red-400">🚫 Bloqueadas</span>';
    } else if (activas) {
      estadoEl.innerHTML = '<span class="text-green-400">✅ Activadas</span>';
    } else {
      estadoEl.innerHTML = '<span class="text-yellow-400">⚠️ Desactivadas</span>';
    }
  }
}

/**
 * Actualiza el badge con número de notificaciones no leídas
 */
async function actualizarBadgeNotificaciones() {
  const badge = document.getElementById('badge-notificaciones');
  if (!badge) return;
  
  const notifs = await obtenerNotificacionesNoLeidas();
  const count = notifs.length;
  
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/**
 * Muestra el panel de notificaciones
 */
async function mostrarPanelNotificaciones() {
  const notifs = await obtenerNotificacionesNoLeidas();
  
  // Crear o actualizar panel
  let panel = document.getElementById('panel-notificaciones');
  
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'panel-notificaciones';
    panel.className = 'fixed top-16 right-4 w-80 max-h-96 overflow-y-auto glass rounded-2xl shadow-2xl z-50 hidden';
    document.body.appendChild(panel);
  }
  
  if (notifs.length === 0) {
    panel.innerHTML = `
      <div class="p-6 text-center">
        <span class="text-4xl block mb-2 opacity-50">🔔</span>
        <p class="text-text-muted">No tienes notificaciones nuevas</p>
      </div>
    `;
  } else {
    panel.innerHTML = `
      <div class="p-4 border-b border-border-subtle flex items-center justify-between">
        <h3 class="font-semibold text-text-main">Notificaciones</h3>
        <button onclick="marcarTodasLeidas()" class="text-xs text-accent hover:underline">Marcar todas</button>
      </div>
      <div class="divide-y divide-border-subtle">
        ${notifs.map(n => `
          <div class="p-4 hover:bg-surface-light/50 cursor-pointer transition-all" onclick="abrirNotificacion('${n.id}')">
            <div class="flex items-start gap-3">
              <span class="text-xl">${getIconoNotificacion(n.tipo)}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-text-main text-sm truncate">${n.titulo}</p>
                <p class="text-text-muted text-xs mt-1 line-clamp-2">${n.cuerpo}</p>
                <p class="text-text-muted text-xs mt-2 opacity-50">${formatearFecha(n.fechaCreacion?.toDate())}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  panel.classList.toggle('hidden');
}

/**
 * Abre una notificación específica
 */
async function abrirNotificacion(notifId) {
  await marcarNotificacionLeida(notifId);
  
  // Cerrar panel
  const panel = document.getElementById('panel-notificaciones');
  if (panel) panel.classList.add('hidden');
  
  // Aquí podrías navegar a una sección específica según el tipo de notificación
}

/**
 * Obtiene icono según tipo de notificación
 */
function getIconoNotificacion(tipo) {
  const iconos = {
    'asistencia': '📋',
    'reporte': '📊',
    'mensaje': '💬',
    'alerta': '⚠️',
    'recordatorio': '⏰',
    'calificacion': '📝',
    'tarea': '📚',
    'evento': '📅',
    'general': '🔔'
  };
  return iconos[tipo] || '🔔';
}

/**
 * Formatea fecha para mostrar
 */
function formatearFecha(fecha) {
  if (!fecha) return '';
  
  const ahora = new Date();
  const diff = ahora - fecha;
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h`;
  if (dias < 7) return `Hace ${dias} días`;
  
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

/**
 * Muestra instrucciones para desbloquear notificaciones
 */
function mostrarInstruccionesDesbloqueo() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instrucciones = '';
  
  if (isIOS) {
    instrucciones = `
      <h4 class="font-semibold mb-2">En iOS Safari:</h4>
      <ol class="list-decimal list-inside text-sm space-y-1">
        <li>Agrega esta página a la pantalla de inicio</li>
        <li>Abre la app desde el ícono</li>
        <li>Ve a Configuración > Notificaciones</li>
        <li>Busca la app y activa las notificaciones</li>
      </ol>
    `;
  } else if (isAndroid) {
    instrucciones = `
      <h4 class="font-semibold mb-2">En Android Chrome:</h4>
      <ol class="list-decimal list-inside text-sm space-y-1">
        <li>Toca el candado 🔒 en la barra de direcciones</li>
        <li>Toca "Configuración del sitio"</li>
        <li>Toca "Notificaciones"</li>
        <li>Selecciona "Permitir"</li>
      </ol>
    `;
  } else {
    instrucciones = `
      <h4 class="font-semibold mb-2">En el navegador:</h4>
      <ol class="list-decimal list-inside text-sm space-y-1">
        <li>Haz clic en el candado 🔒 en la barra de direcciones</li>
        <li>Busca "Notificaciones"</li>
        <li>Cámbialo a "Permitir"</li>
        <li>Recarga la página</li>
      </ol>
    `;
  }
  
  // Mostrar modal con instrucciones
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="glass rounded-2xl p-6 max-w-sm w-full">
      <h3 class="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        🔔 Activar Notificaciones
      </h3>
      <div class="text-text-muted mb-4">
        ${instrucciones}
      </div>
      <button onclick="this.closest('.fixed').remove()" class="w-full py-3 bg-accent hover:bg-accent/80 rounded-xl text-white font-semibold transition-all">
        Entendido
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ========================
// 💾 PERSISTENCIA
// ========================

/**
 * Guarda la suscripción en Firebase
 */
async function guardarSuscripcionEnFirebase(subscription) {
  const usuarioId = window.usuarioActual?.control || window.usuarioActual?.telefono;
  if (!usuarioId || !subscription) return;
  
  try {
    await db.collection('usuarios').doc(usuarioId).update({
      pushSubscription: JSON.stringify(subscription),
      notificacionesActivas: true,
      ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Suscripción guardada en Firebase');
  } catch (error) {
    console.error('Error guardando suscripción:', error);
  }
}

/**
 * Elimina la suscripción de Firebase
 */
async function eliminarSuscripcionDeFirebase() {
  const usuarioId = window.usuarioActual?.control || window.usuarioActual?.telefono;
  if (!usuarioId) return;
  
  try {
    await db.collection('usuarios').doc(usuarioId).update({
      pushSubscription: null,
      notificacionesActivas: false
    });
  } catch (error) {
    console.error('Error eliminando suscripción:', error);
  }
}

/**
 * Guarda preferencia local
 */
function guardarPreferenciaNotificaciones(activas) {
  try {
    localStorage.setItem('keyon_notificaciones', activas ? '1' : '0');
  } catch (e) {}
}

/**
 * Obtiene preferencia local
 */
function obtenerPreferenciaNotificaciones() {
  try {
    return localStorage.getItem('keyon_notificaciones') === '1';
  } catch (e) {
    return false;
  }
}

// ========================
// 🚀 TIPOS DE NOTIFICACIONES PREDEFINIDAS
// ========================

const TiposNotificacion = {
  // Para alumnos
  ASISTENCIA_REGISTRADA: (alumno, clase) => ({
    title: '✅ Asistencia Registrada',
    body: `Tu asistencia en ${clase} ha sido registrada`,
    tipo: 'asistencia'
  }),
  
  RETARDO: (alumno, minutos) => ({
    title: '⚠️ Llegaste tarde',
    body: `Llegaste ${minutos} minutos tarde a clase`,
    tipo: 'alerta'
  }),
  
  FALTA: (fecha, clase) => ({
    title: '❌ Falta registrada',
    body: `No asististe a ${clase} el ${fecha}`,
    tipo: 'alerta'
  }),
  
  SALIDA_BANO: (duracion) => ({
    title: '🚻 Salida al baño',
    body: `Tiempo fuera: ${duracion}. Recuerda regresar pronto.`,
    tipo: 'recordatorio'
  }),
  
  // Para profesores
  CLASE_PROXIMA: (clase, minutos) => ({
    title: '⏰ Clase próxima',
    body: `Tu clase de ${clase} comienza en ${minutos} minutos`,
    tipo: 'recordatorio'
  }),
  
  ALUMNO_AUSENTE: (alumno, clase) => ({
    title: '📋 Alumno ausente',
    body: `${alumno} no asistió a ${clase}`,
    tipo: 'asistencia'
  }),
  
  // Generales
  MENSAJE: (remitente, preview) => ({
    title: `💬 Mensaje de ${remitente}`,
    body: preview.substring(0, 100),
    tipo: 'mensaje'
  }),
  
  REPORTE: (titulo) => ({
    title: '📊 Nuevo reporte disponible',
    body: titulo,
    tipo: 'reporte'
  }),
  
  EVENTO: (titulo, fecha) => ({
    title: '📅 ' + titulo,
    body: `Fecha: ${fecha}`,
    tipo: 'evento'
  })
};

// ========================
// 🎯 INICIALIZACIÓN AUTO
// ========================

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar después de un pequeño delay
  setTimeout(() => {
    inicializarNotificaciones().then(result => {
      console.log('🔔 Estado de notificaciones:', result);
      
      // Si el usuario ya tiene permiso, escuchar notificaciones
      if (result.enabled && window.usuarioActual) {
        escucharNotificaciones();
      }
    });
  }, 1000);
});

// Escuchar cuando el usuario hace login
window.addEventListener('usuarioLogueado', () => {
  if (notificacionesHabilitadas) {
    escucharNotificaciones();
  }
  actualizarBadgeNotificaciones();
});

// ========================
// 🔹 EXPORTS
// ========================
window.inicializarNotificaciones = inicializarNotificaciones;
window.solicitarPermisoNotificaciones = solicitarPermisoNotificaciones;
window.desuscribirNotificaciones = desuscribirNotificaciones;
window.enviarNotificacionLocal = enviarNotificacionLocal;
window.enviarNotificacionAUsuario = enviarNotificacionAUsuario;
window.enviarNotificacionMasiva = enviarNotificacionMasiva;
window.notificarGrupo = notificarGrupo;
window.escucharNotificaciones = escucharNotificaciones;
window.obtenerNotificacionesNoLeidas = obtenerNotificacionesNoLeidas;
window.marcarNotificacionLeida = marcarNotificacionLeida;
window.marcarTodasLeidas = marcarTodasLeidas;
window.mostrarPanelNotificaciones = mostrarPanelNotificaciones;
window.TiposNotificacion = TiposNotificacion;

console.log('🔔 Sistema de Notificaciones cargado');
