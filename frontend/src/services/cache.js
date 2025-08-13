// Servicio de caché para el frontend

class CacheService {
  constructor() {
    this.cachePrefix = 'app_cache_';
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
  }

  // Generar clave de caché
  generateKey(module, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? '_' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
      : '';
    return `${this.cachePrefix}${module}${paramString}`;
  }

  // Obtener datos del caché
  get(module, params = {}) {
    try {
      const key = this.generateKey(module, params);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Verificar si el caché ha expirado
      if (data.expiry && now > data.expiry) {
        this.remove(module, params);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Error al obtener del caché:', error);
      return null;
    }
  }

  // Guardar datos en el caché
  set(module, data, params = {}, ttl = this.defaultTTL) {
    try {
      const key = this.generateKey(module, params);
      const expiry = ttl ? Date.now() + ttl : null;
      
      const cacheData = {
        value: data,
        expiry,
        timestamp: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  // Eliminar datos específicos del caché
  remove(module, params = {}) {
    try {
      const key = this.generateKey(module, params);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar del caché:', error);
      return false;
    }
  }

  // Limpiar todo el caché del módulo
  clearModule(module) {
    try {
      const keys = Object.keys(localStorage);
      const modulePrefix = `${this.cachePrefix}${module}`;
      
      keys.forEach(key => {
        if (key.startsWith(modulePrefix)) {
          localStorage.removeItem(key);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error al limpiar caché del módulo:', error);
      return false;
    }
  }

  // Limpiar todo el caché de la aplicación
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error al limpiar todo el caché:', error);
      return false;
    }
  }

  // Verificar si existe en caché
  has(module, params = {}) {
    return this.get(module, params) !== null;
  }

  // Obtener información del caché
  getInfo(module, params = {}) {
    try {
      const key = this.generateKey(module, params);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      return {
        timestamp: data.timestamp,
        expiry: data.expiry,
        isExpired: data.expiry ? Date.now() > data.expiry : false,
        size: cached.length
      };
    } catch (error) {
      console.error('Error al obtener info del caché:', error);
      return null;
    }
  }
}

// Instancia singleton del servicio de caché
const cacheService = new CacheService();

export default cacheService;

// Constantes para los módulos
export const CACHE_MODULES = {
  CLIENTES: 'clientes',
  PRODUCTOS: 'productos',
  USUARIOS: 'usuarios',
  CATEGORIAS: 'categorias'
};

// TTL personalizados para diferentes módulos (en milisegundos)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutos
  MEDIUM: 5 * 60 * 1000,   // 5 minutos
  LONG: 15 * 60 * 1000,    // 15 minutos
  VERY_LONG: 60 * 60 * 1000 // 1 hora
};