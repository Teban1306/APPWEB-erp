# 🚀 Despliegue Rápido - APP-WEB

## ⚡ Inicio Rápido

### 1. Backend en Render
```bash
# 1. Conecta tu repositorio en render.com
# 2. Configura las variables de entorno:
DEBUG=False
SECRET_KEY=tu-secret-key-aqui
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...

# 3. Build Command:
cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input

# 4. Start Command:
cd backend && gunicorn BackWeb.wsgi:application
```

### 2. Frontend en Vercel
```bash
# 1. Importa el proyecto en vercel.com
# 2. Root Directory: frontend
# 3. Variables de entorno:
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://tu-backend.onrender.com

# 4. Build Command: npm run build
# 5. Output Directory: dist
```

## 🔧 Archivos Importantes Creados

- `render.yaml` - Configuración automática para Render
- `frontend/vercel.json` - Configuración para Vercel
- `backend/build.sh` - Script de build para Render
- `DEPLOYMENT_GUIDE.md` - Guía completa paso a paso

## ⚠️ Importante

1. **Actualizar CORS**: Agrega tu URL de Vercel a `CORS_ALLOWED_ORIGINS` en `settings.py`
2. **Variables de entorno**: Nunca commitees archivos `.env` reales
3. **Secret Key**: Genera una nueva para producción
4. **HTTPS**: Descomenta las configuraciones SSL en `settings.py` si usas HTTPS

## 🆘 Problemas Comunes

- **Error 500**: Revisa las variables de entorno
- **CORS Error**: Verifica `CORS_ALLOWED_ORIGINS`
- **Static files**: Asegúrate de que `whitenoise` esté instalado
- **Database**: Verifica la `DATABASE_URL`

## 📞 Soporte

Consulta `DEPLOYMENT_GUIDE.md` para instrucciones detalladas.