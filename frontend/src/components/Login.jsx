import { useState } from "react";
import { login } from "../api";

export default function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const data = await login(username, password);
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token); // <== esto activa el Dashboard
    } else {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div>
      <h2>Iniciar Sesión</h2>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Entrar</button>
    </div>
  );
}
