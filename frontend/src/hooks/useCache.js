import { useState, useEffect, useCallback } from 'react';
import { makeAuthenticatedRequest } from '../services/auth';
import cacheService, { CACHE_MODULES, CACHE_TTL } from '../services/cache';

// Hook personalizado para manejar datos con caché
const useCache = (module, endpoint, options = {}) => {
  const {
    ttl = CACHE_TTL.MEDIUM,
    params = {},
    dependencies = [],
    autoFetch = true,
    transform = null // Función para transformar los datos antes de guardarlos
  } = options;

  // Inicializar con datos del cache si están disponibles
  const initialCachedData = cacheService.get(module, params);
  const initialCacheInfo = cacheService.getInfo(module, params);
  
  const [data, setData] = useState(initialCachedData);
  const [loading, setLoading] = useState(!initialCachedData);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(initialCacheInfo?.timestamp || null);
  const [isFromCache, setIsFromCache] = useState(!!initialCachedData);

  // Función para obtener datos del caché o de la API
  const fetchData = useCallback(async (forceRefresh = false, backgroundUpdate = false) => {
    try {
      // Solo mostrar loading si no es una actualización en background
      if (!backgroundUpdate) {
        setLoading(true);
      }
      setError(null);

      // Intentar obtener del caché primero (si no es refresh forzado)
      if (!forceRefresh) {
        const cachedData = cacheService.get(module, params);
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
          setLoading(false);
          setLastFetch(cacheService.getInfo(module, params)?.timestamp || null);
          return cachedData;
        }
      }

      // Si no hay datos en caché o es refresh forzado, hacer petición a la API
      setIsFromCache(false);
      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error al cargar ${module}: ${response.status}`);
      }

      let responseData = await response.json();
      
      // Aplicar transformación si se proporciona
      if (transform && typeof transform === 'function') {
        responseData = transform(responseData);
      }

      // Asegurar que sea un array si se espera uno
      const finalData = Array.isArray(responseData) ? responseData : [responseData];
      
      // Guardar en caché
      cacheService.set(module, finalData, params, ttl);
      
      setData(finalData);
      setLastFetch(Date.now());
      setError(null);
      
      return finalData;
    } catch (err) {
      console.error(`Error en useCache para ${module}:`, err);
      setError(err.message || `Error al cargar ${module}`);
      
      // En caso de error, intentar usar datos del caché como fallback
      const cachedData = cacheService.get(module, params);
      if (cachedData) {
        setData(cachedData);
        setIsFromCache(true);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [module, endpoint, JSON.stringify(params), ttl, transform]);

  // Función para refrescar datos
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Función para limpiar caché del módulo
  const clearCache = useCallback(() => {
    cacheService.clearModule(module);
    setData(null);
    setIsFromCache(false);
    setLastFetch(null);
  }, [module]);

  // Función para agregar un elemento al caché y estado
  const addItem = useCallback((newItem) => {
    setData(prevData => {
      const updatedData = prevData ? [...prevData, newItem] : [newItem];
      cacheService.set(module, updatedData, params, ttl);
      return updatedData;
    });
  }, [module, JSON.stringify(params), ttl]);

  // Función para actualizar un elemento en el caché y estado
  const updateItem = useCallback((updatedItem, idField = 'id') => {
    setData(prevData => {
      if (!prevData) return [updatedItem];
      
      const updatedData = prevData.map(item => 
        item[idField] === updatedItem[idField] ? updatedItem : item
      );
      cacheService.set(module, updatedData, params, ttl);
      return updatedData;
    });
  }, [module, JSON.stringify(params), ttl]);

  // Función para eliminar un elemento del caché y estado
  const removeItem = useCallback((itemId, idField = 'id') => {
    setData(prevData => {
      if (!prevData) return [];
      
      const updatedData = prevData.filter(item => item[idField] !== itemId);
      cacheService.set(module, updatedData, params, ttl);
      return updatedData;
    });
  }, [module, JSON.stringify(params), ttl]);

  // Efecto para cargar datos inicialmente
  useEffect(() => {
    if (autoFetch) {
      // Si ya tenemos datos del cache, hacer fetch en background sin loading
       if (initialCachedData) {
         // Fetch en background para actualizar datos
         fetchData(false, true).catch(console.error);
       } else {
         // No hay cache, hacer fetch normal
         fetchData();
       }
    }
  }, [module, endpoint, JSON.stringify(params), autoFetch, ...dependencies]);

  // Información del caché
  const cacheInfo = cacheService.getInfo(module, params);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    addItem,
    updateItem,
    removeItem,
    isFromCache,
    lastFetch,
    cacheInfo,
    fetchData
  };
};

export default useCache;

// Hooks específicos para cada módulo
export const useClientesCache = (options = {}) => {
  return useCache(CACHE_MODULES.CLIENTES, '/clientes/', {
    ttl: CACHE_TTL.MEDIUM,
    ...options
  });
};

export const useProductosCache = (options = {}) => {
  return useCache(CACHE_MODULES.PRODUCTOS, '/productos/', {
    ttl: CACHE_TTL.MEDIUM,
    ...options
  });
};

export const useUsuariosCache = (options = {}) => {
  return useCache(CACHE_MODULES.USUARIOS, '/usuarios/', {
    ttl: CACHE_TTL.MEDIUM,
    ...options
  });
};

export const useCategoriasCache = (options = {}) => {
  return useCache(CACHE_MODULES.CATEGORIAS, '/categorias/', {
    ttl: CACHE_TTL.LONG, // Las categorías cambian menos frecuentemente
    ...options
  });
};