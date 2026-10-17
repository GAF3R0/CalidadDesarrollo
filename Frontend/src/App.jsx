import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/App.css';
import Login from './Vistas/Login';
import Layout from './Vistas/Layout';
import Pacientes from './Vistas/Pacientes';
import Especialistas from './Vistas/Especialistas';
import EquipoMedico from './Vistas/EquipoMedico';
import Horarios from './Vistas/Horarios';
import Cirugias from './Vistas/Cirugias';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const cargarDatosUsuario = async() => {
    const token = localStorage.getItem('token');
    if(token){
      try{
        const response = await axios.get('http://localhost:4001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data); 
      } catch(error) {
        console.error('Token no válido, limpiando...', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const handleLogin = (data) =>{
    localStorage.setItem('token', data.token);
    cargarDatosUsuario();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if(authLoading){
    return <div>Cargando aplicación...</div>
  }

  return (
    <BrowserRouter>
      {!user ? (
        <Login onLogin={handleLogin}/>
      ) : (
        <Routes>
          <Route 
            path="/" 
            element={
              <Layout 
                user={user} 
                onLogout={handleLogout} 
                onProfileUpdate={cargarDatosUsuario}
              />
            }
          >
            <Route index element={<Pacientes />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="especialistas" element={<Especialistas />} />
            <Route path="equipo-medico" element={<EquipoMedico />} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="cirugias" element={<Cirugias />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;

