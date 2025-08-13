import { Link, useLocation } from 'react-router-dom';
import { Users, ShoppingCart, FileText, BarChart2, UserCircle, LogOut, ChevronRight } from 'lucide-react';
import { logout } from '../services/auth';
import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../services/auth';
import { motion } from 'framer-motion';

const Sidebar = ({ isMobile = false, onItemClick = () => {} }) => {
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest('/usuarios/perfil/', { method: 'GET' });
        const userData = await response.json();
        setUserRole(userData.rol);
        setUserInfo(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  const allMenuItems = [
    { 
      name: 'Clientes', 
      icon: Users, 
      path: '/clientes',
      description: 'Gestionar clientes'
    },
    { 
      name: 'Productos', 
      icon: ShoppingCart, 
      path: '/productos',
      description: 'Inventario y catálogo'
    },
    { 
      name: 'Ventas', 
      icon: FileText, 
      path: '/ventas',
      description: 'Procesar ventas'
    },
    { 
      name: 'Informes', 
      icon: BarChart2, 
      path: '/informes', 
      adminOnly: true,
      description: 'Reportes y estadísticas'
    },
    { 
      name: 'Usuarios', 
      icon: UserCircle, 
      path: '/usuarios',
      description: 'Administrar usuarios'
    },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly && userRole === 'Usuario') {
      return false;
    }
    return true;
  });

  const handleLogout = () => {
    logout();
  };

  const handleItemClick = (path) => {
    onItemClick();
  };

  // Variantes de animación para los elementos del menú
  const menuVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: 'easeOut'
      }
    })
  };

  const sidebarContent = (
    <div className={`flex h-full flex-col overflow-y-auto scrollbar-hide ${
      isMobile ? '' : 'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200'
    }`}>
      {/* Header - Solo mostrar en desktop */}
      {!isMobile && (
        <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold text-white"
          >
            VentasApp
          </motion.h1>
        </div>
      )}

      {/* Información del usuario */}
      {userInfo && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="p-4 border-b border-gray-200 bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {userInfo.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userInfo.nombre || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userInfo.rol || 'Sin rol'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.name}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={menuVariants}
            >
              <Link
                to={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`
                  group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <div className="flex items-center">
                  <item.icon className={`h-5 w-5 mr-3 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {isMobile && (
                      <div className={`text-xs ${
                        isActive ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
                {!isMobile && (
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    isActive ? 'text-white rotate-90' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer con logout */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="border-t border-gray-200 p-4"
      >
        <button
          onClick={handleLogout}
          className="
            flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium 
            text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            group
          "
        >
          <div className="flex items-center">
            <LogOut className="h-5 w-5 mr-3 transition-colors" />
            <span>Cerrar Sesión</span>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </div>
  );

  return isMobile ? sidebarContent : (
    <aside className="hidden lg:block">
      {sidebarContent}
    </aside>
  );
};

export default Sidebar;