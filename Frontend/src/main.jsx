import React from 'react'; // <-- ESTA LÍNEA ES LA CLAVE QUE FALTABA
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';
//hola

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);