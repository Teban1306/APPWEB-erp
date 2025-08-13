import React, { useState, useEffect } from 'react';
import { formatCOP } from '../utils/formatters';

const TestAPI = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState('');

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      console.log('Testing API...');
      
      // Test directo sin autenticación
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/productos/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const text = await response.text();
      setRawResponse(text);
      console.log('Raw response:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      const data = JSON.parse(text);
      setProductos(data);
      setError(null);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test API</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Raw Response:</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {rawResponse}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Productos ({productos.length}):</h2>
        {productos.length > 0 ? (
          <ul className="space-y-2">
            {productos.map((producto) => (
              <li key={producto.id} className="bg-white border rounded p-3">
                <div><strong>ID:</strong> {producto.id}</div>
                <div><strong>Nombre:</strong> {producto.nombre}</div>
                <div><strong>Precio:</strong> {formatCOP(producto.precio)}</div>
                <div><strong>Stock:</strong> {producto.stock}</div>
                <div><strong>Categoría:</strong> {producto.categoria_nombre}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay productos</p>
        )}
      </div>
      
      <button 
        onClick={testAPI}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Recargar
      </button>
    </div>
  );
};

export default TestAPI;