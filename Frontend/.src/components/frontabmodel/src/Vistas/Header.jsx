import React, { useState, useEffect } from 'react';
import '../styles/Header.css'; // Asegúrate de que este archivo contenga los estilos del tema y del botón
import '../styles/theme.css'; // O si tienes los estilos del tema en un archivo separado

const Header = ({ user, onLogout }) => {
  // --- Lógica del Tema ---
  // Estado para guardar el tema actual ('light' o 'dark')
  const [theme, setTheme] = useState(() => {
    // Lee el tema guardado en localStorage o usa 'light' por defecto
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Efecto para aplicar el tema al HTML y guardarlo cuando cambie
  useEffect(() => {
    // Aplica el atributo data-theme al elemento <html>
    document.documentElement.setAttribute('data-theme', theme);
    // Guarda la preferencia en localStorage
    localStorage.setItem('theme', theme);
  }, [theme]); // Este efecto se ejecuta cada vez que el estado 'theme' cambia

  // Función para cambiar el tema
  const handleThemeToggle = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  // --- Fin Lógica del Tema ---

  // Si no hay usuario, muestra un header simple (puedes añadir el botón aquí también si quieres)
  if (!user) {
    return (
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Hospital ADMODEL</h1>
        </div>
        {/* Puedes opcionalmente agregar el botón de tema aquí también */}
        <div className="header-right">
            <button id="theme-toggle-button" onClick={handleThemeToggle} className="theme-toggle-button-header">
              <span id="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            </button>
        </div>
      </header>
    );
  }

  // --- Lógica de Información del Usuario (existente) ---
  const nombreCompleto = [user.nombre, user.apellido_paterno, user.apellido_materno]
    .filter(Boolean)
    .join(' ');
  const rolDisplay = user.role || 'Rol no especificado';
  const especialidadDisplay = user.especialidad || '';
  // --- Fin Lógica de Información del Usuario ---

  return (
    <header className="app-header">
      {/* Sección Izquierda (Título) */}
      <div className="header-left">
        <h1 className="app-title">Hospital ABMODEL</h1>
      </div>

      {/* Sección Derecha (Info Usuario + Botones) */}
      <div className="header-right">
        <div className="header-user-info">
          <span className="user-name-header">{nombreCompleto}</span>
          <span className="user-role-header">{rolDisplay}</span>
          {especialidadDisplay && <span className="user-specialty-header">{especialidadDisplay}</span>}
        </div>

        {/* Botón de Cambio de Tema */}
        <button
          id="theme-toggle-button" // ID opcional si no lo necesitas para CSS específico
          onClick={handleThemeToggle}
          className="theme-toggle-button-header" // Clase para estilos específicos del header
        >
          <span id="theme-icon">
            {/* El icono cambia según el estado del tema */}
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>

        {/* Botón de Cerrar Sesión */}
        <button onClick={onLogout} className="logout-button-header">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;