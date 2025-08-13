import { useState, useEffect } from 'react';
import ProductoModal from './ProductoModal';
import { Search, MoreVertical, AlertTriangle } from 'lucide-react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { useProductosCache } from '../hooks/useCache';
import { makeAuthenticatedRequest } from '../services/auth';
import RefreshButton, { CacheStatus } from './RefreshButton';

const categorias = [
  'Todas',
  'Electrónica',
  'Ropa',
  'Alimentos',
  'Hogar',
  'Deportes',
  'Juguetes',
  'Libros',
  'Mascotas',
  'Salud',
  'Belleza'
];

const ProductosTableContainer = () => {
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [mostrarStockBajo, setMostrarStockBajo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

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

  const filteredProductos = (productos || []).filter(producto => {
    const matchSearch = Object.values(producto).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchCategoria = categoriaSeleccionada === 'Todas' || 
                          producto.categoria?.nombre === categoriaSeleccionada;
    const matchPrecioMin = !precioMin || producto.precio >= Number(precioMin);
    const matchPrecioMax = !precioMax || producto.precio <= Number(precioMax);
    const matchStockBajo = !mostrarStockBajo || producto.stock < 50;

    return matchSearch && matchCategoria && matchPrecioMin && matchPrecioMax && matchStockBajo;
  });

  // Mostrar error solo si no hay datos en cache
  if (error && !productos) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">Error: {error}</div>
        <button 
          onClick={refresh}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const handleModalClose = (productoActualizado) => {
    setModalAbierto(false);
    setProductoSeleccionado(null);
    
    if (productoActualizado) {
      if (productoSeleccionado) {
        // Actualización
        updateItem(productoActualizado);
      } else {
        // Nuevo producto
        addItem(productoActualizado);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con información del cache y botón de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Lista de Productos</h2>
          <CacheStatus 
            isFromCache={isFromCache}
            lastFetch={lastFetch}
            cacheInfo={cacheInfo}
            className="mt-1"
          />
        </div>
        <RefreshButton
          onRefresh={refresh}
          loading={loading}
          lastUpdate={lastFetch}
          variant="outline"
          size="sm"
        />
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <select
          className="border rounded-lg px-4 py-2"
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        >
          {categorias.map((cat, index) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Precio mínimo"
          className="border rounded-lg px-4 py-2 w-32"
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
        />

        <input
          type="number"
          placeholder="Precio máximo"
          className="border rounded-lg px-4 py-2 w-32"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={mostrarStockBajo}
            onChange={(e) => setMostrarStockBajo(e.target.checked)}
            className="rounded"
          />
          <span>Mostrar stock bajo</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-48">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProductos.map((producto) => (
              <tr key={producto.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{producto.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {producto.imagen_url && (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="h-10 w-10 rounded-full mr-3"
                      />
                    )}
                    <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 max-w-48">
                  <div className="truncate" title={producto.descripcion}>{producto.descripcion || 'Sin descripción'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {producto.categoria?.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {producto.stock < 50 && (
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                    )}
                    <span className="text-sm text-gray-900">{producto.stock}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCOP(producto.precio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setModalAbierto(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setModalAbierto(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductoModal
        isOpen={modalAbierto}
        onClose={handleModalClose}
        producto={productoSeleccionado}
      />
    </div>
  );
};

const ProductosTable = ({ productos, onEdit, onDelete, loading }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedProductos = [...(productos || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('nombre')}
            >
              Nombre {getSortIndicator('nombre')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('descripcion')}
            >
              Descripción {getSortIndicator('descripcion')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('precio')}
            >
              Precio {getSortIndicator('precio')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('stock')}
            >
              Stock {getSortIndicator('stock')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Imagen
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('categoria')}
            >
              Categoría {getSortIndicator('categoria')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center">
                Cargando productos...
              </td>
            </tr>
          ) : sortedProductos.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center">
                No hay productos disponibles
              </td>
            </tr>
          ) : (
            sortedProductos.map((producto) => (
              <tr key={producto.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {producto.nombre}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {producto.descripcion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCOP(producto.precio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${producto.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                  >
                    {producto.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    'Sin imagen'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {producto.categoria?.nombre || 'Sin categoría'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(producto)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(producto)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(producto)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductosTable;
export { ProductosTableContainer };