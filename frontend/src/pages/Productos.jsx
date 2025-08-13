import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ProductoModal from '../components/ProductoModal';
import ProductosTable from '../components/ProductosTable';
import { supabase } from '../supabase';
import { makeAuthenticatedRequest } from '../services/auth';
import { useProductosCache } from '../hooks/useCache';
import RefreshButton from '../components/RefreshButton';
import { CacheStatus } from '../components/RefreshButton';

const Productos = () => {
  const {
    data: productos,
    loading,
    error,
    refresh,
    updateItem,
    removeItem,
    addItem,
    isFromCache,
    lastFetch,
    cacheInfo
  } = useProductosCache();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await makeAuthenticatedRequest('/usuarios/perfil/', { method: 'GET' });
      const userData = await response.json();
      setUserRole(userData.rol);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // La función fetchProductos ya no es necesaria, se maneja con el hook useProductosCache

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const response = await makeAuthenticatedRequest(`/productos/${id}/`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Actualizar caché eliminando el producto
          removeItem(id);
          alert('Producto eliminado exitosamente');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Error al eliminar el producto');
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert(error.message);
      }
    }
  };

  const handleModalClose = (productoActualizado) => {
    setIsModalOpen(false);
    setSelectedProducto(null);
    
    if (productoActualizado) {
      if (selectedProducto) {
        // Actualización
        updateItem(productoActualizado);
      } else {
        // Nuevo producto
        addItem(productoActualizado);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={refresh} loading={loading} />
            {userRole && userRole !== 'Usuario' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Plus className="h-5 w-5" />
                Nuevo Producto
              </button>
            )}
          </div>
        </div>
        <CacheStatus 
          isFromCache={isFromCache}
          lastFetch={lastFetch}
          cacheInfo={cacheInfo}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductosTable
        productos={productos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        userRole={userRole}
      />

      <ProductoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        producto={selectedProducto}
        readOnly={userRole === 'Usuario'}
      />
    </div>
  );
};

export default Productos;