import './App.css';
import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return (
      <div>
        <header className="header">
          <div className="logo">
            🐣
          </div>
          <h1>DockerNest</h1>
          <p className="slogan">Gestión inteligente de contenedores Docker</p>
        </header>

        <Login setToken={setToken} />
        <hr />
        <Register />
      </div>
    );
  }

  return (
    <>
      <header className="header">
        <div className="logo">
          🐣
        </div>
        <h1>DockerNest</h1>
        <p className="slogan">Gestión inteligente de contenedores Docker</p>
      </header>
      <Dashboard token={token} onLogout={handleLogout} />
    </>
  );
}

export default App;
