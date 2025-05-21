import React, { useEffect, useState } from "react";
import Notification from "./Notification";
import {
  getContainers,
  createContainer,
  deleteContainer,
  restartContainer,
  startContainer,
  stopContainer,
  getLogs,
  getStats,
} from "../api";

const templates = {
  nginx: {
    image: "nginx:latest",
    ports: { "80": 8080 },
    command: "",
    env: [],
  },
  wordpress: {
    image: "wordpress:latest",
    ports: { "80": 8081 },
    command: "",
    env: [],
  },
  mysql: {
    image: "mysql:5.7",
    ports: { "3306": 3306 },
    command: "",
    env: [
      { key: "MYSQL_ROOT_PASSWORD", value: "root" },
      { key: "MYSQL_DATABASE", value: "mydb" },
      { key: "MYSQL_USER", value: "user" },
      { key: "MYSQL_PASSWORD", value: "password" },
    ],
  },
  mongo: {
    image: "mongo:latest",
    ports: { "27017": 27017 },
    command: "",
    env: [
      { key: "MONGO_INITDB_ROOT_USERNAME", value: "root" },
      { key: "MONGO_INITDB_ROOT_PASSWORD", value: "example" },
    ],
  },
  redis: {
    image: "redis:latest",
    ports: { "6379": 6379 },
    command: "",
    env: [],
  },
  postgres: {
    image: "postgres:15",
    ports: { "5432": 5432 },
    command: "",
    env: [
      { key: "POSTGRES_USER", value: "user" },
      { key: "POSTGRES_PASSWORD", value: "password" },
      { key: "POSTGRES_DB", value: "mydb" },
    ],
  },
  ubuntu: {
    image: "ubuntu:latest",
    ports: {},
    command: "tail -f /dev/null",
    env: [],
  },
};

export default function Dashboard({ token, onLogout }) {
  const [containers, setContainers] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [command, setCommand] = useState("");
  const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);
  const [hostPort, setHostPort] = useState("");
  const [containerPort, setContainerPort] = useState("");
  const [template, setTemplate] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState("");
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [notification, setNotification] = useState("");
  const [notifType, setNotifType] = useState("success");
  const [stats, setStats] = useState({});
  const [networks, setNetworks] = useState([]);
  const [newNetwork, setNewNetwork] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("dockernest-net");
  const [volumes, setVolumes] = useState([{ hostPath: "", containerPath: ""}]);

 const fetchNetworks = async () => {
  const res = await fetch("http://localhost:5000/api/networks", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (Array.isArray(data)) {
    setNetworks(data.map(n => n.name));
  }
};

const handleCreateNetwork = async () => {
  if (!newNetwork) return;
  const res = await fetch("http://localhost:5000/api/networks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name: newNetwork })
  });
  const data = await res.json();
  showNotif(data.message);
  setNewNetwork("");
  fetchNetworks();
};

  const showNotif = (msg, type = "success") => {
    setNotification(msg);
    setNotifType(type);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleTemplateChange = (e) => {
    const selected = e.target.value;
    setTemplate(selected);
    if (templates[selected]) {
      const tpl = templates[selected];
      setImage(tpl.image);
      setCommand(tpl.command);
      const portKey = Object.keys(tpl.ports)[0];
      if (portKey) {
        setContainerPort(portKey);
        setHostPort(tpl.ports[portKey].toString());
      } else {
        setHostPort("");
        setContainerPort("");
      }
      setEnvVars(tpl.env.length > 0 ? tpl.env : [{ key: "", value: "" }]);
    }
  };

  const handleGetStats = async (id) => {
    try {
      const res = await getStats(token, id);
      setStats((prev) => ({ ...prev, [id]: res }));
    } catch (err) {
      showNotif("Error al obtener stats", "error");
    }
  };

  const loadContainers = async () => {
    try {
      const data = await getContainers(token);
      setContainers(Array.isArray(data) ? data : []);
      setError(!Array.isArray(data) ? data?.msg || "Error desconocido" : "");
    } catch (err) {
      setError("No se pudieron cargar los contenedores.");
      setContainers([]);
    }
  };

  const handleCreate = async () => {
    if (!name || !image) {
      showNotif("Por favor, rellena los campos de nombre e imagen.", "error");
      return;
    }
    const volumeMap = {};
volumes.forEach(({ hostPath, containerPath }) => {
  if (hostPath && containerPath) {
    volumeMap[hostPath] = { bind: containerPath, mode: "rw" };
  }
});
    const envObject = {};
    envVars.forEach((pair) => {
      if (pair.key && pair.value) envObject[pair.key] = pair.value;
    });
    let ports = {};
    if (hostPort && containerPort) {
      ports = { [`${containerPort}/tcp`]: parseInt(hostPort) };
    }
    if (image === "wordpress:latest") {
      showNotif("Creando WordPress y MySQL...");
      const dbName = `${name}_db`;
      const dbEnv = {
        MYSQL_ROOT_PASSWORD: "example",
        MYSQL_DATABASE: "wordpress",
        MYSQL_USER: "wp_user",
        MYSQL_PASSWORD: "wp_pass",
      };
      const dbRes = await createContainer(token, dbName, "mysql:5.7", null, dbEnv, {});
      if (!dbRes.id) {
        showNotif("Error al crear contenedor MySQL", "error");
        return;
      }
      await new Promise((r) => setTimeout(r, 4000));
      const wpEnv = {
        WORDPRESS_DB_HOST: dbRes.docker_name,
        WORDPRESS_DB_USER: "wp_user",
        WORDPRESS_DB_PASSWORD: "wp_pass",
        WORDPRESS_DB_NAME: "wordpress",
      };
      const wpPorts = { "80/tcp": parseInt(hostPort || "8081") };
      const wpRes = await createContainer(token, name, image, null, wpEnv, wpPorts);
      if (!wpRes.id) {
        showNotif("Error al crear contenedor WordPress", "error");
        return;
      }
      showNotif("WordPress desplegado correctamente");
      loadContainers();
      return;
    }
    const res = await createContainer(token, name, image, command, envObject, ports, volumeMap, selectedNetwork);
    if (res.id) {
      showNotif("Contenedor creado con éxito");
      setName("");
      setImage("");
      setCommand("");
      setHostPort("");
      setContainerPort("");
      setEnvVars([{ key: "", value: "" }]);
      loadContainers();
    } else {
      showNotif("Error al crear contenedor", "error");
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteContainer(token, id);
    res.message ? showNotif("Contenedor eliminado") : showNotif("Error al eliminar", "error");
    loadContainers();
  };

  const handleRestart = async (id) => {
    const res = await restartContainer(token, id);
    res.message ? showNotif("Contenedor reiniciado") : showNotif("Error al reiniciar", "error");
    loadContainers();
  };

  const handleStart = async (id) => {
    const res = await startContainer(token, id);
    res.message ? showNotif("Contenedor iniciado") : showNotif("Error al iniciar", "error");
    loadContainers();
  };

  const handleStop = async (id) => {
    const res = await stopContainer(token, id);
    res.message ? showNotif("Contenedor detenido") : showNotif("Error al detener", "error");
    loadContainers();
  };

  const handleGetLogs = async (id) => {
    try {
      const res = await getLogs(token, id);
      setSelectedContainer(id);
      setLogs(res.logs || "No se pudieron cargar los logs.");
    } catch (err) {
      showNotif("Error al obtener logs", "error");
    }
  };

  const handleEnvChange = (index, field, value) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const addEnvRow = () => setEnvVars([...envVars, { key: "", value: "" }]);

  useEffect(() => {
  loadContainers();
  fetchNetworks();
}, []);

  return (
    <div className="container">
      <h2>Mis Contenedores</h2>
      <Notification
  message={notification}
  type={notifType}
  onClose={() => setNotification("")}
/>
      {error && <div className="alert">{error}</div>}
      <ul>
       {containers.map((c) => {
  const portEntries = Object.entries(c.ports || {});
  const hasPorts = portEntries.length > 0;
  const firstPort = hasPorts ? portEntries[0][1] : null;
  const containerPort = hasPorts ? portEntries[0][0] : null;
  const accessUrl = firstPort ? `http://localhost:${firstPort}` : null;

  return (
    <li key={c.id} className="container-card">
      <strong>{c.name}</strong> ({c.image})<br />
      Estado: <em>{c.status}</em><br />
      <br />
      Usuario: <em>{c.usuario}</em><br />
      <p>Red: {c.network}</p>
      {hasPorts && (
        <p>Puertos: {portEntries.map(([cPort, hPort]) => `${hPort} ➝ ${cPort}`).join(', ')}</p>
      )}
      {accessUrl && (
        <button
          onClick={() => window.open(accessUrl, '_blank')}
          className="success"
        >
          Abrir en navegador
        </button>
      )}
      <button onClick={() => handleRestart(c.id)}>Reiniciar</button>
      <button onClick={() => handleStart(c.id)} className="success">Iniciar</button>
      <button onClick={() => handleStop(c.id)} className="danger">Detener</button>
      <button onClick={() => handleDelete(c.id)} className="danger">Eliminar</button>
      <button onClick={() => handleGetLogs(c.id)}>Ver logs</button>
      <button onClick={() => handleGetStats(c.id)}>Ver uso</button>
      {selectedContainer === c.id && (
        <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f4f4f4', padding: '10px', marginTop: '10px' }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{logs}</pre>
        </div>
      )}
      {stats[c.id] && (
        <div className="stats" style={{ marginTop: '10px' }}>
          <h5>Estadísticas:</h5>
          <p>CPU: {stats[c.id].cpu_percent || stats[c.id].cpu?.percent}%</p>
          <p>Memoria: {stats[c.id].memory_usage} / {stats[c.id].memory_limit}</p>
        </div>
      )}
    </li>
  );
})}
      </ul>
      <hr />
      <h3>Crear nuevo contenedor</h3>
      <label style={{ marginTop: "1rem", fontWeight: "bold", display: "block" }}>
        Selecciona una plantilla:
      </label>
      <select
        value={template}
        onChange={handleTemplateChange}
        style={{ padding: "12px 16px", margin: "10px 0 20px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", width: "100%", maxWidth: "400px", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "all 0.2s ease-in-out", outline: "none" }}
        onFocus={(e) => e.target.style.borderColor = "#007bff"}
        onBlur={(e) => e.target.style.borderColor = "#ccc"}
      >
        <option value="">-- Selecciona una plantilla --</option>
        {Object.keys(templates).map((tpl) => (
          <option key={tpl} value={tpl}>
            {tpl.charAt(0).toUpperCase() + tpl.slice(1)}
          </option>
        ))}
      </select>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del contenedor" />
      <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Imagen (ej: mongo:latest)" />
      <input value={command} onChange={(e) => setCommand(e.target.value)} placeholder='Comando (opcional)' />
      <input value={hostPort} onChange={(e) => setHostPort(e.target.value)} placeholder="Puerto en el host (ej: 8080)" />
      <input value={containerPort} onChange={(e) => setContainerPort(e.target.value)} placeholder="Puerto en el contenedor (ej: 80)" />
      <h4>Red Docker</h4>
<select value={selectedNetwork} onChange={(e) => setSelectedNetwork(e.target.value)}>
  {networks.map((net) => (
    <option key={net} value={net}>{net}</option>
  ))}
</select>
<div style={{ marginTop: '10px' }}>
  <input
    type="text"
    value={newNetwork}
    onChange={(e) => setNewNetwork(e.target.value)}
    placeholder="Nombre de nueva red"
    style={{ marginRight: '10px' }}
  />
  <button onClick={handleCreateNetwork} className="success">Crear red</button>
</div>


      <h4>Variables de entorno</h4>
      {envVars.map((pair, idx) => (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
          <input placeholder="Clave" value={pair.key} onChange={(e) => handleEnvChange(idx, "key", e.target.value)} />
          <input placeholder="Valor" value={pair.value} onChange={(e) => handleEnvChange(idx, "value", e.target.value)} />
        </div>
      ))}
      <button onClick={addEnvRow} className="success">Añadir variable</button>
      <br /><br />
      
      <h4>Volúmenes (host ➝ contenedor)</h4>
{volumes.map((vol, idx) => (
  <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
    <input
      placeholder="Ruta en el host"
      value={vol.hostPath}
      onChange={(e) => {
        const updated = [...volumes];
        updated[idx].hostPath = e.target.value;
        setVolumes(updated);
      }}
    />
    <input
      placeholder="Ruta en el contenedor"
      value={vol.containerPath}
      onChange={(e) => {
        const updated = [...volumes];
        updated[idx].containerPath = e.target.value;
        setVolumes(updated);
      }}
    />
  </div>
))}
<button
  onClick={() => setVolumes([...volumes, { hostPath: "", containerPath: "" }])}
  className="success"
>
  Añadir volumen
</button>
      
      <button onClick={handleCreate} className="success">Crear contenedor</button>
      <hr />
      <button onClick={onLogout} className="danger">Cerrar sesión</button>
    </div>
  );
}
