import React from 'react';
import '../styles/Header.css'; // Solo se necesita CSS

const Header = ({ user, onLogout }) => {
  if (!user) {
    return (
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Hospital ADMODEL</h1>
        </div>
      </header>
    );
  }

  // Construcción del nombre completo
  const nombreCompleto = [user.nombre, user.apellido_paterno, user.apellido_materno]
    .filter(Boolean)
    .join(' ');

  // Información del rol y especialidad
  const rolDisplay = user.role || 'Rol no especificado';
  const especialidadDisplay = user.especialidad || '';

  return (
    <header className="app-header">
      {/* Sección Izquierda (Título) */}
      <div className="header-left">
        <h1 className="app-title">Hospital ABMODEL</h1>
      </div>

      {/* Sección Derecha (Info Usuario + Logout) */}
      <div className="header-right">
        {/* "BIENVENIDO" YA NO ESTÁ AQUÍ */}
        <div className="header-user-info">
          <span className="user-name-header">{nombreCompleto}</span>
          <span className="user-role-header">{rolDisplay}</span>
          {especialidadDisplay && <span className="user-specialty-header">{especialidadDisplay}</span>}
        </div>
        <button onClick={onLogout} className="logout-button-header">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;