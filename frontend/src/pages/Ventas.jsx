import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, User, Package, CreditCard, CheckCircle, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { formatCOP } from '../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función para obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Función para hacer peticiones autenticadas
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  console.log('Token obtenido:', token ? 'Token presente' : 'Sin token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  console.log('Haciendo petición a:', url);
  console.log('Headers:', headers);

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  console.log('Respuesta recibida:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response body:', errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const jsonData = await response.json();
  console.log('JSON parseado:', jsonData);
  return jsonData;
};

const VentasPage = () => {
  const [carrito, setCarrito] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [cedula, setCedula] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [cantidadesProductos, setCantidadesProductos] = useState({});

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
  }, []);

  const fetchProductos = async () => {
    try {
      console.log('Intentando cargar productos desde:', `${API_BASE_URL}/productos/`);
      const data = await fetchWithAuth(`${API_BASE_URL}/productos/`);
      console.log('Datos recibidos:', data);
      setProductos(data || []);
      setError(null);
    } catch (error) {
      console.error('Error detallado fetching productos:', error);
      setError(`Error al cargar productos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/categorias/`);
      setCategorias(['Todas', ...data.map(cat => cat.nombre)]);
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  const filteredProductos = productos.filter(producto => {
    const matchSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaSeleccionada === 'Todas' || 
                          (producto.categoria_nombre && producto.categoria_nombre === categoriaSeleccionada);
    const hasStock = producto.stock >= 1;
    return matchSearch && matchCategoria && hasStock;
  });

  const buscarCliente = async (cedulaBuscar) => {
    if (!cedulaBuscar.trim()) {
      setClienteSeleccionado(null);
      return;
    }

    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/clientes/${cedulaBuscar}/`);
      setClienteSeleccionado(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching cliente:', error);
      setClienteSeleccionado(null);
      setError('Cliente no encontrado');
    }
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    const existeEnCarrito = carrito.find(item => item.id === producto.id);
    
    if (existeEnCarrito) {
      // Si ya existe, verificar que no exceda el stock
      const nuevaCantidad = existeEnCarrito.cantidad + cantidad;
      if (nuevaCantidad > producto.stock) {
        setError(`No puedes agregar más de ${producto.stock} unidades de ${producto.nombre}. Ya tienes ${existeEnCarrito.cantidad} en el carrito.`);
        return;
      }
      actualizarCantidad(producto.id, nuevaCantidad);
    } else {
      // Si no existe, verificar que la cantidad no exceda el stock
      if (cantidad > producto.stock) {
        setError(`No puedes agregar ${cantidad} unidades de ${producto.nombre}. Solo hay ${producto.stock} disponibles.`);
        return;
      }
      setCarrito([...carrito, { ...producto, cantidad: cantidad }]);
    }
    // Limpiar error si la operación fue exitosa
    setError(null);
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    // Encontrar el producto en el carrito para verificar el stock
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito && nuevaCantidad > itemEnCarrito.stock) {
      setError(`No puedes agregar más de ${itemEnCarrito.stock} unidades de ${itemEnCarrito.nombre}.`);
      return;
    }

    setCarrito(carrito.map(item => {
      if (item.id === id) {
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
    
    // Limpiar error si la operación fue exitosa
    setError(null);
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const calcularTotal = () => {
    const subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    const impuesto = subtotal * 0.19; // 19% de impuesto (IVA Colombia)
    const total = subtotal + impuesto;
    return { subtotal, impuesto, total };
  };

  const procesarVenta = async () => {
    if (!clienteSeleccionado) {
      setError('Por favor, selecciona un cliente');
      return;
    }
    if (carrito.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setProcesandoVenta(true);
    setError(null);

    try {
      const totales = calcularTotal();
      
      const ventaData = {
        cliente: clienteSeleccionado.cedula,
        subtotal: totales.subtotal.toFixed(2),
        impuesto: totales.impuesto.toFixed(2),
        total: totales.total.toFixed(2),
        items: carrito.map(item => ({
          producto: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        }))
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/ventas/`, {
        method: 'POST',
        body: JSON.stringify(ventaData)
      });

      // Limpiar el carrito y cliente después de una venta exitosa
      setCarrito([]);
      setClienteSeleccionado(null);
      setCedula('');
      
      alert(`Venta procesada exitosamente. ID: ${response.id}`);
      
      // Actualizar la lista de productos para reflejar el nuevo stock
      fetchProductos();
      
    } catch (error) {
      console.error('Error procesando venta:', error);
      setError('Error al procesar la venta: ' + error.message);
    } finally {
      setProcesandoVenta(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center h-64"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <div className="text-lg text-gray-600">Cargando productos...</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Nueva Venta
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Gestiona tus ventas de manera rápida y eficiente</p>
        </motion.div>
      
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-4 sm:mb-6 rounded-xl bg-red-50 p-4 border border-red-200 shadow-sm"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                <p className="text-sm sm:text-base text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      
      <div className="space-y-6">
        {/* Sección de Cliente */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl">
              <User className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900"  >Cliente</h3>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Ingresar cédula del cliente"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-gray-50 focus:bg-white"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                onBlur={() => buscarCliente(cedula)}
              />
            </div>
            
            <AnimatePresence>
              {clienteSeleccionado && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-semibold text-blue-900">{clienteSeleccionado.nombre}</p>
                      <p className="text-xs sm:text-sm text-blue-700 mt-1">{clienteSeleccionado.email}</p>
                      <p className="text-xs text-blue-600 mt-1">Cédula: {clienteSeleccionado.cedula}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sección de Productos */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Productos</h3>
            <div className="ml-auto bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-gray-600">{filteredProductos.length} disponibles</span>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full rounded-xl border border-gray-300 pl-12 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white"
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            >
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>

          {/* Lista de Productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredProductos.map((producto, index) => (
                <motion.div 
                  key={producto.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:shadow-xl transition-all duration-300 flex flex-col h-full group overflow-hidden relative"
                >
                  {/* Badge de stock bajo */}
                  {producto.stock <= 5 && producto.stock > 0 && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        ¡Últimos!
                      </div>
                    </div>
                  )}
                  
                  {/* Imagen del producto */}
                  <div className="relative w-full h-40 sm:h-48 mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                    {producto.imagen_url ? (
                      <motion.img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-gray-400"
                      style={{ display: producto.imagen_url ? 'none' : 'flex' }}
                    >
                      <Package className="w-12 h-12" />
                    </div>
                    
                    {/* Overlay con gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Información del producto */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 transition-colors">
                        {producto.nombre}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                        {producto.descripcion}
                      </p>
                    </div>
                    
                    {/* Información adicional */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          producto.stock > 10 ? 'bg-green-500' : 
                          producto.stock > 5 ? 'bg-yellow-500' : 
                          producto.stock > 0 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <span className="text-gray-600 font-medium">{producto.stock} disponibles</span>
                      </div>
                      {producto.categoria_nombre && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          {producto.categoria_nombre}
                        </span>
                      )}
                    </div>
                    
                    {/* Precio */}
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCOP(producto.precio)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Controles de cantidad y agregar */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-50 rounded-xl p-1">
                        <button
                          onClick={() => {
                            const currentQty = cantidadesProductos[producto.id] || 1;
                            if (currentQty > 1) {
                              setCantidadesProductos({
                                ...cantidadesProductos,
                                [producto.id]: currentQty - 1
                              });
                            }
                          }}
                          className="p-1 hover:bg-white rounded-lg transition-colors"
                          disabled={producto.stock <= 0 || (cantidadesProductos[producto.id] || 1) <= 1}
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={producto.stock}
                          value={cantidadesProductos[producto.id] || 1}
                          onChange={(e) => setCantidadesProductos({
                            ...cantidadesProductos,
                            [producto.id]: Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1))
                          })}
                          className="w-12 text-center text-sm bg-transparent border-none focus:outline-none font-medium"
                          disabled={producto.stock <= 0}
                        />
                        <button
                          onClick={() => {
                            const currentQty = cantidadesProductos[producto.id] || 1;
                            if (currentQty < producto.stock) {
                              setCantidadesProductos({
                                ...cantidadesProductos,
                                [producto.id]: currentQty + 1
                              });
                            }
                          }}
                          className="p-1 hover:bg-white rounded-lg transition-colors"
                          disabled={producto.stock <= 0 || (cantidadesProductos[producto.id] || 1) >= producto.stock}
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const cantidad = cantidadesProductos[producto.id] || 1;
                          agregarAlCarrito(producto, cantidad);
                          setCantidadesProductos({
                            ...cantidadesProductos,
                            [producto.id]: 1
                          });
                        }}
                        disabled={producto.stock <= 0}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                          producto.stock <= 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-600 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {producto.stock <= 0 ? (
                          <span className="flex items-center justify-center gap-2">
                            <X className="h-4 w-4" />
                            Sin stock
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Agregar
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Estado vacío */}
          {filteredProductos.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
            </motion.div>
          )}
        </motion.div>
        </div>

        {/* Carrito */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-xl">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Carrito de Compras</h3>
            {carrito.length > 0 && (
              <div className="ml-auto bg-orange-100 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-orange-600">{carrito.length} productos</span>
              </div>
            )}
          </div>
          
          {carrito.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center bg-gray-50"
            >
              <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">El carrito está vacío</h4>
              <p className="text-sm text-gray-600">Agrega productos para comenzar una venta</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Lista de productos en el carrito */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {carrito.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.nombre}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                            <p className="text-sm text-gray-600">{formatCOP(item.precio)} c/u</p>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                item.stock > 10 ? 'bg-green-500' : 
                                item.stock > 5 ? 'bg-yellow-500' : 'bg-orange-500'
                              }`} />
                              <span className="text-xs text-gray-500">{item.stock} disponibles</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </motion.button>
                            <input
                              type="number"
                              min="1"
                              max={item.stock}
                              value={item.cantidad}
                              onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center text-sm bg-transparent border-none focus:outline-none font-medium"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                              disabled={item.cantidad >= item.stock}
                              className={`p-2 rounded-lg transition-colors ${
                                item.cantidad >= item.stock
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'hover:bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </motion.button>
                          </div>
                          
                          {/* Precio total del item */}
                          <div className="text-right min-w-0">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">
                              {formatCOP(parseFloat(item.precio) * item.cantidad)}
                            </p>
                          </div>
                          
                          {/* Botón eliminar */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => eliminarDelCarrito(item.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Totales */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCOP(calcularTotal().subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Impuesto (19%):</span>
                    <span className="font-medium">{formatCOP(calcularTotal().impuesto)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-lg sm:text-xl font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCOP(calcularTotal().total)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Botón procesar venta */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={procesarVenta}
                disabled={procesandoVenta || !clienteSeleccionado}
                className={`w-full rounded-xl px-6 py-4 font-semibold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                  procesandoVenta || !clienteSeleccionado
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-lg hover:shadow-xl'
                }`}
              >
                {procesandoVenta ? (
                  <span className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Procesando venta...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    Procesar Venta
                  </span>
                )}
              </motion.button>
              
              {!clienteSeleccionado && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-700">Selecciona un cliente para procesar la venta</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

      </div>
          </div>
          
  )
}

export default VentasPage;