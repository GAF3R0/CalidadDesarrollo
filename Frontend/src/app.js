import axios from 'axios';

 const cargarDatosUsuario = async() => {
    const token = localStorage.getItem('token');
    if(token){
      try{
        const response = await axios.get('http://localhost:4001/api/auth/me', {
           headers: { Authorization: `Bearer ${token}` }
        });
        // CORRECCIÓN 2: Guarda el usuario en el estado. Esta es la línea clave.
        setUser(response.data); 
      } catch(error) {
        console.error('Token no válido, limpiando...', error);
        localStorage.removeItem('token');
        setUser(null); // Asegúrate de limpiar el usuario si el token falla
      }
    }
    setAuthLoading(false);
  };