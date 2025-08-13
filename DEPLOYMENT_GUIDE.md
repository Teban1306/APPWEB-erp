# 🚀 Guía Completa de Despliegue - APP-WEB

## 📋 Índice
1. [Información del Proyecto](#información-del-proyecto)
2. [Preparación Previa](#preparación-previa)
3. [Despliegue del Backend en Render](#despliegue-del-backend-en-render)
4. [Despliegue del Frontend en Vercel](#despliegue-del-frontend-en-vercel)
5. [Configuración de CORS](#configuración-de-cors)
6. [Variables de Entorno](#variables-de-entorno)
7. [Verificación del Despliegue](#verificación-del-despliegue)
8. [Solución de Problemas](#solución-de-problemas)

---

## 📊 Información del Proyecto

### Stack Tecnológico
- **Backend**: Django 5.2.4 + Django REST Framework + PostgreSQL (Supabase)
- **Frontend**: React 19.1.0 + Vite + Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT con djangorestframework-simplejwt

### Estructura del Proyecto
```
APP-WEB/
├── backend/
│   ├── BackWeb/          # Configuración principal de Django
│   ├── mi_app/           # Aplicación principal
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── DEPLOYMENT_GUIDE.md
```

---

## 🛠️ Preparación Previa

### 1. Verificar Dependencias del Backend
Asegúrate de que `requirements.txt` contenga todas las dependencias necesarias:

```txt
Django==5.2.4
django-cors-headers==4.3.1
psycopg2-binary==2.9.10
python-dotenv==1.0.1
requests==2.31.0
django-environ==0.11.2
djangorestframework==3.14.0
dj-database-url==3.0.1
djangorestframework-simplejwt==5.3.1
Pillow==10.4.0
django-filter==24.3
django-extensions==3.2.3
gunicorn==21.2.0
whitenoise==6.6.0
```

### 2. Configurar Supabase
1. Ve a [Supabase](https://supabase.com) y crea un proyecto
2. Obtén las credenciales:
   - **URL del proyecto**: `https://[tu-proyecto].supabase.co`
   - **Anon Key**: Clave pública para el frontend
   - **Service Role Key**: Clave privada para el backend
   - **Database URL**: URL de conexión PostgreSQL

---

## 🔧 Despliegue del Backend en Render

### Paso 1: Preparar el Proyecto para Render

#### 1.1 Crear archivo `render.yaml` en la raíz del proyecto
```yaml
services:
  - type: web
    name: app-web-backend
    env: python
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && gunicorn BackWeb.wsgi:application"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        fromDatabase:
          name: app-web-db
          property: connectionString
```

#### 1.2 Actualizar `settings.py` para producción
Agregar al final de `backend/BackWeb/settings.py`:

```python
# Configuración para producción
import os

# Configuración de archivos estáticos para Render
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Middleware de WhiteNoise para archivos estáticos
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Configuración de hosts permitidos para producción
if not DEBUG:
    ALLOWED_HOSTS = [
        'app-web-backend.onrender.com',  # Reemplaza con tu URL de Render
        'localhost',
        '127.0.0.1',
    ]

# Configuración de seguridad para producción
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_REDIRECT_EXEMPT = []
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

#### 1.3 Crear archivo `build.sh` en el directorio `backend/`
```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
```

### Paso 2: Configurar en Render

1. **Crear cuenta en Render**: Ve a [render.com](https://render.com)

2. **Conectar repositorio**:
   - Haz clic en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio del proyecto

3. **Configurar el servicio**:
   - **Name**: `app-web-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input`
   - **Start Command**: `cd backend && gunicorn BackWeb.wsgi:application`
   - **Instance Type**: `Free` (o el que prefieras)

4. **Variables de entorno en Render**:
   ```
   DEBUG=False
   SECRET_KEY=tu-secret-key-super-segura-aqui
   DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]
   SUPABASE_URL=https://[tu-proyecto].supabase.co
   SUPABASE_KEY=[tu-service-role-key]
   ALLOWED_HOSTS=app-web-backend.onrender.com,localhost,127.0.0.1
   ```

### Paso 3: Configurar Base de Datos

1. **En Render Dashboard**:
   - Crea un nuevo "PostgreSQL" service
   - Nombre: `app-web-db`
   - Copia la "External Database URL"

2. **O usar Supabase** (Recomendado):
   - Ve a tu proyecto Supabase → Settings → Database
   - Copia la "Connection string" en modo "URI"
   - Formato: `postgresql://postgres:[password]@[host]:5432/postgres`

---

## 🎨 Despliegue del Frontend en Vercel

### Paso 1: Preparar el Frontend

#### 1.1 Actualizar `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@headlessui/react']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
})
```

#### 1.2 Crear archivo `vercel.json` en el directorio `frontend/`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "functions": {},
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### 1.3 Actualizar `package.json` del frontend
Agregar script de build para Vercel:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "vercel-build": "vite build"
  }
}
```

### Paso 2: Configurar en Vercel

1. **Crear cuenta en Vercel**: Ve a [vercel.com](https://vercel.com)

2. **Importar proyecto**:
   - Haz clic en "New Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio

3. **Configurar el proyecto**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Variables de entorno en Vercel**:
   ```
   VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
   VITE_SUPABASE_ANON_KEY=[tu-anon-key]
   VITE_API_URL=https://app-web-backend.onrender.com
   ```

---

## 🔗 Configuración de CORS

### Actualizar CORS en Django
En `backend/BackWeb/settings.py`, actualizar la configuración de CORS:

```python
# Configuración de CORS para producción
CORS_ALLOW_ALL_ORIGINS = False  # Cambiar a False en producción
CORS_ALLOW_CREDENTIALS = True

# URLs permitidas para CORS
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Desarrollo local
    'http://localhost:5174',  # Desarrollo local alternativo
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000',  # React default
    'https://tu-app-frontend.vercel.app',  # Reemplaza con tu URL de Vercel
    'https://tu-dominio-personalizado.com',  # Si tienes dominio personalizado
]

# Métodos HTTP permitidos
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Headers expuestos al frontend
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

# Configuración adicional de seguridad
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 horas
```

---

## 🔐 Variables de Entorno

### Backend (.env en Render)
```env
# Configuración de Django
DEBUG=False
SECRET_KEY=tu-secret-key-super-segura-de-50-caracteres-minimo
ALLOWED_HOSTS=app-web-backend.onrender.com,localhost,127.0.0.1

# Base de datos (Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Supabase
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_KEY=[tu-service-role-key]

# Configuración adicional
PYTHON_VERSION=3.11.0
```

### Frontend (.env en Vercel)
```env
# Supabase (Frontend)
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key]

# API Backend
VITE_API_URL=https://app-web-backend.onrender.com

# Configuración adicional (opcional)
VITE_APP_NAME=APP-WEB
VITE_APP_VERSION=1.0.0
```

### Archivo .env.example actualizado para el backend
```env
# Configuración de Django
DEBUG=True
SECRET_KEY=django-insecure-change-this-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos
DATABASE_URL=postgresql://postgres:password@localhost:5432/app_web_db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

---

## ✅ Verificación del Despliegue

### 1. Verificar Backend
```bash
# Probar la API
curl https://app-web-backend.onrender.com/api/

# Verificar admin de Django
https://app-web-backend.onrender.com/admin/
```

### 2. Verificar Frontend
- Accede a tu URL de Vercel
- Verifica que la aplicación carga correctamente
- Prueba la comunicación con la API
- Verifica que Supabase funciona

### 3. Verificar CORS
```javascript
// En la consola del navegador
fetch('https://app-web-backend.onrender.com/api/')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

---

## 🚨 Solución de Problemas

### Problemas Comunes del Backend

#### Error: "Application failed to start"
```bash
# Verificar logs en Render
# Solución: Revisar variables de entorno y dependencias
```

#### Error: "Static files not found"
```python
# En settings.py, asegurar:
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

#### Error de base de datos
```bash
# Verificar DATABASE_URL
# Ejecutar migraciones manualmente en Render Shell:
python manage.py migrate
```

### Problemas Comunes del Frontend

#### Error: "Build failed"
```bash
# Verificar que todas las dependencias estén en package.json
# Verificar variables de entorno en Vercel
```

#### Error de CORS
```python
# Agregar la URL de Vercel a CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS = [
    'https://tu-app.vercel.app',
]
```

#### Error: "API not reachable"
```javascript
// Verificar VITE_API_URL en variables de entorno
// Asegurar que apunta a la URL correcta de Render
```

### Comandos Útiles

```bash
# Desarrollo local del backend
cd backend
python manage.py runserver

# Desarrollo local del frontend
cd frontend
npm run dev

# Build local del frontend
cd frontend
npm run build

# Verificar build
cd frontend
npm run preview
```

---

## 📝 Notas Importantes

1. **Seguridad**: Nunca expongas las claves privadas (Service Role Key) en el frontend
2. **CORS**: Siempre especifica los dominios exactos en producción
3. **Variables de entorno**: Usa diferentes claves para desarrollo y producción
4. **Monitoreo**: Configura alertas en Render y Vercel para monitorear el estado
5. **Backup**: Configura backups automáticos en Supabase

---

## 🎯 Checklist de Despliegue

### Pre-despliegue
- [ ] Todas las dependencias están en requirements.txt
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Archivos estáticos configurados
- [ ] Base de datos Supabase configurada

### Backend (Render)
- [ ] Servicio web creado
- [ ] Variables de entorno configuradas
- [ ] Build command configurado
- [ ] Start command configurado
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas

### Frontend (Vercel)
- [ ] Proyecto importado
- [ ] Variables de entorno configuradas
- [ ] Build command configurado
- [ ] Output directory configurado
- [ ] Rutas SPA configuradas

### Post-despliegue
- [ ] Backend responde correctamente
- [ ] Frontend carga sin errores
- [ ] API se comunica con frontend
- [ ] Supabase funciona correctamente
- [ ] CORS permite las peticiones
- [ ] Autenticación JWT funciona

---

**¡Listo! Tu aplicación debería estar funcionando perfectamente en producción.** 🎉

*Creado con ❤️ y precisión mecánica por Winry Rockbell* ⚙️