import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmergenciaModal from './EmergenciaModal';
import '../styles/Horarios.css';

// Versión SIN roles, Click muestra Detalles, 5 Estados
const Horarios = () => {
  const API_BASE_QUIROFANOS = 'http://localhost:4001/api/quirofano';

  // --- ESTADOS PARA MODALES ---
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);
  const [showAgregarHorario, setShowAgregarHorario] = useState(false);
  const [showGestionQuirofanos, setShowGestionQuirofanos] = useState(false);
  const [showListaEdicion, setShowListaEdicion] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleHorario, setDetalleHorario] = useState(null);

  // --- ESTADOS PARA HORARIOS Y CIRUGÍAS ---
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes');
  const [horarioAEditar, setHorarioAEditar] = useState(null);
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // --- MAPA DE ESTADOS PARA CIRUGÍAS ---
  const statusMap = {
    programada: { texto: 'Programada', color: '#3498db' },
    baja: { texto: 'Baja Urgencia', color: '#27ae60' },
    medio: { texto: 'Media Urgencia', color: '#f39c12' },
    emergencia: { texto: 'Emergencia', color: '#e74c3c' },
    completada: { texto: 'Completada', color: '#6c757d' }
  };
  const statusOptions = Object.keys(statusMap);

  // --- ESTADO PARA NUEVO QUIROFANO ---
  const [nuevoQuirofano, setNuevoQuirofano] = useState({
    sala: '',    
    estado: 'disponible'
  });

  // --- ESTADO PARA NUEVO HORARIO (CIRUGÍA) ---
  const [nuevoHorario, setNuevoHorario] = useState({
    dia: diaSeleccionado, 
    quirofano: '', 
    horaInicio: '', 
    duracion: 2,
    tipoCirugia: '', 
    especialista: '', 
    paciente: ''
  });

  // --- ESTADOS PARA QUIROFANOS ---
  const [quirofanos, setQuirofanos] = useState([]);

  // --- DATOS MOCK ---
  const tiposCirugia = ['Cirugía Cardíaca', 'Cirugía Abdominal', 'Cirugía Ortopédica', 'Cirugía Neurológica', 'Cirugía Plástica', 'Cirugía Vascular', 'Cirugía Torácica', 'Cirugía Pediátrica', 'Cirugía Oncológica', 'Cirugía Oftalmológica'];
  const especialistas = ['Dr. Carlos García - Cardiólogo', 'Dra. María Fernández - Cirujana General', 'Dr. Roberto Sánchez - Ortopedista', 'Dra. Elena Castro - Neurocirujana', 'Dr. Javier Morales - Cirujano Plástico', 'Dra. Ana López - Vascular', 'Dr. Pedro Ramírez - Torácico', 'Dra. Laura Gómez - Pediatra', 'Dr. Miguel Torres - Oncólogo', 'Dra. Sofía Díaz - Oftalmóloga'];

  // --- GENERACIÓN DE HORAS DISPONIBLES ---
  const generarHoras = () => {
    const horas = [];
    for (let hora = 7; hora <= 19; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaFormateada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        horas.push({ valor: horaFormateada, display: horaFormateada });
      }
    }
    return horas;
  };
  const horasDisponibles = generarHoras();

  const [horarios, setHorarios] = useState([]);
  const horariosDelDia = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];

  // --- EFFECT PARA CARGAR QUIROFANOS ---
  useEffect(() => {
    cargarQuirofanos();
  }, []);

  const cargarQuirofanos = async () => {
    try {
      const response = await axios.get(API_BASE_QUIROFANOS);
      setQuirofanos(response.data);
    } catch (err) {
      console.error('Error al cargar quirófanos:', err);
    }
  };

  // --- MANEJADORES DE MODALES ---
  const handleOpenAgregarModal = () => { 
    setHorarioAEditar(null); 
    setNuevoHorario({ 
      dia: diaSeleccionado, 
      quirofano: '', 
      horaInicio: '', 
      duracion: 2, 
      tipoCirugia: '', 
      especialista: '', 
      paciente: '' 
    }); 
    setShowAgregarHorario(true); 
  };

  const handleCloseModal = () => { 
    setShowAgregarHorario(false); 
    setHorarioAEditar(null); 
    setNuevoHorario({ 
      dia: diaSeleccionado, 
      quirofano: '', 
      horaInicio: '', 
      duracion: 2, 
      tipoCirugia: '', 
      especialista: '', 
      paciente: '' 
    }); 
  };

  // --- LÓGICA CRUD HORARIOS/CIRUGÍAS ---
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!nuevoHorario.horaInicio) { 
      alert('Selecciona hora.'); 
      return; 
    }
    
    const horaFin = calcularHoraFin(nuevoHorario.horaInicio, nuevoHorario.duracion);
    
    if (horarioAEditar) {
      const horarioActualizado = { 
        ...horarioAEditar, 
        ...nuevoHorario, 
        horaFin: horaFin 
      };
      setHorarios(horarios.map(h => h.id === horarioAEditar.id ? horarioActualizado : h));
      alert('✅ Horario actualizado localmente');
    } else {
      const nuevoHorarioObj = { 
        ...nuevoHorario, 
        id: Date.now(), 
        horaFin: horaFin, 
        tipo: 'programada', 
        color: statusMap['programada'].color 
      };
      setHorarios([...horarios, nuevoHorarioObj]);
      alert('✅ Horario agregado localmente');
    }
    handleCloseModal();
  };

  const handleStatusChangeFromList = (id, nuevoStatus) => {
    setHorarios(currentHorarios => 
      currentHorarios.map(horario => 
        horario.id === id ? { 
          ...horario, 
          tipo: nuevoStatus, 
          color: statusMap[nuevoStatus].color 
        } : horario
      )
    );
  };

  // --- LÓGICA CRUD QUIROFANOS ---
  const handleQuirofanoFormChange = (e) => { 
    const { name, value } = e.target;
    setNuevoQuirofano(prev => ({ ...prev, [name]: value })); 
  };

  const handleAgregarQuirofano = async (e) => {
    e.preventDefault();
    
    if (!nuevoQuirofano.sala || !nuevoQuirofano.estado) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      const response = await axios.post(API_BASE_QUIROFANOS, nuevoQuirofano);
      setQuirofanos([...quirofanos, response.data]);
      setNuevoQuirofano({ sala: '', estado: 'disponible' });
      alert('✅ Quirófano agregado correctamente');
    } catch (err) {
      console.error('Error al agregar quirófano:', err);
      alert('Error al agregar quirófano: ' + (err.response?.data?.msg || err.message));
    }
  };

  // ✅ ACTUALIZAR ESTADO CON API - VERSIÓN CORREGIDA
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
      await axios.put(`${API_BASE_QUIROFANOS}/${sala}`, { estado: nuevoEstado });
      
      setQuirofanos(prevQuirofanos => 
        prevQuirofanos.map(q => 
          q.sala === sala ? { ...q, estado: nuevoEstado } : q
        )
      );
      
      alert(`✅ Estado de ${sala} cambiado a ${nuevoEstado}`);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar estado: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleEliminarQuirofano = async (sala) => { 
    if (tieneCirugiasAsignadas(sala)) { 
      alert(`"${sala}" tiene cirugías asignadas. No se puede eliminar.`); 
      return; 
    } 
    
    if (window.confirm(`¿Estás seguro de eliminar el quirófano "${sala}"?`)) { 
      try {
        await axios.delete(`${API_BASE_QUIROFANOS}/${sala}`);
        setQuirofanos(quirofanos.filter(q => q.sala !== sala));
        alert('✅ Quirófano eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar quirófano:', err);
        alert('Error al eliminar quirófano: ' + (err.response?.data?.msg || err.message));
      }
    } 
  };

  const tieneCirugiasAsignadas = (salaQuirofano) => 
    horarios.some(h => h.quirofano === salaQuirofano);

  // --- FUNCIONES HELPER ---
  const calcularHoraFin = (ini, dur) => { 
    if (!ini || !dur) return ''; 
    const [h, m] = ini.split(':').map(Number); 
    const d = parseInt(dur, 10) || 2; 
    const mins = h * 60 + m + (d * 60); 
    const hf = Math.floor(mins / 60) % 24; 
    const mf = mins % 60; 
    return `${hf.toString().padStart(2, '0')}:${mf.toString().padStart(2, '0')}`; 
  };

  const handleInputChange = (e) => { 
    if (e.target && !e.target.name && e.target.value) { 
      setNuevoHorario(p => ({ ...p, horaInicio: e.target.value })); 
    } else if (e.target && e.target.name) { 
      const { name, value } = e.target; 
      setNuevoHorario(p => ({ ...p, [name]: value })); 
    } 
  };

  const getHorarioPosicion = (ini, fin) => { 
    const i = horariosDelDia.indexOf(ini); 
    const f = horariosDelDia.indexOf(fin); 
    if (i === -1 || f === -1 || f <= i) { 
      const si = i !== -1 ? i : 0; 
      return { inicio: si, duracion: 2, altura: 112 }; 
    } 
    const slots = f - i; 
    return { inicio: i, duracion: slots, altura: slots * 58 - 4 }; 
  };

  const getHorariosPorQuirofano = (qNom) => 
    horarios.filter(h => h.quirofano === qNom && h.dia === diaSeleccionado);

  const getHorariosDelDia = () => 
    horarios.filter(h => h.dia === diaSeleccionado)
            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  const handleEmergenciaConfirm = (datos) => { 
    const nH = { 
      id: Date.now(), 
      dia: diaSeleccionado, 
      horaInicio: '15:00', 
      horaFin: '17:00', 
      quirofano: quirofanos[0]?.sala || 'Q?', 
      cirugia: datos.tipoCirugia || 'Emergencia', 
      especialista: datos.especialista || 'Emergencias', 
      paciente: datos.paciente || 'N/A', 
      duracion: 2, 
      tipo: 'emergencia', 
      color: statusMap['emergencia'].color 
    }; 
    setHorarios([...horarios, nH]); 
    alert(`🚨 Emergencia registrada`); 
  };

  const handleEditarHorario = (h) => { 
    setHorarioAEditar(h); 
    setNuevoHorario(h); 
    setShowAgregarHorario(true); 
  };

  const handleVerDetalleClick = (h) => { 
    setDetalleHorario(h); 
    setShowDetalleModal(true); 
  };

  const quirofanoNombres = quirofanos.map(q => q.sala);
  const gridColumnStyle = { 
    gridTemplateColumns: `100px repeat(${quirofanos.length > 0 ? quirofanos.length : 1}, 1fr)` 
  };

  return (
    <div className="horarios-container">
      {/* Header */}
      <div className="horarios-header">
        <h2>Gestión de Horarios - {diaSeleccionado}</h2>
        <div className="header-actions">
          <button className="btn-quirofanos" onClick={() => setShowGestionQuirofanos(true)}>🏥 Gestionar Quirófanos</button>
          <button className="btn-agregar-horario" onClick={handleOpenAgregarModal}>➕ Agregar Horario</button>
          <button className="btn-tabla-horarios" onClick={() => setShowListaEdicion(true)}>✏️ Cambiar Estado</button>
          <button className="emergency-btn-horarios" onClick={() => setShowEmergenciaModal(true)}>🚨 Registrar Emergencia</button>
        </div>
      </div>

      {/* Day Tabs */}
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

      {/* Leyenda */}
      <div className="leyenda-horarios">
        <h4>Leyenda de Estado/Urgencia:</h4>
        <div className="leyenda-items">
          <div className="leyenda-item"><div className="color-box programada"></div><span>Programada</span></div>
          <div className="leyenda-item"><div className="color-box baja"></div><span>Baja</span></div>
          <div className="leyenda-item"><div className="color-box medio"></div><span>Media</span></div>
          <div className="leyenda-item"><div className="color-box emergencia"></div><span>Emergencia</span></div>
          <div className="leyenda-item"><div className="color-box completada"></div><span>Completada</span></div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendario-horarios">
        <div className="calendario-header" style={gridColumnStyle}>
          <div className="hora-header">Horas</div>
          {quirofanos.map(q => {
            let estadoTexto = '✅ Disponible'; 
            if (q.estado === 'ocupado') estadoTexto = '🔴 Ocupado'; 
            if (q.estado === 'mantenimiento') estadoTexto = '🛠️ Mantenimiento';
            
            return (
              <div key={q.sala} className="quirofano-header">
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
          <div className="horas-columna">
            {horariosDelDia.map(hora => (
              <div key={hora} className="hora-slot">
                <span className="hora-texto">{hora}</span>
              </div>
            ))}
          </div>

          {quirofanoNombres.map(nombreQuirofano => (
            <div key={nombreQuirofano} className="quirofano-columna">
              {horariosDelDia.map((hora) => (
                <div key={`${nombreQuirofano}-${hora}`} className="celda-horario"></div>
              ))}
              {getHorariosPorQuirofano(nombreQuirofano).map(horario => {
                const posicion = getHorarioPosicion(horario.horaInicio, horario.horaFin);
                return (
                  <div
                    key={horario.id}
                    className={`cirugia-block ${horario.tipo}`}
                    style={{ 
                      top: `${posicion.inicio * 58 + 2}px`, 
                      height: `${posicion.altura}px`, 
                      backgroundColor: horario.color, 
                      borderLeft: `4px solid ${horario.color}`, 
                      cursor: 'pointer' 
                    }}
                    onClick={() => handleVerDetalleClick(horario)}
                    title="Ver Detalles"
                  >
                    <div className="cirugia-content">
                      <div className="cirugia-titulo">{horario.cirugia}</div>
                      <div className="cirugia-especialista">{horario.especialista}</div>
                      <div className="cirugia-paciente">{horario.paciente}</div>
                      <div className="cirugia-horario">{horario.horaInicio} - {horario.horaFin} ({horario.duracion}h)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {quirofanos.length === 0 && <div className="quirofano-columna"></div>}
        </div>
      </div>

      {/* Modals */}
      {showAgregarHorario && (
        <div className="modal-overlay">
          <div className="modal-agregar-horario">
            <div className="modal-header">
              <h2>{horarioAEditar ? 'Editar Horario' : 'Agregar Horario'}</h2>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleFormSubmit} className="horario-form">
              <div className="form-group">
                <label>Día</label>
                <select name="dia" value={nuevoHorario.dia} onChange={handleInputChange} required>
                  {diasSemana.map(dia => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quirófano</label>
                <select 
                  name="quirofano" 
                  value={nuevoHorario.quirofano} 
                  onChange={handleInputChange} 
                  required 
                  disabled={quirofanos.filter(q => q.estado === 'disponible').length === 0}
                >
                  <option value="">
                    {quirofanos.filter(q => q.estado === 'disponible').length === 0 ? "No hay quirófanos disponibles" : "Seleccionar"}
                  </option>
                  {quirofanos.filter(q => q.estado === 'disponible').map(q => (
                    <option key={q.sala} value={q.sala} translate="no">
                      {q.sala}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hora inicio</label>
                <span className="selected-time-display">{nuevoHorario.horaInicio || 'Selecciona'}</span>
                <div className="time-grid-container">
                  {horasDisponibles.map((hora) => (
                    <button 
                      key={hora.valor} 
                      type="button" 
                      className={`time-slot-button ${nuevoHorario.horaInicio === hora.valor ? 'selected' : ''}`} 
                      value={hora.valor} 
                      onClick={handleInputChange}
                    >
                      {hora.display}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Duración</label>
                <select name="duracion" value={nuevoHorario.duracion} onChange={handleInputChange} required>
                  {[2,3,4,5,6,7].map(h => (
                    <option key={h} value={h}>{h} h</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cirugía</label>
                <select name="tipoCirugia" value={nuevoHorario.tipoCirugia} onChange={handleInputChange} required>
                  <option value="">Seleccionar</option>
                  {tiposCirugia.map((tipo, i) => (
                    <option key={i} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Especialista</label>
                <select name="especialista" value={nuevoHorario.especialista} onChange={handleInputChange} required>
                  <option value="">Seleccionar</option>
                  {especialistas.map((esp, i) => (
                    <option key={i} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Paciente</label>
                <input 
                  type="text" 
                  name="paciente" 
                  value={nuevoHorario.paciente} 
                  onChange={handleInputChange} 
                  placeholder="Nombre completo" 
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancelar">Cancelar</button>
                <button type="submit" className="btn-guardar">
                  {horarioAEditar ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGestionQuirofanos && ( 
        <div className="modal-overlay">
          <div className="modal-quirofanos">
            <div className="modal-header">
              <h2>Gestión de Quirófanos</h2>
              <button className="close-button" onClick={() => setShowGestionQuirofanos(false)}>×</button>
            </div>
            
            <form onSubmit={handleAgregarQuirofano} className="form-agregar-quirofano">
              <h3>Agregar Nueva Sala</h3>
              <div className="form-agregar-inputs">
                <input 
                  type="text" 
                  name="sala" 
                  placeholder="Nombre de la Sala (Ej: Q1)" 
                  value={nuevoQuirofano.sala} 
                  onChange={handleQuirofanoFormChange} 
                  required 
                />
                <select 
                  name="estado" 
                  value={nuevoQuirofano.estado} 
                  onChange={handleQuirofanoFormChange}
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
              <h3>Quirófanos Existentes</h3>
              <br />
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
                    <div key={q.sala} className={`quirofano-card-modal ${q.estado}`}>
                      <h3 translate="no">{q.sala}</h3>
                      <p className={`estado ${q.estado}`}>{estadoTexto}</p>
                      <div className="quirofano-actions-modal">
                        <button 
                          className="btn-editar-quirofano" 
                          disabled={deshabilitarBoton}
                          onClick={() => handleToggleQuirofanoEstado(q.sala, q.estado)}
                          title={deshabilitarBoton ? "Tiene cirugías asignadas" : "Cambiar estado"}
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

      {showListaEdicion && (
        <div className="modal-overlay">
          <div className="modal-lista-edicion">
            <div className="modal-header">
              <h2>Cambiar Estado ({diaSeleccionado})</h2>
              <button className="close-button" onClick={() => setShowListaEdicion(false)}>×</button>
            </div>
            <div className="lista-edicion-scroll">
              {getHorariosDelDia().length === 0 ? (
                <p className="lista-vacia">No hay horarios programados para este día.</p>
              ) : (
                getHorariosDelDia().map(horario => (
                  <div key={horario.id} className="lista-edicion-item">
                    <div className="lista-edicion-info">
                      <span className="lista-edicion-titulo">{horario.cirugia} ({horario.paciente})</span>
                      <span className="lista-edicion-detalle">
                        <span translate="no">{horario.quirofano}</span> | {horario.horaInicio} - {horario.horaFin}
                      </span>
                    </div>
                    <select 
                      className="select-estado-lista" 
                      value={horario.tipo} 
                      onChange={(e) => handleStatusChangeFromList(horario.id, e.target.value)} 
                      style={{ 
                        borderLeft: `5px solid ${horario.color || '#ccc'}`, 
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

      {showDetalleModal && detalleHorario && (
        <div className="modal-overlay">
          <div className="modal-detalle-horario">
            <div className="modal-header" style={{backgroundColor: detalleHorario.color}}>
              <h2>Detalles de la Cirugía</h2>
              <button className="close-button" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>
            <div className="detalle-content">
              <div className="detalle-item full-width" style={{borderLeftColor: detalleHorario.color}}>
                <label>Cirugía</label>
                <span>{detalleHorario.cirugia}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Paciente</label>
                <span>{detalleHorario.paciente}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Especialista</label>
                <span>{detalleHorario.especialista}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Quirófano</label>
                <span translate="no">{detalleHorario.quirofano}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Día</label>
                <span>{detalleHorario.dia}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Inicio</label>
                <span>{detalleHorario.horaInicio}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Fin</label>
                <span>{detalleHorario.horaFin}</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Duración</label>
                <span>{detalleHorario.duracion}h</span>
              </div>
              <div className="detalle-item" style={{borderLeftColor: detalleHorario.color}}>
                <label>Estado</label>
                <span style={{color: detalleHorario.color, fontWeight:'bold'}}>
                  {statusMap[detalleHorario.tipo]?.texto || detalleHorario.tipo}
                </span>
              </div>
            </div>
            <div className="modal-actions-detalle">
              <button 
                onClick={() => { 
                  setShowDetalleModal(false); 
                  handleEditarHorario(detalleHorario); 
                }} 
                className="btn-guardar"
              >
                ✏️ Editar
              </button>
              <button onClick={() => setShowDetalleModal(false)} className="btn-cancelar">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <EmergenciaModal 
        isOpen={showEmergenciaModal} 
        onClose={() => setShowEmergenciaModal(false)} 
        onConfirm={handleEmergenciaConfirm} 
      />
    </div>
  );
};

export default Horarios;