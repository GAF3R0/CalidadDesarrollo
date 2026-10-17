import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatosUsuario = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosUsuario();

    // Escucha eventos globales de desautorización (token expirado)
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (cedula, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { cedula, password });
      localStorage.setItem('token', response.data.token);
      await cargarDatosUsuario();
      return { success: true };
    } catch (err) {
      const mensaje = err.response?.data?.msg || 'Error al iniciar sesión. Verifique sus credenciales.';
      setError(mensaje);
      return { success: false, msg: mensaje };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        refreshUser: cargarDatosUsuario,
        isAdmin: user?.role === 'Administrador'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
