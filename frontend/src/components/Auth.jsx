import React, { useState } from 'react';
import axios from 'axios';

const Auth = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLogin, setIsLogin] = useState(true);  // Estado para determinar si es login o registro
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? 'http://localhost:5000/login' : 'http://localhost:5000/register';  // URL para login o registro
    try {
      const response = await axios.post(url, formData);
      setMessage(response.data.message);
      if (response.data.access_token) {
        // Guardar token en localStorage o hacer algo con el token
        localStorage.setItem('access_token', response.data.access_token);
      }
    } catch (error) {
      setMessage('Error en el login o registro');
      console.error(error);
    }
  };

  return (
    <div>
      <h1>{isLogin ? 'Iniciar sesión' : 'Registrar'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <button type="submit">{isLogin ? 'Iniciar sesión' : 'Registrar'}</button>
      </form>
      <p>{message}</p>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  );
};

export default Auth;

