import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Sidebar.css';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, onProfileUpdate, onToggle }) => {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [fotoActual, setFotoActual] = useState(user?.foto_perfil || null);

  // Lógica de Roles para Navegación
  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'administrador';
  const isEspecialista = userRole === 'especialista' || userRole === 'espacialista';

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setArchivo(e.target.files[0]);
      
      // Vista previa inmediata - crear URL temporal para el archivo seleccionado
      const urlTemporal = URL.createObjectURL(e.target.files[0]);
      setFotoActual(urlTemporal); // Mostrar la imagen seleccionada inmediatamente
    }
  };

  const handleImageUpload = async () => {
    if (!archivo) {
      alert('Por favor, selecciona un archivo primero.');
      return;
    }
    setSubiendo(true);
    const formData = new FormData();
    formData.append('fotoPerfil', archivo);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:4001/api/usuarios/perfil/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      alert('¡Foto de perfil actualizada!');
      
      // ACTUALIZAR CON LA FOTO REAL DEL SERVIDOR
      if (response.data && response.data.foto_perfil) {
        const nuevaFotoUrl = `http://localhost:4001/${response.data.foto_perfil.replace(/\\/g, '/')}`;
        setFotoActual(nuevaFotoUrl);
        
        // Limpiar la URL temporal si existe
        if (archivo) {
          URL.revokeObjectURL(fotoActual);
        }
      }
      
      // Notificar al componente padre
      if (onProfileUpdate) onProfileUpdate();
      
    } catch (error) {
      console.error('Error al subir la foto:', error.response?.data || error.message);
      alert('Error al subir la foto. Verifica la consola.');
      
      // Revertir a la foto original si hay error
      setFotoActual(user?.foto_perfil ? `http://localhost:4001/${user.foto_perfil.replace(/\\/g, '/')}` : null);
    } finally {
      setSubiendo(false);
      setArchivo(null);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  // Construir la URL de la imagen
  const imageUrl = fotoActual 
    ? (fotoActual.startsWith('blob:') 
        ? fotoActual // Es una URL temporal
        : `http://localhost:4001/${fotoActual.replace(/\\/g, '/')}`) // Es la ruta del servidor
    : null;

  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?';

  if (!user) {
    return <aside className="app-sidebar"></aside>;
  }

  return (
    <aside className="app-sidebar">
      {/* Perfil */}
      <div className="profile">
        {/* Contenedor Imagen y Botón Subir */}
        <div className="profile-image-container">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Foto de perfil" 
              className="profile-image" 
              key={imageUrl} // Forzar re-render cuando cambie la URL
              onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = '/path/to/default/avatar.png'; 
              }} 
            />
          ) : (
            <div className="profile-icon">{inicial}</div>
          )}
          <label htmlFor="file-upload" className="upload-icon-label" title="Cambiar foto">📷</label>
          <input
            id="file-upload" 
            type="file" 
            className="hidden-file-input"
            onChange={handleFileChange} 
            accept="image/*"
          />
        </div>
        {/* Botón confirmar foto */}
        {archivo && (
          <button onClick={handleImageUpload} className="upload-button" disabled={subiendo}>
            {subiendo ? 'Subiendo...' : 'Confirmar Foto'}
          </button>
        )}

        <h2 className="sidebar-welcome-message">BIENVENIDO</h2>
      </div>

      {/* Resto del código igual... */}
      <nav className="sidebar-nav">
        {isAdmin && (
          <>
            <NavLink to="/pacientes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Pacientes</NavLink>
            <NavLink to="/especialistas" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Especialistas</NavLink>
            <NavLink to="/equipo-medico" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Equipo Médico</NavLink>
            <NavLink to="/horarios" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Horarios</NavLink>
            <NavLink to="/cirugias" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Cirugías</NavLink>
          </>
        )}
        {isEspecialista && (
          <>
            <NavLink to="/pacientes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Pacientes</NavLink>
            <NavLink to="/equipo-medico" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Equipo Médico</NavLink>
            <NavLink to="/horarios" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Mis Horarios</NavLink>
          </>
        )}
      </nav>

      <div style={{ flex: 1 }}></div>
      <div className="sidebar-divider">
        {onToggle && (
          <button className="toggle-sidebar-btn" onClick={onToggle} title="Ocultar menú">
            ◀
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;