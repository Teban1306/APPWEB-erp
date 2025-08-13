# Frontend - Sistema de Gestión Comercial

## 🆕 **VERSIÓN 2.0.0 - NUEVAS CARACTERÍSTICAS**

### ✨ **NOVEDADES:**
- 🖼️ **Cloudinary Integration** - Gestión profesional de imágenes
- 🎨 **Framer Motion** - Animaciones fluidas y profesionales
- 🔐 **Sistema de roles** - Control granular de permisos
- 📱 **UI/UX mejorada** - Interfaz más intuitiva y responsiva
- 🛡️ **Validaciones avanzadas** - Mayor seguridad en formularios

---

## Requisitos Previos
- Node.js (versión 18 o superior)
- pnpm (versión 8 o superior)

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd frontend
```

2. Instalar dependencias:
```bash
pnpm install
```

## Dependencias Principales

### Producción
- **React v19.1.0** - Biblioteca principal para la interfaz de usuario
- **React Router DOM v7.6.3** - Manejo de rutas y navegación
- **Headless UI v2.2.4** - Componentes de UI accesibles
- **Lucide React v0.525.0** - Iconos SVG modernos
- **Supabase JS v2.39.3** - Cliente para base de datos
- **Axios v1.6.7** - Cliente HTTP para peticiones API
- **Framer Motion** - Animaciones fluidas y profesionales
- 🆕 **@cloudinary/react 1.13.0** - Componentes React para Cloudinary
- 🆕 **@cloudinary/url-gen 1.20.0** - Generación de URLs optimizadas
- 🆕 **sha.js 2.4.11** - Funciones de hash criptográficas

### Desarrollo
- Vite v7.0.0
- Tailwind CSS v3.4.1
- PostCSS v8.4.35
- Autoprefixer v10.4.17
- ESLint v9.29.0

## Configuración

1. Configurar variables de entorno:
- Crear archivo `.env` basado en `.env.example`
- Configurar las variables necesarias

2. Iniciar servidor de desarrollo:
```bash
pnpm run dev
```

3. Construir para producción:
```bash
pnpm run build
```

## Estructura del Proyecto

```
src/
  ├── assets/      # Recursos estáticos
  ├── components/  # Componentes reutilizables
  ├── pages/       # Páginas de la aplicación
  ├── App.jsx      # Componente principal
  └── main.jsx     # Punto de entrada
```

## Convenciones de Código

- Usar nombres descriptivos en español para componentes y funciones
- Seguir principios de diseño responsivo
- Mantener componentes pequeños y reutilizables
- Documentar funciones y componentes complejos

## 🆕 **NUEVAS IMPLEMENTACIONES - V2.0.0**

### 🎨 **Framer Motion**
- ✨ Animaciones fluidas y profesionales
- 🔄 Transiciones suaves entre páginas
- 📱 Efectos de entrada y salida optimizados
- 🎭 Animaciones de carga y estados

### 🖼️ **Cloudinary Integration**
- 📤 Subida directa de imágenes desde el frontend
- 🔧 Transformaciones automáticas de imágenes
- 🌐 CDN global para carga rápida
- 🛡️ Validación de archivos del lado cliente
- 📏 Control de tamaños y formatos

### 🔐 **Sistema de Roles Avanzado**
- 👥 Control granular de permisos por usuario
- 🔒 Validación de acceso por componente
- 🎯 Diferentes niveles de autorización
- 🛡️ Protección de rutas sensibles

### 🛠️ **Nuevas Dependencias Técnicas**
- **@cloudinary/react 1.13.0** - Componentes React para Cloudinary
- **@cloudinary/url-gen 1.20.0** - Generación de URLs optimizadas
- **sha.js 2.4.11** - Funciones de hash criptográficas

### 📦 **Instalación de Nuevas Dependencias**
```bash
pnpm add framer-motion
pnpm i @cloudinary/url-gen @cloudinary/react
pnpm install sha.js
```

### 🔧 **Implementación Técnica**
- Añadida animación de entrada para el logo en la página de login
- Uso de motion.div y motion.img para elementos animados
- Configuración de transiciones suaves y efectos spring