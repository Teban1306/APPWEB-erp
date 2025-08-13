import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../supabase';
import ProductosTable from './ProductosTable';
import ProductoModal from './ProductoModal';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);


  useEffect(() => {
    fetchProductos();
  }, []);



  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categoria:categorias(id, nombre)
        `)
        .order('nombre');

      if (error) throw error;

      setProductos(data || []);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const handleDelete = async (producto) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', producto.id);

      if (error) throw error;

      setProductos(productos.filter(p => p.id !== producto.id));
    } catch (error) {
      console.error('Error deleting producto:', error);
      setError('Error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProducto(null);
    fetchProductos(); // Recargar la lista de productos después de cerrar el modal
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Producto
        </button>
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
      />

      <ProductoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        producto={selectedProducto}
      />
    </div>
  );
};

export default Productos;