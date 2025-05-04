const API_URL = "http://localhost:5000/api";

export const register = async (username, password) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const login = async (username, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const getContainers = async (token) => {
  const res = await fetch(`${API_URL}/containers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const createContainer = async (token, name, image, command, env, ports) => {
  const res = await fetch(`${API_URL}/containers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, image, command, env, ports }),
  });
  return res.json();
};

export const deleteContainer = async (token, id) => {
  const res = await fetch(`${API_URL}/containers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const restartContainer = async (token, id) => {
  const res = await fetch(`${API_URL}/containers/${id}/restart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};
export const getLogs = async (token, id) => {
  const res = await fetch(`${API_URL}/containers/${id}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const startContainer = async (token, id) => {
  const res = await fetch(`${API_URL}/containers/${id}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const stopContainer = async (token, id) => {
  const res = await fetch(`${API_URL}/containers/${id}/stop`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};
export const getStats = async (token, id) => {
  const res = await fetch(`${API_URL}/containers/${id}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

