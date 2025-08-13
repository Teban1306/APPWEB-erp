import { useState, useEffect } from 'react';
import { Download, Trash2, BarChart3, Calendar, Users, Package, TrendingUp, FileText, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { makeAuthenticatedRequest } from '../services/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from '../utils/formatters';

const InformesPage = () => {
  const [tipoInforme, setTipoInforme] = useState('fecha');
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [productoBusqueda, setProductoBusqueda] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Cargar datos desde la API
  useEffect(() => {
    cargarDatos();
    cargarUsuarioActual();
  }, []);

  const cargarUsuarioActual = async () => {
    try {
      const response = await makeAuthenticatedRequest('/usuarios/perfil/');
      if (response.ok) {
        const userData = await response.json();
        setUsuarioActual(userData);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar ventas
      const ventasResponse = await makeAuthenticatedRequest('/ventas/');
      if (ventasResponse.ok) {
        const ventasData = await ventasResponse.json();
        const ventasFormateadas = ventasData.map(venta => {
          // Formatear fecha de manera segura
          let fechaFormateada = 'Fecha no disponible';
          try {
            if (venta.fecha) {
              const fecha = new Date(venta.fecha);
              if (!isNaN(fecha.getTime())) {
                fechaFormateada = fecha.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
              }
            }
          } catch (error) {
            console.warn('Error formateando fecha:', venta.fecha, error);
          }
          
          return {
            id: venta.id,
            fecha: fechaFormateada,
            cliente: venta.cliente_nombre || 'Cliente no especificado',
            cliente_cedula: venta.cliente_cedula,
            total: parseFloat(venta.total),
            items: venta.items || []
          };
        });
        setVentas(ventasFormateadas);
      }
      
      // Cargar clientes
      const clientesResponse = await makeAuthenticatedRequest('/clientes/');
      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        setClientes(clientesData);
      }
      
      // Cargar productos
      const productosResponse = await makeAuthenticatedRequest('/productos/');
      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        setProductos(productosData);
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarVentas = () => {
    let ventasFiltradas = [];
    
    switch (tipoInforme) {
      case 'fecha':
        // Expandir items para filtro por fecha sin filtro por producto
        ventasFiltradas = [];
        ventas.forEach(venta => {
          // Verificar filtro de fecha
          let cumpleFiltroFecha = true;
          if (fechaInicio || fechaFin) {
            if (venta.fecha === 'Fecha no disponible') {
              cumpleFiltroFecha = false;
            } else {
              try {
                let fechaVenta;
                if (venta.fecha.includes('/')) {
                  const [dia, mes, año] = venta.fecha.split('/');
                  fechaVenta = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                } else {
                  fechaVenta = venta.fecha.split('T')[0];
                }
                const cumpleFechaInicio = !fechaInicio || fechaVenta >= fechaInicio;
                const cumpleFechaFin = !fechaFin || fechaVenta <= fechaFin;
                cumpleFiltroFecha = cumpleFechaInicio && cumpleFechaFin;
              } catch (error) {
                cumpleFiltroFecha = false;
              }
            }
          }
          
          if (cumpleFiltroFecha && venta.items && venta.items.length > 0) {
            venta.items.forEach(item => {
              const producto = productos.find(p => p.id === item.producto_id);
              
              const subtotal = item.cantidad * parseFloat(item.precio_unitario);
              const impuesto = subtotal * 0.19; // 19% IVA Colombia
              const totalConImpuesto = subtotal + impuesto;
              ventasFiltradas.push({
                id: venta.id,
                fecha: venta.fecha,
                cliente: venta.cliente,
                producto: item.producto_nombre || (producto ? producto.nombre : 'Producto no encontrado'),
                cantidad: item.cantidad,
                precio: parseFloat(item.precio_unitario),
                subtotal: subtotal,
                impuesto: impuesto,
                total: totalConImpuesto
              });
            });
          }
        });
        break;
        
      case 'cliente':
        // Expandir items para filtro por cliente sin filtro por producto
        ventasFiltradas = [];
        ventas.forEach(venta => {
          // Verificar filtro de cliente (por nombre o por ID/cédula)
          const cumpleFiltroCliente = !clienteBusqueda || 
            venta.cliente.toLowerCase().includes(clienteBusqueda.toLowerCase()) ||
            (venta.cliente_cedula && venta.cliente_cedula.toString().includes(clienteBusqueda));
          
          if (cumpleFiltroCliente && venta.items && venta.items.length > 0) {
            venta.items.forEach(item => {
              const producto = productos.find(p => p.id === item.producto_id);
              
              const subtotal = item.cantidad * parseFloat(item.precio_unitario);
              ventasFiltradas.push({
                id: venta.id,
                fecha: venta.fecha,
                cliente: venta.cliente,
                producto: item.producto_nombre || (producto ? producto.nombre : 'Producto no encontrado'),
                cantidad: item.cantidad,
                precio: parseFloat(item.precio_unitario),
                total: subtotal
              });
            });
          }
        });
        break;
        
      case 'producto':
        // Para productos, necesitamos expandir los items de cada venta
        ventasFiltradas = [];
        ventas.forEach(venta => {
          if (venta.items && venta.items.length > 0) {
            venta.items.forEach(item => {
              // Buscar el producto por ID
              const producto = productos.find(p => p.id === item.producto_id);
              
              // Si no hay búsqueda específica o el producto coincide con la búsqueda (solo por nombre)
              if (!productoBusqueda || 
                  (producto && producto.nombre.toLowerCase().includes(productoBusqueda.toLowerCase())) ||
                  (item.producto_nombre && item.producto_nombre.toLowerCase().includes(productoBusqueda.toLowerCase()))) {
                
                // Calcular el subtotal (cantidad * precio_unitario)
                const subtotal = item.cantidad * parseFloat(item.precio_unitario);
                const impuesto = subtotal * 0.19; // 19% IVA Colombia
                const totalConImpuesto = subtotal + impuesto;
                
                ventasFiltradas.push({
                  id: venta.id,
                  fecha: venta.fecha,
                  cliente: venta.cliente,
                  producto: item.producto_nombre || (producto ? producto.nombre : 'Producto no encontrado'),
                  cantidad: item.cantidad,
                  precio: parseFloat(item.precio_unitario),
                  subtotal: subtotal,
                  impuesto: impuesto,
                  total: totalConImpuesto
                });
              }
            });
          }
        });
        break;
      default:
        ventasFiltradas = ventas;
    }
    
    return ventasFiltradas;
  };

  const ventasFiltradas = filtrarVentas();

  const calcularTotales = () => {
    if (tipoInforme === 'producto') {
      // Para reporte por producto, contar número de items (no sumar cantidades)
      const montoTotal = ventasFiltradas.reduce((acc, item) => acc + (item.total || 0), 0);
      return {
        cantidadTotal: ventasFiltradas.length,
        montoTotal: montoTotal
      };
    } else {
      // Para reportes por fecha y cliente, contar ventas únicas
      const ventasUnicas = new Set(ventasFiltradas.map(item => item.id));
      const montoTotal = ventasFiltradas.reduce((acc, item) => acc + (item.total || 0), 0);
      return {
        cantidadTotal: ventasUnicas.size,
        montoTotal: montoTotal
      };
    }
  };

  const { cantidadTotal, montoTotal } = calcularTotales();

  const generarReporte = () => {
    cargarDatos(); // Recargar datos para asegurar que estén actualizados
  };

  const descargarPDF = () => {
    try {
      console.log('Iniciando generación de PDF...');
      const doc = new jsPDF();
      const { cantidadTotal, montoTotal } = calcularTotales();
      
      console.log('Datos calculados:', { cantidadTotal, montoTotal, ventasFiltradas: ventasFiltradas.length });
      
      // === ENCABEZADO PROFESIONAL ===
      // Fondo azul para el encabezado
      doc.setFillColor(37, 99, 235); // Azul profesional
      doc.rect(0, 0, 210, 35, 'F');
      
      // Título principal en blanco
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const titulo = `REPORTE DE VENTAS - ${tipoInforme.toUpperCase()}`;
      doc.text(titulo, 14, 20);
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestión Comercial', 14, 28);
      
      // === INFORMACIÓN DEL REPORTE ===
      doc.setTextColor(0, 0, 0); // Volver a negro
      let yPosition = 50;
      
      // Información del usuario que genera el reporte
      if (usuarioActual) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Generado por:', 14, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(`${usuarioActual.nombre} (${usuarioActual.email})`, 50, yPosition);
        yPosition += 7;
      }
      
      // Fecha de generación
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de generación:', 14, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), 65, yPosition);
      yPosition += 7;
      
      // Rango de fechas para reportes por fecha
      if (tipoInforme === 'fecha' && fechaInicio && fechaFin) {
        doc.setFont('helvetica', 'bold');
        doc.text('Período del reporte:', 14, yPosition);
        doc.setFont('helvetica', 'normal');
        const fechaInicioFormateada = new Date(fechaInicio).toLocaleDateString('es-ES');
        const fechaFinFormateada = new Date(fechaFin).toLocaleDateString('es-ES');
        doc.text(`${fechaInicioFormateada} - ${fechaFinFormateada}`, 65, yPosition);
        yPosition += 7;
      }
      
      // Tipo de reporte
      doc.setFont('helvetica', 'bold');
      doc.text('Tipo de reporte:', 14, yPosition);
      doc.setFont('helvetica', 'normal');
      const tipoTexto = tipoInforme === 'fecha' ? 'Por Fecha' : 
                       tipoInforme === 'cliente' ? 'Por Cliente' : 'Por Producto';
      doc.text(tipoTexto, 65, yPosition);
      yPosition += 10;
      
      // === RESUMEN EJECUTIVO ===
      // Fondo gris claro para el resumen
      doc.setFillColor(248, 250, 252);
      doc.rect(14, yPosition, 182, 25, 'F');
      
      // Borde del resumen
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, yPosition, 182, 25);
      
      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('RESUMEN EJECUTIVO', 20, yPosition);
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const tipoConteo = tipoInforme === 'producto' ? 'Total de Items' : 'Total de Ventas';
      doc.text(`${tipoConteo}: ${cantidadTotal}`, 20, yPosition);
      doc.text(`Monto Total: ${formatCOP(montoTotal)}`, 120, yPosition);
      
      yPosition += 20;
      
      // Verificar si hay datos para la tabla
      if (ventasFiltradas.length === 0) {
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(12);
        doc.text('No hay datos para mostrar en el período seleccionado', 14, yPosition);
        doc.save(`reporte_${tipoInforme}_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
      }
      
      // === TABLA DE DATOS ===
      doc.setTextColor(0, 0, 0);
      
      // Configurar las columnas de la tabla
      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Cliente', dataKey: 'cliente' },
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Cant.', dataKey: 'cantidad' },
        { header: 'Precio Unit.', dataKey: 'precio' },
        { header: 'Subtotal', dataKey: 'subtotal' },
        { header: 'IVA (19%)', dataKey: 'impuesto' },
        { header: 'Total', dataKey: 'total' }
      ];
      
      // Preparar los datos para la tabla
      const data = ventasFiltradas.map(item => ({
        id: item.id || '',
        fecha: item.fecha || '',
        cliente: item.cliente || '',
        producto: item.producto || '',
        cantidad: item.cantidad || 0,
        precio: formatCOP(item.precio),
        subtotal: formatCOP(item.subtotal),
        impuesto: formatCOP(item.impuesto),
        total: formatCOP(item.total)
      }));
      
      console.log('Datos preparados para la tabla:', data.slice(0, 2));
      
      // Generar la tabla con estilo profesional
      autoTable(doc, {
        columns: columns,
        body: data,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: [203, 213, 225],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [37, 99, 235], // Azul profesional
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Gris muy claro
        },
        columnStyles: {
          id: { cellWidth: 15 },
          fecha: { cellWidth: 22 },
          cliente: { cellWidth: 25 },
          producto: { cellWidth: 30 },
          cantidad: { cellWidth: 15, halign: 'center' },
          precio: { cellWidth: 20, halign: 'right' },
          subtotal: { cellWidth: 20, halign: 'right' },
          impuesto: { cellWidth: 18, halign: 'right' },
          total: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function (data) {
          // Pie de página
          const pageCount = doc.internal.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 10
          );
          
          doc.text(
            `Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema de Gestión Comercial`,
            pageSize.width - 14,
            pageHeight - 10,
            { align: 'right' }
          );
        }
      });
      
      console.log('PDF generado exitosamente');
      
      // Descargar el PDF con nombre más descriptivo
      const fechaArchivo = new Date().toISOString().split('T')[0];
      const nombreArchivo = tipoInforme === 'fecha' && fechaInicio && fechaFin 
        ? `reporte_${tipoInforme}_${fechaInicio}_${fechaFin}_${fechaArchivo}.pdf`
        : `reporte_${tipoInforme}_${fechaArchivo}.pdf`;
      
      doc.save(nombreArchivo);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, revisa la consola para más detalles.');
    }
  };

  const eliminarVenta = async (ventaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`/ventas/${ventaId}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Recargar los datos después de eliminar
        await cargarDatos();
        alert('Venta eliminada exitosamente');
      } else {
        // Obtener el mensaje de error específico del servidor
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        
        if (response.status === 403) {
          alert('No tienes permisos para eliminar ventas. Solo los administradores y staff pueden realizar esta acción.');
        } else {
          alert(`Error al eliminar la venta: ${errorMessage}`);
        }
        
        console.error('Error response:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      alert('Error de conexión al eliminar la venta. Por favor, verifica tu conexión e inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
      {/* Encabezado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                Informes
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Gestiona y genera reportes de ventas detallados
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navbar de pestañas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <nav className="flex flex-col sm:flex-row gap-2">
            {[
              { key: 'fecha', label: 'Por Fecha', icon: Calendar },
              { key: 'cliente', label: 'Por Cliente', icon: Users },
              { key: 'producto', label: 'Por Producto', icon: Package }
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTipoInforme(key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  tipoInforme === key 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-300 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm sm:text-base">{label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Filtros según el tipo de informe */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Filtros de Búsqueda</h3>
          </div>

          <AnimatePresence mode="wait">
            {tipoInforme === 'fecha' && (
              <motion.div 
                key="fecha"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-gray-300 bg-white text-gray-500 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-400 transition-all duration-200 placeholder-gray-500"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-gray-300 bg-white text-gray-500 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-400 transition-all duration-200 placeholder-gray-500"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generarReporte}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FileText className="h-5 w-5" />
                  Generar reporte
                </motion.button>
              </motion.div>
            )}

            {tipoInforme === 'cliente' && (
              <motion.div 
                key="cliente"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Search className="h-4 w-4" />
                    Buscar cliente
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full sm:w-3/4 rounded-xl border border-gray-300 px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={clienteBusqueda}
                      onChange={(e) => setClienteBusqueda(e.target.value)}
                      placeholder="Nombre del cliente o cédula/ID"
                    />
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generarReporte}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FileText className="h-5 w-5" />
                  Generar reporte
                </motion.button>
              </motion.div>
            )}

            {tipoInforme === 'producto' && (
              <motion.div 
                key="producto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Search className="h-4 w-4" />
                    Buscar producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full sm:w-3/4 rounded-xl border border-gray-300 px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={productoBusqueda}
                      onChange={(e) => setProductoBusqueda(e.target.value)}
                      placeholder="Nombre del producto"
                    />
                    <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generarReporte}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <FileText className="h-5 w-5" />
                  Generar reporte
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Resumen de totales */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-blue-900">
              {tipoInforme === 'producto' ? 'Número de Items' : 'Número de Ventas'}
            </h4>
          </div>
          <p className="text-3xl font-bold text-blue-600">{cantidadTotal}</p>
          <p className="text-xs text-blue-700 mt-1">
            {tipoInforme === 'producto' ? 'Items encontrados' : 'Ventas registradas'}
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-green-900">Monto Total</h4>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCOP(montoTotal)}</p>
          <p className="text-xs text-green-700 mt-1">Valor acumulado</p>
        </motion.div>
      </motion.div>

      {/* Vista previa del reporte */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-600 rounded-xl">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Vista Previa del Reporte</h3>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-500 text-lg">Cargando datos...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      ID Venta
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Fecha
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Cliente
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Producto
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Cantidad
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Precio
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Subtotal
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      IVA
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                      Total
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {ventasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500 text-lg">
                          No se encontraron resultados
                        </td>
                      </tr>
                    ) : (
                      ventasFiltradas.map((item, index) => (
                        <motion.tr 
                          key={item.id || `venta-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              #{item.id}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {item.fecha}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              {item.cliente}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              {item.producto}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              {item.cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCOP(item.precio)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCOP(item.subtotal)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                            {formatCOP(item.impuesto)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCOP(item.total)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => eliminarVenta(item.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                              title="Eliminar venta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Botón Descargar PDF */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={descargarPDF}
          disabled={ventasFiltradas.length === 0 || loading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
        >
          <div className="p-1 bg-white/20 rounded-lg">
            <Download className="h-5 w-5" />
          </div>
          <span className="text-lg">Descargar PDF ({ventasFiltradas.length} registros)</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default InformesPage;