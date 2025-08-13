// Servicio de autenticación

const BASE_URL = 'http://localhost:8000/api';

// Función para refrescar el token
async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh,
      }),
    });

    if (!response.ok) throw new Error('Error al refrescar el token');

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return null;
  }
}

// Función para hacer peticiones autenticadas
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  let token = localStorage.getItem('access_token');

  if (!token) {
    token = await refreshToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('No hay token disponible');
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': options.headers?.['Content-Type'] || 'application/json',
      },
    });

    if (response.status === 401) {
      token = await refreshToken();
      if (!token) {
        logout();
        throw new Error('Sesión expirada');
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': options.headers?.['Content-Type'] || 'application/json',
        },
      });
    }

    return response;
  } catch (error) {
    console.error('Request error:', error);
    if (!token) {
      logout();
    }
    throw error;
  }
}

// Función para cerrar sesión
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}

export { makeAuthenticatedRequest, logout };