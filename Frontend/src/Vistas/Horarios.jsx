import React, { useState, useEffect } from 'react';
import api from '../api/axiosClient';
import EmergenciaModal from './EmergenciaModal';
import '../styles/Horarios.css';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Sugerencias de procedimientos quirúrgicos para autocompletado rápido
const sugerenciasProcedimientos = [
  'Apendicectomía laparoscópica',
  'Colecistectomía',
  'Cirugía Cardíaca',
  'Cirugía Abdominal',
  'Cirugía Ortopédica',
  'Cirugía Neurológica',
  'Cirugía Plástica y Reconstructiva',
  'Cirugía Vascular',
  'Cirugía Torácica',
  'Cirugía Pediátrica',
  'Cirugía Oncológica',
  'Cirugía Oftalmológica',
  'Trauma y Ortopedia'
];

const statusMap = {
  programada: { texto: 'Programada', color: '#3498db' },
  baja: { texto: 'Baja Urgencia', color: '#27ae60' },
  medio: { texto: 'Media Urgencia', color: '#f39c12' },
  emergencia: { texto: 'Emergencia', color: '#e74c3c' },
  completada: { texto: 'Completada', color: '#6c757d' },
  en_proceso: { texto: 'En Proceso', color: '#9b59b6' },
  cancelada: { texto: 'Cancelada', color: '#c0392b' }
};

const statusOptions = Object.keys(statusMap);

const horariosDelDia = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', 
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

const Horarios = () => {
  // --- ESTADOS DE DATOS REALES DE LA API ---
  const [cirugias, setCirugias] = useState([]);
  const [quirofanos, setQuirofanos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');

  // --- NAVEGACIÓN Y FILTRO POR DÍA ---
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes');

  // --- CONTROL INDIVIDUAL DE MODALES SEPARADOS ---
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showGestionQuirofanos, setShowGestionQuirofanos] = useState(false);
  const [showListaEdicion, setShowListaEdicion] = useState(false);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);

  // Cirugía seleccionada para ver detalles
  const [detalleCirugia, setDetalleCirugia] = useState(null);

  // --- ESTADO PARA MODAL DEDICADO: AGREGAR HORARIO ---
  const getFechaParaDia = (dia) => {
    const diasIndices = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0 Dom, 1 Lun ...
    const diff = (diasIndices[dia] || 1) - (diaActual === 0 ? 7 : diaActual);
    const target = new Date(hoy);
    target.setDate(hoy.getDate() + diff);
    return target.toISOString().split('T')[0];
  };

  const initialAgregarState = {
    id_expediente: '',
    fecha: getFechaParaDia('Lunes'),
    id_quirófano: '',
    id_equipomedico: '',
    procedimiento: '',
    hora_inicio: '08:00',
    duracion: 2,
    estado: 'programada',
    diagnostico_pre: ''
  };
  const [formAgregar, setFormAgregar] = useState(initialAgregarState);

  // --- ESTADO PARA MODAL DEDICADO: EDITAR HORARIO ---
  const initialEditarState = {
    id_cirugia: null,
    id_expediente: '',
    fecha: '',
    id_quirófano: '',
    id_equipomedico: '',
    procedimiento: '',
    hora_inicio: '08:00',
    duracion: 2,
    estado: 'programada',
    diagnostico_pre: ''
  };
  const [formEditar, setFormEditar] = useState(initialEditarState);

  // --- ESTADO PARA NUEVO QUIRÓFANO ---
  const [nuevoQuirofano, setNuevoQuirofano] = useState({
    sala: '',
    estado: 'disponible'
  });

  // --- CARGA DE DATOS INICIAL DESDE LA API ---
  useEffect(() => {
    cargarTodosLosDatos();
  }, []);

  // Actualizar fecha por defecto al cambiar pestaña de día
  useEffect(() => {
    setFormAgregar(prev => ({
      ...prev,
      fecha: getFechaParaDia(diaSeleccionado)
    }));
  }, [diaSeleccionado]);

  const cargarTodosLosDatos = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const [resCirugias, resQuirofanos, resPacientes, resEquipos] = await Promise.all([
        api.get('/cirugias'),
        api.get('/quirofanos'),
        api.get('/pacientes'),
        api.get('/equipos/entradas')
      ]);

      setCirugias(resCirugias.data || []);
      setQuirofanos(resQuirofanos.data || []);
      setPacientes(resPacientes.data || []);
      setEquipos(resEquipos.data || []);
    } catch (err) {
      console.error('Error al cargar datos en Horarios:', err);
      setErrorBanner('No se pudieron sincronizar los datos con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER DE TIEMPOS Y HORAS ---
  const calcularHoraFin = (inicio, duracionHoras) => {
    if (!inicio) return '';
    const [h, m] = inicio.split(':').map(Number);
    const dur = parseInt(duracionHoras, 10) || 2;
    const totalMin = h * 60 + m + dur * 60;
    const hf = Math.floor(totalMin / 60) % 24;
    const mf = totalMin % 60;
    return `${hf.toString().padStart(2, '0')}:${mf.toString().padStart(2, '0')}`;
  };

  const calcularDuracionHoras = (inicio, fin) => {
    if (!inicio || !fin) return 2;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    const dur = Math.round(mins / 60);
    return dur > 0 ? dur : 2;
  };

  const formatearHoraSimple = (horaStr) => {
    if (!horaStr) return '08:00';
    return horaStr.slice(0, 5); // Ej '08:00:00' -> '08:00'
  };

  const getHorarioPosicion = (ini, fin) => {
    const inicioStr = formatearHoraSimple(ini);
    const finStr = formatearHoraSimple(fin);
    const i = horariosDelDia.indexOf(inicioStr);
    const f = horariosDelDia.indexOf(finStr);

    if (i === -1 || f === -1 || f <= i) {
      const startIndex = i !== -1 ? i : 2;
      return { inicio: startIndex, duracion: 2, altura: 112 };
    }
    const slots = f - i;
    return { inicio: i, duracion: slots, altura: slots * 58 - 4 };
  };

  const getStatusInfo = (estado) => {
    if (!estado) return statusMap.programada;
    const key = estado.toLowerCase().replace(/[\s-]/g, '_');
    return statusMap[key] || statusMap.programada;
  };

  // --- FILTRADO DE CIRUGÍAS POR DÍA ---
  const filtrarCirugiasPorDia = () => {
    const fechaEsperada = getFechaParaDia(diaSeleccionado);

    return cirugias.filter(c => {
      if (!c.fecha) return false;
      const fechaC = typeof c.fecha === 'string' ? c.fecha.split('T')[0] : new Date(c.fecha).toISOString().split('T')[0];
      
      // Coincidencia exacta de fecha
      if (fechaC === fechaEsperada) return true;

      // Coincidencia por día de la semana si no está en la misma fecha calendario
      const fechaObj = new Date(c.fecha);
      const diaNum = fechaObj.getUTCDay();
      const nombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return nombres[diaNum] === diaSeleccionado;
    });
  };

  const cirugiasDelDia = filtrarCirugiasPorDia();

  const getCirugiasPorQuirofano = (nombreSala) => {
    return cirugiasDelDia.filter(c => {
      const sala = c.quirofano_sala || c.sala;
      return sala === nombreSala;
    });
  };

  // --- LÓGICA MODAL 1: AGREGAR HORARIO ---
  const handleOpenAgregarModal = () => {
    const primerQuirofanoDisponible = quirofanos.find(q => q.estado === 'disponible');
    setFormAgregar({
      id_expediente: pacientes[0]?.id_expediente || '',
      fecha: getFechaParaDia(diaSeleccionado),
      id_quirófano: primerQuirofanoDisponible?.id_quirófano || quirofanos[0]?.id_quirófano || '',
      id_equipomedico: equipos[0]?.id_equipomedico || '',
      procedimiento: '',
      hora_inicio: '08:00',
      duracion: 2,
      estado: 'programada',
      diagnostico_pre: ''
    });
    setShowAgregarModal(true);
  };

  const handleAgregarSubmit = async (e) => {
    e.preventDefault();
    if (!formAgregar.id_expediente || !formAgregar.id_quirófano || !formAgregar.procedimiento) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const horaFin = calcularHoraFin(formAgregar.hora_inicio, formAgregar.duracion);
    const payload = {
      ...formAgregar,
      hora_inicio: formAgregar.hora_inicio,
      hora_fin: horaFin
    };

    try {
      await api.post('/cirugias', payload);
      alert('✅ Horario de cirugía registrado exitosamente en el sistema.');
      setShowAgregarModal(false);
      await cargarTodosLosDatos();
    } catch (err) {
      console.error('Error al registrar horario:', err);
      const msg = err.response?.data?.msg || err.message || 'Error al guardar horario en el servidor.';
      alert(`⚠️ ${msg}`);
    }
  };

  // --- LÓGICA MODAL 2: EDITAR HORARIO (SEPARADO) ---
  const handleOpenEditarModal = (cirugia) => {
    const horaIni = formatearHoraSimple(cirugia.hora_inicio) || '08:00';
    const horaFin = formatearHoraSimple(cirugia.hora_fin) || '10:00';
    const dur = calcularDuracionHoras(horaIni, horaFin);
    const fechaFormateada = cirugia.fecha ? new Date(cirugia.fecha).toISOString().split('T')[0] : '';

    setFormEditar({
      id_cirugia: cirugia.id_cirugia,
      id_expediente: cirugia.id_expediente,
      fecha: fechaFormateada,
      id_quirófano: cirugia.id_quirófano,
      id_equipomedico: cirugia.id_equipomedico,
      procedimiento: cirugia.procedimiento || '',
      hora_inicio: horaIni,
      duracion: dur,
      estado: (cirugia.estado || 'programada').toLowerCase(),
      diagnostico_pre: cirugia.diagnostico_pre || ''
    });
    setShowDetalleModal(false);
    setShowEditarModal(true);
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    const horaFin = calcularHoraFin(formEditar.hora_inicio, formEditar.duracion);
    const payload = {
      ...formEditar,
      hora_inicio: formEditar.hora_inicio,
      hora_fin: horaFin
    };

    try {
      await api.put(`/cirugias/${formEditar.id_cirugia}`, payload);
      alert('✅ Horario de cirugía actualizado correctamente.');
      setShowEditarModal(false);
      await cargarTodosLosDatos();
    } catch (err) {
      console.error('Error al actualizar horario:', err);
      const msg = err.response?.data?.msg || err.message || 'Error al actualizar el horario.';
      alert(`⚠️ ${msg}`);
    }
  };

  // --- LÓGICA MODAL 3: DETALLE DE CIRUGÍA ---
  const handleVerDetalleClick = (cirugia) => {
    setDetalleCirugia(cirugia);
    setShowDetalleModal(true);
  };

  const handleEliminarCirugia = async (id, procedimiento) => {
    if (window.confirm(`¿Estás seguro de cancelar y eliminar la cirugía "${procedimiento}"?`)) {
      try {
        await api.delete(`/cirugias/${id}`);
        alert('✅ Cirugía eliminada correctamente.');
        setShowDetalleModal(false);
        await cargarTodosLosDatos();
      } catch (err) {
        console.error('Error al eliminar cirugía:', err);
        alert('Error al eliminar cirugía: ' + (err.response?.data?.msg || err.message));
      }
    }
  };

  // --- LÓGICA MODAL 4: CAMBIO RÁPIDO DE ESTADO ---
  const handleStatusChangeFromList = async (id, nuevoStatus) => {
    try {
      await api.put(`/cirugias/${id}`, { estado: nuevoStatus });
      setCirugias(prev =>
        prev.map(c => c.id_cirugia === id ? { ...c, estado: nuevoStatus } : c)
      );
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('Error al cambiar estado: ' + (err.response?.data?.msg || err.message));
    }
  };

  // --- LÓGICA MODAL 5: CIRUGÍA DE EMERGENCIA ---
  const handleEmergenciaConfirm = async (datosEmergencia) => {
    const horaInicio = '15:00';
    const horaFin = '17:00';
    const payload = {
      id_expediente: datosEmergencia.id_expediente,
      id_quirófano: datosEmergencia.id_quirófano,
      id_equipomedico: datosEmergencia.id_equipomedico || equipos[0]?.id_equipomedico || 1,
      procedimiento: datosEmergencia.procedimiento || 'Cirugía de Emergencia',
      fecha: getFechaParaDia(diaSeleccionado),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: 'emergencia',
      diagnostico_pre: datosEmergencia.observaciones || `Urgencia: ${datosEmergencia.urgencia}`
    };

    try {
      await api.post('/cirugias', payload);
      alert('🚨 Cirugía de emergencia registrada exitosamente en quirófano.');
      setShowEmergenciaModal(false);
      await cargarTodosLosDatos();
    } catch (err) {
      console.error('Error al registrar emergencia:', err);
      alert('Error al registrar emergencia: ' + (err.response?.data?.msg || err.message));
    }
  };

  // --- GESTIÓN DE QUIRÓFANOS ---
  const tieneCirugiasAsignadas = (salaQuirofano) => {
    return cirugias.some(c => (c.quirofano_sala || c.sala) === salaQuirofano && c.estado !== 'Cancelada');
  };

  const handleAgregarQuirofano = async (e) => {
    e.preventDefault();
    if (!nuevoQuirofano.sala || !nuevoQuirofano.estado) {
      alert('Por favor completa todos los campos del quirófano.');
      return;
    }

    try {
      const response = await api.post('/quirofanos', nuevoQuirofano);
      setQuirofanos([...quirofanos, response.data.quirofano || response.data]);
      setNuevoQuirofano({ sala: '', estado: 'disponible' });
      alert('✅ Quirófano agregado correctamente');
    } catch (err) {
      console.error('Error al agregar quirófano:', err);
      alert('Error: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleToggleQuirofanoEstado = async (sala, estadoActual) => {
    let nuevoEstado;
    if (estadoActual === 'disponible') {
      nuevoEstado = 'ocupado';
    } else if (estadoActual === 'ocupado') {
      if (tieneCirugiasAsignadas(sala)) {
        alert(`"${sala}" tiene cirugías asignadas. No se puede poner en mantenimiento.`);
        return;
      }
      nuevoEstado = 'mantenimiento';
    } else {
      nuevoEstado = 'disponible';
    }

    try {
      await api.put(`/quirofanos/${sala}`, { estado: nuevoEstado });
      setQuirofanos(prev =>
        prev.map(q => q.sala === sala ? { ...q, estado: nuevoEstado } : q)
      );
    } catch (err) {
      console.error('Error al cambiar estado del quirófano:', err);
      alert('Error: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleEliminarQuirofano = async (sala) => {
    if (tieneCirugiasAsignadas(sala)) {
      alert(`"${sala}" tiene cirugías programadas. No se puede eliminar.`);
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el quirófano "${sala}"?`)) {
      try {
        await api.delete(`/quirofanos/${sala}`);
        setQuirofanos(prev => prev.filter(q => q.sala !== sala));
        alert('✅ Quirófano eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar quirófano:', err);
        alert('Error: ' + (err.response?.data?.msg || err.message));
      }
    }
  };

  const gridColumnStyle = {
    gridTemplateColumns: `100px repeat(${quirofanos.length > 0 ? quirofanos.length : 1}, 1fr)`
  };

  if (loading) {
    return (
      <div className="horarios-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>Cargando programación y disponibilidad de quirófanos...</p>
      </div>
    );
  }

  return (
    <div className="horarios-container">
      {/* Header */}
      <div className="horarios-header">
        <div>
          <h2>Gestión de Horarios - {diaSeleccionado}</h2>
          <small style={{ color: '#7f8c8d' }}>
            Fecha programada: <strong>{getFechaParaDia(diaSeleccionado)}</strong>
          </small>
        </div>
        <div className="header-actions">
          <button className="btn-quirofanos" onClick={() => setShowGestionQuirofanos(true)}>
            🏥 Gestionar Quirófanos
          </button>
          <button className="btn-agregar-horario" onClick={handleOpenAgregarModal}>
            ➕ Agregar Horario
          </button>
          <button className="btn-tabla-horarios" onClick={() => setShowListaEdicion(true)}>
            ✏️ Cambiar Estado
          </button>
          <button className="emergency-btn-horarios" onClick={() => setShowEmergenciaModal(true)}>
            🚨 Registrar Emergencia
          </button>
        </div>
      </div>

      {errorBanner && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px' }}>
          {errorBanner}
        </div>
      )}

      {/* Tabs de Días de la Semana */}
      <div className="dias-semana-tabs">
        {diasSemana.map(dia => (
          <button
            key={dia}
            className={`dia-tab ${diaSeleccionado === dia ? 'active' : ''}`}
            onClick={() => setDiaSeleccionado(dia)}
          >
            {dia}
          </button>
        ))}
      </div>

      {/* Leyenda de Estados */}
      <div className="leyenda-horarios">
        <h4>Leyenda de Estados Quirúrgicos:</h4>
        <div className="leyenda-items">
          <div className="leyenda-item"><div className="color-box programada"></div><span>Programada</span></div>
          <div className="leyenda-item"><div className="color-box baja"></div><span>Baja Urgencia</span></div>
          <div className="leyenda-item"><div className="color-box medio"></div><span>Media Urgencia</span></div>
          <div className="leyenda-item"><div className="color-box emergencia"></div><span>Emergencia</span></div>
          <div className="leyenda-item"><div className="color-box completada"></div><span>Completada</span></div>
        </div>
      </div>

      {/* Grilla / Calendario Principal */}
      <div className="calendario-horarios">
        <div className="calendario-header" style={gridColumnStyle}>
          <div className="hora-header">Horas</div>
          {quirofanos.map(q => {
            let estadoTexto = '✅ Disponible';
            if (q.estado === 'ocupado') estadoTexto = '🔴 Ocupado';
            if (q.estado === 'mantenimiento') estadoTexto = '🛠️ Mantenimiento';

            return (
              <div key={q.sala || q.id_quirófano} className="quirofano-header">
                <span className="quirofano-nombre" translate="no">{q.sala}</span>
                <span className={`quirofano-estado estado-${q.estado}`}>
                  {estadoTexto}
                </span>
              </div>
            );
          })}
          {quirofanos.length === 0 && <div className="quirofano-header">-</div>}
        </div>

        <div className="calendario-body" style={gridColumnStyle}>
          {/* Columna de Horas */}
          <div className="horas-columna">
            {horariosDelDia.map(hora => (
              <div key={hora} className="hora-slot">
                <span className="hora-texto">{hora}</span>
              </div>
            ))}
          </div>

          {/* Columnas por Quirófano con cirugías reales */}
          {quirofanos.map(q => {
            const cirugiasDeEstaSala = getCirugiasPorQuirofano(q.sala);

            return (
              <div key={q.sala || q.id_quirófano} className="quirofano-columna">
                {horariosDelDia.map(hora => (
                  <div key={`${q.sala}-${hora}`} className="celda-horario"></div>
                ))}

                {cirugiasDeEstaSala.map(cirugia => {
                  const horaIni = formatearHoraSimple(cirugia.hora_inicio) || '08:00';
                  const horaFin = formatearHoraSimple(cirugia.hora_fin) || '10:00';
                  const posicion = getHorarioPosicion(horaIni, horaFin);
                  const estadoInfo = getStatusInfo(cirugia.estado);
                  const duracionH = calcularDuracionHoras(horaIni, horaFin);

                  return (
                    <div
                      key={cirugia.id_cirugia}
                      className={`cirugia-block ${cirugia.estado?.toLowerCase() || 'programada'}`}
                      style={{
                        top: `${posicion.inicio * 58 + 2}px`,
                        height: `${posicion.altura}px`,
                        backgroundColor: estadoInfo.color,
                        borderLeft: `4px solid ${estadoInfo.color}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleVerDetalleClick(cirugia)}
                      title="Click para ver detalles o editar"
                    >
                      <div className="cirugia-content">
                        <div className="cirugia-titulo">{cirugia.procedimiento}</div>
                        <div className="cirugia-especialista">
                          👨‍⚕️ {cirugia.medico_principal || cirugia.equipo_nombre || 'Equipo Médico'}
                        </div>
                        <div className="cirugia-paciente">
                          👤 {cirugia.paciente_nombre ? `${cirugia.paciente_nombre} ${cirugia.paciente_apellido}` : (cirugia.paciente || 'Paciente')}
                        </div>
                        <div className="cirugia-horario">
                          🕒 {horaIni} - {horaFin} ({duracionH}h)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {quirofanos.length === 0 && (
            <div className="quirofano-columna">
              <p style={{ padding: '20px', color: '#999', textAlign: 'center' }}>
                No hay salas de quirófano registradas. Agrega una con el botón "Gestionar Quirófanos".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1 SEPARADO: AGREGAR HORARIO                       */}
      {/* ======================================================== */}
      {showAgregarModal && (
        <div className="modal-overlay">
          <div className="modal-agregar-horario">
            <div className="modal-header">
              <h2>➕ Programar Nuevo Horario</h2>
              <button className="close-button" onClick={() => setShowAgregarModal(false)}>×</button>
            </div>
            <form onSubmit={handleAgregarSubmit} className="horario-form">
              <div className="form-group">
                <label>Fecha de Intervención *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formAgregar.fecha}
                  onChange={(e) => setFormAgregar({ ...formAgregar, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Quirófano *</label>
                <select
                  name="id_quirófano"
                  value={formAgregar.id_quirófano}
                  onChange={(e) => setFormAgregar({ ...formAgregar, id_quirófano: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar Quirófano --</option>
                  {quirofanos.map(q => (
                    <option key={q.id_quirófano || q.sala} value={q.id_quirófano}>
                      {q.sala} ({q.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Paciente *</label>
                <select
                  name="id_expediente"
                  value={formAgregar.id_expediente}
                  onChange={(e) => setFormAgregar({ ...formAgregar, id_expediente: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id_expediente || p.id_paciente} value={p.id_expediente}>
                      {p.nombre} {p.apellido} (Exp: {p.numero_expediente})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Equipo Médico / Especialista *</label>
                <select
                  name="id_equipomedico"
                  value={formAgregar.id_equipomedico}
                  onChange={(e) => setFormAgregar({ ...formAgregar, id_equipomedico: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar Equipo --</option>
                  {equipos.map(eq => (
                    <option key={eq.id_equipomedico || eq.id} value={eq.id_equipomedico || eq.id}>
                      {eq.nombre} {eq.medico_nombre ? `- Dr(a). ${eq.medico_nombre} ${eq.medico_apellido || ''}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Procedimiento Quirúrgico *</label>
                <input
                  type="text"
                  list="sugerencias-procedimientos"
                  name="procedimiento"
                  value={formAgregar.procedimiento}
                  onChange={(e) => setFormAgregar({ ...formAgregar, procedimiento: e.target.value })}
                  placeholder="Ej. Apendicectomía o escribe una cirugía"
                  required
                />
                <datalist id="sugerencias-procedimientos">
                  {sugerenciasProcedimientos.map((p, idx) => (
                    <option key={idx} value={p} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>Hora de Inicio *</label>
                <span className="selected-time-display">
                  {formAgregar.hora_inicio} (Finalizará aprox. a las {calcularHoraFin(formAgregar.hora_inicio, formAgregar.duracion)})
                </span>
                <div className="time-grid-container">
                  {horariosDelDia.map(hora => (
                    <button
                      key={hora}
                      type="button"
                      className={`time-slot-button ${formAgregar.hora_inicio === hora ? 'selected' : ''}`}
                      onClick={() => setFormAgregar({ ...formAgregar, hora_inicio: hora })}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Duración estimada (Horas)</label>
                <select
                  name="duracion"
                  value={formAgregar.duracion}
                  onChange={(e) => setFormAgregar({ ...formAgregar, duracion: parseInt(e.target.value, 10) })}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                    <option key={h} value={h}>{h} {h === 1 ? 'hora' : 'horas'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Estado / Prioridad</label>
                <select
                  name="estado"
                  value={formAgregar.estado}
                  onChange={(e) => setFormAgregar({ ...formAgregar, estado: e.target.value })}
                >
                  <option value="programada">Programada</option>
                  <option value="baja">Baja Urgencia</option>
                  <option value="medio">Media Urgencia</option>
                  <option value="emergencia">Emergencia</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAgregarModal(false)} className="btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  💾 Guardar Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2 SEPARADO: EDITAR HORARIO                        */}
      {/* ======================================================== */}
      {showEditarModal && (
        <div className="modal-overlay">
          <div className="modal-agregar-horario">
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f39c12, #e67e22)' }}>
              <h2>✏️ Editar Horario de Cirugía</h2>
              <button className="close-button" onClick={() => setShowEditarModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditarSubmit} className="horario-form">
              <div className="form-group">
                <label>Fecha de Intervención *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formEditar.fecha}
                  onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Quirófano *</label>
                <select
                  name="id_quirófano"
                  value={formEditar.id_quirófano}
                  onChange={(e) => setFormEditar({ ...formEditar, id_quirófano: e.target.value })}
                  required
                >
                  {quirofanos.map(q => (
                    <option key={q.id_quirófano || q.sala} value={q.id_quirófano}>
                      {q.sala} ({q.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Procedimiento Quirúrgico *</label>
                <input
                  type="text"
                  name="procedimiento"
                  value={formEditar.procedimiento}
                  onChange={(e) => setFormEditar({ ...formEditar, procedimiento: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Equipo Médico / Especialista</label>
                <select
                  name="id_equipomedico"
                  value={formEditar.id_equipomedico}
                  onChange={(e) => setFormEditar({ ...formEditar, id_equipomedico: e.target.value })}
                >
                  {equipos.map(eq => (
                    <option key={eq.id_equipomedico || eq.id} value={eq.id_equipomedico || eq.id}>
                      {eq.nombre} {eq.medico_nombre ? `- Dr. ${eq.medico_nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Hora de Inicio *</label>
                <span className="selected-time-display">
                  {formEditar.hora_inicio} (Finalizará aprox. a las {calcularHoraFin(formEditar.hora_inicio, formEditar.duracion)})
                </span>
                <div className="time-grid-container">
                  {horariosDelDia.map(hora => (
                    <button
                      key={hora}
                      type="button"
                      className={`time-slot-button ${formEditar.hora_inicio === hora ? 'selected' : ''}`}
                      onClick={() => setFormEditar({ ...formEditar, hora_inicio: hora })}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Duración estimada (Horas)</label>
                <select
                  name="duracion"
                  value={formEditar.duracion}
                  onChange={(e) => setFormEditar({ ...formEditar, duracion: parseInt(e.target.value, 10) })}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                    <option key={h} value={h}>{h} {h === 1 ? 'hora' : 'horas'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Estado de la Cirugía</label>
                <select
                  name="estado"
                  value={formEditar.estado}
                  onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}
                >
                  {statusOptions.map(st => (
                    <option key={st} value={st}>
                      {statusMap[st].texto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditarModal(false)} className="btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar" style={{ backgroundColor: '#e67e22' }}>
                  💾 Actualizar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3 SEPARADO: DETALLES DE CIRUGÍA                    */}
      {/* ======================================================== */}
      {showDetalleModal && detalleCirugia && (
        <div className="modal-overlay">
          <div className="modal-detalle-horario">
            <div 
              className="modal-header" 
              style={{ backgroundColor: getStatusInfo(detalleCirugia.estado).color }}
            >
              <h2>Detalles de la Cirugía</h2>
              <button className="close-button" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>
            <div className="detalle-content">
              <div className="detalle-item full-width" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Procedimiento</label>
                <span>{detalleCirugia.procedimiento}</span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Paciente</label>
                <span>
                  {detalleCirugia.paciente_nombre 
                    ? `${detalleCirugia.paciente_nombre} ${detalleCirugia.paciente_apellido}` 
                    : (detalleCirugia.paciente || 'N/A')}
                </span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Expediente</label>
                <span>{detalleCirugia.numero_expediente || 'Sin Expediente'}</span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Especialista / Equipo</label>
                <span>{detalleCirugia.medico_principal || detalleCirugia.equipo_nombre || 'Asignado'}</span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Quirófano</label>
                <span translate="no">{detalleCirugia.quirofano_sala || detalleCirugia.sala}</span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Fecha</label>
                <span>{detalleCirugia.fecha ? new Date(detalleCirugia.fecha).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Horario</label>
                <span>
                  {formatearHoraSimple(detalleCirugia.hora_inicio)} - {formatearHoraSimple(detalleCirugia.hora_fin)}
                </span>
              </div>
              <div className="detalle-item" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                <label>Estado Actual</label>
                <span style={{ color: getStatusInfo(detalleCirugia.estado).color, fontWeight: 'bold' }}>
                  {getStatusInfo(detalleCirugia.estado).texto}
                </span>
              </div>
              {detalleCirugia.diagnostico_pre && (
                <div className="detalle-item full-width" style={{ borderLeftColor: getStatusInfo(detalleCirugia.estado).color }}>
                  <label>Diagnóstico Preoperatorio</label>
                  <span>{detalleCirugia.diagnostico_pre}</span>
                </div>
              )}
            </div>

            <div className="modal-actions-detalle">
              <button 
                onClick={() => handleOpenEditarModal(detalleCirugia)} 
                className="btn-guardar"
                style={{ backgroundColor: '#f39c12' }}
              >
                ✏️ Editar
              </button>
              <button 
                onClick={() => handleEliminarCirugia(detalleCirugia.id_cirugia, detalleCirugia.procedimiento)} 
                className="btn-cancelar"
                style={{ backgroundColor: '#e74c3c' }}
              >
                🗑️ Eliminar
              </button>
              <button onClick={() => setShowDetalleModal(false)} className="btn-cancelar">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: GESTIÓN DE QUIRÓFANOS                           */}
      {/* ======================================================== */}
      {showGestionQuirofanos && (
        <div className="modal-overlay">
          <div className="modal-quirofanos">
            <div className="modal-header">
              <h2>Gestión de Salas Quirúrgicas</h2>
              <button className="close-button" onClick={() => setShowGestionQuirofanos(false)}>×</button>
            </div>

            <form onSubmit={handleAgregarQuirofano} className="form-agregar-quirofano">
              <h3>Agregar Nueva Sala</h3>
              <div className="form-agregar-inputs">
                <input
                  type="text"
                  name="sala"
                  placeholder="Nombre de Sala (Ej: Sala 2)"
                  value={nuevoQuirofano.sala}
                  onChange={(e) => setNuevoQuirofano({ ...nuevoQuirofano, sala: e.target.value })}
                  required
                />
                <select
                  name="estado"
                  value={nuevoQuirofano.estado}
                  onChange={(e) => setNuevoQuirofano({ ...nuevoQuirofano, estado: e.target.value })}
                  required
                >
                  <option value="disponible">Disponible</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="mantenimiento">En mantenimiento</option>
                </select>
                <button type="submit" className="btn-guardar-quirofano">➕ Agregar</button>
              </div>
            </form>

            <div className="quirofanos-grid-modal">
              <h3>Quirófanos Registrados</h3>
              {quirofanos.length === 0 ? (
                <p className="lista-vacia">No hay quirófanos registrados.</p>
              ) : (
                quirofanos.map(q => {
                  let estadoTexto = '✅ Disponible';
                  let botonTexto = 'Poner 🔴';
                  let deshabilitarBoton = false;

                  if (q.estado === 'ocupado') {
                    estadoTexto = '🔴 Ocupado';
                    botonTexto = 'Poner 🛠️';
                    deshabilitarBoton = tieneCirugiasAsignadas(q.sala);
                  } else if (q.estado === 'mantenimiento') {
                    estadoTexto = '🛠️ Mantenimiento';
                    botonTexto = 'Poner ✅';
                  }

                  const deshabilitarEliminar = tieneCirugiasAsignadas(q.sala);

                  return (
                    <div key={q.sala || q.id_quirófano} className={`quirofano-card-modal ${q.estado}`}>
                      <h3 translate="no">{q.sala}</h3>
                      <p className={`estado ${q.estado}`}>{estadoTexto}</p>
                      <div className="quirofano-actions-modal">
                        <button
                          className="btn-editar-quirofano"
                          disabled={deshabilitarBoton}
                          onClick={() => handleToggleQuirofanoEstado(q.sala, q.estado)}
                          title={deshabilitarBoton ? "Tiene cirugías asignadas" : "Cambiar estado de sala"}
                        >
                          {botonTexto}
                        </button>
                        <button
                          className="btn-eliminar-quirofano"
                          disabled={deshabilitarEliminar}
                          onClick={() => handleEliminarQuirofano(q.sala)}
                          title={deshabilitarEliminar ? "Tiene cirugías asignadas" : "Eliminar quirófano"}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowGestionQuirofanos(false)} className="btn-cerrar-quirofanos">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CAMBIO RÁPIDO DE ESTADO (LISTA DE HOY)          */}
      {/* ======================================================== */}
      {showListaEdicion && (
        <div className="modal-overlay">
          <div className="modal-lista-edicion">
            <div className="modal-header">
              <h2>Cambiar Estado de Cirugías ({diaSeleccionado})</h2>
              <button className="close-button" onClick={() => setShowListaEdicion(false)}>×</button>
            </div>
            <div className="lista-edicion-scroll">
              {cirugiasDelDia.length === 0 ? (
                <p className="lista-vacia">No hay cirugías programadas para este día.</p>
              ) : (
                cirugiasDelDia.map(cirugia => (
                  <div key={cirugia.id_cirugia} className="lista-edicion-item">
                    <div className="lista-edicion-info">
                      <span className="lista-edicion-titulo">
                        {cirugia.procedimiento} ({cirugia.paciente_nombre || cirugia.paciente || 'Paciente'})
                      </span>
                      <span className="lista-edicion-detalle">
                        <span translate="no">{cirugia.quirofano_sala || cirugia.sala}</span> | {formatearHoraSimple(cirugia.hora_inicio)} - {formatearHoraSimple(cirugia.hora_fin)}
                      </span>
                    </div>
                    <select
                      className="select-estado-lista"
                      value={(cirugia.estado || 'programada').toLowerCase()}
                      onChange={(e) => handleStatusChangeFromList(cirugia.id_cirugia, e.target.value)}
                      style={{
                        borderLeft: `5px solid ${getStatusInfo(cirugia.estado).color}`,
                        paddingLeft: '5px'
                      }}
                    >
                      {statusOptions.map(statusKey => (
                        <option key={statusKey} value={statusKey}>
                          {statusMap[statusKey].texto}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CIRUGÍA DE EMERGENCIA (CONECTADO CON API)      */}
      {/* ======================================================== */}
      <EmergenciaModal
        isOpen={showEmergenciaModal}
        onClose={() => setShowEmergenciaModal(false)}
        onConfirm={handleEmergenciaConfirm}
        pacientes={pacientes}
        quirofanos={quirofanos}
        equipos={equipos}
      />
    </div>
  );
};

export default Horarios;