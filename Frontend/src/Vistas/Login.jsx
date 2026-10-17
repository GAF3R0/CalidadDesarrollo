import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const { login } = useAuth();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setErrorLogin('');

    if (!cedula.trim() || !password) {
      setErrorLogin('Por favor, ingrese su cédula y contraseña.');
      return;
    }

    setSubmitting(true);
    const result = await login(cedula.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setErrorLogin(result.msg || 'Cédula o contraseña incorrectas. Por favor, verifique sus credenciales.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <span className="logo-icon">+</span>
        </div>
        <h1 className="title">ABMODEL</h1>
        <p className="subtitle">Sistema Integral de Gestión Quirúrgica y Hospitalaria</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="cedula">Cédula Profesional</label>
            <input
              type="text"
              id="cedula"
              name="cedula"
              placeholder="Ej. 123456789"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'VALIDANDO...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        {errorLogin && (
          <div className="error-alert">
            {errorLogin}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;