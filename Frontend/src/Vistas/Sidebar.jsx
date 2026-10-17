import React, { useState } from 'react';
import api from '../api/axiosClient';
import '../styles/Sidebar.css';
import { NavLink } from 'react-router-dom';

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';

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
      const urlTemporal = URL.createObjectURL(e.target.files[0]);
      setFotoActual(urlTemporal);
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
      const response = await api.put('/usuarios/perfil/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('¡Foto de perfil actualizada exitosamente!');

      if (response.data && response.data.foto_perfil) {
        const nuevaFotoUrl = `${SERVER_BASE_URL}/${response.data.foto_perfil.replace(/\\/g, '/')}`;
        setFotoActual(nuevaFotoUrl);
        if (archivo && fotoActual?.startsWith('blob:')) {
          URL.revokeObjectURL(fotoActual);
        }
      }

      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error('Error al subir la foto:', error.response?.data || error.message);
      alert(error.response?.data?.msg || 'Error al subir la foto. Verifica que sea una imagen válida menor a 3MB.');
      setFotoActual(user?.foto_perfil ? `${SERVER_BASE_URL}/${user.foto_perfil.replace(/\\/g, '/')}` : null);
    } finally {
      setSubiendo(false);
      setArchivo(null);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  const imageUrl = fotoActual
    ? (fotoActual.startsWith('blob:')
        ? fotoActual
        : `${SERVER_BASE_URL}/${fotoActual.replace(/\\/g, '/')}`)
    : null;

  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?';

  if (!user) {
    return <aside className="app-sidebar"></aside>;
  }

  return (
    <aside className="app-sidebar">
      {/* Perfil */}
      <div className="profile">
        <div className="profile-image-container">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Foto de perfil"
              className="profile-image"
              key={imageUrl}
              onError={(e) => {
                e.target.onerror = null;
                setFotoActual(null);
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

        {archivo && (
          <button onClick={handleImageUpload} className="upload-button" disabled={subiendo}>
            {subiendo ? 'Subiendo...' : 'Confirmar Foto'}
          </button>
        )}

        <h2 className="sidebar-welcome-message">BIENVENIDO</h2>
      </div>

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