Sistema de Gestión Comercial
VERSIÓN 2.0.0 - CLOUDINARY & ANIMATIONS UPDATE
DOCUMENTACIÓN DE LA VERSIÓN:
	•	VERSION.md - Información detallada de la versión actual
	•	CHANGELOG.md - Registro completo de cambios y mejoras
	•	Frontend README - Documentación específica del frontend

VERSIÓN 2.0.0 - NUEVAS CARACTERÍSTICAS
NOVEDADES DE ESTA VERSIÓN:
	•	Gestión de imágenes con Cloudinary - Subida y almacenamiento de imágenes de productos
	•	Animaciones mejoradas - Interfaz más fluida con Framer Motion
	•	Sistema de roles avanzado - Control granular de permisos por usuario
	•	Interfaz optimizada - Mejor experiencia de usuario y diseño responsivo
	•	Validaciones mejoradas - Mayor seguridad en formularios y datos
	•	Rendimiento optimizado - Carga más rápida y eficiente

Un proyecto full stack moderno que combina Django como backend y React con Vite como frontend.
Tecnologías Utilizadas
Backend
	•	Django 5.2.4 - Framework web de Python
	•	Django REST Framework - API REST framework
	•	Simple JWT - Autenticación basada en tokens JWT
	•	SQLite - Base de datos (por defecto)
	•	Python - Lenguaje de programación
	•	Pillow - Procesamiento de imágenes
	•	Django Filter - Filtrado avanzado de datos
	•	Django Extensions - Utilidades de desarrollo
Frontend
	•	React 19.1.0 - Biblioteca de JavaScript para interfaces de usuario
	•	Vite 7.0.0 - Herramienta de construcción y desarrollo
	•	React Router DOM 7.6.3 - Enrutamiento para aplicaciones React
	•	Tailwind CSS 3.4.1 - Framework de CSS utilitario
	•	Headless UI 2.2.4 - Componentes de UI accesibles
	•	Lucide React 0.525.0 - Iconos SVG para React
	•	Axios 1.6.7 - Cliente HTTP para peticiones API
	•	Framer Motion 12.23.0 - Biblioteca de animaciones
	•	ESLint - Linter para JavaScript/React
	•	Cloudinary React - Gestión de imágenes en la nube
	•	Cloudinary URL-Gen - Generación de URLs optimizadas
	•	SHA.js - Funciones de hash criptográficas
	•	Supabase - Backend como servicio
Herramientas de Desarrollo
	•	pnpm - Gestor de paquetes para el frontend
	•	pip - Gestor de paquetes para Python
	•	Git - Control de versiones
Estructura del Proyecto
APP WEB/
├── backend/                 # Aplicación Django
│   ├── BackWeb/            # Configuración principal del proyecto
│   │   ├── settings.py     # Configuraciones de Django
│   │   ├── urls.py         # URLs principales
│   │   ├── wsgi.py         # Configuración WSGI
│   │   └── asgi.py         # Configuración ASGI
│   ├── mi_app/             # Aplicación Django personalizada
│   │   ├── models.py       # Modelos de datos (Usuario, Cliente, Producto, Categoria, Venta, VentaItem, Carrito)
│   │   ├── views.py        # Vistas y endpoints de API
│   │   ├── serializers.py  # Serializadores para la API
│   │   ├── urls.py         # URLs de la API
│   │   ├── admin.py        # Configuración del admin
│   │   └── apps.py         # Configuración de la app
│   ├── manage.py           # Utilidad de línea de comandos de Django
│   └── db.sqlite3          # Base de datos SQLite
└── frontend/               # Aplicación React
    ├── src/                # Código fuente
    │   ├── App.jsx         # Componente principal con rutas
    │   ├── main.jsx        # Punto de entrada
    │   ├── components/     # Componentes reutilizables
    │   │   ├── Auth.jsx    # Componente de autenticación
    │   │   ├── Sidebar.jsx # Navegación lateral
    │   │   ├── ClientesTable.jsx # Tabla de clientes
    │   │   ├── ProductosTable.jsx # Tabla de productos
    │   │   └── ProductoModal.jsx  # Modal para productos
    │   ├── pages/          # Páginas de la aplicación
    │   │   ├── Clientes.jsx # Gestión de clientes
    │   │   ├── Productos.jsx # Gestión de productos
    │   │   ├── Ventas.jsx  # Sistema de ventas y carrito
    │   │   ├── Informes.jsx # Reportes y estadísticas
    │   │   ├── Usuarios.jsx # Gestión de usuarios
    │   │   └── TestAPI.jsx # Pruebas de API
    │   ├── services/       # Servicios y utilidades
    │   │   └── auth.js     # Servicio de autenticación
    │   ├── App.css         # Estilos del componente principal
    │   └── index.css       # Estilos globales
    ├── public/             # Archivos públicos
    ├── package.json        # Dependencias y scripts de npm
    ├── vite.config.js      # Configuración de Vite
    └── eslint.config.js    # Configuración de ESLint
Instalación y Configuración
Prerrequisitos
	•	Python 3.8+ instalado en tu sistema
	•	Node.js 16+ y pnpm instalados
	•	Git para clonar el repositorio
1. Clonar el Repositorio
git clone 
cd "APP WEB"
2. Configuración del Backend (Django)
Crear un entorno virtual
cd backend
python -m venv venv

# En Windows
venv\Scripts\activate

# En macOS/Linux
source venv/bin/activate
Instalar dependencias
pip install -r requirements.txt
Configurar la base de datos
python manage.py makemigrations
python manage.py migrate
Crear un superusuario (opcional)
python manage.py createsuperuser
3. Configuración del Frontend (React)
cd ../frontend
pnpm install
Ejecución del Proyecto
Ejecutar el Backend
cd backend
# Activar el entorno virtual si no está activado
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

python manage.py runserver
El backend estará disponible en: http://localhost:8000
Ejecutar el Frontend
En una nueva terminal:
cd frontend
pnpm run dev
El frontend estará disponible en: http://localhost:5173
Scripts Disponibles
Backend (Django)
	•	python manage.py runserver - Ejecutar el servidor de desarrollo
	•	python manage.py makemigrations - Crear migraciones
	•	python manage.py migrate - Aplicar migraciones
	•	python manage.py createsuperuser - Crear superusuario
	•	python manage.py collectstatic - Recopilar archivos estáticos
Frontend (React)
	•	pnpm run dev - Ejecutar servidor de desarrollo
	•	pnpm run build - Construir para producción
	•	pnpm run preview - Previsualizar build de producción
	•	pnpm run lint - Ejecutar linter
Autenticación
El proyecto utiliza autenticación basada en JWT (JSON Web Tokens):
Endpoints de Autenticación
	•	Registro: POST /api/auth/registro/ {
	•	  "email": "usuario@ejemplo.com",
	•	  "username": "usuario",
	•	  "password": "contraseña",
	•	  "nombre": "Nombre Completo"
	•	}
	•	
	•	Login: POST /api/auth/login/ {
	•	  "email": "usuario@ejemplo.com",
	•	  "password": "contraseña"
	•	}
	•	
	•	Refrescar Token: POST /api/auth/refresh/ {
	•	  "refresh": "token-de-refresco"
	•	}
	•	
Endpoints de API
Gestión de Usuarios
	•	GET /api/usuarios/ - Listar usuarios
	•	POST /api/auth/registro/ - Registrar nuevo usuario
	•	GET /api/usuarios/perfil/ - Obtener perfil del usuario actual
	•	PUT /api/usuarios// - Actualizar usuario
	•	DELETE /api/usuarios// - Eliminar usuario
Gestión de Clientes
	•	GET /api/clientes/ - Listar clientes
	•	POST /api/clientes/ - Crear cliente
	•	GET /api/clientes// - Obtener cliente específico
	•	PUT /api/clientes// - Actualizar cliente
	•	DELETE /api/clientes// - Eliminar cliente
Gestión de Productos
	•	GET /api/productos/ - Listar productos (con filtro por categoría)
	•	POST /api/productos/ - Crear producto
	•	GET /api/productos// - Obtener producto específico
	•	PUT /api/productos// - Actualizar producto
	•	DELETE /api/productos// - Eliminar producto
Gestión de Categorías
	•	GET /api/categorias/ - Listar categorías
	•	POST /api/categorias/ - Crear categoría
	•	PUT /api/categorias// - Actualizar categoría
	•	DELETE /api/categorias// - Eliminar categoría
Sistema de Ventas
	•	GET /api/ventas/ - Listar ventas
	•	POST /api/ventas/ - Crear venta directa
	•	POST /api/ventas/procesar_desde_carrito/ - Procesar venta desde carrito
	•	GET /api/ventas// - Obtener venta específica
Carrito de Compras
	•	GET /api/carrito/ - Obtener items del carrito
	•	POST /api/carrito/ - Agregar producto al carrito
	•	PUT /api/carrito// - Actualizar cantidad en carrito
	•	DELETE /api/carrito// - Eliminar item del carrito
Manejo de Tokens en el Frontend
Los tokens JWT se almacenan en el localStorage:
	•	access_token: Token de acceso para autenticación
	•	refresh_token: Token para renovar el acceso
Funcionalidades del Sistema
Gestión de Usuarios
	•	Registro y autenticación de usuarios
	•	Roles de usuario (admin, empleado)
	•	Gestión de perfiles de usuario
	•	Control de acceso basado en roles
Gestión de Clientes
	•	CRUD completo de clientes
	•	Campos: nombre, email, cédula, teléfono, ciudad
	•	Búsqueda y filtrado de clientes
	•	Validación de datos de entrada
Gestión de Productos
	•	CRUD completo de productos
	•	Campos: nombre, descripción, precio, stock, categoría, imagen
	•	Categorización de productos
	•	Control de inventario con validación de stock
	•	Gestión avanzada de imágenes con Cloudinary
	◦	Subida directa de imágenes
	◦	Optimización automática de imágenes
	◦	URLs seguras y optimizadas
	◦	Validación de tipos y tamaños de archivo
	•	Filtrado por categoría y búsqueda por nombre
	•	Interfaz mejorada con animaciones fluidas
Sistema de Ventas
	•	Carrito de compras inteligente
	◦	Validación automática de stock disponible
	◦	Prevención de sobreventa
	◦	Actualización en tiempo real de cantidades
	•	Procesamiento de ventas
	◦	Selección de cliente obligatoria
	◦	Cálculo automático de totales
	◦	Reducción automática de stock al procesar venta
	◦	Historial de ventas
	•	Interfaz de ventas optimizada
	◦	Búsqueda de productos en tiempo real
	◦	Filtrado por categorías
	◦	Visualización de imágenes de productos
	◦	Solo muestra productos con stock disponible
	◦	Botones de agregar alineados uniformemente
Gestión de Categorías
	•	Creación y gestión de categorías de productos
	•	Asignación de productos a categorías
	•	Filtrado de productos por categoría
Características Técnicas
	•	Validación de stock: Previene agregar más productos de los disponibles
	•	Transacciones atómicas: Garantiza consistencia en las ventas
	•	Interfaz responsiva: Diseño adaptable con Tailwind CSS
	•	Manejo de errores: Mensajes informativos para el usuario
	•	Optimización de rendimiento: Carga eficiente de datos
NUEVAS CARACTERÍSTICAS TÉCNICAS - V2.0.0
	•	Integración con Cloudinary:
	◦	Subida segura de imágenes
	◦	Transformaciones automáticas
	◦	CDN global para carga rápida
	◦	Validación de archivos del lado cliente y servidor
	•	Animaciones con Framer Motion:
	◦	Transiciones suaves entre páginas
	◦	Efectos de entrada y salida
	◦	Animaciones de carga y estados
	•	Sistema de roles mejorado:
	◦	Control granular de permisos
	◦	Validación de acceso por componente
	◦	Diferentes niveles de usuario
	•	Validaciones avanzadas:
	◦	Validación de tipos de archivo
	◦	Límites de tamaño de imagen
	◦	Sanitización de datos de entrada
	•	Optimizaciones de rendimiento:
	◦	Lazy loading de componentes
	◦	Memoización de funciones costosas
	◦	Optimización de consultas de base de datos
Configuración Adicional
Variables de Entorno
Para producción, considera crear un archivo .env en el backend con:
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
Base de Datos
El proyecto usa SQLite por defecto. Para usar PostgreSQL o MySQL:
	1	Instala el driver correspondiente: pip install psycopg2-binary  # Para PostgreSQL
	2	# o
	3	pip install mysqlclient      # Para MySQL
	4	
	5	Actualiza la configuración en backend/BackWeb/settings.py
URLs Importantes
Frontend (http://localhost:5173)
	•	Login: /login
	•	Dashboard: / (redirige a clientes)
	•	Gestión de Clientes: /clientes
	•	Gestión de Productos: /productos
	•	Sistema de Ventas: /ventas
	•	Informes: /informes
	•	Gestión de Usuarios: /usuarios
	•	Pruebas de API: /test-api
Backend (http://localhost:8000)
	•	API REST: /api/
	•	Admin de Django: /admin/
	•	Documentación API: /api/schema/swagger-ui/ (si está configurado)
Contribución
	1	Fork el proyecto
	2	Crea una rama para tu feature (git checkout -b feature/AmazingFeature)
	3	Commit tus cambios (git commit -m 'Add some AmazingFeature')
	4	Push a la rama (git push origin feature/AmazingFeature)
	5	Abre un Pull Request
Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
Soporte
Si tienes alguna pregunta o problema, por favor abre un issue en el repositorio.

Feliz desarrollo!
