import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
  // console.log('La función onLogin recibida es:', onLogin); // Ya confirmamos que esto funciona
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
    
  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:4001/api/auth/login', {
        cedula: cedula,
        password: password
      });
      //console.log('1. Login exitoso. Enviando token a App.jsx:', response.data);
      onLogin(response.data);
    }  catch (err) {
        setErrorLogin('Cédula o contraseña incorrectas. Por favor, verifique sus credenciales.');
        console.error('Error de autenticación:', err);
      }
  };

   console.log('EN LA TABLA QUIROFONOS CAMBIE LA DE NOMBRE LA TERCERA COLUMNA POR "estado"');

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <span className="logo-icon">+</span> 
        </div>
        <h1 className="title">ADMODEL</h1>
        <p className="subtitle">Login Modificado el 20-10-25(hice cambios en la base de datos, inspecciona para ver en cosole)</p>
       
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            {/* CORRECCIÓN 4 (Sugerencia): Cambiado para mayor claridad */}
            <label htmlFor="cedula">Cédula Profesional</label>
            <input 
              type="text" 
              id="cedula" 
              name="cedula" 
              value={cedula} 
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-button">
            INGRESAR
          </button>
        </form>
        {/*MOSTRAR ERROR SI FALLAN LAS CREDENCIALES*/}
        {errorLogin && (
         <div className="error-alert">
            {errorLogin}
         </div>
        )}
         

      </div>
    </div>
   
    

    
  );
}; // <-- La llave que cierra el componente DEBE estar aquí, al final.

export default Login;