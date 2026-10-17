import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/EquipoMedico.css'; // Tus estilos bonitos

const EquipoMedico = () => {
  // --- ESTADOS ---
  const [equipos, setEquipos] = useState([]); // Lista de nombres de equipos
  const [especialistasDisponibles, setEspecialistasDisponibles] = useState([]); // Lista de todos los médicos
  const [miembrosEquipoActual, setMiembrosEquipoActual] = useState([]); // Miembros del equipo seleccionado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el formulario de creación (adaptado a la lógica funcional)
  const [formCrearState, setFormCrearState] = useState({ nombreEquipo: '', id_medico: '' });
  
  const [equipoSeleccionadoNombre, setEquipoSeleccionadoNombre] = useState(null); // Nombre del equipo en gestión
  const [gestionandoEspecialistas, setGestionandoEspecialistas] = useState(false); // Estado para la vista de gestión

  const API_BASE_URL = 'http://localhost:4001/api';

  // --- CARGA INICIAL DE DATOS ---
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No autorizado. Por favor, inicie sesión.');
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resEquipos, resEspecialistas] = await Promise.all([
        axios.get(`${API_BASE_URL}/equipos`, { headers }),      // Obtiene nombres de equipos
        axios.get(`${API_BASE_URL}/usuarios`, { headers })       // Obtiene todos los médicos
      ]);
      setEquipos(Array.isArray(resEquipos.data) ? resEquipos.data : []);
      setEspecialistasDisponibles(Array.isArray(resEspecialistas.data) ? resEspecialistas.data : []);
    } catch (err) {
      setError('Error al cargar datos iniciales. Verifique la conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADORES DE FORMULARIO ---
  const handleInputChangeCrear = (e) => {
    setFormCrearState({ ...formCrearState, [e.target.name]: e.target.value });
  };

  // --- LÓGICA PASO 1: CREAR EQUIPO (añadiendo el primer miembro) ---
  const handleCrearEquipo = async (e) => {
    e.preventDefault();
    if (!formCrearState.nombreEquipo || !formCrearState.id_medico) {
      setError('Debe ingresar un nombre de equipo y seleccionar un especialista inicial.');
      return;
    }
    setError('');
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/equipos`, {
        nombre: formCrearState.nombreEquipo,
        id_medico: formCrearState.id_medico
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (!equipos.includes(formCrearState.nombreEquipo)) {
          setEquipos([...equipos, formCrearState.nombreEquipo]);
      }
      setFormCrearState({ nombreEquipo: '', id_medico: '' });
      alert(`Equipo "${data.equipo.nombre}" creado con el primer miembro.`);
      // Automáticamente seleccionamos el equipo recién creado para gestionar
      handleGestionarEspecialistas(data.equipo.nombre);

    } catch (err) {
      setError(err.response?.data?.msg || 'Error al crear el equipo.');
    }
  };
  
  // --- LÓGICA DE GESTIÓN (PASO 2) ---
  const handleGestionarEspecialistas = async (nombreEquipo) => {
    setLoading(true);
    setEquipoSeleccionadoNombre(nombreEquipo);
    setGestionandoEspecialistas(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_BASE_URL}/equipos/${encodeURIComponent(nombreEquipo)}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setMiembrosEquipoActual(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 404) {
          setMiembrosEquipoActual([]);
      } else {
          setError(`Error al cargar los miembros del equipo ${nombreEquipo}.`);
      }
    } finally {
        setLoading(false);
    }
  };

  const handleAgregarEspecialista = async (idMedico) => {
    if (!equipoSeleccionadoNombre) return;
    const token = localStorage.getItem('token');
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/equipos`, {
        nombre: equipoSeleccionadoNombre,
        id_medico: idMedico
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Volver a cargar los miembros para reflejar el cambio
      handleGestionarEspecialistas(equipoSeleccionadoNombre);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al agregar especialista.');
    }
  };

  const handleEliminarEspecialista = async (idEntradaEquipo) => {
    if (!equipoSeleccionadoNombre) return;
    if (window.confirm('¿Quitar a este especialista del equipo?')) {
      const token = localStorage.getItem('token');
      setError('');
      try {
        await axios.delete(`${API_BASE_URL}/equipos/miembros/${idEntradaEquipo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        handleGestionarEspecialistas(equipoSeleccionadoNombre);
      } catch (err) {
        setError(err.response?.data?.msg || 'Error al eliminar especialista.');
      }
    }
  };
  
  const handleEliminarEquipoCompleto = async (e, nombreEquipo) => {
       e.stopPropagation(); // Evita que se seleccione el equipo al hacer clic en eliminar
       if (window.confirm(`¿Está seguro de eliminar el equipo "${nombreEquipo}" completo?`)) {
          const token = localStorage.getItem('token');
          setError('');
          try {
             await axios.delete(`${API_BASE_URL}/equipos/${encodeURIComponent(nombreEquipo)}`, {
                 headers: { Authorization: `Bearer ${token}` }
             });
             setEquipos(equipos.filter(nombre => nombre !== nombreEquipo));
             alert(`Equipo "${nombreEquipo}" eliminado.`);
          } catch (err) {
              setError(err.response?.data?.msg || 'Error al eliminar el equipo.');
          }
       }
  };

  const handleVolverALista = () => {
    setEquipoSeleccionadoNombre(null);
    setGestionandoEspecialistas(false);
    setMiembrosEquipoActual([]);
    // Recargamos los equipos por si se creó uno nuevo
    cargarDatosIniciales();
  };

  // --- RENDERIZADO ---

  // VISTA: GESTIÓN DE ESPECIALISTAS (Paso 2)
  if (gestionandoEspecialistas && equipoSeleccionadoNombre) {
    return (
      <div className="gestion-especialistas-container">
        <div className="detalles-header">
          <button onClick={handleVolverALista} className="btn-volver">
            ← Volver a Lista de Equipos
          </button>
          <h2>Gestionar Especialistas: {equipoSeleccionadoNombre}</h2>
          {loading && <p>Cargando miembros...</p>}
        </div>
        {error && <p className="error-message">{error}</p>}

        <div className="gestion-mejorada">
          {/* LISTA DE ESPECIALISTAS DISPONIBLES DESDE BD */}
          <div className="lista-especialistas-bd">
            <h3>👥 Especialistas Disponibles</h3>
            <div className="especialistas-disponibles">
              {especialistasDisponibles.length === 0 ? (
                <p className="lista-vacia">No hay especialistas disponibles.</p>
              ) : (
                especialistasDisponibles.map(especialista => {
                  const yaEstaEnEquipo = miembrosEquipoActual.some(m => m.id_medicos === especialista.id_medicos);
                  return (
                    <div key={especialista.id_medicos} className="especialista-disponible-card">
                      <div className="info-especialista">
                        <div className="avatar-especialista">
                          {especialista.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="datos-especialista">
                          <h4 className="nombre-especialista">
                            {`${especialista.nombre} ${especialista.apellido_paterno}`}
                          </h4>
                          <p className="especialidad-especialista">{especialista.especialidad}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAgregarEspecialista(especialista.id_medicos)}
                        className="btn-agregar-especialista-bd"
                        disabled={yaEstaEnEquipo}
                        title={yaEstaEnEquipo ? "Ya está en el equipo" : "Agregar al equipo"}
                      >
                        {yaEstaEnEquipo ? '✅' : '➕'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LISTA DE ESPECIALISTAS SELECCIONADOS */}
          <div className="lista-especialistas-mejorada">
            <div className="header-lista-especialistas">
              <h3>👥 Especialistas del Equipo</h3>
              <span className="contador">{miembrosEquipoActual.length} especialistas</span>
            </div>
            
            {miembrosEquipoActual.length > 0 ? (
              <div className="lista-mejorada">
                {miembrosEquipoActual.map((miembro) => (
                  <div key={miembro.id_equipomedico} className="item-especialista-mejorado">
                    <div className="info-especialista">
                      <div className="avatar-especialista">
                        {miembro.medico_nombre?.charAt(0) || 'U'}
                      </div>
                      <div className="datos-especialista">
                        <h4 className="nombre-especialista">{miembro.medico_nombre} {miembro.apellido_paterno}</h4>
                        <p className="especialidad-especialista">{miembro.especialidad}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEliminarEspecialista(miembro.id_equipomedico)}
                      className="btn-eliminar-especialista"
                      title="Eliminar especialista"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sin-especialistas-mejorado">
                <div className="icono-vacio">👨‍⚕️</div>
                <p>No hay especialistas en este equipo</p>
                <small>Selecciona especialistas de la lista de disponibles</small>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL: FORMULARIO + LISTA (Paso 1)
  return (
    <div className="pacientes-container">
      <h2>Gestión de Equipo Médico</h2>
      {error && <p className="error-message">{error}</p>}
      
      <div className="pacientes-content-layout">
        {/* FORMULARIO IZQUIERDO */}
        <div className="form-paciente">
          <h3>Crear Nuevo Equipo</h3>
          <p>Crea un equipo asignando un nombre y su primer miembro.</p>
          <form onSubmit={handleCrearEquipo}>
            <div className="form-group">
              <label>Nombre del Equipo:</label>
              <input 
                type="text" 
                name="nombreEquipo" 
                value={formCrearState.nombreEquipo} 
                onChange={handleInputChangeCrear} 
                placeholder="Ej: Equipo Cardíaco Avanzado" 
                required
              />
            </div>

            <div className="form-group">
              <label>Especialista Inicial:</label>
              <select 
                name="id_medico" 
                value={formCrearState.id_medico} 
                onChange={handleInputChangeCrear}
                required
              >
                <option value="">Seleccionar especialista *</option>
                {especialistasDisponibles.map(esp => (
                  <option key={esp.id_medicos} value={esp.id_medicos}>
                    Dr. {esp.nombre} {esp.apellido_paterno} ({esp.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-agregar">
              ➕ Crear Equipo
            </button>
          </form>
        </div>
        
        {/* LISTADO DERECHO */}
        <div className="lista-pacientes-container">
          <div className="header-lista">
            <h3>Listado de Equipos</h3>
            <span className="contador-equipos">{equipos.length} equipos</span>
          </div>
          <div className="lista-pacientes-compacta">
            {loading ? <p>Cargando equipos...</p> : (
              equipos.length === 0 ? <p>No hay equipos registrados.</p> : (
                equipos.map(nombreEquipo => (
                  <div 
                    key={nombreEquipo} 
                    className="paciente-item-compacto"
                    onClick={() => handleGestionarEspecialistas(nombreEquipo)}
                  >
                    <div className="paciente-info-compacta">
                      <h4>{nombreEquipo}</h4>
                      {/* Aquí podrías mostrar cuántos miembros tiene si la API lo devolviera */}
                    </div>
                    <div className="acciones-lista-equipo">
                       <button 
                         className="btn-eliminar-lista-equipo"
                         title="Eliminar equipo completo"
                         onClick={(e) => handleEliminarEquipoCompleto(e, nombreEquipo)}
                       >
                         🗑️
                       </button>
                       <div className="flecha-derecha">➡️</div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipoMedico;