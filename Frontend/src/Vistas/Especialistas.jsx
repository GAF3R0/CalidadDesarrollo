import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Especialistas.css';
// Eliminado: import { useEffect } from 'react'; // Ya estaba importado arriba

const Especialistas = () => {

  // --- ESTADOS ---
  const [medicos, setMedicos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // --- NUEVOS ESTADOS PARA MODAL DE GESTIÓN ---
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [gestionTipo, setGestionTipo] = useState(''); // 'roles' o 'especialidades'
  const [nuevoItemNombre, setNuevoItemNombre] = useState(''); // Para el input del modal

  const [formState, setFormState] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    cedula_profecional: '',
    telefono: '',
    id_rol: '',
    id_especialidad: '',
    password: ''
  });

  const API_BASE_URL = 'http://localhost:4001/api';

  // --- VALIDACIONES ---
  const validaciones = {
    nombre: (valor) => {
      const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]{2,50}$/;
      if (!valor.trim()) return 'El nombre es requerido';
      if (!regex.test(valor)) return 'El nombre solo puede contener letras y espacios (2-50 caracteres)';
      return null;
    },
    apellido_paterno: (valor) => {
      const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]{2,30}$/;
      if (!valor.trim()) return 'El apellido paterno es requerido';
      if (!regex.test(valor)) return 'El apellido paterno solo puede contener letras y espacios (2-30 caracteres)';
      return null;
    },
    apellido_materno: (valor) => {
      const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]{0,30}$/;
      if (valor && !regex.test(valor)) return 'El apellido materno solo puede contener letras y espacios (máximo 30 caracteres)';
      return null;
    },
    cedula_profecional: (valor) => {
      const regex = /^[A-Za-z]{3}-\d{3}-[A-Za-z]{3}$/;
      if (!valor.trim()) return 'La cédula profesional es requerida';
      if (!regex.test(valor)) return 'Formato inválido. Use: XXX-123-XXX (ej: Med-012-ABC)';
      return null;
    },
    telefono: (valor) => {
      const regex = /^\(\+52\)\d{3}-\d{3}-\d{4}$/;
      if (valor && !regex.test(valor)) return 'Formato inválido. Use: (+52)961-123-4567';
      return null;
    },
    password: (valor, isEditing) => {
      if (!isEditing && !valor.trim()) return 'La contraseña es requerida';
      if (valor && valor.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      return null;
    },
    // Validación para el nuevo item en el modal
    nuevoItem: (valor) => {
        const regex = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]{2,50}$/;
        if (!valor.trim()) return 'El nombre es requerido';
        if (!regex.test(valor)) return 'Solo puede contener letras y espacios (2-50 caracteres)';
        return null;
    }
  };

  // --- MÉTODOS DE FORMATEO ---
  const formatearCedula = (valor) => {
    let cleaned = valor.replace(/[^A-Za-z0-9]/g, '');
    if (cleaned.length <= 3) return cleaned.toUpperCase();
    if (cleaned.length <= 6) return cleaned.slice(0, 3).toUpperCase() + '-' + cleaned.slice(3, 6);
    return cleaned.slice(0, 3).toUpperCase() + '-' + cleaned.slice(3, 6) + '-' + cleaned.slice(6, 9).toUpperCase();
  };

  const formatearTelefono = (valor) => {
    let cleaned = valor.replace(/\D/g, '');
    if (cleaned.startsWith('52')) cleaned = cleaned.slice(2);
    if (cleaned.length === 0) return '(+52)';
    if (cleaned.length <= 3) return `(+52)${cleaned}`;
    if (cleaned.length <= 6) return `(+52)${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `(+52)${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // --- CARGA DE DATOS INICIAL ---
  const cargarDatos = async (mostrarAlerta = false) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resMedicos, resRoles, resEspecialidades] = await Promise.all([
        axios.get(`${API_BASE_URL}/usuarios`, { headers }),
        axios.get(`${API_BASE_URL}/roles`, { headers }),
        axios.get(`${API_BASE_URL}/especialidades`, { headers })
      ]);
      setMedicos(resMedicos.data);
      setRoles(resRoles.data);
      setEspecialidades(resEspecialidades.data);
      if (mostrarAlerta) alert('Listas actualizadas!');
    } catch (err) {
      setError('Error al cargar los datos.');
      console.error("Error en cargarDatos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- MANEJADORES DE FORMULARIO ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormateado = value;

    if (name === 'cedula_profecional') valorFormateado = formatearCedula(value);
    else if (name === 'telefono') valorFormateado = formatearTelefono(value);
    else if (['nombre', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      valorFormateado = value.replace(/[^A-Za-zÁáÉéÍíÓóÚúÑñ\s]/g, '');
    }

    setFormState(prev => ({ ...prev, [name]: valorFormateado }));

    if (fieldErrors[name]) {
      const error = validarCampo(name, valorFormateado);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validarCampo = (name, value) => {
    if (name === 'password') return validaciones.password(value, !!isEditing); // Asegura que isEditing sea booleano
    return validaciones[name] ? validaciones[name](value) : null;
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    Object.keys(formState).forEach(key => {
      // Solo validar contraseña si no estamos editando O si se escribió algo en ella
      if (key !== 'password' || !isEditing || (isEditing && formState.password)) {
          const error = validarCampo(key, formState[key]);
          if (error) nuevosErrores[key] = error;
      }
    });
    if (!formState.id_rol) nuevosErrores.id_rol = 'El rol es requerido';
    if (!formState.id_especialidad) nuevosErrores.id_especialidad = 'La especialidad es requerida';
    setFieldErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormState({
      nombre: '', apellido_paterno: '', apellido_materno: '',
      cedula_profecional: '', telefono: '', id_rol: '',
      id_especialidad: '', password: ''
    });
    setFieldErrors({});
    setError(''); // Limpia el error general también
  };

  const handleCancelar = () => resetForm();

  // --- LÓGICA CRUD ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }
    setError(''); // Limpia error previo si la validación pasa

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const dataToSend = { ...formState };
    // No enviar password vacío al editar
    if (isEditing && !dataToSend.password.trim()) {
      delete dataToSend.password;
    }

    try {
      if (isEditing) {
        const response = await axios.put(`${API_BASE_URL}/usuarios/${isEditing}`, dataToSend, { headers });
        // Actualizar solo el médico editado en el estado local
        setMedicos(medicos.map(medico =>
          medico.id_medicos === isEditing ? response.data.medico : medico
        ));
        alert('¡Especialista actualizado con éxito!');
      } else {
        const response = await axios.post(`${API_BASE_URL}/usuarios`, dataToSend, { headers });
        // Agregar el nuevo médico al estado local
        setMedicos([...medicos, response.data.medico]);
        alert('¡Especialista registrado con éxito!');
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al guardar el especialista.');
      console.error("Error en handleSubmit:", err.response || err);
    }
  };

  const handleEditar = (medico) => {
    setIsEditing(medico.id_medicos);
    setFormState({
      nombre: medico.nombre || '',
      apellido_paterno: medico.apellido_paterno || '',
      apellido_materno: medico.apellido_materno || '',
      cedula_profecional: medico.cedula_profecional || '',
      telefono: medico.telefono || '',
      id_rol: medico.id_rol,
      id_especialidad: medico.id_especialidad,
      password: '' // Limpiar campo de contraseña al editar
    });
    setFieldErrors({}); // Limpiar errores al cargar para editar
    setError('');
    window.scrollTo(0, 0); // Opcional: llevar al inicio de la página
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar a este especialista?')) {
      setError(''); // Limpiar error previo
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/usuarios/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedicos(medicos.filter(esp => esp.id_medicos !== id));
        alert('Especialista eliminado con éxito.');
        // Si estábamos editando al que se eliminó, resetear form
        if (isEditing === id) resetForm();
      } catch (err) {
        setError(err.response?.data?.msg || 'Error al eliminar el especialista.');
        console.error("Error en handleEliminar:", err.response || err);
      }
    }
  };

  // --- FUNCIONES PARA MODAL DE GESTIÓN ---
  const abrirModalGestion = (tipo) => {
    setGestionTipo(tipo); // 'roles' o 'especialidades'
    setNuevoItemNombre(''); // Limpiar input
    setShowGestionModal(true);
  };

  const cerrarModalGestion = () => {
    setShowGestionModal(false);
    setGestionTipo('');
    setNuevoItemNombre('');
  };

  const handleNuevoItemChange = (e) => {
    setNuevoItemNombre(e.target.value.replace(/[^A-Za-zÁáÉéÍíÓóÚúÑñ\s]/g, '')); // Solo letras y espacios
  };

  const agregarNuevoItem = async () => {
    const errorValidacion = validaciones.nuevoItem(nuevoItemNombre);
    if (errorValidacion) {
        alert(errorValidacion);
        return;
    }

    const endpoint = gestionTipo === 'roles' ? '/roles' : '/especialidades';
    const data = { descripcion: nuevoItemNombre.trim() }; // El backend espera 'descripcion'
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.post(`${API_BASE_URL}${endpoint}`, data, { headers });
      setNuevoItemNombre(''); // Limpiar input
      await cargarDatos(true); // Recargar roles y especialidades y mostrar alerta
    } catch (err) {
      alert(`Error al agregar ${gestionTipo === 'roles' ? 'rol' : 'especialidad'}: ` + (err.response?.data?.msg || err.message));
      console.error("Error en agregarNuevoItem:", err.response || err);
    }
  };

  const eliminarItem = async (id) => {
    const itemNombre = gestionTipo === 'roles'
        ? roles.find(r => r.id_rol === id)?.descripcion
        : especialidades.find(e => e.id_especialidad === id)?.descripcion;

    if (!window.confirm(`¿Seguro que quieres eliminar "${itemNombre}"?`)) return;

    const endpoint = gestionTipo === 'roles' ? `/roles/${id}` : `/especialidades/${id}`;
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.delete(`${API_BASE_URL}${endpoint}`, { headers });
      await cargarDatos(true); // Recargar y mostrar alerta
    } catch (err) {
      alert(`Error al eliminar: ` + (err.response?.data?.msg || err.message));
      console.error("Error en eliminarItem:", err.response || err);
    }
  };

  // Determina qué lista mostrar en el modal
  const listaGestion = gestionTipo === 'roles' ? roles : especialidades;
  const idKey = gestionTipo === 'roles' ? 'id_rol' : 'id_especialidad';

  // --- RENDERIZADO DEL COMPONENTE ---
  if (loading) return <div>Cargando gestión de especialistas...</div>;

  return (
    <div className="especialistas-container">
      <h2>Gestión de Especialistas</h2>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="btn-cerrar-error">×</button>
        </div>
      )}

      <div className="especialistas-content-layout">
        {/* FORMULARIO */}
        <div className="form-especialista">
          <h3>{isEditing ? 'Editando Especialista' : 'Registrar Nuevo Especialista'}</h3>
          <form onSubmit={handleSubmit}>
            {/* Campos del formulario... */}
            <div className="form-group"><label>Nombre *</label><input type="text" name="nombre" value={formState.nombre} onChange={handleInputChange} onBlur={() => setFieldErrors(prev => ({ ...prev, nombre: validaciones.nombre(formState.nombre) }))} placeholder="Ej: Juan Carlos" required className={fieldErrors.nombre ? 'input-error' : ''} />{fieldErrors.nombre && <span className="error-text">{fieldErrors.nombre}</span>}</div>
            <div className="form-group"><label>Apellido Paterno *</label><input type="text" name="apellido_paterno" value={formState.apellido_paterno} onChange={handleInputChange} onBlur={() => setFieldErrors(prev => ({ ...prev, apellido_paterno: validaciones.apellido_paterno(formState.apellido_paterno) }))} placeholder="Ej: Pérez" required className={fieldErrors.apellido_paterno ? 'input-error' : ''} />{fieldErrors.apellido_paterno && <span className="error-text">{fieldErrors.apellido_paterno}</span>}</div>
            <div className="form-group"><label>Apellido Materno</label><input type="text" name="apellido_materno" value={formState.apellido_materno} onChange={handleInputChange} onBlur={() => setFieldErrors(prev => ({ ...prev, apellido_materno: validaciones.apellido_materno(formState.apellido_materno) }))} placeholder="Ej: García" className={fieldErrors.apellido_materno ? 'input-error' : ''} />{fieldErrors.apellido_materno && <span className="error-text">{fieldErrors.apellido_materno}</span>}</div>
            <div className="form-group"><label>Cédula Profesional *</label><input type="text" name="cedula_profecional" value={formState.cedula_profecional} onChange={handleInputChange} onBlur={() => setFieldErrors(prev => ({ ...prev, cedula_profecional: validaciones.cedula_profecional(formState.cedula_profecional) }))} placeholder="Ej: Med-012-ABC" required maxLength="11" className={fieldErrors.cedula_profecional ? 'input-error' : ''} />{fieldErrors.cedula_profecional && <span className="error-text">{fieldErrors.cedula_profecional}</span>}</div>
            <div className="form-group"><label>Teléfono</label><input type="text" name="telefono" value={formState.telefono} onChange={handleInputChange} onBlur={() => setFieldErrors(prev => ({ ...prev, telefono: validaciones.telefono(formState.telefono) }))} placeholder="Ej: (+52)961-123-4567" maxLength="17" className={fieldErrors.telefono ? 'input-error' : ''} />{fieldErrors.telefono && <span className="error-text">{fieldErrors.telefono}</span>}</div>

            {/* Especialidad con Botón */}
            <div className="form-group-combobox">
              <label>Especialidad *</label>
              <div className="combobox-container">
                <select name="id_especialidad" value={formState.id_especialidad} onChange={handleInputChange} required className={fieldErrors.id_especialidad ? 'input-error' : ''}>
                  <option value="">Seleccionar especialidad</option>
                  {especialidades.map(e => (<option key={e.id_especialidad} value={e.id_especialidad}>{e.descripcion}</option>))}
                </select>
                 </div>
              {fieldErrors.id_especialidad && <span className="error-text">{fieldErrors.id_especialidad}</span>}
            </div>

            {/* Rol con Botón */}
            <div className="form-group-combobox">
              <label>Rol *</label>
              <div className="combobox-container">
                <select name="id_rol" value={formState.id_rol} onChange={handleInputChange} required className={fieldErrors.id_rol ? 'input-error' : ''}>
                  <option value="">Seleccionar rol</option>
                  {roles.map(r => (<option key={r.id_rol} value={r.id_rol}>{r.descripcion}</option>))}
                </select>
              </div>
              {fieldErrors.id_rol && <span className="error-text">{fieldErrors.id_rol}</span>}
            </div>

            {/* Contraseña */}
            <div className="form-group">
              <label>Contraseña {!isEditing && '*'}</label>
              <input type="password" name="password" value={formState.password} onChange={handleInputChange} onBlur={() => setFieldErrors(prev => ({ ...prev, password: validaciones.password(formState.password, !!isEditing) }))} required={!isEditing} placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"} className={fieldErrors.password ? 'input-error' : ''} />
              {fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
            </div>

            {/* Botones */}
            <div className="form-actions">
              <button type="submit" className="btn-agregar">{isEditing ? '💾 Actualizar' : '➕ Registrar'}</button>
              {isEditing && (<button type="button" onClick={handleCancelar} className="btn-cancelar">❌ Cancelar</button>)}
            </div>
          </form>
        </div>

        {/* LISTADO DERECHO */}
        <div className="lista-especialistas-container">
          <div className="header-lista">
            <h3>Listado de Especialistas</h3>
            <span className="contador-especialistas">{medicos.length}</span>
          </div>
          {medicos.length > 0 ? (
            <div className="lista-especialistas">
              {medicos.map(medico => (
                <div key={medico.id_medicos} className="especialista-card">
                  <div className="especialista-header">
                    <div className="especialista-avatar">
                      {(medico.nombre?.charAt(0) || '')}{(medico.apellido_paterno?.charAt(0) || '')}
                    </div>
                    <div className="especialista-info">
                      <h4>{medico.nombre} {medico.apellido_paterno} {medico.apellido_materno}</h4>
                      <p className="especialista-datos">
                        <strong>ID:</strong> {medico.id_medicos} | <strong>Cédula:</strong> {medico.cedula_profecional} <br/>
                        <strong>Rol:</strong> {medico.rol} | <strong>Especialidad:</strong> {medico.especialidad} <br/>
                        <strong>Teléfono:</strong> {medico.telefono || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEditar(medico)} className="btn-editar">✏️ Editar</button>
                    <button onClick={() => handleEliminar(medico.id_medicos)} className="btn-eliminar">🗑️ Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lista-vacia"><p>No hay especialistas registrados.</p></div>
          )}
        </div>
      </div>



    </div>
  );
};

export default Especialistas;