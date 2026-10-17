import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Vistas/Login';
import Layout from './Vistas/Layout';
import Pacientes from './Vistas/Pacientes';
import Especialistas from './Vistas/Especialistas';
import EquipoMedico from './Vistas/EquipoMedico';
import Horarios from './Vistas/Horarios';
import Cirugias from './Vistas/Cirugias';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner"></div>
        <p>Cargando sistema hospitalario ABMODEL...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Pacientes />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="especialistas" element={<Especialistas />} />
        <Route path="equipo-medico" element={<EquipoMedico />} />
        <Route path="horarios" element={<Horarios />} />
        <Route path="cirugias" element={<Cirugias />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
