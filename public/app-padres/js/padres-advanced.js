// ==========================================
// 📱 KEYON PADRES - FUNCIONES AVANZADAS
// ==========================================

// ============ CLASES Y ASISTENCIA ============

/**
 * Cargar horario completo del alumno
 */
async function cargarHorarioCompleto(alumnoId) {
  try {
    // En producción: cargar de Firebase
    // const snapshot = await db.collection('horarios').where('alumnoId', '==', alumnoId).get();
    
    const horario = {
      lunes: [
        { hora: '07:00', materia: 'Matemáticas IV', profesor: 'Prof. García López', aula: '201' },
        { hora: '08:00', materia: 'Física II', profesor: 'Prof. Martínez R.', aula: '305' },
        { hora: '09:00', materia: 'Química II', profesor: 'Prof. Hernández S.', aula: '102' },
        { hora: '10:00', materia: 'Historia de México', profesor: 'Prof. López M.', aula: '204' },
        { hora: '11:00', materia: 'Inglés IV', profesor: 'Prof. Smith J.', aula: '301' },
        { hora: '12:00', materia: 'Programación', profesor: 'Prof. Torres A.', aula: 'Lab 1' }
      ],
      martes: [
        { hora: '07:00', materia: 'Física II', profesor: 'Prof. Martínez R.', aula: '305' },
        { hora: '08:00', materia: 'Matemáticas IV', profesor: 'Prof. García López', aula: '201' },
        { hora: '09:00', materia: 'Historia de México', profesor: 'Prof. López M.', aula: '204' },
        { hora: '10:00', materia: 'Inglés IV', profesor: 'Prof. Smith J.', aula: '301' },
        { hora: '11:00', materia: 'Programación', profesor: 'Prof. Torres A.', aula: 'Lab 1' },
        { hora: '12:00', materia: 'Química II', profesor: 'Prof. Hernández S.', aula: '102' }
      ],
      // ... resto de días
    };
    
    return horario;
  } catch (error) {
    console.error('Error cargando horario:', error);
    return null;
  }
}

/**
 * Obtener asistencia a clases de un día específico
 */
async function obtenerAsistenciaClases(alumnoId, fecha) {
  try {
    const snapshot = await db.collection('sesiones')
      .where('fecha', '==', fecha)
      .get();
    
    const asistencias = [];
    
    snapshot.forEach(doc => {
      const sesion = doc.data();
      // Verificar si el alumno está en la lista de asistencia
      if (sesion.alumnosPresentes && sesion.alumnosPresentes[alumnoId]) {
        asistencias.push({
          sesionId: doc.id,
          materia: sesion.materia,
          profesor: sesion.profesorNombre,
          horaInicio: sesion.horaInicio,
          horaAsistencia: sesion.alumnosPresentes[alumnoId].hora,
          estado: 'presente'
        });
      }
    });
    
    return asistencias;
  } catch (error) {
    console.error('Error obteniendo asistencia a clases:', error);
    return [];
  }
}

// ============ PERMISOS Y SALIDAS ============

/**
 * Obtener permisos de baño del día
 */
async function obtenerPermisosBano(alumnoId, fecha) {
  try {
    // Colección especial para permisos de baño (si existe)
    const snapshot = await db.collection('permisos_bano')
      .where('alumnoId', '==', alumnoId)
      .where('fecha', '==', fecha)
      .orderBy('horaInicio', 'desc')
      .get();
    
    const permisos = [];
    snapshot.forEach(doc => {
      permisos.push({ id: doc.id, ...doc.data() });
    });
    
    return permisos;
  } catch (error) {
    console.error('Error obteniendo permisos de baño:', error);
    return [];
  }
}

/**
 * Obtener permisos especiales (salidas anticipadas, etc.)
 */
async function obtenerPermisosEspeciales(alumnoId, fechaInicio, fechaFin) {
  try {
    const snapshot = await db.collection('permisos')
      .where('alumnoId', '==', alumnoId)
      .where('fecha', '>=', fechaInicio)
      .where('fecha', '<=', fechaFin)
      .get();
    
    const permisos = [];
    snapshot.forEach(doc => {
      permisos.push({ id: doc.id, ...doc.data() });
    });
    
    return permisos;
  } catch (error) {
    console.error('Error obteniendo permisos especiales:', error);
    return [];
  }
}

// ============ MÉTRICAS Y ESTADÍSTICAS ============

/**
 * Calcular métricas mensuales completas
 */
async function calcularMetricasMensuales(alumnoId) {
  const ahora = new Date();
  const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const fechaInicio = primerDia.toISOString().split('T')[0];
  const fechaFin = ahora.toISOString().split('T')[0];
  
  try {
    // Obtener todos los ingresos del mes
    const ingresosSnap = await db.collection('ingresos_cbtis')
      .where('identificador', '==', alumnoId)
      .where('fecha', '>=', fechaInicio)
      .where('fecha', '<=', fechaFin)
      .get();
    
    const registros = [];
    ingresosSnap.forEach(doc => registros.push(doc.data()));
    
    // Días únicos con asistencia
    const diasConIngreso = new Set();
    const retardos = [];
    const primerosIngresos = {}; // { fecha: hora }
    
    registros.forEach(reg => {
      if (reg.tipoRegistro === 'Ingreso') {
        diasConIngreso.add(reg.fecha);
        
        // Guardar primer ingreso del día
        if (!primerosIngresos[reg.fecha] || reg.hora < primerosIngresos[reg.fecha]) {
          primerosIngresos[reg.fecha] = reg.hora;
        }
      }
    });
    
    // Contar retardos (llegó después de 7:15)
    Object.entries(primerosIngresos).forEach(([fecha, hora]) => {
      const [h, m] = hora.split(':').map(Number);
      if (h > 7 || (h === 7 && m > 15)) {
        retardos.push({ fecha, hora });
      }
    });
    
    // Calcular días hábiles del mes
    let diasHabiles = 0;
    const ultimoDia = ahora.getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), d);
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) diasHabiles++;
    }
    
    const asistencias = diasConIngreso.size;
    const faltas = Math.max(0, diasHabiles - asistencias);
    const porcentaje = diasHabiles > 0 ? Math.round((asistencias / diasHabiles) * 100) : 100;
    
    return {
      asistencias,
      faltas,
      retardos: retardos.length,
      diasHabiles,
      porcentaje,
      detalleRetardos: retardos,
      tendencia: porcentaje >= 90 ? 'excelente' : porcentaje >= 80 ? 'buena' : 'baja'
    };
    
  } catch (error) {
    console.error('Error calculando métricas:', error);
    return null;
  }
}

/**
 * Calcular tiempo promedio en la escuela
 */
async function calcularTiempoPromedio(alumnoId, diasAtras = 7) {
  const fechaFin = new Date();
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - diasAtras);
  
  try {
    const snapshot = await db.collection('ingresos_cbtis')
      .where('identificador', '==', alumnoId)
      .where('fecha', '>=', fechaInicio.toISOString().split('T')[0])
      .where('fecha', '<=', fechaFin.toISOString().split('T')[0])
      .orderBy('fecha')
      .orderBy('hora')
      .get();
    
    const registros = [];
    snapshot.forEach(doc => registros.push(doc.data()));
    
    // Agrupar por día
    const porDia = {};
    registros.forEach(reg => {
      if (!porDia[reg.fecha]) porDia[reg.fecha] = [];
      porDia[reg.fecha].push(reg);
    });
    
    let tiempoTotal = 0;
    let diasContados = 0;
    
    Object.entries(porDia).forEach(([fecha, regs]) => {
      let tiempoDia = 0;
      let ultimoIngreso = null;
      
      regs.forEach(reg => {
        if (reg.tipoRegistro === 'Ingreso') {
          ultimoIngreso = new Date(`${fecha}T${reg.hora}`);
        } else if (reg.tipoRegistro === 'Salida' && ultimoIngreso) {
          const salida = new Date(`${fecha}T${reg.hora}`);
          tiempoDia += salida - ultimoIngreso;
          ultimoIngreso = null;
        }
      });
      
      if (tiempoDia > 0) {
        tiempoTotal += tiempoDia;
        diasContados++;
      }
    });
    
    const promedioMs = diasContados > 0 ? tiempoTotal / diasContados : 0;
    const horasPromedio = Math.floor(promedioMs / 3600000);
    const minutosPromedio = Math.floor((promedioMs % 3600000) / 60000);
    
    const horasTotal = Math.floor(tiempoTotal / 3600000);
    const minutosTotal = Math.floor((tiempoTotal % 3600000) / 60000);
    
    return {
      total: { horas: horasTotal, minutos: minutosTotal, texto: `${horasTotal}h ${minutosTotal}m` },
      promedio: { horas: horasPromedio, minutos: minutosPromedio, texto: `${horasPromedio}h ${minutosPromedio}m` },
      diasContados
    };
    
  } catch (error) {
    console.error('Error calculando tiempo:', error);
    return null;
  }
}

// ============ NOTIFICACIONES ============

/**
 * Crear notificación para el padre
 */
async function crearNotificacionPadre(alumnoId, tipo, titulo, descripcion, datos = {}) {
  try {
    await db.collection('notificaciones_padres').add({
      alumnoId,
      tipo, // 'ingreso', 'salida', 'retardo', 'falta', 'clase', 'bano', 'permiso'
      titulo,
      descripcion,
      datos,
      leida: false,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error creando notificación:', error);
    return false;
  }
}

/**
 * Obtener notificaciones no leídas
 */
async function obtenerNotificacionesNoLeidas(alumnoId) {
  try {
    const snapshot = await db.collection('notificaciones_padres')
      .where('alumnoId', '==', alumnoId)
      .where('leida', '==', false)
      .orderBy('fechaCreacion', 'desc')
      .limit(20)
      .get();
    
    const notificaciones = [];
    snapshot.forEach(doc => {
      notificaciones.push({ id: doc.id, ...doc.data() });
    });
    
    return notificaciones;
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Marcar notificación como leída
 */
async function marcarNotificacionLeida(notificacionId) {
  try {
    await db.collection('notificaciones_padres').doc(notificacionId).update({
      leida: true,
      fechaLectura: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error marcando notificación:', error);
    return false;
  }
}

// ============ COMPARATIVAS ============

/**
 * Comparar asistencia del alumno con el promedio del grupo
 */
async function compararConGrupo(alumnoId, grado, grupo) {
  try {
    // Obtener todos los alumnos del mismo grupo
    const alumnosSnap = await db.collection('alumnos')
      .where('grado', '==', grado)
      .where('grupo', '==', grupo)
      .get();
    
    const alumnosIds = [];
    alumnosSnap.forEach(doc => alumnosIds.push(doc.id));
    
    // Calcular métricas de cada alumno
    const metricas = await Promise.all(
      alumnosIds.map(id => calcularMetricasMensuales(id))
    );
    
    // Promediar
    const promedioGrupo = metricas.reduce((acc, m) => {
      if (m) {
        acc.asistencias += m.asistencias;
        acc.faltas += m.faltas;
        acc.retardos += m.retardos;
        acc.count++;
      }
      return acc;
    }, { asistencias: 0, faltas: 0, retardos: 0, count: 0 });
    
    if (promedioGrupo.count > 0) {
      promedioGrupo.asistencias /= promedioGrupo.count;
      promedioGrupo.faltas /= promedioGrupo.count;
      promedioGrupo.retardos /= promedioGrupo.count;
    }
    
    // Obtener métricas del alumno específico
    const metricasAlumno = metricas.find((m, i) => alumnosIds[i] === alumnoId);
    
    return {
      alumno: metricasAlumno,
      grupo: promedioGrupo,
      comparativa: {
        asistencia: metricasAlumno ? metricasAlumno.porcentaje - (promedioGrupo.asistencias * 100 / promedioGrupo.count) : 0,
        mejorQuePromedio: metricasAlumno ? metricasAlumno.porcentaje >= (promedioGrupo.asistencias * 100 / promedioGrupo.count) : false
      }
    };
    
  } catch (error) {
    console.error('Error comparando con grupo:', error);
    return null;
  }
}

// ============ EXPORTAR ============

/**
 * Generar reporte mensual en formato texto
 */
function generarReporteTexto(alumno, metricas, tiempoEscuela) {
  const fecha = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
═══════════════════════════════════════════
        REPORTE DE ASISTENCIA MENSUAL
═══════════════════════════════════════════

Fecha de generación: ${fecha}

INFORMACIÓN DEL ALUMNO
─────────────────────────────────────────
Nombre: ${alumno.nombre} ${alumno.apellidos || ''}
No. Control: ${alumno.control || alumno.id}
Grado y Grupo: ${alumno.grado}° ${alumno.grupo}
Turno: ${alumno.turno || 'Matutino'}

ESTADÍSTICAS DEL MES
─────────────────────────────────────────
✅ Días asistidos: ${metricas.asistencias}
❌ Faltas: ${metricas.faltas}
⏰ Retardos: ${metricas.retardos}
📊 Porcentaje de asistencia: ${metricas.porcentaje}%

TIEMPO EN LA ESCUELA
─────────────────────────────────────────
📅 Total esta semana: ${tiempoEscuela.total.texto}
⏱️ Promedio diario: ${tiempoEscuela.promedio.texto}

─────────────────────────────────────────
Generado por Keyon Padres App
© ${new Date().getFullYear()} Keyon Access System
═══════════════════════════════════════════
  `.trim();
}

// Exponer funciones globalmente
window.cargarHorarioCompleto = cargarHorarioCompleto;
window.obtenerAsistenciaClases = obtenerAsistenciaClases;
window.obtenerPermisosBano = obtenerPermisosBano;
window.obtenerPermisosEspeciales = obtenerPermisosEspeciales;
window.calcularMetricasMensuales = calcularMetricasMensuales;
window.calcularTiempoPromedio = calcularTiempoPromedio;
window.crearNotificacionPadre = crearNotificacionPadre;
window.obtenerNotificacionesNoLeidas = obtenerNotificacionesNoLeidas;
window.marcarNotificacionLeida = marcarNotificacionLeida;
window.compararConGrupo = compararConGrupo;
window.generarReporteTexto = generarReporteTexto;
